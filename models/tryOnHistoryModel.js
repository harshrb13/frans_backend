
const mongoose = require('mongoose');

const tryOnHistorySchema = new mongoose.Schema({
  // Link to the user who performed the try-on
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Link to the variant that was tried on
  variant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Variant',
    required: true,
  },
  // The URL of the user's own photo, stored in our Cloudinary
  userImageURL: {
    type: String,
    required: true,
  },
  // The URL of the final result image from the VTON API
  resultImageURL: {
    type: String,
    required: true,
  },
}, { timestamps: true }); // Automatically adds createdAt

module.exports = mongoose.model('TryOnHistory', tryOnHistorySchema);