const express = require("express");
const router = express.Router();
const  {isAuthenticatedUser,isAuthorizedRole} = require("../middlewares/auth")


// 1. Import all the controller functions
const {
  getPublicBanners,
  createBanner,
  getAllBannersAdmin,
  getBannerById,
  updateBanner,
  deleteBanner,
} = require("../controllers/bannerController"); // Adjust path as needed

// public route to get active banners
router.route("/banners").get(getPublicBanners);

// admin routes for banner management
router
  .route("/admin/banners") 
  .post( isAuthenticatedUser, isAuthorizedRole("admin"),  createBanner)
  .get(isAuthenticatedUser, isAuthorizedRole("admin"), getAllBannersAdmin);

router
  .route("/admin/banner/:id")
  .get(isAuthenticatedUser, isAuthorizedRole("admin"), getBannerById)
  .put(isAuthenticatedUser, isAuthorizedRole("admin"), updateBanner)
  .delete(isAuthenticatedUser, isAuthorizedRole("admin"), deleteBanner);

module.exports = router;