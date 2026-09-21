const catchAsync = require('../utils/catchAsync');
const QuestionBank = require('../models/QuestionBank');
const LearningPath = require('../models/LearningPath');
const ExamTimetable = require('../models/ExamTimetable');
const MockTest = require('../models/MockTest');
const User = require('../models/User');
const ProfileChangeRequest = require('../models/ProfileChangeRequest');
const PracticeAttempt = require('../models/PracticeAttempt');
const DoubtSession = require('../models/DoubtSession');
const FacultyAvailability = require('../models/FacultyAvailability');
const { sendFacultyRequest, sendMail } = require('../services/mailer.service');
const { getConfiguredZoomLink, getDevelopmentMeetingLink } = require('../services/meeting.service');
const dbmsQuestionBank = require('../dataset/dbms/dbms_question_bank.json');
const { curriculum, getSemester, flattenSubjects } = require('../constants/curriculum');

const bundledDBMSQuestions = dbmsQuestionBank.sets.flatMap((set) => set.questions.map((question) => ({
  ...question,
  department: 'Computer Science',
  subject: dbmsQuestionBank.subject,
  year: set.year,
  set_name: set.set_name,
  is_verified: true,
})));

const profileFields = 'name email role department course semester specialization enrolled_subjects';

const getProfile = catchAsync(async (req, res) => {
  const profile = await User.findById(req.user.id).select(profileFields).lean();
  if (!profile) return res.status(404).json({ success: false, message: 'Student profile not found.' });
  return res.json({ success: true, data: profile });
});

const createProfileChangeRequest = catchAsync(async (req, res) => {
  const { change_field, proposed_value, reason } = req.body;
  const allowedFields = ['name', 'email', 'department', 'course', 'semester', 'specialization'];
  if (!allowedFields.includes(change_field) || !proposed_value?.trim() || !reason?.trim()) {
    return res.status(400).json({ success: false, message: 'Select a field, enter the requested change, and explain why.' });
  }
  const requestedChanges = `${change_field}: ${proposed_value.trim()}`;

  const pendingRequest = await ProfileChangeRequest.findOne({ student: req.user.id, status: { $in: ['pending_faculty', 'pending_hod', 'pending_admin'] } });
  if (pendingRequest) {
    return res.status(409).json({ success: false, message: 'You already have a profile change request awaiting faculty review.' });
  }

  const request = await ProfileChangeRequest.create({
    student: req.user.id,
    requester_role: 'student',
    department: req.department,
    change_field,
    proposed_value: proposed_value.trim(),
    requested_changes: requestedChanges,
    reason: reason.trim(),
  });
  const student = await User.findById(req.user.id).select('name email department').lean();
  const faculty = await User.find({ role: 'faculty', department: req.department, is_active: true }).select('email').lean();
  const addresses = faculty.map((member) => member.email).filter(Boolean).join(',');
  if (addresses) {
    await sendMail(
      addresses,
      'Student profile change request',
      `<p>${student?.name || 'A student'} submitted a profile change request.</p><p><strong>What to change:</strong> ${requestedChanges}</p><p><strong>Why:</strong> ${reason.trim()}</p><p>Please review it in AI Buddy.</p>`,
      `Student profile change request from ${student?.name || 'a student'}\n\nWhat to change: ${requestedChanges}\nWhy: ${reason.trim()}\n\nPlease review it in AI Buddy.`,
    ).catch(() => {});
  }
  return res.status(201).json({ success: true, data: request, message: 'Your request was sent to the department faculty.' });
});

const profileChangeRequests = catchAsync(async (req, res) => {
  const requests = await ProfileChangeRequest.find({ student: req.user.id }).sort({ createdAt: -1 }).lean();
  return res.json({ success: true, data: requests });
});

const questionBank = catchAsync(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = 20;
  const filter = { department: req.department };
  ['subject', 'topic', 'year', 'difficulty'].forEach((field) => {
    if (req.query[field]) filter[field] = field === 'year' ? Number(req.query[field]) : req.query[field];
  });

  // Set-wise filter
  if (req.query.set_name) {
    filter.set_name = req.query.set_name;
  }

  // Bookmark-only filter
  const user = await User.findById(req.user.id).select('bookmarked_questions').lean();
  const bookmarkedIds = (user?.bookmarked_questions || []).map((id) => String(id));
  if (req.query.bookmarked === 'true') {
    filter._id = { $in: user?.bookmarked_questions || [] };
  }

  let questions;
  let total;
  const includeAnswers = req.query.include_answers === 'true';
  try {
    [questions, total] = await Promise.all([
      QuestionBank.find(filter).select(includeAnswers ? '' : '-correct_answer').sort({ year: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      QuestionBank.countDocuments(filter),
    ]);
  } catch (error) {
    questions = [];
    total = 0;
  }

  if (total === 0 && (!filter.subject || filter.subject === 'DBMS')) {
    const fallbackQuestions = bundledDBMSQuestions.filter((question) => (
      (!filter.set_name || question.set_name === filter.set_name)
      && (!filter.difficulty || question.difficulty === filter.difficulty)
    ));
    total = fallbackQuestions.length;
    questions = fallbackQuestions.slice((page - 1) * limit, page * limit);
  }

  // Attach bookmark status to each question
  const questionsWithBookmarks = questions.map((q) => ({
    ...q,
    is_bookmarked: bookmarkedIds.includes(String(q._id)),
  }));

  res.json({ success: true, data: { questions: questionsWithBookmarks, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } });
});

const toggleBookmark = catchAsync(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(req.user.id).select('bookmarked_questions');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const idx = user.bookmarked_questions.findIndex((qId) => String(qId) === id);
  if (idx === -1) {
    user.bookmarked_questions.push(id);
  } else {
    user.bookmarked_questions.splice(idx, 1);
  }
  await user.save();
  return res.json({ success: true, data: { bookmarked: idx === -1, bookmarked_questions: user.bookmarked_questions } });
});

const getSubjects = catchAsync(async (req, res) => {
  const dbSubjects = await QuestionBank.distinct('subject', { department: req.department }).catch(() => []);
  const allDbSubjects = dbSubjects.length ? dbSubjects : await QuestionBank.distinct('subject').catch(() => []);
  const defaultSubjects = ['DBMS', 'Operating Systems', 'Computer Networks', 'Data Structures', 'Software Engineering'];
  const user = await User.findById(req.user.id).select('enrolled_subjects').lean();
  const enrolled = user?.enrolled_subjects || [];
  const subjects = [...new Set([...enrolled, ...allDbSubjects, ...defaultSubjects])].filter(Boolean);
  return res.json({ success: true, data: subjects });
});

const getCurriculum = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id).select('course department semester specialization enrolled_subjects').lean();
  const semester = getSemester(user?.semester || 5);
  const selectedSpecialization = user?.specialization || 'Common Core';
  const subjects = flattenSubjects(semester).filter((subject) => (
    selectedSpecialization === 'Common Core' || subject.specialization === selectedSpecialization
  ));
  return res.json({ success: true, data: {
    course: user?.course || curriculum.course,
    department: user?.department || req.department,
    semester: user?.semester || 5,
    specialization: selectedSpecialization,
    catalog: curriculum.semesters,
    semesters: curriculum.semesters.map(({ number, title, specializations }) => ({ number, title, specializations: specializations.map(({ name }) => name) })),
    subjects,
    enrolled_subjects: user?.enrolled_subjects || [],
  } });
});

const getQuestionSets = catchAsync(async (req, res) => {
  const subjectFilter = req.query.subject;
  const filter = {};
  if (subjectFilter) filter.subject = subjectFilter;
  if (req.department) filter.department = req.department;

  let result = [];
  try {
    const sets = await QuestionBank.aggregate([
      { $match: { ...filter, set_name: { $ne: null, $exists: true } } },
      { $group: { _id: '$set_name', year: { $first: '$year' }, count: { $sum: 1 }, subject: { $first: '$subject' } } },
      { $sort: { year: -1, _id: 1 } },
    ]);
    result = sets.map((s) => ({ set_name: s._id, year: s.year, question_count: s.count, subject: s.subject }));
  } catch (error) {
    result = [];
  }

  if (result.length === 0 && (!subjectFilter || subjectFilter === 'DBMS')) {
    result = dbmsQuestionBank.sets.map((set) => ({
      set_name: set.set_name,
      year: set.year,
      question_count: set.questions.length,
      subject: dbmsQuestionBank.subject,
    }));
  }
  return res.json({ success: true, data: result });
});

const learningPath = catchAsync(async (req, res) => {
  const subjectFilter = req.query.subject;
  const filter = { student: req.user.id };
  if (subjectFilter) filter.subject = subjectFilter;

  let path = await LearningPath.findOne(filter).sort({ updatedAt: -1 }).lean();
  if (!path) {
    // Fetch full user from DB to ensure we have department, semester, etc.
    const fullUser = await User.findById(req.user.id).select('name department dept semester enrolled_subjects weak_topics').lean();
    const { upsertLearningPath } = require('../services/learningPath.service');
    path = await upsertLearningPath({
      user: {
        id: req.user.id,
        dept: fullUser?.department || fullUser?.dept || req.department || 'BTech',
        department: fullUser?.department || fullUser?.dept || req.department || 'BTech',
        semester: fullUser?.semester || 5,
        enrolled_subjects: fullUser?.enrolled_subjects || [],
        weak_topics: fullUser?.weak_topics || [],
        subject: subjectFilter,
      },
      mockScores: [],
    });
  }
  res.json({ success: true, data: path || { topics: [], overall_progress_pct: 0 } });
});

const completeLearningPathTopic = catchAsync(async (req, res) => {
  const { subject, topic, status = 'completed', quiz_score_pct } = req.body;
  if (!subject || !topic) {
    return res.status(400).json({ success: false, message: 'Subject and topic are required.' });
  }
  if (!['in_progress', 'completed'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid topic status.' });
  }
  if (status === 'completed' && Number(quiz_score_pct) < 80) {
    return res.status(422).json({ success: false, message: 'Score at least 80% in the topic MCQ checkpoint before marking it done.' });
  }

  const path = await LearningPath.findOne({ student: req.user.id, subject });
  if (!path) return res.status(404).json({ success: false, message: 'Learning path not found.' });

  const selectedTopic = path.topics.find((item) => item.topic === topic);
  if (!selectedTopic) return res.status(404).json({ success: false, message: 'Topic not found in learning path.' });

  selectedTopic.status = status;
  selectedTopic.completed_at = status === 'completed' ? new Date() : null;
  const completedCount = path.topics.filter((item) => item.status === 'completed').length;
  path.overall_progress_pct = path.topics.length ? Math.round((completedCount / path.topics.length) * 100) : 0;
  await path.save();

  return res.json({ success: true, data: selectedTopic, overall_progress_pct: path.overall_progress_pct });
});

const dashboard = catchAsync(async (req, res) => {
  const [user, path, exams] = await Promise.all([
    User.findById(req.user.id).select('name enrolled_subjects weak_topics semester department lockout_until').lean(),
    LearningPath.findOne({ student: req.user.id }).sort({ updatedAt: -1 }).lean(),
    ExamTimetable.find({ department: req.department }).sort({ exam_date: 1 }).limit(10).lean(),
  ]);
  res.json({ success: true, data: { user, agenda: path?.topics?.slice(0, 5) || [], exams, lockout_active: Boolean(user?.lockout_until && user.lockout_until > new Date()) } });
});

const listFaculty = catchAsync(async (req, res) => {
  const faculty = await User.find({ role: 'faculty', department: req.department, is_active: true }).select('name email department subject_expertise').lean();
  const availability = await FacultyAvailability.find({ faculty: { $in: faculty.map((item) => item._id) }, is_available: true }).lean();
  const byFaculty = new Map(availability.map((item) => [String(item.faculty), item]));
  return res.json({ success: true, data: faculty.map((item) => ({ ...item, availability: byFaculty.get(String(item._id)) || null })) });
});

const bookSession = catchAsync(async (req, res) => {
  const { faculty_id, subject, topic, description, scheduled_at, duration_minutes = 30 } = req.body;
  if (!faculty_id || !subject || !description || !scheduled_at) return res.status(400).json({ success: false, message: 'Faculty, subject, description, and scheduled time are required.' });
  const faculty = await User.findOne({ _id: faculty_id, role: 'faculty', department: req.department, is_active: true }).lean();
  if (!faculty) return res.status(404).json({ success: false, message: 'Faculty member not found in your department.' });
  const scheduled = new Date(scheduled_at);
  if (Number.isNaN(scheduled.getTime()) || scheduled <= new Date()) return res.status(400).json({ success: false, message: 'Scheduled time must be a valid future date.' });
  const availability = await FacultyAvailability.findOne({ faculty: faculty_id, department: req.department, is_available: true }).lean();
  const day = scheduled.toLocaleDateString('en-US', { weekday: 'long' });
  const time = scheduled.toTimeString().slice(0, 5);
  const slot = availability?.slots?.find((item) => item.day_of_week === day && !item.is_booked && item.start_time <= time && item.end_time > time);
  const isDevelopmentTest = process.env.NODE_ENV !== 'production' && req.body.test_mode === true;
  if (!slot && !isDevelopmentTest) return res.status(409).json({ success: false, message: 'This faculty member is not available at that time.' });
  const student = await User.findById(req.user.id).select('name').lean();
  if (slot) {
    const reserved = await FacultyAvailability.findOneAndUpdate(
      { faculty: faculty_id, department: req.department, is_available: true, 'slots._id': slot._id, 'slots.is_booked': false },
      { $set: { 'slots.$.is_booked': true, 'slots.$.booked_by': req.user.id } },
      { new: true }
    ).lean();
    if (!reserved) return res.status(409).json({ success: false, message: 'This time slot was just booked by another student. Please choose another slot.' });
  }
  let session;
  try {
    session = await DoubtSession.create({ student: req.user.id, faculty: faculty_id, department: req.department, subject, topic, description, scheduled_at: scheduled, duration_minutes });
  } catch (error) {
    if (slot) await FacultyAvailability.updateOne({ faculty: faculty_id, 'slots._id': slot._id, 'slots.booked_by': req.user.id }, { $set: { 'slots.$.is_booked': false, 'slots.$.booked_by': null } });
    throw error;
  }
  await sendFacultyRequest(faculty.email, { FACULTY_NAME: faculty.name, STUDENT_NAME: student?.name || 'Student', SUBJECT: subject, TOPIC: topic || 'General doubt', DESCRIPTION: description, SCHEDULED_AT: scheduled.toLocaleString() }).catch((error) => console.error(`[Mailer] Faculty request notification failed: ${error.message}`));
  return res.status(201).json({ success: true, data: session });
});

const studentSessions = catchAsync(async (req, res) => {
  const sessions = await DoubtSession.find({ student: req.user.id }).populate('faculty', 'name email subject_expertise').sort({ scheduled_at: -1 }).lean();
  const configuredZoomLink = getConfiguredZoomLink();
  await Promise.all(sessions.filter((session) => session.status === 'confirmed' && session.meeting_link !== configuredZoomLink).map((session) => {
    session.meeting_link = configuredZoomLink;
    session.meeting_platform = 'zoom';
    return DoubtSession.updateOne({ _id: session._id }, { meeting_link: configuredZoomLink, meeting_platform: 'zoom' });
  }));
  const legacySessions = sessions.filter((session) => session.meeting_link && session.meeting_link.startsWith('https://meet.google.com/'));
  await Promise.all(legacySessions.map((session) => {
    const meetingLink = getDevelopmentMeetingLink(session._id);
    session.meeting_link = meetingLink;
    session.meeting_platform = 'other';
    return DoubtSession.updateOne({ _id: session._id }, { meeting_link: meetingLink, meeting_platform: 'other' });
  }));
  return res.json({ success: true, data: sessions });
});

const mockTestResults = catchAsync(async (req, res) => {
  const test = await MockTest.findOne({ _id: req.params.id, student: req.user.id, status: 'completed' })
    .populate('questions.question')
    .lean();
  if (!test) return res.status(404).json({ success: false, message: 'Mock test not found or not yet submitted.' });
  return res.json({ success: true, data: test });
});

const mockTestHistory = catchAsync(async (req, res) => {
  const tests = await MockTest.find({ student: req.user.id, status: 'completed' })
    .select('_id subject topic questions.topic score total_questions score_pct time_taken_sec submitted_at createdAt')
    .sort({ submitted_at: -1, createdAt: -1 })
    .limit(20)
    .lean();
  const history = tests.map(({ questions, ...test }) => ({
    ...test,
    topic: test.topic || questions?.find((question) => question.topic)?.topic || test.subject,
  }));
  return res.json({ success: true, data: history });
});

const savePracticeAttempt = catchAsync(async (req, res) => {
  const { subject = '', topic, score, total } = req.body;
  const numericScore = Number(score);
  const numericTotal = Number(total);
  if (!topic || !Number.isFinite(numericScore) || !Number.isFinite(numericTotal) || numericTotal < 1) {
    return res.status(400).json({ success: false, message: 'topic, score, and total are required.' });
  }
  const attempt = await PracticeAttempt.create({
    student: req.user.id,
    department: req.department || req.user.dept || req.user.department,
    subject,
    topic,
    score: numericScore,
    total: numericTotal,
    score_pct: Math.round((numericScore / numericTotal) * 100),
  });
  return res.status(201).json({ success: true, data: attempt });
});

const practiceAttemptHistory = catchAsync(async (req, res) => {
  const attempts = await PracticeAttempt.find({ student: req.user.id }).sort({ createdAt: -1 }).limit(50).lean();
  return res.json({ success: true, data: attempts });
});

module.exports = { getProfile, createProfileChangeRequest, profileChangeRequests, questionBank, toggleBookmark, learningPath, completeLearningPathTopic, dashboard, listFaculty, bookSession, studentSessions, mockTestResults, mockTestHistory, savePracticeAttempt, practiceAttemptHistory, getSubjects, getCurriculum, getQuestionSets };
