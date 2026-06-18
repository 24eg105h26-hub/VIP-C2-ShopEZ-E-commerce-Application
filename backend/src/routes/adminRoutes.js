const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin'));

router.get('/analytics', getAdminAnalytics);
router.get('/users', getAllUsers);
router.put('/users/:id/role', updateUserRole);

router.get('/sellers/pending', getPendingSellers);
router.put('/sellers/:id/approve', approveSeller);

router.get('/products/moderation', getProductsForModeration);
router.put('/products/:id/approve', approveProduct);
router.put('/products/:id/reject', rejectProduct);

router.get('/orders', getAllOrders);
router.put('/orders/:id/status', updateAdminOrderStatus);

router.route('/coupons')
  .get(getCoupons)
  .post(createCoupon);

router.delete('/coupons/:id', deleteCoupon);

module.exports = router;
