const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * FeedbackForm Schema
 * Weekly student feedback. One submission per student per week (unique constraint).
 */
const ratingSchema = new Schema(
  {
    category: {
      type: String,
      required: [true, 'rating category is required'],
      enum: {
        values: ['teaching_quality', 'content_clarity', 'ai_helpfulness', 'platform_usability', 'overall'],
        message: 'Invalid rating category',
      },
    },
    score: {
      type: Number,
      required: [true, 'rating score is required'],
      min: [1, 'score must be at least 1'],
      max: [5, 'score must be at most 5'],
    },
  },
  { _id: false }
);

const feedbackFormSchema = new Schema(
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
    week_number: {
      // ISO week number 1-53
      type: Number,
      required: [true, 'week_number is required'],
      min: 1,
      max: 53,
    },
    academic_year: {
      type: String,
      required: [true, 'academic_year is required'],
      trim: true,
      match: [/^\d{4}-\d{2}$/, 'academic_year must be in YYYY-YY format e.g. 2024-25'],
    },
    semester: {
      type: Number,
      required: [true, 'semester is required'],
      min: 1,
      max: 8,
    },
    ratings: {
      type: [ratingSchema],
      required: [true, 'ratings is required'],
      validate: {
        validator: (arr) => arr.length > 0,
        message: 'ratings must contain at least one entry',
      },
    },
    comments: {
      type: String,
      trim: true,
      default: '',
    },
    subjects_covered: {
      type: [String],
      default: [],
    },
    is_submitted: {
      type: Boolean,
      default: false,
    },
    submitted_at: {
      type: Date,
      default: null,
    },
    reminder_sent_at: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Unique: one feedback per student per week per academic year
feedbackFormSchema.index(
  { student: 1, week_number: 1, academic_year: 1 },
  { unique: true }
);
feedbackFormSchema.index({ department: 1, week_number: 1 });

module.exports = mongoose.model('FeedbackForm', feedbackFormSchema);
