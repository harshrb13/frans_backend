const express = require("express");
const router = express.Router();

// 1. Import all the controller functions
const {
  toggleWishlistItem,
  getMyWishlistIds,
  getMyWishlistProducts,
} = require("../controllers/wishlistController"); // Adjust path as needed

// 2. Import your authentication middleware
const { isAuthenticatedUser } = require("../middlewares/auth");

router.route("/wishlist/toggle").post(isAuthenticatedUser, toggleWishlistItem);

router.route("/wishlist/ids").get(isAuthenticatedUser, getMyWishlistIds);

router
  .route("/wishlist/products")
  .get(isAuthenticatedUser, getMyWishlistProducts);

module.exports = router;