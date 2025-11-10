const express = require("express");
const router = express.Router();
const {
  logoutUser,
  updateMyDetails,
  updateMyPassword,
  adminUpdateUser,
  deleteUser,
  getUserProfile,
  userSignIn,
  userSignUp,
  adminSignIn,
  logoutAdmin,
  verifyOtp,
  getAllUsers,
  forgotPassword,
  verifyPasswordResetOtp,
  resetPassword,
  updateMyPushToken,
} = require("../controllers/userController");
const { isAuthenticatedUser, isAuthorizedRole } = require("../middlewares/auth");

router
  .post("/auth/register", userSignUp)
  .post("/auth/login", userSignIn)
  .post("/auth/verify-otp", verifyOtp)
  .get("/auth/logout", isAuthenticatedUser, logoutUser);

router
  .post("/password/forgot",forgotPassword)
  .post("/password/verify-otp",verifyPasswordResetOtp)
  .patch("/password/reset",resetPassword)

router
  .get("/me", isAuthenticatedUser, getUserProfile)
  .put("/me/update", isAuthenticatedUser, updateMyDetails)
  .put("/me/password", isAuthenticatedUser, updateMyPassword)
  .put("/me/push-token", isAuthenticatedUser, updateMyPushToken)

router
  .post("/admin/auth", adminSignIn)
  .get(
    "/admin/users",
    isAuthenticatedUser,
    isAuthorizedRole("admin"),
    getAllUsers
  )
  .put(
    "/admin/user/:id",
    isAuthenticatedUser,
    isAuthorizedRole("admin"),
    adminUpdateUser
  )
  .delete(
    "/admin/user/:id",
    isAuthenticatedUser,
    isAuthorizedRole("admin"),
    deleteUser
  )
  .get(
    "/admin/logout",
    isAuthenticatedUser,
    isAuthorizedRole("admin"),
    logoutAdmin
  );

module.exports = router;
