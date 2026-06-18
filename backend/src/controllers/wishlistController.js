const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');

// @desc    Get user wishlist
// @route   GET /api/wishlist
// @access  Private
const getWishlist = async (req, res, next) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id }).populate('products');
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, products: [] });
    }

    res.status(200).json({
      success: true,
      data: wishlist
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add product to wishlist
// @route   POST /api/wishlist
// @access  Private
const addToWishlist = async (req, res, next) => {
  const { productId } = req.body;

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return next(new ApiError(404, 'Product not found.'));
    }

    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user._id, products: [] });
    }

    if (wishlist.products.includes(productId)) {
      return next(new ApiError(400, 'Product already in wishlist.'));
    }

    wishlist.products.push(productId);
    await wishlist.save();

    res.status(200).json({
      success: true,
      data: wishlist,
      message: 'Product added to wishlist.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove product from wishlist
// @route   DELETE /api/wishlist/:productId
// @access  Private
const removeFromWishlist = async (req, res, next) => {
  const { productId } = req.params;

  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      return next(new ApiError(404, 'Wishlist not found.'));
    }

    wishlist.products = wishlist.products.filter(id => id.toString() !== productId);
    await wishlist.save();

    res.status(200).json({
      success: true,
      data: wishlist,
      message: 'Product removed from wishlist.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist
};
