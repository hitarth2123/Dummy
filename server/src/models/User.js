const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * User Schema
 * Supports role discriminator: student | faculty | hod | admin
 * Stores enrolled_subjects and weak_topics for students.
 */
const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    institution_id: {
      type: String,
      trim: true,
    },
    password_hash: {
      type: String,
      required: [true, 'password_hash is required'],
    },
    role: {
      type: String,
      required: [true, 'role is required'],
      enum: {
        values: ['student', 'faculty', 'hod', 'admin'],
        message: 'role must be one of: student, faculty, hod, admin',
      },
    },
    department: {
      type: String,
      required: [true, 'department is required'],
      trim: true,
    },
    course: {
      type: String,
      default: 'B.Tech',
      trim: true,
    },
    // Student-specific fields
    enrolled_subjects: {
      type: [String],
      default: [],
    },
    weak_topics: {
      type: [String],
      default: [],
    },
    semester: {
      type: Number,
      min: 1,
      max: 8,
    },
    specialization: {
      type: String,
      default: 'Common Core',
      trim: true,
    },
    // Faculty / HOD specific
    subject_expertise: {
      type: [String],
      default: [],
    },
    // Bookmarked question bank questions
    bookmarked_questions: {
      type: [{ type: Schema.Types.ObjectId, ref: 'QuestionBank' }],
      default: [],
    },
    // Learning path manual refresh rate-limit
    last_learning_path_refresh: {
      type: Date,
      default: null,
    },
    // Account status
    is_active: {
      type: Boolean,
      default: true,
    },
    token_version: {
      type: Number,
      default: 0,
      min: 0,
    },
    email_unsubscribed: {
      type: Boolean,
      default: false,
    },
    feedback_due: {
      type: Boolean,
      default: false,
    },
    last_login: {
      type: Date,
    },
    // Lockout support
    failed_login_attempts: {
      type: Number,
      default: 0,
    },
    lockout_until: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Index for fast role + department queries
userSchema.index({ role: 1, department: 1 });

module.exports = mongoose.model('User', userSchema);
