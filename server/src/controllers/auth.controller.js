const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Session = require('../models/Session');
const AppError = require('../utils/AppError');
const { curriculum } = require('../constants/curriculum');

const blacklistedTokens = new Map();

const getConfig = () => ({
  jwtSecret: process.env.JWT_SECRET,
  refreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
  accessExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
});

const cleanBlacklist = () => {
  const now = Date.now();
  for (const [jti, expiresAt] of blacklistedTokens) {
    if (expiresAt <= now) blacklistedTokens.delete(jti);
  }
};

const isTokenBlacklisted = (jti) => {
  cleanBlacklist();
  return Boolean(jti && blacklistedTokens.has(jti));
};

const blacklistToken = (jti, expiresAt) => {
  if (jti) blacklistedTokens.set(jti, expiresAt || Date.now() + 15 * 60 * 1000);
};

const claimUser = (user) => ({
  userId: String(user._id || user.id || user.userId),
  role: user.role,
  dept: user.dept || user.department,
  course: user.course || curriculum.course,
  semester: user.semester ?? null,
  specialization: user.specialization || 'Common Core',
  enrolled_subjects: user.enrolled_subjects || user.subjects || [],
  token_version: user.token_version || 0,
});

const signAccessToken = (user, options = {}) => {
  const { jwtSecret, accessExpiresIn } = getConfig();
  if (!jwtSecret) throw new Error('JWT_SECRET is not configured');
  const claims = claimUser(user);
  return jwt.sign({ ...claims, id: claims.userId }, jwtSecret, {
    expiresIn: accessExpiresIn,
    jwtid: options.jti || crypto.randomUUID(),
  });
};

const signRefreshToken = (user, options = {}) => {
  const { refreshSecret, refreshExpiresIn } = getConfig();
  if (!refreshSecret) throw new Error('JWT_REFRESH_SECRET is not configured');
  return jwt.sign({
    userId: String(user._id || user.id || user.userId),
    type: 'refresh',
  }, refreshSecret, {
    expiresIn: refreshExpiresIn,
    jwtid: options.jti || crypto.randomUUID(),
  });
};

const resolveQuery = (value) => (
  value && typeof value.exec === 'function' ? value.exec() : Promise.resolve(value)
);

const createSession = async (user, request, tokens) => Session.create({
  user: user._id || user.id || user.userId,
  refresh_token: tokens.refreshToken,
  refresh_token_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  access_token_jti: tokens.accessJti,
  ip_address: request.ip,
  user_agent: request.get?.('user-agent'),
});

const issueTokens = async (user, request, existingSession) => {
  const accessJti = crypto.randomUUID();
  const refreshToken = signRefreshToken(user);
  const tokens = { accessJti, refreshToken };
  const accessToken = signAccessToken(user, { jti: accessJti });

  if (existingSession) {
    existingSession.refresh_token = refreshToken;
    existingSession.refresh_token_expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    existingSession.access_token_jti = accessJti;
    existingSession.is_revoked = false;
    existingSession.revoked_at = null;
    await existingSession.save();
  } else {
    await createSession(user, request, tokens);
  }

  return { accessToken, refreshToken, accessJti };
};

const exchangeSsoCode = async (code) => {
  const tokenUrl = process.env.SSO_TOKEN_URL;
  const userInfoUrl = process.env.SSO_USERINFO_URL;
  if (!tokenUrl || !userInfoUrl) {
    throw new AppError('Institutional SSO is not configured.', 503);
  }

  const tokenResponse = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: process.env.SSO_CLIENT_ID || '',
      client_secret: process.env.SSO_CLIENT_SECRET || '',
      redirect_uri: process.env.SSO_REDIRECT_URI || '',
    }),
  });
  if (!tokenResponse.ok) throw new AppError('SSO token exchange failed.', 401);
  const tokenData = await tokenResponse.json();
  const profileResponse = await fetch(userInfoUrl, {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  if (!profileResponse.ok) throw new AppError('SSO profile lookup failed.', 401);
  return profileResponse.json();
};

const getSsoProfile = async (req) => {
  const devEmail = req.body?.devEmail;
  const devPassword = req.body?.devPassword;
  const devLoginEnabled = process.env.DEV_LOGIN_ENABLED !== 'false';
  if (devEmail && devLoginEnabled) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(devEmail.trim())) {
      throw new AppError('Please enter a valid email address.', 400);
    }
    return {
      email: devEmail.trim().toLowerCase(),
      name: devEmail.split('@')[0],
      role: 'student',
      department: 'Computer Science',
      course: curriculum.course,
      semester: 5,
      specialization: 'Common Core',
      enrolled_subjects: [],
      devPassword,
    };
  }
  if (req.ssoProfile) return req.ssoProfile;
  if (req.body?.ssoProfile) return req.body.ssoProfile;
  if (req.body?.code) return exchangeSsoCode(req.body.code);
  throw new AppError('SSO authorization code is required.', 400);
};

const login = async (req, res) => {
  const profile = await getSsoProfile(req);
  const email = profile.email || profile.mail || profile.preferred_username;
  if (!email) throw new AppError('SSO profile did not contain an email.', 400);

  let user = await resolveQuery(User.findOne({ email: email.toLowerCase() }));
  if (profile.devPassword && user) {
    const validPassword = await bcrypt.compare(profile.devPassword, user.password_hash);
    if (!validPassword) throw new AppError('Invalid development credentials.', 401);
  }
  if (!user) {
    if (profile.devPassword) throw new AppError('Development user was not found. Run the seed command first.', 401);
    user = await User.create({
      name: profile.name || profile.displayName || email,
      email: email.toLowerCase(),
      password_hash: await bcrypt.hash(crypto.randomUUID(), 10),
      role: profile.role || 'student',
      department: profile.dept || profile.department || 'Unassigned',
      course: profile.course || curriculum.course,
      semester: profile.semester,
      specialization: profile.specialization || 'Common Core',
      enrolled_subjects: profile.enrolled_subjects || profile.subjects || [],
    });
  }
  if (user.is_active === false) throw new AppError('Account is deactivated.', 403);

  let profileUpdated = false;
  if (!user.course) { user.course = profile.course || curriculum.course; profileUpdated = true; }
  if (!user.specialization) { user.specialization = profile.specialization || 'Common Core'; profileUpdated = true; }

  const tokens = await issueTokens(user, req);
  user.last_login = new Date();
  if (profileUpdated && typeof user.markModified === 'function') user.markModified('course');
  if (typeof user.save === 'function') await user.save();

  return res.status(200).json({
    success: true, data: {
      user: claimUser(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    }
  });
};

const logout = async (req, res) => {
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : req.cookies?.access_token;
  if (token) {
    try {
      const decoded = jwt.decode(token);
      if (decoded?.jti) {
        blacklistToken(decoded.jti, decoded.exp ? decoded.exp * 1000 : undefined);
        await resolveQuery(Session.updateOne(
          { access_token_jti: decoded.jti, is_revoked: false },
          { $set: { is_revoked: true, revoked_at: new Date() } }
        ));
      }
    } catch {
      // Logout is idempotent even when the access token is already malformed.
    }
  }
  res.clearCookie('access_token');
  res.status(204).send();
};

const refresh = async (req, res) => {
  const refreshToken = req.body?.refreshToken || req.cookies?.refresh_token;
  if (!refreshToken) throw new AppError('Refresh token is required.', 401);

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, getConfig().refreshSecret);
  } catch {
    throw new AppError('Invalid or expired refresh token.', 401);
  }
  if (decoded.type !== 'refresh') throw new AppError('Invalid refresh token.', 401);

  const session = await resolveQuery(Session.findOne({
    refresh_token: refreshToken,
    is_revoked: false,
  }));
  if (!session || session.refresh_token_expires_at <= new Date()) {
    throw new AppError('Refresh session is invalid or expired.', 401);
  }
  const user = await resolveQuery(User.findById(decoded.userId));
  if (!user || user.is_active === false) throw new AppError('User is not available.', 401);

  const tokens = await issueTokens(user, req, session);
  res.json({
    success: true, data: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    }
  });
};

const unsubscribeEmail = async (req, res) => {
  let userId = req.user?.id;
  if (!userId && req.query.token) {
    try {
      const decoded = jwt.verify(req.query.token, getConfig().jwtSecret);
      if (decoded.type !== 'email-unsubscribe') throw new Error('Invalid unsubscribe token');
      userId = decoded.userId;
    } catch {
      throw new AppError('Invalid unsubscribe link.', 400);
    }
  }
  if (!userId) throw new AppError('Authentication required.', 401);
  await User.findByIdAndUpdate(userId, { $set: { email_unsubscribed: true } });
  return res.json({ success: true, message: 'Email reminders unsubscribed.' });
};

const createUnsubscribeToken = (user) => jwt.sign(
  { userId: String(user._id), type: 'email-unsubscribe' },
  getConfig().jwtSecret,
  { expiresIn: '1y' },
);

module.exports = {
  login,
  logout,
  refresh,
  signAccessToken,
  signRefreshToken,
  claimUser,
  issueTokens,
  blacklistToken,
  isTokenBlacklisted,
  unsubscribeEmail,
  createUnsubscribeToken,
};