const express = require('express');
const router = express.Router();
const {
  updateStoreDetails,
  sellerCreateProduct,
  sellerUpdateProduct,
  sellerDeleteProduct,
  getSellerAnalytics,
  updateSellerOrderStatus,
  getSellerStore,
  getSellerProducts,
  getSellerOrders
} = require('../controllers/sellerController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('seller'));

router.route('/store')
  .get(getSellerStore)
  .put(updateStoreDetails);

router.get('/analytics', getSellerAnalytics);
router.get('/orders', getSellerOrders);
router.put('/orders/:orderId', updateSellerOrderStatus);

router.route('/products')
  .get(getSellerProducts)
  .post(sellerCreateProduct);

router.route('/products/:id')
  .put(sellerUpdateProduct)
  .delete(sellerDeleteProduct);

module.exports = router;
