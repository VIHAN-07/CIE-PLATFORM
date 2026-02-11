// ==========================================
// Activity Controller — CRUD + Lock/Unlock + Audit
// ==========================================

const Activity = require('../models/Activity');
const ActivityRubric = require('../models/ActivityRubric');
const ActivityTemplate = require('../models/ActivityTemplate');
const Subject = require('../models/Subject');
const Score = require('../models/Score');
const Student = require('../models/Student');
const audit = require('../services/auditService');
const { recomputeSubjectResults } = require('../services/scoringEngine');
const logger = require('../services/logger');

/** GET /api/activities */
exports.getAll = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.subject) filter.subject = req.query.subject;

    // Faculty only sees own activities
    if (req.user.role === 'faculty') {
      filter.faculty = req.user._id;
    }

    const activities = await Activity.find(filter)
      .populate('subject', 'name code')
      .populate('faculty', 'name email')
      .sort('-createdAt');
    res.json(activities);
  } catch (err) {
    next(err);
  }
};

/** GET /api/activities/:id */
exports.getById = async (req, res, next) => {
  try {
    const activity = await Activity.findById(req.params.id)
      .populate('subject', 'name code')
      .populate('faculty', 'name email');
    if (!activity) return res.status(404).json({ success: false, message: 'Activity not found.' });

    if (req.user.role === 'faculty' && activity.faculty._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const rubrics = await ActivityRubric.find({ activity: activity._id }).sort('order');
    res.json({ activity, rubrics });
  } catch (err) {
    next(err);
  }
};

/** POST /api/activities */
exports.create = async (req, res, next) => {
  try {
    const { name, activityType, subject, totalMarks, topic, guidelines } = req.body;

    // Verify faculty owns the subject
    const subjectDoc = await Subject.findById(subject);
    if (!subjectDoc) return res.status(404).json({ success: false, message: 'Subject not found.' });
    if (req.user.role === 'faculty' && subjectDoc.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You are not assigned to this subject.' });
    }

    const activity = await Activity.create({
      name,
      activityType,
      subject,
      faculty: req.user._id,
      totalMarks,
      topic,
      guidelines,
    });

    // Auto-copy rubrics from template
    const template = await ActivityTemplate.findOne({ activityType });
    if (template && template.defaultRubrics.length > 0) {
      const rubricDocs = template.defaultRubrics.map((r, idx) => ({
        activity: activity._id,
        name: r.name,
        criteria: r.criteria,
        order: idx,
      }));
      await ActivityRubric.insertMany(rubricDocs);
    }

    audit.log({
      req,
      action: 'ACTIVITY_CREATE',
      entityType: 'Activity',
      entityId: activity._id,
      description: `Activity created: ${name} (${activityType})`,
      newValue: { name, activityType, subject, totalMarks },
    });

    res.status(201).json(activity);
  } catch (err) {
    next(err);
  }
};

/** PUT /api/activities/:id */
exports.update = async (req, res, next) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ success: false, message: 'Activity not found.' });

    if (activity.status === 'locked') {
      return res.status(400).json({ success: false, message: 'Activity is locked. Request unlock from admin.' });
    }

    if (req.user.role === 'faculty' && activity.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const previousTotalMarks = activity.totalMarks;
    const previousState = activity.toObject();

    const updated = await Activity.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    // If totalMarks changed, recalculate all subject results
    if (req.body.totalMarks && req.body.totalMarks !== previousTotalMarks) {
      logger.info('TotalMarks changed, triggering recomputation', {
        activityId: activity._id,
        old: previousTotalMarks,
        new: req.body.totalMarks,
      });
      const subject = await Subject.findById(activity.subject);
      if (subject) {
        const students = await Student.find({
          class: subject.class,
          academicYear: subject.academicYear,
        });
        await recomputeSubjectResults(subject._id, students.map((s) => s._id));
      }
    }

    audit.log({
      req,
      action: 'ACTIVITY_UPDATE',
      entityType: 'Activity',
      entityId: activity._id,
      description: `Activity updated: ${activity.name}`,
      previousValue: previousState,
      newValue: updated.toObject(),
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

/** POST /api/activities/:id/submit */
exports.submit = async (req, res, next) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ success: false, message: 'Activity not found.' });

    if (req.user.role === 'faculty' && activity.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    activity.status = 'submitted';
    activity.submittedAt = new Date();
    await activity.save();

    // Lock all rubrics
    await ActivityRubric.updateMany({ activity: activity._id }, { isLocked: true });

    audit.log({
      req,
      action: 'ACTIVITY_SUBMIT',
      entityType: 'Activity',
      entityId: activity._id,
      description: `Activity submitted: ${activity.name}`,
    });

    res.json({ success: true, message: 'Activity submitted and rubrics locked.', activity });
  } catch (err) {
    next(err);
  }
};

/** POST /api/activities/:id/lock */
exports.lock = async (req, res, next) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ success: false, message: 'Activity not found.' });

    activity.status = 'locked';
    activity.lockedAt = new Date();
    await activity.save();

    await ActivityRubric.updateMany({ activity: activity._id }, { isLocked: true });

    audit.log({
      req,
      action: 'ACTIVITY_LOCK',
      entityType: 'Activity',
      entityId: activity._id,
      description: `Activity locked: ${activity.name}`,
    });

    res.json({ success: true, message: 'Activity locked.', activity });
  } catch (err) {
    next(err);
  }
};

/** POST /api/activities/:id/unlock */
exports.unlock = async (req, res, next) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ success: false, message: 'Activity not found.' });

    activity.status = 'draft';
    activity.unlockedBy = req.user._id;
    activity.lockedAt = null;
    await activity.save();

    await ActivityRubric.updateMany({ activity: activity._id }, { isLocked: false });

    audit.log({
      req,
      action: 'ACTIVITY_UNLOCK',
      entityType: 'Activity',
      entityId: activity._id,
      description: `Activity unlocked by ${req.user.name}: ${activity.name}`,
    });

    res.json({ success: true, message: 'Activity unlocked.', activity });
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/activities/:id */
exports.remove = async (req, res, next) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ success: false, message: 'Activity not found.' });

    if (activity.status === 'locked') {
      return res.status(400).json({ success: false, message: 'Cannot delete locked activity.' });
    }

    // Clean up all related data
    const scoreCount = await Score.countDocuments({ activity: activity._id });
    await Score.deleteMany({ activity: activity._id });
    await ActivityRubric.deleteMany({ activity: activity._id });
    await Activity.findByIdAndDelete(req.params.id);

    // Recompute subject results since we removed scores
    if (scoreCount > 0) {
      const subject = await Subject.findById(activity.subject);
      if (subject) {
        const students = await Student.find({
          class: subject.class,
          academicYear: subject.academicYear,
        });
        await recomputeSubjectResults(subject._id, students.map((s) => s._id));
      }
    }

    audit.log({
      req,
      action: 'ACTIVITY_DELETE',
      entityType: 'Activity',
      entityId: req.params.id,
      description: `Activity deleted: ${activity.name} (${scoreCount} scores cleaned)`,
    });

    res.json({ success: true, message: 'Activity, rubrics, and scores deleted.' });
  } catch (err) {
    next(err);
  }
};
