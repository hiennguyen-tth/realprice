import type {BBox, LandCoordinates, MapRegion} from '../types';

/**
 * Convert a map region to a bounding box.
 */
export function regionToBbox(region: MapRegion): BBox {
  const halfLat = region.latitudeDelta / 2;
  const halfLng = region.longitudeDelta / 2;
  return {
    west: region.longitude - halfLng,
    south: region.latitude - halfLat,
    east: region.longitude + halfLng,
    north: region.latitude + halfLat,
  };
}

/**
 * Convert bbox to a deterministic cache key, snapped to zoom-appropriate grid.
 */
export function bboxToCacheKey(bbox: BBox, zoom: number): string {
  // Snap coordinates to grid based on zoom to improve cache hit rate
  const precision = Math.max(1, Math.min(5, Math.floor(zoom / 3)));
  const factor = Math.pow(10, precision);
  const snap = (n: number) => Math.floor(n * factor) / factor;

  return `${zoom}:${snap(bbox.west)},${snap(bbox.south)},${snap(bbox.east)},${snap(bbox.north)}`;
}

/**
 * Calculate distance between two lat/lng coordinates in meters (Haversine formula).
 */
export function distanceBetween(
  a: LandCoordinates,
  b: LandCoordinates,
): number {
  const R = 6371000; // Earth radius in meters
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);

  const ha =
    sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;

  const c = 2 * Math.atan2(Math.sqrt(ha), Math.sqrt(1 - ha));
  return R * c;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Check if a coordinate is within a bounding box.
 */
export function isInBbox(coord: LandCoordinates, bbox: BBox): boolean {
  return (
    coord.latitude >= bbox.south &&
    coord.latitude <= bbox.north &&
    coord.longitude >= bbox.west &&
    coord.longitude <= bbox.east
  );
}

/**
 * Expand bbox by a percentage on all sides.
 */
export function expandBbox(bbox: BBox, factor: number = 0.1): BBox {
  const latDelta = (bbox.north - bbox.south) * factor;
  const lngDelta = (bbox.east - bbox.west) * factor;
  return {
    west: bbox.west - lngDelta,
    south: bbox.south - latDelta,
    east: bbox.east + lngDelta,
    north: bbox.north + latDelta,
  };
}

/**
 * Convert Mapbox camera bounds [west, south, east, north] to BBox.
 */
export function mapboxBoundsToBbox(bounds: number[]): BBox {
  return {
    west: bounds[0] ?? 0,
    south: bounds[1] ?? 0,
    east: bounds[2] ?? 0,
    north: bounds[3] ?? 0,
  };
}
