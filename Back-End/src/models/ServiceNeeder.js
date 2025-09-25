const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const serviceNeederSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
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
  phoneNumber: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  resetOTP: {
    code: String,
    expiresAt: Date,
  },
});

// Hash password before saving
// Remove any pre-save middleware for password hashing
// Hash password before saving
serviceNeederSchema.pre("save", async function (next) {
  // Only hash if password is modified
  if (!this.isModified("password")) {
    return next();
  }

  try {
    // Generate salt
    const salt = await bcrypt.genSalt(10);
    // Hash the password
    this.password = await bcrypt.hash(this.password, salt);
    // Log the hash for debugging
    console.log(
      `Password hashed successfully. Hash length: ${this.password.length}`
    );
    next();
  } catch (error) {
    console.error("Error hashing password:", error);
    next(error);
  }
});

//comparePassword method
serviceNeederSchema.methods.comparePassword = async function (
  candidatePassword
) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return false;
  }
};

const ServiceNeeder = mongoose.model("ServiceNeeder", serviceNeederSchema);
module.exports = ServiceNeeder;

