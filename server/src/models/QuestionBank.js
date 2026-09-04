const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * QuestionBank Schema
 * MCQ questions tagged by department, subject, topic, year, and difficulty.
 */
const optionSchema = new Schema(
  {
    label: {
      type: String,
      required: [true, 'option label is required'],
      enum: {
        values: ['A', 'B', 'C', 'D'],
        message: 'option label must be A, B, C, or D',
      },
    },
    text: {
      type: String,
      required: [true, 'option text is required'],
      trim: true,
    },
  },
  { _id: false }
);

const questionBankSchema = new Schema(
  {
    question_text: {
      type: String,
      required: [true, 'question_text is required'],
      trim: true,
    },
    options: {
      type: [optionSchema],
      required: [true, 'options is required'],
      validate: {
        validator: (arr) => arr.length === 4,
        message: 'options must have exactly 4 entries',
      },
    },
    correct_answer: {
      type: String,
      required: [true, 'correct_answer is required'],
      enum: {
        values: ['A', 'B', 'C', 'D'],
        message: 'correct_answer must be A, B, C, or D',
      },
    },
    explanation: {
      type: String,
      trim: true,
      default: '',
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
      required: [true, 'topic is required'],
      trim: true,
    },
    year: {
      type: Number,
      required: [true, 'year is required'],
      min: [2000, 'year must be >= 2000'],
    },
    difficulty: {
      type: String,
      required: [true, 'difficulty is required'],
      enum: {
        values: ['easy', 'medium', 'hard'],
        message: 'difficulty must be easy, medium, or hard',
      },
    },
    source: {
      type: String,
      trim: true,
      default: 'manual',
    },
    is_verified: {
      type: Boolean,
      default: false,
    },
    created_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

questionBankSchema.index({ department: 1, subject: 1, topic: 1 });
questionBankSchema.index({ difficulty: 1 });
questionBankSchema.index({ year: 1 });

module.exports = mongoose.model('QuestionBank', questionBankSchema);
