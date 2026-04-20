'use strict';

const { Queue, Worker, QueueEvents } = require('bullmq');
const config = require('../config');

const connection = {
  host:     config.bull.redis.host,
  port:     config.bull.redis.port,
  password: config.bull.redis.password || undefined,
};

/**
 * Named queues used by RealPrice background jobs.
 */
const queues = {
  priceIndex:  new Queue('price-index',  { connection }),
  moderation:  new Queue('moderation',   { connection }),
  crawler:     new Queue('crawler',      { connection }),
};

/**
 * Convenience wrapper: add a job to a named queue.
 * @param {string} queueName - 'price-index' | 'moderation'
 * @param {string} jobName
 * @param {object} data
 * @param {object} [opts]
 */
async function addJob(queueName, jobName, data, opts = {}) {
  const queue = queues[queueName] ?? queues[Object.keys(queues).find(k => k === queueName)];
  if (!queue) {
    throw new Error(`Unknown queue: ${queueName}. Available: ${Object.keys(queues).join(', ')}`);
  }
  return queue.add(jobName, data, opts);
}

module.exports = { queues, addJob, connection };
