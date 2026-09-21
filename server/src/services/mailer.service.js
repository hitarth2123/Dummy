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

const sendTemplatedMail = (to, subject, templateName, vars) => sendMail(to, subject, loadTemplate(templateName, vars), loadTextTemplate(templateName, vars));

/**
 * Convenience senders for specific email types.
 */
const sendSessionConfirmed  = (to, vars) => sendTemplatedMail(to, 'Session Confirmed', 'session_confirmed', vars);
const sendSessionDeclined   = (to, vars) => sendTemplatedMail(to, 'Session Declined', 'session_declined', vars);
const sendFacultyRequest    = (to, vars) => sendTemplatedMail(to, 'New Session Request', 'faculty_session_request', vars);
const sendEthicsEscalation  = (to, vars) => sendTemplatedMail(to, 'Ethics Alert', 'ethics_escalation', vars);
const sendGrievanceEscalation = (to, vars) => sendMail(to, 'Grievance Update', loadTemplate('grievance_escalation', vars));
const sendDistressAlert     = (to, vars) => sendMail(to, '⚠️ Distress Alert', loadTemplate('distress_alert', vars));
const sendHallucinationReport = (to, vars) => sendMail(to, 'Hallucination Report', loadTemplate('hallucination_report', vars));
const sendFeedbackReminder  = (to, vars) => sendMail(to, 'Weekly Feedback Reminder', loadTemplate('feedback_reminder', vars));

module.exports = {
  sendMail,
  loadTemplate,
  loadTextTemplate,
  sendSessionConfirmed,
  sendSessionDeclined,
  sendFacultyRequest,
  sendEthicsEscalation,
  sendGrievanceEscalation,
  sendDistressAlert,
  sendHallucinationReport,
  sendFeedbackReminder,
};
