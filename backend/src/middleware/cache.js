'use strict';

const { getRedisClient } = require('../config/redis');
const config             = require('../config');

const TTL = {
  lands:    60,
  land:     300,
  heatmap:  300,
  default:  config.redis.defaultTtl,
};

/**
 * Build a deterministic cache key from the request.
 * @param {import('express').Request} req
 * @returns {string}
 */
function buildCacheKey(req) {
  const queryStr = new URLSearchParams(
    Object.entries(req.query).sort(([a], [b]) => a.localeCompare(b))
  ).toString();
  return `cache:${req.path}${queryStr ? `?${queryStr}` : ''}`;
}

/**
 * Cache middleware factory.
 * @param {number} [ttl] - seconds to cache the response
 * @returns {import('express').RequestHandler}
 */
function cacheMiddleware(ttl = TTL.default) {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    let redis;
    try {
      redis = await getRedisClient();
    } catch {
      // Redis unavailable — skip cache
      return next();
    }

    const key = buildCacheKey(req);

    // Prevent browser from caching API responses — let Redis handle it
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');

    try {
      const cached = await redis.get(key);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        return res.json(JSON.parse(cached));
      }
    } catch {
      return next();
    }

    // Intercept res.json to store the response in cache
    const originalJson = res.json.bind(res);
    res.json = async (body) => {
      res.setHeader('X-Cache', 'MISS');
      try {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          await redis.setEx(key, ttl, JSON.stringify(body));
        }
      } catch {
        // Cache write failure is non-fatal
      }
      return originalJson(body);
    };

    next();
  };
}

/**
 * Invalidate all cache keys that match a given prefix pattern.
 * @param {string} pattern  - e.g. 'cache:/api/lands*'
 */
async function invalidateCache(pattern) {
  try {
    const redis = await getRedisClient();
    const keys  = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(keys);
    }
  } catch (err) {
    console.warn('[Cache] Failed to invalidate cache:', err.message);
  }
}

module.exports = { cacheMiddleware, invalidateCache, TTL, buildCacheKey };
