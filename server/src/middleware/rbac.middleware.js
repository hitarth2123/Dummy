const AppError = require('../utils/AppError');

/**
 * restrictTo — Role-Based Access Control middleware.
 * Pass allowed roles as arguments.
 *
 * Usage:
 *   router.get('/hod-only', protect, restrictTo('hod', 'admin'), handler);
 */
const restrictTo = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(new AppError(`Access denied. Required role(s): ${roles.join(', ')}`, 403));
  }
  return next();
};

module.exports = { restrictTo };
