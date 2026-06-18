const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  mergeCart
} = require('../controllers/cartController');
const { protect, optionalProtect } = require('../middleware/auth');

router.route('/')
  .get(optionalProtect, getCart)
  .post(optionalProtect, addToCart)
  .put(optionalProtect, updateCartItem)
  .delete(optionalProtect, removeCartItem);

router.post('/merge', protect, mergeCart);

module.exports = router;
