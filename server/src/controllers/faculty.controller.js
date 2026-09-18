const catchAsync = require('../utils/catchAsync');
const FacultyAvailability = require('../models/FacultyAvailability');
const DoubtSession = require('../models/DoubtSession');
const User = require('../models/User');
const ProfileChangeRequest = require('../models/ProfileChangeRequest');
const { createMeetingLink, getConfiguredZoomLink } = require('../services/meeting.service');
const { sendSessionConfirmed, sendSessionDeclined, sendMail } = require('../services/mailer.service');

const getAvailability = catchAsync(async (req, res) => {
  const availability = await FacultyAvailability.findOneAndUpdate(
    { faculty: req.user.id },
    { $setOnInsert: { faculty: req.user.id, department: req.department } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).populate('slots.booked_by', 'name email').lean();
  return res.json({ success: true, data: availability });
});

const updateAvailability = catchAsync(async (req, res) => {
  const { slots = [], is_available = true, max_sessions_per_week, unavailable_dates, notes } = req.body;
  const availability = await FacultyAvailability.findOneAndUpdate(
    { faculty: req.user.id },
    { slots, is_available, max_sessions_per_week, unavailable_dates, notes, department: req.department },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  ).lean();
  return res.json({ success: true, data: availability });
});

const sessionRequests = catchAsync(async (req, res) => {
  const sessions = await DoubtSession.find({ faculty: req.user.id }).populate('student', 'name email semester').sort({ scheduled_at: 1 }).lean();
  return res.json({ success: true, data: sessions });
});

const profileChangeRequests = catchAsync(async (req, res) => {
  const requests = await ProfileChangeRequest.find({
    department: req.department,
    requester_role: 'student',
  })
    .populate('student', 'name email department semester specialization')
    .populate('reviewed_by', 'name')
    .sort({ status: 1, createdAt: -1 })
    .lean();
  return res.json({ success: true, data: requests });
});

const createProfileChangeRequest = catchAsync(async (req, res) => {
  const { change_field, proposed_value, reason } = req.body;
  if (!['name', 'email', 'department'].includes(change_field) || !proposed_value?.trim() || !reason?.trim()) return res.status(400).json({ success: false, message: 'Select a field, enter the requested value, and explain why.' });
  const pending = await ProfileChangeRequest.findOne({ student: req.user.id, requester_role: 'faculty', status: { $in: ['pending_hod', 'pending_admin'] } });
  if (pending) return res.status(409).json({ success: false, message: 'You already have a faculty settings request awaiting review.' });
  const request = await ProfileChangeRequest.create({ student: req.user.id, requester_role: 'faculty', department: req.department, change_field, proposed_value: proposed_value.trim(), requested_changes: `${change_field}: ${proposed_value.trim()}`, reason: reason.trim(), status: 'pending_hod', current_reviewer_role: 'hod' });
  return res.status(201).json({ success: true, data: request, message: 'Your settings request was sent to the HOD.' });
});

const reviewProfileChangeRequest = catchAsync(async (req, res) => {
  const { action, review_notes = '' } = req.body;
  if (!['approve', 'reject', 'escalate'].includes(action)) {
    return res.status(400).json({ success: false, message: 'Review action must be approve, reject, or escalate.' });
  }
  const request = await ProfileChangeRequest.findOne({
    _id: req.params.id,
    department: req.department,
    requester_role: 'student',
    status: { $in: ['pending_faculty', 'pending'] },
  })
    .populate('student', 'name email');
  if (!request) return res.status(404).json({ success: false, message: 'Profile change request not found.' });
  if (action === 'escalate') {
    request.status = 'pending_hod';
    request.current_reviewer_role = 'hod';
    request.escalation_history.push({ from_role: 'faculty', to_role: 'hod', by: req.user.id, note: review_notes.trim() });
    await request.save();
    return res.json({ success: true, data: request, message: 'Request escalated to the HOD.' });
  }

  request.status = action === 'approve' ? 'approved' : 'rejected';
  request.current_reviewer_role = null;
  request.reviewed_by = req.user.id;
  request.reviewed_at = new Date();
  request.review_notes = review_notes.trim();
  await request.save();

  await sendMail(
    request.student.email,
    `Profile change request ${request.status}`,
    `<p>Your profile change request has been <strong>${request.status}</strong> by faculty.</p>${request.review_notes ? `<p><strong>Faculty note:</strong> ${request.review_notes}</p>` : ''}`,
    `Your profile change request has been ${request.status} by faculty.${request.review_notes ? ` Faculty note: ${request.review_notes}` : ''}`,
  ).catch(() => {});
  return res.json({ success: true, data: request });
});

const updateSession = catchAsync(async (req, res) => {
  const session = await DoubtSession.findOne({ _id: req.params.id, faculty: req.user.id }).populate('student', 'name email').populate('faculty', 'name email');
  if (!session) return res.status(404).json({ success: false, message: 'Session request not found.' });
  const { action, decline_reason, faculty_notes } = req.body;
  if (faculty_notes !== undefined) session.faculty_notes = faculty_notes;
  if (action === 'decline') {
    session.status = 'declined';
    session.decline_reason = decline_reason || 'Faculty unavailable';
    await session.save();
    const day = session.scheduled_at.toLocaleDateString('en-US', { weekday: 'long' });
    const time = session.scheduled_at.toTimeString().slice(0, 5);
    await FacultyAvailability.updateOne(
      { faculty: req.user.id, 'slots.day_of_week': day, 'slots.start_time': time, 'slots.booked_by': session.student._id },
      { $set: { 'slots.$.is_booked': false, 'slots.$.booked_by': null } }
    );
    await sendSessionDeclined(session.student.email, { STUDENT_NAME: session.student.name, FACULTY_NAME: session.faculty.name, SUBJECT: session.subject, SCHEDULED_AT: session.scheduled_at.toLocaleString(), REASON: session.decline_reason }).catch(() => {});
  } else if (action === 'confirm') {
    const meeting = await createMeetingLink(session);
    session.status = 'confirmed';
    session.confirmed_at = new Date();
    session.meeting_link = meeting.url;
    session.meeting_platform = meeting.platform;
    await session.save();
    const vars = { STUDENT_NAME: session.student.name, FACULTY_NAME: session.faculty.name, SUBJECT: session.subject, TOPIC: session.topic || 'Doubt session', SCHEDULED_AT: session.scheduled_at.toLocaleString(), MEETING_LINK: meeting.url, NOTE: meeting.fallback ? 'Link generation failed at the provider; use the fallback meeting link.' : '' };
    await Promise.all([sendSessionConfirmed(session.student.email, vars), sendSessionConfirmed(session.faculty.email, vars)]).catch(() => {});
  } else {
    await session.save();
  }
  return res.json({ success: true, data: session });
});

const confirmSession = (req, res, next) => { req.body = { ...req.body, action: 'confirm' }; return updateSession(req, res, next); };
const declineSession = (req, res, next) => { req.body = { ...req.body, action: 'decline' }; return updateSession(req, res, next); };

const facultySessions = catchAsync(async (req, res) => {
  const sessions = await DoubtSession.find({ faculty: req.user.id }).populate('student', 'name email').sort({ scheduled_at: -1 }).lean();
  const configuredZoomLink = getConfiguredZoomLink();
  await Promise.all(sessions.filter((session) => session.status === 'confirmed' && session.meeting_link !== configuredZoomLink).map((session) => {
    session.meeting_link = configuredZoomLink;
    session.meeting_platform = 'zoom';
    return DoubtSession.updateOne({ _id: session._id }, { meeting_link: configuredZoomLink, meeting_platform: 'zoom' });
  }));
  return res.json({ success: true, data: sessions });
});

const dashboard = catchAsync(async (req, res) => {
  const [availability, pending, today] = await Promise.all([
    FacultyAvailability.findOne({ faculty: req.user.id }).lean(),
    DoubtSession.countDocuments({ faculty: req.user.id, status: 'pending' }),
    DoubtSession.find({ faculty: req.user.id, status: 'confirmed', scheduled_at: { $gte: new Date(new Date().setHours(0, 0, 0, 0)), $lt: new Date(new Date().setHours(23, 59, 59, 999)) } }).populate('student', 'name').sort({ scheduled_at: 1 }).lean(),
  ]);
  return res.json({ success: true, data: { availability, pending_requests: pending, today_sessions: today } });
});

module.exports = { getAvailability, updateAvailability, sessionRequests, profileChangeRequests, createProfileChangeRequest, reviewProfileChangeRequest, updateSession, confirmSession, declineSession, facultySessions, dashboard };
