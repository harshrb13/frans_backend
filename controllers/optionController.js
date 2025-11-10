// controllers/optionController.js

const { Design, Fabric, Color } = require('../models/optionModel');
const catchAsyncErrors = require('../middlewares/catchAsyncErrors');
const ErrorHandler = require('../utils/errorHandler');
// Assuming your cloudinary utility exports both upload and delete functions
const { uploadOne, deleteOne } = require('../utils/uploadImages'); 
const { getPublicId } = require('../utils/helpers'); // A helper to get public_id from a url

// --- GET ALL (REUSABLE) ---
exports.getAllOptions = (Model) => catchAsyncErrors(async (req, res, next) => {
    const docs = await Model.find().sort({ createdAt: 1 });
    res.status(200).json({ success: true, count: docs.length, data: docs });
});

// --- CREATE FUNCTIONS ---
exports.createDesign = catchAsyncErrors(async (req, res, next) => {
    // if (!req.file) return next(new ErrorHandler('Design image is required.', 400));
    
    // const result = await uploadOne(req.file,"designs");
    // req.body.designImage = result.secure_url;
    // req.body.designImage = "https://image1.jpeg"

    const design = await Design.create(req.body);
    res.status(201).json({ success: true, data: design,message: "Design created successfully" });
});

exports.createFabric = catchAsyncErrors(async (req, res, next) => {
    // if (!req.file) return next(new ErrorHandler('Fabric swatch image is required.', 400));
    
    // const result = await uploadOne(req.file,"fabrics");
    // req.body.fabricSwatchImage = result.secure_url;
    // req.body.fabricSwatchImage = "https://iamge.jpeg"

    const fabric = await Fabric.create(req.body);
    res.status(201).json({ success: true, data: fabric,message: "Fabric created successfully" });
});

exports.createColor = catchAsyncErrors(async (req, res, next) => {
    // 1. Get colorName and colorHex from the request body
  const { colorName, colorHex } = req.body;

  // 2. Validate the input
  if (!colorName || !colorHex) {
    return next(new ErrorHandler('Color name and hex code are both required.', 400));
  }

  // 3. Create the color document in the database
  const color = await Color.create({ colorName, colorHex });

  // 4. Send the successful response
  res.status(201).json({ 
    success: true, 
    data: color,
    message: "Color created successfully" 
  });

});

// --- UPDATE FUNCTIONS ---
exports.updateDesign = catchAsyncErrors(async (req, res, next) => {
    const design = await Design.findById(req.params.id);
    if (!design) return next(new ErrorHandler('Design not found', 404));

    if (req.file) {
        // Delete old image from Cloudinary
        const publicId = getPublicId(design.designImage);
        await deleteOne(publicId);

        // Upload new image
        const result = await uploadOne(req.file,"designs");
        req.body.designImage = result.secure_url;
    }

    const updatedDesign = await Design.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: updatedDesign,message: "Design updated successfully" });
});

exports.updateFabric = catchAsyncErrors(async (req, res, next) => {
    const fabric = await Fabric.findById(req.params.id);
    if (!fabric) return next(new ErrorHandler('Fabric not found', 404));

    if (req.file) {
        const publicId = getPublicId(fabric.fabricSwatchImage);
        await deleteOne(publicId);
        
        const result = await uploadOne(req.file,"fabrics");
        req.body.fabricSwatchImage = result.secure_url;
    }

    const updatedFabric = await Fabric.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: updatedFabric,message: "Fabric updated successfully" });
});

exports.updateColor = catchAsyncErrors(async (req, res, next) => {
    // The request body will contain the new colorName and/or colorHex
  const { colorName, colorHex } = req.body;

  // Find the color by its ID and update it with the new data
  const updatedColor = await Color.findByIdAndUpdate(
    req.params.id, 
    { colorName, colorHex }, // Pass the new data
    { new: true, runValidators: true }
  );

  // If no document was found, return an error
  if (!updatedColor) {
    return next(new ErrorHandler('Color not found with that ID', 404));
  }
  
  // Send the successful response
  res.status(200).json({ 
    success: true, 
    data: updatedColor, 
    message: "Color updated successfully" 
  });
});

// --- DELETE FUNCTIONS ---
exports.deleteDesign = catchAsyncErrors(async (req, res, next) => {
    const design = await Design.findById(req.params.id);
    if (!design) return next(new ErrorHandler('Design not found', 404));

    // Delete image from Cloudinary
    const publicId = getPublicId(design.designImage);
    await deleteOne(publicId);

    await design.deleteOne();
    res.status(204).json({ success: true, message: "Design deleted successfully" });
});

exports.deleteFabric = catchAsyncErrors(async (req, res, next) => {
    const fabric = await Fabric.findById(req.params.id);
    if (!fabric) return next(new ErrorHandler('Fabric not found', 404));
    
    const publicId = getPublicId(fabric.fabricSwatchImage);
    await deleteOne(publicId);

    await fabric.deleteOne();
    res.status(204).json({ success: true, message: "fabric deleted successfully" });
});

exports.deleteColor = catchAsyncErrors(async (req, res, next) => {
    const color = await Color.findById(req.params.id);
    if (!color) return next(new ErrorHandler('Color not found', 404));

    // const publicId = getPublicId(color.colorSwatchImage);
    // await deleteOne(publicId);

    await color.deleteOne();
    res.status(204).json({ success: true, message: "Color deletedS successfully" });
});