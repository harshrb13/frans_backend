// routes/optionRoutes.js
const express = require('express');
const router = express.Router();
const { Design, Fabric, Color } = require('../models/optionModel');
const {singleImageUpload} = require('../middlewares/upload');
const  {isAuthenticatedUser,isAuthorizedRole} = require("../middlewares/auth")

const {
  getAllOptions,
  createDesign, createFabric, createColor,
  updateDesign, updateFabric, updateColor,
  deleteDesign, deleteFabric, deleteColor,
} = require('../controllers/optionController');

// --- Design Routes ---
router.route('/designs')
  .get(getAllOptions(Design))
  .post(isAuthenticatedUser,isAuthorizedRole("admin"),singleImageUpload, createDesign);

router.route('/designs/:id')
  .patch(isAuthenticatedUser,isAuthorizedRole("admin"),singleImageUpload, updateDesign)
  .delete(isAuthenticatedUser,isAuthorizedRole("admin"),deleteDesign);

// --- Fabric Routes ---
router.route('/fabrics')
  .get(getAllOptions(Fabric))
  .post(isAuthenticatedUser,isAuthorizedRole("admin"),singleImageUpload, createFabric);

router.route('/fabrics/:id')
  .patch(isAuthenticatedUser,isAuthorizedRole("admin"),singleImageUpload, updateFabric)
  .delete(isAuthenticatedUser,isAuthorizedRole("admin"),deleteFabric);

// --- Color Routes ---
router.route('/colors')
  .get(getAllOptions(Color))
  .post(isAuthenticatedUser,isAuthorizedRole("admin"),singleImageUpload, createColor);

router.route('/colors/:id')
  .patch(isAuthenticatedUser,isAuthorizedRole("admin"),singleImageUpload, updateColor)
  .delete(isAuthenticatedUser,isAuthorizedRole("admin"),deleteColor);

module.exports = router;