'use strict';

const { parseBbox } = require('../../utils/geoUtils');

/** Heat level → color mapping */
const HEAT_COLORS = {
  1: '#22c55e',
  2: '#84cc16',
  3: '#eab308',
  4: '#f97316',
  5: '#ef4444',
};

/**
 * HeatmapService — build heatmap data for the map overlay.
 */
class HeatmapService {
  /**
   * @param {import('./heatmap.repository')} heatmapRepository
   */
  constructor(heatmapRepository) {
    this.heatmapRepo = heatmapRepository;
  }

  /**
   * Get heatmap data for a bounding box.
   * zoom >= 14 → ward level; zoom < 14 → district level.
   *
   * @param {object} query - { bbox, zoom }
   * @returns {Promise<object[]>}
   */
  async getHeatmap(query) {
    const zoom   = parseInt(query.zoom, 10) || 12;
    const byWard = zoom >= 14;
    const bbox   = parseBbox(query.bbox);

    let rows;
    if (bbox) {
      rows = await this.heatmapRepo.getInBbox(
        bbox.minLng, bbox.minLat, bbox.maxLng, bbox.maxLat, byWard
      );
    } else {
      rows = await this.heatmapRepo.getInBbox(null, null, null, null, byWard);
    }

    return rows.map((r) => this._enrichRow(r));
  }

  /**
   * Get heatmap data for a specific district.
   * @param {string} district
   * @returns {Promise<object>}
   */
  async getByDistrict(district) {
    const row = await this.heatmapRepo.getByDistrict(district);
    if (!row) {
      return { district, noData: true };
    }
    const wards = await this.heatmapRepo.getWardsByDistrict(district);
    return {
      ...this._enrichRow(row),
      wards: wards.map((w) => this._enrichRow(w)),
    };
  }

  /**
   * Get heatmap data for a specific ward.
   * @param {string} ward
   * @param {string} [district]
   * @returns {Promise<object>}
   */
  async getByWard(ward, district) {
    const row = await this.heatmapRepo.getByWard(ward, district);
    if (!row) {
      return { ward, noData: true };
    }
    return this._enrichRow(row);
  }

  // ── Private helpers ────────────────────────────────────────

  _enrichRow(row) {
    return {
      ...row,
      color: HEAT_COLORS[row.heat_level] || HEAT_COLORS[1],
    };
  }
}

module.exports = HeatmapService;
