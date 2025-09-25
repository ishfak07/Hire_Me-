import { io } from "socket.io-client";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "react-modal";
Modal.setAppElement("#root");
import "./services.css";

interface ServiceDetails {
  serviceType: string;
  location: string;
  address: string;
  date: string;
  timeFrom: string;
  timeTo: string;
  totalHours: number;
  feePerHour: number;
  totalFee: number;
}

interface ServiceNeeder {
  id: string;
  name: string;
  phoneNumber: string;
}

interface AcceptedService {
  _id: string;
  serviceNeeder: ServiceNeeder;
  serviceDetails: ServiceDetails;
  status: string;
  acceptedAt: string;
}

const ServiceProviderServices: React.FC = () => {
  const navigate = useNavigate();
  const [acceptedServices, setAcceptedServices] = useState<AcceptedService[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    null
  );
  const [otpValue, setOtpValue] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/service-provider/login");
      return;
    }

    const fetchAcceptedServices = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/service-requests/provider-accepted-services",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch accepted services");
        }

        const data = await response.json();
        console.log("Fetched services:", data); // Add this for debugging
        setAcceptedServices(data);
      } catch (error) {
        console.error("Error fetching accepted services:", error);
        setError(error instanceof Error ? error.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchAcceptedServices();
  }, [navigate]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleBackToHome = () => {
    navigate("/service-provider/dashboard"); // Update this to match your home route
  };

  // function to handle OTP verification
  const verifyOTP = async () => {
    if (!selectedServiceId || !otpValue) return;

    try {
      setVerifying(true);
      setOtpError(null);

      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:5000/api/service-requests/start-service/verify-otp",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            serviceId: selectedServiceId,
            otp: otpValue,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Update the UI to show the service has started
        setAcceptedServices(
          acceptedServices.map((service) =>
            service._id === selectedServiceId
              ? { ...service, status: "ongoing" }
              : service
          )
        );
        setOtpModalOpen(false);
        setOtpValue("");
        setNotification("Service started successfully!");
      } else {
        setOtpError(data.message || "Failed to verify OTP");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      setOtpError("Error verifying OTP. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  // Add socket connection to listen for OTP generation events
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

      socket.on("serviceOtpGenerated", (data) => {
        // Check if this event is for current provider
        if (data.serviceProviderId === userId) {
          // Find the service in our list
          const service = acceptedServices.find(
            (s) => s._id === data.serviceId
          );
          if (service) {
            setNotification(
              "A service is ready to be started! Please enter OTP."
            );
          }
        }
      });

      return () => {
        socket.disconnect();
      };
    } catch (error) {
      console.error("Socket connection error:", error);
    }
  }, [acceptedServices]);

  // Check if current time is within 30 minutes of the service start time
  const isWithinStartTimeWindow = (date: string, timeFrom: string): boolean => {
    // Create date object for the service start time
    const [year, month, day] = date.split("-").map(Number);
    const [hours, minutes] = timeFrom.split(":").map(Number);

    const serviceStartTime = new Date();
    serviceStartTime.setFullYear(year, month - 1, day);
    serviceStartTime.setHours(hours, minutes, 0, 0);

    // Get current time
    const currentTime = new Date();

    // Calculate time difference in minutes
    const timeDiff =
      (serviceStartTime.getTime() - currentTime.getTime()) / (1000 * 60);

    // Return true if time difference is between 0 and 30 minutes
    return timeDiff >= -30 && timeDiff <= 30; // Allow 30 minutes before and after
  };

  // Combined function for handling start service click
  const handleStartServiceClick = (service: AcceptedService) => {
    const { date, timeFrom } = service.serviceDetails;

    if (isWithinStartTimeWindow(date, timeFrom)) {
      // Open OTP modal for verification
      setSelectedServiceId(service._id);
      setOtpValue("");
      setOtpError(null);
      setOtpModalOpen(true);
    } else {
      // Get the 30-minute window start time
      const [year, month, day] = service.serviceDetails.date
        .split("-")
        .map(Number);
      const [hours, minutes] = service.serviceDetails.timeFrom
        .split(":")
        .map(Number);

      const serviceStartTime = new Date();
      serviceStartTime.setFullYear(year, month - 1, day);
      serviceStartTime.setHours(hours, minutes, 0, 0);

      const windowStartTime = new Date(
        serviceStartTime.getTime() - 30 * 60 * 1000
      );

      setNotification(
        `You can only start this service between ${windowStartTime.toLocaleTimeString(
          [],
          { hour: "2-digit", minute: "2-digit" }
        )} and ${new Date(
          serviceStartTime.getTime() + 30 * 60 * 1000
        ).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}`
      );

      // Clear notification after 5 seconds
      setTimeout(() => {
        setNotification(null);
      }, 5000);
    }
  };

  if (loading) {
    return (
      <div className="sp-loading-container">
        <div className="sp-loading-spinner"></div>
        <p>Loading your services...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sp-error-container">
        <h3>Error</h3>
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="sp-retry-button"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="sp-services-container">
      {notification && <div className="sp-notification">{notification}</div>}

      <div className="sp-services-header">
        <h1>My Accepted Services</h1>
        <button onClick={handleBackToHome} className="sp-back-button">
          Back to Home
        </button>
      </div>

      {acceptedServices.length === 0 ? (
        <div className="sp-no-services">
          <p>You haven't accepted any services yet.</p>
        </div>
      ) : (
        <div className="sp-services-grid">
          {acceptedServices.map((service) => (
            <div key={service._id} className="sp-service-card">
              <div className="sp-service-header">
                <h3>{service.serviceDetails.serviceType}</h3>
                <div className="sp-service-header-actions">
                  <button
                    className={`sp-start-service-button ${
                      service.status === "accepted" &&
                      isWithinStartTimeWindow(
                        service.serviceDetails.date,
                        service.serviceDetails.timeFrom
                      )
                        ? "active"
                        : "disabled"
                    }`}
                    onClick={() => handleStartServiceClick(service)}
                    disabled={service.status !== "accepted"}
                  >
                    Start Service
                  </button>
                  <span
                    className={`sp-status-badge ${service.status.toLowerCase()}`}
                  >
                    {service.status}
                  </span>
                </div>
              </div>

              <div className="sp-service-info">
                <div className="sp-info-group">
                  <h4>Client Information</h4>
                  <p>
                    <strong>Name:</strong> {service.serviceNeeder.name}
                  </p>
                  <p>
                    <strong>Phone:</strong> {service.serviceNeeder.phoneNumber}
                  </p>
                </div>

                <div className="sp-info-group">
                  <h4>Service Details</h4>
                  <p>
                    <strong>Location:</strong> {service.serviceDetails.location}
                  </p>
                  <p>
                    <strong>Address:</strong> {service.serviceDetails.address}
                  </p>
                  <p>
                    <strong>Date:</strong> {service.serviceDetails.date}
                  </p>
                  <p>
                    <strong>Time:</strong> {service.serviceDetails.timeFrom} -{" "}
                    {service.serviceDetails.timeTo}
                  </p>
                </div>

                <div className="sp-info-group">
                  <h4>Payment Details</h4>
                  <p>
                    <strong>Hours:</strong> {service.serviceDetails.totalHours}
                  </p>
                  <p>
                    <strong>Rate:</strong> LKR{" "}
                    {service.serviceDetails.feePerHour}/hr
                  </p>
                  <p>
                    <strong>Total:</strong> LKR{" "}
                    {service.serviceDetails.totalFee}
                  </p>
                </div>
              </div>

              <div className="sp-service-footer">
                <p>Accepted on: {formatDate(service.acceptedAt)}</p>
                
              </div>
            </div>
          ))}
        </div>
      )}
      {otpModalOpen && (
        <Modal
          isOpen={otpModalOpen}
          onRequestClose={() => {
            if (!verifying) setOtpModalOpen(false);
          }}
          className="modal-content otp-verify-modal"
          overlayClassName="modal-overlay"
        >
          <h2>Enter OTP to Start Service</h2>
          <div className="otp-verify-content">
            <p className="otp-instructions">
              Please ask the service needer for the 4-digit verification code:
            </p>
            <div className="otp-input-container">
              <input
                type="text"
                className="otp-input"
                value={otpValue}
                onChange={(e) => {
                  const value = e.target.value;
                  // Only allow 4 digits
                  if (/^\d{0,4}$/.test(value)) {
                    setOtpValue(value);
                    setOtpError(null);
                  }
                }}
                placeholder="Enter 4-digit code"
                maxLength={4}
              />
            </div>
            {otpError && <p className="otp-error">{otpError}</p>}
            <p className="otp-note">
              This code was provided to the service needer and is valid for 10
              minutes.
            </p>
          </div>
          <div className="modal-footer otp-modal-footer">
            <button
              className="verify-otp-button"
              onClick={verifyOTP}
              disabled={otpValue.length !== 4 || verifying}
            >
              {verifying ? "Verifying..." : "Verify & Start Service"}
            </button>
            <button
              className="cancel-button"
              onClick={() => setOtpModalOpen(false)}
              disabled={verifying}
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ServiceProviderServices;
