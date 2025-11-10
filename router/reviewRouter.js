const express = require("express");
const router = express.Router();

// 1. Import all the controller functions
const {
  getAllReviewsForProduct,
  createReview,
  updateReview,
  deleteReview,
} = require("../controllers/reviewController"); // Adjust path as needed

// 2. Import your authentication middleware
const { isAuthenticatedUser } = require("../middlewares/auth"); // Adjust path as needed

// ===============================================
// REVIEW ROUTES
// ===============================================

/**
 * @route   GET /api/v1/product/:productId/reviews
 * @desc    Get all reviews for a specific product (Public)
 *
 * @route   POST /api/v1/product/:productId/reviews
 * @desc    Create a new review for a product (Private)
 */
router
  .route("/product/:productId/reviews")
  .get(getAllReviewsForProduct)
  .post(isAuthenticatedUser, createReview);

/**
 * @route   PUT /api/v1/reviews/:id
 * @desc    Update a specific review (Private - user must own)
 *
 * @route   DELETE /api/v1/reviews/:id
 * @desc    Delete a specific review (Private - user must own)
 */
router
  .route("/reviews/:id")
  .put(isAuthenticatedUser, updateReview)
  .delete(isAuthenticatedUser, deleteReview);

module.exports = router;