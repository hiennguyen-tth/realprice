'use strict';

const { ValidationError } = require('../../utils/errors');
const { calcBankValuation } = require('../../utils/priceUtils');
const { parsePagination, buildPagination } = require('../../utils/formatUtils');

/**
 * BankValuationService — business logic for bank valuation queries.
 */
class BankValuationService {
  /**
   * @param {import('./bankValuation.repository')} bankValuationRepository
   * @param {import('../land/land.repository')} landRepository
   */
  constructor(bankValuationRepository, landRepository) {
    this.bvRepo   = bankValuationRepository;
    this.landRepo = landRepository;
  }

  /**
   * Get bank valuations with optional filters.
   * @param {object} query - { district?, ward?, landType?, page?, limit? }
   * @returns {Promise<{ valuations: object[], pagination: object }>}
   */
  async getValuations(query) {
    const { page, limit, offset } = parsePagination(query);

    const filters = {};
    if (query.district) {filters.district = query.district;}
    if (query.ward)     {filters.ward     = query.ward;}
    if (query.landType) {filters.landType = query.landType;}

    const { rows, total } = await this.bvRepo.findFiltered(filters, limit, offset);
    return {
      valuations: rows,
      pagination: buildPagination(total, page, limit),
    };
  }

  /**
   * Compare bank valuations for a specific land + area combination.
   * @param {object} query - { landId, area }
   * @returns {Promise<object[]>}
   */
  async compareForLand(query) {
    const { landId, area } = query;

    if (!landId) { throw new ValidationError('landId is required'); }
    const areaM2 = parseFloat(area);
    if (!areaM2 || areaM2 <= 0) { throw new ValidationError('area must be a positive number'); }

    const land = await this.landRepo.findByIdOrFail(landId, 'Land');

    const rawValuations = await this.bvRepo.compareForArea(
      land.district, land.ward, land.land_type, areaM2
    );

    return calcBankValuation(areaM2, rawValuations);
  }

  /**
   * Create a new bank valuation entry (admin only).
   * @param {object} data
   * @returns {Promise<object>}
   */
  async createValuation(data) {
    return this.bvRepo.create(data);
  }
}

module.exports = BankValuationService;
