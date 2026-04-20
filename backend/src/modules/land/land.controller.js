'use strict';

/**
 * LandController — thin handler delegating to LandService.
 */
class LandController {
  /** @param {import('./land.service')} landService */
  constructor(landService) {
    this.landService = landService;

    this.getLands          = this.getLands.bind(this);
    this.getLandById       = this.getLandById.bind(this);
    this.getPriceHistory   = this.getPriceHistory.bind(this);
    this.getNearby         = this.getNearby.bind(this);
    this.getBankValuations = this.getBankValuations.bind(this);
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
}

module.exports = LandController;
