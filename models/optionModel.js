const mongoose = require('mongoose');

// --- Design Schema ---
const designSchema = new mongoose.Schema({
  designName: { type: String, required: true, unique: true },
  designImage: { type: String, required: true }, // URL from Cloudinary
},{timestamps:true});

// --- Fabric Schema ---
const fabricSchema = new mongoose.Schema({
  fabricName: { type: String, required: true, unique: true },
  fabricSwatchImage: { type: String, required: true }, // URL from Cloudinary
},{timestamps:true});

// --- Color Schema (Updated) ---
const colorSchema = new mongoose.Schema({
  colorName: { type: String, required: true, unique: true },
  colorHex: { type: String, required: true }, // Changed from colorHex
},{timestamps:true});

const Design = mongoose.model('Design', designSchema);
const Fabric = mongoose.model('Fabric', fabricSchema);
const Color = mongoose.model('Color', colorSchema);

module.exports = { Design, Fabric, Color };