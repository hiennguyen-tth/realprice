'use strict';

const { NotFoundError } = require('../../utils/errors');

/**
 * BaseRepository provides generic CRUD operations backed by a pg Pool.
 * All domain repositories extend this class (Open/Closed Principle).
 *
 * Subclasses set `this.table` in their constructor via `super(tableName, db)`.
 */
class BaseRepository {
  /**
   * @param {string} tableName - postgres table name
   * @param {import('pg').Pool} db  - pg pool or query function
   */
  constructor(tableName, db) {
    this.table = tableName;
    this.db    = db;
  }

  /**
   * Execute a raw parameterized query.
   * @protected
   * @param {string} text
   * @param {Array}  params
   */
  async _query(text, params = []) {
    const result = typeof this.db.query === 'function'
      ? await this.db.query(text, params)
      : await this.db(text, params);
    return result;
  }

  /**
   * Find a single record by primary key (UUID).
   * @param {string} id
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    const { rows } = await this._query(
      `SELECT * FROM ${this.table} WHERE id = $1 LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Find a single record by primary key — throws NotFoundError if missing.
   * @param {string} id
   * @param {string} [resourceName]
   * @returns {Promise<object>}
   */
  async findByIdOrFail(id, resourceName) {
    const row = await this.findById(id);
    if (!row) {
      throw new NotFoundError(resourceName || this.table);
    }
    return row;
  }

  /**
   * Find all records with optional equality conditions, ordering, and pagination.
   * @param {object} [conditions] - key/value equality filters
   * @param {object} [options]
   * @param {string}   [options.orderBy]  - e.g. 'created_at DESC'
   * @param {number}   [options.limit]
   * @param {number}   [options.offset]
   * @returns {Promise<object[]>}
   */
  async findAll(conditions = {}, options = {}) {
    const keys   = Object.keys(conditions);
    const values = Object.values(conditions);
    const where  = keys.length
      ? 'WHERE ' + keys.map((k, i) => `${k} = $${i + 1}`).join(' AND ')
      : '';

    const orderBy = options.orderBy ? `ORDER BY ${options.orderBy}` : '';
    const limit   = options.limit   ? `LIMIT $${values.length + 1}`  : '';
    const offset  = options.offset  ? `OFFSET $${values.length + (options.limit ? 2 : 1)}` : '';

    const extraParams = [
      ...(options.limit  ? [options.limit]  : []),
      ...(options.offset ? [options.offset] : []),
    ];

    const { rows } = await this._query(
      `SELECT * FROM ${this.table} ${where} ${orderBy} ${limit} ${offset}`.trim(),
      [...values, ...extraParams]
    );
    return rows;
  }

  /**
   * Insert a new record.
   * @param {object} data - column: value map
   * @returns {Promise<object>} the created row
   */
  async create(data) {
    const keys        = Object.keys(data);
    const values      = Object.values(data);
    const columns     = keys.join(', ');
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');

    const { rows } = await this._query(
      `INSERT INTO ${this.table} (${columns}) VALUES (${placeholders}) RETURNING *`,
      values
    );
    return rows[0];
  }

  /**
   * Update a record by primary key.
   * @param {string} id
   * @param {object} data - column: value map (only provided columns are updated)
   * @returns {Promise<object>} the updated row
   */
  async update(id, data) {
    const keys   = Object.keys(data);
    const values = Object.values(data);
    const set    = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');

    const { rows } = await this._query(
      `UPDATE ${this.table} SET ${set} WHERE id = $${keys.length + 1} RETURNING *`,
      [...values, id]
    );
    return rows[0] || null;
  }

  /**
   * Delete a record by primary key.
   * @param {string} id
   * @returns {Promise<boolean>} true if a row was deleted
   */
  async delete(id) {
    const { rowCount } = await this._query(
      `DELETE FROM ${this.table} WHERE id = $1`,
      [id]
    );
    return rowCount > 0;
  }

  /**
   * Count records matching equality conditions.
   * @param {object} [conditions]
   * @returns {Promise<number>}
   */
  async count(conditions = {}) {
    const keys   = Object.keys(conditions);
    const values = Object.values(conditions);
    const where  = keys.length
      ? 'WHERE ' + keys.map((k, i) => `${k} = $${i + 1}`).join(' AND ')
      : '';

    const { rows } = await this._query(
      `SELECT COUNT(*) AS total FROM ${this.table} ${where}`,
      values
    );
    return parseInt(rows[0].total, 10);
  }

  /**
   * Check whether a record exists by equality conditions.
   * @param {object} conditions
   * @returns {Promise<boolean>}
   */
  async exists(conditions) {
    const keys   = Object.keys(conditions);
    const values = Object.values(conditions);
    const where  = 'WHERE ' + keys.map((k, i) => `${k} = $${i + 1}`).join(' AND ');

    const { rows } = await this._query(
      `SELECT 1 FROM ${this.table} ${where} LIMIT 1`,
      values
    );
    return rows.length > 0;
  }
}

module.exports = BaseRepository;
