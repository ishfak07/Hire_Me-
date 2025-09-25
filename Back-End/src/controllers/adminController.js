const Admin = require("../models/admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const adminController = {
  // Admin Login
  login: async (req, res) => {
    try {
      // Check JWT_SECRET
      if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined");
      }

      const { email, password } = req.body;

      // Validate request body
      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "Email and password are required" });
      }

      // Find admin by email
      const admin = await Admin.findOne({ email });
      if (!admin) {
        console.log(`Login attempt failed: Email ${email} not found`);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, admin.password);
      if (!isValidPassword) {
        console.log(`Login attempt failed: Invalid password for ${email}`);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Generate JWT token
      const token = jwt.sign({ adminId: admin._id }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });

      res.status(200).json({
        token,
        message: "Login successful",
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Server error" });
    }
  },

  // Get Admin Profile
  getProfile: async (req, res) => {
    try {
      const admin = await Admin.findById(req.adminId).select("-password");
      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }

      res.status(200).json({
        email: admin.email,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
        securitySettings: admin.securitySettings || {
          sessionTimeout: 60,
          maxLoginAttempts: 3,
          passwordMinLength: 8,
          requireSpecialChars: true,
          twoFactorAuth: false,
        },
      });
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({ message: "Server error" });
    }
  },

  // Update Admin Profile
  updateProfile: async (req, res) => {
    try {
      const { newEmail, currentPassword, newPassword } = req.body;
      const admin = await Admin.findById(req.adminId);

      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }

      // If updating email
      if (newEmail && newEmail !== admin.email) {
        // Check if email already exists
        const existingAdmin = await Admin.findOne({ email: newEmail });
        if (existingAdmin) {
          return res.status(400).json({ message: "Email already exists" });
        }
        admin.email = newEmail;
      }

      // If updating password
      if (newPassword) {
        if (!currentPassword) {
          return res
            .status(400)
            .json({
              message: "Current password is required to change password",
            });
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(
          currentPassword,
          admin.password
        );
        if (!isValidPassword) {
          return res
            .status(400)
            .json({ message: "Current password is incorrect" });
        }

        admin.password = newPassword; // Will be hashed by pre-save middleware
      }

      await admin.save();

      res.status(200).json({
        message: "Profile updated successfully",
        email: admin.email,
        updatedAt: admin.updatedAt,
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ message: "Server error" });
    }
  },

  // Update Security Settings
  updateSecuritySettings: async (req, res) => {
    try {
      const {
        sessionTimeout,
        maxLoginAttempts,
        passwordMinLength,
        requireSpecialChars,
        twoFactorAuth,
      } = req.body;

      const admin = await Admin.findById(req.adminId);
      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }

      // Initialize securitySettings if it doesn't exist
      if (!admin.securitySettings) {
        admin.securitySettings = {};
      }

      // Update security settings with validation
      if (sessionTimeout !== undefined) {
        if (sessionTimeout < 15 || sessionTimeout > 480) {
          return res
            .status(400)
            .json({
              message: "Session timeout must be between 15 and 480 minutes",
            });
        }
        admin.securitySettings.sessionTimeout = sessionTimeout;
      }

      if (maxLoginAttempts !== undefined) {
        if (maxLoginAttempts < 3 || maxLoginAttempts > 10) {
          return res
            .status(400)
            .json({ message: "Max login attempts must be between 3 and 10" });
        }
        admin.securitySettings.maxLoginAttempts = maxLoginAttempts;
      }

      if (passwordMinLength !== undefined) {
        if (passwordMinLength < 6 || passwordMinLength > 32) {
          return res
            .status(400)
            .json({
              message: "Password minimum length must be between 6 and 32",
            });
        }
        admin.securitySettings.passwordMinLength = passwordMinLength;
      }

      if (requireSpecialChars !== undefined) {
        admin.securitySettings.requireSpecialChars = requireSpecialChars;
      }

      if (twoFactorAuth !== undefined) {
        admin.securitySettings.twoFactorAuth = twoFactorAuth;
      }

      await admin.save();

      res.status(200).json({
        message: "Security settings updated successfully",
        securitySettings: admin.securitySettings,
      });
    } catch (error) {
      console.error("Update security settings error:", error);
      res.status(500).json({ message: "Server error" });
    }
  },
};

module.exports = adminController;
