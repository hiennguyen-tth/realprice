'use strict';

const BaseRepository = require('../shared/BaseRepository');

/**
 * LandRepository — data access for the lands table including PostGIS queries.
 */
class LandRepository extends BaseRepository {
  /** @param {Function} db */
  constructor(db) {
    super('lands', db);
  }

  /**
   * Find lands within a bounding box with aggregate listing data.
   * Implements the spec's getBbox query exactly.
   *
   * @param {object} params
   * @param {number} params.minLng
   * @param {number} params.minLat
   * @param {number} params.maxLng
   * @param {number} params.maxLat
   * @param {string} params.listingType - 'sale' | 'rent'
   * @param {number|null} params.minPrice
   * @param {number|null} params.maxPrice
   * @param {number} params.limit
   * @returns {Promise<object[]>}
   */
  async getBbox({ minLng, minLat, maxLng, maxLat, listingType, minPrice, maxPrice, limit }) {
    const { rows } = await this._query(
      `SELECT l.id, l.lat, l.lng, l.address, l.district, l.ward,
              l.land_type, l.legal_status, l.area_m2, l.frontage_m, l.alley_width_m,
              COUNT(li.id)           AS total_listings,
              MIN(li.price)          AS min_price,
              MAX(li.price)          AS max_price,
              AVG(li.price)::BIGINT  AS avg_price,
              MIN(li.price_per_m2)   AS min_price_per_m2,
              EXISTS(
                SELECT 1 FROM listings lb
                WHERE lb.land_id = l.id
                  AND lb.boosted = true
                  AND lb.boost_expires_at > NOW()
              ) AS has_boosted
       FROM lands l
       LEFT JOIN listings li
         ON li.land_id = l.id
        AND li.status = 'active'
        AND li.listing_type = $5
       WHERE l.lng BETWEEN $1 AND $3
         AND l.lat BETWEEN $2 AND $4
         AND ($6::BIGINT IS NULL OR li.price >= $6)
         AND ($7::BIGINT IS NULL OR li.price <= $7)
       GROUP BY l.id
       HAVING COUNT(li.id) > 0
       ORDER BY has_boosted DESC, min_price ASC
       LIMIT $8`,
      [minLng, minLat, maxLng, maxLat, listingType, minPrice || null, maxPrice || null, limit]
    );
    return rows;
  }

  /**
   * Find a land record within 10m of the given coordinates (GPS dedup).
   * @param {number} lat
   * @param {number} lng
   * @returns {Promise<object|null>}
   */
  async findByGpsProximity(lat, lng) {
    // Approx 10m in degrees ≈ 0.0001 deg; use a tiny bbox for GPS dedup
    const delta = 0.0001;
    const { rows } = await this._query(
      `SELECT *,
              ((lat - $1)*(lat - $1) + (lng - $2)*(lng - $2)) AS dist_sq
       FROM lands
       WHERE lat BETWEEN $1 - $3 AND $1 + $3
         AND lng BETWEEN $2 - $3 AND $2 + $3
       ORDER BY dist_sq ASC
       LIMIT 1`,
      [lat, lng, delta]
    );
    return rows[0] || null;
  }

  /**
   * Find a land by normalized address (fuzzy match via pg_trgm).
   * @param {string} normalizedAddress
   * @returns {Promise<object|null>}
   */
  async findByNormalizedAddress(normalizedAddress) {
    const { rows } = await this._query(
      `SELECT *, similarity(normalized_address, $1) AS sim
       FROM lands
       WHERE normalized_address % $1
       ORDER BY sim DESC
       LIMIT 1`,
      [normalizedAddress]
    );
    return rows[0] || null;
  }

  /**
   * Get price history for a land parcel.
   * @param {string} landId
   * @param {number} [limit=30]
   * @returns {Promise<object[]>}
   */
  async getPriceHistory(landId, limit = 30) {
    const { rows } = await this._query(
      `SELECT ph.recorded_at, ph.price, ph.price_per_m2,
              li.title, li.listing_type, li.id AS listing_id
       FROM price_history ph
       JOIN listings li ON li.id = ph.listing_id
       WHERE ph.land_id = $1
       ORDER BY ph.recorded_at DESC
       LIMIT $2`,
      [landId, limit]
    );
    return rows;
  }

  /**
   * Find nearby lands within a given radius.
   * @param {string} landId
   * @param {number} radiusMetres
   * @param {number} limit
   * @returns {Promise<object[]>}
   */
  async findNearby(landId, radiusMetres = 500, limit = 10) {
    // Approx degrees from metres (1 deg ≈ 111 km)
    const deltaDeg = radiusMetres / 111000;
    const { rows } = await this._query(
      `SELECT l.*,
              SQRT((l.lat - ref.lat)^2 + (l.lng - ref.lng)^2) * 111000 AS distance_m
       FROM lands l,
            (SELECT lat, lng FROM lands WHERE id = $1) AS ref
       WHERE l.id <> $1
         AND l.lat BETWEEN ref.lat - $2 AND ref.lat + $2
         AND l.lng BETWEEN ref.lng - $2 AND ref.lng + $2
       ORDER BY distance_m ASC
       LIMIT $3`,
      [landId, deltaDeg, limit]
    );
    return rows;
  }

  /**
   * Find potential duplicate lands (same district/ward, close coordinates).
   * Used by the admin module.
   * @returns {Promise<object[]>}
   */
  async findDuplicateCandidates() {
    // 20m ≈ 0.00018 deg
    const deltaDeg = 20 / 111000;
    const { rows } = await this._query(
      `SELECT a.id AS land_a, b.id AS land_b,
              a.address AS addr_a, b.address AS addr_b,
              a.district, a.ward,
              SQRT((a.lat - b.lat)^2 + (a.lng - b.lng)^2) * 111000 AS distance_m
       FROM lands a
       JOIN lands b ON a.id < b.id
         AND a.district = b.district
         AND ABS(a.lat - b.lat) < $1
         AND ABS(a.lng - b.lng) < $1
       ORDER BY distance_m ASC
       LIMIT 100`,
      [deltaDeg]
    );
    return rows;
  }

  /**
   * Merge land B into land A: reassign listings and delete B.
   * Runs inside a transaction via the provided client.
   * @param {string} targetId - land to keep
   * @param {string} sourceId - land to merge and delete
   * @param {import('pg').PoolClient} client
   */
  async mergeIntoTarget(targetId, sourceId, client) {
    await client.query(
      'UPDATE listings SET land_id = $1 WHERE land_id = $2',
      [targetId, sourceId]
    );
    await client.query(
      'UPDATE price_history SET land_id = $1 WHERE land_id = $2',
      [targetId, sourceId]
    );
    await client.query('DELETE FROM lands WHERE id = $1', [sourceId]);
  }

  /**
   * Full-text search over address fields.
   * @param {string} q
   * @param {number} limit
   * @param {number} offset
   * @returns {Promise<{ rows: object[], total: number }>}
   */
  async search(q, limit = 20, offset = 0) {
    const pattern = `%${q.replace(/%/g, '').replace(/_/g, '')}%`;
    const { rows } = await this._query(
      `SELECT *, COUNT(*) OVER() AS total_count
       FROM lands
       WHERE address ILIKE $1
          OR normalized_address ILIKE $1
          OR ward ILIKE $1
          OR district ILIKE $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [pattern, limit, offset]
    );
    const total = rows.length > 0 ? parseInt(rows[0].total_count, 10) : 0;
    return { rows, total };
  }
}

module.exports = LandRepository;
