'use strict';

const { v4: uuidv4 }  = require('uuid');
const { query: db }   = require('../../config/database');
const { ValidationError, PaymentError, NotFoundError } = require('../../utils/errors');
const VNPayProvider   = require('./providers/vnpay.provider');
const MoMoProvider    = require('./providers/momo.provider');

const BOOST_DURATIONS = {
  '3':  3,
  '7':  7,
  '30': 30,
};

/**
 * PaymentService — strategy pattern: selects VNPay or MoMo provider based on payment_method.
 */
class PaymentService {
  constructor() {
    this.providers = {
      vnpay: new VNPayProvider(),
      momo:  new MoMoProvider(),
    };
  }

  /**
   * Initiate a payment for a listing boost.
   * @param {object} params
   * @param {string} params.userId
   * @param {string} params.listingId
   * @param {string} params.duration     - '3' | '7' | '30'
   * @param {string} params.paymentMethod - 'vnpay' | 'momo'
   * @param {string} params.ipAddress
   * @returns {Promise<{ paymentId: string, payUrl: string }>}
   */
  async initiateBoostPayment({ userId, listingId, duration, paymentMethod, ipAddress }) {
    const provider = this.providers[paymentMethod];
    if (!provider) {
      throw new ValidationError(`Unsupported payment method: ${paymentMethod}`);
    }

    const days = BOOST_DURATIONS[String(duration)];
    if (!days) {
      throw new ValidationError('Invalid boost duration');
    }

    // Get price from config
    const config  = require('../../config');
    const priceMap = { 3: config.boost.price3Days, 7: config.boost.price7Days, 30: config.boost.price30Days };
    const amount  = priceMap[days];

    const orderId   = uuidv4();
    const description = `Boost listing ${listingId} for ${days} days`;

    // Record pending payment
    const { rows } = await db(
      `INSERT INTO payments (id, user_id, listing_id, amount, payment_method, status, description)
       VALUES ($1, $2, $3, $4, $5, 'pending', $6)
       RETURNING *`,
      [orderId, userId, listingId, amount, paymentMethod, description]
    );
    const payment = rows[0];

    let payUrl;
    if (paymentMethod === 'vnpay') {
      payUrl = provider.createPaymentUrl({ orderId, amount, description, ipAddress });
    } else {
      const result = await provider.createPaymentUrl({ orderId, amount, description });
      payUrl = result.payUrl;
    }

    return { paymentId: orderId, payUrl };
  }

  /**
   * Handle a VNPay payment callback (redirect).
   * @param {object} query - query params from redirect
   * @returns {Promise<object>}
   */
  async handleVNPayCallback(query) {
    const provider = this.providers.vnpay;
    const result   = provider.verifyCallback(query);

    if (!result.valid) {
      throw new PaymentError('Invalid VNPay signature');
    }

    return this._finalizePayment(result.orderId, result.success, result.transactionRef, 'vnpay');
  }

  /**
   * Handle a MoMo IPN notification (POST).
   * @param {object} body - IPN POST body
   * @returns {Promise<object>}
   */
  async handleMoMoNotify(body) {
    const provider = this.providers.momo;
    const result   = provider.verifyCallback(body);

    if (!result.valid) {
      throw new PaymentError('Invalid MoMo signature');
    }

    return this._finalizePayment(result.orderId, result.success, result.transactionRef, 'momo');
  }

  // ── Private helpers ────────────────────────────────────────

  async _finalizePayment(orderId, success, transactionRef, method) {
    const { rows: payRows } = await db(
      'SELECT * FROM payments WHERE id = $1 LIMIT 1',
      [orderId]
    );
    const payment = payRows[0];
    if (!payment) { throw new NotFoundError('Payment'); }

    const newStatus = success ? 'completed' : 'failed';
    await db(
      `UPDATE payments
       SET status = $2, provider_ref = $3, updated_at = NOW()
       WHERE id = $1`,
      [orderId, newStatus, transactionRef]
    );

    if (success && payment.listing_id) {
      // Determine boost days from description
      const match = (payment.description || '').match(/(\d+) days/);
      const days  = match ? parseInt(match[1], 10) : 7;
      const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

      await db(
        `UPDATE listings
         SET boosted = true, boost_expires_at = $2
         WHERE id = $1`,
        [payment.listing_id, expiresAt]
      );
    }

    return { ...payment, status: newStatus, provider_ref: transactionRef };
  }
}

module.exports = PaymentService;
