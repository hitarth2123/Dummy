const EthicsConfig = require('../models/EthicsConfig');
const EthicsFlag = require('../models/EthicsFlag');
const { logAction } = require('./audit.service');
const { classifyEthics } = require('./groqEthics.service');
const { enqueueEthicsEscalation } = require('../jobs/ethicsEscalation.queue');
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

const layerOneMatch = (prompt, configuredCategories, configuredRules = []) => {
  const customRules = configuredRules.filter((rule) => rule.is_active !== false).map((rule) => ({
    ...rule,
    patterns: rule.patterns.map((pattern) => new RegExp(pattern, 'i')),
  }));
  const matches = [...DEFAULT_RULES, ...customRules].flatMap((rule) => {
    if (!configuredCategories.has(rule.category)) return [];
    const count = rule.patterns.filter((pattern) => pattern.test(prompt)).length;
    return count ? [{ rule, count }] : [];
  }).sort((left, right) => right.count - left.count);
  if (!matches.length) return { category: 'other', severity: 'low', confidence: 0 };
  const match = matches[0];
  return {
    category: match.rule.category,
    severity: match.rule.severity,
    confidence: 1,
  };
};

const checkEthics = async ({ prompt, user, req }) => {
  const department = user?.dept || user?.department;
  const config = await findConfig(department);
  const configuredCategories = new Set(config?.prohibited_categories || DEFAULT_RULES.map((rule) => rule.category));
  const layerOne = layerOneMatch(prompt, configuredCategories, config?.rules || []);
  const actor = user?._id || user?.id;
  await logAction({
    actor,
    actor_role: user?.role || 'student',
    action: 'ethics_layer1_classified',
    resource_type: 'ethics_classifier',
    department,
    ip_address: req?.ip,
    user_agent: req?.get?.('user-agent'),
    metadata: { category: layerOne.category, confidence: layerOne.confidence, config_version: config?.version || null },
    severity: 'info',
  });

  let confirmed = layerOne.confidence >= 0.75;
  let finalCategory = layerOne.category;
  let finalSeverity = layerOne.severity;
  let layerTwo = null;
  if (layerOne.confidence < Number(process.env.ETHICS_LAYER2_THRESHOLD || 0.75)) {
    try {
      layerTwo = await classifyEthics({ prompt, category: layerOne.category });
    } catch (error) {
      layerTwo = { decision: 'BENIGN', provider: 'groq', error: error.message };
    }
    await logAction({
      actor,
      actor_role: user?.role || 'student',
      action: 'ethics_layer2_classified',
      resource_type: 'ethics_classifier',
      department,
      ip_address: req?.ip,
      user_agent: req?.get?.('user-agent'),
      metadata: { category: layerOne.category, decision: layerTwo.decision, provider: layerTwo.provider, layer1_confidence: layerOne.confidence },
      severity: 'info',
    });
    confirmed = layerTwo.decision === 'VIOLATION';
    finalCategory = layerOne.category;
    finalSeverity = layerOne.category === 'other' ? 'low' : layerOne.severity;
  }

  if (!confirmed) return { allowed: true };

  const description = `Blocked LLM request matched ${finalCategory}.`;
  const flag = await EthicsFlag.create({
    student: actor,
    department: department || 'Unknown',
    category: finalCategory,
    severity: finalSeverity,
    description,
    trigger_content: prompt.slice(0, 1000),
  });
  await logAction({
    actor,
    actor_role: user?.role || 'student',
    action: 'llm_request_blocked',
    resource_type: 'llm',
    resource_id: String(flag._id || ''),
    department,
    ip_address: req?.ip,
    user_agent: req?.get?.('user-agent'),
    metadata: { category: finalCategory, layer1_confidence: layerOne.confidence, layer2_decision: layerTwo?.decision || null },
    severity: finalSeverity === 'critical' ? 'critical' : 'warning',
  });
  const jobId = await enqueueEthicsEscalation({ flagId: flag._id, department, category: finalCategory, studentId: actor });
  if (jobId && typeof EthicsFlag.findOneAndUpdate === 'function') {
    await EthicsFlag.findOneAndUpdate({ _id: flag._id }, { hod_notification_job_id: jobId });
  }
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

module.exports = { checkEthics, ethicsGuard, DEFAULT_RULES, layerOneMatch };