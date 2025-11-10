const User = require("../models/userModel");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const sendToken = require("../utils/jwtToken");
const sendOtpMail = require("../utils/sendOtpMail");

const userSignUp = catchAsyncErrors(async (req, res, next) => {
  const { name, email, password } = req.body;

  if (!email || !password)
    return next(new ErrorHandler("Email and password required", 400));

  let userExist = await User.findOne({ email }).select("+password");

  if (userExist) {
    if (!userExist.isVerified) {
      await User.deleteOne({ email });
    } else {
      return next(new ErrorHandler("Email already registered", 400));
    }
  }

  let user = await User.create({ name, email, password });

  // Generate 6‑digit code
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.otpCode = otp;
  user.otpExpire = Date.now() + 10 * 60 * 1000; // 10 min
  await user.save({ validateBeforeSave: false });

  try {
    await sendOtpMail(email, otp);
  } catch (error) {
    console.error("CRITICAL: sendOtpMail failed for user:", email);
    console.error(error);
  }

  res.status(200).json({
    success: true,
    message: "OTP sent to e‑mail",
    email,
  });
});

const verifyOtp = catchAsyncErrors(async (req, res, next) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email });

  if (!user || user.otpCode !== otp || user.otpExpire < Date.now()) {
    return next(new ErrorHandler("Invalid or expired OTP", 400));
  }

  // OTP valid
  user.isVerified = true;
  user.otpCode = undefined;
  user.otpExpire = undefined;
  await user.save({ validateBeforeSave: false });

  // Finally issue JWT
  sendToken(user, 200, res, "FsToken");
});

const userSignIn = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password)
    return next(new ErrorHandler("Email and password required", 400));

  let user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorHandler("Invalid credentials", 401));
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) return next(new ErrorHandler("Invalid credentials", 401));

  // Finally issue JWT
  sendToken(user, 200, res, "FsToken");
});

const forgotPassword = catchAsyncErrors(async (req, res, next) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
        return next(new ErrorHandler('User not found with this email', 404));
    }

    // Generate a 6-digit OTP (reusing your existing logic)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otpCode = otp;
    user.otpExpire = Date.now() + 10 * 60 * 1000; // 10 min expiry

    await user.save({ validateBeforeSave: false });

    try {
        // Use your existing sendOtpMail utility or a new one for SMS
        await sendOtpMail(user.email, otp);

        res.status(200).json({
            success: true,
            message: `OTP sent to ${user.email}`,
        });
    } catch (error) {
        // If email fails, clear the OTP from the DB
        user.otpCode = undefined;
        user.otpExpire = undefined;
        await user.save({ validateBeforeSave: false });
        return next(new ErrorHandler('OTP could not be sent', 500));
    }
});

const verifyPasswordResetOtp = catchAsyncErrors(async (req, res, next) => {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user || user.otpCode !== otp || user.otpExpire < Date.now()) {
        return next(new ErrorHandler("Invalid or expired OTP", 400));
    }

    // OTP is valid. Clear it and grant permission to reset the password for 5 minutes.
    user.otpCode = undefined;
    user.otpExpire = undefined;
    user.resetPasswordAllowed = true;
    user.resetPasswordAllowedExpire = Date.now() + 5 * 60 * 1000; // 5 min window

    await user.save({ validateBeforeSave: false });

    res.status(200).json({
        success: true,
        message: "OTP verified. You can now reset your password.",
    });
});

const resetPassword = catchAsyncErrors(async (req, res, next) => {
    const { email, password, confirmPassword } = req.body;

    const user = await User.findOne({ email });

    // Check if user has permission and is within the time window
    if (!user || !user.resetPasswordAllowed || user.resetPasswordAllowedExpire < Date.now()) {
        return next(new ErrorHandler('Password reset not allowed or session expired.', 400));
    }
    
    if (password !== confirmPassword) {
        return next(new ErrorHandler('Passwords do not match', 400));
    }

    // Set the new password (the pre-save hook will hash it)
    user.password = password;

    // Clear the reset permission fields
    user.resetPasswordAllowed = false;
    user.resetPasswordAllowedExpire = undefined;

    await user.save();

    // Log the user in with their new password
    sendToken(user, 200, res, "FsToken");
});

const getUserProfile = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user._id).select("-password");
  if (!user) return next(new ErrorHandler("User not found", 404));

  res.status(200).json({ success: true, user });
});

// const updateProfile = catchAsyncErrors(async (req, res, next) => {
//   const updates = req.body;
//   const userId = req.user._id;

//   const updatedUser = await User.findByIdAndUpdate(userId, updates, {
//     new: true,
//     runValidators: true,
//   });

//   if (!updatedUser) {
//     return next(new ErrorHandler("User not found", 404));
//   }

//   res.status(200).json({
//     success: true,
//     user: updatedUser,
//   });
// });

const updateMyDetails = catchAsyncErrors(async (req, res, next) => {
  const newDetails = {
    name: req.body.name,
    email: req.body.email,
  };

  Object.keys(newDetails).forEach(
    (key) => newDetails[key] === undefined && delete newDetails[key]
  );

  const updatedUser = await User.findByIdAndUpdate(req.user.id, newDetails, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    user: updatedUser,
  });
});

const updateMyPassword = catchAsyncErrors(async (req, res, next) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  const userId = req.user.id;

  const user = await User.findById(userId).select("+password");

  const isMatch = await user.comparePassword(oldPassword);
  if (!isMatch) {
    return next(new ErrorHandler("Incorrect old password.", 401));
  }

  if (newPassword !== confirmPassword) {
    return next(new ErrorHandler("New passwords do not match.", 400));
  }
  user.password = newPassword;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Password updated successfully.",
  });
});

const logoutUser = catchAsyncErrors(async (req, res, next) => {
  res.cookie("FsToken", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // recommended for production
    sameSite: "Lax", // adjust if using cross-origin frontend
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

// Admin Controllers

const adminSignIn = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  // 1. Check if email and password exist
  if (!email || !password) {
    return next(new ErrorHandler("Email and password required", 400));
  }

  // 2. Find the user in the database
  const user = await User.findOne({ email }).select("+password");

  // 3. Check if user exists and if password is correct
  if (!user || !(await user.comparePassword(password))) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  // 4. CRUCIAL: Check if the user's role is 'admin'
  if (user.role !== "admin") {
    return next(new ErrorHandler("Not authorized: Access denied", 403)); // 403 Forbidden is best for this
  }

  // 5. If all checks pass, issue the JWT
  sendToken(user, 200, res, "FsAdminToken");
});

const adminUpdateUser = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const updates = req.body;

  const updatedUser = await User.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });

  if (!updatedUser) {
    return next(new ErrorHandler("User not found", 404));
  }

  res.status(200).json({
    success: true,
    user: updatedUser,
  });
});

const deleteUser = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;

  const user = await User.findByIdAndDelete(id);

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
});

// GET  /admin/users  – list every user (admin only)
const getAllUsers = catchAsyncErrors(async (req, res, next) => {
  const users = await User.find().select("-password"); // hide hashed pwd
  if (!users) return new ErrorHandler("User's not found", 404);
  res.status(200).json({
    success: true,
    count: users.length,
    users,
  });
});

const logoutAdmin = catchAsyncErrors(async (req, res, next) => {
  res.cookie("FsAdminToken", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // recommended for production
    sameSite: "Lax", // adjust if using cross-origin frontend
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

const updateMyPushToken = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.body;
  const userId = req.user.id;

  // Validate the token (basic check)
  if (token && typeof token !== "string") {
    return next(new ErrorHandler("Invalid push token.", 400));
  }

  // Find the user
  const user = await User.findById(userId);

  if (!user) {
    return next(new ErrorHandler("User not found.", 404));
  }

  user.pushToken = token || undefined;

  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: "Push token updated.",
  });
});

module.exports = {
  userSignUp,
  verifyOtp,
  userSignIn,
  forgotPassword,
  verifyPasswordResetOtp,
  resetPassword,
  updateMyDetails,
  updateMyPassword,
  adminSignIn,
  getUserProfile,
  adminUpdateUser,
  logoutUser,
  deleteUser,
  getAllUsers,
  logoutAdmin,
  updateMyPushToken
};
