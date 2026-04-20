'use strict';

const { NotFoundError, QuotaExceededError } = require('../../utils/errors');
const { parsePagination, buildPagination }   = require('../../utils/formatUtils');

const MAX_LEADS_PER_HOUR = 3;

/**
 * LeadService — handle inbound contact requests from potential buyers.
 */
class LeadService {
  /**
   * @param {import('./lead.repository')} leadRepository
   * @param {import('../listing/listing.repository')} listingRepository
   */
  constructor(leadRepository, listingRepository) {
    this.leadRepo    = leadRepository;
    this.listingRepo = listingRepository;
  }

  /**
   * Create a new lead (contact request) for a listing.
   * @param {string} listingId
   * @param {object} data - { name, phone, email, message, source }
   * @param {string} ipAddress
   * @returns {Promise<object>}
   */
  async createLead(listingId, data, ipAddress) {
    // Ensure listing exists and is active
    const listing = await this.listingRepo.findById(listingId);
    if (!listing || listing.status !== 'active') {
      throw new NotFoundError('Listing');
    }

    // Rate-limit by IP per listing
    const recentCount = await this.leadRepo.countRecentFromIp(listingId, ipAddress);
    if (recentCount >= MAX_LEADS_PER_HOUR) {
      throw new QuotaExceededError('Too many contact requests from this address');
    }

    const lead = await this.leadRepo.create({
      listing_id: listingId,
      name:       data.name    || null,
      phone:      data.phone,
      email:      data.email   || null,
      message:    data.message || null,
      source:     data.source  || 'web',
      ip_address: ipAddress    || null,
    });

    return lead;
  }

  /**
   * Get paginated leads for a listing (seller/admin use).
   * @param {string} listingId
   * @param {object} query
   * @returns {Promise<{ leads: object[], pagination: object }>}
   */
  async getLeadsForListing(listingId, query) {
    const { page, limit, offset } = parsePagination(query);
    const { rows, total } = await this.leadRepo.findByListingPaginated(listingId, limit, offset);
    return {
      leads:      rows,
      pagination: buildPagination(total, page, limit),
    };
  }

  /**
   * Update lead status (admin/seller CRM workflow).
   * @param {string} leadId
   * @param {string} status
   * @returns {Promise<object>}
   */
  async updateLeadStatus(leadId, status) {
    const lead = await this.leadRepo.findByIdOrFail(leadId, 'Lead');
    return this.leadRepo.update(leadId, { status });
  }
}

module.exports = LeadService;
