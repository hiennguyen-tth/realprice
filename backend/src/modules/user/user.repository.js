'use strict';

const BaseRepository = require('../shared/BaseRepository');

/**
 * UserRepository — data access for the users table.
 * Extends BaseRepository (Liskov Substitution Principle).
 */
class UserRepository extends BaseRepository {
  /** @param {Function} db - pg query function */
  constructor(db) {
    super('users', db);
  }

  /**
   * Find a user by their phone number.
   * @param {string} phone
   * @returns {Promise<object|null>}
   */
  async findByPhone(phone) {
    const { rows } = await this._query(
      'SELECT * FROM users WHERE phone = $1 LIMIT 1',
      [phone]
    );
    return rows[0] || null;
  }

  /**
   * Find a user by their email address.
   * @param {string} email
   * @returns {Promise<object|null>}
   */
  async findByEmail(email) {
    const { rows } = await this._query(
      'SELECT * FROM users WHERE email = $1 LIMIT 1',
      [email]
    );
    return rows[0] || null;
  }

  /**
   * Return a user's saved/favorite listing IDs.
   * @param {string} userId
   * @param {number} limit
   * @param {number} offset
   * @returns {Promise<{ rows: object[], total: number }>}
   */
  async getSavedListings(userId, limit = 20, offset = 0) {
    const { rows } = await this._query(
      `SELECT sl.id AS saved_id, sl.created_at AS saved_at,
              li.*
       FROM saved_listings sl
       JOIN listings li ON li.id = sl.listing_id
       WHERE sl.user_id = $1
       ORDER BY sl.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    const { rows: countRows } = await this._query(
      'SELECT COUNT(*) AS total FROM saved_listings WHERE user_id = $1',
      [userId]
    );
    return { rows, total: parseInt(countRows[0].total, 10) };
  }

  /**
   * Save a listing (add to favorites).
   * @param {string} userId
   * @param {string} listingId
   * @returns {Promise<object>}
   */
  async saveListing(userId, listingId) {
    const { rows } = await this._query(
      `INSERT INTO saved_listings (user_id, listing_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, listing_id) DO NOTHING
       RETURNING *`,
      [userId, listingId]
    );
    return rows[0] || null;
  }

  /**
   * Unsave (unfavorite) a listing.
   * @param {string} userId
   * @param {string} listingId
   * @returns {Promise<boolean>}
   */
  async unsaveListing(userId, listingId) {
    const { rowCount } = await this._query(
      'DELETE FROM saved_listings WHERE user_id = $1 AND listing_id = $2',
      [userId, listingId]
    );
    return rowCount > 0;
  }

  /**
   * Check if a user has saved a particular listing.
   * @param {string} userId
   * @param {string} listingId
   * @returns {Promise<boolean>}
   */
  async hasSaved(userId, listingId) {
    const { rows } = await this._query(
      'SELECT 1 FROM saved_listings WHERE user_id = $1 AND listing_id = $2 LIMIT 1',
      [userId, listingId]
    );
    return rows.length > 0;
  }
}

module.exports = UserRepository;
