const catchAsync = require('../utils/catchAsync');
const FeedbackForm = require('../models/FeedbackForm');
const AppError = require('../utils/AppError');

const getWeek = (date = new Date()) => {
  const current = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  current.setUTCDate(current.getUTCDate() + 4 - (current.getUTCDay() || 7));
  const start = new Date(Date.UTC(current.getUTCFullYear(), 0, 1));
  return Math.ceil((((current - start) / 86400000) + 1) / 7);
};

const getAcademicYear = (date = new Date()) => {
  const year = date.getFullYear();
  return date.getMonth() >= 6 ? `${year}-${String(year + 1).slice(2)}` : `${year - 1}-${String(year).slice(2)}`;
};

const submit = catchAsync(async (req, res, next) => {
  const weekNumber = getWeek();
  const academicYear = getAcademicYear();
  const student = req.user;
  const existing = await FeedbackForm.exists({ student: student.id, week_number: weekNumber, academic_year: academicYear });
  if (existing) return next(new AppError('Feedback has already been submitted for this week.', 429));

  const feedback = await FeedbackForm.create({
    student: student.id,
    department: student.dept || student.department,
    week_number: weekNumber,
    academic_year: academicYear,
    semester: student.semester,
    ratings: req.body.ratings,
    comments: req.body.comments || '',
    subjects_covered: req.body.subjects_covered || student.enrolled_subjects || [],
    is_submitted: true,
    submitted_at: new Date(),
  });
  return res.status(201).json({ success: true, data: { id: feedback._id, week_number: weekNumber, academic_year: academicYear } });
});

const list = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.week) filter.week_number = Number(req.query.week);
  if (req.query.dept) filter.department = req.query.dept;
  if (req.query.min_rating) filter['ratings.score'] = { $gte: Number(req.query.min_rating) };
  if (req.user.role === 'hod') filter.department = req.user.dept || req.user.department;

  let feedbackQuery = FeedbackForm.find(filter).sort({ createdAt: -1 });
  if (req.user.role === 'admin') feedbackQuery = feedbackQuery.populate('student', 'name email department');
  const feedback = await feedbackQuery.lean();
  const rows = feedback.map((item) => ({
    ...item,
    student: req.user.role === 'admin' ? item.student : undefined,
    average_rating: item.ratings.reduce((sum, rating) => sum + rating.score, 0) / item.ratings.length,
  }));
  res.json({ success: true, data: rows });
});

const exportCsv = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.week) filter.week_number = Number(req.query.week);
  if (req.user.role === 'hod') filter.department = req.user.dept || req.user.department;
  const records = await FeedbackForm.find(filter).lean();
  const includeStudent = req.user.role === 'admin';
  const header = includeStudent ? 'student_id,department,week,academic_year,average_rating,comments' : 'department,week,academic_year,average_rating,comments';
  const lines = records.map((item) => {
    const average = item.ratings.reduce((sum, rating) => sum + rating.score, 0) / item.ratings.length;
    const values = [
      ...(includeStudent ? [item.student] : []), item.department, item.week_number, item.academic_year, average.toFixed(2), item.comments,
    ];
    return values.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',');
  });
  res.type('text/csv').attachment('feedback.csv').send([header, ...lines].join('\n'));
});

module.exports = { submit, list, exportCsv, getWeek, getAcademicYear };
