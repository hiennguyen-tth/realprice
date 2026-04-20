'use strict';

const { NotFoundError, ForbiddenError } = require('../../utils/errors');
const { parsePagination, buildPagination } = require('../../utils/formatUtils');

/**
 * UserService — business logic for user profile and saved listings.
 */
class UserService {
  /**
   * @param {import('./user.repository')} userRepository
   * @param {import('../listing/listing.repository')} listingRepository
   */
  constructor(userRepository, listingRepository) {
    this.userRepo    = userRepository;
    this.listingRepo = listingRepository;
  }

  /**
   * Get a user's public profile by ID.
   * @param {string} userId
   * @returns {Promise<object>}
   */
  async getProfile(userId) {
    const user = await this.userRepo.findByIdOrFail(userId, 'User');
    return this._sanitize(user);
  }

  /**
   * Update the authenticated user's profile.
   * @param {string} userId
   * @param {object} data - { full_name?, email?, avatar_url? }
   * @returns {Promise<object>}
   */
  async updateProfile(userId, data) {
    const allowed = {};
    if (data.full_name   !== undefined) {allowed.full_name   = data.full_name;}
    if (data.email       !== undefined) {allowed.email       = data.email;}
    if (data.avatar_url  !== undefined) {allowed.avatar_url  = data.avatar_url;}

    const updated = await this.userRepo.update(userId, allowed);
    if (!updated) {
      throw new NotFoundError('User');
    }
    return this._sanitize(updated);
  }

  /**
   * Get listings owned by a user.
   * @param {string} userId
   * @param {object} query
   * @returns {Promise<{ listings: object[], pagination: object }>}
   */
  async getUserListings(userId, query) {
    const { page, limit, offset } = parsePagination(query);
    const { rows, total } = await this.listingRepo.findBySellerPaginated(userId, limit, offset);
    return {
      listings:   rows,
      pagination: buildPagination(total, page, limit),
    };
  }

  /**
   * Get a user's saved listings.
   * @param {string} userId
   * @param {object} query
   * @returns {Promise<{ listings: object[], pagination: object }>}
   */
  async getSavedListings(userId, query) {
    const { page, limit, offset } = parsePagination(query);
    const { rows, total } = await this.userRepo.getSavedListings(userId, limit, offset);
    return {
      listings:   rows,
      pagination: buildPagination(total, page, limit),
    };
  }

  /**
   * Save a listing to the user's favorites.
   * @param {string} userId
   * @param {string} listingId
   */
  async saveListing(userId, listingId) {
    const listing = await this.listingRepo.findById(listingId);
    if (!listing) {
      throw new NotFoundError('Listing');
    }
    await this.userRepo.saveListing(userId, listingId);
    return { saved: true };
  }

  /**
   * Remove a listing from the user's favorites.
   * @param {string} userId
   * @param {string} listingId
   */
  async unsaveListing(userId, listingId) {
    await this.userRepo.unsaveListing(userId, listingId);
    return { saved: false };
  }

  // ── Private helpers ────────────────────────────────────────

  _sanitize(user) {
    const { otp_code, otp_expires_at, refresh_token, ...safe } = user;
    return safe;
  }
}

module.exports = UserService;
