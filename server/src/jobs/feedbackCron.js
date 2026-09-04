/**
 * feedbackCron.js
 * Runs every Monday at 08:00 to send weekly feedback reminder emails to students.
 */
const cron = require('node-cron');
const User = require('../models/User');
const FeedbackForm = require('../models/FeedbackForm');
const { sendFeedbackReminder } = require('../services/mailer.service');

// Every Monday at 08:00
cron.schedule('0 8 * * 1', async () => {
  const now = new Date();
  const weekNumber = getISOWeek(now);
  const academicYear = getAcademicYear(now);

  try {
    const students = await User.find({ role: 'student', is_active: true }).select('email name department semester');

    for (const student of students) {
      const alreadySubmitted = await FeedbackForm.exists({
        student: student._id,
        week_number: weekNumber,
        academic_year: academicYear,
        is_submitted: true,
      });

      if (!alreadySubmitted) {
        await sendFeedbackReminder(student.email, {
          NAME: student.name,
          WEEK: weekNumber,
          YEAR: academicYear,
        });

        await FeedbackForm.findOneAndUpdate(
          { student: student._id, week_number: weekNumber, academic_year: academicYear },
          { reminder_sent_at: now },
          { upsert: false }
        );
      }
    }

    console.log(`[FeedbackCron] Reminders sent for week ${weekNumber}`);
  } catch (err) {
    console.error('[FeedbackCron] Error:', err.message);
  }
});

// ── Helpers ──────────────────────────────────────────────────────────────────
function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

function getAcademicYear(date) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  return m >= 7 ? `${y}-${String(y + 1).slice(2)}` : `${y - 1}-${String(y).slice(2)}`;
}

console.log('[FeedbackCron] Scheduled — runs every Monday at 08:00');
