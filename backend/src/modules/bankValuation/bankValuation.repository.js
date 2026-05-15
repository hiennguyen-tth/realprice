'use strict';

const BaseRepository = require('../shared/BaseRepository');
const { slugifyAddress } = require('../../utils/addressUtils');

const ADMIN_PREFIX_RE = /^(quận|quan|huyện|huyen|thị xã|thi xa|thành phố|thanh pho|tp|tx|thị trấn|thi tran|phường|phuong|xã|xa)\s+/i;

function stripAdminPrefix(value) {
  return String(value || '').trim().replace(ADMIN_PREFIX_RE, '').trim();
}

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
      `SELECT *,
              valuation_per_m2 AS valuation_price,
              max_loan_per_m2 AS max_loan
       FROM bank_valuations
       WHERE district = $1
         AND land_type = $2
         AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
         AND (ward IS NULL OR ward = $3)
       ORDER BY ward DESC NULLS LAST, bank_name ASC`,
      [district, landType, ward || null]
    );
    if (rows.length > 0) {
      return rows;
    }

    const targetDistrict = slugifyAddress(stripAdminPrefix(district || '').split(',')[0]);
    const { rows: fallbackRows } = await this._query(
      `SELECT *,
              valuation_per_m2 AS valuation_price,
              max_loan_per_m2 AS max_loan
       FROM bank_valuations
       WHERE land_type = $1
         AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
       ORDER BY ward DESC NULLS LAST, bank_name ASC`,
      [landType]
    );
    return fallbackRows.filter((row) => {
      const rowDistrict = slugifyAddress(stripAdminPrefix(row.district || ''));
      return rowDistrict === targetDistrict ||
        rowDistrict.includes(targetDistrict) ||
        targetDistrict.includes(rowDistrict);
    });
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
        `SELECT *,
                valuation_per_m2 AS valuation_price,
                max_loan_per_m2 AS max_loan
         FROM bank_valuations ${where}
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
              valuation_per_m2 AS valuation_price,
              max_loan_per_m2,
              max_loan_per_m2 AS max_loan,
              valuation_per_m2 * $4 AS total_valuation,
              max_loan_per_m2 * $4 AS total_max_loan
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
