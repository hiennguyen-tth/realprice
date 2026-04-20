'use strict';

const { Router }   = require('express');
const { query: db } = require('./config/database');
const { cacheMiddleware } = require('./middleware/cache');
const { parsePagination, buildPagination } = require('./utils/formatUtils');
const LandRepository    = require('./modules/land/land.repository');
const ListingRepository = require('./modules/listing/listing.repository');

const landRepo    = new LandRepository(db);
const listingRepo = new ListingRepository(db);

const router = Router();

/**
 * GET /api/search
 * Unified search across lands and listings.
 * Query params: q, type (land|listing), minPrice, maxPrice, page, limit
 */
router.get('/', cacheMiddleware(60), async (req, res, next) => {
  try {
    const { q, type, minPrice, maxPrice } = req.query;
    const { page, limit, offset } = parsePagination(req.query);

    if (!q || String(q).trim().length < 2) {
      return res.status(400).json({
        success: false,
        code:    'VALIDATION_ERROR',
        message: 'Query must be at least 2 characters',
      });
    }

    const results = { lands: [], listings: [], pagination: null };

    if (!type || type === 'land') {
      const { rows: lands, total } = await landRepo.search(q.trim(), limit, offset);
      results.lands = lands;
      if (type === 'land') {
        results.pagination = buildPagination(total, page, limit);
      }
    }

    if (!type || type === 'listing') {
      const filters = {
        status: 'active',
      };
      if (minPrice) {filters.minPrice = parseInt(minPrice, 10);}
      if (maxPrice) {filters.maxPrice = parseInt(maxPrice, 10);}

      // For listings we search by title/address via a custom query
      const pattern = `%${q.trim().replace(/%/g, '').replace(/_/g, '')}%`;
      const { rows: listings, total } = await (async () => {
        const countRes = await db(
          `SELECT COUNT(*) AS total FROM listings li
           JOIN lands l ON l.id = li.land_id
           WHERE li.status = 'active'
             AND (li.title ILIKE $1 OR l.address ILIKE $1 OR l.district ILIKE $1)
             AND ($2::BIGINT IS NULL OR li.price >= $2)
             AND ($3::BIGINT IS NULL OR li.price <= $3)`,
          [pattern, filters.minPrice || null, filters.maxPrice || null]
        );
        const dataRes = await db(
          `SELECT li.*, l.address, l.district, l.ward, l.lat, l.lng
           FROM listings li
           JOIN lands l ON l.id = li.land_id
           WHERE li.status = 'active'
             AND (li.title ILIKE $1 OR l.address ILIKE $1 OR l.district ILIKE $1)
             AND ($2::BIGINT IS NULL OR li.price >= $2)
             AND ($3::BIGINT IS NULL OR li.price <= $3)
           ORDER BY li.boosted DESC, li.created_at DESC
           LIMIT $4 OFFSET $5`,
          [pattern, filters.minPrice || null, filters.maxPrice || null, limit, offset]
        );
        return {
          rows:  dataRes.rows,
          total: parseInt(countRes.rows[0].total, 10),
        };
      })();

      results.listings   = listings;
      results.pagination = buildPagination(total, page, limit);
    }

    res.json({ success: true, query: q, ...results });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
