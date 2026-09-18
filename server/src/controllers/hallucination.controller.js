const HallucinationReport = require('../models/HallucinationReport');
const User = require('../models/User');
const { sendHallucinationReport } = require('../services/mailer.service');
const catchAsync = require('../utils/catchAsync');

const createReport = catchAsync(async (req, res) => {
  const { audit_log_ref, original_prompt, hallucinated_response, correct_response, category, severity, subject, topic, llm_model } = req.body;
  if (!audit_log_ref || !original_prompt || !hallucinated_response || !category || !severity) {
    return res.status(400).json({ success: false, message: 'audit_log_ref, original_prompt, hallucinated_response, category, and severity are required.' });
  }

  const report = await HallucinationReport.create({
    reported_by: req.user.id,
    department: req.user.department,
    audit_log_ref,
    original_prompt,
    hallucinated_response,
    correct_response,
    category,
    severity,
    subject,
    topic,
    llm_model,
  });

  const recipients = await User.find({
    is_active: true,
    email: { $exists: true, $ne: '' },
    $or: [
      { role: 'admin' },
      { role: 'hod', department: req.user.department },
    ],
  }).select('email').lean();
  const addresses = [...new Set([
    process.env.HALLUCINATION_RECIPIENT_EMAIL,
    ...recipients.map((recipient) => recipient.email),
  ].filter(Boolean))];

  if (addresses.length) {
    await sendHallucinationReport(addresses.join(','), {
      STUDENT_ID: req.user.institution_id || req.user.id,
      GRIEVANCE_REF: `HALL-${report._id}`,
    });
    await HallucinationReport.findByIdAndUpdate(report._id, { vendor_notified: true, vendor_notified_at: new Date() });
  }

  return res.status(201).json({ success: true, data: report });
});

module.exports = { createReport };
