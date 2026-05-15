'use strict';

const { NotFoundError } = require('../../utils/errors');
const { normalizeAddress, slugifyAddress } = require('../../utils/addressUtils');
const { parseBbox } = require('../../utils/geoUtils');
const { normalizeProvince } = require('../../utils/provinceUtils');

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
    const minPrice = query.minPrice ? parseInt(query.minPrice, 10) : null;
    const maxPrice = query.maxPrice ? parseInt(query.maxPrice, 10) : null;
    const listingType = query.listingType || null;
    const limit = Math.min(parseInt(query.limit, 10) || 200, 500);
    const bbox = parseBbox(query.bbox);

    if (!bbox) {
      return this.landRepo.getNationwideMarkers({
        minPrice,
        maxPrice,
        listingType,
        limit,
      });
    }

    return this.landRepo.getBbox({
      ...bbox,
      minPrice,
      maxPrice,
      listingType,
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
    if (!land) {
      throw new NotFoundError('Land');
    }
    return land;
  }

  /**
   * Get price history for a land parcel.
   * @param {string} landId
   * @returns {Promise<object[]>}
   */
  async getPriceHistory(landId) {
    await this.landRepo.findByIdOrFail(landId, 'Land');
    const rows = await this.landRepo.getPriceHistory(landId);
    const points = rows
      .slice()
      .reverse()
      .map((row) => ({
        date: row.recorded_at,
        avgPrice: Number(row.avg_price) || 0,
        pricePerM2: Number(row.price_per_m2) || 0,
        totalListings: Number(row.total_listings) || 0,
      }));

    const calcChange = (days) => {
      if (points.length < 2) {
        return 0;
      }
      const latest = points[points.length - 1];
      const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
      const previous = [...points].reverse().find((point) => new Date(point.date).getTime() <= cutoff) || points[0];
      if (!previous.pricePerM2) {
        return 0;
      }
      return Math.round(((latest.pricePerM2 - previous.pricePerM2) / previous.pricePerM2) * 1000) / 10;
    };

    return {
      landId,
      points,
      changePercent30d: calcChange(30),
      changePercent90d: calcChange(90),
      changePercent180d: calcChange(180),
    };
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
    if (lat !== null && lat !== undefined && lng !== null && lng !== undefined) {
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
    const actualDistrict = await this.landRepo.findDistrictBySlug(district) || district;
    const [overview, topStreets, change30, change90] = await Promise.all([
      this.landRepo.getDistrictOverview(actualDistrict, { resolved: true }),
      this.landRepo.getTopStreetsByDistrict(actualDistrict, 10, { resolved: true }),
      this.landRepo.getDistrictPriceChange(actualDistrict, 30, { resolved: true }),
      this.landRepo.getDistrictPriceChange(actualDistrict, 90, { resolved: true }),
    ]);

    if (!overview) {
      throw new NotFoundError('District');
    }

    const calcChange = (recent, prev) => {
      if (!prev || prev === 0) {
        return 0;
      }
      return Math.round(((recent - prev) / prev) * 1000) / 10;
    };

    return {
      district: overview.district,
      city: normalizeProvince(overview.district, overview.province),
      avgPricePerM2: Number(overview.avg_price_per_m2) || 0,
      medianPricePerM2: Number(overview.median_price_per_m2) || 0,
      q1PricePerM2: Number(overview.q1_price_per_m2) || 0,
      q3PricePerM2: Number(overview.q3_price_per_m2) || 0,
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
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 30, 1), 100);
    const districts = await this.landRepo.getDistrictSummaries(safeLimit);
    return districts.map((d) => ({
      district: d.district,
      province: normalizeProvince(d.district, d.province),
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
