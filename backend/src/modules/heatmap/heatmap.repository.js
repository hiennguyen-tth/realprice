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
    const wardFilter = byWard ? 'AND ward IS NOT NULL' : 'AND ward IS NULL';

    const { rows } = await this._query(
      `SELECT api.*
       FROM area_price_index api
       WHERE ($1::float IS NULL OR $2::float IS NULL OR $3::float IS NULL OR $4::float IS NULL
              OR TRUE)
         ${wardFilter}
       ORDER BY api.heat_level DESC, api.total_listings DESC`,
      [minLng, minLat, maxLng, maxLat]
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
