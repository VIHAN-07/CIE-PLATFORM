// ==========================================
// Activity Template — Admin-defined rubric templates
// ==========================================

const mongoose = require('mongoose');

const templateRubricSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  criteria: {
    scale1: { type: String, default: '' },
    scale2: { type: String, default: '' },
    scale3: { type: String, default: '' },
    scale4: { type: String, default: '' },
    scale5: { type: String, default: '' },
  },
});

const activityTemplateSchema = new mongoose.Schema(
  {
    activityType: {
      type: String,
      required: [true, 'Activity type is required'],
      trim: true,
      // e.g. "PPT", "Flip Classroom", "GD", "Viva", "Lab"
    },
    description: {
      type: String,
      default: '',
    },
    defaultRubrics: [templateRubricSchema],
    guidelines: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

activityTemplateSchema.index({ activityType: 1 }, { unique: true });

module.exports = mongoose.model('ActivityTemplate', activityTemplateSchema);
