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
    // Faculty / HOD specific
    subject_expertise: {
      type: [String],
      default: [],
    },
    // Account status
    is_active: {
      type: Boolean,
      default: true,
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
