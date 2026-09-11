const AppError = require('../utils/AppError');
const User = require('../models/User');

/**
 * lockout — blocks requests from users whose lockout_until is in the future.
 * Run after protect middleware so req.user is available.
 */
const lockout = async (req, _res, next) => {
  try {
    const user = await User.findById(req.user._id).select('lockout_until');
    if (user?.lockout_until && user.lockout_until > new Date()) {
      const remaining = Math.ceil((user.lockout_until - Date.now()) / 60000);
      return next(new AppError(`Account locked. Try again in ${remaining} minute(s).`, 423));
    }
    return next();
  } catch (err) {
    return next(err);
  }
};

module.exports = { lockout };
