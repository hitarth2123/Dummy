const catchAsync = require('../utils/catchAsync');
const QuestionBank = require('../models/QuestionBank');
const LearningPath = require('../models/LearningPath');
const ExamTimetable = require('../models/ExamTimetable');
const MockTest = require('../models/MockTest');
const User = require('../models/User');

const questionBank = catchAsync(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = 20;
  const filter = { department: req.department };
  ['subject', 'topic', 'year', 'difficulty'].forEach((field) => {
    if (req.query[field]) filter[field] = field === 'year' ? Number(req.query[field]) : req.query[field];
  });

  // Bookmark-only filter
  const user = await User.findById(req.user.id).select('bookmarked_questions').lean();
  const bookmarkedIds = (user?.bookmarked_questions || []).map((id) => String(id));
  if (req.query.bookmarked === 'true') {
    filter._id = { $in: user?.bookmarked_questions || [] };
  }

  const [questions, total] = await Promise.all([
    QuestionBank.find(filter).select('-correct_answer').sort({ year: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    QuestionBank.countDocuments(filter),
  ]);

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

const learningPath = catchAsync(async (req, res) => {
  const subjectFilter = req.query.subject;
  const filter = { student: req.user.id };
  if (subjectFilter) filter.subject = subjectFilter;

  let path = await LearningPath.findOne(filter).sort({ updatedAt: -1 }).lean();
  if (!path) {
    const { upsertLearningPath } = require('../services/mockTest.service');
    path = await upsertLearningPath({ user: { ...req.user, subject: subjectFilter }, mockScores: [] });
  }
  res.json({ success: true, data: path || { topics: [], overall_progress_pct: 0 } });
});

const dashboard = catchAsync(async (req, res) => {
  const [user, path, exams] = await Promise.all([
    User.findById(req.user.id).select('name enrolled_subjects weak_topics semester department lockout_until').lean(),
    LearningPath.findOne({ student: req.user.id }).sort({ updatedAt: -1 }).lean(),
    ExamTimetable.find({ department: req.department }).sort({ exam_date: 1 }).limit(10).lean(),
  ]);
  res.json({ success: true, data: { user, agenda: path?.topics?.slice(0, 5) || [], exams, lockout_active: Boolean(user?.lockout_until && user.lockout_until > new Date()) } });
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
    .select('_id subject score total_questions score_pct time_taken_sec submitted_at createdAt')
    .sort({ submitted_at: -1, createdAt: -1 })
    .limit(20)
    .lean();
  return res.json({ success: true, data: tests });
});

module.exports = { questionBank, toggleBookmark, learningPath, dashboard, mockTestResults, mockTestHistory };
