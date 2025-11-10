const mongoose = require("mongoose");
// We must import the Product model here
const Product = require("./productModel");

const reviewSchema = new mongoose.Schema(
  {
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, "A review must have a rating."],
    },
    comment: {
      type: String,
      trim: true,
      required: [true, "A review must have a comment."],
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "A review must belong to a product."],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "A review must belong to a user."],
    },
  },
  {
    timestamps: true,
  }
);

// --- PERFORMANCE / LOGIC ---

// Prevent a user from leaving multiple reviews for the same product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

/**
 * @desc    Static method to calculate the average rating of a product
 * @param   {string} productId - The ID of the product to update
 */
reviewSchema.statics.calcAverageRatings = async function (productId) {
  try {
    // 1. 'this' points to the 'Review' model
    const stats = await this.aggregate([
      {
        $match: { product: productId }, // Find all reviews for this product
      },
      {
        $group: {
          _id: "$product",
          ratingsQuantity: { $sum: 1 }, // Count the number of reviews
          ratingsAverage: { $avg: "$rating" }, // Calculate the average rating
        },
      },
    ]);

    if (stats.length > 0) {
      // 2. We found stats. Update the parent Product document.
      await Product.findByIdAndUpdate(productId, {
        ratingsQuantity: stats[0].ratingsQuantity,
        ratingsAverage: stats[0].ratingsAverage,
      });
    } else {
      // 3. No reviews found. Reset the Product to defaults.
      await Product.findByIdAndUpdate(productId, {
        ratingsQuantity: 0,
        ratingsAverage: 4.5, // Or 0, or any default
      });
    }
  } catch (err) {
    console.error("Error calculating average ratings:", err);
  }
};

// --- MIDDLEWARE ---
// We call the 'calcAverageRatings' function *after* a review is saved or deleted

// After a new review is saved (e.g., 'create' or 'save')
reviewSchema.post("save", function () {
  // 'this' points to the current review document
  // 'this.constructor' points to the Model
  this.constructor.calcAverageRatings(this.product);
});

// After a review is deleted (e.g., 'findByIdAndDelete')
// We use a pre-hook for 'findOneAndDelete' to get the document *before* it's deleted
reviewSchema.pre("findOneAndDelete", async function (next) {
  // 'this' points to the query. We execute it to get the doc.
  this.docToUpdate = await this.model.findOne(this.getQuery());
  next();
});

reviewSchema.post("findOneAndDelete", async function () {
  // 'this.docToUpdate' was saved in the pre-hook
  if (this.docToUpdate) {
    await this.docToUpdate.constructor.calcAverageRatings(
      this.docToUpdate.product
    );
  }
});

module.exports = mongoose.model("Review", reviewSchema);
