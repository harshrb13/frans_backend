const multer = require("multer");

const storage = multer.memoryStorage();

const singleImageUpload = multer({ storage }).single("image");

const productMediaUpload = multer({ storage }).fields([
  { name: "images", maxCount: 4 },
  { name: "video", maxCount: 1 },
]);

module.exports = { singleImageUpload,productMediaUpload};
