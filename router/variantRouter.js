const express = require("express");
// We need mergeParams:true to access :productId from the parent router
const router = express.Router({ mergeParams: true });
const { singleImageUpload } = require("../middlewares/upload");
const {
  isAuthenticatedUser,
  isAuthorizedRole,
} = require("../middlewares/auth");

const {
  createVariant,
  getVariantDetails,
  getAllVariants,
  updateVariant,
  deleteVariant,
} = require("../controllers/variantController");

// Route to get all variants for a product and create a new one
router
  .route("/")
  .get(getAllVariants)
  .post(
    isAuthenticatedUser,
    isAuthorizedRole("admin"),
    singleImageUpload,
    createVariant
  );

// Route to update and delete a specific variant by its own ID
router
  .route("/:id")
  .get(getVariantDetails)
  .patch(
    isAuthenticatedUser,
    isAuthorizedRole("admin"),
    singleImageUpload,
    updateVariant
  )
  .delete(isAuthenticatedUser, isAuthorizedRole("admin"), deleteVariant);

module.exports = router;
