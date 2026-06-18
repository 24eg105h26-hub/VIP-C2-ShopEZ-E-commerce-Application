const Cart = require('../models/Cart');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');

// Helper to retrieve active cart
const getActiveCart = async (userId, guestId) => {
  if (userId) {
    return await Cart.findOne({ user: userId }).populate('items.product');
  } else if (guestId) {
    return await Cart.findOne({ guestId: guestId }).populate('items.product');
  }
  return null;
};

// @desc    Get current cart
// @route   GET /api/cart
// @access  Public (Guest/User)
const getCart = async (req, res, next) => {
  const { guestId } = req.query;
  const userId = req.user ? req.user._id : null;

  try {
    let cart = await getActiveCart(userId, guestId);
    if (!cart) {
      // Create empty cart placeholder
      cart = new Cart({
        user: userId,
        guestId: userId ? null : guestId,
        items: []
      });
      await cart.save();
    }

    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add item to cart or update quantity if exists
// @route   POST /api/cart
// @access  Public (Guest/User)
const addToCart = async (req, res, next) => {
  const { productId, variantSku, quantity = 1, guestId } = req.body;
  const userId = req.user ? req.user._id : null;

  try {
    // 1. Verify product and variant stock availability
    const product = await Product.findById(productId);
    if (!product) {
      return next(new ApiError(404, 'Product not found.'));
    }

    const variant = product.variants.find(v => v.sku === variantSku);
    if (!variant) {
      return next(new ApiError(404, 'Product variant not found.'));
    }

    if (variant.stock < quantity) {
      return next(new ApiError(400, `Insufficient stock. Only ${variant.stock} items left.`));
    }

    // 2. Locate or create Cart
    let cart = await getActiveCart(userId, guestId);
    if (!cart) {
      cart = new Cart({
        user: userId,
        guestId: userId ? null : guestId,
        items: []
      });
    }

    // 3. Update or Add item
    const itemIndex = cart.items.findIndex(
      item => item.product.toString() === productId && item.variantSku === variantSku
    );

    if (itemIndex > -1) {
      const newQty = cart.items[itemIndex].quantity + quantity;
      if (variant.stock < newQty) {
        return next(new ApiError(400, `Cannot add more. Combined cart quantity exceeds stock limit.`));
      }
      cart.items[itemIndex].quantity = newQty;
    } else {
      cart.items.push({
        product: productId,
        variantSku,
        quantity,
        price: variant.price
      });
    }

    await cart.save();
    await cart.populate('items.product');

    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update quantity of cart item
// @route   PUT /api/cart
// @access  Public (Guest/User)
const updateCartItem = async (req, res, next) => {
  const { productId, variantSku, quantity, guestId } = req.body;
  const userId = req.user ? req.user._id : null;

  try {
    if (quantity < 1) {
      return next(new ApiError(400, 'Quantity must be at least 1. To remove, use DELETE endpoint.'));
    }

    const product = await Product.findById(productId);
    if (!product) {
      return next(new ApiError(404, 'Product not found.'));
    }

    const variant = product.variants.find(v => v.sku === variantSku);
    if (!variant) {
      return next(new ApiError(404, 'Product variant not found.'));
    }

    if (variant.stock < quantity) {
      return next(new ApiError(400, `Insufficient stock. Only ${variant.stock} items available.`));
    }

    const cart = await getActiveCart(userId, guestId);
    if (!cart) {
      return next(new ApiError(404, 'Cart not found.'));
    }

    const item = cart.items.find(
      i => i.product.toString() === productId && i.variantSku === variantSku
    );

    if (!item) {
      return next(new ApiError(404, 'Item not found in cart.'));
    }

    item.quantity = quantity;
    item.price = variant.price; // sync price

    await cart.save();
    await cart.populate('items.product');

    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart
// @access  Public (Guest/User)
const removeCartItem = async (req, res, next) => {
  const { productId, variantSku, guestId } = req.body;
  const userId = req.user ? req.user._id : null;

  try {
    const cart = await getActiveCart(userId, guestId);
    if (!cart) {
      return next(new ApiError(404, 'Cart not found.'));
    }

    cart.items = cart.items.filter(
      item => !(item.product.toString() === productId && item.variantSku === variantSku)
    );

    await cart.save();
    await cart.populate('items.product');

    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Merge guest cart items into user cart
// @route   POST /api/cart/merge
// @access  Private
const mergeCart = async (req, res, next) => {
  const { guestId } = req.body;
  const userId = req.user._id;

  try {
    if (!guestId) {
      return next(new ApiError(400, 'Guest ID is required to merge carts.'));
    }

    const guestCart = await Cart.findOne({ guestId });
    if (!guestCart || guestCart.items.length === 0) {
      // Nothing to merge, return user cart
      let userCart = await Cart.findOne({ user: userId }).populate('items.product');
      if (!userCart) {
        userCart = await Cart.create({ user: userId, items: [] });
      }
      return res.status(200).json({ success: true, data: userCart });
    }

    let userCart = await Cart.findOne({ user: userId });
    if (!userCart) {
      userCart = new Cart({ user: userId, items: [] });
    }

    for (const guestItem of guestCart.items) {
      const product = await Product.findById(guestItem.product);
      if (!product) continue; // Skip if product deleted

      const variant = product.variants.find(v => v.sku === guestItem.variantSku);
      if (!variant) continue; // Skip if variant removed

      const targetIndex = userCart.items.findIndex(
        userItem => userItem.product.toString() === guestItem.product.toString() &&
                    userItem.variantSku === guestItem.variantSku
      );

      // Merge quantities and restrict by stock limit
      if (targetIndex > -1) {
        const mergedQty = userCart.items[targetIndex].quantity + guestItem.quantity;
        userCart.items[targetIndex].quantity = Math.min(mergedQty, variant.stock);
      } else {
        userCart.items.push({
          product: guestItem.product,
          variantSku: guestItem.variantSku,
          quantity: Math.min(guestItem.quantity, variant.stock),
          price: variant.price
        });
      }
    }

    await userCart.save();
    await Cart.findOneAndDelete({ guestId }); // Remove guest cart
    await userCart.populate('items.product');

    res.status(200).json({
      success: true,
      data: userCart
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  mergeCart
};
