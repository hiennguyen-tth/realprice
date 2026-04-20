'use strict';

/**
 * HeatmapController — thin handler for heatmap endpoints.
 */
class HeatmapController {
  /** @param {import('./heatmap.service')} heatmapService */
  constructor(heatmapService) {
    this.heatmapService = heatmapService;

    this.getHeatmap  = this.getHeatmap.bind(this);
    this.getDistrict = this.getDistrict.bind(this);
    this.getWard     = this.getWard.bind(this);
  }

  /** GET /api/heatmap */
  async getHeatmap(req, res, next) {
    try {
      const data = await this.heatmapService.getHeatmap(req.query);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  /** GET /api/heatmap/district/:district */
  async getDistrict(req, res, next) {
    try {
      const data = await this.heatmapService.getByDistrict(req.params.district);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  /** GET /api/heatmap/ward/:ward */
  async getWard(req, res, next) {
    try {
      const data = await this.heatmapService.getByWard(req.params.ward, req.query.district);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }
}

module.exports = HeatmapController;
