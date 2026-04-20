'use strict';

const { Worker } = require('bullmq');
const { query }  = require('../config/database');
const { connection } = require('./queue');

/**
 * Auto-moderation rules for new listings.
 * A listing passes auto-approval if it meets all criteria.
 * Otherwise it stays in 'pending_review' for manual admin review.
 */
const AUTO_APPROVE_RULES = {
  maxPriceM2:        500_000_000, // ₫500M/m² — reject suspiciously high values
  minPriceM2:              1_000, // ₫1K/m² — reject zero/junk prices
  maxTitleLength:            500,
  requiredContactPhone:     true,
  // Descriptions with these keywords get flagged
  flaggedKeywords: ['lừa đảo', 'cho vay', 'tín dụng đen', 'giả mạo'],
};

/**
 * moderationJob — triggered when a new listing is created.
 * Runs basic rule-based checks and either auto-approves or keeps pending.
 */
const worker = new Worker(
  'moderation',
  async (job) => {
    const { listingId } = job.data;
    console.info(`[ModerationJob] Processing listingId=${listingId}`);

    const { rows } = await query(
      `SELECT li.*, l.land_type, l.district
       FROM listings li
       JOIN lands l ON l.id = li.land_id
       WHERE li.id = $1`,
      [listingId]
    );

    const listing = rows[0];
    if (!listing) {
      console.warn(`[ModerationJob] Listing ${listingId} not found — skipping`);
      return { skipped: true };
    }

    const reasons = [];

    // Rule 1: price_per_m2 sanity check
    if (listing.price_per_m2) {
      if (listing.price_per_m2 > AUTO_APPROVE_RULES.maxPriceM2) {
        reasons.push(`price_per_m2 too high: ${listing.price_per_m2}`);
      }
      if (listing.price_per_m2 < AUTO_APPROVE_RULES.minPriceM2) {
        reasons.push(`price_per_m2 too low: ${listing.price_per_m2}`);
      }
    }

    // Rule 2: contact phone must be present
    if (AUTO_APPROVE_RULES.requiredContactPhone && !listing.contact_phone) {
      reasons.push('missing contact_phone');
    }

    // Rule 3: flagged keywords in description or title
    const textToCheck = `${listing.title || ''} ${listing.description || ''}`.toLowerCase();
    for (const kw of AUTO_APPROVE_RULES.flaggedKeywords) {
      if (textToCheck.includes(kw)) {
        reasons.push(`flagged keyword: "${kw}"`);
        break;
      }
    }

    // Rule 4: title length
    if (listing.title && listing.title.length > AUTO_APPROVE_RULES.maxTitleLength) {
      reasons.push('title too long');
    }

    if (reasons.length === 0) {
      // Auto-approve
      await query(
        `UPDATE listings SET status = 'active' WHERE id = $1 AND status = 'pending_review'`,
        [listingId]
      );
      console.info(`[ModerationJob] Listing ${listingId} auto-approved`);
      return { approved: true };
    } else {
      // Keep pending_review — add rejection hint for admin
      console.info(`[ModerationJob] Listing ${listingId} flagged for review: ${reasons.join('; ')}`);
      return { approved: false, reasons };
    }
  },
  {
    connection,
    concurrency: 5,
  }
);

worker.on('completed', (job, result) => {
  console.info(`[ModerationJob] Job ${job.id} done:`, result);
});

worker.on('failed', (job, err) => {
  console.error(`[ModerationJob] Job ${job ? job.id : 'unknown'} failed:`, err.message);
});

module.exports = { worker };
