'use strict';

const BaseRepository = require('../shared/BaseRepository');

class LandRepository extends BaseRepository {
  constructor(db) {
    super('lands', db);
  }

  async getBbox({ minLng, minLat, maxLng, maxLat, minPrice, maxPrice, limit }) {
    const { rows } = await this._query(
      `SELECT l.id,
              ST_Y(l.location::geometry) AS lat,
              ST_X(l.location::geometry) AS lng,
              l.address, l.district, l.ward,
              COUNT(li.id)::INTEGER AS total_listings,
              MIN(li.price)         AS min_price,
              MAX(li.price)         AS max_price,
              AVG(li.price)::BIGINT AS avg_price,
              COALESCE(
                MIN(li.price_per_m2),
                CASE WHEN SUM(NULLIF(li.area, 0)) > 0
                  THEN (SUM(li.price)::FLOAT / SUM(NULLIF(li.area, 0)))::BIGINT
                  ELSE NULL
                END
              ) AS min_price_per_m2,
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
        AND ($5::BIGINT IS NULL OR li.price >= $5)
        AND ($6::BIGINT IS NULL OR li.price <= $6)
       WHERE ST_X(l.location::geometry) BETWEEN $1 AND $3
         AND ST_Y(l.location::geometry) BETWEEN $2 AND $4
       GROUP BY l.id
       HAVING COUNT(li.id) > 0
       ORDER BY has_boosted DESC, COUNT(li.id) DESC, min_price ASC
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

  async findByIdWithPrices(id) {
    const { rows } = await this._query(
      `SELECT l.*,
              ST_Y(l.location::geometry) AS lat,
              ST_X(l.location::geometry) AS lng,
              COUNT(li.id)::INTEGER AS total_listings,
              MIN(li.price)         AS min_price,
              MAX(li.price)         AS max_price,
              AVG(li.price)::BIGINT AS avg_price,
              COALESCE(
                MIN(li.price_per_m2),
                CASE WHEN SUM(NULLIF(li.area, 0)) > 0
                  THEN (SUM(li.price)::FLOAT / SUM(NULLIF(li.area, 0)))::BIGINT
                  ELSE NULL
                END
              ) AS price_per_m2
       FROM lands l
       LEFT JOIN listings li ON li.land_id = l.id AND li.status = 'active'
       WHERE l.id = $1
       GROUP BY l.id`,
      [id]
    );
    return rows[0] || null;
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

  async getDistrictSummaries(limit = 30) {
    const { rows } = await this._query(
      `SELECT
         l.district,
         l.province,
         COUNT(li.id)::INTEGER AS total_listings,
         ROUND(AVG(li.price_per_m2))::BIGINT AS avg_price_per_m2,
         MIN(li.price_per_m2)::BIGINT AS min_price_per_m2,
         MAX(li.price_per_m2)::BIGINT AS max_price_per_m2
       FROM lands l
       JOIN listings li ON li.land_id = l.id AND li.status = 'active'
       GROUP BY l.district, l.province
       ORDER BY total_listings DESC, avg_price_per_m2 DESC
       LIMIT $1`,
      [limit]
    );
    return rows;
  }

  async getDistrictOverview(district) {
    const pattern = `%${district.replace(/-/g, ' ').replace(/%/g, '')}%`;
    const { rows } = await this._query(
      `SELECT
         l.district,
         l.province,
         COUNT(DISTINCT li.id)              AS total_listings,
         ROUND(AVG(li.price_per_m2))::BIGINT AS avg_price_per_m2,
         MIN(li.price_per_m2)               AS min_price_per_m2,
         MAX(li.price_per_m2)               AS max_price_per_m2
       FROM lands l
       JOIN listings li ON li.land_id = l.id AND li.status = 'active'
       WHERE l.district ILIKE $1
       GROUP BY l.district, l.province
       LIMIT 1`,
      [pattern]
    );
    return rows[0] || null;
  }

  async getTopStreetsByDistrict(district, limit = 10) {
    const pattern = `%${district.replace(/-/g, ' ').replace(/%/g, '')}%`;
    const { rows } = await this._query(
      `SELECT
         l.address AS street,
         ROUND(AVG(li.price_per_m2))::BIGINT AS avg_price_per_m2,
         COUNT(li.id)                        AS total_listings
       FROM lands l
       JOIN listings li ON li.land_id = l.id AND li.status = 'active'
       WHERE l.district ILIKE $1
       GROUP BY l.address
       ORDER BY avg_price_per_m2 DESC NULLS LAST
       LIMIT $2`,
      [pattern, limit]
    );
    return rows;
  }

  async getDistrictPriceChange(district, days = 30) {
    const pattern = `%${district.replace(/-/g, ' ').replace(/%/g, '')}%`;
    const { rows } = await this._query(
      `SELECT
         AVG(ph.price_per_m2) FILTER (WHERE ph.recorded_at >= NOW() - ($2 || ' days')::INTERVAL) AS recent_avg,
         AVG(ph.price_per_m2) FILTER (WHERE ph.recorded_at < NOW() - ($2 || ' days')::INTERVAL
           AND ph.recorded_at >= NOW() - ($3 || ' days')::INTERVAL) AS prev_avg
       FROM price_history ph
       JOIN lands l ON l.id = ph.land_id
       WHERE l.district ILIKE $1`,
      [pattern, days, days * 2]
    );
    return rows[0] || null;
  }

  async findByDistrictAndAddress(districtSlug, streetSlug) {
    const districtPattern = `%${districtSlug.replace(/-/g, ' ').replace(/%/g, '').trim()}%`;
    const streetPattern = `%${streetSlug.replace(/-/g, ' ').replace(/%/g, '').trim()}%`;
    const { rows } = await this._query(
      `SELECT l.*,
              ST_Y(l.location::geometry) AS lat_coord,
              ST_X(l.location::geometry) AS lng_coord
       FROM lands l
       WHERE l.district ILIKE $1
         AND (l.address ILIKE $2 OR l.ward ILIKE $2 OR l.slug ILIKE $2)
       ORDER BY l.created_at DESC
       LIMIT 1`,
      [districtPattern, streetPattern]
    );
    return rows[0] || null;
  }
}

module.exports = LandRepository;
