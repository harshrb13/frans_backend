const TryOnHistory = require("../models/tryOnHistoryModel");
const Variant = require("../models/variantModel");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");
const { uploadOne } = require("../utils/uploadImages"); // Our Cloudinary uploader
const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");

// UPDATED createTryOn function
exports.createTryOn = catchAsyncErrors(async (req, res, next) => {
  // --- 1. VALIDATE THE REQUEST ---
  const { variantId, userImageUrl } = req.body;
  console.log(variantId)
  if (!variantId) {
    return next(new ErrorHandler("Variant ID is required.", 400));
  }
  if (!req.file && !userImageUrl) {
    return next(new ErrorHandler("A user image is required.", 400));
  }

  // --- 2. GET GARMENT IMAGE URL FROM OUR DATABASE ---
  const variant = await Variant.findById(variantId);
  if (!variant) return next(new ErrorHandler("Variant not found.", 404));
  const garmentImageUrl = variant.combinationImage;

  // --- 3. PREPARE THE TWO IMAGES FOR THE API CALL ---
  const formData = new FormData();

  // A. Get the user's image (either from a new upload or a previous URL)
  let userImageBuffer;
  if (req.file) {
    // --- FIX: Use the buffer directly from req.file ---
    userImageBuffer = req.file.buffer;
  } else {
    // If a URL is provided, download it into a buffer
    const response = await axios.get(userImageUrl, {
      responseType: "arraybuffer",
    });
    userImageBuffer = response.data;
  }

  // B. Download the garment image from its URL into a buffer
  const garmentResponse = await axios.get(garmentImageUrl, {
    responseType: "arraybuffer",
  });
  const garmentImageBuffer = garmentResponse.data;

  // C. Append both image buffers to the form data for RapidAPI
  formData.append("avatar_image", userImageBuffer, "user.png");
  formData.append("clothing_image", garmentImageBuffer, "garment.png");

  // --- 4. CALL THE RAPIDAPI ENDPOINT ---
  const options = {
    method: "POST",
    url: "https://try-on-diffusion.p.rapidapi.com/try-on-file",
    headers: {
      ...formData.getHeaders(),
      "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
      "X-RapidAPI-Host": "try-on-diffusion.p.rapidapi.com",
    },
    data: formData,
    responseType: "arraybuffer", // Expecting an image file back
  };

  try {
    const response = await axios.request(options);
    const resultImageBuffer = response.data;

    // --- 5. UPLOAD THE RESULT IMAGE TO OUR OWN CLOUDINARY ---
    // This gives us a stable URL to store and send to the user
    const resultUpload = await uploadOne({
      buffer: resultImageBuffer,
      originalname: "result.png",
    });
    const finalImageUrl = resultUpload.url;

    // Also upload the user's image if it was a new upload
    let finalUserImageUrl = userImageUrl;
    if (req.file) {
      const userUpload = await uploadOne(req.file);
      console.log(userUpload)
      finalUserImageUrl = userUpload.url;
    }

    // --- 6. SAVE TO HISTORY & SEND RESPONSE ---
    const newTryOn = await TryOnHistory.create({
      user: req.user.id,
      variant: variantId,
      userImageURL: finalUserImageUrl,
      resultImageURL: finalImageUrl,
    });

    res.status(201).json({
      success: true,
      tryOnHistoryId: newTryOn._id, // <-- CRUCIAL CHANGE: Send back the new ID
    });
  } catch (error) {
    console.error(
      "RapidAPI Error:",
      error.response ? error.response.data : error.message
    );
    return next(new ErrorHandler("Failed to process the try-on request.", 500));
  }
});

// --- GET A SINGLE TRY-ON RESULT BY ITS ID (NEW FUNCTION) ---
exports.getTryOnResultById = catchAsyncErrors(async (req, res, next) => {
  const tryOnResult = await TryOnHistory.findById(req.params.id)
    .populate({
      path: "variant",
      populate: { path: "design fabric color product" }, // Deep populate all variant details
    })
    .populate("user", "name email"); // Optionally populate user details

  if (!tryOnResult) {
    return next(new ErrorHandler("Try-on result not found.", 404));
  }

  // Optional: Check if the logged-in user is the owner of this result
  if (tryOnResult.user._id.toString() !== req.user.id) {
    return next(new ErrorHandler("Not authorized to view this result.", 403));
  }

  res.status(200).json({
    success: true,
    data: tryOnResult,
  });
});

// NEW function to get a user's history
exports.getTryOnHistory = catchAsyncErrors(async (req, res, next) => {
  const history = await TryOnHistory.find({ user: req.user.id })
    .sort({ createdAt: -1 }) // Show most recent first
    .populate({
      path: "variant",
      populate: {
        path: "design fabric color",
      },
    });

  res.status(200).json({
    success: true,
    count: history.length,
    data: history,
  });
});
