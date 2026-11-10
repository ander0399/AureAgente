const { Queue } = require('bullmq');

const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  ...(process.env.NODE_ENV === 'production' && { tls: {} }),
};

const followUpQueue = new Queue('aure:followUp', { connection: redisConnection });

async function scheduleFollowUp({ userId, conversationId, jobType, delayMs, metadata }) {
  const jobId = `${jobType}:${userId}`;

  const existing = await followUpQueue.getJob(jobId);
  if (existing) await existing.remove();

  await followUpQueue.add(
    jobType,
    { userId, conversationId, jobType, metadata },
    { jobId, delay: delayMs, attempts: 2, backoff: { type: 'fixed', delay: 60000 } }
  );
}

async function cancelPendingFollowUps(userId, jobType) {
  const jobId = `${jobType}:${userId}`;
  const job = await followUpQueue.getJob(jobId);
  if (job) await job.remove();
}

module.exports = { followUpQueue, scheduleFollowUp, cancelPendingFollowUps };
