const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
    //   required: [true, "A banner must have a title (for admin/alt-text)."],
      trim: true,
    },
    subtitle: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
      required: [true, "A banner must have an image URL."],
    },
    link: {
      type: String,
      required: [true, "A banner must have a link/route."],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true, // Speeds up queries for 'isActive: true'
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Banner", bannerSchema);