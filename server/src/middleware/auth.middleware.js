const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const AppError = require('../utils/AppError');
const Session = require('../models/Session');
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

  req.user = {
    id: decoded.userId || decoded.id,
    _id: decoded.userId || decoded.id,
    role: decoded.role,
    dept: decoded.dept || decoded.department,
    department: decoded.dept || decoded.department,
    semester: decoded.semester,
    subjects: decoded.enrolled_subjects || decoded.subjects || [],
    enrolled_subjects: decoded.enrolled_subjects || decoded.subjects || [],
  };
  return next();
};

const authenticate = protect;

module.exports = { protect, authenticate };
