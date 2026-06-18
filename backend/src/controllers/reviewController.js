const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');

// @desc    Create product review
// @route   POST /api/reviews/:productId
// @access  Private
const createReview = async (req, res, next) => {
  const { productId } = req.params;
  const { rating, comment, images } = req.body;
  const userId = req.user._id;

  try {
    // 1. Verify if the customer has purchased this product
    const order = await Order.findOne({
      user: userId,
      orderStatus: 'Delivered',
      'items.product': productId
    });

    if (!order) {
      return next(
        new ApiError(400, 'You can only review products that you have purchased and that have been delivered.')
      );
    }

    // 2. Check if already reviewed
    const existingReview = await Review.findOne({
      user: userId,
      product: productId,
      order: order._id
    });

    if (existingReview) {
      return next(new ApiError(400, 'You have already reviewed this product for this order.'));
    }

    const review = await Review.create({
      user: userId,
      product: productId,
      order: order._id,
      rating: Number(rating),
      comment,
      images: images || [],
      isVerified: true
    });

    res.status(201).json({
      success: true,
      data: review,
      message: 'Review submitted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reviews for a product
// @route   GET /api/reviews/:productId
// @access  Public
const getProductReviews = async (req, res, next) => {
  const { productId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  try {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const reviews = await Review.find({ product: productId, isApproved: true })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Review.countDocuments({ product: productId, isApproved: true });

    res.status(200).json({
      success: true,
      count: reviews.length,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      total,
      data: reviews
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle helpful vote on a review
// @route   POST /api/reviews/:id/helpful
// @access  Private
const toggleHelpful = async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user._id;

  try {
    const review = await Review.findById(id);
    if (!review) {
      return next(new ApiError(404, 'Review not found.'));
    }

    const isHelpful = review.helpfulVotes.includes(userId);
    if (isHelpful) {
      review.helpfulVotes = review.helpfulVotes.filter(vId => vId.toString() !== userId.toString());
    } else {
      review.helpfulVotes.push(userId);
    }

    await review.save();
    res.status(200).json({
      success: true,
      data: review,
      message: isHelpful ? 'Helpful vote removed.' : 'Marked review as helpful.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reply to a review (Seller only)
// @route   POST /api/reviews/:id/reply
// @access  Private/Seller
const replyToReview = async (req, res, next) => {
  const { id } = req.params;
  const { reply } = req.body;

  try {
    if (!reply || reply.trim() === '') {
      return next(new ApiError(400, 'Reply content is required.'));
    }

    const review = await Review.findById(id).populate('product');
    if (!review) {
      return next(new ApiError(404, 'Review not found.'));
    }

    // Verify if seller is the owner of the product
    const product = review.product;
    const seller = await Product.findById(product._id).populate('seller');
    if (seller.seller.user.toString() !== req.user._id.toString()) {
      return next(new ApiError(403, 'You can only reply to reviews on your own store products.'));
    }

    review.sellerReply = reply;
    review.sellerReplyAt = Date.now();
    await review.save();

    res.status(200).json({
      success: true,
      data: review,
      message: 'Reply submitted.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getProductReviews,
  toggleHelpful,
  replyToReview
};
