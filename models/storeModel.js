const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A store must have a name."],
      trim: true,
      unique: true,
    },
    address: {
      type: String,
      required: [true, "A store must have an address."],
    },
    phone: {
      type: String,
      required: [true, "A store must have a phone number."],
    },
    openingHours: {
      type: String,
      default: "11:00 AM - 8:00 PM, Mon-Sat",
    },
    imageUrl: {
      type: String,
      required: [true, "A store must have an image URL."],
    },
    latitude: {
      type: Number,
      required: [true, "A store must have a latitude."],
    },
    longitude: {
      type: Number,
      required: [true, "A store must have a longitude."],
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

module.exports = mongoose.model("Store", storeSchema);
