const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');
    // await product.syncIndexes();
    // console.log("✅ Product indexes synced");
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1); // Exit with failure
  }
};

module.exports = connectDB;