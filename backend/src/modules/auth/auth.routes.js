'use strict';

const { Router } = require('express');
const { validate } = require('../../middleware/validate');
const { authLimiter } = require('../../middleware/rateLimit');
const { authenticate } = require('../../middleware/auth');

const { AuthController, sendOtpSchema, verifyOtpSchema, registerSchema, loginSchema, refreshSchema } =
  require('./auth.controller');
const AuthService = require('./auth.service');
const UserRepository = require('../user/user.repository');
const { query: db } = require('../../config/database');

// Wire up dependencies
const userRepo = new UserRepository(db);
const authService = new AuthService(userRepo);
const authCtrl = new AuthController(authService);

const router = Router();

router.post('/send-otp', authLimiter, validate(sendOtpSchema), authCtrl.sendOtp);
router.post('/verify-otp', authLimiter, validate(verifyOtpSchema), authCtrl.verifyOtp);
router.post('/register', authLimiter, validate(registerSchema), authCtrl.register);
router.post('/login', authLimiter, validate(loginSchema), authCtrl.login);
router.post('/refresh', validate(refreshSchema), authCtrl.refresh);
router.post('/logout', authenticate, authCtrl.logout);

module.exports = router;
