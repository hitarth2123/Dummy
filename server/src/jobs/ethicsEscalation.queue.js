const { Queue } = require('bullmq');
const Redis = require('ioredis');

const QUEUE_NAME = 'ethics-escalation-e04';
let queue;

const getConnection = () => {
  if (!process.env.REDIS_URL) return null;
  return new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
};

const getQueue = () => {
  const connection = getConnection();
  if (!connection) return null;
  if (!queue) queue = new Queue(QUEUE_NAME, { connection, defaultJobOptions: {
    attempts: 8,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { age: 86400, count: 1000 },
    removeOnFail: false,
  } });
  return queue;
};

const enqueueEthicsEscalation = async ({ flagId, department, category, studentId }) => {
  const ethicsQueue = getQueue();
  if (!ethicsQueue) {
    console.warn('[EthicsQueue] REDIS_URL is not configured; E-04 job was not enqueued.');
    return null;
  }
  const job = await ethicsQueue.add('dispatch-e04', {
    flagId: String(flagId),
    department,
    category,
    studentId: String(studentId),
  }, { jobId: `ethics-${String(flagId)}` });
  return job.id;
};

module.exports = { QUEUE_NAME, enqueueEthicsEscalation, getQueue };
