'use strict';

const Joi = require('joi');

/**
 * ListingController — thin layer delegating to ListingService.
 */
class ListingController {
  /** @param {import('./listing.service')} listingService */
  constructor(listingService) {
    this.listingService = listingService;

    this.getListings     = this.getListings.bind(this);
    this.createListing   = this.createListing.bind(this);
    this.getListingById  = this.getListingById.bind(this);
    this.updateListing   = this.updateListing.bind(this);
    this.deleteListing   = this.deleteListing.bind(this);
    this.boostListing    = this.boostListing.bind(this);
    this.contactListing  = this.contactListing.bind(this);
    this.getUploadUrl    = this.getUploadUrl.bind(this);
    this.getSimilar      = this.getSimilar.bind(this);
    this.getMyListings   = this.getMyListings.bind(this);
  }

  /** GET /api/listings */
  async getListings(req, res, next) {
    try {
      const result = await this.listingService.getListings(req.query);
      res.json({ success: true, ...result });
    } catch (err) { next(err); }
  }

  /** POST /api/listings */
  async createListing(req, res, next) {
    try {
      const listing = await this.listingService.createListing(req.body, req.user.id);
      res.status(201).json({ success: true, data: listing });
    } catch (err) { next(err); }
  }

  /** GET /api/listings/:id */
  async getListingById(req, res, next) {
    try {
      const listing = await this.listingService.getListingById(req.params.id);
      res.json({ success: true, data: listing });
    } catch (err) { next(err); }
  }

  /** PUT /api/listings/:id */
  async updateListing(req, res, next) {
    try {
      const listing = await this.listingService.updateListing(req.params.id, req.body, req.user);
      res.json({ success: true, data: listing });
    } catch (err) { next(err); }
  }

  /** DELETE /api/listings/:id */
  async deleteListing(req, res, next) {
    try {
      await this.listingService.deleteListing(req.params.id, req.user);
      res.json({ success: true, message: 'Listing removed' });
    } catch (err) { next(err); }
  }

  /** POST /api/listings/:id/boost */
  async boostListing(req, res, next) {
    try {
      const { duration } = req.body;
      const result = await this.listingService.boostListing(req.params.id, duration, req.user);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  /** POST /api/listings/:id/contact  — handled by LeadService; stub here */
  async contactListing(req, res, next) {
    // This is handled at the route level via LeadController
    next();
  }

  /** POST /api/listings/upload-url */
  async getUploadUrl(req, res, next) {
    try {
      const { contentType } = req.body;
      const result = await this.listingService.getUploadUrl(contentType);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  /** GET /api/listings/:id/similar */
  async getSimilar(req, res, next) {
    try {
      const data = await this.listingService.getSimilarListings(req.params.id);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async getMyListings(req, res, next) {
    try {
      const result = await this.listingService.getMyListings(req.user.id);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }
}

// ── Validation schemas ──────────────────────────────────────
const createListingSchema = Joi.object({
  // Land fields
  lat:          Joi.number().min(-90).max(90).required(),
  lng:          Joi.number().min(-180).max(180).required(),
  address:      Joi.string().max(500).required(),
  ward:         Joi.string().max(200),
  district:     Joi.string().max(200),
  province:     Joi.string().max(200),
  area_m2:      Joi.number().positive(),
  land_type:    Joi.string().valid('residential','commercial','agricultural','industrial','mixed_use'),
  legal_status: Joi.string().valid('so_do','so_hong','giay_to_hop_le','chua_co_giay_to','dang_lam_so'),
  frontage_m:   Joi.number().positive(),
  alley_width_m: Joi.number().min(0),
  floors:       Joi.number().integer().min(1),
  // Listing fields
  price:        Joi.number().integer().positive().required(),
  area:         Joi.number().positive(),
  title:        Joi.string().max(500).required(),
  description:  Joi.string().max(5000),
  listing_type: Joi.string().valid('sale','rent').default('sale'),
  images:       Joi.array().items(Joi.string().uri()).max(20).default([]),
  contact_phone: Joi.string().pattern(/^(\+84|0)[0-9]{9}$/),
  contact_name:  Joi.string().max(200),
});

const updateListingSchema = Joi.object({
  price:        Joi.number().integer().positive(),
  title:        Joi.string().max(500),
  description:  Joi.string().max(5000),
  listing_type: Joi.string().valid('sale','rent'),
  images:       Joi.array().items(Joi.string().uri()).max(20),
  contact_phone: Joi.string().pattern(/^(\+84|0)[0-9]{9}$/),
  contact_name:  Joi.string().max(200),
  status:       Joi.string().valid('sold','expired','hidden'),
});

const boostSchema = Joi.object({
  duration: Joi.string().valid('3','7','30').required(),
});

const uploadUrlSchema = Joi.object({
  contentType: Joi.string().valid('image/jpeg','image/png','image/webp').required(),
});

module.exports = {
  ListingController,
  createListingSchema,
  updateListingSchema,
  boostSchema,
  uploadUrlSchema,
};
