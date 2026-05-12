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
