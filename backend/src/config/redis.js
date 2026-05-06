'use strict';

const { createClient } = require('redis');
const config = require('./index');

let redisClient = null;

/**
 * Returns a connected Redis client (singleton).
 * @returns {Promise<import('redis').RedisClientType>}
 */
async function getRedisClient() {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  console.log('[Redis] Config:', config.redis);

  const clientOptions = {
    socket: {
      host: config.redis.host,
      port: config.redis.port,
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          console.error('[Redis] Max reconnect attempts reached');
          return new Error('Redis max retries exceeded');
        }
        return Math.min(retries * 100, 3000);
      },
    },
    password: config.redis.password,
  };
  // if (config.redis.db) {
  //   clientOptions.database = config.redis.db;
  // }

  redisClient = createClient(clientOptions);

  // Set password if provided
  if (config.redis.password) {
    console.log('[Redis] Setting password after client creation:', typeof config.redis.password, config.redis.password);
    // Try setting password after creation
  }

  redisClient.on('error', (err) => {
    console.error('[Redis] Client error:', err.message);
  });

  redisClient.on('connect', () => {
    console.info('[Redis] Connected');
  });

  redisClient.on('reconnecting', () => {
    console.warn('[Redis] Reconnecting...');
  });

  await redisClient.connect();
  return redisClient;
}

/**
 * Gracefully disconnect the Redis client.
 */
async function disconnectRedis() {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    redisClient = null;
    console.info('[Redis] Disconnected');
  }
}

module.exports = { getRedisClient, disconnectRedis };
