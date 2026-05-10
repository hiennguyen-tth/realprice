'use strict';

/**
 * Price calculation utilities for RealPrice.
 */

/**
 * Calculate a composite score for a listing relative to its market context.
 * Score range: 0–100.
 *
 * Scoring criteria:
 *  +20  if price_per_m2 is below district average
 *  +15  if legal_status is 'so_do'
 *  +10  if no alley (alley_width_m is null or 0)
 *  +10  if frontage >= 4m
 *  +5   if listing is < 7 days old
 *  +5   if price is below district median
 *  +5   if floor count is stated
 *
 * @param {object} listing
 * @param {object} land
 * @param {object} districtIndex  - area_price_index row for the district
 * @returns {number} score 0-100
 */
function calcListingScore(listing, land, districtIndex) {
  let score = 30; // baseline

  if (districtIndex && listing.price_per_m2 && districtIndex.avg_price_per_m2) {
    if (listing.price_per_m2 < districtIndex.avg_price_per_m2) {
      score += 20;
    }
    if (listing.price_per_m2 < districtIndex.median_price_per_m2) {
      score += 5;
    }
  }

  if (land.legal_status === 'so_do') {
    score += 15;
  }

  if (!land.alley_width_m || land.alley_width_m === 0) {
    score += 10;
  }

  if (land.frontage_m && land.frontage_m >= 4) {
    score += 10;
  }

  const ageMs = Date.now() - new Date(listing.created_at).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  if (ageDays < 7) {
    score += 5;
  }

  if (land.floors && land.floors > 0) {
    score += 5;
  }

  return Math.min(score, 100);
}

/**
 * Analyse an array of enriched listings to produce a comparison summary.
 * @param {Array<{ listing: object, land: object, score: number }>} items
 * @returns {object} analysisResult
 */
function analyzeComparison(items) {
  if (!items || items.length === 0) {
    return { message: 'Không có bất động sản để so sánh' };
  }

  const prices = items.map((i) => i.listing.price);
  const perM2s = items.map((i) => i.listing.price_per_m2).filter(Boolean);
  const areas = items.map((i) => i.listing.area_m2).filter(Boolean);

  const cheapest = items.reduce((a, b) => (a.listing.price <= b.listing.price ? a : b));
  const bestPerM2 = perM2s.length
    ? items.filter((i) => i.listing.price_per_m2).reduce((a, b) =>
      a.listing.price_per_m2 <= b.listing.price_per_m2 ? a : b)
    : cheapest;
  const largest = areas.length
    ? items.filter((i) => i.listing.area_m2).reduce((a, b) =>
      a.listing.area_m2 >= b.listing.area_m2 ? a : b)
    : null;
  const bestValue = items.reduce((a, b) => (a.score >= b.score ? a : b));

  const priceMin = Math.min(...prices);
  const priceMax = Math.max(...prices);
  const perM2Min = perM2s.length ? Math.min(...perM2s) : null;
  const perM2Max = perM2s.length ? Math.max(...perM2s) : null;

  let recommendation;
  if (cheapest.listing.id === bestValue.listing.id) {
    recommendation = `"${cheapest.listing.title}" vừa có giá thấp nhất vừa đạt điểm giá trị tổng thể cao nhất — rất đáng cân nhắc.`;
  } else {
    recommendation =
      `"${cheapest.listing.title}" có giá tốt nhất. ` +
      `"${bestValue.listing.title}" đạt điểm giá trị cao nhất (pháp lý, vị trí, giá thị trường).`;
  }

  return {
    cheapestListingId: cheapest.listing.id,
    cheapestListing: { id: cheapest.listing.id, title: cheapest.listing.title, price: cheapest.listing.price },

    bestPerM2ListingId: bestPerM2.listing.id,
    bestPerM2Listing: { id: bestPerM2.listing.id, title: bestPerM2.listing.title, price_per_m2: bestPerM2.listing.price_per_m2 },

    largestListingId: largest?.listing.id ?? null,
    largestListing: largest ? { id: largest.listing.id, title: largest.listing.title, area_m2: largest.listing.area_m2 } : null,

    bestValueListingId: bestValue.listing.id,
    priceRange: { min: priceMin, max: priceMax },
    perM2Range: { min: perM2Min, max: perM2Max },
    recommendation,
    rankings: items
      .slice()
      .sort((a, b) => b.score - a.score)
      .map((i) => ({ listingId: i.listing.id, score: i.score })),
  };
}

/**
 * Calculate a bank loan estimate for a land parcel.
 * @param {number} areaM2
 * @param {Array<object>} bankValuations
 * @returns {Array<object>} loan estimates per bank
 */
function calcBankValuation(areaM2, bankValuations) {
  return bankValuations.map((bv) => ({
    bankName: bv.bank_name,
    valuationPerM2: bv.valuation_per_m2,
    totalValuation: bv.valuation_per_m2 * areaM2,
    ltvRatio: parseFloat(bv.ltv_ratio),
    maxLoanPerM2: bv.max_loan_per_m2,
    maxLoan: bv.max_loan_per_m2 * areaM2,
    effectiveFrom: bv.effective_from,
    effectiveTo: bv.effective_to,
  }));
}

/**
 * Compute percentile of a sorted numeric array.
 * @param {number[]} sorted
 * @param {number} p  0-1
 * @returns {number}
 */
function percentile(sorted, p) {
  if (!sorted.length) {
    return 0;
  }
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return lo === hi ? sorted[lo] : sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

/**
 * Aggregate a list of price_per_m2 values into summary statistics.
 * @param {number[]} values
 * @returns {{ avg, median, min, max, count }}
 */
function aggregatePrices(values) {
  const valid = values.filter((v) => v != null && !isNaN(v)).sort((a, b) => a - b);
  if (!valid.length) {
    return { avg: 0, median: 0, min: 0, max: 0, count: 0 };
  }
  const avg = Math.round(valid.reduce((s, v) => s + v, 0) / valid.length);
  const median = Math.round(percentile(valid, 0.5));
  const min = valid[0];
  const max = valid[valid.length - 1];
  return { avg, median, min, max, count: valid.length };
}

module.exports = {
  calcListingScore,
  analyzeComparison,
  calcBankValuation,
  aggregatePrices,
  percentile,
};
