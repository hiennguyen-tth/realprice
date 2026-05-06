'use strict';

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../../config');
const { UnauthorizedError, ValidationError } = require('../../utils/errors');

/**
 * AuthService handles OTP generation/verification and JWT issuance.
 * Depends on UserRepository injected via constructor.
 */
class AuthService {
  /**
   * @param {object} userRepository
   * @param {object} [smsProvider] - optional SMS adapter (defaults to console in dev)
   */
  constructor(userRepository, smsProvider = null) {
    this.userRepo = userRepository;
    this.smsProvider = smsProvider;
  }

  /**
   * Generate a numeric OTP of the configured length.
   * @returns {string}
   */
  _generateOtp() {
    const length = config.otp.length;
    const max = Math.pow(10, length);
    return String(Math.floor(Math.random() * max)).padStart(length, '0');
  }

  /**
   * Send OTP to a phone number.
   * In development (or OTP_DEV_BYPASS=true) it just logs to console.
   *
   * @param {string} phone
   * @returns {Promise<{ expiresAt: Date }>}
   */
  async sendOtp(phone) {
    const otp = this._generateOtp();
    const expiresAt = new Date(Date.now() + config.otp.expiryMinutes * 60_000);

    // Hash the OTP before storing
    const hashedOtp = await bcrypt.hash(otp, 8);

    // Upsert user by phone
    let user = await this.userRepo.findByPhone(phone);
    if (!user) {
      user = await this.userRepo.create({ phone });
    }

    await this.userRepo.update(user.id, {
      otp_code: hashedOtp,
      otp_expires_at: expiresAt,
    });

    if (config.otp.devBypass || !this.smsProvider) {
      console.info(`[OTP] Phone: ${phone}, Code: ${otp}`);
    } else {
      await this.smsProvider.send(phone, `Mã xác thực RealPrice của bạn là: ${otp}`);
    }

    return { expiresAt };
  }

  /**
   * Register a new user with email/password.
   *
   * @param {string} name
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{ accessToken: string, refreshToken: string, user: object }>}
   */
  async register(name, email, password) {
    // Check if user already exists
    const existingUser = await this.userRepo.findByEmail(email);
    if (existingUser) {
      throw new ValidationError('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await this.userRepo.create({
      full_name: name,
      email,
      password: hashedPassword,
      role: 'user',
      is_active: true,
    });

    // Issue tokens
    const accessToken = this._issueAccessToken(user);
    const refreshToken = this._issueRefreshToken(user);

    const hashedRefresh = await bcrypt.hash(refreshToken, 8);
    await this.userRepo.update(user.id, { refresh_token: hashedRefresh });

    const safeUser = this._sanitizeUser(user);
    return { accessToken, refreshToken, user: safeUser };
  }

  /**
   * Login with email/password.
   *
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{ accessToken: string, refreshToken: string, user: object }>}
   */
  async login(email, password) {
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.password) {
      throw new UnauthorizedError('Account requires password setup');
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.is_active) {
      throw new UnauthorizedError('Account is disabled');
    }

    // Issue tokens
    const accessToken = this._issueAccessToken(user);
    const refreshToken = this._issueRefreshToken(user);

    const hashedRefresh = await bcrypt.hash(refreshToken, 8);
    await this.userRepo.update(user.id, { refresh_token: hashedRefresh });

    const safeUser = this._sanitizeUser(user);
    return { accessToken, refreshToken, user: safeUser };
  }

  /**
   * Refresh an access token using a valid refresh token.
   *
   * @param {string} refreshToken
   * @returns {Promise<{ accessToken: string }>}
   */
  async refreshAccessToken(refreshToken) {
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const user = await this.userRepo.findById(decoded.sub);
    if (!user || !user.refresh_token) {
      throw new UnauthorizedError('Session not found');
    }

    const match = await bcrypt.compare(refreshToken, user.refresh_token);
    if (!match) {
      throw new UnauthorizedError('Refresh token mismatch');
    }

    const accessToken = this._issueAccessToken(user);
    return { accessToken };
  }

  /**
   * Invalidate the refresh token (logout).
   * @param {string} userId
   */
  async logout(userId) {
    await this.userRepo.update(userId, { refresh_token: null });
  }

  // ── Private helpers ────────────────────────────────────────

  _issueAccessToken(user) {
    return jwt.sign(
      { sub: user.id, phone: user.phone, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  }

  _issueRefreshToken(user) {
    return jwt.sign(
      { sub: user.id },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );
  }

  _sanitizeUser(user) {
    const { otp_code, otp_expires_at, refresh_token, ...safe } = user;
    return safe;
  }
}

module.exports = AuthService;
