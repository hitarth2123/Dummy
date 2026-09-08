const catchAsync = require('../utils/catchAsync');
const QuestionBank = require('../models/QuestionBank');
const LearningPath = require('../models/LearningPath');
const ExamTimetable = require('../models/ExamTimetable');
const User = require('../models/User');

const questionBank = catchAsync(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = 20;
  const filter = { department: req.department };
  ['subject', 'topic', 'year', 'difficulty'].forEach((field) => {
    if (req.query[field]) filter[field] = field === 'year' ? Number(req.query[field]) : req.query[field];
  });
  const [questions, total] = await Promise.all([
    QuestionBank.find(filter).select('-correct_answer').sort({ year: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    QuestionBank.countDocuments(filter),
  ]);
  res.json({ success: true, data: { questions, pagination: { page, limit, total, pages: Math.ceil(total / limit) } } });
});

const learningPath = catchAsync(async (req, res) => {
  const path = await LearningPath.findOne({ student: req.user.id, department: req.department }).sort({ updatedAt: -1 }).lean();
  res.json({ success: true, data: path || { topics: [], overall_progress_pct: 0 } });
});

const dashboard = catchAsync(async (req, res) => {
  const [user, path, exams] = await Promise.all([
    User.findById(req.user.id).select('name enrolled_subjects weak_topics semester department lockout_until').lean(),
    LearningPath.findOne({ student: req.user.id, department: req.department }).sort({ updatedAt: -1 }).lean(),
    ExamTimetable.find({ department: req.department }).sort({ exam_date: 1 }).limit(10).lean(),
  ]);
  res.json({ success: true, data: { user, agenda: path?.topics?.slice(0, 3) || [], exams, lockout_active: Boolean(user?.lockout_until && user.lockout_until > new Date()) } });
});

module.exports = { questionBank, learningPath, dashboard };
