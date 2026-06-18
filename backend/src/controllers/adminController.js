const User = require('../models/User');
const Seller = require('../models/Seller');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Coupon = require('../models/Coupon');
const ApiError = require('../utils/ApiError');
const { adjustStock } = require('./orderController');

// @desc    Get all users list
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
const updateUserRole = async (req, res, next) => {
  const { id } = req.params;
  const { role } = req.body;

  try {
    if (!['customer', 'seller', 'admin'].includes(role)) {
      return next(new ApiError(400, 'Invalid user role specified.'));
    }

    const user = await User.findById(id);
    if (!user) {
      return next(new ApiError(404, 'User not found.'));
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      success: true,
      data: user,
      message: 'User role updated successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get pending seller accounts
// @route   GET /api/admin/sellers/pending
// @access  Private/Admin
const getPendingSellers = async (req, res, next) => {
  try {
    const sellers = await Seller.find({ isApproved: false }).populate('user', 'name email');
    res.status(200).json({
      success: true,
      data: sellers
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve a seller account
// @route   PUT /api/admin/sellers/:id/approve
// @access  Private/Admin
const approveSeller = async (req, res, next) => {
  const { id } = req.params;

  try {
    const seller = await Seller.findById(id);
    if (!seller) {
      return next(new ApiError(404, 'Seller profile not found.'));
    }

    seller.isApproved = true;
    await seller.save();

    // Make sure user role is set to seller
    await User.findByIdAndUpdate(seller.user, { role: 'seller' });

    res.status(200).json({
      success: true,
      data: seller,
      message: 'Seller store approved successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Global Admin Analytics
// @route   GET /api/admin/analytics
// @access  Private/Admin
const getAdminAnalytics = async (req, res, next) => {
  try {
    const totalRevenueResult = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;

    const totalOrders = await Order.countDocuments({});
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalSellers = await Seller.countDocuments({ isApproved: true });
    const totalProducts = await Product.countDocuments({});

    const recentOrders = await Order.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email');

    res.status(200).json({
      success: true,
      data: {
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalOrders,
        totalCustomers,
        totalSellers,
        totalProducts,
        recentOrders
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create promo coupon
// @route   POST /api/admin/coupons
// @access  Private/Admin
const createCoupon = async (req, res, next) => {
  const { code, discountType, discountValue, minOrderAmount, maxDiscountAmount, startDate, endDate, usageLimit } = req.body;

  try {
    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) {
      return next(new ApiError(400, 'Coupon code already exists.'));
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      startDate,
      endDate,
      usageLimit
    });

    res.status(201).json({
      success: true,
      data: coupon
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all coupons
// @route   GET /api/admin/coupons
// @access  Private/Admin
const getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find({}).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: coupons
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete coupon
// @route   DELETE /api/admin/coupons/:id
// @access  Private/Admin
const deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) {
      return next(new ApiError(404, 'Coupon not found.'));
    }
    res.status(200).json({
      success: true,
      message: 'Coupon deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all products for moderation (pending/rejected/approved list)
// @route   GET /api/admin/products/moderation
// @access  Private/Admin
const getProductsForModeration = async (req, res, next) => {
  try {
    const products = await Product.find({})
      .populate('category', 'name')
      .populate({
        path: 'seller',
        select: 'storeName'
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve a product listing
// @route   PUT /api/admin/products/:id/approve
// @access  Private/Admin
const approveProduct = async (req, res, next) => {
  const { id } = req.params;
  try {
    const product = await Product.findById(id);
    if (!product) {
      return next(new ApiError(404, 'Product not found.'));
    }

    product.approvalStatus = 'approved';
    await product.save();

    res.status(200).json({
      success: true,
      data: product,
      message: 'Product approved successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject a product listing
// @route   PUT /api/admin/products/:id/reject
// @access  Private/Admin
const rejectProduct = async (req, res, next) => {
  const { id } = req.params;
  try {
    const product = await Product.findById(id);
    if (!product) {
      return next(new ApiError(404, 'Product not found.'));
    }

    product.approvalStatus = 'rejected';
    await product.save();

    res.status(200).json({
      success: true,
      data: product,
      message: 'Product rejected/disapproved.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders list
// @route   GET /api/admin/orders
// @access  Private/Admin
const getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({})
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PUT /api/admin/orders/:id/status
// @access  Private/Admin
const updateAdminOrderStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status, note } = req.body;

  try {
    const validStatuses = ['Placed', 'Confirmed', 'Packed', 'Shipped', 'Out For Delivery', 'Delivered', 'Cancelled', 'Returned'];
    if (!validStatuses.includes(status)) {
      return next(new ApiError(400, 'Invalid order status specified.'));
    }

    const order = await Order.findById(id);
    if (!order) {
      return next(new ApiError(404, 'Order not found.'));
    }

    const prevStatus = order.orderStatus;

    if (status === 'Cancelled' && prevStatus !== 'Cancelled') {
      await adjustStock(order.items, true);
      if (order.paymentStatus === 'paid') {
        order.paymentStatus = 'refunded';
      }
    }

    if (status === 'Delivered' && order.paymentMethod === 'cod') {
      order.paymentStatus = 'paid';
    }

    order.orderStatus = status;
    order.statusTimeline.push({
      status,
      note: note || 'Status updated by admin.'
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully.',
      data: order
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  updateUserRole,
  getPendingSellers,
  approveSeller,
  getAdminAnalytics,
  createCoupon,
  getCoupons,
  deleteCoupon,
  getProductsForModeration,
  approveProduct,
  rejectProduct,
  getAllOrders,
  updateAdminOrderStatus
};

