'use strict';

const { NotFoundError } = require('../../utils/errors');
const { normalizeAddress, slugifyAddress } = require('../../utils/addressUtils');
const { parseBbox } = require('../../utils/geoUtils');

// Infer province from district name when DB province field is null
const HN_DISTRICTS = ['hoàn kiếm', 'ba đình', 'đống đa', 'hai bà trưng', 'tây hồ', 'long biên', 'cầu giấy', 'thanh xuân', 'hoàng mai', 'hà đông', 'nam từ liêm', 'bắc từ liêm', 'gia lâm', 'đông anh', 'sóc sơn', 'thanh trì', 'mê linh', 'sơn tây'];
const DN_DISTRICTS = ['hải châu', 'thanh khê', 'sơn trà', 'ngũ hành sơn', 'liên chiểu', 'cẩm lệ', 'hòa vang'];
const CT_DISTRICTS = ['ninh kiều', 'bình thủy', 'cái răng', 'ô môn', 'thốt nốt', 'phong điền', 'cờ đỏ', 'vĩnh thạnh', 'thới lai'];

function inferProvince(district) {
  if (!district) return 'TP.HCM';
  const d = district.toLowerCase().trim();
  if (HN_DISTRICTS.some(n => d.includes(n))) return 'Hà Nội';
  if (DN_DISTRICTS.some(n => d.includes(n))) return 'Đà Nẵng';
  if (CT_DISTRICTS.some(n => d.includes(n))) return 'Cần Thơ';
  return 'TP.HCM';
}
const { parsePagination, buildPagination } = require('../../utils/formatUtils');

/**
 * LandService — business logic for land parcel management.
 * Implements the deduplication strategy: GPS → normalised address → create.
 */
class LandService {
  /**
   * @param {import('./land.repository')} landRepository
   * @param {import('../bankValuation/bankValuation.repository')} bankValuationRepository
   */
  constructor(landRepository, bankValuationRepository) {
    this.landRepo = landRepository;
    this.bvRepo = bankValuationRepository;
  }

  /**
   * Query lands visible within a map bounding box.
   * Applies listing_type, price, and area filters.
   *
   * @param {object} query - Express query params
   * @returns {Promise<object[]>}
   */
  async getLandsInBbox(query) {
    const bbox = parseBbox(query.bbox);
    if (!bbox) {
      return [];
    }

    const minPrice = query.minPrice ? parseInt(query.minPrice, 10) : null;
    const maxPrice = query.maxPrice ? parseInt(query.maxPrice, 10) : null;
    const limit = Math.min(parseInt(query.limit, 10) || 200, 500);

    return this.landRepo.getBbox({
      ...bbox,
      minPrice,
      maxPrice,
      limit,
    });
  }

  /**
   * Get a single land parcel by ID.
   * @param {string} id
   * @returns {Promise<object>}
   */
  async getLandById(id) {
    const land = await this.landRepo.findByIdWithPrices(id);
    if (!land) throw new NotFoundError('Land');
    return land;
  }

  /**
   * Get price history for a land parcel.
   * @param {string} landId
   * @returns {Promise<object[]>}
   */
  async getPriceHistory(landId) {
    await this.landRepo.findByIdOrFail(landId, 'Land');
    return this.landRepo.getPriceHistory(landId);
  }

  /**
   * Get nearby lands within 500m.
   * @param {string} landId
   * @returns {Promise<object[]>}
   */
  async getNearby(landId) {
    await this.landRepo.findByIdOrFail(landId, 'Land');
    return this.landRepo.findNearby(landId, 500, 10);
  }

  /**
   * Get bank valuations applicable to a land parcel.
   * @param {string} landId
   * @returns {Promise<object[]>}
   */
  async getBankValuations(landId) {
    const land = await this.landRepo.findByIdOrFail(landId, 'Land');
    return this.bvRepo.findForLand(land.district, land.ward, land.land_type);
  }

  /**
   * Find an existing land or create a new one.
   * Deduplication order:
   *   1. GPS radius 10m match via PostGIS ST_DWithin
   *   2. Normalized address match via pg_trgm
   *   3. Create a new Land record
   *
   * @param {object} data - { lat, lng, address, ward, district, province, ... }
   * @returns {Promise<{ land: object, created: boolean }>}
   */
  async findOrCreateLand(data) {
    const { lat, lng, address } = data;

    // Step 1: GPS proximity
    if (lat != null && lng != null) {
      const byGps = await this.landRepo.findByGpsProximity(lat, lng);
      if (byGps) {
        return { land: byGps, created: false };
      }
    }

    // Step 2: Normalized address
    const normAddr = normalizeAddress(address);
    if (normAddr) {
      const byAddr = await this.landRepo.findByNormalizedAddress(normAddr);
      if (byAddr) {
        return { land: byAddr, created: false };
      }
    }

    // Step 3: Create
    const slug = slugifyAddress(`${address || ''} ${data.district || ''}`);
    const land = await this.landRepo.create({
      lat: lat,
      lng: lng,
      address: address,
      normalized_address: normAddr,
      ward: data.ward || null,
      district: data.district || null,
      province: data.province || null,
      area_m2: data.area_m2 || null,
      land_type: data.land_type || 'residential',
      legal_status: data.legal_status || 'chua_co_giay_to',
      frontage_m: data.frontage_m || null,
      alley_width_m: data.alley_width_m || null,
      floors: data.floors || null,
      slug: slug,
    });
    return { land, created: true };
  }

  async getDistrictOverview(district) {
    const [overview, topStreets, change30, change90] = await Promise.all([
      this.landRepo.getDistrictOverview(district),
      this.landRepo.getTopStreetsByDistrict(district, 10),
      this.landRepo.getDistrictPriceChange(district, 30),
      this.landRepo.getDistrictPriceChange(district, 90),
    ]);

    if (!overview) {
      throw new NotFoundError('District');
    }

    const calcChange = (recent, prev) => {
      if (!prev || prev == 0) return 0;
      return Math.round(((recent - prev) / prev) * 1000) / 10;
    };

    return {
      district: overview.district,
      city: overview.province || 'TP.HCM',
      avgPricePerM2: Number(overview.avg_price_per_m2) || 0,
      minPricePerM2: Number(overview.min_price_per_m2) || 0,
      maxPricePerM2: Number(overview.max_price_per_m2) || 0,
      totalListings: Number(overview.total_listings) || 0,
      priceChange30d: calcChange(
        Number(change30?.recent_avg), Number(change30?.prev_avg)
      ),
      priceChange90d: calcChange(
        Number(change90?.recent_avg), Number(change90?.prev_avg)
      ),
      topStreets: topStreets.map(s => ({
        street: s.street,
        avgPricePerM2: Number(s.avg_price_per_m2) || 0,
        totalListings: Number(s.total_listings) || 0,
      })),
    };
  }

  async getDistrictSummaries(limit = 30) {
    const districts = await this.landRepo.getDistrictSummaries(limit);
    return districts.map((d) => ({
      district: d.district,
      province: d.province || inferProvince(d.district),
      slug: slugifyAddress(d.district || ''),
      avgPricePerM2: Number(d.avg_price_per_m2) || 0,
      minPricePerM2: Number(d.min_price_per_m2) || 0,
      maxPricePerM2: Number(d.max_price_per_m2) || 0,
      totalListings: Number(d.total_listings) || 0,
    }));
  }

  async getLandBySlug(districtSlug, streetSlug) {
    const land = await this.landRepo.findByDistrictAndAddress(districtSlug, streetSlug);
    if (!land) {
      throw new NotFoundError('Land');
    }
    return {
      ...land,
      lat: land.lat_coord ?? land.lat,
      lng: land.lng_coord ?? land.lng,
    };
  }
}

module.exports = LandService;
