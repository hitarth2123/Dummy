const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/User');
const Session = require('../models/Session');

/**
 * protect — verifies JWT access token and attaches req.user.
 */
const protect = catchAsync(async (req, _res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies?.access_token) {
    token = req.cookies.access_token;
  }

  if (!token) throw new AppError('Authentication required. Please log in.', 401);

  let decoded;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET);
  } catch {
    throw new AppError('Invalid or expired token. Please log in again.', 401);
  }

  const user = await User.findById(decoded.id).select('-password_hash');
  if (!user) throw new AppError('User no longer exists.', 401);
  if (!user.is_active) throw new AppError('Account is deactivated.', 403);

  // Check session is not revoked
  if (decoded.jti) {
    const session = await Session.findOne({ access_token_jti: decoded.jti, is_revoked: false });
    if (!session) throw new AppError('Session revoked. Please log in again.', 401);
  }

  req.user = user;
  next();
});

module.exports = { protect };
