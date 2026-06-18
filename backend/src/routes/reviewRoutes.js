const express = require('express');
const router = express.Router();
const {
  createReview,
  getProductReviews,
  toggleHelpful,
  replyToReview
} = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');

router.route('/:productId')
  .get(getProductReviews)
  .post(protect, createReview);

router.post('/:id/helpful', protect, toggleHelpful);
router.post('/:id/reply', protect, authorize('seller'), replyToReview);

module.exports = router;
