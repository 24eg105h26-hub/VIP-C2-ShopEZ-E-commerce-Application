const express = require('express');
const router = express.Router();
const {
  createOrder,
  stripeWebhook,
  verifyRazorpayPayment,
  getMyOrders,
  getOrderById,
  validateCoupon,
  cancelOrder
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

// Public Webhook route (Stripe calls this directly without client token)
router.post('/webhook/stripe', stripeWebhook);

// Protected routes
router.post('/', protect, createOrder);
router.post('/coupon/validate', protect, validateCoupon);
router.post('/verify-razorpay', protect, verifyRazorpayPayment);
router.get('/my-orders', protect, getMyOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/cancel', protect, cancelOrder);

module.exports = router;

