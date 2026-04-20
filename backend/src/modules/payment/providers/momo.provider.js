'use strict';

const crypto = require('crypto');
const axios  = require('axios');
const { v4: uuidv4 } = require('uuid');
const config = require('../../../config');
const { PaymentError } = require('../../../utils/errors');

/**
 * MoMoProvider — implements createPaymentUrl and verifyCallback for MoMo.
 * Uses MoMo ATM/QR v2 API.
 */
class MoMoProvider {
  constructor() {
    this.partnerCode = config.momo.partnerCode;
    this.accessKey   = config.momo.accessKey;
    this.secretKey   = config.momo.secretKey;
    this.endpoint    = config.momo.endpoint;
    this.returnUrl   = config.momo.returnUrl;
    this.notifyUrl   = config.momo.notifyUrl;
  }

  /**
   * Create a MoMo payment request and return the payUrl.
   * @param {object} params
   * @param {string} params.orderId
   * @param {number} params.amount
   * @param {string} params.description
   * @returns {Promise<{ payUrl: string, deeplink: string, qrCodeUrl: string }>}
   */
  async createPaymentUrl({ orderId, amount, description }) {
    const requestId = uuidv4();
    const orderInfo = description || `RealPrice boost - ${orderId}`;
    const extraData = '';

    const rawSignature =
      `accessKey=${this.accessKey}` +
      `&amount=${amount}` +
      `&extraData=${extraData}` +
      `&ipnUrl=${this.notifyUrl}` +
      `&orderId=${orderId}` +
      `&orderInfo=${orderInfo}` +
      `&partnerCode=${this.partnerCode}` +
      `&redirectUrl=${this.returnUrl}` +
      `&requestId=${requestId}` +
      `&requestType=payWithATM`;

    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(rawSignature)
      .digest('hex');

    const payload = {
      partnerCode:  this.partnerCode,
      accessKey:    this.accessKey,
      requestId,
      amount:       String(amount),
      orderId,
      orderInfo,
      redirectUrl:  this.returnUrl,
      ipnUrl:       this.notifyUrl,
      extraData,
      requestType:  'payWithATM',
      signature,
      lang:         'vi',
    };

    const { data } = await axios.post(this.endpoint, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    });

    if (data.resultCode !== 0) {
      throw new PaymentError(`MoMo error: ${data.message}`, data);
    }

    return {
      payUrl:     data.payUrl,
      deeplink:   data.deeplink,
      qrCodeUrl:  data.qrCodeUrl,
    };
  }

  /**
   * Verify a MoMo IPN (Instant Payment Notification) callback.
   * @param {object} body - the IPN POST body
   * @returns {{ valid: boolean, success: boolean, orderId: string, transactionRef: string }}
   */
  verifyCallback(body) {
    const {
      partnerCode, orderId, requestId, amount, orderInfo,
      orderType, transId, resultCode, message, payType,
      responseTime, extraData, signature,
    } = body;

    const rawSignature =
      `accessKey=${this.accessKey}` +
      `&amount=${amount}` +
      `&extraData=${extraData}` +
      `&message=${message}` +
      `&orderId=${orderId}` +
      `&orderInfo=${orderInfo}` +
      `&orderType=${orderType}` +
      `&partnerCode=${partnerCode}` +
      `&payType=${payType}` +
      `&requestId=${requestId}` +
      `&responseTime=${responseTime}` +
      `&resultCode=${resultCode}` +
      `&transId=${transId}`;

    const expectedSig = crypto
      .createHmac('sha256', this.secretKey)
      .update(rawSignature)
      .digest('hex');

    const valid   = expectedSig === signature;
    const success = valid && resultCode === 0;

    return {
      valid,
      success,
      orderId,
      transactionRef: String(transId),
      amount:         parseInt(amount, 10),
      resultCode,
      message,
    };
  }
}

module.exports = MoMoProvider;
