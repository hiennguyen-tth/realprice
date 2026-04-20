'use strict';

const Joi = require('joi');

/**
 * BankValuationController — thin handler for bank valuation endpoints.
 */
class BankValuationController {
  /** @param {import('./bankValuation.service')} bankValuationService */
  constructor(bankValuationService) {
    this.bvService = bankValuationService;

    this.getValuations  = this.getValuations.bind(this);
    this.compareForLand = this.compareForLand.bind(this);
    this.createValuation = this.createValuation.bind(this);
  }

  /** GET /api/bank-valuations */
  async getValuations(req, res, next) {
    try {
      const result = await this.bvService.getValuations(req.query);
      res.json({ success: true, ...result });
    } catch (err) { next(err); }
  }

  /** GET /api/bank-valuations/compare */
  async compareForLand(req, res, next) {
    try {
      const data = await this.bvService.compareForLand(req.query);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  /** POST /api/admin/bank-valuations (used via admin routes) */
  async createValuation(req, res, next) {
    try {
      const bv = await this.bvService.createValuation(req.body);
      res.status(201).json({ success: true, data: bv });
    } catch (err) { next(err); }
  }
}

const createValuationSchema = Joi.object({
  district:         Joi.string().max(200).required(),
  ward:             Joi.string().max(200),
  street_name:      Joi.string().max(500),
  land_type:        Joi.string().valid('residential','commercial','agricultural','industrial','mixed_use').required(),
  bank_name:        Joi.string().max(200).required(),
  valuation_per_m2: Joi.number().integer().positive().required(),
  ltv_ratio:        Joi.number().min(0.1).max(1).default(0.7),
  effective_from:   Joi.date().required(),
  effective_to:     Joi.date().min(Joi.ref('effective_from')),
});

module.exports = { BankValuationController, createValuationSchema };
