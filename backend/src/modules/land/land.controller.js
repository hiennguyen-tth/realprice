'use strict';

/**
 * LandController — thin handler delegating to LandService.
 */
class LandController {
  /** @param {import('./land.service')} landService */
  constructor(landService) {
    this.landService = landService;

    this.getLands = this.getLands.bind(this);
    this.getLandById = this.getLandById.bind(this);
    this.getPriceHistory = this.getPriceHistory.bind(this);
    this.getNearby = this.getNearby.bind(this);
    this.getBankValuations = this.getBankValuations.bind(this);
    this.getDistrictOverview = this.getDistrictOverview.bind(this);
    this.getDistrictSummaries = this.getDistrictSummaries.bind(this);
    this.getLandBySlug = this.getLandBySlug.bind(this);
  }

  /** GET /api/lands */
  async getLands(req, res, next) {
    try {
      const data = await this.landService.getLandsInBbox(req.query);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  /** GET /api/lands/:id */
  async getLandById(req, res, next) {
    try {
      const data = await this.landService.getLandById(req.params.id);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  /** GET /api/lands/districts */
  async getDistrictSummaries(req, res, next) {
    try {
      const data = await this.landService.getDistrictSummaries();
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  /** GET /api/lands/:id/price-history */
  async getPriceHistory(req, res, next) {
    try {
      const data = await this.landService.getPriceHistory(req.params.id);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  /** GET /api/lands/:id/nearby */
  async getNearby(req, res, next) {
    try {
      const data = await this.landService.getNearby(req.params.id);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  /** GET /api/lands/:id/bank-valuations */
  async getBankValuations(req, res, next) {
    try {
      const data = await this.landService.getBankValuations(req.params.id);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async getDistrictOverview(req, res, next) {
    try {
      const data = await this.landService.getDistrictOverview(req.params.district);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async getLandBySlug(req, res, next) {
    try {
      const { district, street } = req.params;
      const data = await this.landService.getLandBySlug(district, street);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }
}

module.exports = LandController;
