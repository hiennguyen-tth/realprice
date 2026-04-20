'use strict';

const Joi              = require('joi');
const { validate, schemas } = require('../../middleware/validate');

/**
 * AuthController — thin layer: validate → call service → return response.
 * Receives AuthService via constructor (Dependency Injection).
 */
class AuthController {
  /** @param {import('./auth.service')} authService */
  constructor(authService) {
    this.authService = authService;

    // Bind all methods so they can be passed as Express route handlers
    this.sendOtp    = this.sendOtp.bind(this);
    this.verifyOtp  = this.verifyOtp.bind(this);
    this.refresh    = this.refresh.bind(this);
    this.logout     = this.logout.bind(this);
  }

  /**
   * POST /api/auth/send-otp
   */
  async sendOtp(req, res, next) {
    try {
      const { phone } = req.body;
      const result    = await this.authService.sendOtp(phone);
      return res.status(200).json({
        success:   true,
        message:   'OTP sent successfully',
        expiresAt: result.expiresAt,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/auth/verify-otp
   */
  async verifyOtp(req, res, next) {
    try {
      const { phone, code } = req.body;
      const result          = await this.authService.verifyOtp(phone, code);
      return res.status(200).json({
        success:      true,
        accessToken:  result.accessToken,
        refreshToken: result.refreshToken,
        user:         result.user,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/auth/refresh
   */
  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const result           = await this.authService.refreshAccessToken(refreshToken);
      return res.status(200).json({
        success:     true,
        accessToken: result.accessToken,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/auth/logout  (authenticated)
   */
  async logout(req, res, next) {
    try {
      await this.authService.logout(req.user.id);
      return res.status(200).json({ success: true, message: 'Logged out' });
    } catch (err) {
      next(err);
    }
  }
}

// Validation schemas
const sendOtpSchema = Joi.object({
  phone: schemas.phone.required(),
});

const verifyOtpSchema = Joi.object({
  phone: schemas.phone.required(),
  code:  Joi.string().length(6).pattern(/^\d+$/).required(),
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

module.exports = { AuthController, sendOtpSchema, verifyOtpSchema, refreshSchema };
