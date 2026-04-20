'use strict';

const { withTransaction }   = require('../../config/database');
const { NotFoundError, ValidationError } = require('../../utils/errors');
const { parsePagination, buildPagination } = require('../../utils/formatUtils');

/**
 * AdminService — privileged operations for admin users.
 */
class AdminService {
  /**
   * @param {import('../listing/listing.repository')} listingRepository
   * @param {import('../land/land.repository')}    landRepository
   * @param {import('../bankValuation/bankValuation.repository')} bvRepository
   */
  constructor(listingRepository, landRepository, bvRepository) {
    this.listingRepo = listingRepository;
    this.landRepo    = landRepository;
    this.bvRepo      = bvRepository;
  }

  /**
   * Get listings pending moderation review.
   * @param {object} query
   * @returns {Promise<{ listings: object[], pagination: object }>}
   */
  async getPendingListings(query) {
    const { page, limit, offset } = parsePagination(query);
    const { rows, total } = await this.listingRepo.findPending(limit, offset);
    return {
      listings:   rows,
      pagination: buildPagination(total, page, limit),
    };
  }

  /**
   * Approve a listing — set status to 'active'.
   * @param {string} listingId
   * @returns {Promise<object>}
   */
  async approveListing(listingId) {
    const listing = await this.listingRepo.findByIdOrFail(listingId, 'Listing');
    if (listing.status !== 'pending_review') {
      throw new ValidationError('Listing is not pending review');
    }
    return this.listingRepo.update(listingId, { status: 'active' });
  }

  /**
   * Reject a listing with a reason.
   * @param {string} listingId
   * @param {string} reason
   * @returns {Promise<object>}
   */
  async rejectListing(listingId, reason) {
    await this.listingRepo.findByIdOrFail(listingId, 'Listing');
    return this.listingRepo.update(listingId, {
      status:          'hidden',
      rejected_reason: reason || 'Policy violation',
    });
  }

  /**
   * Get potential duplicate land candidates for review.
   * @returns {Promise<object[]>}
   */
  async getDuplicateLands() {
    return this.landRepo.findDuplicateCandidates();
  }

  /**
   * Merge land sourceId into targetId (reassign all listings).
   * @param {string} targetId
   * @param {string} sourceId
   * @returns {Promise<object>}
   */
  async mergeLands(targetId, sourceId) {
    if (targetId === sourceId) {
      throw new ValidationError('Cannot merge a land into itself');
    }
    await this.landRepo.findByIdOrFail(targetId, 'Land (target)');
    await this.landRepo.findByIdOrFail(sourceId, 'Land (source)');

    await withTransaction(async (client) => {
      await this.landRepo.mergeIntoTarget(targetId, sourceId, client);
    });

    return this.landRepo.findById(targetId);
  }

  /**
   * Create a new bank valuation (admin privilege).
   * @param {object} data
   * @returns {Promise<object>}
   */
  async createBankValuation(data) {
    return this.bvRepo.create(data);
  }
}

module.exports = AdminService;
