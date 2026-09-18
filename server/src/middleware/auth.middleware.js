const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const AppError = require('../utils/AppError');
const Session = require('../models/Session');
const User = require('../models/User');
const { isTokenBlacklisted } = require('../controllers/auth.controller');

/**
 * protect — verifies JWT access token and attaches req.user.
 */
const protect = async (req, _res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.access_token) {
    token = req.cookies.access_token;
  }

  if (!token) return next(new AppError('Authentication required. Please log in.', 401));

  let decoded;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET);
  } catch {
    return next(new AppError('Invalid or expired token. Please log in again.', 401));
  }

  // Check session is not revoked
  if (isTokenBlacklisted(decoded.jti)) {
    return next(new AppError('Token has been revoked. Please log in again.', 401));
  }

  if (decoded.jti) {
    try {
      const session = await Session.findOne({ access_token_jti: decoded.jti, is_revoked: false });
      if (!session) return next(new AppError('Session revoked. Please log in again.', 401));
    } catch (error) {
      return next(error);
    }
  }

  const userQuery = User.findById(decoded.userId || decoded.id);
  const currentUser = userQuery && typeof userQuery.select === 'function'
    ? await userQuery.select('institution_id role department semester enrolled_subjects is_active token_version').lean()
    : await userQuery;
  if (!currentUser || currentUser.is_active === false) return next(new AppError('Account is unavailable. Please log in again.', 401));
  if ((decoded.token_version || 0) !== (currentUser.token_version || 0)) return next(new AppError('Your account permissions changed. Please log in again.', 401));

  req.user = {
    id: String(currentUser._id),
    _id: String(currentUser._id),
    institution_id: currentUser.institution_id,
    role: currentUser.role,
    dept: currentUser.department,
    department: currentUser.department,
    semester: currentUser.semester,
    subjects: currentUser.enrolled_subjects || [],
    enrolled_subjects: currentUser.enrolled_subjects || [],
  };
  return next();
};

const authenticate = protect;

module.exports = { protect, authenticate };
