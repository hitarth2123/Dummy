const { Worker } = require('bullmq');
const Redis = require('ioredis');
const { QUEUE_NAME } = require('./email.queue');
const { sendMail, loadTemplate, loadTextTemplate } = require('../services/mailer.service');

const getConnection = () => process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null })
  : null;

const dispatchEmail = async (job) => {
  const { triggerId, to, subject, templateName, vars } = job.data;
  await sendMail(to, subject, loadTemplate(templateName, vars), loadTextTemplate(templateName, vars));
  return { delivered: true, triggerId };
};

const startEmailWorker = () => {
  const connection = getConnection();
  if (!connection) {
    console.warn('[EmailQueue] REDIS_URL is not configured; worker is disabled.');
    return null;
  }
  const worker = new Worker(QUEUE_NAME, dispatchEmail, {
    connection,
    concurrency: 10,
  });
  worker.on('failed', (job, error) => console.error(`[EmailQueue] retry trigger=${job?.data?.triggerId || 'unknown'} attempt=${job?.attemptsMade || 0}: ${error.message}`));
  worker.on('completed', (job) => console.log(`[EmailQueue] delivered trigger=${job.data.triggerId} job=${job.id}`));
  return worker;
};

if (require.main === module) startEmailWorker();

module.exports = { dispatchEmail, startEmailWorker };
