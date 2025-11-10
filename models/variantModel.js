const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  // Link back to the parent Product
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  },
  // Links to the specific option models
  design: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Design',
    required: true,
  },
  fabric: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Fabric',
    required: true,
  },
  color: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Color',
    required: true,
  },
  combinationImage: {
    type: String,
    required: [true, 'A combination image URL is required.'],
  },
  // Changed priceModifier to price
  price: {
    type: Number,
    required: [true, 'The final price for this variant is required.'],
  },
},{timestamps:true});

module.exports = mongoose.model('Variant', variantSchema);