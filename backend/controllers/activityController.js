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
const DEFAULT_RUBRICS = require('../config/defaultRubrics');

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
    const { name, activityType, subjectName, classId, academicYearId, totalMarks, topic, guidelines } = req.body;

    // Find or create subject by name for this faculty/class/year
    let subjectDoc = await Subject.findOne({
      name: { $regex: new RegExp(`^${subjectName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      class: classId,
      academicYear: academicYearId,
    });

    if (!subjectDoc) {
      // Auto-create subject with a generated code
      const code = subjectName.replace(/[^A-Za-z0-9]/g, '').substring(0, 8).toUpperCase() || 'SUBJ';
      subjectDoc = await Subject.create({
        name: subjectName,
        code,
        class: classId,
        academicYear: academicYearId,
        faculty: req.user._id,
      });
    }

    const activity = await Activity.create({
      name,
      activityType,
      subject: subjectDoc._id,
      faculty: req.user._id,
      totalMarks,
      topic,
      guidelines,
    });

    // Auto-copy rubrics from template or use built-in defaults
    const template = await ActivityTemplate.findOne({ activityType });
    let rubricSource = template?.defaultRubrics;

    // Fallback to built-in default rubrics if no template exists
    if (!rubricSource || rubricSource.length === 0) {
      rubricSource = DEFAULT_RUBRICS[activityType] || DEFAULT_RUBRICS['Other'] || [];
    }

    if (rubricSource.length > 0) {
      const rubricDocs = rubricSource.map((r, idx) => ({
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
      newValue: { name, activityType, subject: subjectDoc._id, totalMarks },
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

    // Faculty can only lock their own activities
    if (req.user.role === 'faculty' && activity.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied. You can only lock your own activities.' });
    }

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

    // Only admin or the owning faculty can unlock
    if (req.user.role === 'faculty' && activity.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied. You can only unlock your own activities.' });
    }

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
