const Product = require('../models/Product');
const Seller = require('../models/Seller');
const Order = require('../models/Order');
const ApiError = require('../utils/ApiError');

// Helper to get active seller profile for logged-in user
const getSellerProfile = async (userId) => {
  const seller = await Seller.findOne({ user: userId });
  if (!seller) {
    throw new ApiError(403, 'Seller profile not found. Please register as a seller first.');
  }
  return seller;
};

// @desc    Update seller store details
// @route   PUT /api/seller/store
// @access  Private/Seller
const updateStoreDetails = async (req, res, next) => {
  const { storeDescription, logo, banner, policies } = req.body;

  try {
    const seller = await getSellerProfile(req.user._id);

    seller.storeDescription = storeDescription || seller.storeDescription;
    seller.logo = logo || seller.logo;
    seller.banner = banner || seller.banner;
    if (policies) {
      seller.policies = {
        returnPolicy: policies.returnPolicy || seller.policies.returnPolicy,
        shippingPolicy: policies.shippingPolicy || seller.policies.shippingPolicy
      };
    }

    await seller.save();
    res.status(200).json({
      success: true,
      data: seller,
      message: 'Store settings updated successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new product listing
// @route   POST /api/seller/products
// @access  Private/Seller
const sellerCreateProduct = async (req, res, next) => {
  const { name, description, category, brand, price, compareAtPrice, variants, images, tags } = req.body;

  try {
    const seller = await getSellerProfile(req.user._id);
    if (!seller.isApproved) {
      return next(new ApiError(403, 'Your seller account has not been approved by the admin yet.'));
    }

    // Calculate total stock from all variants
    let totalStock = 0;
    if (variants && variants.length > 0) {
      totalStock = variants.reduce((acc, curr) => acc + (curr.stock || 0), 0);
    }

    const product = new Product({
      seller: seller._id,
      name,
      description,
      category,
      brand,
      price,
      compareAtPrice,
      variants: variants || [],
      stock: totalStock,
      images,
      tags
    });

    await product.save();
    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a seller product listing
// @route   PUT /api/seller/products/:id
// @access  Private/Seller
const sellerUpdateProduct = async (req, res, next) => {
  const { id } = req.params;
  const { name, description, category, brand, price, compareAtPrice, variants, images, tags } = req.body;

  try {
    const seller = await getSellerProfile(req.user._id);
    const product = await Product.findOne({ _id: id, seller: seller._id });
    if (!product) {
      return next(new ApiError(404, 'Product listing not found.'));
    }

    product.name = name || product.name;
    product.description = description || product.description;
    product.category = category || product.category;
    product.brand = brand || product.brand;
    product.price = price || product.price;
    product.compareAtPrice = compareAtPrice !== undefined ? compareAtPrice : product.compareAtPrice;
    product.images = images || product.images;
    product.tags = tags || product.tags;

    if (variants) {
      product.variants = variants;
      product.stock = variants.reduce((acc, curr) => acc + (curr.stock || 0), 0);
    }

    await product.save();
    res.status(200).json({
      success: true,
      data: product,
      message: 'Product listing updated successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product listing
// @route   DELETE /api/seller/products/:id
// @access  Private/Seller
const sellerDeleteProduct = async (req, res, next) => {
  const { id } = req.params;

  try {
    const seller = await getSellerProfile(req.user._id);
    const product = await Product.findOneAndDelete({ _id: id, seller: seller._id });
    if (!product) {
      return next(new ApiError(404, 'Product listing not found.'));
    }

    res.status(200).json({
      success: true,
      message: 'Product listing deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Seller store analytics
// @route   GET /api/seller/analytics
// @access  Private/Seller
const getSellerAnalytics = async (req, res, next) => {
  try {
    const seller = await getSellerProfile(req.user._id);

    // Get all orders containing products belonging to this seller
    const orders = await Order.find({ 'items.seller': seller._id });

    let totalRevenue = 0;
    let orderCount = orders.length;

    for (const order of orders) {
      // Add items price sum belonging to this seller
      const sellerItems = order.items.filter(item => item.seller.toString() === seller._id.toString());
      const itemSubtotal = sellerItems.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
      totalRevenue += itemSubtotal;
    }

    // Identify low stock products
    const lowStockAlerts = await Product.find({
      seller: seller._id,
      $or: [
        { stock: { $lte: 5 } },
        { 'variants.stock': { $lte: 5 } }
      ]
    }).select('name stock variants');

    res.status(200).json({
      success: true,
      data: {
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        orderCount,
        lowStockCount: lowStockAlerts.length,
        lowStockAlerts
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Seller Order status update (Fulfillment)
// @route   PUT /api/seller/orders/:orderId
// @access  Private/Seller
const updateSellerOrderStatus = async (req, res, next) => {
  const { orderId } = req.params;
  const { status, note } = req.body;

  try {
    const seller = await getSellerProfile(req.user._id);
    const order = await Order.findById(orderId);

    if (!order) {
      return next(new ApiError(404, 'Order not found.'));
    }

    // Verify order contains items of this seller
    const hasSellerItems = order.items.some(item => item.seller.toString() === seller._id.toString());
    if (!hasSellerItems) {
      return next(new ApiError(403, 'Access denied. Order does not contain items from your store.'));
    }

    order.orderStatus = status;
    order.statusTimeline.push({
      status,
      note: note || `Order status updated to ${status} by seller store: ${seller.storeName}`
    });

    await order.save();
    res.status(200).json({
      success: true,
      data: order,
      message: `Order status shifted to ${status}.`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get seller store settings
// @route   GET /api/seller/store
// @access  Private/Seller
const getSellerStore = async (req, res, next) => {
  try {
    const seller = await getSellerProfile(req.user._id);
    res.status(200).json({
      success: true,
      data: seller
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all products listed by seller
// @route   GET /api/seller/products
// @access  Private/Seller
const getSellerProducts = async (req, res, next) => {
  try {
    const seller = await getSellerProfile(req.user._id);
    const products = await Product.find({ seller: seller._id }).populate('category', 'name slug');
    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get orders containing this seller's products
// @route   GET /api/seller/orders
// @access  Private/Seller
const getSellerOrders = async (req, res, next) => {
  try {
    const seller = await getSellerProfile(req.user._id);
    const orders = await Order.find({ 'items.seller': seller._id })
      .sort({ createdAt: -1 })
      .populate('user', 'name email');
    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  updateStoreDetails,
  sellerCreateProduct,
  sellerUpdateProduct,
  sellerDeleteProduct,
  getSellerAnalytics,
  updateSellerOrderStatus,
  getSellerStore,
  getSellerProducts,
  getSellerOrders
};

