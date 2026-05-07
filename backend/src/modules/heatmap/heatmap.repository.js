'use strict';

const BaseRepository = require('../shared/BaseRepository');

/**
 * HeatmapRepository — data access for the area_price_index table.
 */
class HeatmapRepository extends BaseRepository {
  /** @param {Function} db */
  constructor(db) {
    super('area_price_index', db);
  }

  /**
   * Get heatmap data for all districts/wards within a bounding box.
   * @param {number} minLng
   * @param {number} minLat
   * @param {number} maxLng
   * @param {number} maxLat
   * @param {boolean} byWard - true → ward level, false → district level
   * @returns {Promise<object[]>}
   */
  async getInBbox(minLng, minLat, maxLng, maxLat, byWard = false) {
    const whereClauses = [];
    const params = [];

    if (minLng !== null && minLat !== null && maxLng !== null && maxLat !== null) {
      whereClauses.push(
        `ST_Intersects(boundary, ST_MakeEnvelope($1, $2, $3, $4, 4326)::geometry::geography)`
      );
      params.push(minLng, minLat, maxLng, maxLat);
    }

    whereClauses.push(byWard ? 'ward IS NOT NULL' : 'ward IS NULL');

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const { rows } = await this._query(
      `SELECT api.id, api.district, api.ward, api.city,
              api.avg_price, api.avg_price_per_m2, api.total_listings,
              api.min_price, api.max_price, api.price_level, api.heat_level,
              api.updated_at, api.color,
              ST_AsGeoJSON(api.boundary)::json AS boundary_geojson
       FROM area_price_index api
       ${whereSql}
       ORDER BY api.heat_level DESC, api.total_listings DESC`,
      params
    );
    return rows;
  }

  /**
   * Get aggregated heatmap stats for a specific district.
   * @param {string} district
   * @returns {Promise<object|null>}
   */
  async getByDistrict(district) {
    const { rows } = await this._query(
      `SELECT * FROM area_price_index
       WHERE district = $1 AND ward IS NULL
       LIMIT 1`,
      [district]
    );
    return rows[0] || null;
  }

  /**
   * Get ward-level heatmap data for a district.
   * @param {string} district
   * @returns {Promise<object[]>}
   */
  async getWardsByDistrict(district) {
    const { rows } = await this._query(
      `SELECT * FROM area_price_index
       WHERE district = $1 AND ward IS NOT NULL
       ORDER BY heat_level DESC, total_listings DESC`,
      [district]
    );
    return rows;
  }

  /**
   * Get heatmap stats for a specific ward.
   * @param {string} ward
   * @param {string} [district]
   * @returns {Promise<object|null>}
   */
  async getByWard(ward, district) {
    const { rows } = await this._query(
      `SELECT * FROM area_price_index
       WHERE ward = $1 ${district ? 'AND district = $2' : ''}
       LIMIT 1`,
      district ? [ward, district] : [ward]
    );
    return rows[0] || null;
  }
}

module.exports = HeatmapRepository;
