'use strict';

const crypto    = require('crypto');
const { format } = require('date-fns');
const config    = require('../../../config');
const { PaymentError } = require('../../../utils/errors');

/**
 * VNPayProvider — implements createPaymentUrl and verifyCallback for VNPay.
 * Follows the VNPay integration documentation v2.
 */
class VNPayProvider {
  constructor() {
    this.tmnCode    = config.vnpay.tmnCode;
    this.hashSecret = config.vnpay.hashSecret;
    this.payUrl     = config.vnpay.url;
    this.returnUrl  = config.vnpay.returnUrl;
  }

  /**
   * Build a VNPay payment URL for a given order.
   * @param {object} params
   * @param {string} params.orderId      - unique order reference
   * @param {number} params.amount       - VND amount (will be multiplied by 100 per VNPay spec)
   * @param {string} params.description  - order description
   * @param {string} params.ipAddress    - client IP
   * @param {string} [params.locale]     - 'vn' | 'en'
   * @returns {string} redirect URL
   */
  createPaymentUrl({ orderId, amount, description, ipAddress, locale = 'vn' }) {
    const vnpParams = {
      vnp_Version:       '2.1.0',
      vnp_Command:       'pay',
      vnp_TmnCode:       this.tmnCode,
      vnp_Amount:        String(amount * 100),
      vnp_CurrCode:      'VND',
      vnp_TxnRef:        orderId,
      vnp_OrderInfo:     description,
      vnp_OrderType:     'other',
      vnp_Locale:        locale,
      vnp_ReturnUrl:     this.returnUrl,
      vnp_IpAddr:        ipAddress,
      vnp_CreateDate:    format(new Date(), 'yyyyMMddHHmmss'),
    };

    // Sort params alphabetically and build query string
    const sortedKeys = Object.keys(vnpParams).sort();
    const queryParts = sortedKeys.map(
      (k) => `${k}=${encodeURIComponent(vnpParams[k]).replace(/%20/g, '+')}`
    );
    const queryString = queryParts.join('&');

    const hmac = crypto
      .createHmac('sha512', this.hashSecret)
      .update(queryString)
      .digest('hex');

    return `${this.payUrl}?${queryString}&vnp_SecureHash=${hmac}`;
  }

  /**
   * Verify the callback from VNPay after payment.
   * @param {object} query - query params from the VNPay redirect
   * @returns {{ valid: boolean, success: boolean, transactionRef: string, orderId: string }}
   */
  verifyCallback(query) {
    const { vnp_SecureHash, ...params } = query;

    if (!vnp_SecureHash) {
      throw new PaymentError('Missing secure hash');
    }

    // Rebuild signature
    const sortedKeys  = Object.keys(params).sort();
    const queryString = sortedKeys
      .map((k) => `${k}=${encodeURIComponent(params[k]).replace(/%20/g, '+')}`)
      .join('&');

    const expectedHash = crypto
      .createHmac('sha512', this.hashSecret)
      .update(queryString)
      .digest('hex');

    const valid   = expectedHash === vnp_SecureHash;
    const success = valid && params.vnp_ResponseCode === '00';

    return {
      valid,
      success,
      orderId:        params.vnp_TxnRef,
      transactionRef: params.vnp_TransactionNo,
      amount:         parseInt(params.vnp_Amount, 10) / 100,
      bankCode:       params.vnp_BankCode,
      responseCode:   params.vnp_ResponseCode,
    };
  }
}

module.exports = VNPayProvider;
