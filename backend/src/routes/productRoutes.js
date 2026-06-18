const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductBySlug,
  getRelatedProducts,
  getProductRecommendations,
  autocompleteSearch
} = require('../controllers/productController');

router.get('/', getProducts);
router.get('/search/autocomplete', autocompleteSearch);
router.get('/recommendations', getProductRecommendations);
router.get('/:slug', getProductBySlug);
router.get('/:slug/related', getRelatedProducts);

module.exports = router;
