/**
 * lockoutCron.js
 * Runs every minute to check ExamTimetable and lock/unlock student accounts.
 */
const cron = require('node-cron');
const ExamTimetable = require('../models/ExamTimetable');
const User = require('../models/User');
const { isDatabaseReady } = require('../config/db');

// Run every minute
cron.schedule('* * * * *', async () => {
  if (!isDatabaseReady()) {
    console.warn('[LockoutCron] Skipped: MongoDB is not connected.');
    return;
  }
  const now = new Date();

  try {
    // Find active exams where now is within the lockout window
    const activeExams = await ExamTimetable.find({
      lockout_start: { $lte: now },
      lockout_end:   { $gte: now },
      is_active: true,
    }).select('department semester lockout_end');

    for (const exam of activeExams) {
      await User.updateMany(
        { department: exam.department, role: 'student', lockout_until: { $lt: exam.lockout_end } },
        { lockout_until: exam.lockout_end }
      );
    }

    // Unlock: remove lockout_until for students whose lockout has passed
    await User.updateMany(
      { role: 'student', lockout_until: { $lte: now } },
      { lockout_until: null }
    );
  } catch (err) {
    console.error('[LockoutCron] Error:', err.message);
  }
});

console.log('[LockoutCron] Scheduled — runs every minute');
