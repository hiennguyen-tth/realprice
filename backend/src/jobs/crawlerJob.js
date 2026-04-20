'use strict';

const { Worker } = require('bullmq');
const { pool }   = require('../config/database');
const { connection } = require('./queue');
const { runCrawl }   = require('../modules/crawler/crawler.service');
const crawlerConfig  = require('../modules/crawler/crawler.config');

/**
 * crawlerJob — scheduled worker that crawls real estate listings from
 * external sites (nhatot.com, batdongsan.com.vn) and saves them to DB.
 *
 * Schedule: configurable via CRAWLER_CRON env (default 03:00 daily).
 * Toggle:   CRAWLER_ENABLED=false to disable.
 */
const worker = new Worker(
  'crawler',
  async (job) => {
    if (!crawlerConfig.enabled) {
      console.info('[CrawlerJob] Crawler is disabled (CRAWLER_ENABLED=false)');
      return { skipped: true };
    }

    console.info(`[CrawlerJob] Starting crawl (jobId=${job.id}, name=${job.name})`);
    const start = Date.now();

    const client = await pool.connect();
    try {
      const summary = await runCrawl(client);
      const duration = Date.now() - start;

      console.info(
        `[CrawlerJob] Done in ${duration}ms — ` +
        `nhatot=${summary.nhatot}, bds=${summary.batdongsan}, ` +
        `inserted=${summary.inserted}, skipped=${summary.skipped}`
      );
      return { ...summary, duration, completedAt: new Date().toISOString() };
    } finally {
      client.release();
    }
  },
  { connection, concurrency: 1 }
);

worker.on('completed', (job, result) => {
  console.info(`[CrawlerJob] Job ${job.id} completed:`, result);
});

worker.on('failed', (job, err) => {
  console.error(`[CrawlerJob] Job ${job ? job.id : 'unknown'} failed:`, err.message);
});

/**
 * Schedule the nightly crawl.
 * @param {import('bullmq').Queue} crawlerQueue
 */
async function scheduleCrawlerJob(crawlerQueue) {
  if (!crawlerConfig.enabled) {
    console.info('[CrawlerJob] Crawler disabled — not scheduling');
    return;
  }

  // Clear existing repeatable jobs first
  const existing = await crawlerQueue.getRepeatableJobs();
  for (const r of existing) {
    await crawlerQueue.removeRepeatableByKey(r.key);
  }

  await crawlerQueue.add(
    'scheduled-crawl',
    {},
    {
      repeat: { cron: crawlerConfig.cronSchedule },
      removeOnComplete: 5,
      removeOnFail: 3,
    }
  );
  console.info(`[CrawlerJob] Scheduled with cron: ${crawlerConfig.cronSchedule}`);
}

module.exports = { worker, scheduleCrawlerJob };
