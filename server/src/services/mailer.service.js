const { transporter, smtp } = require('../config/mailer');

const sendMail = async (to, subject, html, text) => {
  if (!to || !subject || (!html && !text)) {
    throw new TypeError('to, subject, and html or text are required');
  }

  return transporter.sendMail({
    from: smtp.from,
    to,
    subject,
    html,
    text: text || undefined,
  });
};

/**
 * mailer.service.js
 * Sends transactional emails via Nodemailer using configured SMTP.
 * HTML templates are loaded from server/src/templates/email/.
 */
const fs = require('fs');
const path = require('path');
const TEMPLATE_DIR = path.join(__dirname, '../templates/email');
const { enqueueEmail } = require('../jobs/email.queue');

/**
 * loadTemplate — reads an HTML email template and replaces {{KEY}} placeholders.
 * @param {string} templateName - filename without extension e.g. 'session_confirmed'
 * @param {Object} vars         - key/value pairs for placeholder substitution
 * @returns {string} rendered HTML
 */
const renderTemplate = (templateName, extension, vars = {}) => {
  const filePath = path.join(TEMPLATE_DIR, `${templateName}.${extension}`);
  let content = fs.readFileSync(filePath, 'utf-8');
  Object.entries(vars).forEach(([key, val]) => {
    content = content.replaceAll(`{{${key}}}`, String(val ?? ''));
  });
  return content;
};

const loadTemplate = (templateName, vars = {}) => renderTemplate(templateName, 'html', vars);
const loadTextTemplate = (templateName, vars = {}) => renderTemplate(templateName, 'txt', vars);
const facultyRecipient = (recipient) => process.env.FACULTY_NOTIFICATION_EMAIL || recipient;

const sendTemplatedMail = async (to, subject, templateName, vars, triggerId) => {
  const jobId = await enqueueEmail({ triggerId, to, subject, templateName, vars });
  if (jobId) return { queued: true, jobId, triggerId };
  return sendMail(to, subject, loadTemplate(templateName, vars), loadTextTemplate(templateName, vars));
};

/**
 * Convenience senders for specific email types.
 */
const sendSessionConfirmed  = (to, vars) => sendTemplatedMail(to, 'Session Confirmed', 'session_confirmed', vars, 'E-01');
const sendFacultySessionConfirmed = (to, vars) => sendTemplatedMail(facultyRecipient(to), 'Session Confirmed', 'session_confirmed', vars, 'E-01');
const sendSessionDeclined   = (to, vars) => sendTemplatedMail(to, 'Session Declined', 'session_declined', vars, 'E-02');
const sendFacultyRequest    = (to, vars) => sendTemplatedMail(facultyRecipient(to), 'New Session Request', 'faculty_session_request', vars, 'E-03');
const sendEthicsEscalation  = (to, vars) => sendTemplatedMail(to, 'Ethics Alert', 'ethics_escalation', vars, 'E-04');
const sendGrievanceEscalation = (to, vars) => sendTemplatedMail(to, 'Grievance Update', 'grievance_escalation', vars, 'E-06');
const sendDistressAlert     = (to, vars) => sendTemplatedMail(to, 'Distress Alert', 'distress_alert', vars, 'E-07');
const sendHallucinationReport = (to, vars) => sendTemplatedMail(to, 'Hallucination Report', 'hallucination_report', vars, 'E-05');
const sendFeedbackReminder  = (to, vars) => sendTemplatedMail(to, 'Weekly Feedback Reminder', 'feedback_reminder', vars, 'E-08');

module.exports = {
  sendMail,
  loadTemplate,
  loadTextTemplate,
  sendSessionConfirmed,
  sendFacultySessionConfirmed,
  sendSessionDeclined,
  sendFacultyRequest,
  sendEthicsEscalation,
  sendGrievanceEscalation,
  sendDistressAlert,
  sendHallucinationReport,
  sendFeedbackReminder,
};
