const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const {
  createServiceRequest,
  getServiceNeederRequests,
  getServiceProviderRequests,
  updateRequestStatus,
} = require("../controllers/serviceRequestController");
const handleServiceRejection = require("../controllers/serviceRejectionController");
const ServiceRequest = require("../models/ServiceRequest");
const ServiceAccepted = require("../models/ServiceAccepted");
const Notification = require("../models/Notification");
const SNNotification = require("../models/SNNotification");
const authMiddleware = require("../middleware/auth");
const ServiceRejected = require("../models/ServiceRejected");
const ConnectedService = require("../models/ConnectedService");
const {
  generateServiceOTP,
  verifyServiceOTP,
} = require("../controllers/connectedServiceController");
const {
  activateService,
  completeService,
} = require("../controllers/activeServiceController");
const CompletedService = require("../models/CompletedService");
const ActiveService = require("../models/ActiveService");

// Create service request
router.post("/create", authMiddleware, createServiceRequest);

// Get service needer's requests
router.get("/my-requests", authMiddleware, getServiceNeederRequests);

// Get service provider's requests
router.get("/provider-requests", authMiddleware, getServiceProviderRequests);

// Update request status (accept/reject/complete)
router.patch("/:requestId/status", authMiddleware, updateRequestStatus);

// notifications route for filter pending notifications
router.get("/notifications", authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({
      serviceProviderId: req.user.id,
      status: "pending",
    })
      .populate("serviceRequestId")
      .sort({ createdAt: -1 });

    const uiNotifications = notifications.map((notification) => ({
      _id: notification._id,
      message: notification.message,
      createdAt: notification.createdAt,
      read: notification.read,
      serviceRequestId: notification.serviceRequestId?._id,
      serviceProviderId: notification.serviceProviderId,
      serviceNeeder: notification.serviceNeeder,
      serviceDetails: notification.serviceDetails,
      status: notification.status,
    }));

    res.json(uiNotifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Error fetching notifications" });
  }
});

router.post("/reject-service/:serviceId", authMiddleware, async (req, res) => {
  try {
    const { serviceId } = req.params;
    const result = await handleServiceRejection(serviceId);

    // Emit socket event for real-time notification
    const io = req.app.get("io");
    if (io) {
      io.emit("serviceRequestRejected", {
        serviceNeederId: result.rejectedService.serviceNeeder.id,
        notification: result.notification,
      });
    }

    res.status(200).json({
      success: true,
      message: "Service rejected successfully",
      data: result.rejectedService,
    });
  } catch (error) {
    console.error("Error rejecting service:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// get detailed notification information
router.get(
  "/notifications/:notificationId/details",
  authMiddleware,
  async (req, res) => {
    try {
      const notification = await Notification.findById(
        req.params.notificationId
      ).populate("serviceRequestId");

      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }

      console.log("Found notification:", notification);

      const details = {
        serviceNeeder: notification.serviceNeeder,
        serviceDetails: {
          serviceRequestId: notification.serviceRequestId._id.toString(), // Convert ObjectId to string
          serviceType: notification.serviceDetails.serviceType,
          location: notification.serviceDetails.location,
          address: notification.serviceDetails.address,
          date: notification.serviceDetails.date,
          timeFrom: notification.serviceDetails.timeFrom,
          timeTo: notification.serviceDetails.timeTo,
          totalHours: notification.serviceDetails.totalHours,
          feePerHour: notification.serviceDetails.feePerHour,
          totalFee: notification.serviceDetails.totalFee,
        },
      };

      res.json(details);
    } catch (error) {
      console.error("Error fetching notification details:", error);
      res.status(500).json({ message: "Error fetching notification details" });
    }
  }
);

router.patch("/notifications/mark-read", authMiddleware, async (req, res) => {
  try {
    await Notification.updateMany(
      { serviceProviderId: req.user.id },
      { read: true }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Error marking notifications as read" });
  }
});

router.delete(
  "/notifications/:notificationId",
  authMiddleware,
  async (req, res) => {
    try {
      const { notificationId } = req.params;
      const notification = await Notification.findById(notificationId);

      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }

      // Check if the notification belongs to the logged-in provider
      if (notification.serviceProviderId.toString() !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }

      await Notification.findByIdAndDelete(notificationId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Error deleting notification" });
    }
  }
);

router.post("/:requestId/accept", authMiddleware, async (req, res) => {
  try {
    const { requestId } = req.params;
    console.log("Received requestId:", requestId);

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({
        message: "Invalid service request ID format",
        receivedId: requestId,
      });
    }

    // Find the service request
    const serviceRequest = await ServiceRequest.findById(requestId);
    console.log("Found service request:", serviceRequest); // Debug log

    if (!serviceRequest) {
      return res.status(404).json({ message: "Service request not found" });
    }
    // Create accepted service record
    const acceptedService = new ServiceAccepted({
      serviceNeeder: serviceRequest.serviceNeeder,
      serviceProvider: serviceRequest.serviceProvider,
      serviceDetails: serviceRequest.serviceDetails,
      status: "accepted",
      originalRequestId: serviceRequest._id,
    });

    // Create notification for service needer
    const snNotification = new SNNotification({
      serviceNeederId: serviceRequest.serviceNeeder.id,
      serviceRequestId: serviceRequest._id,
      serviceProvider: serviceRequest.serviceProvider,
      message: `Your service request has been accepted by ${serviceRequest.serviceProvider.name}`,
      status: "accepted",
    });

    // Save all changes using Promise.all
    await Promise.all([
      acceptedService.save(),
      snNotification.save(),
      ServiceRequest.findByIdAndUpdate(requestId, { status: "accepted" }),
      Notification.findOneAndUpdate(
        { serviceRequestId: requestId },
        { status: "accepted" }
      ),
    ]);

    // Emit socket event if io is available
    const io = req.app.get("io");
    if (io) {
      io.emit("serviceRequestAccepted", {
        serviceNeederId: serviceRequest.serviceNeeder.id,
        notification: snNotification,
      });
    }

    res.status(200).json({
      message: "Service request accepted successfully",
      acceptedService,
    });
  } catch (error) {
    console.error("Error accepting service request:", error);
    res.status(500).json({
      message: "Error accepting service request",
      error: error.message,
    });
  }
});

router.get("/sn-notifications", authMiddleware, async (req, res) => {
  try {
    const notifications = await SNNotification.find({
      serviceNeederId: req.user.id,
    })
      .populate("serviceRequestId")
      .sort({ createdAt: -1 });

    const uiNotifications = notifications.map((notification) => ({
      _id: notification._id,
      message: notification.message,
      createdAt: notification.createdAt,
      read: notification.read,
      serviceRequestId: notification.serviceRequestId?._id,
      serviceProvider: notification.serviceProvider,
      status: notification.status,
    }));

    res.json(uiNotifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Error fetching notifications" });
  }
});

router.patch(
  "/sn-notifications/mark-read",
  authMiddleware,
  async (req, res) => {
    try {
      await SNNotification.updateMany(
        { serviceNeederId: req.user.id },
        { read: true }
      );
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Error marking notifications as read" });
    }
  }
);

// Get service needer's rejected requests
router.get("/my-rejected-services", authMiddleware, async (req, res) => {
  try {
    const rejectedServices = await ServiceRejected.find({
      "serviceNeeder.id": req.user.id,
    }).sort({ createdAt: -1 });
    res.status(200).json(rejectedServices);
  } catch (error) {
    console.error("Error fetching rejected services:", error);
    res.status(500).json({ message: "Error fetching rejected services" });
  }
});

router.get("/provider-accepted-services", authMiddleware, async (req, res) => {
  try {
    // Find all accepted services where the current provider is the service provider
    const acceptedServices = await ServiceAccepted.find({
      "serviceProvider.id": req.user.id,
    }).sort({ acceptedAt: -1 });

    res.status(200).json(acceptedServices);
  } catch (error) {
    console.error("Error fetching accepted services:", error);
    res.status(500).json({ message: "Error fetching accepted services" });
  }
});

// Route for Service Needer to generate OTP
router.post(
  "/start-service/:serviceId/generate-otp",
  authMiddleware,
  generateServiceOTP
);

// Route for Service Provider to verify OTP
router.post("/start-service/verify-otp", authMiddleware, verifyServiceOTP);

// Route to get connected service status
router.get(
  "/connected-service/:serviceId",
  authMiddleware,
  async (req, res) => {
    try {
      const { serviceId } = req.params;
      const connectedService = await ConnectedService.findOne({
        originalServiceId: serviceId,
      });

      if (!connectedService) {
        return res.status(404).json({ message: "Connected service not found" });
      }

      // Check if request is from either service needer or provider
      const isAuthorized =
        connectedService.serviceNeeder.id.toString() === req.user.id ||
        connectedService.serviceProvider.id.toString() === req.user.id;

      if (!isAuthorized) {
        return res
          .status(403)
          .json({ message: "Not authorized to access this service" });
      }

      res.status(200).json(connectedService);
    } catch (error) {
      res.status(500).json({ message: "Error fetching connected service" });
    }
  }
);

// Add a test route
router.get("/test-service/:serviceId", authMiddleware, async (req, res) => {
  try {
    const { serviceId } = req.params;
    const service = await ServiceAccepted.findById(serviceId);
    if (service) {
      res.status(200).json({ found: true, service });
    } else {
      res.status(404).json({ found: false, message: "Service not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add this route to get accepted service ID from request ID
router.get(
  "/accepted-service-id/:requestId",
  authMiddleware,
  async (req, res) => {
    try {
      const { requestId } = req.params;

      // Find the accepted service that references this request ID
      const acceptedService = await ServiceAccepted.findOne({
        originalRequestId: requestId,
      });

      if (!acceptedService) {
        return res.status(404).json({
          message: "No accepted service found for this request ID",
        });
      }

      res.status(200).json({
        acceptedServiceId: acceptedService._id.toString(),
      });
    } catch (error) {
      console.error("Error getting accepted service ID:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Get service needer's connected services
router.get("/my-connected-services", authMiddleware, async (req, res) => {
  try {
    const connectedServices = await ConnectedService.find({
      "serviceNeeder.id": req.user.id,
      status: "connected",
    }).sort({ connectedAt: -1 });

    // Transform the data to match ServiceRequest format for frontend consistency
    const formattedServices = connectedServices.map((service) => ({
      _id: service._id,
      serviceNeeder: service.serviceNeeder,
      serviceProvider: service.serviceProvider,
      serviceDetails: service.serviceDetails,
      status: service.status,
      createdAt: service.connectedAt,
      originalServiceId: service.originalServiceId,
    }));

    res.status(200).json(formattedServices);
  } catch (error) {
    console.error("Error fetching connected services:", error);
    res.status(500).json({ message: "Error fetching connected services" });
  }
});

// Add this route to the existing router
router.post(
  "/activate-service/:connectedServiceId",
  authMiddleware,
  activateService
);

// Get service needer's active services
router.get("/my-active-services", authMiddleware, async (req, res) => {
  try {
    const activeServices = await ActiveService.find({
      "serviceNeeder.id": req.user.id,
      status: "active",
    }).sort({ startedAt: -1 });

    // Transform the data to match ServiceRequest format for frontend consistency
    const formattedServices = activeServices.map((service) => ({
      _id: service._id,
      serviceNeeder: service.serviceNeeder,
      serviceProvider: service.serviceProvider,
      serviceDetails: service.serviceDetails,
      status: service.status,
      createdAt: service.startedAt,
      originalServiceId: service.originalServiceId,
    }));

    res.status(200).json(formattedServices);
  } catch (error) {
    console.error("Error fetching active services:", error);
    res.status(500).json({ message: "Error fetching active services" });
  }
});

// Get service provider's active services
router.get("/provider-active-services", authMiddleware, async (req, res) => {
  try {
    const activeServices = await ActiveService.find({
      "serviceProvider.id": req.user.id,
      status: "active",
    }).sort({ startedAt: -1 });

    const formattedServices = activeServices.map((service) => ({
      _id: service._id,
      serviceNeeder: service.serviceNeeder,
      serviceProvider: service.serviceProvider,
      serviceDetails: service.serviceDetails,
      status: service.status,
      createdAt: service.startedAt,
      originalServiceId: service.originalServiceId,
    }));

    res.status(200).json(formattedServices);
  } catch (error) {
    console.error("Error fetching active services:", error);
    res.status(500).json({ message: "Error fetching active services" });
  }
});

router.get("/active-connected-services", authMiddleware, async (req, res) => {
  try {
    // This now specifically queries the ActiveService collection
    const activeServices = await ActiveService.find({
      $or: [
        { "serviceNeeder.id": req.user.id },
        { "serviceProvider.id": req.user.id },
      ],
      status: "active",
    }).sort({ startedAt: -1 });

    // Transform the data to match ServiceRequest format for frontend consistency
    const formattedServices = activeServices.map((service) => ({
      _id: service._id,
      serviceNeeder: service.serviceNeeder,
      serviceProvider: service.serviceProvider,
      serviceDetails: service.serviceDetails,
      status: "active", // Always active in this collection
      createdAt: service.startedAt,
      originalServiceId: service.originalServiceId,
    }));

    res.status(200).json(formattedServices);
  } catch (error) {
    console.error("Error fetching active services:", error);
    res.status(500).json({ message: "Error fetching active services" });
  }
});

// Add manual completion route
router.post(
  "/complete-service/:activeServiceId",
  authMiddleware,
  completeService
);

// Get service needer's completed services
router.get("/my-completed-services", authMiddleware, async (req, res) => {
  try {
    const completedServices = await CompletedService.find({
      "serviceNeeder.id": req.user.id,
    }).sort({ completedAt: -1 });

    // Transform the data to match ServiceRequest format for frontend consistency
    const formattedServices = completedServices.map((service) => ({
      _id: service._id,
      serviceNeeder: service.serviceNeeder,
      serviceProvider: service.serviceProvider,
      serviceDetails: service.serviceDetails,
      status: "completed", // Always completed in this collection
      createdAt: service.completedAt,
      originalServiceId: service.originalServiceId,
    }));

    res.status(200).json(formattedServices);
  } catch (error) {
    console.error("Error fetching completed services:", error);
    res.status(500).json({ message: "Error fetching completed services" });
  }
});

// Get service provider's completed services
router.get("/provider-completed-services", authMiddleware, async (req, res) => {
  try {
    const completedServices = await CompletedService.find({
      "serviceProvider.id": req.user.id,
    }).sort({ completedAt: -1 });

    // Transform the data to match ServiceRequest format for frontend consistency
    const formattedServices = completedServices.map((service) => ({
      _id: service._id,
      serviceNeeder: service.serviceNeeder,
      serviceProvider: service.serviceProvider,
      serviceDetails: service.serviceDetails,
      status: "completed", // Always completed in this collection
      createdAt: service.completedAt,
      originalServiceId: service.originalServiceId,
    }));

    res.status(200).json(formattedServices);
  } catch (error) {
    console.error("Error fetching completed services:", error);
    res.status(500).json({ message: "Error fetching completed services" });
  }
});

// Get all approved service providers
router.get("/all-service-providers", authMiddleware, async (req, res) => {
  try {
    const ApprovedServiceProvider = require("../models/ApprovedServiceProvider");

    const providers = await ApprovedServiceProvider.find({})
      .select("-password -resetPasswordOTP -resetPasswordExpires")
      .sort({ approvedAt: -1 });

    res.status(200).json(providers);
  } catch (error) {
    console.error("Error fetching all service providers:", error);
    res.status(500).json({ message: "Error fetching service providers" });
  }
});

// Admin routes for dashboard
router.get("/completed-services", async (req, res) => {
  try {
    const completedServices = await CompletedService.find({}).sort({
      completedAt: -1,
    });

    res.status(200).json(completedServices);
  } catch (error) {
    console.error("Error fetching completed services:", error);
    res.status(500).json({ message: "Error fetching completed services" });
  }
});

router.get("/active-services", async (req, res) => {
  try {
    const activeServices = await ActiveService.find({}).sort({ startedAt: -1 });

    res.status(200).json(activeServices);
  } catch (error) {
    console.error("Error fetching active services:", error);
    res.status(500).json({ message: "Error fetching active services" });
  }
});

router.get("/all", async (req, res) => {
  try {
    const allServiceRequests = await ServiceRequest.find({}).sort({
      createdAt: -1,
    });

    res.status(200).json(allServiceRequests);
  } catch (error) {
    console.error("Error fetching all service requests:", error);
    res.status(500).json({ message: "Error fetching all service requests" });
  }
});

module.exports = router;
