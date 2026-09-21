const mongoose = require('mongoose');
const crypto = require('crypto');

const { Schema } = mongoose;

/**
 * Grievance Schema
 * Formal grievance with a unique reference number and lifecycle status.
 */
const grievanceSchema = new Schema(
  {
    reference_number: {
      type: String,
      unique: true,
      // Auto-generated on first save if not provided
    },
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
          'academic',
          'infrastructure',
          'faculty_conduct',
          'administration',
          'ragging',
          'discrimination',
          'other',
        ],
        message: 'Invalid grievance category',
      },
    },
    subject: {
      type: String,
      required: [true, 'subject is required'],
      trim: true,
      maxlength: [300, 'subject must be at most 300 characters'],
    },
    description: {
      type: String,
      required: [true, 'description is required'],
      trim: true,
    },
    status: {
      type: String,
      required: [true, 'status is required'],
      enum: {
        values: ['submitted', 'acknowledged', 'under_review', 'resolved', 'closed', 'escalated'],
        message: 'Invalid grievance status',
      },
      default: 'submitted',
    },
    assigned_to: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    forum_post_ref: {
      type: Schema.Types.ObjectId,
      ref: 'ForumPost',
      default: null,
    },
    is_anonymous: {
      type: Boolean,
      default: false,
    },
    resolution_notes: {
      type: String,
      trim: true,
      default: '',
    },
    resolved_at: {
      type: Date,
      default: null,
    },
    escalated_at: {
      type: Date,
      default: null,
    },
    timeline: [
      {
        status: String,
        changed_by: { type: Schema.Types.ObjectId, ref: 'User' },
        note: String,
        changed_at: { type: Date, default: Date.now },
        _id: false,
      },
    ],
  },
  { timestamps: true }
);

// Auto-generate reference number
grievanceSchema.pre('save', function generateRef(next) {
  if (this.isNew && !this.reference_number) {
    const stamp = Date.now().toString(36).toUpperCase();
    const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
    this.reference_number = `GRV-${stamp}-${rand}`;
  }
  next();
});

grievanceSchema.index({ student: 1, status: 1 });
grievanceSchema.index({ department: 1, status: 1 });

module.exports = mongoose.model('Grievance', grievanceSchema);
