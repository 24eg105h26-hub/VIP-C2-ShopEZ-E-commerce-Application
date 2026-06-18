const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  variantSku: { type: String, required: true },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    required: true
  }
}, { _id: false });

const statusUpdateSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['Placed', 'Confirmed', 'Packed', 'Shipped', 'Out For Delivery', 'Delivered', 'Cancelled', 'Returned'],
    required: true
  },
  timestamp: { type: Date, default: Date.now },
  note: String
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  items: [orderItemSchema],
  shippingAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
    phone: { type: String, required: true }
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'razorpay', 'cod'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentDetails: {
    transactionId: String,
    paymentIntentId: String,
    signature: String
  },
  shippingPrice: { type: Number, default: 0 },
  taxPrice: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  totalPrice: { type: Number, required: true },
  couponApplied: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon',
    default: null
  },
  orderStatus: {
    type: String,
    enum: ['Placed', 'Confirmed', 'Packed', 'Shipped', 'Out For Delivery', 'Delivered', 'Cancelled', 'Returned'],
    default: 'Placed',
    index: true
  },
  trackingNumber: String,
  carrier: String,
  statusTimeline: [statusUpdateSchema],
  invoicePdfUrl: String
}, {
  timestamps: true
});

orderSchema.index({ 'items.seller': 1, createdAt: -1 });

// Auto initialize status timeline on save if empty
orderSchema.pre('save', function (next) {
  if (this.isNew && (!this.statusTimeline || this.statusTimeline.length === 0)) {
    this.statusTimeline = [{
      status: 'Placed',
      timestamp: new Date(),
      note: 'Order placed successfully.'
    }];
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
