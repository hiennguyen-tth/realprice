'use strict';

const rateLimit = require('express-rate-limit');
const config    = require('../config');

/**
 * Default API rate limiter.
 */
const defaultLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max:      config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    code:    'QUOTA_EXCEEDED',
    message: 'Too many requests, please try again later.',
  },
  keyGenerator: (req) => req.ip,
});

/**
 * Stricter limiter for auth endpoints (send-otp etc.)
 */
const authLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max:      config.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    code:    'QUOTA_EXCEEDED',
    message: 'Too many authentication attempts, please try again later.',
  },
  keyGenerator: (req) => `auth:${req.ip}`,
});

/**
 * Per-listing contact limiter (prevent lead spam)
 */
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max:      10,
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    code:    'QUOTA_EXCEEDED',
    message: 'Too many contact requests.',
  },
  keyGenerator: (req) => `contact:${req.ip}`,
});

module.exports = { defaultLimiter, authLimiter, contactLimiter };
