const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required for review']
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required for review'],
    index: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Order is required to verify purchase']
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  comment: {
    type: String,
    required: [true, 'Review comment is required'],
    trim: true,
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  images: [String],
  helpfulVotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  sellerReply: {
    type: String,
    trim: true
  },
  sellerReplyAt: Date,
  isVerified: {
    type: Boolean,
    default: false
  },
  isApproved: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true
});

// Ensure a user can only review a product once per order
reviewSchema.index({ user: 1, product: 1, order: 1 }, { unique: true });

// Static method to get average rating and number of reviews
reviewSchema.statics.getAverageRating = async function (productId) {
  const obj = await this.aggregate([
    {
      $match: { product: productId, isApproved: true }
    },
    {
      $group: {
        _id: '$product',
        ratings: { $avg: '$rating' },
        numReviews: { $sum: 1 }
      }
    }
  ]);

  try {
    if (obj.length > 0) {
      await mongoose.model('Product').findByIdAndUpdate(productId, {
        ratings: Math.round(obj[0].ratings * 10) / 10,
        numReviews: obj[0].numReviews
      });
    } else {
      await mongoose.model('Product').findByIdAndUpdate(productId, {
        ratings: 0,
        numReviews: 0
      });
    }
  } catch (err) {
    console.error('Error updating product rating average:', err);
  }
};

// Call getAverageRating after save
reviewSchema.post('save', async function () {
  await this.constructor.getAverageRating(this.product);
});

// Call getAverageRating after remove/delete
reviewSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    await doc.constructor.getAverageRating(doc.product);
  }
});

module.exports = mongoose.model('Review', reviewSchema);
