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
 * Unified search across lands and listings.
 * Query params: q, type (land|listing), minPrice, maxPrice, page, limit
 */
router.get('/', cacheMiddleware(60), async (req, res, next) => {
  try {
    const { q, type, listingType, sortBy, minPrice, maxPrice, minArea, maxArea } = req.query;
    const { page, limit, offset } = parsePagination(req.query);

    if (!q || String(q).trim().length < 2) {
      return res.status(400).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Query must be at least 2 characters',
      });
    }

    const results = { lands: [], listings: [], pagination: null };
    const queryText = String(q).trim();

    if (!type || type === 'land') {
      const { rows: lands, total } = await landRepo.search(queryText, limit, offset);
      results.lands = lands;
      if (type === 'land') {
        results.pagination = buildPagination(total, page, limit);
      }
    }

    if (!type || type === 'listing') {
      const pattern = `%${queryText.replace(/%/g, '').replace(/_/g, '')}%`;
      const searchFields = [
        'li.title',
        'li.address',
        'li.district',
        'li.ward',
        'li.description',
        'l.address',
        'l.slug',
      ];

      const unaccentPattern = `%${queryText.replace(/%/g, '').replace(/_/g, '')}%`;
      const params = searchFields.map(() => unaccentPattern);
      let idx = searchFields.length + 1;
      let whereClause = `li.status = 'active'
             AND (
               ${searchFields.map((field, index) => `unaccent(${field}::text) ILIKE unaccent($${index + 1})`).join('\n               OR ')}
             )`;

      const normalizedListingType = String(listingType || '').trim().toLowerCase();
      const propertyCategoryKeywords = {
        dat_nen: 'đất nền',
        nha_pho: 'nhà phố',
        chung_cu: 'chung cư',
        biet_thu: 'biệt thự',
        van_phong: 'văn phòng',
      };

      if (normalizedListingType) {
        if (['sale', 'ban', 'rent', 'cho_thue', 'cho-thue'].includes(normalizedListingType)) {
          const normalizedType =
            normalizedListingType === 'ban' ? 'sale'
              : normalizedListingType === 'cho_thue' || normalizedListingType === 'cho-thue' ? 'rent'
                : normalizedListingType;

          whereClause += `\n             AND li.listing_type = $${idx}`;
          params.push(normalizedType);
          idx += 1;
        } else if (propertyCategoryKeywords[normalizedListingType]) {
          const categoryPattern = `%${propertyCategoryKeywords[normalizedListingType]}%`;
          whereClause += `\n             AND (
               li.title ILIKE $${idx}
               OR li.description ILIKE $${idx}
               OR li.address ILIKE $${idx}
               OR l.address ILIKE $${idx}
             )`;
          params.push(categoryPattern);
          idx += 1;
        }
      }

      const sortClause = (() => {
        switch (sortBy) {
          case 'price_asc':
            return 'li.price ASC';
          case 'price_desc':
            return 'li.price DESC';
          case 'area_asc':
            return 'li.area ASC';
          case 'area_desc':
            return 'li.area DESC';
          case 'newest':
            return 'li.created_at DESC';
          default:
            return 'li.boosted DESC NULLS LAST, li.boost_expires_at DESC NULLS LAST, li.created_at DESC';
        }
      })();

      const countRes = await db(
        `SELECT COUNT(*) AS total
         FROM listings li
         LEFT JOIN lands l ON l.id = li.land_id
         WHERE ${whereClause}`,
        params,
      );

      const dataRes = await db(
        `SELECT li.*, l.address AS land_address, l.district AS land_district, l.ward AS land_ward, l.slug AS land_slug, ST_Y(li.location::geometry) AS lat, ST_X(li.location::geometry) AS lng
         FROM listings li
         LEFT JOIN lands l ON l.id = li.land_id
         WHERE ${whereClause}
         ORDER BY ${sortClause}
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, limit, offset],
      );

      const total = parseInt(countRes.rows[0].total, 10);
      results.listings = dataRes.rows;
      results.pagination = buildPagination(total, page, limit);
    }

    res.json({ success: true, query: q, ...results });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
