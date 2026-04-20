'use strict';

const express = require('express');
const { addJob } = require('../../jobs/queue');
const { query } = require('../../config/database');

const router = express.Router();

// POST /api/admin/crawler/trigger — manually trigger a crawl
router.post('/trigger', async (req, res, next) => {
  try {
    const job = await addJob('crawler', 'manual-crawl', { triggeredBy: 'admin' });
    res.json({ success: true, message: 'Crawl job queued', jobId: job.id });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/crawler/stats — crawl stats
router.get('/stats', async (req, res, next) => {
  try {
    const result = await query(`
      SELECT
        source,
        COUNT(*)::int          AS total,
        COUNT(land_id)::int    AS matched_to_land,
        MAX(crawled_at)        AS last_crawled,
        MIN(price)             AS min_price,
        MAX(price)             AS max_price
      FROM crawled_listings
      GROUP BY source
      ORDER BY source
    `);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    // Table might not exist yet
    res.json({ success: true, data: [], message: 'No crawled data yet' });
  }
});

// GET /api/admin/crawler/listings — browse crawled data
router.get('/listings', async (req, res, next) => {
  try {
    const { source, district, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const conditions = [];
    const values = [];

    if (source) {
      conditions.push(`source = $${values.length + 1}`);
      values.push(source);
    }
    if (district) {
      conditions.push(`district ILIKE $${values.length + 1}`);
      values.push(`%${district}%`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    values.push(Number(limit), offset);

    const [rows, count] = await Promise.all([
      query(`SELECT * FROM crawled_listings ${where} ORDER BY crawled_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`, values),
      query(`SELECT COUNT(*)::int AS total FROM crawled_listings ${where}`, values.slice(0, -2)),
    ]);

    res.json({
      success: true,
      data: rows.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count.rows[0]?.total ?? 0,
      },
    });
  } catch (err) {
    res.json({ success: true, data: [], pagination: { page: 1, limit: 20, total: 0 } });
  }
});

module.exports = router;
