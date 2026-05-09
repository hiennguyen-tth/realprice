'use strict';

const slugifyLib = require('slugify');

/**
 * Address normalization utilities for RealPrice.
 * Used for land deduplication matching.
 */

const ROAD_PREFIXES = [
  'đường', 'duong', 'phố', 'pho', 'ngõ', 'ngo', 'ngách', 'ngach',
  'số', 'so', 'hẻm', 'hem',
];

const ADMIN_PREFIXES = [
  'quận', 'quan', 'huyện', 'huyen', 'thị xã', 'thi xa',
  'thành phố', 'thanh pho', 'phường', 'phuong', 'xã', 'xa',
  'thị trấn', 'thi tran',
];

/**
 * Normalize an address string for fuzzy deduplication matching.
 * Removes administrative and road type prefixes, strips diacritics,
 * collapses whitespace.
 *
 * @param {string} raw
 * @returns {string}
 */
function normalizeAddress(raw) {
  if (!raw) {
    return '';
  }

  let addr = raw.toLowerCase().trim();

  // Remove road-type prefixes
  for (const prefix of ROAD_PREFIXES) {
    addr = addr.replace(new RegExp(`\\b${prefix}\\b`, 'g'), '');
  }

  // Remove administrative-unit prefixes
  for (const prefix of ADMIN_PREFIXES) {
    addr = addr.replace(new RegExp(`\\b${prefix}\\b`, 'g'), '');
  }

  // Remove common punctuation and extra whitespace
  addr = addr.replace(/[,./\\-]/g, ' ').replace(/\s+/g, ' ').trim();

  return addr;
}

/**
 * Slugify an address or title for use as a URL slug.
 * @param {string} text
 * @returns {string}
 */
// Prefix map for Vietnamese admin units so "Quận 7" → "quan-7" not "7"
const SLUG_PREFIX_MAP = {
  'quận': 'quan',
  'huyện': 'huyen',
  'thị xã': 'thi-xa',
  'thành phố': 'thanh-pho',
  'phường': 'phuong',
  'xã': 'xa',
  'thị trấn': 'thi-tran',
};

function slugifyAddress(text) {
  if (!text) {
    return '';
  }
  let normalized = text.trim();
  // Replace prefixed admin units before slugifying so numbers are preserved
  for (const [vi, en] of Object.entries(SLUG_PREFIX_MAP)) {
    const re = new RegExp(`^${vi}\\s+`, 'i');
    if (re.test(normalized.toLowerCase())) {
      const rest = normalized.replace(new RegExp(`^${vi}\\s+`, 'i'), '').trim();
      // slugify the rest (e.g. "7", "Bình Thạnh") then prepend en prefix
      const slugRest = slugifyLib(rest, { lower: true, strict: true, locale: 'vi', replacement: '-', trim: true });
      return `${en}-${slugRest}`;
    }
  }
  return slugifyLib(normalized, {
    lower: true,
    strict: true,
    locale: 'vi',
    replacement: '-',
    trim: true,
  });
}

/**
 * Extract district / ward / province hints from a Vietnamese address string.
 * This is a heuristic — for production use a proper VN address parser or geocoder.
 *
 * @param {string} address
 * @returns {{ district: string|null, ward: string|null, province: string|null }}
 */
function extractAdminUnits(address) {
  if (!address) {
    return { district: null, ward: null, province: null };
  }
  const lower = address.toLowerCase();

  const districtMatch = lower.match(/qu[aậ]n\s+([^,]+?)(?:,|$)/i) ||
    lower.match(/huy[eệ]n\s+([^,]+?)(?:,|$)/i);
  const wardMatch = lower.match(/ph[uườ]ng\s+([^,]+?)(?:,|$)/i) ||
    lower.match(/x[aã]\s+([^,]+?)(?:,|$)/i);
  const provinceMatch = lower.match(/t[pP]\s+([^,]+?)(?:,|$)/i) ||
    lower.match(/t[hH][àa]nh ph[ốo]\s+([^,]+?)(?:,|$)/i);

  return {
    district: districtMatch ? districtMatch[1].trim() : null,
    ward: wardMatch ? wardMatch[1].trim() : null,
    province: provinceMatch ? provinceMatch[1].trim() : null,
  };
}

module.exports = { normalizeAddress, slugifyAddress, extractAdminUnits };
