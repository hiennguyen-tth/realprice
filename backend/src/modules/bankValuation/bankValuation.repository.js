'use strict';

const BaseRepository = require('../shared/BaseRepository');

/**
 * BankValuationRepository — data access for the bank_valuations table.
 */
class BankValuationRepository extends BaseRepository {
  /** @param {Function} db */
  constructor(db) {
    super('bank_valuations', db);
  }

  /**
   * Find bank valuations applicable to a land parcel.
   * Matches district, optionally ward, and land_type.
   * Returns valuations that are currently active (no effective_to or effective_to in future).
   *
   * @param {string} district
   * @param {string|null} ward
   * @param {string} landType
   * @returns {Promise<object[]>}
   */
  async findForLand(district, ward, landType) {
    const { rows } = await this._query(
      `SELECT * FROM bank_valuations
       WHERE district = $1
         AND land_type = $2
         AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
         AND (ward IS NULL OR ward = $3)
       ORDER BY ward DESC NULLS LAST, bank_name ASC`,
      [district, landType, ward || null]
    );
    return rows;
  }

  /**
   * Query bank valuations with optional district/ward/landType filters.
   * @param {object} filters
   * @param {number} limit
   * @param {number} offset
   * @returns {Promise<{ rows: object[], total: number }>}
   */
  async findFiltered(filters = {}, limit = 50, offset = 0) {
    const conditions = [`(effective_to IS NULL OR effective_to >= CURRENT_DATE)`];
    const params     = [];
    let   idx        = 1;

    if (filters.district) {
      conditions.push(`district = $${idx++}`);
      params.push(filters.district);
    }
    if (filters.ward) {
      conditions.push(`ward = $${idx++}`);
      params.push(filters.ward);
    }
    if (filters.landType) {
      conditions.push(`land_type = $${idx++}`);
      params.push(filters.landType);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const [countRes, dataRes] = await Promise.all([
      this._query(`SELECT COUNT(*) AS total FROM bank_valuations ${where}`, params),
      this._query(
        `SELECT * FROM bank_valuations ${where}
         ORDER BY district, ward NULLS LAST, bank_name
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, limit, offset]
      ),
    ]);

    return {
      rows:  dataRes.rows,
      total: parseInt(countRes.rows[0].total, 10),
    };
  }

  /**
   * Compare bank valuations for a land parcel given area.
   * @param {string} district
   * @param {string|null} ward
   * @param {string} landType
   * @param {number} areaM2
   * @returns {Promise<object[]>}
   */
  async compareForArea(district, ward, landType, areaM2) {
    const { rows } = await this._query(
      `SELECT *,
              valuation_price AS valuation_per_m2,
              (valuation_price * (ltv_ratio / 100.0))::BIGINT AS max_loan_per_m2,
              valuation_price * $4 AS total_valuation,
              ((valuation_price * (ltv_ratio / 100.0))::BIGINT * $4) AS max_loan
       FROM bank_valuations
       WHERE district  = $1
         AND land_type = $2
         AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
         AND (ward IS NULL OR ward = $3)
       ORDER BY max_loan DESC`,
      [district, landType, ward || null, areaM2]
    );
    return rows;
  }
}

module.exports = BankValuationRepository;
