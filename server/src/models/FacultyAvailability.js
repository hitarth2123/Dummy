const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * FacultyAvailability Schema
 * Faculty-defined time slots and global availability toggle.
 */
const slotSchema = new Schema(
  {
    day_of_week: {
      type: String,
      required: [true, 'day_of_week is required'],
      enum: {
        values: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        message: 'Invalid day_of_week',
      },
    },
    start_time: {
      // 24h format string e.g. "09:00"
      type: String,
      required: [true, 'start_time is required'],
      match: [/^\d{2}:\d{2}$/, 'start_time must be in HH:MM format'],
    },
    end_time: {
      type: String,
      required: [true, 'end_time is required'],
      match: [/^\d{2}:\d{2}$/, 'end_time must be in HH:MM format'],
    },
    is_booked: {
      type: Boolean,
      default: false,
    },
    booked_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { _id: true }
);

const facultyAvailabilitySchema = new Schema(
  {
    faculty: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'faculty is required'],
      unique: true,
    },
    department: {
      type: String,
      required: [true, 'department is required'],
      trim: true,
    },
    is_available: {
      type: Boolean,
      default: true,
    },
    slots: {
      type: [slotSchema],
      default: [],
    },
    max_sessions_per_week: {
      type: Number,
      default: 5,
      min: 0,
    },
    unavailable_dates: {
      // Specific dates faculty is unavailable (holidays, leaves)
      type: [Date],
      default: [],
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

facultyAvailabilitySchema.index({ department: 1, is_available: 1 });

module.exports = mongoose.model('FacultyAvailability', facultyAvailabilitySchema);
