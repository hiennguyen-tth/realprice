'use strict';

require('dotenv').config();

const http   = require('http');
const app    = require('./app');
const config = require('./config');
const { pool }           = require('./config/database');
const { getRedisClient, disconnectRedis } = require('./config/redis');
const { queues }         = require('./jobs/queue');
const { schedulePriceIndexJob } = require('./jobs/priceIndexJob');
const { scheduleCrawlerJob }    = require('./jobs/crawlerJob');

// Import workers so they register and start listening
require('./jobs/moderationJob');
require('./jobs/crawlerJob');

const server = http.createServer(app);

/**
 * Verify database and Redis connectivity before accepting traffic.
 */
async function checkConnections() {
  // PostgreSQL
  const client = await pool.connect();
  await client.query('SELECT 1');
  client.release();
  console.info('[Server] PostgreSQL connection OK');

  // Redis
  await getRedisClient();
  console.info('[Server] Redis connection OK');
}

/**
 * Start the HTTP server and background jobs.
 */
async function start() {
  try {
    await checkConnections();

    // Schedule nightly price-index rebuild
    await schedulePriceIndexJob(queues.priceIndex);

    // Schedule daily crawler
    await scheduleCrawlerJob(queues.crawler);

    server.listen(config.server.port, () => {
      console.info(
        `[Server] RealPrice backend running on port ${config.server.port} ` +
        `(${config.env})`
      );
    });
  } catch (err) {
    console.error('[Server] Startup failed:', err.message);
    process.exit(1);
  }
}

// ============================================================
// Graceful shutdown
// ============================================================
async function shutdown(signal) {
  console.info(`[Server] ${signal} received — shutting down gracefully`);

  server.close(async () => {
    console.info('[Server] HTTP server closed');

    // Close BullMQ queues
    for (const [name, queue] of Object.entries(queues)) {
      await queue.close();
      console.info(`[Server] Queue '${name}' closed`);
    }

    // Disconnect Redis
    await disconnectRedis();

    // Close pg pool
    await pool.end();
    console.info('[Server] PostgreSQL pool closed');

    process.exit(0);
  });

  // Force exit after 10s if shutdown takes too long
  setTimeout(() => {
    console.error('[Server] Graceful shutdown timed out — forcing exit');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  console.error('[Server] Unhandled rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[Server] Uncaught exception:', err);
  process.exit(1);
});

start();

module.exports = server; // exported for testing
