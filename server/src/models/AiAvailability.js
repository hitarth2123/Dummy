const mongoose = require('mongoose');

const featureSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: true },
  resume_at: { type: Date, default: null },
  message: { type: String, trim: true, default: '' },
}, { _id: false });

const aiAvailabilitySchema = new mongoose.Schema({
  key: { type: String, unique: true, default: 'global' },
  ai_enabled: { type: Boolean, default: true },
  ai_resume_at: { type: Date, default: null },
  ai_message: { type: String, trim: true, default: '' },
  features: {
    mock_test: { type: featureSchema, default: () => ({}) },
    learning_path: { type: featureSchema, default: () => ({}) },
    question_bank: { type: featureSchema, default: () => ({}) },
    practice_mcq: { type: featureSchema, default: () => ({}) },
    private_forum: { type: featureSchema, default: () => ({}) },
    booking_session: { type: featureSchema, default: () => ({}) },
    tutor_education: { type: featureSchema, default: () => ({}) },
  },
  updated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

module.exports = mongoose.model('AiAvailability', aiAvailabilitySchema);
