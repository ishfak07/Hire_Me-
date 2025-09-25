const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const adminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    securitySettings: {
      sessionTimeout: {
        type: Number,
        default: 60, // minutes
        min: 15,
        max: 480,
      },
      maxLoginAttempts: {
        type: Number,
        default: 3,
        min: 3,
        max: 10,
      },
      passwordMinLength: {
        type: Number,
        default: 8,
        min: 6,
        max: 32,
      },
      requireSpecialChars: {
        type: Boolean,
        default: true,
      },
      twoFactorAuth: {
        type: Boolean,
        default: false,
      },
    },
  },
  { timestamps: true }
);

// Hash password before saving
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model("Admin", adminSchema);
