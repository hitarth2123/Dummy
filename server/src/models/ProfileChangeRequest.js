const mongoose = require('mongoose');

const { Schema } = mongoose;

const profileChangeRequestSchema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    change_field: {
      type: String,
      enum: ['name', 'email', 'department', 'course', 'semester', 'specialization'],
      required: [true, 'change field is required'],
    },
    proposed_value: {
      type: String,
      required: [true, 'proposed value is required'],
      trim: true,
      maxlength: [500, 'proposed value must be at most 500 characters'],
    },
    requested_changes: {
      type: String,
      required: [true, 'requested changes are required'],
      trim: true,
      maxlength: [2000, 'requested changes must be at most 2000 characters'],
    },
    reason: {
      type: String,
      required: [true, 'reason is required'],
      trim: true,
      maxlength: [2000, 'reason must be at most 2000 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reviewed_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewed_at: {
      type: Date,
      default: null,
    },
    review_notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'review notes must be at most 1000 characters'],
      default: '',
    },
  },
  { timestamps: true }
);

profileChangeRequestSchema.index({ department: 1, status: 1, createdAt: -1 });
profileChangeRequestSchema.index({ student: 1, createdAt: -1 });

module.exports = mongoose.model('ProfileChangeRequest', profileChangeRequestSchema);
