const AppError = require('../utils/AppError');

/**
 * deptScope — ensures the authenticated user can only access resources
 * within their own department.
 *
 * Attaches req.department for downstream use.
 * HODs and Admins may pass an explicit ?dept= query param.
 */
const deptScope = (req, _res, next) => {
  const { role, department } = req.user;

  if (role === 'admin') {
    // Admin can specify any dept or all
    req.department = req.query.dept || null;
    return next();
  }

  if (role === 'hod') {
    // HOD can scope to their own dept only
    if (req.query.dept && req.query.dept !== department) {
      return next(new AppError('HOD can only access their own department.', 403));
    }
    req.department = department;
    return next();
  }

  // Students and Faculty are always scoped to their department
  req.department = department;
  return next();
};

module.exports = { deptScope };
