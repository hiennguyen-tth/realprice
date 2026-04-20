'use strict';

const { NotFoundError, ForbiddenError, ValidationError } = require('../../utils/errors');
const { calcListingScore, analyzeComparison } = require('../../utils/priceUtils');

const MAX_COMPARISON_ITEMS = 4;

/**
 * ComparisonService — orchestrates fetching, enriching, scoring, and analysing comparisons.
 */
class ComparisonService {
  /**
   * @param {import('./comparison.repository')} comparisonRepository
   * @param {import('../listing/listing.repository')} listingRepository
   * @param {import('../heatmap/heatmap.repository')} heatmapRepository
   * @param {import('../bankValuation/bankValuation.repository')} bankValuationRepository
   */
  constructor(comparisonRepository, listingRepository, heatmapRepository, bankValuationRepository) {
    this.compRepo   = comparisonRepository;
    this.listingRepo = listingRepository;
    this.heatmapRepo = heatmapRepository;
    this.bvRepo      = bankValuationRepository;
  }

  /**
   * Create a new price comparison session.
   * @param {string[]} listingIds
   * @param {string|null} userId
   * @param {string|null} sessionId
   * @returns {Promise<object>}
   */
  async createComparison(listingIds, userId, sessionId) {
    if (!listingIds || listingIds.length < 2) {
      throw new ValidationError('At least 2 listing IDs are required');
    }
    if (listingIds.length > MAX_COMPARISON_ITEMS) {
      throw new ValidationError(`Cannot compare more than ${MAX_COMPARISON_ITEMS} listings`);
    }

    const comparison = await this.compRepo.createComparison(userId, sessionId, listingIds);
    return this._enrichComparison(comparison);
  }

  /**
   * Get a comparison by ID, enriched with listing data and analysis.
   * @param {string} id
   * @param {string|null} userId
   * @param {string|null} sessionId
   * @returns {Promise<object>}
   */
  async getComparison(id, userId, sessionId) {
    const comparison = await this.compRepo.findById(id);
    if (!comparison) {
      throw new NotFoundError('Comparison');
    }

    // Access control: must own via user or session
    if (comparison.user_id && comparison.user_id !== userId) {
      if (!sessionId || comparison.session_id !== sessionId) {
        throw new ForbiddenError('Access denied to this comparison');
      }
    }

    return this._enrichComparison(comparison);
  }

  /**
   * Add a listing to an existing comparison.
   * @param {string} id
   * @param {string} listingId
   * @param {string|null} userId
   * @returns {Promise<object>}
   */
  async addListing(id, listingId, userId) {
    const comparison = await this.compRepo.findById(id);
    if (!comparison) { throw new NotFoundError('Comparison'); }

    if (comparison.user_id && comparison.user_id !== userId) {
      throw new ForbiddenError();
    }

    if (comparison.listing_ids.length >= MAX_COMPARISON_ITEMS) {
      throw new ValidationError(`Comparison is full (max ${MAX_COMPARISON_ITEMS} listings)`);
    }

    const updated = await this.compRepo.addListing(id, listingId);
    if (!updated) {
      throw new ValidationError('Listing already in this comparison');
    }
    return this._enrichComparison(updated);
  }

  /**
   * Remove a listing from an existing comparison.
   * @param {string} id
   * @param {string} listingId
   * @param {string|null} userId
   * @returns {Promise<object>}
   */
  async removeListing(id, listingId, userId) {
    const comparison = await this.compRepo.findById(id);
    if (!comparison) { throw new NotFoundError('Comparison'); }

    if (comparison.user_id && comparison.user_id !== userId) {
      throw new ForbiddenError();
    }

    const updated = await this.compRepo.removeListing(id, listingId);
    return this._enrichComparison(updated || comparison);
  }

  // ── Private helpers ────────────────────────────────────────

  /**
   * Fetch all listings, enrich with land + bank valuations, score each, then analyse.
   * @param {object} comparison
   * @returns {Promise<object>}
   */
  async _enrichComparison(comparison) {
    if (!comparison.listing_ids || comparison.listing_ids.length === 0) {
      return { ...comparison, items: [], analysis: null };
    }

    const listings = await this.listingRepo.findByIds(comparison.listing_ids);

    // Gather district indexes for scoring
    const districts = [...new Set(listings.map((l) => l.district).filter(Boolean))];
    const districtIndexMap = {};
    for (const district of districts) {
      const idx = await this.heatmapRepo.getByDistrict(district);
      if (idx) { districtIndexMap[district] = idx; }
    }

    const items = await Promise.all(
      listings.map(async (listing) => {
        const land = {
          id:           listing.land_id,
          district:     listing.district,
          ward:         listing.ward,
          land_type:    listing.land_type,
          legal_status: listing.legal_status,
          area_m2:      listing.area_m2,
          frontage_m:   listing.frontage_m,
          alley_width_m: listing.alley_width_m,
          floors:        listing.floors,
        };

        const districtIdx = districtIndexMap[listing.district] || null;
        const score       = calcListingScore(listing, land, districtIdx);

        // Bank valuations
        const bankValuations = await this.bvRepo.findForLand(
          listing.district, listing.ward, listing.land_type
        );

        return { listing, land, score, bankValuations, districtIndex: districtIdx };
      })
    );

    const analysis = analyzeComparison(items);

    return { ...comparison, items, analysis };
  }
}

module.exports = ComparisonService;
