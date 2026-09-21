const { Worker } = require('bullmq');
const Redis = require('ioredis');
const EthicsFlag = require('../models/EthicsFlag');
const User = require('../models/User');
const { sendEthicsEscalation } = require('../services/mailer.service');
const { QUEUE_NAME } = require('./ethicsEscalation.queue');

const getConnection = () => (process.env.REDIS_URL ? new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null }) : null);

const dispatchE04 = async (job) => {
  const { flagId, department, category, studentId } = job.data;
  const flag = await EthicsFlag.findOne({ _id: flagId, hod_notified_at: null }).lean();
  if (!flag) return { skipped: true, reason: 'already-notified-or-missing' };

  const hods = await User.find({ role: 'hod', department, is_active: true }).select('email').lean();
  const addresses = [...new Set(hods.map((hod) => hod.email).filter(Boolean))];
  if (!addresses.length) throw new Error(`No active HOD email configured for department ${department}`);

  // E-04 is intentionally limited to student identifier and category; no prompt content is sent.
  await sendEthicsEscalation(addresses.join(','), {
    STUDENT_ID: studentId,
    CATEGORY: category,
  });
  await EthicsFlag.findOneAndUpdate(
    { _id: flagId, hod_notified_at: null },
    { hod_notified_at: new Date(), hod_notified_by: 'email', resolution_status: 'escalated' },
  );
  return { delivered: true, recipient_count: addresses.length };
};

const startEthicsEscalationWorker = () => {
  const connection = getConnection();
  if (!connection) {
    console.warn('[EthicsQueue] REDIS_URL is not configured; worker is disabled.');
    return null;
  }
  const worker = new Worker(QUEUE_NAME, dispatchE04, {
    connection,
    concurrency: 5,
  });
  worker.on('completed', (job) => console.log(`[EthicsQueue] E-04 delivered for job ${job.id}`));
  worker.on('failed', (job, error) => console.error(`[EthicsQueue] E-04 job ${job?.id || 'unknown'} failed: ${error.message}`));
  return worker;
};

if (require.main === module) startEthicsEscalationWorker();

module.exports = { dispatchE04, startEthicsEscalationWorker };
