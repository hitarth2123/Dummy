const catchAsync = require('../utils/catchAsync');
const AuditLog = require('../models/AuditLog');

const listDistressAlerts = catchAsync(async (req, res) => {
  const filter = { action: 'distress_escalated', resource_type: 'safety' };
  if (req.user.role !== 'admin') filter.department = req.user.department || req.user.dept;
  const alerts = await AuditLog.find(filter)
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('actor', 'name email department semester role')
    .lean();
  return res.json({ success: true, data: alerts });
});

module.exports = { listDistressAlerts };
