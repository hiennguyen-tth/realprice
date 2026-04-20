import type { Listing, ComparisonAnalysis } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Listing score (0–100)
// Factors: price vs district avg, area, recency, image quality
// ─────────────────────────────────────────────────────────────────────────────

export interface ScoreBreakdown {
  total: number;
  priceScore: number;
  areaScore: number;
  recencyScore: number;
  completenessScore: number;
}

/**
 * Calculate a composite score for a listing relative to its peers.
 * Higher score = better deal.
 */
export function calcListingScore(
  listing: Listing,
  peers: Listing[]
): ScoreBreakdown {
  if (peers.length === 0) {
    return {
      total: 50,
      priceScore: 50,
      areaScore: 50,
      recencyScore: 50,
      completenessScore: 50,
    };
  }

  // ── Price score (lower price/m² = better)
  const prices = peers.map((p) => p.pricePerM2).filter(Boolean);
  const avgPricePerM2 = prices.reduce((a, b) => a + b, 0) / prices.length;
  const maxPricePerM2 = Math.max(...prices);
  const minPricePerM2 = Math.min(...prices);
  const priceRange = maxPricePerM2 - minPricePerM2 || 1;
  // Invert: lowest price gets 100
  const priceScore = Math.round(
    100 - ((listing.pricePerM2 - minPricePerM2) / priceRange) * 100
  );

  // ── Area score (larger area = better)
  const areas = peers.map((p) => p.area).filter(Boolean);
  const maxArea = Math.max(...areas);
  const minArea = Math.min(...areas);
  const areaRange = maxArea - minArea || 1;
  const areaScore = Math.round(
    ((listing.area - minArea) / areaRange) * 100
  );

  // ── Recency score
  const now = Date.now();
  const createdAt = new Date(listing.createdAt).getTime();
  const ageDays = (now - createdAt) / (1000 * 60 * 60 * 24);
  const recencyScore = Math.round(Math.max(0, 100 - ageDays * 2));

  // ── Completeness score
  let completeness = 0;
  if (listing.images.length >= 3) completeness += 30;
  else if (listing.images.length >= 1) completeness += 15;
  if (listing.description && listing.description.length > 50) completeness += 20;
  if (listing.contactPhone) completeness += 20;
  if (listing.contactName) completeness += 10;
  if (listing.location) completeness += 20;
  const completenessScore = Math.min(100, completeness);

  // ── Composite
  const total = Math.round(
    priceScore * 0.4 +
    areaScore * 0.3 +
    recencyScore * 0.15 +
    completenessScore * 0.15
  );

  // Price vs avg annotation (not used in score but useful)
  void avgPricePerM2;

  return {
    total: Math.max(0, Math.min(100, total)),
    priceScore: Math.max(0, Math.min(100, priceScore)),
    areaScore: Math.max(0, Math.min(100, areaScore)),
    recencyScore: Math.max(0, Math.min(100, recencyScore)),
    completenessScore: Math.max(0, Math.min(100, completenessScore)),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Analyze a comparison set
// ─────────────────────────────────────────────────────────────────────────────

export function analyzeComparison(listings: Listing[]): ComparisonAnalysis {
  if (listings.length === 0) {
    return {
      cheapestIndex: 0,
      bestValueIndex: 0,
      largestAreaIndex: 0,
      recommendation: "",
      summary: "Chưa có tin đăng để so sánh.",
    };
  }

  const cheapestIndex = listings.reduce(
    (minIdx, l, i) => (l.price < listings[minIdx].price ? i : minIdx),
    0
  );

  const bestValueIndex = listings.reduce(
    (bestIdx, l, i) =>
      l.pricePerM2 < listings[bestIdx].pricePerM2 ? i : bestIdx,
    0
  );

  const largestAreaIndex = listings.reduce(
    (maxIdx, l, i) => (l.area > listings[maxIdx].area ? i : maxIdx),
    0
  );

  const best = listings[bestValueIndex];
  const cheapest = listings[cheapestIndex];

  const recommendation =
    bestValueIndex === cheapestIndex
      ? `Tin #${bestValueIndex + 1} vừa rẻ nhất vừa có giá/m² tốt nhất — lựa chọn tối ưu.`
      : `Tin #${bestValueIndex + 1} có giá/m² tốt nhất (${(best.pricePerM2 / 1_000_000).toFixed(0)} triệu/m²). Tin #${cheapestIndex + 1} có giá tổng thấp nhất.`;

  const avgPrice =
    listings.reduce((s, l) => s + l.price, 0) / listings.length;
  const savingVsAvg = avgPrice - cheapest.price;

  const summary =
    `So sánh ${listings.length} tin đăng: giá trung bình ${(avgPrice / 1_000_000_000).toFixed(1)} tỷ. ` +
    `Tiết kiệm lên tới ${(savingVsAvg / 1_000_000).toFixed(0)} triệu so với trung bình.`;

  return {
    cheapestIndex,
    bestValueIndex,
    largestAreaIndex,
    recommendation,
    summary,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Score label
// ─────────────────────────────────────────────────────────────────────────────

export function scoreLabel(score: number): string {
  if (score >= 80) return "Rất tốt";
  if (score >= 60) return "Tốt";
  if (score >= 40) return "Trung bình";
  if (score >= 20) return "Kém";
  return "Rất kém";
}

export function scoreColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-blue-600";
  if (score >= 40) return "text-yellow-600";
  return "text-red-600";
}
