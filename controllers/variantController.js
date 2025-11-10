const Variant = require('../models/variantModel');
const Product = require('../models/productModel'); // Needed to check if product exists
const catchAsyncErrors = require('../middlewares/catchAsyncErrors');
const ErrorHandler = require('../utils/errorHandler');
const { uploadOne, deleteOne } = require('../utils/uploadImages'); // Or your cloudinary util file
const { getPublicId } = require('../utils/helpers');

// --- Create a new Variant for a Product ---
exports.createVariant = catchAsyncErrors(async (req, res, next) => {
  // Add product ID from URL parameter to the request body
  req.body.product = req.params.productId;

  const product = await Product.findById(req.params.productId);
  if (!product) {
    return next(new ErrorHandler('Product not found with this ID', 404));
  }
  
  // if (!req.file) {
  //   return next(new ErrorHandler('Combination image is required.', 400));
  // }

  // const result = await uploadOne(req.file,"variants"); // Assuming uploadOne takes the file object
  // req.body.combinationImage = result.url;
  // req.body.combinationImage = "https://image3.jpeg"
  
  const variant = await Variant.create(req.body);

  res.status(201).json({
    success: true,
    data: variant,
    message:"Variant created successfully"
  });
});

// --- Get all Variants for a specific Product ---
exports.getAllVariants = catchAsyncErrors(async (req, res, next) => {
  const variants = await Variant.find({ product: req.params.productId })
    .sort({ createdAt: 1 })
    .populate('design')
    .populate('fabric')
    .populate('color');

  res.status(200).json({
    success: true,
    count: variants.length,
    data: variants,
  });
});

// --- GET SINGLE VARIANT DETAILS (NEW FUNCTION) ---
exports.getVariantDetails = catchAsyncErrors(async (req, res, next) => {
  const variant = await Variant.findById(req.params.id)
    .populate('product') // Populate the linked product details
    .populate('design')
    .populate('fabric')
    .populate('color');

  if (!variant) {
    return next(new ErrorHandler('Variant not found with this ID', 404));
  }

  res.status(200).json({
    success: true,
    data: variant,
  });
});

// --- Update a specific Variant ---
exports.updateVariant = catchAsyncErrors(async (req, res, next) => {
  let variant = await Variant.findById(req.params.id);
  if (!variant) {
    return next(new ErrorHandler('Variant not found', 404));
  }

  // If a new image is uploaded, delete the old one and upload the new one
  if (req.file) {
    const publicId = getPublicId(variant.combinationImage);
    await deleteOne(publicId);

    const result = await uploadOne(req.file,"variants");
    req.body.combinationImage = result.url;
  }

  variant = await Variant.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: variant,
    message:"Variant updates successfully"
  });
});

// --- Delete a specific Variant ---
exports.deleteVariant = catchAsyncErrors(async (req, res, next) => {
  const variant = await Variant.findById(req.params.id);
  if (!variant) {
    return next(new ErrorHandler('Variant not found', 404));
  }

  // Delete the associated image from Cloudinary
  const publicId = getPublicId(variant.combinationImage);
  await deleteOne(publicId);

  // Remove the variant from the database
  await variant.deleteOne();

  res.status(204).json({
    success: true,
    data: null,
    message:"Variant deleted successfully"
  });
});