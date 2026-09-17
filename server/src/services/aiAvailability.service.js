const AiAvailability = require('../models/AiAvailability');

const FEATURE_LABELS = {
  mock_test: 'Mock tests',
  learning_path: 'Learning paths',
  question_bank: 'Question bank',
  practice_mcq: 'Practice MCQs',
  private_forum: 'Private forum',
  booking_session: 'Session booking',
  tutor_education: 'Tutor education answers',
};

const defaults = () => ({
  key: 'global',
  ai_enabled: true,
  ai_resume_at: null,
  ai_message: '',
  features: Object.fromEntries(Object.keys(FEATURE_LABELS).map((key) => [key, { enabled: true, resume_at: null, message: '' }])),
});

const getAvailability = async () => {
  let availability = await AiAvailability.findOne({ key: 'global' }).lean();
  if (!availability) availability = await AiAvailability.create(defaults());
  return availability;
};

const isAvailable = (availability, feature) => {
  const selected = availability.features?.[feature];
  if (availability.ai_enabled === false || selected?.enabled === false) return false;
  return true;
};

const getFeatureBlock = (availability, feature) => {
  const selected = availability.features?.[feature] || {};
  const resumeAt = selected.resume_at || availability.ai_resume_at;
  return {
    feature,
    feature_label: FEATURE_LABELS[feature] || feature,
    resume_at: resumeAt,
    message: selected.message || availability.ai_message || `${FEATURE_LABELS[feature] || 'This feature'} is temporarily unavailable.`,
  };
};

const updateAvailability = async (updates, userId) => {
  const setUpdates = { ...updates, key: 'global', updated_by: userId };
  if (updates.features) {
    delete setUpdates.features;
    Object.entries(updates.features).forEach(([feature, value]) => {
      setUpdates[`features.${feature}`] = value;
    });
  }
  const availability = await AiAvailability.findOneAndUpdate(
    { key: 'global' },
    { $set: setUpdates },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();
  return availability;
};

module.exports = { FEATURE_LABELS, getAvailability, isAvailable, getFeatureBlock, updateAvailability };
