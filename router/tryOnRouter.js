// router/tryOnRouter.js
const express = require('express');
const router = express.Router();
const {singleImageUpload} = require('../middlewares/upload');
const { isAuthenticatedUser } = require('../middlewares/auth');
const { createTryOn, getTryOnHistory, getTryOnResultById } = require('../controllers/tryOnController');

// This route handles creating a new try-on
router.route('/tryon').post(isAuthenticatedUser, singleImageUpload, createTryOn);

// This new route gets the logged-in user's history
router.route('/tryon/history').get(isAuthenticatedUser, getTryOnHistory);

// GETS A SINGLE, SPECIFIC TRY-ON RESULT BY ITS ID (NEW ROUTE)
router.route('/tryon/:id').get(isAuthenticatedUser, getTryOnResultById);

module.exports = router;