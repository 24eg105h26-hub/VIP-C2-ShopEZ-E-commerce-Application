const Razorpay = require('razorpay');
const crypto = require('crypto');
const logger = require('../utils/logger');

let razorpayInstance = null;

if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
} else {
  logger.warn('Razorpay KEY_ID/SECRET not defined. Razorpay payments will operate in sandbox emulation.');
}

/**
 * Create a Razorpay Order
 * @param {number} amount - Amount in standard currency units (e.g. INR)
 * @param {string} currency - currency code (default: INR)
 */
const createRazorpayOrder = async (amount, currency = 'INR') => {
  if (!razorpayInstance) {
    logger.warn('Razorpay not initialized. Emulating Order.');
    return {
      id: `order_mock_${Math.random().toString(36).substr(2, 9)}`,
      amount: amount * 100, // Razorpay expects amount in paise
      currency,
      status: 'created'
    };
  }

  try {
    const options = {
      amount: Math.round(amount * 100), // convert to paise
      currency,
      receipt: `receipt_${Date.now()}`
    };
    const order = await razorpayInstance.orders.create(options);
    return order;
  } catch (error) {
    logger.error('Error creating Razorpay Order:', error);
    throw error;
  }
};

/**
 * Verify Razorpay payment signature
 */
const verifySignature = (orderId, paymentId, signature) => {
  if (!process.env.RAZORPAY_KEY_SECRET) {
    logger.warn('Razorpay credentials missing. Assuming valid signature in dev.');
    return true;
  }

  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return generatedSignature === signature;
};

/**
 * Refund a Razorpay payment
 */
const refundRazorpayPayment = async (paymentId, amount) => {
  if (!razorpayInstance) {
    logger.warn('Razorpay not initialized. Emulating successful refund.');
    return { id: `rfnd_mock_${Math.random().toString(36).substr(2, 9)}`, status: 'processed' };
  }

  try {
    const options = {};
    if (amount) {
      options.amount = Math.round(amount * 100);
    }
    const refund = await razorpayInstance.payments.refund(paymentId, options);
    return refund;
  } catch (error) {
    logger.error('Error initiating Razorpay refund:', error);
    throw error;
  }
};

module.exports = {
  createRazorpayOrder,
  verifySignature,
  refundRazorpayPayment
};
