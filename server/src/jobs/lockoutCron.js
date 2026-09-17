/**
 * lockoutCron.js
 * Runs every 15 minutes to validate active exam lockout windows.
 */
const cron = require('node-cron');
const ExamTimetable = require('../models/ExamTimetable');
const { isDatabaseReady } = require('../config/db');

const runLockoutSweep = async (now = new Date()) => {
  if (!isDatabaseReady()) {
    console.warn('[LockoutCron] Skipped: MongoDB is not connected.');
    return [];
  }
  return ExamTimetable.find({
      lockout_start: { $lte: now },
      lockout_end:   { $gte: now },
      is_active: true,
      is_manually_unlocked: { $ne: true },
    }).select('student_id subject lockout_start lockout_end');
};

cron.schedule('*/15 * * * *', async () => {
  try {
    const activeExams = await runLockoutSweep();
    console.log(`[LockoutCron] Active lockout entries: ${activeExams.length}`);
  } catch (err) {
    console.error('[LockoutCron] Error:', err.message);
  }
});

console.log('[LockoutCron] Scheduled — runs every 15 minutes');

module.exports = { runLockoutSweep };
