const catchAsync = require('../utils/catchAsync');
const ExamTimetable = require('../models/ExamTimetable');

const parseCsv = (input) => {
  const lines = String(input || '').trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return { rows: [], errors: [{ row: 1, message: 'CSV must include a header and at least one row.' }] };
  const headers = lines[0].split(',').map((header) => header.trim());
  const required = ['student_id', 'subject', 'exam_date', 'start_time', 'end_time'];
  const missing = required.filter((header) => !headers.includes(header));
  if (missing.length) return { rows: [], errors: [{ row: 1, message: `Missing columns: ${missing.join(', ')}` }] };
  const errors = [];
  const rows = lines.slice(1).map((line, index) => {
    const values = line.split(',').map((value) => value.trim());
    const row = Object.fromEntries(headers.map((header, valueIndex) => [header, values[valueIndex] || '']));
    const date = /^\d{4}-\d{2}-\d{2}$/.test(row.exam_date) ? new Date(`${row.exam_date}T00:00:00`) : null;
    const timePattern = /^\d{2}:\d{2}$/;
    if (!date || Number.isNaN(date.getTime()) || !timePattern.test(row.start_time) || !timePattern.test(row.end_time) || !row.subject || !row.student_id) {
      errors.push({ row: index + 2, message: 'Expected student_id, subject, exam_date YYYY-MM-DD, and start/end time HH:MM.' });
      return null;
    }
    const start = new Date(`${row.exam_date}T${row.start_time}:00`);
    const end = new Date(`${row.exam_date}T${row.end_time}:00`);
    if (end <= start) errors.push({ row: index + 2, message: 'end_time must be after start_time.' });
    return { student_id: row.student_id, subject: row.subject, exam_date: date, start_time: row.start_time, end_time: row.end_time, start, end };
  }).filter(Boolean);
  return { rows, errors };
};

const uploadTimetable = catchAsync(async (req, res) => {
  const csv = req.body.csv || req.body.content;
  const { rows, errors } = parseCsv(csv);
  if (errors.length) return res.status(400).json({ success: false, message: 'CSV contains invalid rows.', errors });
  const department = req.body.department || 'Computer Science';
  const semester = Number(req.body.semester) || 5;
  const academicYear = req.body.academic_year || `${new Date().getFullYear()}-${String(new Date().getFullYear() + 1).slice(-2)}`;
  const examType = req.body.exam_type || 'internal';
  const documents = rows.map((row) => ({ department, semester, academic_year: academicYear, exam_type: examType, subject: row.subject, subject_code: row.student_id, exam_date: row.exam_date, start_time: row.start_time, end_time: row.end_time, lockout_start: new Date(row.start.getTime() - 60 * 60 * 1000), lockout_end: new Date(row.end.getTime() + 60 * 60 * 1000), created_by: req.user.id }));
  const created = await ExamTimetable.insertMany(documents);
  return res.status(201).json({ success: true, data: created, errors: [] });
});

const getTimetable = catchAsync(async (req, res) => {
  const timetable = await ExamTimetable.find({ department: req.query.department || req.user.department }).sort({ exam_date: 1 }).lean();
  return res.json({ success: true, data: timetable });
});

module.exports = { uploadTimetable, getTimetable };
