const { Queue } = require('bullmq');
const Redis = require('ioredis');

const QUEUE_NAME = 'transactional-email';
let queue;

const getConnection = () => process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null })
  : null;

const getQueue = () => {
  const connection = getConnection();
  if (!connection) return null;
  if (!queue) {
    queue = new Queue(QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: 10,
        backoff: { type: 'exponential', delay: 30000, maxDelay: 3600000 },
        removeOnComplete: { age: 86400, count: 1000 },
        removeOnFail: false,
      },
    });
  }
  return queue;
};

const enqueueEmail = async ({ triggerId, to, subject, templateName, vars }) => {
  const emailQueue = getQueue();
  if (!emailQueue) return null;
  const job = await emailQueue.add(`dispatch-${triggerId}`, { triggerId, to, subject, templateName, vars });
  return job.id;
};

module.exports = { QUEUE_NAME, getQueue, enqueueEmail };
