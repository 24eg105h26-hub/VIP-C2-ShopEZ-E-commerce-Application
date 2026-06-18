const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  sku: {
    type: String,
    required: [true, 'SKU is required for each variant'],
    unique: true,
    trim: true
  },
  size: { type: String, trim: true },
  color: { type: String, trim: true },
  price: { type: Number, required: true, min: [0, 'Price cannot be negative'] },
  stock: { type: Number, required: true, default: 0, min: [0, 'Stock cannot be negative'] },
  images: [String]
}, { _id: true });

const productSchema = new mongoose.Schema({
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller',
    required: [true, 'Seller reference is required'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  slug: {
    type: String,
    unique: true,
    index: true
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Product category is required'],
    index: true
  },
  brand: {
    type: String,
    required: [true, 'Brand is required'],
    trim: true,
    index: true
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative'],
    index: true
  },
  compareAtPrice: {
    type: Number,
    min: [0, 'Compare price cannot be negative']
  },
  variants: [variantSchema],
  stock: {
    type: Number,
    required: true,
    default: 0,
    min: [0, 'Total stock cannot be negative']
  },
  images: {
    type: [String],
    required: [true, 'At least one product image is required']
  },
  ratings: {
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be below 0'],
    max: [5, 'Rating cannot exceed 5'],
    index: true
  },
  numReviews: {
    type: Number,
    default: 0
  },
  isFeatured: {
    type: Boolean,
    default: false,
    index: true
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },
  tags: [String]
}, {
  timestamps: true
});

// Text index for full text search
productSchema.index(
  { name: 'text', description: 'text', brand: 'text', tags: 'text' },
  { weights: { name: 10, brand: 5, tags: 3, description: 1 } }
);

// Auto slugify before validation
productSchema.pre('validate', function (next) {
  if (this.name && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
