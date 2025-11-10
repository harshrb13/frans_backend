const Wishlist = require("../models/wishlistModel");
const Product = require("../models/productModel"); // Import Product model
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");

exports.toggleWishlistItem = catchAsyncErrors(async (req, res, next) => {
  const { productId } = req.body;
  const userId = req.user.id; 

  if (!productId) {
    return next(new ErrorHandler("Product ID is required.", 400));
  }

  // Check if the product exists
  const productExists = await Product.findById(productId);
  if (!productExists) {
    return next(new ErrorHandler("Product not found.", 404));
  }

  // Check if the item is *already* in the wishlist
  const wishlistItem = await Wishlist.findOne({
    user: userId,
    product: productId,
  });

  if (wishlistItem) {
    // --- Item exists, so REMOVE it ---
    await wishlistItem.deleteOne();

    res.status(200).json({
      success: true,
      message: "Removed from wishlist.",
      action: "removed", // Send action to frontend
    });
  } else {
    // The 'unique' index on the model will also prevent duplicates
    await Wishlist.create({
      user: userId,
      product: productId,
    });

    res.status(201).json({
      success: true,
      message: "Added to wishlist.",
      action: "added", // Send action to frontend
    });
  }
});


exports.getMyWishlistIds = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user.id;

  // Find all wishlist items for the user
  const wishlistItems = await Wishlist.find({ user: userId }).select("product");

  const productIds = wishlistItems.map((item) => item.product.toString());

  res.status(200).json({
    success: true,
    data: productIds,
  });
});


exports.getMyWishlistProducts = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user.id;
  const resPerPage = 10;
  const page = Number(req.query.page) || 1;
  const skip = resPerPage * (page - 1);

  // 1. Find the paginated wishlist *items* for the user
  const wishlistItems = await Wishlist.find({ user: userId })
    .sort({ createdAt: -1 }) // Show newest first
    .skip(skip)
    .limit(resPerPage);

  // 2. Get the total count for pagination
  const totalCount = await Wishlist.countDocuments({ user: userId });

  // 3. Get just the product IDs from this page
  const productIds = wishlistItems.map((item) => item.product);

  // 4. Find all Products that match those IDs
  const products = await Product.find({
    _id: { $in: productIds },
    isActive: true, // Also ensure the product is still active
  }).populate({
    path: "defaultVariant",
    populate: {
      path: "design fabric color",
      select: "designName fabricName colorName colorHex",
    },
  });

  res.status(200).json({
    success: true,
    totalCount: totalCount,
    count: products.length,
    resPerPage,
    data: products,
  });
});
