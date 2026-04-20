'use strict';

const { Worker } = require('bullmq');
const { query }  = require('../config/database');
const { connection } = require('./queue');

const CRON_SCHEDULE = '0 2 * * *'; // 02:00 daily

/**
 * priceIndexJob — nightly worker that rebuilds the area_price_index table.
 *
 * Uses the rebuild_area_price_index() PostgreSQL function to recompute
 * avg/median/min/max prices per district and ward, and updates heat_level.
 */
const worker = new Worker(
  'price-index',
  async (job) => {
    console.info(`[PriceIndexJob] Starting rebuild (jobId=${job.id})`);
    const start = Date.now();

    await query('SELECT rebuild_area_price_index()');

    // Compute 30-day and 90-day price changes
    await query(`
      UPDATE area_price_index api
      SET price_change_30d = (
        SELECT
          CASE WHEN old30.avg_price_per_m2 > 0
            THEN ROUND(((api.avg_price_per_m2 - old30.avg_price_per_m2)::numeric /
                         old30.avg_price_per_m2) * 100, 2)
            ELSE NULL
          END
        FROM (
          SELECT AVG(li.price_per_m2)::BIGINT AS avg_price_per_m2
          FROM listings li
          JOIN lands l ON l.id = li.land_id
          WHERE l.district = api.district
            AND (api.ward IS NULL OR l.ward = api.ward)
            AND li.status = 'active'
            AND li.created_at < NOW() - INTERVAL '30 days'
        ) AS old30
      );
    `);

    await query(`
      UPDATE area_price_index api
      SET price_change_90d = (
        SELECT
          CASE WHEN old90.avg_price_per_m2 > 0
            THEN ROUND(((api.avg_price_per_m2 - old90.avg_price_per_m2)::numeric /
                         old90.avg_price_per_m2) * 100, 2)
            ELSE NULL
          END
        FROM (
          SELECT AVG(li.price_per_m2)::BIGINT AS avg_price_per_m2
          FROM listings li
          JOIN lands l ON l.id = li.land_id
          WHERE l.district = api.district
            AND (api.ward IS NULL OR l.ward = api.ward)
            AND li.status = 'active'
            AND li.created_at < NOW() - INTERVAL '90 days'
        ) AS old90
      );
    `);

    const duration = Date.now() - start;
    console.info(`[PriceIndexJob] Rebuild complete in ${duration}ms`);
    return { duration, completedAt: new Date().toISOString() };
  },
  {
    connection,
    concurrency: 1,
  }
);

worker.on('completed', (job, result) => {
  console.info(`[PriceIndexJob] Job ${job.id} completed:`, result);
});

worker.on('failed', (job, err) => {
  console.error(`[PriceIndexJob] Job ${job ? job.id : 'unknown'} failed:`, err.message);
});

/**
 * Schedule the nightly price-index rebuild.
 * @param {import('bullmq').Queue} priceIndexQueue
 */
async function schedulePriceIndexJob(priceIndexQueue) {
  // Remove any existing repeatable jobs and re-register to avoid duplicates on restart
  const repeatables = await priceIndexQueue.getRepeatableJobs();
  for (const r of repeatables) {
    await priceIndexQueue.removeRepeatableByKey(r.key);
  }

  await priceIndexQueue.add(
    'rebuild-price-index',
    {},
    {
      repeat:    { cron: CRON_SCHEDULE },
      removeOnComplete: 10,
      removeOnFail:     5,
    }
  );
  console.info(`[PriceIndexJob] Scheduled with cron: ${CRON_SCHEDULE}`);
}

module.exports = { worker, schedulePriceIndexJob };
