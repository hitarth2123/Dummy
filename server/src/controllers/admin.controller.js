const catchAsync = require('../utils/catchAsync');
const ExamTimetable = require('../models/ExamTimetable');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const Session = require('../models/Session');
const FeedbackForm = require('../models/FeedbackForm');
const EthicsFlag = require('../models/EthicsFlag');
const HallucinationReport = require('../models/HallucinationReport');
const PracticeAttempt = require('../models/PracticeAttempt');
const TutorConversation = require('../models/TutorConversation');
const LearningPath = require('../models/LearningPath');
const bcrypt = require('bcryptjs');
const { getAvailability, updateAvailability } = require('../services/aiAvailability.service');

const parseCsv = (input) => {
  const lines = String(input || '').trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return { rows: [], errors: [{ row: 1, message: 'CSV must include a header and at least one row.' }] };
  const headers = lines[0].split(',').map((header) => header.trim());
  const required = ['student_id', 'subject', 'exam_date', 'start_time', 'end_time'];
  const missing = required.filter((header) => !headers.includes(header));
  if (missing.length) return { rows: [], errors: [{ row: 1, message: `Missing columns: ${missing.join(', ')}` }] };
  const errors = [];
  const rows = lines.slice(1).map((line, index) => {
    const values = line.split(',').map((value) => value.trim());
    const row = Object.fromEntries(headers.map((header, valueIndex) => [header, values[valueIndex] || '']));
    const date = /^\d{4}-\d{2}-\d{2}$/.test(row.exam_date) ? new Date(`${row.exam_date}T00:00:00`) : null;
    const timePattern = /^\d{2}:\d{2}$/;
    if (!date || Number.isNaN(date.getTime()) || !timePattern.test(row.start_time) || !timePattern.test(row.end_time) || !row.subject || !row.student_id) {
      errors.push({ row: index + 2, message: 'Expected student_id, subject, exam_date YYYY-MM-DD, and start/end time HH:MM.' });
      return null;
    }
    const start = new Date(`${row.exam_date}T${row.start_time}:00`);
    const end = new Date(`${row.exam_date}T${row.end_time}:00`);
    if (end <= start) errors.push({ row: index + 2, message: 'end_time must be after start_time.' });
    return { student_id: row.student_id, subject: row.subject, exam_date: date, start_time: row.start_time, end_time: row.end_time, start, end };
  }).filter(Boolean);
  return { rows, errors };
};

const uploadTimetable = catchAsync(async (req, res) => {
  const csv = req.body.csv || req.body.content;
  const { rows, errors } = parseCsv(csv);
  if (errors.length) return res.status(400).json({ success: false, message: 'CSV contains invalid rows.', errors });
  const department = req.body.department || 'Computer Science';
  const semester = Number(req.body.semester) || 5;
  const academicYear = req.body.academic_year || `${new Date().getFullYear()}-${String(new Date().getFullYear() + 1).slice(-2)}`;
  const examType = req.body.exam_type || 'internal';
  const documents = rows.map((row) => ({ department, semester, academic_year: academicYear, exam_type: examType, subject: row.subject, student_id: row.student_id, exam_date: row.exam_date, start_time: row.start_time, end_time: row.end_time, lockout_start: new Date(row.start.getTime() - 60 * 60 * 1000), lockout_end: new Date(row.end.getTime() + 60 * 60 * 1000), created_by: req.user.id }));
  const created = await ExamTimetable.insertMany(documents);
  return res.status(201).json({ success: true, data: created, errors: [] });
});

const getTimetable = catchAsync(async (req, res) => {
  const timetable = await ExamTimetable.find({ department: req.query.department || req.user.department }).sort({ exam_date: 1 }).lean();
  return res.json({ success: true, data: timetable });
});

const getUsers = catchAsync(async (req, res) => {
  const filter = {};
  const search = String(req.query.search || '').trim();
  if (search) filter.$or = [
    { name: { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } },
  ];
  if (req.query.role) filter.role = req.query.role;
  if (req.query.department) filter.department = req.query.department;
  if (req.query.semester) filter.semester = Number(req.query.semester);
  const users = await User.find(filter).select('-password_hash').sort({ createdAt: -1 }).lean();
  return res.json({ success: true, data: users });
});

const parseUserCsv = (input) => {
  const lines = String(input || '').trim().split(/\r?\n/).filter(Boolean);
  const required = ['institution_id', 'name', 'email', 'role', 'dept'];
  if (lines.length < 2) return { rows: [], errors: [{ row: 1, message: 'CSV must include a header and at least one row.' }] };
  const headers = lines[0].split(',').map((header) => header.trim().toLowerCase());
  const missing = required.filter((header) => !headers.includes(header));
  if (missing.length) return { rows: [], errors: [{ row: 1, message: `Missing columns: ${missing.join(', ')}` }] };
  const errors = [];
  const rows = lines.slice(1).map((line, index) => {
    const values = line.split(',').map((value) => value.trim());
    const row = Object.fromEntries(headers.map((header, valueIndex) => [header, values[valueIndex] || '']));
    if (!row.institution_id || !row.name || !/^\S+@\S+\.\S+$/.test(row.email) || !['student', 'faculty', 'hod', 'admin'].includes(row.role) || !row.dept) {
      errors.push({ row: index + 2, message: 'Expected institution_id, name, valid email, role, and dept.' });
      return null;
    }
    if (row.semester && (!Number.isInteger(Number(row.semester)) || Number(row.semester) < 1 || Number(row.semester) > 8)) {
      errors.push({ row: index + 2, message: 'semester must be an integer from 1 to 8.' });
      return null;
    }
    return row;
  }).filter(Boolean);
  return { rows, errors };
};

const bulkImportUsers = catchAsync(async (req, res) => {
  const { rows, errors } = parseUserCsv(req.body.csv || req.body.content);
  if (errors.length) return res.status(400).json({ success: false, message: 'CSV contains invalid rows.', errors });
  const documents = rows.map((row) => ({ institution_id: row.institution_id, name: row.name, email: row.email.toLowerCase(), password_hash: bcrypt.hashSync(require('crypto').randomUUID(), 12), role: row.role, department: row.dept, semester: row.semester ? Number(row.semester) : undefined }));
  const created = await User.insertMany(documents, { ordered: false });
  return res.status(201).json({ success: true, data: created.map((user) => { const safe = user.toObject(); delete safe.password_hash; return safe; }) });
});

const createUser = catchAsync(async (req, res) => {
  const { name, email, password, role, department, semester } = req.body;
  if (!name || !email || !password || !role || !department) return res.status(400).json({ success: false, message: 'name, email, password, role, and department are required.' });
  if (!['student', 'faculty', 'hod', 'admin'].includes(role)) return res.status(400).json({ success: false, message: 'Invalid user role.' });
  const password_hash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, password_hash, role, department, semester: semester ? Number(semester) : undefined });
  const safeUser = user.toObject();
  delete safeUser.password_hash;
  return res.status(201).json({ success: true, data: safeUser });
});

const updateUser = catchAsync(async (req, res) => {
  if (String(req.params.id) === String(req.user.id) && req.body.is_active === false) return res.status(400).json({ success: false, message: 'You cannot deactivate your own admin account.' });
  const allowed = ['name', 'role', 'department', 'semester', 'is_active'];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
  if (updates.role && !['student', 'faculty', 'hod', 'admin'].includes(updates.role)) return res.status(400).json({ success: false, message: 'Invalid user role.' });
  if (updates.semester !== undefined) updates.semester = Number(updates.semester);
  const update = { $set: updates };
  if (['role', 'department', 'is_active'].some((key) => updates[key] !== undefined)) update.$inc = { token_version: 1 };
  const user = await User.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true }).select('-password_hash').lean();
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  return res.json({ success: true, data: user });
});

const deactivateUser = catchAsync(async (req, res) => {
  if (String(req.params.id) === String(req.user.id)) return res.status(400).json({ success: false, message: 'You cannot deactivate your own admin account.' });
  const user = await User.findByIdAndUpdate(req.params.id, { $set: { is_active: false }, $inc: { token_version: 1 } }, { new: true }).select('-password_hash').lean();
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  return res.json({ success: true, data: user });
});

const resetUserPassword = catchAsync(async (req, res) => {
  const temporaryPassword = require('crypto').randomBytes(12).toString('base64url');
  const password_hash = await bcrypt.hash(temporaryPassword, 12);
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $set: { password_hash }, $inc: { token_version: 1 } },
    { new: true }
  ).select('_id email');
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  return res.json({ success: true, data: { user_id: user._id, email: user.email, temporary_password: temporaryPassword } });
});

const unlockTimetable = catchAsync(async (req, res) => {
  const { student_id: studentId, subject } = req.params;
  const reason = String(req.body.reason || '').trim();
  if (!reason) return res.status(400).json({ success: false, message: 'reason is required.' });

  const timetable = await ExamTimetable.findOneAndUpdate(
    { student_id: studentId, subject },
    { $set: { is_manually_unlocked: true } },
    { new: true }
  ).lean();
  if (!timetable) return res.status(404).json({ success: false, message: 'Exam timetable entry not found.' });

  await AuditLog.create({
    actor: req.user.id,
    actor_role: req.user.role,
    action: 'exam_lockout_manual_unlock',
    resource_type: 'exam_timetable',
    resource_id: String(timetable._id),
    department: timetable.department,
    ip_address: req.ip,
    user_agent: req.get('user-agent'),
    metadata: { student_id: studentId, subject, reason },
  });
  return res.json({ success: true, data: timetable });
});

const getDashboard = catchAsync(async (req, res) => {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);
  const requestedDepartment = req.query.department || req.query.dept;
  const departmentFilter = requestedDepartment ? { department: requestedDepartment } : {};
  const studentFilter = { role: 'student', ...departmentFilter };
  const [activeSessions, activeStudents, engagedStudents, openEthicsFlags, hallucinationReports, feedback] = await Promise.all([
    Session.countDocuments({ is_revoked: false, refresh_token_expires_at: { $gt: now } }),
    User.countDocuments(studentFilter),
    PracticeAttempt.distinct('student', { createdAt: { $gte: weekStart }, ...departmentFilter }),
    EthicsFlag.countDocuments({ resolution_status: { $in: ['open', 'under_review', 'escalated'] }, ...departmentFilter }),
    HallucinationReport.countDocuments(departmentFilter),
    FeedbackForm.find(departmentFilter).select('ratings createdAt').lean(),
  ]);
  const scores = feedback.flatMap((entry) => entry.ratings.map((rating) => rating.score));
  const averageFeedbackRating = scores.length ? Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(2)) : 0;
  const engagement = activeStudents ? Number(((engagedStudents.length / activeStudents) * 100).toFixed(2)) : 0;
  const weeklyTrends = Array.from({ length: 8 }, (_, index) => {
    const end = new Date(now);
    end.setDate(now.getDate() - (7 - index) * 7);
    const start = new Date(end);
    start.setDate(end.getDate() - 7);
    const entries = feedback.filter((entry) => entry.createdAt >= start && entry.createdAt < end);
    const trendScores = entries.flatMap((entry) => entry.ratings.map((rating) => rating.score));
    return { week_start: start.toISOString(), feedback_rating: trendScores.length ? Number((trendScores.reduce((sum, score) => sum + score, 0) / trendScores.length).toFixed(2)) : 0, feedback_submissions: entries.length };
  });
  return res.json({ success: true, data: { active_sessions: activeSessions, engagement_percent: engagement, uptime_percent: 100, open_ethics_flags: openEthicsFlags, hallucination_reports: hallucinationReports, average_feedback_rating: averageFeedbackRating, weekly_trends: weeklyTrends } });
});

const getStudentActivity = catchAsync(async (req, res) => {
  const department = req.query.department || req.query.dept;
  const filter = department ? { department } : {};
  const [conversations, workflows] = await Promise.all([
    TutorConversation.find({}).select('user title topic subtopic messages updatedAt').populate('user', 'name email department semester').sort({ updatedAt: -1 }).limit(50).lean(),
    LearningPath.find({ ...filter, overall_progress_pct: { $lt: 100 } }).select('student subject overall_progress_pct topics updatedAt department').populate('student', 'name email department semester').sort({ updatedAt: -1 }).limit(50).lean(),
  ]);
  const visibleConversations = conversations
    .filter((conversation) => conversation.user && (!department || conversation.user.department === department))
    .map((conversation) => ({
      ...conversation,
      messages: conversation.messages.slice(-8),
    }));
  const activeWorkflows = workflows.map((workflow) => ({
    ...workflow,
    active_topic: workflow.topics.find((topic) => topic.status === 'in_progress') || workflow.topics.find((topic) => topic.status === 'pending') || null,
  }));
  return res.json({ success: true, data: { conversations: visibleConversations, active_workflows: activeWorkflows } });
});

const getAuditLog = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.action) filter.action = req.query.action;
  if (req.query.severity) filter.severity = req.query.severity;
  if (req.query.department) filter.department = req.query.department;
  const logs = await AuditLog.find(filter)
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(req.query.limit) || 200, 500))
    .populate('actor', 'name email role department')
    .lean();
  return res.json({ success: true, data: logs });
});

const getAiAvailability = catchAsync(async (_req, res) => {
  return res.json({ success: true, data: await getAvailability() });
});

const updateAiAvailability = catchAsync(async (req, res) => {
  const allowedFeatures = ['mock_test', 'learning_path', 'question_bank', 'practice_mcq', 'private_forum', 'booking_session', 'tutor_education'];
  const updates = {};
  if (typeof req.body.ai_enabled === 'boolean') updates.ai_enabled = req.body.ai_enabled;
  if (req.body.ai_resume_at !== undefined) updates.ai_resume_at = req.body.ai_resume_at || null;
  if (req.body.ai_message !== undefined) updates.ai_message = String(req.body.ai_message).trim();
  if (req.body.features && typeof req.body.features === 'object') {
    updates.features = {};
    allowedFeatures.forEach((feature) => {
      if (req.body.features[feature]) updates.features[feature] = {
        enabled: req.body.features[feature].enabled !== false,
        resume_at: req.body.features[feature].resume_at || null,
        message: String(req.body.features[feature].message || '').trim(),
      };
    });
  }
  return res.json({ success: true, data: await updateAvailability(updates, req.user.id) });
});

module.exports = { uploadTimetable, getTimetable, getUsers, createUser, updateUser, bulkImportUsers, deactivateUser, resetUserPassword, unlockTimetable, getDashboard, getStudentActivity, getAuditLog, getAiAvailability, updateAiAvailability };
