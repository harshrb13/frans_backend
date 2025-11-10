const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("./catchAsyncErrors");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

//  Middleware to check if user is logged in
exports.isAuthenticatedUser = catchAsyncErrors(async (req, res, next) => {
  let token;

  // 1. Look for the token in the Authorization header (for mobile app)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  // 2. If not in the header, fall back to checking cookies (for website)
  else if (req.cookies.FsToken || req.cookies.FsAdminToken) {
    token = req.cookies.FsToken || req.cookies.FsAdminToken;
  }

  // 3. If no token is found in either place, send an error
  if (!token) {
    return next(new ErrorHandler("Please login to access this resource", 401));
  }

  // The rest of your logic remains the same
  const decodedData = jwt.verify(token, process.env.JWT_SECRET_KEY);

  req.user = await User.findById(decodedData.id);

  if (!req.user) {
    return next(new ErrorHandler("User no longer exists", 401));
  }

  next();
});

//  Middleware to check if user has authorized role (e.g., admin)
exports.isAuthorizedRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorHandler(
          `Role: ${req.user.role} is not allowed to access this resource`,
          403
        )
      );
    }
    next();
  };
};
