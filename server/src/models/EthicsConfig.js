const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * EthicsConfig Schema
 * Versioned, per-department configuration of prohibited categories and thresholds.
 */
const ethicsConfigSchema = new Schema(
  {
    department: {
      type: String,
      required: [true, 'department is required'],
      trim: true,
    },
    version: {
      type: Number,
      required: [true, 'version is required'],
      min: 1,
      default: 1,
    },
    prohibited_categories: {
      type: [String],
      required: [true, 'prohibited_categories is required'],
      validate: {
        validator: (arr) => arr.length > 0,
        message: 'prohibited_categories must contain at least one category',
      },
    },
    severity_thresholds: {
      low: { type: Number, default: 1 },
      medium: { type: Number, default: 3 },
      high: { type: Number, default: 5 },
      critical: { type: Number, default: 7 },
    },
    auto_escalate_severity: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high', 'critical'],
        message: 'auto_escalate_severity must be low, medium, high, or critical',
      },
      default: 'high',
    },
    hod_email_on_severity: {
      type: [String],
      default: ['high', 'critical'],
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    created_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'created_by is required'],
    },
  },
  { timestamps: true }
);

// Only one active config per department at a time
ethicsConfigSchema.index({ department: 1, version: -1 });
ethicsConfigSchema.index({ department: 1, is_active: 1 });

module.exports = mongoose.model('EthicsConfig', ethicsConfigSchema);
