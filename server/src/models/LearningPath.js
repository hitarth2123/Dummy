const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * LearningPath Schema
 * Ordered topic array per student with completion tracking.
 */
const topicProgressSchema = new Schema(
  {
    topic: {
      type: String,
      required: [true, 'topic is required'],
      trim: true,
    },
    subject: {
      type: String,
      required: [true, 'subject is required'],
      trim: true,
    },
    order: {
      type: Number,
      required: [true, 'order is required'],
    },
    status: {
      type: String,
      required: [true, 'status is required'],
      enum: {
        values: ['pending', 'in_progress', 'completed'],
        message: 'status must be pending, in_progress, or completed',
      },
      default: 'pending',
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    completed_at: {
      type: Date,
      default: null,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    reading_material: {
      type: String,
      trim: true,
      default: '',
    },
    key_concepts: {
      type: [String],
      default: [],
    },
    exercises: {
      type: [Schema.Types.Mixed],
      default: [],
    },
    estimated_minutes: {
      type: Number,
      default: 30,
    },
  },
  { _id: false }
);

const learningPathSchema = new Schema(
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
    topics: {
      type: [topicProgressSchema],
      default: [],
    },
    overall_progress_pct: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    generated_by: {
      type: String,
      enum: {
        values: ['ai', 'faculty', 'system'],
        message: 'generated_by must be ai, faculty, or system',
      },
      default: 'ai',
    },
    version: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

learningPathSchema.index({ student: 1, subject: 1 });

module.exports = mongoose.model('LearningPath', learningPathSchema);
