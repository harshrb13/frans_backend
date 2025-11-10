const Store = require("../models/storeModel");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");

exports.getPublicStores = catchAsyncErrors(async (req, res, next) => {
  const stores = await Store.find({ isActive: true }).sort({ sortOrder: 1 }); // 1 = ascending

  res.status(200).json({
    success: true,
    count: stores.length,
    data: stores,
  });
});

exports.createStore = catchAsyncErrors(async (req, res, next) => {
  // req.body will contain { name, address, phone, imageUrl, latitude, longitude, etc. }
  const store = await Store.create(req.body);

  res.status(201).json({
    success: true,
    data: store,
  });
});

exports.getAllStoresAdmin = catchAsyncErrors(async (req, res, next) => {
  // We don't filter by 'isActive: true' here, so admin can see all
  const stores = await Store.find({}).sort({ sortOrder: 1 });

  res.status(200).json({
    success: true,
    count: stores.length,
    data: stores,
  });
});

exports.getStoreById = catchAsyncErrors(async (req, res, next) => {
  const store = await Store.findById(req.params.id);

  if (!store) {
    return next(
      new ErrorHandler(`Store not found with id: ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: store,
  });
});

exports.updateStore = catchAsyncErrors(async (req, res, next) => {
  let store = await Store.findById(req.params.id);

  if (!store) {
    return next(
      new ErrorHandler(`Store not found with id: ${req.params.id}`, 404)
    );
  }

  store = await Store.findByIdAndUpdate(req.params.id, req.body, {
    new: true, // Returns the updated document
    runValidators: true, // Ensures new data is valid
  });

  res.status(200).json({
    success: true,
    data: store,
  });
});

exports.deleteStore = catchAsyncErrors(async (req, res, next) => {
  const store = await Store.findByIdAndDelete(req.params.id);

  if (!store) {
    return next(
      new ErrorHandler(`Store not found with id: ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    message: "Store deleted successfully.",
  });
});
