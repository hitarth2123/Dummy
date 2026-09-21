const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * EthicsFlag Schema
 * Records AI-detected ethics violations with category, severity, and HOD notification tracking.
 */
const ethicsFlagSchema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'student is required'],
    },
    department: {
      type: String,
      required: [true, 'department is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'category is required'],
      enum: {
        values: [
          'academic_dishonesty',
          'plagiarism',
          'harassment',
          'hate_speech',
          'self_harm',
          'misinformation',
          'other',
        ],
        message: 'Invalid ethics category',
      },
    },
    severity: {
      type: String,
      required: [true, 'severity is required'],
      enum: {
        values: ['low', 'medium', 'high', 'critical'],
        message: 'severity must be low, medium, high, or critical',
      },
    },
    description: {
      type: String,
      required: [true, 'description is required'],
      trim: true,
    },
    trigger_content: {
      // The exact content that triggered the flag (redacted if needed)
      type: String,
      trim: true,
    },
    session_ref: {
      type: Schema.Types.ObjectId,
      ref: 'Session',
    },
    audit_log_ref: {
      type: Schema.Types.ObjectId,
      ref: 'AuditLog',
    },
    hod_notified_at: {
      type: Date,
      default: null,
    },
    hod_notification_job_id: {
      type: String,
      default: null,
    },
    hod_notified_by: {
      type: String,
      enum: {
        values: ['email', 'system', null],
        message: 'hod_notified_by must be email or system',
      },
      default: null,
    },
    resolution_status: {
      type: String,
      enum: {
        values: ['open', 'under_review', 'resolved', 'escalated'],
        message: 'resolution_status must be open, under_review, resolved, or escalated',
      },
      default: 'open',
    },
    resolved_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolved_at: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

ethicsFlagSchema.index({ department: 1, severity: 1, resolution_status: 1 });
ethicsFlagSchema.index({ student: 1, createdAt: -1 });

module.exports = mongoose.model('EthicsFlag', ethicsFlagSchema);
