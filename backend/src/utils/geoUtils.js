'use strict';

/**
 * Geographic utility functions for RealPrice.
 */

/**
 * Parse a bbox query string "minLng,minLat,maxLng,maxLat" into components.
 * @param {string} bboxStr
 * @returns {{ minLng: number, minLat: number, maxLng: number, maxLat: number }}
 */
function parseBbox(bboxStr) {
  if (!bboxStr) {
    return null;
  }
  const parts = String(bboxStr).split(',').map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) {
    return null;
  }
  const [minLng, minLat, maxLng, maxLat] = parts;
  return { minLng, minLat, maxLng, maxLat };
}

/**
 * Validate that coordinates are within WGS-84 bounds.
 * @param {number} lat
 * @param {number} lng
 * @returns {boolean}
 */
function isValidCoordinates(lat, lng) {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180
  );
}

/**
 * Calculate the Haversine distance between two points in metres.
 * @param {number} lat1
 * @param {number} lng1
 * @param {number} lat2
 * @param {number} lng2
 * @returns {number} distance in metres
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R   = 6371000; // Earth radius in metres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dphi = ((lat2 - lat1) * Math.PI) / 180;
  const dlam = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dphi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dlam / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Expand a bounding box by a given distance in metres on each side.
 * @param {{ minLng, minLat, maxLng, maxLat }} bbox
 * @param {number} metres
 * @returns {{ minLng, minLat, maxLng, maxLat }}
 */
function expandBbox(bbox, metres) {
  const latOffset = (metres / 111320);
  const lngOffset = (metres / (111320 * Math.cos((bbox.minLat * Math.PI) / 180)));
  return {
    minLng: bbox.minLng - lngOffset,
    minLat: bbox.minLat - latOffset,
    maxLng: bbox.maxLng + lngOffset,
    maxLat: bbox.maxLat + latOffset,
  };
}

/**
 * Build a WKT POLYGON string from a bbox for PostGIS.
 * @param {{ minLng, minLat, maxLng, maxLat }} bbox
 * @returns {string}
 */
function bboxToWkt(bbox) {
  const { minLng, minLat, maxLng, maxLat } = bbox;
  return `POLYGON((${minLng} ${minLat},${maxLng} ${minLat},${maxLng} ${maxLat},${minLng} ${maxLat},${minLng} ${minLat}))`;
}

/**
 * Cluster point objects by proximity into grid cells.
 * @param {Array<{ lat: number, lng: number }>} points
 * @param {number} zoom - map zoom level (determines grid size)
 * @returns {Array<{ lat: number, lng: number, count: number }>}
 */
function clusterPoints(points, zoom) {
  const gridSize = Math.max(0.01, 1 / (2 ** (zoom - 8)));
  const clusters = new Map();

  for (const p of points) {
    const key = `${Math.floor(p.lat / gridSize)}_${Math.floor(p.lng / gridSize)}`;
    if (!clusters.has(key)) {
      clusters.set(key, { lat: p.lat, lng: p.lng, count: 1, sumLat: p.lat, sumLng: p.lng });
    } else {
      const c = clusters.get(key);
      c.count++;
      c.sumLat += p.lat;
      c.sumLng += p.lng;
      c.lat = c.sumLat / c.count;
      c.lng = c.sumLng / c.count;
    }
  }

  return Array.from(clusters.values()).map(({ lat, lng, count }) => ({ lat, lng, count }));
}

module.exports = {
  parseBbox,
  isValidCoordinates,
  haversineDistance,
  expandBbox,
  bboxToWkt,
  clusterPoints,
};
