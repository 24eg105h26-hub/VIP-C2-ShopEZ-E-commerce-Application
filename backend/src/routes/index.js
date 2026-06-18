const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const productRoutes = require('./productRoutes');
const categoryRoutes = require('./categoryRoutes');
const cartRoutes = require('./cartRoutes');
const wishlistRoutes = require('./wishlistRoutes');
const orderRoutes = require('./orderRoutes');
const reviewRoutes = require('./reviewRoutes');
const sellerRoutes = require('./sellerRoutes');
const adminRoutes = require('./adminRoutes');
const notificationRoutes = require('./notificationRoutes');

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/cart', cartRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/orders', orderRoutes);
router.use('/reviews', reviewRoutes);
router.use('/seller', sellerRoutes);
router.use('/admin', adminRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;
