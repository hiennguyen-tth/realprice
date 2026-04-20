import type {Land, Listing} from '../types';

/**
 * Calculate a score (0-100) for a listing relative to the district average price.
 *
 * Scoring factors:
 * - Price vs district average (40 points) — lower is better
 * - Legal status (20 points) — sổ đỏ/hồng = full, others partial
 * - Data completeness (20 points) — frontage, description, images
 * - Recency (20 points) — newer is better
 */
export function calcListingScore(
  listing: Listing,
  land: Land | null,
  districtAvgPerM2: number,
): number {
  let score = 0;

  // 1. Price factor (40 pts): cheaper vs district avg → higher score
  const priceRatio = listing.pricePerM2 / Math.max(districtAvgPerM2, 1);
  if (priceRatio <= 0.7) {
    score += 40;
  } else if (priceRatio <= 0.85) {
    score += 35;
  } else if (priceRatio <= 1.0) {
    score += 28;
  } else if (priceRatio <= 1.15) {
    score += 18;
  } else if (priceRatio <= 1.3) {
    score += 10;
  } else {
    score += 0;
  }

  // 2. Legal status (20 pts)
  const legalScores: Record<string, number> = {
    so_do: 20,
    so_hong: 18,
    hop_dong: 10,
    giay_to_khac: 5,
    chua_co: 0,
  };
  score += legalScores[listing.legalStatus] ?? 0;

  // 3. Data completeness (20 pts)
  let completeness = 0;
  if (listing.images.length >= 5) completeness += 8;
  else if (listing.images.length >= 1) completeness += 4;
  if (listing.description && listing.description.length >= 100) completeness += 4;
  if (listing.frontage !== undefined || listing.alleyWidth !== undefined) completeness += 4;
  if (listing.bedrooms !== undefined) completeness += 2;
  if (listing.floors !== undefined) completeness += 2;
  score += Math.min(20, completeness);

  // 4. Recency (20 pts): listed within last 30 days = full
  const daysSinceListed =
    (Date.now() - new Date(listing.createdAt).getTime()) /
    (1000 * 60 * 60 * 24);
  if (daysSinceListed <= 7) score += 20;
  else if (daysSinceListed <= 14) score += 16;
  else if (daysSinceListed <= 30) score += 12;
  else if (daysSinceListed <= 60) score += 8;
  else score += 4;

  // Boost bonus: +5 points if boosted (visibility but minor score)
  if (listing.isBoosted) score = Math.min(100, score + 5);

  // Land data sanity bonus
  if (land && land.avgPricePerM2 > 0) score = Math.min(100, score);

  return Math.round(Math.min(100, Math.max(0, score)));
}

/**
 * Get a label for a given score.
 */
export function getScoreLabel(score: number): string {
  if (score >= 80) return 'Khuyến nghị';
  if (score >= 60) return 'Tốt';
  if (score >= 40) return 'Trung bình';
  return 'Cần xem xét';
}

/**
 * Get score color (hex) for rendering.
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return '#16A34A'; // green-600
  if (score >= 60) return '#2563EB'; // blue-600
  if (score >= 40) return '#D97706'; // amber-600
  return '#DC2626'; // red-600
}
