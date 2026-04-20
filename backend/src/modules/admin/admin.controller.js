'use strict';

const Joi = require('joi');

/**
 * AdminController — thin handler for admin-only endpoints.
 */
class AdminController {
  /** @param {import('./admin.service')} adminService */
  constructor(adminService) {
    this.adminService = adminService;

    this.getPendingListings  = this.getPendingListings.bind(this);
    this.approveListing      = this.approveListing.bind(this);
    this.rejectListing       = this.rejectListing.bind(this);
    this.getDuplicateLands   = this.getDuplicateLands.bind(this);
    this.mergeLands          = this.mergeLands.bind(this);
    this.createBankValuation = this.createBankValuation.bind(this);
  }

  /** GET /api/admin/listings/pending */
  async getPendingListings(req, res, next) {
    try {
      const result = await this.adminService.getPendingListings(req.query);
      res.json({ success: true, ...result });
    } catch (err) { next(err); }
  }

  /** POST /api/admin/listings/:id/approve */
  async approveListing(req, res, next) {
    try {
      const listing = await this.adminService.approveListing(req.params.id);
      res.json({ success: true, data: listing });
    } catch (err) { next(err); }
  }

  /** POST /api/admin/listings/:id/reject */
  async rejectListing(req, res, next) {
    try {
      const listing = await this.adminService.rejectListing(req.params.id, req.body.reason);
      res.json({ success: true, data: listing });
    } catch (err) { next(err); }
  }

  /** GET /api/admin/lands/duplicates */
  async getDuplicateLands(req, res, next) {
    try {
      const data = await this.adminService.getDuplicateLands();
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  /** POST /api/admin/lands/:id/merge/:targetId */
  async mergeLands(req, res, next) {
    try {
      const result = await this.adminService.mergeLands(req.params.targetId, req.params.id);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  /** POST /api/admin/bank-valuations */
  async createBankValuation(req, res, next) {
    try {
      const bv = await this.adminService.createBankValuation(req.body);
      res.status(201).json({ success: true, data: bv });
    } catch (err) { next(err); }
  }
}

const rejectSchema = Joi.object({
  reason: Joi.string().max(500).required(),
});

module.exports = { AdminController, rejectSchema };
