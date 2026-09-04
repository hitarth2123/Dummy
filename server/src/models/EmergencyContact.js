const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * EmergencyContact Schema
 * Hospital, police, fire, and other emergency contacts per campus.
 */
const contactEntrySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'contact name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'contact phone is required'],
      trim: true,
    },
    alternate_phone: {
      type: String,
      trim: true,
      default: null,
    },
    address: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true }
);

const emergencyContactSchema = new Schema(
  {
    campus: {
      type: String,
      required: [true, 'campus is required'],
      trim: true,
    },
    department: {
      // null = applies to entire campus
      type: String,
      trim: true,
      default: null,
    },
    hospital: {
      type: [contactEntrySchema],
      default: [],
    },
    police: {
      type: [contactEntrySchema],
      default: [],
    },
    fire: {
      type: [contactEntrySchema],
      default: [],
    },
    ambulance: {
      type: [contactEntrySchema],
      default: [],
    },
    mental_health: {
      type: [contactEntrySchema],
      default: [],
    },
    other: {
      type: [contactEntrySchema],
      default: [],
    },
    updated_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

emergencyContactSchema.index({ campus: 1 });

module.exports = mongoose.model('EmergencyContact', emergencyContactSchema);
