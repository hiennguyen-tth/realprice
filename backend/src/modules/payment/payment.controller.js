'use strict';

const Joi = require('joi');

/**
 * PaymentController — thin handler for payment endpoints.
 */
class PaymentController {
  /** @param {import('./payment.service')} paymentService */
  constructor(paymentService) {
    this.paymentService = paymentService;

    this.initiateBoost      = this.initiateBoost.bind(this);
    this.vnpayCallback      = this.vnpayCallback.bind(this);
    this.momoCallback       = this.momoCallback.bind(this);
    this.momoNotify         = this.momoNotify.bind(this);
  }

  /** POST /api/payment/boost */
  async initiateBoost(req, res, next) {
    try {
      const { listingId, duration, paymentMethod } = req.body;
      const ipAddress = req.ip;
      const result = await this.paymentService.initiateBoostPayment({
        userId: req.user.id,
        listingId,
        duration,
        paymentMethod,
        ipAddress,
      });
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  /** GET /api/payment/vnpay/callback */
  async vnpayCallback(req, res, next) {
    try {
      const result = await this.paymentService.handleVNPayCallback(req.query);
      // Redirect to frontend success/failure page
      const status = result.status === 'completed' ? 'success' : 'failed';
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/payment/${status}?orderId=${result.id}`);
    } catch (err) { next(err); }
  }

  /** GET /api/payment/momo/callback */
  async momoCallback(req, res, next) {
    // MoMo redirect (user-facing, not verified here — use IPN for finalization)
    const status = req.query.resultCode === '0' ? 'success' : 'failed';
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3001'}/payment/${status}?orderId=${req.query.orderId}`);
  }

  /** POST /api/payment/momo/notify */
  async momoNotify(req, res, next) {
    try {
      await this.paymentService.handleMoMoNotify(req.body);
      res.json({ status: 0, message: 'Success' });
    } catch (err) {
      console.error('[MoMo IPN] Error:', err.message);
      res.json({ status: 1, message: err.message });
    }
  }
}

const initiateBoostSchema = Joi.object({
  listingId:     Joi.string().uuid().required(),
  duration:      Joi.string().valid('3','7','30').required(),
  paymentMethod: Joi.string().valid('vnpay','momo').required(),
});

module.exports = { PaymentController, initiateBoostSchema };
