'use strict';

const { Router } = require('express');
const { query: db } = require('./config/database');
const { cacheMiddleware } = require('./middleware/cache');
const { parsePagination, buildPagination } = require('./utils/formatUtils');
const LandRepository = require('./modules/land/land.repository');

const landRepo = new LandRepository(db);
const router = Router();

/**
 * GET /api/search
 * Unified search — works with empty q (returns all, filtered by listingType/price/area/sortBy)
 * Query params: q, type, listingType, sortBy, minPrice, maxPrice, minArea, maxArea, page, limit
 */
router.get('/', cacheMiddleware(60), async (req, res, next) => {
  try {
    const { q, type, listingType, sortBy, minPrice, maxPrice, minArea, maxArea } = req.query;
    const { page, limit, offset } = parsePagination(req.query);

    const queryText = String(q || '').trim();
    const hasQuery = queryText.length >= 2;

    const results = { lands: [], listings: [], pagination: null };

    // ── Land search (only when q present) ──────────────────────────────────
    if (hasQuery && (!type || type === 'land')) {
      const { rows: lands, total } = await landRepo.search(queryText, limit, offset);
      results.lands = lands;
      if (type === 'land') results.pagination = buildPagination(total, page, limit);
    }

    // ── Listing search ──────────────────────────────────────────────────────
    if (!type || type === 'listing') {
      const params = [];
      let idx = 1;
      let whereClause = `li.status = 'active'`;

      // Full-text search — only when q has ≥2 chars
      if (hasQuery) {
        const pat = `%${queryText.replace(/%/g, '').replace(/_/g, '')}%`;
        const searchFields = [
          'li.title', 'li.address', 'li.district',
          'li.ward', 'li.description', 'l.address', 'l.slug',
        ];
        searchFields.forEach(() => params.push(pat));
        whereClause += `
          AND (
            ${searchFields
            .map((f, i) => `unaccent(${f}::text) ILIKE unaccent($${i + 1})`)
            .join('\n            OR ')}
          )`;
        idx = searchFields.length + 1;
      }

      // listingType filter
      const normalizedListingType = String(listingType || '').trim().toLowerCase();
      const propertyTypeMap = {
        dat_nen: 'đất nền',
        nha_pho: 'nhà phố',
        chung_cu: 'chung cư',
        biet_thu: 'biệt thự',
        van_phong: 'văn phòng',
      };

      if (normalizedListingType) {
        if (['sale', 'ban', 'rent', 'cho_thue', 'cho-thue'].includes(normalizedListingType)) {
          const mapped =
            normalizedListingType === 'ban' ? 'sale'
              : ['cho_thue', 'cho-thue'].includes(normalizedListingType) ? 'rent'
                : normalizedListingType;
          whereClause += ` AND li.listing_type = $${idx}`;
          params.push(mapped);
          idx += 1;
        } else if (propertyTypeMap[normalizedListingType]) {
          whereClause += ` AND (
            li.title ILIKE $${idx}
            OR li.description ILIKE $${idx}
          )`;
          params.push(`%${propertyTypeMap[normalizedListingType]}%`);
          idx += 1;
        }
      }

      // Price filter
      if (minPrice) {
        whereClause += ` AND li.price >= $${idx}`;
        params.push(Number(minPrice));
        idx += 1;
      }
      if (maxPrice) {
        whereClause += ` AND li.price <= $${idx}`;
        params.push(Number(maxPrice));
        idx += 1;
      }

      // Area filter
      if (minArea) {
        whereClause += ` AND li.area >= $${idx}`;
        params.push(Number(minArea));
        idx += 1;
      }
      if (maxArea) {
        whereClause += ` AND li.area <= $${idx}`;
        params.push(Number(maxArea));
        idx += 1;
      }

      // Sort
      const sortClause = {
        price_asc: 'li.price ASC',
        price_desc: 'li.price DESC',
        area_asc: 'li.area ASC',
        area_desc: 'li.area DESC',
        newest: 'li.created_at DESC',
      }[sortBy] ?? 'li.boosted DESC NULLS LAST, li.boost_expires_at DESC NULLS LAST, li.created_at DESC';

      const baseQuery = `
        FROM listings li
        LEFT JOIN lands l ON l.id = li.land_id
        WHERE ${whereClause}`;

      const countRes = await db(`SELECT COUNT(*) AS total ${baseQuery}`, params);
      const total = parseInt(countRes.rows[0].total, 10);

      const dataRes = await db(
        `SELECT li.*,
                l.address AS land_address,
                l.district AS land_district,
                l.ward AS land_ward,
                l.slug AS land_slug,
                ST_Y(li.location::geometry) AS lat,
                ST_X(li.location::geometry) AS lng
         ${baseQuery}
         ORDER BY ${sortClause}
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, limit, offset],
      );

      results.listings = dataRes.rows;
      results.pagination = buildPagination(total, page, limit);
    }

    res.json({ success: true, query: q, ...results });
  } catch (err) {
    next(err);
  }
});

module.exports = router;