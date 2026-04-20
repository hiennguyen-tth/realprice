'use strict';

const AWS  = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const config  = require('../../config');
const { NotFoundError, ForbiddenError, ValidationError } = require('../../utils/errors');
const { parsePagination, buildPagination } = require('../../utils/formatUtils');
const { invalidateCache } = require('../../middleware/cache');

const BOOST_DURATIONS = {
  '3':  { days: 3,  price: config.boost.price3Days  },
  '7':  { days: 7,  price: config.boost.price7Days  },
  '30': { days: 30, price: config.boost.price30Days },
};

/**
 * ListingService — core business logic for listings.
 */
class ListingService {
  /**
   * @param {import('./listing.repository')} listingRepository
   * @param {import('../land/land.service')} landService
   * @param {import('../jobs/queue')} jobQueue  optional
   */
  constructor(listingRepository, landService, jobQueue = null) {
    this.listingRepo = listingRepository;
    this.landService = landService;
    this.jobQueue    = jobQueue;
  }

  /**
   * List listings with filters and pagination.
   * @param {object} query
   * @returns {Promise<{ listings: object[], pagination: object }>}
   */
  async getListings(query) {
    const { page, limit, offset } = parsePagination(query);

    const filters = {};
    if (query.landId)   {filters.landId      = query.landId;}
    if (query.status)   {filters.status      = query.status;}
    if (query.type)     {filters.listingType = query.type;}
    if (query.minPrice) {filters.minPrice    = parseInt(query.minPrice, 10);}
    if (query.maxPrice) {filters.maxPrice    = parseInt(query.maxPrice, 10);}

    const { rows, total } = await this.listingRepo.findPaginated(filters, limit, offset);
    return {
      listings:   rows,
      pagination: buildPagination(total, page, limit),
    };
  }

  /**
   * Get a single listing by ID and increment its view count.
   * @param {string} id
   * @returns {Promise<object>}
   */
  async getListingById(id) {
    const listing = await this.listingRepo.findByIdWithLand(id);
    if (!listing) {
      throw new NotFoundError('Listing');
    }
    // Fire-and-forget view count increment
    this.listingRepo.incrementViewCount(id).catch(() => {});
    return listing;
  }

  /**
   * Create a new listing for the authenticated user.
   * Uses LandService.findOrCreateLand for deduplication.
   *
   * @param {object} data
   * @param {string} sellerId
   * @returns {Promise<object>}
   */
  async createListing(data, sellerId) {
    // Find or create the land parcel
    const { land } = await this.landService.findOrCreateLand({
      lat:          data.lat,
      lng:          data.lng,
      address:      data.address,
      ward:         data.ward,
      district:     data.district,
      province:     data.province,
      area_m2:      data.area_m2,
      land_type:    data.land_type,
      legal_status: data.legal_status,
      frontage_m:   data.frontage_m,
      alley_width_m: data.alley_width_m,
      floors:        data.floors,
    });

    const listing = await this.listingRepo.create({
      land_id:       land.id,
      seller_id:     sellerId,
      price:         data.price,
      area:          data.area || land.area_m2,
      title:         data.title,
      description:   data.description || null,
      source:        data.source       || 'user',
      status:        'pending_review',
      listing_type:  data.listing_type || 'sale',
      images:        JSON.stringify(data.images || []),
      contact_phone: data.contact_phone || null,
      contact_name:  data.contact_name  || null,
    });

    // Enqueue moderation job
    if (this.jobQueue) {
      await this.jobQueue.add('moderate-listing', { listingId: listing.id }).catch(() => {});
    }

    // Invalidate land bbox cache
    await invalidateCache('cache:/api/lands*');

    return listing;
  }

  /**
   * Update a listing. Only the seller or an admin may update.
   * @param {string} id
   * @param {object} data
   * @param {object} actor - { id, role }
   * @returns {Promise<object>}
   */
  async updateListing(id, data, actor) {
    const listing = await this.listingRepo.findByIdOrFail(id, 'Listing');

    if (listing.seller_id !== actor.id && actor.role !== 'admin') {
      throw new ForbiddenError('You do not own this listing');
    }

    const allowedFields = [
      'price', 'title', 'description', 'images',
      'contact_phone', 'contact_name', 'listing_type', 'status',
    ];

    const updateData = {};
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateData[field] = field === 'images' ? JSON.stringify(data[field]) : data[field];
      }
    }

    // Sellers cannot set their own listing to 'active'
    if (actor.role !== 'admin' && updateData.status === 'active') {
      delete updateData.status;
    }

    const updated = await this.listingRepo.update(id, updateData);
    await invalidateCache('cache:/api/lands*');
    await invalidateCache(`cache:/api/listings/${id}*`);
    return updated;
  }

  /**
   * Delete (soft-hide) a listing.
   * @param {string} id
   * @param {object} actor
   */
  async deleteListing(id, actor) {
    const listing = await this.listingRepo.findByIdOrFail(id, 'Listing');
    if (listing.seller_id !== actor.id && actor.role !== 'admin') {
      throw new ForbiddenError('You do not own this listing');
    }
    const updated = await this.listingRepo.update(id, { status: 'hidden' });
    await invalidateCache('cache:/api/lands*');
    await invalidateCache(`cache:/api/listings/${id}*`);
    return updated;
  }

  /**
   * Create an S3 presigned URL for uploading a listing image.
   * @param {string} contentType - MIME type e.g. 'image/jpeg'
   * @returns {Promise<{ uploadUrl: string, key: string, publicUrl: string }>}
   */
  async getUploadUrl(contentType) {
    const ext = contentType.split('/')[1] || 'jpg';
    const key = `listings/${uuidv4()}.${ext}`;

    const s3 = new AWS.S3({
      region:          config.aws.region,
      accessKeyId:     config.aws.accessKeyId,
      secretAccessKey: config.aws.secretAccessKey,
    });

    const uploadUrl = await s3.getSignedUrlPromise('putObject', {
      Bucket:      config.aws.s3Bucket,
      Key:         key,
      ContentType: contentType,
      Expires:     config.aws.presignedUrlExpiry,
    });

    return {
      uploadUrl,
      key,
      publicUrl: `https://${config.aws.s3Bucket}.s3.${config.aws.region}.amazonaws.com/${key}`,
    };
  }

  /**
   * Apply a boost to a listing.
   * @param {string} listingId
   * @param {string} duration - '3' | '7' | '30'
   * @param {object} actor
   * @returns {Promise<{ listing: object, boostPrice: number }>}
   */
  async boostListing(listingId, duration, actor) {
    const listing = await this.listingRepo.findByIdOrFail(listingId, 'Listing');
    if (listing.seller_id !== actor.id && actor.role !== 'admin') {
      throw new ForbiddenError('You do not own this listing');
    }

    const option = BOOST_DURATIONS[String(duration)];
    if (!option) {
      throw new ValidationError('Invalid boost duration. Must be 3, 7, or 30 days.');
    }

    const expiresAt = new Date(Date.now() + option.days * 24 * 60 * 60 * 1000);
    const updated   = await this.listingRepo.applyBoost(listingId, expiresAt);

    return { listing: updated, boostPrice: option.price };
  }

  /**
   * Get similar listings for a given listing.
   * @param {string} listingId
   * @returns {Promise<object[]>}
   */
  async getSimilarListings(listingId) {
    await this.listingRepo.findByIdOrFail(listingId, 'Listing');
    return this.listingRepo.findSimilar(listingId, 6);
  }
}

module.exports = ListingService;
