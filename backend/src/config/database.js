'use strict';

const { Pool } = require('pg');
const config   = require('./index');

/** Singleton pg connection pool with PostGIS support */
const pool = new Pool({
  host:     config.db.host,
  port:     config.db.port,
  database: config.db.database,
  user:     config.db.user,
  password: config.db.password,
  min:      config.db.min,
  max:      config.db.max,
  ssl:      config.db.ssl || undefined,
  idleTimeoutMillis:    30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected pool error:', err.message);
});

pool.on('connect', (_client) => {
  if (config.isDev) {
    console.info('[DB] New client connected to PostgreSQL');
  }
});

/**
 * Run a query against the pool.
 * @param {string} text  - parameterized SQL
 * @param {Array}  params - query parameters
 * @returns {Promise<import('pg').QueryResult>}
 */
async function query(text, params) {
  const start = Date.now();
  const result = await pool.query(text, params);
  if (config.isDev) {
    const duration = Date.now() - start;
    console.info('[DB] query', { text: text.substring(0, 80), duration, rows: result.rowCount });
  }
  return result;
}

/**
 * Acquire a client from the pool for transactions.
 * @returns {Promise<import('pg').PoolClient>}
 */
async function getClient() {
  const client = await pool.connect();
  const origRelease = client.release.bind(client);
  // Wrap release to warn about long-held clients
  const timeout = setTimeout(() => {
    console.warn('[DB] Client checkout exceeded 10s — possible connection leak');
  }, 10000);
  client.release = (...args) => {
    clearTimeout(timeout);
    return origRelease(...args);
  };
  return client;
}

/**
 * Execute a function within a database transaction.
 * Automatically commits or rolls back.
 * @param {Function} fn - async fn(client) => result
 */
async function withTransaction(fn) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, getClient, withTransaction };
