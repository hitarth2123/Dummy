const { logAction } = require('./audit.service');
const User = require('../models/User');
const { sendDistressAlert } = require('./mailer.service');

const DISTRESS_PATTERNS = [
  /\bsuicide\b/i,
  /\bkill myself\b/i,
  /\bself[- ]harm\b/i,
  /\bwant to die\b/i,
  /\bcan'?t go on\b/i,
  /\bhurt myself\b/i,
  /\bfeeling pressure\b/i,
  /\bunder pressure\b/i,
  /\bmental pressure\b/i,
  /\btest pressure\b/i,
  /\bexam pressure\b/i,
  /\bfeel(?:ing)? overwhelmed\b/i,
  /\bpanic(?:king)?\b/i,
  /\bdesperate\b/i,
  /\bno way out\b/i,
  /\bunsafe\b/i,
  /\bdo something drastic\b/i,
  /\bdo something stupid\b/i,
  /\bcan't handle this\b/i,
  /\bcan no longer handle\b/i,
  /\bdisgrace my family\b/i,
  /\blet my family down\b/i,
  /\bdisappoint(?:ed|ing)? my family\b/i,
  /\bcan't face my family\b/i,
  /\bcannot face my family\b/i,
  /\bmy family will hate me\b/i,
  /\bnothing left to live for\b/i,
  /\bno reason to live\b/i,
  /\bi don't want to be here\b/i,
  /\bmake everyone pay\b/i,
  /\bis (?:the )?(?:exam|test|course) too (?:hard|tough)\b/i,
  /\b(?:exam|test|course|grade|result).*(?:too hard|too tough|overwhelming|scared|afraid)\b/i,
  /\b(?:i am|i'm|i feel|feeling).*(?:exam|test|grade).*(?:stress|pressure|anxious|overwhelmed)\b/i,
];

const CRITICAL_DISTRESS_PATTERNS = [
  /\bsuicide\b/i, /\bkill myself\b/i, /\bself[- ]harm\b/i, /\bwant to die\b/i,
  /\bhurt myself\b/i, /\bno reason to live\b/i, /\bnothing left to live for\b/i,
  /\bi don't want to be here\b/i, /\bdo something drastic\b/i, /\bdo something stupid\b/i,
  /\bmake everyone pay\b/i, /\bdisgrace my family\b/i, /\bcan't face my family\b/i,
  /\bcannot face my family\b/i,
];

const HIGH_DISTRESS_PATTERNS = [
  /\bpanic(?:king)?\b/i,
  /\bdesperate\b/i,
  /\bno way out\b/i,
  /\bunsafe\b/i,
  /\bcan't handle this\b/i,
  /\bcan no longer handle\b/i,
];

const isDistressPrompt = (prompt) => DISTRESS_PATTERNS.find((pattern) => pattern.test(prompt || ''));
const getDistressSeverity = (prompt) => {
  if (CRITICAL_DISTRESS_PATTERNS.some((pattern) => pattern.test(prompt || ''))) return 'critical';
  if (HIGH_DISTRESS_PATTERNS.some((pattern) => pattern.test(prompt || ''))) return 'high';
  return 'warning';
};

const scanDistress = async ({ prompt, user, req }) => {
  const match = isDistressPrompt(prompt);
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
  return { flagged: true, pattern: match.source, severity: getDistressSeverity(prompt) };
};

const escalateDistress = async ({ prompt, response, user, req }) => {
  const result = await scanDistress({ prompt, user, req });
  if (!result.flagged) return { flagged: false, notified: false };

  const profile = await User.findById(user?.id || user?._id).select('institution_id name email department semester role course specialization').lean();
  if (!profile) return { flagged: true, notified: false };
  const recipients = await User.find({
    is_active: true,
    email: { $exists: true, $ne: '' },
    $or: [
      { role: 'admin' },
      { role: { $in: ['faculty', 'hod'] }, department: profile.department },
    ],
  }).select('email').lean();
  const addresses = [...new Set(recipients.map((recipient) => recipient.email).filter(Boolean))];
  const metadata = {
    pattern: result.pattern,
    student_profile: profile,
    student_message: String(prompt || ''),
    ai_response: String(response || ''),
    recipient_count: addresses.length,
  };
  await logAction({
    actor: profile._id,
    actor_role: 'student',
    action: 'distress_escalated',
    resource_type: 'safety',
    resource_id: String(profile._id),
    department: profile.department,
    ip_address: req?.ip,
    user_agent: req?.get?.('user-agent'),
    severity: result.severity,
    metadata,
  });
  if (addresses.length) {
    await sendDistressAlert(addresses.join(','), {
      STUDENT_ID: profile.institution_id || profile._id,
      GRIEVANCE_REF: `SAFETY-${profile._id}`,
      SEVERITY: result.severity,
    });
  }
  return { flagged: true, notified: addresses.length > 0, recipient_count: addresses.length };
};

const distressGuard = (req, _res, next) => {
  scanDistress({
    prompt: req.body?.message || req.body?.prompt || '',
    user: req.user,
    req,
  }).catch((error) => console.error('[Safety] Distress scan failed:', error.message));
  next();
};

module.exports = { scanDistress, escalateDistress, distressGuard, isDistressPrompt, getDistressSeverity, DISTRESS_PATTERNS };