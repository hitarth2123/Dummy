const EthicsConfig = require('../models/EthicsConfig');
const EthicsFlag = require('../models/EthicsFlag');
const { logAction } = require('./audit.service');
const AppError = require('../utils/AppError');

const DEFAULT_RULES = [
  { category: 'academic_dishonesty', severity: 'high', patterns: [/write my assignment for me/i, /submit.*exam/i, /cheat/i] },
  { category: 'plagiarism', severity: 'high', patterns: [/copy.*assignment/i, /plagiar/i, /avoid plagiarism detection/i] },
  { category: 'hate_speech', severity: 'critical', patterns: [/\bkill all\b/i, /racial slur/i] },
  { category: 'self_harm', severity: 'critical', patterns: [/suicide/i, /self[- ]harm/i] },
];

const findConfig = async (department) => {
  if (!department) return null;
  const query = EthicsConfig.findOne({ department, is_active: true });
  const sortedQuery = query?.sort ? query.sort({ version: -1 }) : query;
  return sortedQuery?.lean ? sortedQuery.lean() : sortedQuery;
};

const checkEthics = async ({ prompt, user, req }) => {
  const department = user?.dept || user?.department;
  const config = await findConfig(department);
  const configuredCategories = new Set(config?.prohibited_categories || DEFAULT_RULES.map((rule) => rule.category));
  const violation = DEFAULT_RULES.find((rule) => configuredCategories.has(rule.category)
    && rule.patterns.some((pattern) => pattern.test(prompt)));

  if (!violation) return { allowed: true };

  const description = `Blocked LLM request matched ${violation.category}.`;
  const flag = await EthicsFlag.create({
    student: user?._id || user?.id,
    department: department || 'Unknown',
    category: violation.category,
    severity: violation.severity,
    description,
    trigger_content: prompt.slice(0, 1000),
  });
  await logAction({
    actor: user?._id || user?.id,
    actor_role: user?.role || 'student',
    action: 'llm_request_blocked',
    resource_type: 'llm',
    resource_id: String(flag._id || ''),
    department,
    ip_address: req?.ip,
    user_agent: req?.get?.('user-agent'),
    metadata: { category: violation.category },
    severity: violation.severity === 'critical' ? 'critical' : 'warning',
  });
  throw new AppError('This request was blocked by the academic safety policy.', 403);
};

const ethicsGuard = async (req, _res, next) => {
  try {
    const prompt = req.body?.prompt || req.body?.query || req.body?.message || '';
    await checkEthics({ prompt, user: req.user, req });
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = { checkEthics, ethicsGuard, DEFAULT_RULES };