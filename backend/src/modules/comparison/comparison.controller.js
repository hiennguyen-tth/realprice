'use strict';

const Joi = require('joi');

/**
 * ComparisonController — thin handler for comparison endpoints.
 */
class ComparisonController {
  /** @param {import('./comparison.service')} comparisonService */
  constructor(comparisonService) {
    this.compService = comparisonService;

    this.create       = this.create.bind(this);
    this.get          = this.get.bind(this);
    this.addListing   = this.addListing.bind(this);
    this.removeListing = this.removeListing.bind(this);
  }

  /** POST /api/comparison */
  async create(req, res, next) {
    try {
      const userId    = req.user ? req.user.id  : null;
      const sessionId = req.headers['x-session-id'] || null;
      const { listingIds } = req.body;

      const result = await this.compService.createComparison(listingIds, userId, sessionId);
      res.status(201).json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  /** GET /api/comparison/:id */
  async get(req, res, next) {
    try {
      const userId    = req.user ? req.user.id  : null;
      const sessionId = req.headers['x-session-id'] || null;
      const result = await this.compService.getComparison(req.params.id, userId, sessionId);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  /** POST /api/comparison/:id/add */
  async addListing(req, res, next) {
    try {
      const userId = req.user ? req.user.id : null;
      const result = await this.compService.addListing(req.params.id, req.body.listingId, userId);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  /** DELETE /api/comparison/:id/:listingId */
  async removeListing(req, res, next) {
    try {
      const userId = req.user ? req.user.id : null;
      const result = await this.compService.removeListing(req.params.id, req.params.listingId, userId);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }
}

const createComparisonSchema = Joi.object({
  listingIds: Joi.array().items(Joi.string().uuid()).min(2).max(4).required(),
});

const addListingSchema = Joi.object({
  listingId: Joi.string().uuid().required(),
});

module.exports = { ComparisonController, createComparisonSchema, addListingSchema };
