'use strict';

const jwt                         = require('jsonwebtoken');
const config                      = require('../config');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');

/**
 * Middleware: verify JWT access token and attach decoded user to req.user.
 * Throws UnauthorizedError if missing or invalid.
 */
async function authenticate(req, _res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Bearer token required');
    }

    const token   = authHeader.slice(7);
    const decoded = jwt.verify(token, config.jwt.secret);

    req.user = {
      id:    decoded.sub,
      phone: decoded.phone,
      role:  decoded.role,
    };

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware factory: require the authenticated user to have one of the given roles.
 * Must be used after `authenticate`.
 * @param {...string} roles - allowed roles
 */
function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }
    next();
  };
}

/**
 * Optional authentication — sets req.user if token present, but does not fail if absent.
 */
async function optionalAuthenticate(req, _res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token   = authHeader.slice(7);
      const decoded = jwt.verify(token, config.jwt.secret);
      req.user = {
        id:    decoded.sub,
        phone: decoded.phone,
        role:  decoded.role,
      };
    }
  } catch {
    // Token invalid — continue unauthenticated
  }
  next();
}

module.exports = { authenticate, requireRole, optionalAuthenticate };
