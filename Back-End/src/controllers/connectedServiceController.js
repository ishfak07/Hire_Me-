const mongoose = require("mongoose");
const ServiceAccepted = require("../models/ServiceAccepted");
const ConnectedService = require("../models/ConnectedService");

// Generate a random 4-digit OTP
const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// Generate OTP for service needer
const generateServiceOTP = async (req, res) => {
  console.log("generateServiceOTP called with params:", req.params);
  console.log("User ID:", req.user.id);
  try {
    const { serviceId } = req.params;

    // Validate serviceId format
    if (!mongoose.Types.ObjectId.isValid(serviceId)) {
      console.log("Invalid serviceId format:", serviceId);
      return res.status(400).json({ message: "Invalid service ID format" });
    }

    // Try to find the accepted service in multiple ways
    console.log("Looking for ServiceAccepted with ID:", serviceId);
    let acceptedService = await ServiceAccepted.findById(serviceId);

    if (!acceptedService) {
      // Try finding by string conversion of ObjectId
      console.log("Service not found directly, trying string conversion");
      acceptedService = await ServiceAccepted.findOne({
        _id: serviceId.toString(),
      });
    }

    if (!acceptedService) {
      // Try finding by the request ID instead
      console.log("Still not found, trying to find by request ID");
      acceptedService = await ServiceAccepted.findOne({
        originalRequestId: serviceId,
      });
    }

    // Log the final result
    console.log("Service found:", !!acceptedService);

    if (!acceptedService) {
      console.log("No service found with ID:", serviceId);
      return res.status(404).json({ message: "Service not found" });
    }

    console.log(
      "Service belongs to user ID:",
      acceptedService.serviceNeeder.id
    );
    console.log("Current user ID:", req.user.id);

    // Check if current user is either the service needer or provider
    const isServiceNeeder =
      acceptedService.serviceNeeder.id.toString() === req.user.id;
    const isServiceProvider =
      acceptedService.serviceProvider.id.toString() === req.user.id;

    if (!isServiceNeeder && !isServiceProvider) {
      return res
        .status(403)
        .json({ message: "Not authorized to access this service" });
    }

    // Only service needer can generate OTP
    if (!isServiceNeeder) {
      return res
        .status(403)
        .json({ message: "Only service needer can generate OTP" });
    }

    // Generate OTP
    const otp = generateOTP();

    // Check if a ConnectedService already exists for this service
    let connectedService = await ConnectedService.findOne({
      originalServiceId: serviceId,
    });

    if (connectedService) {
      // Update existing record with new OTP
      connectedService.otp = otp;
      connectedService.otpGeneratedAt = Date.now();
      connectedService.otpVerifiedAt = null;
      await connectedService.save();
    } else {
      // Create a new ConnectedService record
      connectedService = new ConnectedService({
        serviceNeeder: acceptedService.serviceNeeder,
        serviceProvider: acceptedService.serviceProvider,
        serviceDetails: acceptedService.serviceDetails,
        otp: otp,
        originalServiceId: acceptedService._id,
      });
      await connectedService.save();
    }

    // Emit socket event for real-time notification
    const io = req.app.get("io");
    if (io) {
      io.emit("serviceOtpGenerated", {
        serviceProviderId: acceptedService.serviceProvider.id,
        serviceId: acceptedService._id,
      });
    }

    // Make sure to return a response
    return res.status(200).json({
      success: true,
      message: "OTP generated successfully",
      otp: otp,
      otpExpiry: new Date(Date.now() + 10 * 60 * 1000), // OTP valid for 10 minutes
    });
  } catch (error) {
    console.error("Error generating OTP:", error);
    return res
      .status(500)
      .json({ message: "Error generating OTP", error: error.message });
  }
};

// Verify OTP submitted by service provider
const verifyServiceOTP = async (req, res) => {
  try {
    const { serviceId, otp } = req.body;
    console.log("verifyServiceOTP called with:", { serviceId, otp });
    console.log("User ID:", req.user.id);

    if (!serviceId || !otp) {
      return res
        .status(400)
        .json({ message: "Service ID and OTP are required" });
    }

    // Find connected service by original service ID
    const connectedService = await ConnectedService.findOne({
      originalServiceId: serviceId,
    });

    console.log("Connected service found:", !!connectedService);

    if (!connectedService) {
      return res.status(404).json({ message: "No OTP found for this service" });
    }

    // Log IDs for comparison
    console.log(
      "Connected service provider ID:",
      connectedService.serviceProvider.id
    );
    console.log(
      "Connected service needer ID:",
      connectedService.serviceNeeder.id
    );
    console.log("Current user ID:", req.user.id);

    // Check if user is either the service provider or service needer
    const isServiceProvider =
      connectedService.serviceProvider.id.toString() === req.user.id.toString();
    const isServiceNeeder =
      connectedService.serviceNeeder.id.toString() === req.user.id.toString();

    // Allow either service provider OR service needer to verify
    if (!isServiceProvider && !isServiceNeeder) {
      return res.status(403).json({
        message: "You are not authorized to verify this OTP",
      });
    }

    // Check OTP expiry (10 minutes)
    const otpGeneratedTime = new Date(
      connectedService.otpGeneratedAt
    ).getTime();
    const currentTime = Date.now();
    const otpExpired = currentTime - otpGeneratedTime > 10 * 60 * 1000;

    if (otpExpired) {
      return res
        .status(400)
        .json({ message: "OTP has expired, please request a new one" });
    }

    // Verify OTP
    if (connectedService.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Update ConnectedService record
    connectedService.otpVerifiedAt = Date.now();
    await connectedService.save();

    // Update status in ServiceAccepted collection
    await ServiceAccepted.findByIdAndUpdate(serviceId, { status: "ongoing" });

    // Emit socket event for real-time notification
    const io = req.app.get("io");
    if (io) {
      io.emit("serviceStarted", {
        serviceNeederId: connectedService.serviceNeeder.id,
        serviceProviderId: connectedService.serviceProvider.id,
        serviceId: serviceId,
        message: "Service has started successfully",
        serviceDetails: {
          serviceType: connectedService.serviceDetails.serviceType,
          providerName: connectedService.serviceProvider.name,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: "Service started successfully",
      connectedService,
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ message: "Error verifying OTP" });
  }
};

module.exports = {
  generateServiceOTP,
  verifyServiceOTP,
};
