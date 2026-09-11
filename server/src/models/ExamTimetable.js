const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * ExamTimetable Schema
 * Stores exam schedules with pre-computed lockout_start and lockout_end windows.
 * lockout_start and lockout_end are INDEXED for efficient cron query performance.
 */
const examTimetableSchema = new Schema(
  {
    department: {
      type: String,
      required: [true, 'department is required'],
      trim: true,
    },
    semester: {
      type: Number,
      required: [true, 'semester is required'],
      min: 1,
      max: 8,
    },
    academic_year: {
      type: String,
      required: [true, 'academic_year is required'],
      trim: true,
      match: [/^\d{4}-\d{2}$/, 'academic_year must be in YYYY-YY format'],
    },
    exam_type: {
      type: String,
      required: [true, 'exam_type is required'],
      enum: {
        values: ['mid_sem', 'end_sem', 'internal', 'practical', 'viva'],
        message: 'Invalid exam_type',
      },
    },
    subject: {
      type: String,
      required: [true, 'subject is required'],
      trim: true,
    },
    subject_code: {
      type: String,
      trim: true,
    },
    exam_date: {
      type: Date,
      required: [true, 'exam_date is required'],
    },
    start_time: {
      type: String,
      required: [true, 'start_time is required'],
      match: [/^\d{2}:\d{2}$/, 'start_time must be in HH:MM format'],
    },
    end_time: {
      type: String,
      required: [true, 'end_time is required'],
      match: [/^\d{2}:\d{2}$/, 'end_time must be in HH:MM format'],
    },
    venue: {
      type: String,
      trim: true,
    },
    // Pre-computed lockout window for cron queries
    lockout_start: {
      type: Date,
      required: [true, 'lockout_start is required'],
    },
    lockout_end: {
      type: Date,
      required: [true, 'lockout_end is required'],
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    created_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Performance indexes for cron queries on lockout windows
examTimetableSchema.index({ lockout_start: 1 });
examTimetableSchema.index({ lockout_end: 1 });
examTimetableSchema.index({ department: 1, semester: 1, exam_date: 1 });
examTimetableSchema.index({ department: 1, lockout_start: 1, lockout_end: 1 });

module.exports = mongoose.model('ExamTimetable', examTimetableSchema);
