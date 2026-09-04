const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * DoubtSession Schema
 * Student–faculty doubt-clearing session: booking, meeting link, status lifecycle.
 */
const doubtSessionSchema = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'student is required'],
    },
    faculty: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'faculty is required'],
    },
    department: {
      type: String,
      required: [true, 'department is required'],
      trim: true,
    },
    subject: {
      type: String,
      required: [true, 'subject is required'],
      trim: true,
    },
    topic: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      required: [true, 'description is required'],
    },
    scheduled_at: {
      type: Date,
      required: [true, 'scheduled_at is required'],
    },
    duration_minutes: {
      type: Number,
      default: 30,
      min: [15, 'duration_minutes must be at least 15'],
      max: [120, 'duration_minutes must be at most 120'],
    },
    meeting_link: {
      type: String,
      trim: true,
      default: null,
    },
    meeting_platform: {
      type: String,
      enum: {
        values: ['google_meet', 'zoom', 'ms_teams', 'other', null],
        message: 'Invalid meeting platform',
      },
      default: null,
    },
    status: {
      type: String,
      required: [true, 'status is required'],
      enum: {
        values: ['pending', 'confirmed', 'declined', 'completed', 'cancelled', 'no_show'],
        message: 'Invalid session status',
      },
      default: 'pending',
    },
    decline_reason: {
      type: String,
      trim: true,
      default: null,
    },
    faculty_notes: {
      type: String,
      trim: true,
      default: '',
    },
    student_feedback_rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    student_feedback_text: {
      type: String,
      trim: true,
      default: '',
    },
    confirmed_at: {
      type: Date,
      default: null,
    },
    completed_at: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

doubtSessionSchema.index({ student: 1, status: 1 });
doubtSessionSchema.index({ faculty: 1, scheduled_at: 1 });
doubtSessionSchema.index({ department: 1, scheduled_at: 1 });

module.exports = mongoose.model('DoubtSession', doubtSessionSchema);
