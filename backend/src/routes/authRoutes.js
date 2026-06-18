const express = require('express');
const router = express.Router();
const {
  register,
  verifyEmail,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  deleteAccount,
  exportData,
  updateProfile,
  changePassword,
  addAddress,
  updateAddress,
  deleteAddress
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  registerValidator,
  loginValidator,
  resetPasswordValidator
} = require('../validators/authValidator');

router.post('/register', registerValidator, validate, register);
router.post('/verify-email', verifyEmail);
router.post('/login', loginValidator, validate, login);
router.post('/refresh', refresh);
router.post('/logout', protect, logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPasswordValidator, validate, resetPassword);
router.delete('/account', protect, deleteAccount);
router.get('/export', protect, exportData);

// Profile & Address routes
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.post('/address', protect, addAddress);
router.route('/address/:addressId')
  .put(protect, updateAddress)
  .delete(protect, deleteAddress);

module.exports = router;
