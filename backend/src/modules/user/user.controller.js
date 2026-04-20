'use strict';

const Joi = require('joi');

/**
 * UserController — thin handler: validate → service → respond.
 */
class UserController {
  /** @param {import('./user.service')} userService */
  constructor(userService) {
    this.userService = userService;

    this.getMe          = this.getMe.bind(this);
    this.updateMe       = this.updateMe.bind(this);
    this.getMyListings  = this.getMyListings.bind(this);
    this.getSaved       = this.getSaved.bind(this);
    this.saveListing    = this.saveListing.bind(this);
    this.unsaveListing  = this.unsaveListing.bind(this);
  }

  /** GET /api/users/me */
  async getMe(req, res, next) {
    try {
      const user = await this.userService.getProfile(req.user.id);
      res.json({ success: true, data: user });
    } catch (err) { next(err); }
  }

  /** PUT /api/users/me */
  async updateMe(req, res, next) {
    try {
      const user = await this.userService.updateProfile(req.user.id, req.body);
      res.json({ success: true, data: user });
    } catch (err) { next(err); }
  }

  /** GET /api/users/me/listings */
  async getMyListings(req, res, next) {
    try {
      const result = await this.userService.getUserListings(req.user.id, req.query);
      res.json({ success: true, ...result });
    } catch (err) { next(err); }
  }

  /** GET /api/users/me/saved */
  async getSaved(req, res, next) {
    try {
      const result = await this.userService.getSavedListings(req.user.id, req.query);
      res.json({ success: true, ...result });
    } catch (err) { next(err); }
  }

  /** POST /api/users/me/saved/:listingId */
  async saveListing(req, res, next) {
    try {
      const result = await this.userService.saveListing(req.user.id, req.params.listingId);
      res.status(201).json({ success: true, ...result });
    } catch (err) { next(err); }
  }

  /** DELETE /api/users/me/saved/:listingId */
  async unsaveListing(req, res, next) {
    try {
      const result = await this.userService.unsaveListing(req.user.id, req.params.listingId);
      res.json({ success: true, ...result });
    } catch (err) { next(err); }
  }
}

const updateMeSchema = Joi.object({
  full_name:  Joi.string().max(200),
  email:      Joi.string().email(),
  avatar_url: Joi.string().uri(),
});

module.exports = { UserController, updateMeSchema };
