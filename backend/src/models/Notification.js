const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['order_status', 'low_stock', 'seller_approval', 'price_drop', 'general'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  data: {
    orderId: mongoose.Schema.Types.ObjectId,
    productId: mongoose.Schema.Types.ObjectId,
    sellerId: mongoose.Schema.Types.ObjectId
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
