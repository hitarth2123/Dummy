const { getAvailability, isAvailable, getFeatureBlock } = require('../services/aiAvailability.service');

const requireAiFeature = (feature) => async (req, res, next) => {
  try {
    const availability = await getAvailability();
    if (!isAvailable(availability, feature)) return res.status(503).json({ success: false, code: 'AI_FEATURE_UNAVAILABLE', data: getFeatureBlock(availability, feature) });
    req.aiAvailability = availability;
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = { requireAiFeature };
