'use strict';

const BaseRepository = require('../shared/BaseRepository');

class LandRepository extends BaseRepository {
  constructor(db) {
    super('lands', db);
  }

  async getBbox({ minLng, minLat, maxLng, maxLat, listingType, minPrice, maxPrice, limit }) {
    const { rows } = await this._query(
      `SELECT l.id,
              ST_Y(l.location::geometry) AS lat,
              ST_X(l.location::geometry) AS lng,
              l.address, l.district, l.ward,
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
       WHERE ST_X(l.location::geometry) BETWEEN $1 AND $3
         AND ST_Y(l.location::geometry) BETWEEN $2 AND $4
         AND ($5::BIGINT IS NULL OR li.price >= $5)
         AND ($6::BIGINT IS NULL OR li.price <= $6)
       GROUP BY l.id
       HAVING COUNT(li.id) > 0
       ORDER BY has_boosted DESC, min_price ASC
       LIMIT $7`,
      [minLng, minLat, maxLng, maxLat, minPrice || null, maxPrice || null, limit]
    );
    return rows;
  }

  async findByGpsProximity(lat, lng) {
    const { rows } = await this._query(
      `SELECT *,
              ST_Distance(location::geography, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography) AS dist_m
       FROM lands
       WHERE ST_DWithin(location::geography, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography, 10)
       ORDER BY dist_m ASC
       LIMIT 1`,
      [lat, lng]
    );
    return rows[0] || null;
  }

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

  async getPriceHistory(landId, limit = 30) {
    const { rows } = await this._query(
      `SELECT ph.recorded_at, ph.avg_price, ph.price_per_m2
       FROM price_history ph
       WHERE ph.land_id = $1
       ORDER BY ph.recorded_at DESC
       LIMIT $2`,
      [landId, limit]
    );
    return rows;
  }

  async findNearby(landId, radiusMetres = 500, limit = 10) {
    const { rows } = await this._query(
      `SELECT l.*,
              ST_Y(l.location::geometry) AS lat,
              ST_X(l.location::geometry) AS lng,
              ST_Distance(l.location::geography, ref.location::geography) AS distance_m
       FROM lands l,
            (SELECT location FROM lands WHERE id = $1) AS ref
       WHERE l.id <> $1
         AND ST_DWithin(l.location::geography, ref.location::geography, $2)
       ORDER BY distance_m ASC
       LIMIT $3`,
      [landId, radiusMetres, limit]
    );
    return rows;
  }

  async findDuplicateCandidates() {
    const { rows } = await this._query(
      `SELECT a.id AS land_a, b.id AS land_b,
              a.address AS addr_a, b.address AS addr_b,
              a.district, a.ward,
              ST_Distance(a.location::geography, b.location::geography) AS distance_m
       FROM lands a
       JOIN lands b ON a.id < b.id
         AND a.district = b.district
         AND ST_DWithin(a.location::geography, b.location::geography, 20)
       ORDER BY distance_m ASC
       LIMIT 100`
    );
    return rows;
  }

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

  async search(q, limit = 20, offset = 0) {
    const pattern = `%${q.replace(/%/g, '').replace(/_/g, '')}%`;
    const { rows } = await this._query(
      `SELECT *, COUNT(*) OVER() AS total_count
       FROM lands
       WHERE address ILIKE $1
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
