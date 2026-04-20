import type { BoundingBox } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Vietnamese administrative regions bounding boxes
// ─────────────────────────────────────────────────────────────────────────────

export const VIETNAM_REGIONS: Record<string, BoundingBox> = {
  hanoi: { west: 105.6, south: 20.6, east: 106.0, north: 21.1 },
  "ho-chi-minh": { west: 106.5, south: 10.6, east: 107.0, north: 11.1 },
  "da-nang": { west: 108.0, south: 15.9, east: 108.4, north: 16.2 },
  "can-tho": { west: 105.6, south: 9.9, east: 106.0, north: 10.2 },
  "hai-phong": { west: 106.5, south: 20.7, east: 107.1, north: 21.1 },
  "bien-hoa": { west: 106.8, south: 10.9, east: 107.1, north: 11.1 },
};

export const VIETNAM_CENTER: [number, number] = [108.2022, 16.0544];
export const VIETNAM_DEFAULT_ZOOM = 6;
export const CITY_ZOOM = 12;
export const DISTRICT_ZOOM = 14;
export const STREET_ZOOM = 16;

// ─────────────────────────────────────────────────────────────────────────────
// Convert region slug to BoundingBox
// ─────────────────────────────────────────────────────────────────────────────

export function regionToBbox(region: string): BoundingBox {
  const normalized = region.toLowerCase().replace(/\s+/g, "-");
  return VIETNAM_REGIONS[normalized] ?? VIETNAM_REGIONS["ho-chi-minh"];
}

// ─────────────────────────────────────────────────────────────────────────────
// Build deterministic cache key from bounding box (rounded to 2 decimals)
// ─────────────────────────────────────────────────────────────────────────────

export function bboxToCacheKey(bbox: BoundingBox): string {
  const r = (n: number) => Math.round(n * 100) / 100;
  return `${r(bbox.west)},${r(bbox.south)},${r(bbox.east)},${r(bbox.north)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Expand bbox slightly for better tile coverage
// ─────────────────────────────────────────────────────────────────────────────

export function expandBbox(bbox: BoundingBox, factor = 0.1): BoundingBox {
  const latDelta = (bbox.north - bbox.south) * factor;
  const lngDelta = (bbox.east - bbox.west) * factor;
  return {
    west: bbox.west - lngDelta,
    south: bbox.south - latDelta,
    east: bbox.east + lngDelta,
    north: bbox.north + latDelta,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Convert MapboxGL viewport bounds to BoundingBox
// ─────────────────────────────────────────────────────────────────────────────

export function viewportToBbox(bounds: {
  _sw: { lng: number; lat: number };
  _ne: { lng: number; lat: number };
}): BoundingBox {
  return {
    west: bounds._sw.lng,
    south: bounds._sw.lat,
    east: bounds._ne.lng,
    north: bounds._ne.lat,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Haversine distance in metres
// ─────────────────────────────────────────────────────────────────────────────

export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6_371_000; // Earth radius in metres
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

// ─────────────────────────────────────────────────────────────────────────────
// Format distance for display
// ─────────────────────────────────────────────────────────────────────────────

export function formatDistance(metres: number): string {
  if (metres < 1000) return `${Math.round(metres)} m`;
  return `${(metres / 1000).toFixed(1)} km`;
}
