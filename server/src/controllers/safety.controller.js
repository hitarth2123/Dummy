const catchAsync = require('../utils/catchAsync');
const AuditLog = require('../models/AuditLog');
const EmergencyContact = require('../models/EmergencyContact');
const { escalateDistress } = require('../services/safety.service');

const fallbackContacts = [
  { type: 'hospital', name: 'Emergency medical service', phone: '108', address: 'India-wide emergency medical response' },
  { type: 'police', name: 'Police control room', phone: '100', address: 'India-wide police emergency response' },
  { type: 'fire', name: 'Fire and rescue', phone: '101', address: 'India-wide fire and rescue response' },
];

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

const emergencyContacts = catchAsync(async (req, res) => {
  const campus = req.query.campus || process.env.DEFAULT_CAMPUS;
  const directory = campus ? await EmergencyContact.findOne({ campus, department: null }).lean() : null;
  const contacts = directory ? Object.entries(directory).flatMap(([type, entries]) => (
    ['hospital', 'police', 'fire', 'ambulance', 'mental_health', 'other'].includes(type)
      ? entries.filter((entry) => entry.is_active !== false).map((entry) => ({ ...entry, type }))
      : []
  )) : fallbackContacts;
  return res.json({ success: true, data: { campus: campus || null, contacts, source: directory ? 'campus' : 'fallback' } });
});

const confirmDistress = catchAsync(async (req, res) => {
  if (req.body?.confirmed !== true) return res.status(400).json({ success: false, message: 'Explicit distress confirmation is required.' });
  req.confirmed = true;
  const result = await escalateDistress({ prompt: req.body.prompt || req.body.message, response: req.body.response, user: req.user, req });
  return res.status(202).json({ success: true, data: { ...result, status: 'help_on_the_way', dispatched_at: new Date().toISOString() } });
});

module.exports = { listDistressAlerts, emergencyContacts, confirmDistress };
