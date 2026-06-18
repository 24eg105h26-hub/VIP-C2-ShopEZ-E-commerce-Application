const mongoose = require('mongoose');

const policiesSchema = new mongoose.Schema({
  returnPolicy: {
    type: String,
    default: 'Standard 30-day return policy applies to all products in original condition.'
  },
  shippingPolicy: {
    type: String,
    default: 'Products are typically shipped within 2-3 business days.'
  }
}, { _id: false });

const sellerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required for a seller account'],
    unique: true,
    index: true
  },
  storeName: {
    type: String,
    required: [true, 'Store name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Store name cannot exceed 100 characters']
  },
  storeDescription: {
    type: String,
    trim: true,
    maxlength: [1000, 'Store description cannot exceed 1000 characters']
  },
  logo: {
    type: String,
    default: ''
  },
  banner: {
    type: String,
    default: ''
  },
  policies: {
    type: policiesSchema,
    default: () => ({})
  },
  isApproved: {
    type: Boolean,
    default: false,
    index: true
  },
  payoutDetails: {
    stripeAccountId: { type: String, default: '' },
    bankDetails: {
      accountNumber: { type: String, default: '' },
      routingNumber: { type: String, default: '' },
      accountHolderName: { type: String, default: '' }
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Seller', sellerSchema);
