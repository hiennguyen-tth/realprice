'use strict';

const BaseRepository = require('../shared/BaseRepository');

/**
 * LeadRepository — data access for the leads table.
 */
class LeadRepository extends BaseRepository {
  /** @param {Function} db */
  constructor(db) {
    super('leads', db);
  }

  /**
   * Find paginated leads for a specific listing.
   * @param {string} listingId
   * @param {number} limit
   * @param {number} offset
   * @returns {Promise<{ rows: object[], total: number }>}
   */
  async findByListingPaginated(listingId, limit = 20, offset = 0) {
    const [countRes, dataRes] = await Promise.all([
      this._query('SELECT COUNT(*) AS total FROM leads WHERE listing_id = $1', [listingId]),
      this._query(
        `SELECT * FROM leads WHERE listing_id = $1
         ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [listingId, limit, offset]
      ),
    ]);
    return {
      rows:  dataRes.rows,
      total: parseInt(countRes.rows[0].total, 10),
    };
  }

  /**
   * Count leads for a listing from a specific IP in the last hour (spam prevention).
   * @param {string} listingId
   * @param {string} ipAddress
   * @returns {Promise<number>}
   */
  async countRecentFromIp(listingId, ipAddress) {
    const { rows } = await this._query(
      `SELECT COUNT(*) AS total FROM leads
       WHERE listing_id = $1
         AND ip_address = $2::inet
         AND created_at > NOW() - INTERVAL '1 hour'`,
      [listingId, ipAddress]
    );
    return parseInt(rows[0].total, 10);
  }
}

module.exports = LeadRepository;
