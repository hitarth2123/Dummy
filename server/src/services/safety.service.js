const { logAction } = require('./audit.service');

const DISTRESS_PATTERNS = [
  /\bsuicide\b/i,
  /\bkill myself\b/i,
  /\bself[- ]harm\b/i,
  /\bwant to die\b/i,
  /\bcan'?t go on\b/i,
  /\bhurt myself\b/i,
];

const scanDistress = async ({ prompt, user, req }) => {
  const match = DISTRESS_PATTERNS.find((pattern) => pattern.test(prompt || ''));
  if (!match) return { flagged: false };
  await logAction({
    actor: user?.id || user?._id,
    actor_role: user?.role || 'student',
    action: 'distress_keyword_detected',
    resource_type: 'safety',
    department: user?.dept || user?.department,
    ip_address: req?.ip,
    user_agent: req?.get?.('user-agent'),
    severity: 'warning',
    metadata: { pattern: match.source },
  });
  return { flagged: true, pattern: match.source };
};

const distressGuard = (req, _res, next) => {
  scanDistress({
    prompt: req.body?.message || req.body?.prompt || '',
    user: req.user,
    req,
  }).catch((error) => console.error('[Safety] Distress scan failed:', error.message));
  next();
};

module.exports = { scanDistress, distressGuard, DISTRESS_PATTERNS };