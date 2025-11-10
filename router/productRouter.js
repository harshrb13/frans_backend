const express = require('express');
const router = express.Router();
const {singleImageUpload} = require('../middlewares/upload');
const {isAuthenticatedUser,isAuthorizedRole} = require("../middlewares/auth")
const {
  createProduct,
  getAllProducts,
  updateProduct,
  deleteProduct,
  getProductDetails,
  getHomepageSections,
  getProductPageData
} = require('../controllers/productController');

const variantRoute = require("./variantRouter.js");

router.use('/products/:productId/variants',variantRoute)

router.route("/homepage-sections").get(getHomepageSections);

router.route('/products')
  .get(getAllProducts)
  .post(isAuthenticatedUser,isAuthorizedRole("admin"),singleImageUpload, createProduct);

router.route('/product/:id')
  .get(getProductDetails)
  .patch(isAuthenticatedUser,isAuthorizedRole("admin"),updateProduct)
  .delete(isAuthenticatedUser,isAuthorizedRole("admin"),deleteProduct);

router.route("/product-page/:id").get(getProductPageData);

module.exports = router;