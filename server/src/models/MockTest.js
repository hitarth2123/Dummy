const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * MockTest Schema
 * Full mock test record with questions, answers, score, and topic breakdown.
 */
const attemptedAnswerSchema = new Schema(
  {
    question: {
      type: Schema.Types.ObjectId,
      ref: 'QuestionBank',
      required: [true, 'question is required'],
    },
    selected_answer: {
      type: String,
      enum: {
        values: ['A', 'B', 'C', 'D', null],
        message: 'selected_answer must be A, B, C, D, or null',
      },
      default: null,
    },
    correct_answer: {
      type: String,
      required: [true, 'correct_answer is required'],
      enum: { values: ['A', 'B', 'C', 'D'], message: 'correct_answer must be A, B, C, or D' },
    },
    is_correct: {
      type: Boolean,
      required: [true, 'is_correct is required'],
    },
    time_taken_sec: {
      type: Number,
      default: 0,
    },
    topic: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const topicBreakdownSchema = new Schema(
  {
    topic: { type: String, required: true },
    correct: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    score_pct: { type: Number, default: 0 },
  },
  { _id: false }
);

const mockTestSchema = new Schema(
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
    subject: {
      type: String,
      required: [true, 'subject is required'],
      trim: true,
    },
    semester: {
      type: Number,
      required: [true, 'semester is required'],
      min: 1,
      max: 8,
    },
    questions: {
      type: [attemptedAnswerSchema],
      default: [],
    },
    score: {
      type: Number,
      required: [true, 'score is required'],
      min: 0,
    },
    total_questions: {
      type: Number,
      required: [true, 'total_questions is required'],
      min: 1,
    },
    score_pct: {
      type: Number,
      min: 0,
      max: 100,
    },
    topic_breakdown: {
      type: [topicBreakdownSchema],
      default: [],
    },
    time_taken_sec: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      required: [true, 'status is required'],
      enum: {
        values: ['in_progress', 'completed', 'abandoned'],
        message: 'status must be in_progress, completed, or abandoned',
      },
      default: 'in_progress',
    },
    started_at: {
      type: Date,
      default: Date.now,
    },
    submitted_at: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

mockTestSchema.index({ student: 1, subject: 1, status: 1 });

module.exports = mongoose.model('MockTest', mockTestSchema);
