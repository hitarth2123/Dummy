const catchAsync = require('../utils/catchAsync');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const FacultyAvailability = require('../models/FacultyAvailability');
const DoubtSession = require('../models/DoubtSession');

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
    timestamp: log.createdAt,
    student_id: log.actor_role === 'student' ? log.actor : undefined,
    request_summary: log.metadata?.prompt_length ? `LLM request (${log.metadata.prompt_length} chars)` : log.action,
    flag_category: log.metadata?.category,
    status: log.severity,
    action: log.action,
  })) });
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

module.exports = { auditLog, faculty };
