'use strict';

const { AppError } = require('../utils/errors');
const config       = require('../config');

/**
 * Global Express error handler.
 * Must be registered after all routes with 4 parameters.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Operational errors we threw ourselves
  if (err instanceof AppError) {
    const body = {
      success: false,
      code:    err.code,
      message: err.message,
    };
    if (err.details) {
      body.details = err.details;
    }
    return res.status(err.statusCode).json(body);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      code:    'UNAUTHORIZED',
      message: err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token',
    });
  }

  // Joi validation errors (if thrown directly)
  if (err.name === 'ValidationError' && err.isJoi) {
    return res.status(400).json({
      success: false,
      code:    'VALIDATION_ERROR',
      message: err.message,
      details: err.details,
    });
  }

  // PostgreSQL unique constraint
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      code:    'CONFLICT',
      message: 'A record with these details already exists',
    });
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      code:    'FOREIGN_KEY_VIOLATION',
      message: 'Referenced record does not exist',
    });
  }

  // Unknown / unexpected error
  if (config.isDev) {
    console.error('[ErrorHandler] Unhandled error:', err);
  } else {
    console.error('[ErrorHandler] Unhandled error:', err.message);
  }

  return res.status(500).json({
    success: false,
    code:    'INTERNAL_ERROR',
    message: config.isDev ? err.message : 'An unexpected error occurred',
    ...(config.isDev && { stack: err.stack }),
  });
}

module.exports = errorHandler;
