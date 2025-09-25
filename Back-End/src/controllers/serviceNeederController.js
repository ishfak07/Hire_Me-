const ServiceNeeder = require("../models/ServiceNeeder");
const ApprovedServiceProvider = require("../models/ApprovedServiceProvider"); // Add this import
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const registerServiceNeeder = async (req, res) => {
  try {
    const { name, email, password, phoneNumber } = req.body;

    // Check if user already exists
    const existingUser = await ServiceNeeder.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Create new service needer - let the pre-save hook handle password hashing
    const serviceNeeder = new ServiceNeeder({
      name,
      email,
      password, // Don't hash here, let the pre-save hook do it
      phoneNumber,
    });

    // Log before saving
    console.log("Saving new user with password length:", password.length);

    await serviceNeeder.save();

    console.log(
      "User saved with hashed password length:",
      serviceNeeder.password.length
    );

    // Generate JWT token
    const token = jwt.sign(
      { id: serviceNeeder._id, email: serviceNeeder.email },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(201).json({
      message: "Registration successful",
      token,
      user: {
        id: serviceNeeder._id,
        name: serviceNeeder.name,
        email: serviceNeeder.email,
        phoneNumber: serviceNeeder.phoneNumber,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
};

const loginServiceNeeder = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login attempt details:", {
      email,
      passwordLength: password.length,
    });

    // Find user by email
    const serviceNeeder = await ServiceNeeder.findOne({ email });
    if (!serviceNeeder) {
      console.log("User not found for email:", email);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    console.log("Found user:", {
      id: serviceNeeder._id,
      storedPasswordHashLength: serviceNeeder.password.length,
    });

    // Use the model's comparePassword method for consistency
    const isPasswordMatch = await serviceNeeder.comparePassword(password);
    console.log("Password comparison result:", isPasswordMatch);

    if (!isPasswordMatch) {
      console.log("Password validation failed");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: serviceNeeder._id, email: serviceNeeder.email },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    console.log("Login successful for user:", serviceNeeder._id);

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: serviceNeeder._id,
        name: serviceNeeder.name,
        email: serviceNeeder.email,
        phoneNumber: serviceNeeder.phoneNumber,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};

const findMatchingProviders = async (req, res) => {
  try {
    const { serviceType, location, date, timeFrom, timeTo } = req.body;

    // Debug log
    console.log("Received booking data:", {
      serviceType,
      location,
      date,
      timeFrom,
      timeTo,
    });

    // Validate required fields
    if (!serviceType || !location || !date || !timeFrom || !timeTo) {
      return res.status(400).json({
        message: "Please provide all required booking details",
      });
    }

    // Convert date string to day of week
    const dayOfWeek = new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
    });
    console.log("Day of week:", dayOfWeek);

    // Find matching providers with simplified query
    const matchedProviders = await ApprovedServiceProvider.find({
      serviceType: serviceType, // Direct match instead of regex
      serviceArea: location, // Direct match instead of regex
      availableDays: dayOfWeek,
    }).select("-password");

    // Debug log
    console.log("Found providers:", matchedProviders.length);

    // Filter providers by time range in memory
    const filteredProviders = matchedProviders.filter((provider) => {
      const providerStart = provider.timeFrom;
      const providerEnd = provider.timeTo;
      return timeFrom >= providerStart && timeTo <= providerEnd;
    });

    console.log("Filtered providers:", filteredProviders.length);

    res.status(200).json({
      success: true,
      providers: filteredProviders,
    });
  } catch (error) {
    console.error("Provider matching error:", error);
    res.status(500).json({
      message: "Server error while finding providers",
      error: error.message,
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    console.log("Reset password attempt with token");

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Token decoded for email:", decoded.email);

    // Find user
    const serviceNeeder = await ServiceNeeder.findOne({ email: decoded.email });
    if (!serviceNeeder) {
      console.log("User not found during reset");
      return res.status(404).json({ message: "User not found" });
    }
    console.log("User found for reset:", serviceNeeder._id);

    // Generate salt and hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log("Password reset details:", {
      originalPassword: password.slice(0, 3) + "...",
      salt: salt,
      hashedLength: hashedPassword.length,
      hashedPassword: hashedPassword,
    });

    // Update password directly in the document
    serviceNeeder.password = hashedPassword;
    await serviceNeeder.save({ validateBeforeSave: false });

    console.log("Password updated successfully");

    // Verify the update with immediate test
    const verificationTest = await bcrypt.compare(password, hashedPassword);
    console.log("Immediate verification test:", {
      originalPassword: password.slice(0, 3) + "...",
      storedHash: hashedPassword,
      verificationResult: verificationTest,
    });

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset password error:", error);
    if (error.name === "JsonWebTokenError") {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }
    res.status(500).json({ message: "Server error during password reset" });
  }
};

const getAllServiceNeeders = async (req, res) => {
  try {
    const serviceNeeders = await ServiceNeeder.find({})
      .select("-password")
      .sort({ createdAt: -1 });
    
    res.status(200).json(serviceNeeders);
  } catch (error) {
    console.error("Error fetching service needers:", error);
    res.status(500).json({ message: "Server error while fetching service needers" });
  }
};

module.exports = {
  registerServiceNeeder,
  loginServiceNeeder,
  findMatchingProviders,
  resetPassword,
  getAllServiceNeeders,
};
