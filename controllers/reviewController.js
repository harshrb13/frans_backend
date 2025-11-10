const Review = require("../models/reviewModel");
const Product = require("../models/productModel");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");
const APIFeatures = require("../utils/apiFeatures"); // We'll re-use this!


exports.getAllReviewsForProduct = catchAsyncErrors(async (req, res, next) => {
  const { productId } = req.params;
  const resPerPage = 10; // Reviews per page

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    return next(new ErrorHandler("Product not found.", 404));
  }

  // Create the base query
  const baseQuery = Review.find({ product: productId }).populate({
    path: "user",
    select: "name", // Only get public user info
  });

  // Use APIFeatures for sorting (e.g., ?sort_by=createdAt-descending) and pagination
  const apiFeatures = new APIFeatures(baseQuery, req.query)
    .filter() // Not really used here, but good practice
    .sort()
    .paginate(resPerPage);

  const reviews = await apiFeatures.query;

  // Get the total count just for this product
  const totalCount = await Review.countDocuments({ product: productId });

  res.status(200).json({
    success: true,
    totalCount: totalCount,
    count: reviews.length,
    resPerPage,
    data: reviews,
  });
});

/**
 * @desc    Create a new review for a product
 * @route   POST /api/v1/product/:productId/reviews
 * @access  Private (User must be logged in)
 */
exports.createReview = catchAsyncErrors(async (req, res, next) => {
  const { rating, comment } = req.body;
  const { productId } = req.params;
  const userId = req.user.id; // From 'isAuthenticatedUser' middleware

  // 1. Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    return next(new ErrorHandler("Product not found.", 404));
  }

  // 2. Check if user has already reviewed this product
  const existingReview = await Review.findOne({
    product: productId,
    user: userId,
  });
  if (existingReview) {
    return next(
      new ErrorHandler("You have already submitted a review for this product.", 400)
    );
  }

  // 3. Create the new review
  const review = await Review.create({
    product: productId,
    user: userId,
    rating,
    comment,
  });

  // Note: The 'post("save")' hook in 'review.model.js' will
  // automatically recalculate the product's average rating.

  res.status(201).json({
    success: true,
    data: review,
  });
});

/**
 * @desc    Update your own review
 * @route   PUT /api/v1/reviews/:id
 * @access  Private
 */
exports.updateReview = catchAsyncErrors(async (req, res, next) => {
  const { rating, comment } = req.body;
  const reviewId = req.params.id;
  const userId = req.user.id;

  let review = await Review.findById(reviewId);

  if (!review) {
    return next(new ErrorHandler("Review not found.", 404));
  }

  // Check if the logged-in user is the owner of the review
  if (review.user.toString() !== userId) {
    return next(
      new ErrorHandler("You are not authorized to update this review.", 403)
    );
  }

  // Update the fields
  review.rating = rating;
  review.comment = comment;
  await review.save(); // Use .save() to trigger the 'post("save")' hook

  // The hook will recalculate the average rating automatically.

  res.status(200).json({
    success: true,
    data: review,
  });
});

/**
 * @desc    Delete your own review
 * @route   DELETE /api/v1/reviews/:id
 * @access  Private
 */
exports.deleteReview = catchAsyncErrors(async (req, res, next) => {
  const reviewId = req.params.id;
  const userId = req.user.id;

  const review = await Review.findById(reviewId);

  if (!review) {
    return next(new ErrorHandler("Review not found.", 404));
  }

  // Check if the logged-in user is the owner of the review
  if (review.user.toString() !== userId) {
    return next(
      new ErrorHandler("You are not authorized to delete this review.", 403)
    );
  }

  // Use findOneAndDelete to trigger the model's 'post' hook
  await Review.findOneAndDelete({ _id: reviewId });

  // The hook will recalculate the average rating automatically.

  res.status(200).json({
    success: true,
    message: "Review deleted successfully.",
  });
});
