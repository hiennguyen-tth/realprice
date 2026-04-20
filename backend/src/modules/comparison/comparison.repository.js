'use strict';

const BaseRepository = require('../shared/BaseRepository');

/**
 * ComparisonRepository — data access for price_comparisons table.
 */
class ComparisonRepository extends BaseRepository {
  /** @param {Function} db */
  constructor(db) {
    super('price_comparisons', db);
  }

  /**
   * Create a new comparison session.
   * @param {string|null} userId
   * @param {string|null} sessionId
   * @param {string[]} listingIds
   * @returns {Promise<object>}
   */
  async createComparison(userId, sessionId, listingIds) {
    const { rows } = await this._query(
      `INSERT INTO price_comparisons (user_id, session_id, listing_ids)
       VALUES ($1, $2, $3::uuid[])
       RETURNING *`,
      [userId || null, sessionId || null, listingIds]
    );
    return rows[0];
  }

  /**
   * Add a listing ID to an existing comparison.
   * @param {string} comparisonId
   * @param {string} listingId
   * @returns {Promise<object>}
   */
  async addListing(comparisonId, listingId) {
    const { rows } = await this._query(
      `UPDATE price_comparisons
       SET listing_ids = array_append(listing_ids, $2::uuid),
           updated_at  = NOW()
       WHERE id = $1
         AND NOT ($2::uuid = ANY(listing_ids))
       RETURNING *`,
      [comparisonId, listingId]
    );
    return rows[0] || null;
  }

  /**
   * Remove a listing ID from a comparison.
   * @param {string} comparisonId
   * @param {string} listingId
   * @returns {Promise<object>}
   */
  async removeListing(comparisonId, listingId) {
    const { rows } = await this._query(
      `UPDATE price_comparisons
       SET listing_ids = array_remove(listing_ids, $2::uuid),
           updated_at  = NOW()
       WHERE id = $1
       RETURNING *`,
      [comparisonId, listingId]
    );
    return rows[0] || null;
  }
}

module.exports = ComparisonRepository;
