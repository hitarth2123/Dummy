const AppError = require('../utils/AppError');

const ROLE_ROUTE_MATRIX = Object.freeze({
  student: new Set(['student', 'llm', 'forum', 'feedback', 'safety', 'hallucination:report']),
  faculty: new Set(['faculty', 'forum', 'feedback', 'safety', 'hallucination:report']),
  hod: new Set(['hod', 'forum', 'feedback', 'safety', 'hallucination', 'hallucination:report']),
  admin: new Set(['admin', 'forum', 'feedback', 'safety', 'hallucination', 'hallucination:report']),
});

/**
 * restrictTo — Role-Based Access Control middleware.
 * Pass allowed roles as arguments.
 *
 * Usage:
 *   router.get('/hod-only', protect, restrictTo('hod', 'admin'), handler);
 */
const restrictTo = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new AppError(`Access denied. Required role(s): ${roles.join(', ')}`, 403));
  }
  return next();
};

const rbac = (resource, action = 'read') => (req, _res, next) => {
  const key = action === 'read' ? resource : `${resource}:${action}`;
  const permissions = ROLE_ROUTE_MATRIX[req.user?.role];
  if (!req.user || !permissions || (!permissions.has(key) && !permissions.has(resource))) {
    return next(new AppError('Access denied for this role.', 403));
  }
  return next();
};

module.exports = { restrictTo, rbac, ROLE_ROUTE_MATRIX };
