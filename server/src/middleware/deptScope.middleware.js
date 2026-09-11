const AppError = require('../utils/AppError');

/**
 * deptScope — ensures the authenticated user can only access resources
 * within their own department.
 *
 * Attaches req.department for downstream use.
 * HODs and Admins may pass an explicit ?dept= query param.
 */
const deptScope = (req, _res, next) => {
  const { role, dept, department } = req.user;
  const userDepartment = dept || department;

  if (role === 'admin') {
    req.department = req.query.dept || req.body?.dept || null;
    req.departmentFilter = req.department ? { department: req.department } : {};
    return next();
  }

  if (role === 'hod') {
    const requestedDepartment = req.query.dept || req.body?.dept;
    if (requestedDepartment && requestedDepartment !== userDepartment) {
      return next(new AppError('HOD can only access their own department.', 403));
    }
    req.department = userDepartment;
    req.departmentFilter = { department: userDepartment };
    return next();
  }

  const requestedDepartment = req.query.dept || req.body?.dept;
  if (requestedDepartment && requestedDepartment !== userDepartment) {
    return next(new AppError('Cross-department access is not allowed.', 403));
  }
  req.department = userDepartment;
  req.departmentFilter = { department: userDepartment };
  return next();
};

const getDepartmentFilter = (req) => req.departmentFilter || {
  department: req.user.dept || req.user.department,
};

module.exports = { deptScope, getDepartmentFilter };
