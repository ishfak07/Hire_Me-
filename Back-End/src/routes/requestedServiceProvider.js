const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const ApprovedServiceProvider = require("../models/ApprovedServiceProvider");
const { sendOTP } = require("../utils/mailer");
const {
  registerServiceProvider,
  getAllServiceProviders,
  approveServiceProvider,
  getApprovedServiceProviders,
  rejectServiceProvider,
  getRejectedServiceProviders,
  loginServiceProvider,
  getServiceProviderProfile,
  updateServiceProviderProfile,
} = require("../controllers/requestedServiceProvider.js");
const authMiddleware = require("../middleware/auth");

router.post("/register", registerServiceProvider);
router.get("/all", getAllServiceProviders);
router.put("/approve/:providerId", approveServiceProvider);
router.get("/approved", getApprovedServiceProviders);
router.put("/reject/:providerId", rejectServiceProvider);
router.get("/rejected", getRejectedServiceProviders);
router.post("/login", loginServiceProvider);
router.get("/profile", authMiddleware, getServiceProviderProfile);
router.put("/profile/update", authMiddleware, updateServiceProviderProfile);

router.post("/forgot-password", async (req, res) => {
  try {
    console.log("Forgot password request received for:", req.body.email);
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const provider = await ApprovedServiceProvider.findOne({ email });

    if (!provider) {
      console.log("Service provider not found for email:", email);
      return res.status(404).json({ message: "Service provider not found" });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("Generated OTP for", email, ":", otp);

    // Store OTP in provider document with expiry
    provider.resetPasswordOTP = otp;
    provider.resetPasswordExpires = Date.now() + 600000; // 10 minutes
    await provider.save();
    console.log("OTP saved to database for:", email);

    // Send OTP via email
    await sendOTP(email, otp);
    console.log("OTP email sent successfully to:", email);

    res.json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error(
      "Forgot password error for email:",
      req.body?.email || "unknown"
    );
    console.error("Error details:", error);
    res.status(500).json({
      message: "Failed to process request",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const provider = await ApprovedServiceProvider.findOne({
      email,
      resetPasswordOTP: otp,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!provider) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    provider.password = hashedPassword;
    provider.resetPasswordOTP = undefined;
    provider.resetPasswordExpires = undefined;
    await provider.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Failed to reset password" });
  }
});

module.exports = router;
