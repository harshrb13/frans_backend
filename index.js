const path = require("path");
const dotenv = require("dotenv");
const envPath = path.resolve(
  __dirname,
  `.env.${process.env.NODE_ENV || "development"}`
);
dotenv.config({ path: envPath });

const { app, server } = require("./app");
const connectDB = require("./config/db");

// First: Handle uncaught exceptions BEFORE anything else
process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception:", err.message);
  process.exit(1); // Force close app
});

const PORT = process.env.PORT || 5000;

// Connect DB and start server
connectDB().then(() => {
  server.listen(PORT,()=>{
    console.log(`Server running on http://localhostL${PORT}`)
  })
  // Handle unhandled promise rejections AFTER server starts
  process.on("unhandledRejection", (err) => {
    console.error("💥 Unhandled Rejection:", err.message);
    server.close(() => process.exit(1)); // Graceful shutdown
  });
});
