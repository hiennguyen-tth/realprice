'use strict';

const { format, parseISO, isValid } = require('date-fns');

/**
 * Formatting utilities for display values in RealPrice.
 */

/**
 * Format a VND price number into a human-readable string.
 * E.g. 2500000000 → "2.5 tỷ"; 350000000 → "350 triệu"
 * @param {number} value
 * @param {{ compact?: boolean }} [options]
 * @returns {string}
 */
function formatVND(value, options = {}) {
  if (value == null || isNaN(value)) {
    return 'N/A';
  }

  const num = Number(value);

  if (options.compact) {
    if (num >= 1_000_000_000) {
      return `${(num / 1_000_000_000).toFixed(num % 1_000_000_000 === 0 ? 0 : 1)} tỷ`;
    }
    if (num >= 1_000_000) {
      return `${(num / 1_000_000).toFixed(num % 1_000_000 === 0 ? 0 : 0)} triệu`;
    }
    return `${num.toLocaleString('vi-VN')} ₫`;
  }

  return `${num.toLocaleString('vi-VN')} ₫`;
}

/**
 * Format a price-per-m² value.
 * @param {number} value
 * @returns {string}
 */
function formatPricePerM2(value) {
  if (value == null || isNaN(value)) {
    return 'N/A';
  }
  return `${formatVND(value, { compact: true })}/m²`;
}

/**
 * Format a date for display (vi locale).
 * @param {string|Date} date
 * @param {string} [fmt='dd/MM/yyyy']
 * @returns {string}
 */
function formatDate(date, fmt = 'dd/MM/yyyy') {
  if (!date) {
    return '';
  }
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isValid(d) ? format(d, fmt) : '';
}

/**
 * Format a datetime with time component.
 * @param {string|Date} date
 * @returns {string}
 */
function formatDateTime(date) {
  return formatDate(date, 'dd/MM/yyyy HH:mm');
}

/**
 * Build a pagination metadata object.
 * @param {number} total
 * @param {number} page
 * @param {number} limit
 * @returns {{ page, limit, total, totalPages }}
 */
function buildPagination(total, page, limit) {
  return {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    total: parseInt(total, 10),
    totalPages: Math.ceil(total / limit) || 1,
  };
}

/**
 * Parse and clamp pagination query params.
 * @param {object} query
 * @returns {{ page: number, limit: number, offset: number }}
 */
function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(
    100,
    Math.max(
      1,
      parseInt(query.limit, 10) || parseInt(query.pageSize, 10) || 20,
    ),
  );
  return { page, limit, offset: (page - 1) * limit };
}

module.exports = { formatVND, formatPricePerM2, formatDate, formatDateTime, buildPagination, parsePagination };
