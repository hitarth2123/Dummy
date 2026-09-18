const catchAsync = require('../utils/catchAsync');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const FacultyAvailability = require('../models/FacultyAvailability');
const DoubtSession = require('../models/DoubtSession');
const EthicsConfig = require('../models/EthicsConfig');
const EthicsFlag = require('../models/EthicsFlag');
const { logAction } = require('../services/audit.service');
const ProfileChangeRequest = require('../models/ProfileChangeRequest');

const auditLog = catchAsync(async (req, res) => {
  const filter = { department: req.user.dept || req.user.department };
  if (req.query.flag_type) filter['metadata.category'] = req.query.flag_type;
  if (req.query.status) filter['metadata.status'] = req.query.status;
  if (req.query.date_from || req.query.date_to) {
    filter.createdAt = {};
    if (req.query.date_from) filter.createdAt.$gte = new Date(req.query.date_from);
    if (req.query.date_to) filter.createdAt.$lte = new Date(req.query.date_to);
  }
  const logs = await AuditLog.find(filter).sort({ createdAt: -1 }).limit(200).lean();
  res.json({ success: true, data: logs.map((log) => ({
    id: log._id,
    timestamp: log.createdAt,
    student_id: log.actor_role === 'student' ? log.actor : undefined,
    request_summary: log.metadata?.prompt_length ? `LLM request (${log.metadata.prompt_length} chars)` : log.action,
    flag_category: log.metadata?.category,
    status: log.severity,
    action: log.action,
  })) });
});

const dashboard = catchAsync(async (req, res) => {
  const department = req.user.department;
  const [pending_profile_requests, recent_audit_events, active_ethics_config] = await Promise.all([
    ProfileChangeRequest.countDocuments({ department, status: 'pending_hod' }),
    AuditLog.countDocuments({ department, createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }),
    EthicsConfig.findOne({ department, is_active: true }).sort({ version: -1 }).select('version').lean(),
  ]);
  return res.json({ success: true, data: { pending_profile_requests, recent_audit_events, ethics_config_version: active_ethics_config?.version || 0, updated_at: new Date().toISOString() } });
});

const getEthicsConfig = catchAsync(async (req, res) => {
  const department = req.user.dept || req.user.department;
  const history = await EthicsConfig.find({ department }).sort({ version: -1 }).lean();
  return res.json({ success: true, data: { current: history.find((item) => item.is_active) || null, history } });
});

const updateEthicsConfig = catchAsync(async (req, res) => {
  const department = req.user.dept || req.user.department;
  const current = await EthicsConfig.findOne({ department }).sort({ version: -1 }).lean();
  const next = await EthicsConfig.create({
    department,
    version: (current?.version || 0) + 1,
    prohibited_categories: req.body.prohibited_categories || current?.prohibited_categories || ['academic_dishonesty', 'plagiarism', 'hate_speech', 'self_harm'],
    rules: req.body.rules || current?.rules || [],
    severity_thresholds: req.body.severity_thresholds || current?.severity_thresholds,
    auto_escalate_severity: req.body.auto_escalate_severity || current?.auto_escalate_severity,
    hod_email_on_severity: req.body.hod_email_on_severity || current?.hod_email_on_severity,
    created_by: req.user.id,
  });
  if (current) await EthicsConfig.updateMany({ department, is_active: true }, { is_active: false });
  return res.status(200).json({ success: true, data: next });
});

const auditAction = catchAsync(async (req, res) => {
  const action = req.body.action;
  if (!['reviewed', 'false_positive', 'escalate'].includes(action)) return res.status(400).json({ success: false, message: 'Invalid audit action.' });
  const target = await AuditLog.findOne({ _id: req.params.id, department: req.user.dept || req.user.department }).lean();
  if (!target) return res.status(404).json({ success: false, message: 'Audit log not found.' });
  if (action === 'false_positive' && target.resource_id) {
    await EthicsFlag.findByIdAndUpdate(target.resource_id, { hod_review_status: 'false_positive' });
  }
  await logAction({ actor: req.user.id, actor_role: 'hod', action: 'hod_review_action', resource_type: 'audit_log', resource_id: String(target._id), department: target.department, metadata: { hod_review_action: action, target_audit_log: String(target._id), target_action: target.action }, severity: 'info' });
  return res.json({ success: true, data: { action, audit_log_id: target._id } });
});

const faculty = catchAsync(async (req, res) => {
  const department = req.user.dept || req.user.department;
  const users = await User.find({ role: 'faculty', department, is_active: true }).select('name email department subject_expertise').lean();
  const ids = users.map((user) => user._id);
  const [availability, sessions] = await Promise.all([
    FacultyAvailability.find({ faculty: { $in: ids } }).lean(),
    DoubtSession.find({ faculty: { $in: ids }, department, createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } }).lean(),
  ]);
  const availabilityByFaculty = new Map(availability.map((item) => [String(item.faculty), item]));
  const sessionsByFaculty = new Map();
  sessions.forEach((session) => {
    const key = String(session.faculty);
    const entry = sessionsByFaculty.get(key) || { total: 0, confirmed: 0 };
    entry.total += 1;
    if (['confirmed', 'completed'].includes(session.status)) entry.confirmed += 1;
    sessionsByFaculty.set(key, entry);
  });
  res.json({ success: true, data: users.map((user) => {
    const counts = sessionsByFaculty.get(String(user._id)) || { total: 0, confirmed: 0 };
    return {
      ...user,
      availability: availabilityByFaculty.get(String(user._id)) || null,
      sessions_this_month: counts.total,
      fulfillment_rate: counts.total ? Math.round((counts.confirmed / counts.total) * 100) : 0,
    };
  }) });
});

const profileChangeRequests = catchAsync(async (req, res) => {
  const filter = req.query.mine === 'true'
    ? { student: req.user.id, requester_role: 'hod', status: 'pending_admin' }
    : { department: req.user.department, requester_role: { $in: ['student', 'faculty'] } };
  const requests = await ProfileChangeRequest.find(filter)
    .populate('student', 'name email department semester specialization').sort({ createdAt: -1 }).lean();
  return res.json({ success: true, data: requests });
});

const createProfileChangeRequest = catchAsync(async (req, res) => {
  const { change_field, proposed_value, reason } = req.body;
  if (!['name', 'email', 'department'].includes(change_field) || !proposed_value?.trim() || !reason?.trim()) return res.status(400).json({ success: false, message: 'Select a field, enter the requested value, and explain why.' });
  const pending = await ProfileChangeRequest.findOne({ student: req.user.id, requester_role: 'hod', status: 'pending_admin' });
  if (pending) return res.status(409).json({ success: false, message: 'You already have a HOD settings request awaiting admin review.' });
  const request = await ProfileChangeRequest.create({ student: req.user.id, requester_role: 'hod', department: req.department, change_field, proposed_value: proposed_value.trim(), requested_changes: `${change_field}: ${proposed_value.trim()}`, reason: reason.trim(), status: 'pending_admin', current_reviewer_role: 'admin' });
  return res.status(201).json({ success: true, data: request, message: 'Your settings request was sent to Admin.' });
});

const reviewProfileChangeRequest = catchAsync(async (req, res) => {
  const { action, review_notes = '' } = req.body;
  if (!['approve', 'reject', 'escalate'].includes(action)) return res.status(400).json({ success: false, message: 'Review action must be approve, reject, or escalate.' });
  const request = await ProfileChangeRequest.findOne({ _id: req.params.id, department: req.user.department, status: 'pending_hod' });
  if (!request) return res.status(404).json({ success: false, message: 'HOD profile change request not found.' });
  if (action === 'escalate') {
    request.status = 'pending_admin';
    request.current_reviewer_role = 'admin';
    request.escalation_history.push({ from_role: 'hod', to_role: 'admin', by: req.user.id, note: review_notes.trim() });
  } else {
    request.status = action === 'approve' ? 'approved' : 'rejected';
    request.current_reviewer_role = null;
    request.reviewed_by = req.user.id;
    request.reviewed_at = new Date();
    request.review_notes = review_notes.trim();
    if (action === 'approve' && request.requester_role === 'faculty') {
      await User.findByIdAndUpdate(request.student, { [request.change_field]: request.proposed_value }, { runValidators: true });
    }
  }
  await request.save();
  return res.json({ success: true, data: request });
});

module.exports = { dashboard, auditLog, faculty, profileChangeRequests, createProfileChangeRequest, reviewProfileChangeRequest, getEthicsConfig, updateEthicsConfig, auditAction };
