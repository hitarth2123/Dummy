const catchAsync = require('../utils/catchAsync');
const QuestionBank = require('../models/QuestionBank');
const LearningPath = require('../models/LearningPath');
const ExamTimetable = require('../models/ExamTimetable');
const MockTest = require('../models/MockTest');
const User = require('../models/User');
const dbmsQuestionBank = require('../dataset/dbms/dbms_question_bank.json');

const bundledDBMSQuestions = dbmsQuestionBank.sets.flatMap((set) => set.questions.map((question) => ({
  ...question,
  department: 'Computer Science',
  subject: dbmsQuestionBank.subject,
  year: set.year,
  set_name: set.set_name,
  is_verified: true,
})));

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
    const { upsertLearningPath } = require('../services/mockTest.service');
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
  const { subject, topic, status = 'completed' } = req.body;
  if (!subject || !topic) {
    return res.status(400).json({ success: false, message: 'Subject and topic are required.' });
  }
  if (!['in_progress', 'completed'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid topic status.' });
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

module.exports = { questionBank, toggleBookmark, learningPath, completeLearningPathTopic, dashboard, mockTestResults, mockTestHistory, getSubjects, getQuestionSets };
