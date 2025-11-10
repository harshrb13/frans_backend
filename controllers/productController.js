const Product = require('../models/productModel');
const Variant = require('../models/variantModel');
const catchAsyncErrors = require('../middlewares/catchAsyncErrors');
const ErrorHandler = require('../utils/errorHandler');
const { uploadOne, deleteOne } = require('../utils/uploadImages');
const { getPublicId } = require('../utils/helpers');
const APIFeatures = require('../utils/apiFeatures');
const { Design, Fabric, Color } = require('../models/optionModel');
const { mongoose } = require('mongoose');


// --- Create a new Product (and its first default variant) ---
exports.createProduct = catchAsyncErrors(async (req, res, next) => {
  // 1. Check for the variant's image file
  // if (!req.file) {
  //   return next(new ErrorHandler('The default variant image is required.', 400));
  // }

  // 2. Upload the variant's image to Cloudinary
  // const result = await uploadOne(req.file,"variants");
  // const result = {url:"https://image.jpeg"}
  
  // 3. Create the first Variant document
  // The request body will contain both product and variant details
  const defaultVariantData = {
    design: req.body.designId,
    fabric: req.body.fabricId,
    color: req.body.colorId,
    price: req.body.price,
    // combinationImage: result.url,
    combinationImage: req.body.combinationImage,
  };
  
  const newVariant = await Variant.create(defaultVariantData);

  // 4. Create the Product document, linking the new variant
  const productData = {
    productName: req.body.productName,
    description: req.body.description,
    defaultVariant: newVariant._id, // Link to the variant we just created
  };
  const newProduct = await Product.create(productData);

  // 5. Link the variant back to the new product and save
  newVariant.product = newProduct._id;
  await newVariant.save();

  res.status(201).json({
    success: true,
    data: newProduct,
    message: "Product created successfully"
  });
});

// exports.getProductDetails = catchAsyncErrors(async (req, res, next) => {
//   const product = await Product.findById(req.params.id)
//     .populate({
//       path: 'defaultVariant',
//       populate: {
//         path: 'design fabric color',
//         // select: 'designName fabricName colorName colorHex' // Optional: select specific fields
//       }
//     });

//   if (!product) {
//     return next(new ErrorHandler('Product not found', 404));
//   }
  
//   product.viewCount += 1;
//   await product.save({ validateBeforeSave: false });
//   res.status(200).json({
//     success: true,
//     data: product,
//   });
// });

exports.getProductPageData = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new ErrorHandler("Product not found", 404));
  }
  const product = await Product.findById(id).populate({
    path: "defaultVariant",
    populate: {
      path: "design fabric color",
      select: "designName fabricName colorName colorHex designImage fabricSwatchImage",
    },
  });

  if (!product || !product.isActive) {
    return next(new ErrorHandler("Product not found", 404));
  }

  const allVariants = await Variant.find({ product: id }).populate([
    { path: "design" },
    { path: "fabric" },
    { path: "color" },
  ]);


  if (!allVariants || allVariants.length === 0) {
    return next(new ErrorHandler("No variants found for this product", 404));
  }

  const designIds = [...new Set(allVariants.map((v) => v.design._id))];
  const fabricIds = [...new Set(allVariants.map((v) => v.fabric._id))];
  const colorIds = [...new Set(allVariants.map((v) => v.color._id))];

  const [designs, fabrics, colors] = await Promise.all([
    Design.find({ _id: { $in: designIds } }).select("designName designImage"),
    Fabric.find({ _id: { $in: fabricIds } }).select("fabricName fabricSwatchImage"),
    Color.find({ _id: { $in: colorIds } }).select("colorName colorHex"),
  ]);

  // --- Step 5: Return all data in one clean object ---
  res.status(200).json({
    success: true,
    data: {
      product: product,
      allVariants: allVariants, // The full list for filtering
      options: {
        // The master lists of available options
        designs: designs,
        fabrics: fabrics,
        colors: colors,
      },
    },
  });
});

// --- ALSO, UPDATE YOUR getProductById ---
// We need to add the viewCount increment logic
exports.getProductDetails = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.params.id).populate({
    path: "defaultVariant",
    populate: {
      path: "design fabric color",
    },
  });

  if (!product) {
    return next(new ErrorHandler("Product not found", 404));
  }
  
  Product.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } }).exec();

  res.status(200).json({
    success: true,
    data: product,
  });
});


// --- Get All Products ---
exports.getAllProducts = catchAsyncErrors(async (req, res, next) => {
  const resPerPage = 10;

  // --- THIS IS THE NEW LOGIC ---

  // 2. Make a *copy* of the query string to modify it
  const queryFilters = { ...req.query };

  // 3. Check for our nested price filter
  const priceGteKey = 'filter.defaultVariant.price[gte]';
  const priceLteKey = 'filter.defaultVariant.price[lte]';

  if (queryFilters[priceGteKey] || queryFilters[priceLteKey]) {
    // 4. Build the price query for the Variant collection
    const priceQuery = {};
    if (queryFilters[priceGteKey]) {
      priceQuery.$gte = Number(queryFilters[priceGteKey]);
    }
    if (queryFilters[priceLteKey]) {
      priceQuery.$lte = Number(queryFilters[priceLteKey]);
    }

    // 5. STEP 1: Find all variants that match the price
    //    (Note: The field is 'price' in the Variant model, not 'defaultVariant.price')
    const matchingVariants = await Variant.find({ price: priceQuery }).select("_id");

    // 6. STEP 2: Get the list of IDs
    const matchingVariantIds = matchingVariants.map(v => v._id);

    // 7. STEP 3: Modify the queryFilters to use the ID list
    
    // Delete the old, broken price filters
    delete queryFilters[priceGteKey];
    delete queryFilters[priceLteKey];

    // Add the new, correct filter
    // This tells Mongoose: "Find products where the 'defaultVariant' field
    // is one of the IDs in this array."
    queryFilters['filter.defaultVariant'] = { $in: matchingVariantIds };
  }
  // --- END OF NEW LOGIC ---

  // 8. Create the base query (as before)
  const baseQuery = Product.find({ isActive: true });

  // 9. Pass the *modified* queryFilters to APIFeatures
  //    Your filter() method will now correctly parse 'filter.defaultVariant'
  const apiFeatures = new APIFeatures(baseQuery, queryFilters)
    .search()
    .filter()
    .sort();

  // (The rest of your function is 100% correct)
  const totalCount = await apiFeatures.query.clone().countDocuments();
  apiFeatures.paginate(resPerPage);

  const products = await apiFeatures.query.populate({
    path: "defaultVariant",
    populate: {
      path: "design fabric color",
      select: "designName fabricName colorName colorHex",
    },
  });

  res.status(200).json({
    success: true,
    totalCount: totalCount,
    count: products.length,
    resPerPage,
    data: products,
  });
});

exports.getHomepageSections = catchAsyncErrors(async (req, res, next) => {
  const previewLimit = 4; // How many products to show in the home screen preview

  // 1. New Arrivals Query (Automatic: newest products)
  // You can also add 'isNewArrival: true' here if you want manual control
  const newArrivalsQuery = Product.find({ isActive: true })
    .sort({ createdAt: -1 })
    .limit(previewLimit)
    .populate({
      path: "defaultVariant",
      select: "price salePrice combinationImage",
    });

  // 2. Hot Deals Query (Manual: uses the 'isHotDeal' flag)
  const hotDealsQuery = Product.find({ isHotDeal: true, isActive: true })
    .limit(previewLimit)
    .populate({
      path: "defaultVariant",
      select: "price salePrice combinationImage",
    });

  // 3. Trending Query (Automatic: uses 'viewCount')
  const trendingQuery = Product.find({ isActive: true })
    .sort({ viewCount: -1 })
    .limit(previewLimit)
    .populate({
      path: "defaultVariant",
      select: "price salePrice combinationImage",
    });

  // Run all queries in parallel for maximum performance
  const [newArrivals, hotDeals, trending] = await Promise.all([
    newArrivalsQuery,
    hotDealsQuery,
    trendingQuery,
  ]);

  res.status(200).json({
    success: true,
    data: {
      newArrivals,
      hotDeals,
      trending,
    },
  });
});


// --- Update a Product's details ---
exports.updateProduct = catchAsyncErrors(async (req, res, next) => {
  // This only updates product details, not the variant image.
  // Variant details should be updated via the variantController.
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!product) {
    return next(new ErrorHandler('Product not found', 404));
  }

  res.status(200).json({
    success: true,
    data: product,
    message:"Product updated successfully"
  });
});


// --- Delete a Product (and all its associated variants) ---
exports.deleteProduct = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new ErrorHandler('Product not found', 404));
  }

  // 1. Find all variants associated with this product
  const variants = await Variant.find({ product: product._id });

  // 2. Delete all associated images from Cloudinary
  if (variants.length > 0) {
    const imageIds = variants.map(v => getPublicId(v.combinationImage));
    // You might want to create a deleteMany for Cloudinary
    for (const publicId of imageIds) {
      await deleteOne(publicId);
    }
  }

  // 3. Delete all associated variants from the database
  await Variant.deleteMany({ product: product._id });

  // 4. Delete the product itself
  await product.deleteOne();

  res.status(204).json({
    success: true,
    data: null,
    message: "product deleted successfully"
  });
});