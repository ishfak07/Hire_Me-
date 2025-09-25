import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "react-modal";
import "./homePage.css";
import io from "socket.io-client";

Modal.setAppElement("#root");

interface ServiceProvider {
  _id: string;
  fullName: string;
  email: string;
  serviceType: string[];
  phoneNumber: string;
  serviceArea: string;
  availableDays: string[];
  timeFrom: string;
  timeTo: string;
  experience: string;
  approvedAt: string;
  serviceFee: number;
}

interface EditableData extends ServiceProvider {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

interface Notification {
  _id: string;
  message: string;
  createdAt: string;
  read: boolean;
  serviceRequestId: string;
  serviceProviderId: string;
  status?: string;
}

interface NotificationDetails {
  serviceNeeder: {
    name: string;
    phoneNumber: string;
  };
  serviceDetails: {
    serviceRequestId: string;
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
}

const ServiceProviderHomePage: React.FC = () => {
  const navigate = useNavigate();
  const [provider, setProvider] = useState<ServiceProvider | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editableData, setEditableData] = useState<EditableData | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedNotification, setSelectedNotification] =
    useState<NotificationDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const availableServices = [
    "Electrician Services",
    "Plumbing Services",
    "Carpentry Services",
    "Vehicle Breakdown Assistance",
    "Home Appliance Repair",
    "House Cleaning Services",
    "Painting Services",
    "Gardening & Landscaping",
    "Roof Repair & Waterproofing",
  ];

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const handleViewNotification = async (notificationId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/service-requests/notifications/${notificationId}/details`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Received notification details:", data); // Debug log

        // Validate the data structure
        if (!data.serviceDetails || !data.serviceDetails.serviceRequestId) {
          console.error("Invalid notification details structure:", data);
          throw new Error("Invalid notification details received");
        }

        setSelectedNotification(data);
        setIsModalOpen(true);
        setShowNotifications(false);
      } else {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to fetch notification details"
        );
      }
    } catch (error) {
      console.error("Error fetching notification details:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to fetch notification details"
      );
    }
  };

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log("Fetching notifications...");

      const response = await fetch(
        "http://localhost:5000/api/service-requests/notifications",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Notifications received:", data);
        // Filter out notifications with status 'accepted'
        const pendingNotifications = data.filter(
          (notification: Notification & { status?: string }) =>
            notification.status !== "accepted"
        );
        setNotifications(pendingNotifications);
        setNotificationCount(
          pendingNotifications.filter((n: Notification) => !n.read).length
        );
      } else {
        console.error("Error response:", await response.text());
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:5000/api/service-requests/notifications/mark-read",
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setNotifications(
          notifications.map((notif) => ({ ...notif, read: true }))
        );
        setNotificationCount(0);
      }
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  const handleRejectNotification = async (notificationId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to reject this notification?"
    );

    if (!confirmed) return;

    try {
      const token = localStorage.getItem("token");
      const serviceRequestId = notifications.find(
        (n) => n._id === notificationId
      )?.serviceRequestId;

      if (!serviceRequestId) {
        throw new Error("Service request ID not found");
      }

      const response = await fetch(
        `http://localhost:5000/api/service-requests/reject-service/${serviceRequestId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        // Remove the notification from state
        setNotifications((prev) =>
          prev.filter((n) => n._id !== notificationId)
        );
        // Update notification count if needed
        const wasUnread =
          notifications.find((n) => n._id === notificationId)?.read === false;
        if (wasUnread) {
          setNotificationCount((prev) => Math.max(0, prev - 1));
        }
        alert("Service request rejected successfully");
      } else {
        throw new Error("Failed to reject service request");
      }
    } catch (error) {
      console.error("Error rejecting service:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to reject service request"
      );
    }
  };

  const handleAcceptRequest = async (serviceRequestId: string) => {
    try {
      console.log("Attempting to accept request with ID:", serviceRequestId); // Debug log

      if (!serviceRequestId) {
        throw new Error("Service request ID is required");
      }

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await fetch(
        `http://localhost:5000/api/service-requests/${serviceRequestId}/accept`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to accept service request");
      }

      // Remove the accepted notification from the list
      setNotifications((prev) =>
        prev.filter((n) => n.serviceRequestId !== serviceRequestId)
      );
      setNotificationCount((prev) => Math.max(0, prev - 1));

      console.log("Accept request successful:", data);
      alert("Service request accepted successfully!");
      setIsModalOpen(false);
      fetchNotifications();
    } catch (error) {
      console.error("Error accepting request:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to accept service request"
      );
    }
  };

  useEffect(() => {
    if (!provider?._id) return;

    const socket = io("http://localhost:5000");
    const providerId = provider._id;

    console.log("Provider ID for socket:", providerId); // Add this log

    socket.on("connect", () => {
      console.log("Connected to WebSocket");
    });

    socket.on("newNotification", (notification: Notification) => {
      console.log("New notification received:", notification);
      console.log("Current provider ID:", providerId);

      if (
        notification.serviceProviderId === providerId &&
        notification.status !== "accepted"
      ) {
        setNotifications((prev) => [notification, ...prev]);
        setNotificationCount((prev) => prev + 1);
      }
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    return () => {
      socket.disconnect();
    };
  }, [provider?._id]);
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Fetch every 30 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/service-provider/login");
      return;
    }

    const fetchProviderData = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/service-providers/profile",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log("Provider data:", data); // Add this log
          setProvider(data);
        } else {
          throw new Error("Failed to fetch provider data");
        }
      } catch (error) {
        console.error("Error:", error);
        navigate("/service-provider/login");
      } finally {
        setLoading(false);
      }
    };

    fetchProviderData();
  }, [navigate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showNotifications &&
        !(event.target as Element).closest(".spsp-notification-wrapper")
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showNotifications]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/service-provider/login");
  };

  const handleEdit = () => {
    setEditableData(provider);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditableData(null);
    setIsEditing(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setEditableData((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        [name]: type === "number" ? Number(value) : value,
      };
    });
  };

  const handleArrayChange = (name: string, value: string[]) => {
    setEditableData((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  const handleSave = async () => {
    if (!editableData) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:5000/api/service-providers/profile/update",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editableData),
        }
      );

      if (response.ok) {
        setProvider(editableData);
        setIsEditing(false);
        setEditableData(null);
        alert("Profile updated successfully!");
      } else {
        throw new Error("Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile");
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  return (
    <div className="spsp-home-container">
      <nav className="spsp-navbar">
        <h1 className="spsp-logo">HireMe</h1>
        <div className="spsp-nav-buttons">
          <div className="spsp-notification-wrapper">
            <div
              className="spsp-notification-icon-1"
              onClick={toggleNotifications}
            >
              <i className="fas fa-bell"></i>
              {notificationCount > 0 && (
                <span className="spsp-notification-badge">
                  {notificationCount}
                </span>
              )}
            </div>
            {showNotifications && (
              <div className="spsp-notification-popup">
                <div className="spsp-notification-header">
                  <span>Notifications</span>
                  {notifications.some((n) => !n.read) && (
                    <button
                      className="spsp-mark-all-read"
                      onClick={markAllAsRead}
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                {notifications.length > 0 ? (
                  <ul className="spsp-notification-list">
                    {notifications.map((notification) => (
                      <li
                        key={notification._id}
                        className={`spsp-notification-item ${
                          !notification.read ? "unread" : ""
                        }`}
                      >
                        <div className="spsp-notification-content">
                          {notification.message}
                        </div>
                        <div className="spsp-notification-footer">
                          <div className="spsp-notification-time">
                            {new Date(notification.createdAt).toLocaleString()}
                          </div>
                          <div className="spsp-notification-actions">
                            <button
                              className="spsp-view-notification-button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewNotification(notification._id);
                              }}
                            >
                              View
                            </button>
                            <button
                              className="spsp-reject-notification-button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRejectNotification(notification._id);
                              }}
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="spsp-no-notifications">No notifications</div>
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => navigate("/service-provider/services")}
            className="spsp-service-button"
          >
            Services
          </button>
          {!isEditing && (
            <button onClick={handleEdit} className="spsp-edit-button">
              Edit Profile
            </button>
          )}
          <button onClick={handleLogout} className="spsp-logout-button">
            Logout
          </button>
        </div>
      </nav>

      <div className="spsp-content">
        <div className="spsp-welcome-section">
          <h1>Welcome, {provider?.fullName}</h1>
          <p>Manage your service provider account</p>
        </div>

        <div className="spsp-info-cards">
          <div className="spsp-card">
            <h3>Profile Information</h3>
            {isEditing ? (
              <div className="spsp-edit-form">
                <div className="spsp-form-group-2">
                  <label>Name:</label>
                  <input
                    type="text"
                    name="fullName"
                    value={editableData?.fullName || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="spsp-form-group-2">
                  <label>Phone:</label>
                  <input
                    type="text"
                    name="phoneNumber"
                    value={editableData?.phoneNumber || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="spsp-form-group-2">
                  <label>Service Area:</label>
                  <input
                    type="text"
                    name="serviceArea"
                    value={editableData?.serviceArea || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="spsp-form-group-2">
                  <label>Experience:</label>
                  <input
                    type="text"
                    name="experience"
                    value={editableData?.experience || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="spsp-form-group-2">
                  <label>Service Fee per Hour (LKR):</label>
                  <input
                    type="number"
                    name="serviceFee"
                    value={editableData?.serviceFee || ""}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            ) : (
              <>
                <p>
                  <strong>Name:</strong> {provider?.fullName}
                </p>
                <p>
                  <strong>Email:</strong> {provider?.email}
                </p>
                <p>
                  <strong>Phone:</strong> {provider?.phoneNumber}
                </p>
                <p>
                  <strong>Service Area:</strong> {provider?.serviceArea}
                </p>
                <p>
                  <strong>Experience:</strong> {provider?.experience}
                </p>
                <p>
                  <strong>Approved Date:</strong>{" "}
                  {provider?.approvedAt &&
                    new Date(provider.approvedAt).toLocaleDateString()}
                </p>
                <p>
                  <strong>Service Fee:</strong> LKR {provider?.serviceFee}/hr
                </p>
              </>
            )}
          </div>

          <div className="spsp-card">
            <h3>Services</h3>
            {isEditing ? (
              <div className="spsp-form-group-2">
                <label>Select Services:</label>
                <div className="spsp-checkbox-group">
                  {availableServices.map((service) => (
                    <div key={service} className="spsp-checkbox-item">
                      <input
                        type="checkbox"
                        id={`service-${service}`}
                        checked={
                          editableData?.serviceType?.includes(service) || false
                        }
                        onChange={(e) => {
                          const currentServices = [
                            ...(editableData?.serviceType || []),
                          ];
                          const updatedServices = e.target.checked
                            ? [...currentServices, service]
                            : currentServices.filter((s) => s !== service);
                          handleArrayChange("serviceType", updatedServices);
                        }}
                      />
                      <label htmlFor={`service-${service}`}>{service}</label>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="spsp-services-list">
                {provider?.serviceType.map((service, index) => (
                  <span key={index} className="spsp-service-tag">
                    {service}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="spsp-card">
            <h3>Availability</h3>
            {isEditing ? (
              <>
                <div className="spsp-form-group-2">
                  <label>Available Days:</label>
                  <div className="spsp-checkbox-group">
                    {daysOfWeek.map((day) => (
                      <div key={day} className="spsp-checkbox-item">
                        <input
                          type="checkbox"
                          id={`day-${day}`}
                          checked={editableData?.availableDays.includes(day)}
                          onChange={(e) => {
                            const currentDays =
                              editableData?.availableDays || [];
                            const updatedDays = e.target.checked
                              ? [...currentDays, day]
                              : currentDays.filter((d) => d !== day);
                            handleArrayChange("availableDays", updatedDays);
                          }}
                        />
                        <label htmlFor={`day-${day}`}>{day}</label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="spsp-form-group-2">
                  <label>Time From:</label>
                  <input
                    type="time"
                    name="timeFrom"
                    value={editableData?.timeFrom || ""}
                    onChange={handleChange}
                  />
                </div>
                <div className="spsp-form-group-2">
                  <label>Time To:</label>
                  <input
                    type="time"
                    name="timeTo"
                    value={editableData?.timeTo || ""}
                    onChange={handleChange}
                  />
                </div>
              </>
            ) : (
              <>
                <p>
                  <strong>Available Days:</strong>
                </p>
                <div className="spsp-services-list">
                  {provider?.availableDays.map((day, index) => (
                    <span key={index} className="spsp-service-tag">
                      {day}
                    </span>
                  ))}
                </div>
                <p>
                  <strong>Working Hours:</strong> {provider?.timeFrom} -{" "}
                  {provider?.timeTo}
                </p>
              </>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="spsp-edit-buttons">
            <button onClick={handleSave} className="spsp-save-button">
              Save Changes
            </button>
            <button onClick={handleCancel} className="spsp-cancel-button">
              Cancel
            </button>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        className="spsp-notification-modal"
        overlayClassName="spsp-notification-modal-overlay"
      >
        {selectedNotification && (
          <div className="spsp-notification-details">
            <h2>Service Request Details</h2>
            <div className="spsp-detail-group">
              <h3>Service Needer Information</h3>
              <p>
                <strong>Name:</strong> {selectedNotification.serviceNeeder.name}
              </p>
              <p>
                <strong>Phone Number:</strong>{" "}
                {selectedNotification.serviceNeeder.phoneNumber}
              </p>
            </div>
            <div className="spsp-detail-group">
              <h3>Service Details</h3>
              <p>
                <strong>Service Type:</strong>{" "}
                {selectedNotification.serviceDetails.serviceType}
              </p>
              <p>
                <strong>Location:</strong>{" "}
                {selectedNotification.serviceDetails.location}
              </p>
              <p>
                <strong>Address:</strong>{" "}
                {selectedNotification.serviceDetails.address}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {selectedNotification.serviceDetails.date}
              </p>
              <p>
                <strong>Time:</strong>{" "}
                {selectedNotification.serviceDetails.timeFrom} -{" "}
                {selectedNotification.serviceDetails.timeTo}
              </p>
            </div>
            <div className="spsp-detail-group">
              <h3>Cost Details</h3>
              <p>
                <strong>Total Hours:</strong>{" "}
                {selectedNotification.serviceDetails.totalHours}
              </p>
              <p>
                <strong>Fee per Hour:</strong> LKR{" "}
                {selectedNotification.serviceDetails.feePerHour}
              </p>
              <p>
                <strong>Total Fee:</strong> LKR{" "}
                {selectedNotification.serviceDetails.totalFee}
              </p>
            </div>
            <div className="spsp-modal-button-1s">
              <button
                className="spsp-accept-modal-button-1"
                onClick={() => {
                  const requestId =
                    selectedNotification?.serviceDetails?.serviceRequestId;

                  if (!requestId) {
                    alert("Service request ID not found");
                    return;
                  }
                  handleAcceptRequest(requestId);
                }}
                disabled={
                  !selectedNotification?.serviceDetails?.serviceRequestId
                }
              >
                Accept Request
              </button>
              <button
                className="spsp-close-modal-button-1"
                onClick={() => setIsModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ServiceProviderHomePage;
