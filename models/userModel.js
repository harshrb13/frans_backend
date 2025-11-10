const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      minlength: [4, "Name must be at least 4 characters"],
      maxlength: [30, "Name must be at most 30 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, "Invalid email format"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      validate: {
        validator: (val) =>
          validator.isStrongPassword(val, { minSymbols: 0, minLength: 6 }),
        message: "Password must be strong (uppercase, number, min 6 chars)",
      },
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    pushToken: {
      type: String,
      index: true, // Index for fast lookup
    },
    otpCode: String,
    otpExpire: Date,
    isVerified: { type: Boolean, default: false },
    resetPasswordAllowed: {
      type: Boolean,
      default: false,
    },
    resetPasswordAllowedExpire: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to check password
userSchema.methods.comparePassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

//create json web token while register
userSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

module.exports = mongoose.model("User", userSchema);
