const Stripe = require('stripe');
const logger = require('../utils/logger');

let stripeInstance = null;

if (process.env.STRIPE_SECRET_KEY) {
  stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16', // Ensure stable API version
  });
} else {
  logger.warn('Stripe SECRET_KEY is not defined. Stripe payments will operate in sandbox emulation.');
}

/**
 * Creates a Stripe PaymentIntent
 * @param {number} amount - Amount in standard currency units (e.g. USD, INR)
 * @param {string} currency - currency code (default: usd)
 * @param {Object} metadata - extra metadata
 */
const createPaymentIntent = async (amount, currency = 'usd', metadata = {}) => {
  if (!stripeInstance) {
    logger.warn('Stripe not initialized. Emulating Payment Intent.');
    return {
      id: `pi_mock_${Math.random().toString(36).substr(2, 9)}`,
      client_secret: `pi_mock_secret_${Math.random().toString(36).substr(2, 9)}`,
      amount: amount * 100, // Stripe expects amount in cents
      currency,
      status: 'requires_payment_method'
    };
  }

  try {
    const paymentIntent = await stripeInstance.paymentIntents.create({
      amount: Math.round(amount * 100), // convert to cents
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true
      }
    });
    return paymentIntent;
  } catch (error) {
    logger.error('Error creating Stripe PaymentIntent:', error);
    throw error;
  }
};

/**
 * Refund a Stripe charge
 * @param {string} paymentIntentId
 * @param {number} [amount] - Optional amount to refund (in standard unit)
 */
const refundStripePayment = async (paymentIntentId, amount) => {
  if (!stripeInstance) {
    logger.warn('Stripe not initialized. Emulating successful refund.');
    return { id: `ref_mock_${Math.random().toString(36).substr(2, 9)}`, status: 'succeeded' };
  }

  try {
    const refundOptions = { payment_intent: paymentIntentId };
    if (amount) {
      refundOptions.amount = Math.round(amount * 100);
    }
    const refund = await stripeInstance.refunds.create(refundOptions);
    return refund;
  } catch (error) {
    logger.error('Error creating Stripe refund:', error);
    throw error;
  }
};

module.exports = {
  createPaymentIntent,
  refundStripePayment
};
