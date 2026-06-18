const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const Cart = require('../models/Cart');
const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');
const { createPaymentIntent, refundStripePayment } = require('../services/stripeService');
const { createRazorpayOrder, verifySignature, refundRazorpayPayment } = require('../services/razorpayService');
const { sendToUser } = require('../services/socketService');
const { sendEmail } = require('../services/emailService');

// Helper to update stock levels atomically
const adjustStock = async (items, increment = false) => {
  const multiplier = increment ? 1 : -1;
  const bulkOps = [];

  for (const item of items) {
    bulkOps.push({
      updateOne: {
        filter: {
          _id: item.product,
          'variants.sku': item.variantSku
        },
        update: {
          $inc: {
            stock: item.quantity * multiplier,
            'variants.$.stock': item.quantity * multiplier
          }
        }
      }
    });
  }

  if (bulkOps.length > 0) {
    await Product.bulkWrite(bulkOps);
  }
};

// Helper to send order email
const sendOrderConfirmationEmail = async (order, user) => {
  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name} (${item.variantSku})</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">$${item.price.toFixed(2)}</td>
    </tr>
  `).join('');

  const emailHtml = `
    <h1>Order Confirmed!</h1>
    <p>Hi ${user.name},</p>
    <p>Thank you for shopping at shopEZ. Your order has been placed successfully.</p>
    <p><strong>Order ID:</strong> ${order._id}</p>
    <p><strong>Status:</strong> ${order.orderStatus}</p>
    
    <h3>Order Summary</h3>
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background-color: #f2f2f2;">
          <th style="padding: 8px; text-align: left;">Item</th>
          <th style="padding: 8px; text-align: center;">Quantity</th>
          <th style="padding: 8px; text-align: right;">Price</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>
    
    <p style="text-align: right; margin-top: 15px;">
      Discount: -$${order.discountAmount.toFixed(2)}<br>
      Tax: $${order.taxPrice.toFixed(2)}<br>
      Shipping: $${order.shippingPrice.toFixed(2)}<br>
      <strong>Total: $${order.totalPrice.toFixed(2)}</strong>
    </p>
  `;

  try {
    await sendEmail({
      email: user.email,
      subject: `shopEZ Order Confirmation - ${order._id}`,
      html: emailHtml
    });
  } catch (error) {
    console.error('Failed to send order email:', error);
  }
};

// @desc    Checkout and place order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res, next) => {
  const { cartItems, shippingAddress, paymentMethod, couponCode } = req.body;
  const user = req.user;

  try {
    if (!cartItems || cartItems.length === 0) {
      return next(new ApiError(400, 'Your cart is empty.'));
    }

    let subtotal = 0;
    const items = [];

    // 1. Verify availability and price of products from database
    for (const item of cartItems) {
      const product = await Product.findById(item.product).populate('seller');
      if (!product) {
        return next(new ApiError(404, `Product '${item.name}' not found.`));
      }

      const variant = product.variants.find(v => v.sku === item.variantSku);
      if (!variant) {
        return next(new ApiError(404, `Variant SKU '${item.variantSku}' not found.`));
      }

      if (variant.stock < item.quantity) {
        return next(new ApiError(400, `Stock insufficient for ${product.name}. Available: ${variant.stock}`));
      }

      subtotal += variant.price * item.quantity;
      items.push({
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        price: variant.price,
        variantSku: item.variantSku,
        seller: product.seller._id
      });
    }

    // 2. Process Coupon discount
    let discountAmount = 0;
    let couponRef = null;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (!coupon) {
        return next(new ApiError(400, 'Invalid or inactive coupon.'));
      }

      if (coupon.startDate > Date.now() || coupon.endDate < Date.now()) {
        return next(new ApiError(400, 'Coupon is expired or not yet active.'));
      }

      if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
        return next(new ApiError(400, 'Coupon code usage limit exceeded.'));
      }

      if (subtotal >= coupon.minOrderAmount) {
        if (coupon.discountType === 'percentage') {
          discountAmount = (subtotal * coupon.discountValue) / 100;
          if (coupon.maxDiscountAmount) {
            discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
          }
        } else {
          discountAmount = coupon.discountValue;
        }
        couponRef = coupon._id;
      }
    }

    // 3. Taxes & Shipping
    const shippingPrice = subtotal > 100 ? 0 : 10; // Free shipping over $100
    const taxPrice = parseFloat((subtotal * 0.08).toFixed(2)); // 8% sales tax
    const totalPrice = parseFloat((subtotal + shippingPrice + taxPrice - discountAmount).toFixed(2));

    // 4. Atomically decrement inventory stock levels
    await adjustStock(items, false);

    // 5. Create Order database record
    const order = new Order({
      user: user._id,
      items,
      shippingAddress,
      paymentMethod,
      paymentStatus: 'pending',
      shippingPrice,
      taxPrice,
      discountAmount,
      totalPrice,
      couponApplied: couponRef
    });

    await order.save();

    // Increment coupon usage count
    if (couponRef) {
      await Coupon.findByIdAndUpdate(couponRef, { $inc: { usedCount: 1 } });
    }

    // 6. Handle Payment Method setup
    if (paymentMethod === 'stripe') {
      const paymentIntent = await createPaymentIntent(totalPrice, 'usd', { orderId: order._id.toString() });
      order.paymentDetails = {
        paymentIntentId: paymentIntent.id
      };
      await order.save();

      res.status(201).json({
        success: true,
        orderId: order._id,
        paymentMethod: 'stripe',
        clientSecret: paymentIntent.client_secret,
        totalPrice
      });
    } else if (paymentMethod === 'razorpay') {
      const rzOrder = await createRazorpayOrder(totalPrice, 'INR');
      order.paymentDetails = {
        transactionId: rzOrder.id
      };
      await order.save();

      res.status(201).json({
        success: true,
        orderId: order._id,
        paymentMethod: 'razorpay',
        razorpayOrderId: rzOrder.id,
        totalPrice
      });
    } else {
      // Cash On Delivery (COD) Order
      order.paymentStatus = 'pending';
      order.orderStatus = 'Placed';
      await order.save();

      // Clear Cart
      await Cart.findOneAndDelete({ user: user._id });

      // Notify customer and seller
      sendToUser(user._id, 'notification', {
        title: 'Order Placed',
        message: `Your COD order #${order._id} was successfully placed!`
      });

      // Send Email Confirmation
      await sendOrderConfirmationEmail(order, user);

      res.status(201).json({
        success: true,
        orderId: order._id,
        paymentMethod: 'cod',
        totalPrice
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Stripe payment confirmation webhook hook handler
// @route   POST /api/orders/webhook/stripe
// @access  Public
const stripeWebhook = async (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    if (process.env.NODE_ENV === 'production' || (process.env.STRIPE_WEBHOOK_SECRET && sig)) {
      if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
        return next(new ApiError(400, 'Webhook signature or secret key is missing.'));
      }
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } else {
      // Dev mode fallback / emulation
      event = req.body;
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata.orderId;

      const order = await Order.findById(orderId).populate('user');
      if (order && order.paymentStatus !== 'paid') {
        order.paymentStatus = 'paid';
        order.orderStatus = 'Confirmed';
        order.statusTimeline.push({
          status: 'Confirmed',
          note: 'Payment received successfully via Stripe.'
        });
        await order.save();

        // Clear User's shopping cart
        await Cart.findOneAndDelete({ user: order.user._id });

        // Dispatch real-time triggers
        sendToUser(order.user._id, 'notification', {
          title: 'Payment Confirmed',
          message: `Payment for Order #${order._id} was confirmed.`
        });

        // Send confirmation email
        await sendOrderConfirmationEmail(order, order.user);
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata.orderId;

      const order = await Order.findById(orderId);
      if (order && order.paymentStatus !== 'paid') {
        order.paymentStatus = 'failed';
        order.orderStatus = 'Cancelled';
        order.statusTimeline.push({
          status: 'Cancelled',
          note: 'Stripe transaction failed. Stock released.'
        });
        await order.save();

        // Release/Restore stock levels
        await adjustStock(order.items, true);
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Stripe webhook handling error:', error.message);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
};

// @desc    Razorpay manual payment verification signature handler
// @route   POST /api/orders/verify-razorpay
// @access  Private
const verifyRazorpayPayment = async (req, res, next) => {
  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  const user = req.user;

  try {
    const isVerified = verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isVerified) {
      return next(new ApiError(400, 'Razorpay signature verification failed.'));
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return next(new ApiError(404, 'Order not found.'));
    }

    if (order.paymentStatus !== 'paid') {
      order.paymentStatus = 'paid';
      order.orderStatus = 'Confirmed';
      order.paymentDetails = {
        transactionId: razorpayOrderId,
        paymentIntentId: razorpayPaymentId,
        signature: razorpaySignature
      };
      order.statusTimeline.push({
        status: 'Confirmed',
        note: 'Payment received successfully via Razorpay.'
      });
      await order.save();

      // Clear Cart
      await Cart.findOneAndDelete({ user: user._id });

      // In-app alert
      sendToUser(user._id, 'notification', {
        title: 'Payment Received',
        message: `Order #${order._id} payment verified.`
      });

      // Email invoice
      await sendOrderConfirmationEmail(order, user);
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified and order placed successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user order history
// @route   GET /api/orders/my-orders
// @access  Private
const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order details by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('items.product', 'name images');

    if (!order) {
      return next(new ApiError(404, 'Order not found.'));
    }

    // Secure checking: User can see own order, Admin/Sellers can also view
    if (
      order.user._id.toString() !== req.user._id.toString() &&
      req.user.role === 'customer'
    ) {
      return next(new ApiError(403, 'Access denied. You cannot view this order.'));
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Validate a coupon code
// @route   POST /api/orders/coupon/validate
// @access  Private
const validateCoupon = async (req, res, next) => {
  const { couponCode, subtotal } = req.body;
  try {
    if (!couponCode) {
      return next(new ApiError(400, 'Coupon code is required.'));
    }

    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
    if (!coupon) {
      return next(new ApiError(400, 'Invalid or inactive coupon.'));
    }

    if (coupon.startDate > Date.now() || coupon.endDate < Date.now()) {
      return next(new ApiError(400, 'Coupon is expired or not yet active.'));
    }

    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return next(new ApiError(400, 'Coupon code usage limit exceeded.'));
    }

    if (subtotal < coupon.minOrderAmount) {
      return next(new ApiError(400, `Minimum order amount of $${coupon.minOrderAmount} required for this coupon.`));
    }

    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
      }
    } else {
      discountAmount = coupon.discountValue;
    }

    res.status(200).json({
      success: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount
      },
      message: 'Coupon code validated successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel an order
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return next(new ApiError(404, 'Order not found.'));
    }

    // Secure check: Only the customer who placed the order (or an admin) can cancel it
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new ApiError(403, 'You are not authorized to cancel this order.'));
    }

    if (order.orderStatus === 'Cancelled') {
      return next(new ApiError(400, 'Order is already cancelled.'));
    }

    if (order.orderStatus !== 'Placed' && order.orderStatus !== 'Confirmed') {
      return next(new ApiError(400, `Cannot cancel order at this stage. Current status: ${order.orderStatus}`));
    }

    // Revert/Restore stock levels
    await adjustStock(order.items, true);

    order.orderStatus = 'Cancelled';
    order.statusTimeline.push({
      status: 'Cancelled',
      note: 'Order cancelled by customer.'
    });

    if (order.paymentStatus === 'paid') {
      order.paymentStatus = 'refunded';
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully and stock levels restored.',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  stripeWebhook,
  verifyRazorpayPayment,
  getMyOrders,
  getOrderById,
  validateCoupon,
  cancelOrder,
  adjustStock
};


