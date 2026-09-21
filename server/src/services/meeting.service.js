const { sendMail } = require('./mailer.service');
const { transporter, smtp } = require('../config/mailer');

const DEVELOPMENT_MEETING_LINKS = [
  'https://meet.google.com/kiq-opdz-rgi',
  'https://meet.google.com/tef-oojs-bue',
  'https://meet.google.com/wnw-niae-fzb',
];
const getDevelopmentMeetingLink = (sessionId) => {
  const value = String(sessionId || '').split('').reduce((total, character) => total + character.charCodeAt(0), 0);
  return DEVELOPMENT_MEETING_LINKS[value % DEVELOPMENT_MEETING_LINKS.length];
};
const makeFallbackLink = (sessionId) => getDevelopmentMeetingLink(sessionId);
const getConfiguredZoomLink = () => process.env.ZOOM_MEETING_URL || 'https://us05web.zoom.us/j/6358963924?pwd=Wdtkq10SDkMTN4uuaKzoxEAnRVe11z.1';

const createMeetingLink = async (session) => {
  const providerUrl = process.env.MEETING_API_URL;
  try {
    if (getConfiguredZoomLink()) {
      return { url: getConfiguredZoomLink(), platform: 'zoom', fallback: false };
    }
    if (providerUrl) {
      const response = await fetch(providerUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...(process.env.MEETING_API_TOKEN ? { authorization: `Bearer ${process.env.MEETING_API_TOKEN}` } : {}) },
        body: JSON.stringify({ subject: session.subject, topic: session.topic, scheduled_at: session.scheduled_at, duration_minutes: session.duration_minutes }),
      });
      if (!response.ok) throw new Error(`Meeting provider returned ${response.status}`);
      const data = await response.json();
      if (!data.url && !data.meeting_link) throw new Error('Meeting provider returned no link');
      return { url: data.url || data.meeting_link, platform: data.platform || 'other', fallback: false };
    }
    return { url: makeFallbackLink(session._id), platform: 'other', fallback: false };
  } catch (error) {
    const alertRecipient = process.env.IT_ALERT_EMAIL || smtp.from;
    await sendMail(alertRecipient, 'Meeting link generation failed', `<p>Meeting link generation failed for session ${session._id}.</p><p>${error.message}</p>`, `Meeting link generation failed for session ${session._id}: ${error.message}`).catch(() => {});
    return { url: makeFallbackLink(session._id), platform: 'other', fallback: true, error: error.message };
  }
};

module.exports = { createMeetingLink, getDevelopmentMeetingLink };
module.exports = { createMeetingLink, getDevelopmentMeetingLink, getConfiguredZoomLink };
