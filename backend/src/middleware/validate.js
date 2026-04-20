'use strict';

const Joi                = require('joi');
const { ValidationError } = require('../utils/errors');

/**
 * Middleware factory: validate req.body, req.query, or req.params with a Joi schema.
 *
 * @param {Joi.Schema} schema
 * @param {'body'|'query'|'params'} [source='body']
 * @returns {import('express').RequestHandler}
 */
function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly:      false,
      stripUnknown:    true,
      allowUnknown:    false,
    });

    if (error) {
      const details = error.details.map((d) => ({
        field:   d.path.join('.'),
        message: d.message,
      }));
      return next(new ValidationError('Request validation failed', details));
    }

    // Replace source with the stripped / coerced value
    req[source] = value;
    next();
  };
}

// ============================================================
// Re-usable common schemas
// ============================================================
const schemas = {
  uuid: Joi.string().uuid({ version: 'uuidv4' }),

  pagination: Joi.object({
    page:  Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }),

  bbox: Joi.string()
    .pattern(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?$/)
    .messages({ 'string.pattern.base': 'bbox must be "minLng,minLat,maxLng,maxLat"' }),

  phone: Joi.string()
    .pattern(/^(\+84|0)[0-9]{9}$/)
    .messages({ 'string.pattern.base': 'Phone must be a valid Vietnamese number' }),
};

module.exports = { validate, schemas };
