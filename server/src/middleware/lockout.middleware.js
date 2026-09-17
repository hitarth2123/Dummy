const ExamTimetable = require('../models/ExamTimetable');

/**
 * lockout — blocks AI requests during the student's matching exam window.
 * Run after protect middleware so req.user is available.
 */
const lockout = async (req, res, next) => {
  try {
    if (req.originalUrl.startsWith('/api/safety/') || req.originalUrl.includes('/student/emergency')) return next();
    const subject = req.body?.subject || req.query?.subject || req.params?.subject;
    if (!subject) return next();
    const now = new Date();
    const studentId = String(req.user.student_id || req.user.id || req.user._id);
    const exam = await ExamTimetable.findOne({ student_id: studentId, subject, lockout_start: { $lte: now }, lockout_end: { $gt: now }, is_active: true, is_manually_unlocked: { $ne: true } }).select('lockout_end').lean();
    if (exam) return res.status(423).json({ message: 'AI features locked during your exam', unlocks_at: exam.lockout_end.toISOString() });
    return next();
  } catch (err) {
    return next(err);
  }
};

module.exports = { lockout };
