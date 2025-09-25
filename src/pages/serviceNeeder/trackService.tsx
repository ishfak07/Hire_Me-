import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./trackService.css";
import Modal from "react-modal";
Modal.setAppElement("#root");
import {
  FaCalendarCheck,
  FaTools,
  FaMapMarkerAlt,
  FaClock,
  FaUser,
  FaPhone,
  FaArrowLeft,
  FaCheckCircle,
  FaHourglass,
  FaTimesCircle,
  FaSpinner,
} from "react-icons/fa";
import { io } from "socket.io-client";

interface ServiceRequest {
  _id: string; // This should be the MongoDB ObjectId as a string
  serviceNeeder: {
    id: string;
    name: string;
    phoneNumber: string;
  };
  serviceProvider: {
    id: string;
    name: string;
    phoneNumber: string;
  };
  serviceDetails: {
    serviceType: string;
    location: string;
    address: string;
    date: string;
    timeFrom: string;
    timeTo: string;
    totalHours: number;
    feePerHour: number;
    totalFee: number;
  };
  status: string;
  createdAt: string;
  isRejected?: boolean; // Flag to identify rejected services from ServiceRejected collection
}

const TrackService: React.FC = () => {
  const navigate = useNavigate();
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [rejectedServices, setRejectedServices] = useState<ServiceRequest[]>(
    []
  );
  const [connectedServices, setConnectedServices] = useState<ServiceRequest[]>(
    []
  );
  const [activeServices, setActiveServices] = useState<ServiceRequest[]>([]);
  const [completedServices, setCompletedServices] = useState<ServiceRequest[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(
    null
  );
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showNotificationsList, setShowNotificationsList] = useState(false);

  const [activeTab, setActiveTab] = useState("all");
  const [startButtonMessage, setStartButtonMessage] = useState<{
    id: string;
    message: string;
  } | null>(null);
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [generatedOTP, setGeneratedOTP] = useState<string | null>(null);
  const [otpExpiry, setOtpExpiry] = useState<Date | null>(null);
  const [otpServiceId, setOtpServiceId] = useState<string | null>(null);
  const [otpCountdown, setOtpCountdown] = useState<number>(0);
  const [otpGenerating, setOtpGenerating] = useState(false);

  const debugRequestId = (requestId: string) => {
    console.log("Debug requestId:", requestId);
    console.log("Length:", requestId.length);
    console.log("Is ObjectId format:", /^[0-9a-fA-F]{24}$/.test(requestId));
  };

  useEffect(() => {
    const fetchServiceRequests = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const response = await fetch(
          "http://localhost:5000/api/service-requests/my-requests",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch service requests");
        }

        const data = await response.json();
        console.log("Service requests data:", data); // Debug output

        // Log all service IDs for debugging
        console.log(
          "Available service IDs:",
          data.map((service: any) => service._id)
        );

        setServiceRequests(data);

        // Also fetch rejected services
        const rejectedResponse = await fetch(
          "http://localhost:5000/api/service-requests/my-rejected-services",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (rejectedResponse.ok) {
          const rejectedData = await rejectedResponse.json();
          // Add a flag to identify rejected services
          const rejectedWithFlag = rejectedData.map((item: any) => ({
            ...item,
            isRejected: true,
          }));
          console.log("Rejected services:", rejectedWithFlag);
          setRejectedServices(rejectedWithFlag);
        }
      } catch (error) {
        console.error("Error fetching service requests:", error);
        setError(
          error instanceof Error
            ? error.message
            : "An unexpected error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchServiceRequests();
  }, [navigate]);

  // Add a debug function in your component
  const testServiceById = async (serviceId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      console.log("Testing service with ID:", serviceId);
      const response = await fetch(
        `http://localhost:5000/api/service-requests/test-service/${serviceId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      console.log("Test service response:", data);

      if (data.found) {
        console.log("Service found:", data.service);
        return true;
      } else {
        console.log("Service not found");
        return false;
      }
    } catch (error) {
      console.error("Error testing service:", error);
      return false;
    }
  };

  // Add this function to fetch the accepted service ID based on request ID
  const getAcceptedServiceId = async (requestId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;

      // Make a request to get accepted service ID for this request
      const response = await fetch(
        `http://localhost:5000/api/service-requests/accepted-service-id/${requestId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.acceptedServiceId;
    } catch (error) {
      console.error("Error getting accepted service ID:", error);
      return null;
    }
  };

  // Update your handleStartService function
  const handleStartService = async (requestId: string) => {
    try {
      console.log("Starting service with request ID:", requestId);

      // Get the corresponding accepted service ID
      const acceptedServiceId = await getAcceptedServiceId(requestId);

      if (!acceptedServiceId) {
        setError(
          "Cannot start service: No accepted service found for this request"
        );
        return;
      }

      console.log("Found accepted service ID:", acceptedServiceId);

      // Now use the accepted service ID for OTP generation
      handleRequestOTP(acceptedServiceId);
    } catch (error) {
      console.error("Error starting service:", error);
      setError("An error occurred when trying to start the service");
    }
  };

  // Set up socket connection for real-time service start notification
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Get user ID from token
    const tokenParts = token.split(".");
    if (tokenParts.length !== 3) return;

    try {
      const payload = JSON.parse(atob(tokenParts[1]));
      const userId = payload.id;

      const socket = io("http://localhost:5000");

      socket.on("connect", () => {
        console.log("Connected to WebSocket for service start notifications");
      });

      socket.on("serviceStarted", (data) => {
        console.log("Service started notification received:", data);

        // Only show notification if it's for this user
        if (data.serviceNeederId === userId) {
          // Update the service status in the UI
          setServiceRequests((prev) =>
            prev.map((req) =>
              req._id === data.serviceId ? { ...req, status: "ongoing" } : req
            )
          );

          // Show notification
          alert(
            `Your ${data.serviceDetails.serviceType} service with ${data.serviceDetails.providerName} has started successfully!`
          );
        }
      });

      socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
      });

      return () => {
        socket.disconnect();
      };
    } catch (error) {
      console.error("Error setting up socket connection:", error);
    }
  }, []);

  useEffect(() => {
    fetchAllServiceData();
  }, []);

  const fetchAllServiceData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/service-needer/login");
        return;
      }

      // Fetch regular service requests
      const requestsResponse = await fetch(
        "http://localhost:5000/api/service-requests/my-requests",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Fetch rejected services
      const rejectedResponse = await fetch(
        "http://localhost:5000/api/service-requests/my-rejected-services",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Fetch connected services
      const connectedResponse = await fetch(
        "http://localhost:5000/api/service-requests/my-connected-services",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Fetch active services
      const activeResponse = await fetch(
        "http://localhost:5000/api/service-requests/my-active-services",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Fetch completed services
      const completedResponse = await fetch(
        "http://localhost:5000/api/service-requests/my-completed-services",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!requestsResponse.ok) {
        throw new Error("Failed to fetch your service requests");
      }

      // Get the data from each response
      const requestsData = await requestsResponse.json();

      let rejectedData: ServiceRequest[] = [];
      if (rejectedResponse.ok) {
        rejectedData = await rejectedResponse.json();
        // Add a flag to identify rejected services
        rejectedData = rejectedData.map((service) => ({
          ...service,
          isRejected: true,
          status: "rejected", // Make sure status is "rejected" for display purposes
        }));
      }

      let connectedData: ServiceRequest[] = [];
      if (connectedResponse.ok) {
        connectedData = await connectedResponse.json();
        console.log("Connected services retrieved:", connectedData);
      }

      let activeData: ServiceRequest[] = [];
      if (activeResponse.ok) {
        activeData = await activeResponse.json();
        console.log("Active services retrieved:", activeData);
      }

      let completedData: ServiceRequest[] = [];
      if (completedResponse.ok) {
        completedData = await completedResponse.json();
        console.log("Completed services retrieved:", completedData);
      }

      console.log("Service requests retrieved:", requestsData);
      console.log("Rejected services retrieved:", rejectedData);

      setServiceRequests(requestsData);
      setRejectedServices(rejectedData);
      setConnectedServices(connectedData);
      setActiveServices(activeData);
      setCompletedServices(completedData);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
    }
  };

  // Add click outside handler to close notifications
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".notification-wrapper") && showNotificationsList) {
        setShowNotificationsList(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showNotificationsList]);

  useEffect(() => {
    if (!startButtonMessage) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Close if clicking outside of tooltip and button
      if (
        !target.closest(".start-button-message-tooltip") &&
        !target.closest(".header-start-btn")
      ) {
        setStartButtonMessage(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [startButtonMessage]);

  useEffect(() => {
    if (startButtonMessage) {
      document.documentElement.style.setProperty(
        "--show-hover-tooltip",
        "none"
      );
    } else {
      document.documentElement.style.setProperty(
        "--show-hover-tooltip",
        "block"
      );
    }
  }, [startButtonMessage]);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = () => {
    localStorage.removeItem("token");
    setShowLogoutModal(false);
    navigate("/service-needer/login");
  };

  const handleRequestOTP = async (requestId: string) => {
    try {
      setOtpGenerating(true);
      const token = localStorage.getItem("token");
      if (!token) return;

      console.log("Requesting OTP for service:", requestId);

      const response = await fetch(
        `http://localhost:5000/api/service-requests/start-service/${requestId}/generate-otp`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("OTP Response status:", response.status);

      // If response is not ok, get the error text
      if (!response.ok) {
        const errorText = await response.text();
        console.error("OTP Error response:", errorText);
        setError(
          `Failed to generate OTP: ${response.status} ${response.statusText}`
        );
        return;
      }

      const data = await response.json();
      console.log("OTP Response data:", data);

      if (data.success) {
        setGeneratedOTP(data.otp);
        setOtpExpiry(new Date(data.otpExpiry));
        setOtpServiceId(requestId);
        setOtpModalOpen(true);

        // Start countdown timer (10 minutes)
        setOtpCountdown(10 * 60);
      } else {
        setError(data.message || "Failed to generate OTP");
      }
    } catch (error) {
      console.error("Error generating OTP:", error);
      setError("An error occurred when trying to generate OTP");
    } finally {
      setOtpGenerating(false);
    }
  };

  // Add a useEffect to handle the OTP countdown timer
  useEffect(() => {
    if (!otpModalOpen || otpCountdown <= 0) return;

    const timer = setInterval(() => {
      setOtpCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [otpModalOpen, otpCountdown]);

  // Format the countdown time
  const formatCountdown = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const handleViewDetails = (request: ServiceRequest) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "pending":
        return "status-pending";
      case "accepted":
        return "status-accepted";
      case "ongoing":
        return "status-ongoing";
      case "connected":
        return "status-connected";
      case "active":
        return "status-active";
      case "completed":
        return "status-completed";
      case "cancelled":
        return "status-cancelled";
      case "rejected":
        return "status-rejected";
      case "expired":
        return "status-expired";
      default:
        return "";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <FaHourglass className="status-icon pending" />;
      case "accepted":
        return <FaCheckCircle className="status-icon accepted" />;
      case "ongoing":
        return <FaSpinner className="status-icon ongoing" />;
      case "connected":
        return <FaCheckCircle className="status-icon connected" />;
      case "active":
        return <FaTools className="status-icon active" />;
      case "completed":
        return <FaCheckCircle className="status-icon completed" />;
      case "cancelled":
        return <FaTimesCircle className="status-icon cancelled" />;
      case "rejected":
        return <FaTimesCircle className="status-icon rejected" />;
      case "expired":
        return <FaTimesCircle className="status-icon expired" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isServiceExpired = (request: ServiceRequest): boolean => {
    // Skip already completed, cancelled or rejected services
    if (["completed", "cancelled", "rejected"].includes(request.status)) {
      return false;
    }

    const currentDate = new Date();
    const serviceDate = new Date(request.serviceDetails.date);

    // Parse end time (handle formats like "5:00 PM")
    const timeParts = request.serviceDetails.timeTo.split(" ");
    const timeString = timeParts[0];
    const period = timeParts[1] || "";

    let [hours, minutes] = timeString.split(":").map(Number);

    // Convert to 24-hour format if PM
    if (period.toUpperCase() === "PM" && hours < 12) hours += 12;
    if (period.toUpperCase() === "AM" && hours === 12) hours = 0;

    // Set the end time on the service date
    serviceDate.setHours(hours, minutes, 0, 0);

    // Check if the service end time has passed
    return serviceDate < currentDate;
  };

  const canStartService = (
    request: ServiceRequest
  ): { canStart: boolean; message?: string } => {
    // Don't allow starting service that is already ongoing or completed
    if (request.status === "ongoing" || request.status === "completed") {
      return { canStart: false };
    }

    // Only check for accepted services
    if (request.status !== "accepted") {
      return { canStart: false };
    }

    const currentDate = new Date();
    const serviceDate = new Date(request.serviceDetails.date);

    // Parse start time
    const timeParts = request.serviceDetails.timeFrom.split(" ");
    const timeString = timeParts[0];
    const period = timeParts[1] || "";

    let [hours, minutes] = timeString.split(":").map(Number);

    // Convert to 24-hour format if PM
    if (period.toUpperCase() === "PM" && hours < 12) hours += 12;
    if (period.toUpperCase() === "AM" && hours === 12) hours = 0;

    // Set the start time on the service date
    serviceDate.setHours(hours, minutes, 0, 0);

    // Calculate time difference in milliseconds
    const timeDiff = serviceDate.getTime() - currentDate.getTime();

    // Convert to minutes
    const minutesDiff = Math.floor(timeDiff / (1000 * 60));

    // Service can ONLY be started within 30 minutes before the scheduled time
    if (minutesDiff <= 30 && minutesDiff > 0) {
      // Within the 30-minute window before start time
      return { canStart: true };
    } else if (minutesDiff > 30) {
      // More than 30 minutes before start time
      // Calculate the time when service can be started
      const startTime = new Date(serviceDate);
      startTime.setMinutes(startTime.getMinutes() - 30);

      return {
        canStart: false,
        message: `You can start this service after ${startTime.toLocaleTimeString(
          [],
          { hour: "2-digit", minute: "2-digit" }
        )}`,
      };
    } else {
      // After the start time
      return { canStart: false };
    }
  };

  // Combine both regular requests and rejected services
  const allServices = [
    ...serviceRequests,
    ...rejectedServices,
    ...connectedServices,
    ...activeServices,
    ...completedServices,
  ];

  const filteredRequests = allServices.filter((req) => {
    const expired = isServiceExpired(req);

    if (activeTab === "all") return true;
    if (activeTab === "active") {
      // Only show services from ActiveService collection with "active" status
      return req.status === "active" && !expired;
    }
    if (activeTab === "accepted") return req.status === "accepted" && !expired;
    if (activeTab === "connected") return req.status === "connected";
    if (activeTab === "completed") return req.status === "completed";
    if (activeTab === "cancelled")
      return (
        req.status === "cancelled" ||
        req.status === "rejected" ||
        req.isRejected === true ||
        expired
      );
    return true;
  });

  return (
    <div className="track-service-container">
      <nav className="navbar-2">
        <div className="nav-center">
          <h1>HireMe</h1>
        </div>
        <div className="nav-right">
          <button
            className="back-to-book-btn"
            onClick={() => navigate("/book-service")}
          >
            <FaArrowLeft /> Book Service
          </button>
          <button className="logout-btn" onClick={handleLogoutClick}>
            Logout
          </button>
        </div>
      </nav>

      <div className="track-service-content">
        <h1>Track Your Service Requests</h1>

        <div className="service-tabs">
          <button
            className={activeTab === "all" ? "active" : ""}
            onClick={() => setActiveTab("all")}
          >
            All Requests
          </button>
          <button
            className={activeTab === "active" ? "active" : ""}
            onClick={() => setActiveTab("active")}
          >
            Active
          </button>
          <button
            className={activeTab === "accepted" ? "active" : ""}
            onClick={() => setActiveTab("accepted")}
          >
            Accepted
          </button>
          <button
            className={activeTab === "connected" ? "active" : ""}
            onClick={() => setActiveTab("connected")}
          >
            Connected
          </button>
          <button
            className={activeTab === "completed" ? "active" : ""}
            onClick={() => setActiveTab("completed")}
          >
            Completed
          </button>
          <button
            className={activeTab === "cancelled" ? "active" : ""}
            onClick={() => setActiveTab("cancelled")}
          >
            Cancelled
          </button>
        </div>

        {loading ? (
          <div className="loading-spinner">
            <FaSpinner className="spinner" />
            <p>Loading your service requests...</p>
          </div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : filteredRequests.length === 0 ? (
          <div className="no-requests">
            <p>No service requests found in this category.</p>
            <button
              className="book-new-service"
              onClick={() => navigate("/book-service")}
            >
              Book a New Service
            </button>
          </div>
        ) : (
          <div className="service-requests-list">
            {filteredRequests.map((request) => {
              const startServiceInfo = canStartService(request);
              return (
                <div
                  key={request._id}
                  className={`service-request-card ${
                    request.isRejected ? "rejected" : ""
                  }`}
                >
                  <div className="service-header">
                    <h3>{request.serviceDetails.serviceType}</h3>
                    <div className="status-section">
                      <div
                        className={`status-badge ${getStatusClass(
                          request.status
                        )}`}
                      >
                        {getStatusIcon(request.status)} {request.status}
                      </div>

                      {request.status === "accepted" &&
                        startServiceInfo.canStart && (
                          <button
                            className="mini-start-btn"
                            onClick={() => handleStartService(request._id)}
                            disabled={otpGenerating}
                            title="Start Service"
                          >
                            {otpGenerating ? "..." : "Start"}
                          </button>
                        )}

                      {request.status === "accepted" &&
                        !startServiceInfo.canStart &&
                        startServiceInfo.message && (
                          <button
                            className="mini-start-btn disabled"
                            onClick={() =>
                              setStartButtonMessage({
                                id: request._id,
                                message: startServiceInfo.message || "",
                              })
                            }
                            disabled
                            title={startServiceInfo.message}
                          >
                            Start
                            {startButtonMessage?.id === request._id && (
                              <div className="start-button-message-tooltip">
                                {startButtonMessage.message}
                              </div>
                            )}
                          </button>
                        )}
                      {request.status === "ongoing" && (
                        <div className="ongoing-service-indicator">
                          <FaSpinner className="spinner-icon" /> In Progress
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="service-info">
                    <p>
                      <strong>Service Provider:</strong>{" "}
                      {request.serviceProvider.name}
                    </p>
                    <p>
                      <strong>Date:</strong> {request.serviceDetails.date}
                    </p>
                    <p>
                      <strong>Time:</strong> {request.serviceDetails.timeFrom} -{" "}
                      {request.serviceDetails.timeTo}
                    </p>
                    <p>
                      <strong>Status:</strong> {request.status}
                    </p>
                  </div>

                  <div className="service-actions">
                    <button
                      className="view-details-btn"
                      onClick={() => handleViewDetails(request)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedRequest && (
        <Modal
          isOpen={showDetailsModal}
          onRequestClose={() => setShowDetailsModal(false)}
          className="modal-content details-modal"
          overlayClassName="modal-overlay"
        >
          <h2>{selectedRequest.serviceDetails.serviceType} Details</h2>
          <div className="request-full-details">
            <div className="detail-section">
              <h3>Service Information</h3>
              <div className="detail-row">
                <span className="detail-label">Status:</span>
                <span
                  className={`status-badge ${getStatusClass(
                    isServiceExpired(selectedRequest)
                      ? "expired"
                      : selectedRequest.status
                  )}`}
                >
                  {selectedRequest.isRejected
                    ? "Rejected"
                    : isServiceExpired(selectedRequest)
                    ? "Expired"
                    : selectedRequest.status}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Date:</span>
                <span>{formatDate(selectedRequest.serviceDetails.date)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Time:</span>
                <span>
                  {selectedRequest.serviceDetails.timeFrom} -{" "}
                  {selectedRequest.serviceDetails.timeTo}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Duration:</span>
                <span>{selectedRequest.serviceDetails.totalHours} hours</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Total Fee:</span>
                <span>
                  LKR {selectedRequest.serviceDetails.totalFee.toFixed(2)}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Requested on:</span>
                <span>{formatDate(selectedRequest.createdAt)}</span>
              </div>
            </div>

            <div className="detail-section">
              <h3>Location Details</h3>
              <div className="detail-row">
                <span className="detail-label">Location:</span>
                <span>{selectedRequest.serviceDetails.location}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Address:</span>
                <span>{selectedRequest.serviceDetails.address}</span>
              </div>
            </div>

            <div className="detail-section">
              <h3>Service Provider</h3>
              <div className="detail-row">
                <span className="detail-label">
                  <FaUser className="provider-icon" /> Name:
                </span>
                <span>{selectedRequest.serviceProvider.name}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">
                  <FaPhone className="provider-icon" /> Contact:
                </span>
                <span>{selectedRequest.serviceProvider.phoneNumber}</span>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              className="modal-close-button"
              onClick={() => setShowDetailsModal(false)}
            >
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* Logout Modal */}
      {showLogoutModal && (
        <Modal
          isOpen={showLogoutModal}
          onRequestClose={() => setShowLogoutModal(false)}
          className="modal-content"
          overlayClassName="modal-overlay"
        >
          <h2>Confirm Logout</h2>
          <p>Are you sure you want to log out from your account?</p>
          <div className="modal-buttons">
            <button className="confirm-button" onClick={handleLogoutConfirm}>
              Yes, Logout
            </button>
            <button
              className="cancel-button"
              onClick={() => setShowLogoutModal(false)}
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}
      {otpModalOpen && generatedOTP && (
        <Modal
          isOpen={otpModalOpen}
          onRequestClose={() => setOtpModalOpen(false)}
          className="modal-content otp-modal"
          overlayClassName="modal-overlay"
        >
          <h2>Start Service Verification</h2>
          <div className="otp-content">
            <p className="otp-instructions">
              Share this 4-digit code with your service provider to start the
              service:
            </p>
            <div className="otp-display">
              {generatedOTP.split("").map((digit, idx) => (
                <div key={idx} className="otp-digit">
                  {digit}
                </div>
              ))}
            </div>
            <p className="otp-expiry">
              This code expires in: {formatCountdown(otpCountdown)}
            </p>
            <p className="otp-note">
              Note: The service provider must enter this code to start the
              service.
            </p>
          </div>
          <div className="modal-footer">
            <button
              className="modal-close-button"
              onClick={() => setOtpModalOpen(false)}
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TrackService;
