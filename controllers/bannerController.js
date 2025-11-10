const Banner = require("../models/bannerModel");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");

exports.getPublicBanners = catchAsyncErrors(async (req, res, next) => {
  const banners = await Banner.find({ isActive: true }).sort({ sortOrder: 1 }); // 1 = ascending

  res.status(200).json({
    success: true,
    count: banners.length,
    data: banners,
  });
});


exports.createBanner = catchAsyncErrors(async (req, res, next) => {
  // req.body will contain { title, imageUrl, link, sortOrder, etc. }
  const banner = await Banner.create(req.body);

  res.status(201).json({
    success: true,
    data: banner,
  });
});

exports.getAllBannersAdmin = catchAsyncErrors(async (req, res, next) => {
  // We don't filter by 'isActive: true' here, so admin can see all
  const banners = await Banner.find({}).sort({ sortOrder: 1 });

  res.status(200).json({
    success: true,
    count: banners.length,
    data: banners,
  });
});

exports.getBannerById = catchAsyncErrors(async (req, res, next) => {
  const banner = await Banner.findById(req.params.id);

  if (!banner) {
    return next(
      new ErrorHandler(`Banner not found with id: ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: banner,
  });
});

exports.updateBanner = catchAsyncErrors(async (req, res, next) => {
  let banner = await Banner.findById(req.params.id);

  if (!banner) {
    return next(
      new ErrorHandler(`Banner not found with id: ${req.params.id}`, 404)
    );
  }

  banner = await Banner.findByIdAndUpdate(req.params.id, req.body, {
    new: true, // Returns the updated document
    runValidators: true, // Ensures new data is valid
  });

  res.status(200).json({
    success: true,
    data: banner,
  });
});

exports.deleteBanner = catchAsyncErrors(async (req, res, next) => {
  const banner = await Banner.findByIdAndDelete(req.params.id);

  if (!banner) {
    return next(
      new ErrorHandler(`Banner not found with id: ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    message: "Banner deleted successfully.",
  });
});
