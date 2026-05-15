'use strict';

const BaseRepository = require('../shared/BaseRepository');

/**
 * ListingRepository — data access for the listings table.
 */
class ListingRepository extends BaseRepository {
  /** @param {Function} db */
  constructor(db) {
    super('listings', db);
  }

  /**
   * Find paginated listings with optional filters.
   * @param {object} filters
   * @param {number} limit
   * @param {number} offset
   * @returns {Promise<{ rows: object[], total: number }>}
   */
  async findPaginated(filters = {}, limit = 20, offset = 0) {
    const conditions = [];
    const params = [];
    let idx = 1;

    if (filters.landId) {
      conditions.push(`li.land_id = $${idx++}`);
      params.push(filters.landId);
    }
    if (filters.status) {
      conditions.push(`li.status = $${idx++}`);
      params.push(filters.status);
    }
    if (filters.listingType) {
      conditions.push(`li.listing_type = $${idx++}`);
      params.push(filters.listingType);
    }
    if (filters.minPrice !== null && filters.minPrice !== undefined) {
      conditions.push(`li.price >= $${idx++}`);
      params.push(filters.minPrice);
    }
    if (filters.maxPrice !== null && filters.maxPrice !== undefined) {
      conditions.push(`li.price <= $${idx++}`);
      params.push(filters.maxPrice);
    }
    if (filters.minArea !== null && filters.minArea !== undefined) {
      conditions.push(`li.area >= $${idx++}`);
      params.push(filters.minArea);
    }
    if (filters.maxArea !== null && filters.maxArea !== undefined) {
      conditions.push(`li.area <= $${idx++}`);
      params.push(filters.maxArea);
    }
    if (filters.legalStatus) {
      conditions.push(`li.legal_status = $${idx++}`);
      params.push(filters.legalStatus);
    }
    if (filters.district) {
      conditions.push(`l.district ILIKE $${idx++}`);
      params.push(`%${filters.district.replace(/%/g, '').replace(/_/g, '')}%`);
    }
    if (filters.ward) {
      conditions.push(`l.ward ILIKE $${idx++}`);
      params.push(`%${filters.ward.replace(/%/g, '').replace(/_/g, '')}%`);
    }
    if (filters.query) {
      const pattern = `%${filters.query.replace(/%/g, '').replace(/_/g, '')}%`;
      conditions.push(`(
        li.title ILIKE $${idx}
        OR l.address ILIKE $${idx}
        OR l.address ILIKE $${idx}
        OR l.district ILIKE $${idx}
        OR l.ward ILIKE $${idx}
      )`);
      params.push(pattern);
      idx += 1;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) AS total
      FROM listings li
      LEFT JOIN lands l ON l.id = li.land_id
      ${where}`;

    let orderBy = 'li.boosted DESC NULLS LAST, li.boost_expires_at DESC NULLS LAST, li.created_at DESC';
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'price_asc':
          orderBy = 'li.price ASC';
          break;
        case 'price_desc':
          orderBy = 'li.price DESC';
          break;
        case 'area_asc':
          orderBy = 'li.area ASC';
          break;
        case 'area_desc':
          orderBy = 'li.area DESC';
          break;
        case 'newest':
          orderBy = 'li.created_at DESC';
          break;
        default:
          orderBy = 'li.boosted DESC NULLS LAST, li.boost_expires_at DESC NULLS LAST, li.created_at DESC';
      }
    }

    const dataSql = `
      SELECT li.*,
             ST_X(li.location::geometry) AS lng,
             ST_Y(li.location::geometry) AS lat
      FROM listings li
      LEFT JOIN lands l ON l.id = li.land_id
      ${where}
      ORDER BY ${orderBy}
      LIMIT $${idx} OFFSET $${idx + 1}`;

    const [countResult, dataResult] = await Promise.all([
      this._query(countSql, params),
      this._query(dataSql, [...params, limit, offset]),
    ]);

    return {
      rows: dataResult.rows,
      total: parseInt(countResult.rows[0].total, 10),
    };
  }

  /**
   * Find a listing by ID with joined land data.
   * @param {string} id
   * @returns {Promise<object|null>}
   */
  async findByIdWithLand(id) {
    const { rows } = await this._query(
      `SELECT li.*,
            ST_X(li.location::geometry) AS lng,
            ST_Y(li.location::geometry) AS lat,
            l.address      AS land_address,
            l.district     AS district,
            l.ward         AS ward,
            l.province     AS province,
            l.slug         AS land_slug,
            ST_Y(l.location::geometry) AS land_lat,
            ST_X(l.location::geometry) AS land_lng
     FROM listings li
     LEFT JOIN lands l ON l.id = li.land_id
     WHERE li.id = $1`,
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Find seller's listings paginated.
   * @param {string} sellerId
   * @param {number} limit
   * @param {number} offset
   * @returns {Promise<{ rows: object[], total: number }>}
   */
  async findBySellerPaginated(sellerId, limit = 20, offset = 0) {
    return this.findPaginated({ sellerId }, limit, offset);
  }

  /**
   * Find similar listings (same district, same type, similar price range).
   * @param {string} listingId
   * @param {number} limit
   * @returns {Promise<object[]>}
   */
  async findSimilar(listingId, limit = 6) {
    const { rows } = await this._query(
      `SELECT li2.*, l2.address, l2.district, l2.ward
       FROM listings li1
       JOIN lands l1 ON l1.id = li1.land_id
       JOIN lands l2 ON l2.district = l1.district
       JOIN listings li2 ON li2.land_id = l2.id
         AND li2.id <> $1
         AND li2.status = 'active'
         AND li2.listing_type = li1.listing_type
         AND li2.price BETWEEN li1.price * 0.7 AND li1.price * 1.3
       WHERE li1.id = $1
       ORDER BY li2.boosted DESC, li2.created_at DESC
       LIMIT $2`,
      [listingId, limit]
    );
    return rows;
  }

  /**
   * Increment the view count of a listing.
   * @param {string} listingId
   */
  async incrementViewCount(listingId) {
    await this._query(
      'UPDATE listings SET view_count = view_count + 1 WHERE id = $1',
      [listingId]
    );
  }

  /**
   * Apply a boost to a listing.
   * @param {string} listingId
   * @param {Date} expiresAt
   */
  async applyBoost(listingId, expiresAt) {
    const { rows } = await this._query(
      `UPDATE listings
       SET boosted = true, boost_expires_at = $2
       WHERE id = $1
       RETURNING *`,
      [listingId, expiresAt]
    );
    return rows[0] || null;
  }

  /**
   * Get listings that are pending admin review.
   * @param {number} limit
   * @param {number} offset
   * @returns {Promise<{ rows: object[], total: number }>}
   */
  async findPending(limit = 20, offset = 0) {
    return this.findPaginated({ status: 'pending_review' }, limit, offset);
  }

  /**
   * Get multiple listings by an array of IDs.
   * @param {string[]} ids
   * @returns {Promise<object[]>}
   */
  async findByIds(ids) {
    if (!ids || ids.length === 0) { return []; }
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
    const { rows } = await this._query(
      `SELECT li.*,
              ST_X(li.location::geometry) AS lng,
              ST_Y(li.location::geometry) AS lat
       FROM listings li
       WHERE li.id IN (${placeholders})`,
      ids
    );
    return rows;
  }
}

module.exports = ListingRepository;
