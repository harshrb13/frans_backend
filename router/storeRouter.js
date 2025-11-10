const express = require("express");
const router = express.Router();

// 1. Import all the controller functions
const {
  getPublicStores,
  createStore,
  getAllStoresAdmin,
  getStoreById,
  updateStore,
  deleteStore,
} = require("../controllers/storeController");
const { isAuthenticatedUser, isAuthorizedRole } = require("../middlewares/auth");
const isAdmin = isAuthorizedRole("admin");

// public Router 
router.route("/stores").get(getPublicStores);

// admin routes
router
  .route("/admin/stores")
  .post( isAuthenticatedUser, isAdmin,  createStore)
  .get( isAuthenticatedUser, isAdmin,  getAllStoresAdmin);


router
  .route("/admin/store/:id")
  .get( isAuthenticatedUser, isAdmin,  getStoreById)
  .put( isAuthenticatedUser, isAdmin,  updateStore)
  .delete( isAuthenticatedUser, isAdmin,  deleteStore);

module.exports = router;