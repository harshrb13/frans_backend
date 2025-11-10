const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: [true, "Product name is required."],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      required: [true, "Description is required."],
    },
    // This links to the Variant model for the default display
    defaultVariant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Variant",
    },
    // Average rating for the product
    ratingsAverage: {
      type: Number,
      default: 4.5, // Set a nice default for new products
      min: 1,
      max: 5,
      // Round to one decimal place
      set: (val) => Math.round(val * 10) / 10,
    },

    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isNewArrival: {
      type: Boolean,
      default: false,
    },
    isHotDeal: {
      type: Boolean,
      default: false,
    },
    isTrending: {
      type: Boolean,
      default: false,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
