const RequestedServiceProvider = require("../models/RequestedServiceProvider.js");
const ApprovedServiceProvider = require("../models/ApprovedServiceProvider.js");
const bcrypt = require("bcryptjs");
const RejectedServiceProvider = require("../models/RejectedServiceProvider.js");
const jwt = require("jsonwebtoken");

const registerServiceProvider = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      serviceType,
      phoneNumber,
      serviceArea,
      availableDays,
      timeFrom,
      timeTo,
      experience,
      serviceFee,
    } = req.body;

    // Check if email already exists
    const existingProvider = await RequestedServiceProvider.findOne({ email });
    if (existingProvider) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Validate service types
    if (
      !serviceType ||
      !Array.isArray(serviceType) ||
      serviceType.length === 0
    ) {
      return res
        .status(400)
        .json({ message: "Please select at least one service type" });
    }

    // Validate service fee
    if (!serviceFee || serviceFee <= 0) {
      return res
        .status(400)
        .json({ message: "Please enter a valid service fee" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new service provider
    const newServiceProvider = new RequestedServiceProvider({
      fullName,
      email,
      password: hashedPassword,
      serviceType,
      phoneNumber,
      serviceArea,
      availableDays,
      timeFrom,
      timeTo,
      experience,
      serviceFee,
    });

    // Save to database
    await newServiceProvider.save();

    res
      .status(201)
      .json({ message: "Registration request submitted successfully" });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
};

const getAllServiceProviders = async (req, res) => {
  try {
    const serviceProviders = await RequestedServiceProvider.find({})
      .select("-password") // Exclude password from the response
      .sort({ createdAt: -1 }); // Sort by newest first

    res.status(200).json(serviceProviders);
  } catch (error) {
    console.error("Error fetching service providers:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching service providers" });
  }
};

const approveServiceProvider = async (req, res) => {
  try {
    const { providerId } = req.params;

    // Find the requested service provider
    const provider = await RequestedServiceProvider.findById(providerId);
    if (!provider) {
      return res.status(404).json({ message: "Service provider not found" });
    }

    // Create new approved service provider
    const approvedProvider = new ApprovedServiceProvider({
      fullName: provider.fullName,
      email: provider.email,
      password: provider.password,
      serviceType: provider.serviceType,
      phoneNumber: provider.phoneNumber,
      serviceArea: provider.serviceArea,
      availableDays: provider.availableDays,
      timeFrom: provider.timeFrom,
      timeTo: provider.timeTo,
      experience: provider.experience,
      serviceFee: provider.serviceFee, // Add this line
    });

    // Save to approved collection
    await approvedProvider.save();

    // Remove from requested collection
    await RequestedServiceProvider.findByIdAndDelete(providerId);

    res.status(200).json({ message: "Service provider approved successfully" });
  } catch (error) {
    console.error("Error approving service provider:", error);
    res.status(500).json({ message: "Server error while approving provider" });
  }
};

const getApprovedServiceProviders = async (req, res) => {
  try {
    const approvedProviders = await ApprovedServiceProvider.find({})
      .select("-password")
      .sort({ approvedAt: -1 });

    res.status(200).json(approvedProviders);
  } catch (error) {
    console.error("Error fetching approved providers:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching approved providers" });
  }
};

const rejectServiceProvider = async (req, res) => {
  try {
    const { providerId } = req.params;

    // Find the requested service provider
    const provider = await RequestedServiceProvider.findById(providerId);
    if (!provider) {
      return res.status(404).json({ message: "Service provider not found" });
    }

    // Create new rejected service provider
    const rejectedProvider = new RejectedServiceProvider({
      fullName: provider.fullName,
      email: provider.email,
      serviceType: provider.serviceType,
      phoneNumber: provider.phoneNumber,
      serviceArea: provider.serviceArea,
      availableDays: provider.availableDays,
      timeFrom: provider.timeFrom,
      timeTo: provider.timeTo,
      experience: provider.experience,
      serviceFee: provider.serviceFee, // Add this line
    });

    // Save to rejected collection
    await rejectedProvider.save();

    // Remove from requested collection
    await RequestedServiceProvider.findByIdAndDelete(providerId);

    res.status(200).json({ message: "Service provider rejected successfully" });
  } catch (error) {
    console.error("Error rejecting service provider:", error);
    res.status(500).json({ message: "Server error while rejecting provider" });
  }
};

const getRejectedServiceProviders = async (req, res) => {
  try {
    const rejectedProviders = await RejectedServiceProvider.find({}).sort({
      rejectedAt: -1,
    });

    res.status(200).json(rejectedProviders);
  } catch (error) {
    console.error("Error fetching rejected providers:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching rejected providers" });
  }
};

const loginServiceProvider = async (req, res) => {
  try {
    const { email, password } = req.body;

    // First check if the provider exists in the rejected collection
    const rejectedProvider = await RejectedServiceProvider.findOne({ email });
    if (rejectedProvider) {
      return res.status(403).json({
        message:
          "Your application was rejected. Please register again with appropriate information.",
        status: "rejected",
      });
    }

    // Then check if the provider exists in the requested collection
    const requestedProvider = await RequestedServiceProvider.findOne({ email });
    if (requestedProvider) {
      return res.status(403).json({
        message:
          "Your profile is pending approval from admin. Please wait for approval.",
        status: "pending",
      });
    }

    // Finally check in the approved collection
    const approvedProvider = await ApprovedServiceProvider.findOne({ email });
    if (!approvedProvider) {
      return res.status(401).json({
        message: "Invalid credentials or account not found",
        status: "not_found",
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(
      password,
      approvedProvider.password
    );
    if (!isValidPassword) {
      return res.status(401).json({
        message: "Invalid credentials",
        status: "invalid",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: approvedProvider._id,
        email: approvedProvider.email,
        fullName: approvedProvider.fullName,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Send response
    res.status(200).json({
      status: "approved",
      token,
      serviceProvider: {
        id: approvedProvider._id,
        fullName: approvedProvider.fullName,
        email: approvedProvider.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Server error during login",
      status: "error",
    });
  }
};

const getServiceProviderProfile = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const provider = await ApprovedServiceProvider.findOne({ _id: decoded.id });
    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }

    res.status(200).json({
      fullName: provider.fullName,
      email: provider.email,
      serviceType: provider.serviceType,
      phoneNumber: provider.phoneNumber,
      serviceArea: provider.serviceArea,
      availableDays: provider.availableDays,
      timeFrom: provider.timeFrom,
      timeTo: provider.timeTo,
      experience: provider.experience,
      approvedAt: provider.approvedAt,
      serviceFee: provider.serviceFee, // Add this line
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(401).json({ message: "Authentication failed" });
  }
};
const updateServiceProviderProfile = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const updatedProvider = await ApprovedServiceProvider.findByIdAndUpdate(
      decoded.id,
      req.body,
      { new: true }
    );

    if (!updatedProvider) {
      return res.status(404).json({ message: "Provider not found" });
    }

    res.status(200).json(updatedProvider);
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
};

module.exports = {
  registerServiceProvider,
  getAllServiceProviders,
  approveServiceProvider,
  getApprovedServiceProviders,
  rejectServiceProvider,
  getRejectedServiceProviders,
  loginServiceProvider,
  getServiceProviderProfile,
  updateServiceProviderProfile,
};
