'use strict';

const { Router }   = require('express');
const { authenticate } = require('../../middleware/auth');
const { validate } = require('../../middleware/validate');

const { PaymentController, initiateBoostSchema } = require('./payment.controller');
const PaymentService = require('./payment.service');

const paymentService = new PaymentService();
const paymentCtrl   = new PaymentController(paymentService);

const router = Router();

router.post('/boost',          authenticate, validate(initiateBoostSchema), paymentCtrl.initiateBoost);
router.get('/vnpay/callback',                                               paymentCtrl.vnpayCallback);
router.get('/momo/callback',                                                paymentCtrl.momoCallback);
router.post('/momo/notify',                                                 paymentCtrl.momoNotify);

module.exports = router;
