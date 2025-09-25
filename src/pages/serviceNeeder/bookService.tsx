import React, { useEffect, useState } from "react";
import {
  FaBell,
  FaBolt,
  FaBroom,
  FaCalendar,
  FaCar,
  FaClock,
  FaHammer,
  FaHome,
  FaMapMarkerAlt,
  FaPaintRoller,
  FaTools,
  FaTree,
  FaWrench,
} from "react-icons/fa";
import Modal from "react-modal";
import { useNavigate } from "react-router-dom";
import "./bookService.css";
Modal.setAppElement("#root");

interface ServiceProvider {
  _id: string;
  fullName: string;
  experience: string;
  serviceFee: number;
  rating?: number;
  phoneNumber: string;
  email: string;
}

interface SNNotification {
  _id: string;
  message: string;
  createdAt: string;
  read: boolean;
  serviceRequestId: string;
  serviceProvider: {
    name: string;
    phoneNumber: string;
  };
  status: string;
}

const BookService: React.FC = () => {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [matchedProviders, setMatchedProviders] = useState<ServiceProvider[]>(
    []
  );
  const [showTimeModal, setShowTimeModal] = useState({
    timeFrom: false,
    timeTo: false,
  });
  const [snNotifications, setSNNotifications] = useState<SNNotification[]>([]);
  const [showNotificationsList, setShowNotificationsList] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [bookingData, setBookingData] = useState({
    serviceType: "",
    location: "",
    address: "",
    date: "",
    timeFrom: "",
    timeTo: "",
  });

  const services = [
    {
      id: 1,
      name: "Electrician Services",
      price: "From $50",
      icon: FaBolt,
    },
    {
      id: 2,
      name: "Plumbing Services",
      price: "From $60",
      icon: FaWrench,
    },
    
    {
      id: 3,
      name: "Carpentry Services",
      price: "From $70",
      icon: FaHammer,
    },
    {
      id: 4,
      name: "Vehicle Breakdown Assistance",
      price: "From $80",
      icon: FaCar,
    },
    {
      id: 5,
      name: "Home Appliance Repair",
      price: "From $55",
      icon: FaTools,
    },
    {
      id: 6,
      name: "House Cleaning Services",
      price: "From $45",
      icon: FaBroom,
    },
    {
      id: 7,
      name: "Painting Services",
      price: "From $65",
      icon: FaPaintRoller,
    },
    {
      id: 8,
      name: "Gardening & Landscaping",
      price: "From $75",
      icon: FaTree,
    },
    {
      id: 9,
      name: "Roof Repair & Waterproofing",
      price: "From $85",
      icon: FaHome,
    },
    
  ];
  const [showModal, setShowModal] = useState(false);
  const [bookingResponse, setBookingResponse] = useState<{
    success: boolean;
    message: string;
  }>({
    success: false,
    message: "",
  });
  const [countdown, setCountdown] = useState(8);
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [previousStep, setPreviousStep] = useState(1);

  const handleCustomTimeChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "timeFrom" | "timeTo"
  ) => {
    setBookingData({
      ...bookingData,
      [field]: e.target.value,
    });
  };

  const validateTime = (time: string): boolean => {
    // Simple time validation using regex (HH:MM format, 24-hour)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  };

  const fetchSNNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      console.log("Fetching notifications..."); // Debug log

      const response = await fetch(
        "http://localhost:5000/api/service-requests/sn-notifications",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Received notifications:", data); // Debug log
        setSNNotifications(data);
        setUnreadCount(data.filter((n: SNNotification) => !n.read).length);
      } else {
        console.error("Failed to fetch notifications:", response.statusText);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  // function to mark notifications as read
  const markNotificationsAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      await fetch(
        "http://localhost:5000/api/service-requests/sn-notifications/mark-read",
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setUnreadCount(0);
      setSNNotifications(snNotifications.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  // useEffect to fetch notifications
  useEffect(() => {
    // Initial fetch
    fetchSNNotifications();

    // Set up interval for periodic fetching
    const interval = setInterval(fetchSNNotifications, 30000); // every 30 seconds

    // Cleanup on unmount
    return () => clearInterval(interval);
  }, []);

  // Add click outside handler to close notifications
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        !target.closest(".SN-BS-notification-wrapper") &&
        showNotificationsList
      ) {
        setShowNotificationsList(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showNotificationsList]);

  useEffect(() => {
    fetchAvailableLocations();
  }, []);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = () => {
    localStorage.removeItem("token");
    setShowLogoutModal(false);
    navigate("/service-needer/login");
  };

  const handleServiceSelect = (serviceName: string) => {
    setPreviousStep(step);
    setShowTransition(true);
    setSelectedService(serviceName);
    setBookingData((prev) => ({ ...prev, serviceType: serviceName }));

    // Delay setting step to allow for animation
    setTimeout(() => {
      setStep(2);
      setShowTransition(false);
    }, 700);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    // Special handling for location field to normalize case
    if (e.target.name === "location") {
      setBookingData({
        ...bookingData,
        [e.target.name]: e.target.value.trim(), // Store as entered but trim whitespace
      });
    } else {
      setBookingData({
        ...bookingData,
        [e.target.name]: e.target.value,
      });
    }
  };

  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); // Clear any previous errors

    setPreviousStep(step);
    setShowTransition(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please login to continue");
        return;
      }

      const normalizedBookingData = {
        ...bookingData,
        location: bookingData.location.toLowerCase(), // Convert to lowercase for consistent matching
      };

      console.log("Sending booking data:", bookingData); // Debug log

      const response = await fetch(
        "http://localhost:5000/api/service-needers/find-providers",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(normalizedBookingData),
        }
      );

      const data = await response.json();
      console.log("Received response:", data); // Debug log

      if (!response.ok) {
        throw new Error(data.message || "Failed to find service providers");
      }

      if (!data.providers || !Array.isArray(data.providers)) {
        throw new Error("Invalid response format from server");
      }

      setTimeout(() => {
        setMatchedProviders(data.providers);
        setStep(3);
        setShowTransition(false);
      }, 700);
    } catch (error) {
      console.error("Error finding providers:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to find service providers"
      );
    }
  };

  const handleBookingConfirm = async (
    providerId: string,
    providerFee: number
  ) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      // Calculate total hours
      const timeFrom = new Date(`2000/01/01 ${bookingData.timeFrom}`);
      const timeTo = new Date(`2000/01/01 ${bookingData.timeTo}`);
      const totalHours =
        (timeTo.getTime() - timeFrom.getTime()) / (1000 * 60 * 60);
      const totalFee = totalHours * providerFee;

      // Normalize the location case
      const normalizedBookingData = {
        ...bookingData,
        location: bookingData.location.toLowerCase(),
      };

      const response = await fetch(
        "http://localhost:5000/api/service-requests/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            ...normalizedBookingData,
            providerId,
            totalHours,
            totalFee,
          }),
        }
      );

      const data = await response.json();
      setBookingResponse({
        success: response.ok,
        message:
          data.message ||
          "Your service request has been sent successfully. Please wait for the provider to accept your request.",
      });
      setShowModal(true);

      // Start countdown timer and reload page after modal closes
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setShowModal(false);
            window.location.reload(); // Reload the page
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setBookingResponse({
        success: false,
        message: "Failed to create service request. Please try again.",
      });
      setShowModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateTimeSlots = () => {
    const slots = [];
    const now = new Date();
    const isToday = bookingData.date === getTodayString();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    for (let hour = 8; hour <= 20; hour++) {
      // For today, only show future times
      if (isToday && hour < currentHour) {
        continue; // Skip past hours
      }

      // Add hour:00 if it's in the future
      if (
        !isToday ||
        hour > currentHour ||
        (hour === currentHour && currentMinute < 0)
      ) {
        slots.push(`${hour.toString().padStart(2, "0")}:00`);
      }

      // Add hour:30 if not 20:00 and it's in the future
      if (
        hour !== 20 &&
        (!isToday ||
          hour > currentHour ||
          (hour === currentHour && currentMinute < 30))
      ) {
        slots.push(`${hour.toString().padStart(2, "0")}:30`);
      }
    }
    return slots;
  };

  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const fetchAvailableLocations = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(
        "http://localhost:5000/api/service-needers/available-locations",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Location data received:", data); // Debug log to see structure

        // Check if data.locations exists and is an array
        if (data && data.locations && Array.isArray(data.locations)) {
          // Remove duplicates and sort alphabetically
          const uniqueLocations = [...new Set(data.locations)].sort();
          setAvailableLocations(uniqueLocations);
        } else {
          // Handle case where data structure is unexpected
          console.error("Unexpected response format for locations:", data);
          setAvailableLocations([]);
        }
      } else {
        console.error("Failed to fetch locations:", response.statusText);
      }
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  };

  return (
    <div>
      <nav className="SN-BS-navbar">
        <div className="SN-BS-nav-left">
          <div className="SN-BS-notification-wrapper">
            <FaBell
              className="SN-BS-notification-icon"
              onClick={() => {
                setShowNotificationsList(!showNotificationsList);
                if (!showNotificationsList && unreadCount > 0) {
                  markNotificationsAsRead();
                }
              }}
            />
            {unreadCount > 0 && (
              <span className="SN-BS-notification-badge">{unreadCount}</span>
            )}
            {showNotificationsList && (
              <div className="SN-BS-notifications-dropdown">
                <div className="SN-BS-notifications-header">
                  <h3>Notifications</h3>
                </div>
                <div className="SN-BS-notifications-list">
                  {snNotifications && snNotifications.length > 0 ? (
                    snNotifications.map((notification) => (
                      <div
                        key={notification._id}
                        className={`SN-BS-notification-item ${
                          !notification.read ? "SN-BS-unread" : ""
                        }`}
                      >
                        <p className="SN-BS-notification-message">
                          {notification.message}
                        </p>
                        <p className="SN-BS-notification-time">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                        {notification.status === "accepted" && (
                          <div className="SN-BS-provider-contact">
                            <p>Contact Provider:</p>
                            <p>{notification.serviceProvider.name}</p>
                            <p>{notification.serviceProvider.phoneNumber}</p>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="SN-BS-no-notifications">No notifications</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="SN-BS-nav-center">
          <h1>HireMe</h1>
        </div>
        <div className="SN-BS-nav-right">
          <button
            className="SN-BS-track-service-btn"
            onClick={() => navigate("/service-needer/track-service")}
          >
            Track Service
          </button>
          <button className="SN-BS-logout-btn" onClick={handleLogoutClick}>
            Logout
          </button>
        </div>
      </nav>

      <div className="SN-BS-book-service">
        <div className="SN-BS-booking-progress">
          <div
            className={`SN-BS-progress-step ${
              step >= 1 ? "SN-BS-active" : ""
            } ${step > 1 ? "SN-BS-completed" : ""}`}
          >
            1. Select Service
          </div>
          <div
            className={`SN-BS-progress-step ${
              step >= 2 ? "SN-BS-active" : ""
            } ${step > 2 ? "SN-BS-completed" : ""}`}
          >
            2. Schedule
          </div>
          <div
            className={`SN-BS-progress-step ${step >= 3 ? "SN-BS-active" : ""}`}
          >
            3. Confirm
          </div>
        </div>

        {/* Add transition overlay */}
        {showTransition && <div className="SN-BS-step-transition"></div>}

        {step === 1 && (
          <div className="SN-BS-service-selection">
            <div className="SN-BS-selection-header">
              <h2>Select a Service</h2>
              <button
                className="SN-BS-view-all-providers-btn"
                onClick={() =>
                  navigate("/service-needer/all-service-providers")
                }
              >
                Show All Service Providers
              </button>
            </div>
            <div className="SN-BS-services-grid">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="SN-BS-service-card"
                  onClick={() => handleServiceSelect(service.name)}
                >
                  <span className="SN-BS-service-icon">
                    <service.icon />
                  </span>
                  <h3>{service.name}</h3>
                  <p>{service.price}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <form className="SN-BS-booking-form" onSubmit={handleSubmit}>
            <h2>Schedule Your Service</h2>
            {error && <div className="SN-BS-error-message">{error}</div>}
            <div className="SN-BS-form-group">
              <FaMapMarkerAlt />
              <div className="SN-BS-location-input-wrapper">
                <input
                  type="text"
                  name="location"
                  placeholder="Service Location"
                  value={bookingData.location}
                  onChange={handleInputChange}
                  onClick={() => setShowLocationDropdown(true)}
                  onFocus={() => setShowLocationDropdown(true)}
                  onBlur={() => {
                    setTimeout(() => setShowLocationDropdown(false), 200);
                  }}
                  required
                />
                {/* Dropdown attached inside the wrapper for proper positioning */}
                {showLocationDropdown && availableLocations.length > 0 && (
                  <div className="SN-BS-location-dropdown">
                    {availableLocations
                      .filter((location) =>
                        location
                          .toLowerCase()
                          .includes(bookingData.location.toLowerCase())
                      )
                      .map((location, index) => (
                        <div
                          key={index}
                          className={`SN-BS-location-option ${
                            bookingData.location === location
                              ? "SN-BS-highlighted"
                              : ""
                          }`}
                          onMouseDown={() => {
                            setBookingData((prev) => ({ ...prev, location }));
                            setShowLocationDropdown(false);
                          }}
                        >
                          {location}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
            <div className="SN-BS-form-group">
              <FaMapMarkerAlt />
              <input
                type="text"
                name="address"
                placeholder="Detailed Address"
                value={bookingData.address}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="SN-BS-form-group">
              <FaCalendar
                onClick={() => {
                  // Find the date input and programmatically click it
                  const dateInput =
                    document.querySelector('input[name="date"]');
                  if (dateInput) {
                    (dateInput as HTMLElement).click();
                  }
                }}
              />
              <input
                type="date"
                name="date"
                value={bookingData.date}
                onChange={handleInputChange}
                min={getTodayString()}
                required
                // Make the input field look more clickable with a cursor style
                style={{ cursor: "pointer" }}
                // Show the calendar popup when the input field itself is clicked
                onClick={(e) => {
                  // This ensures the browser's native date picker opens
                  e.currentTarget.showPicker();
                }}
              />
            </div>
            <div className="SN-BS-time-range-group">
              <div className="SN-BS-form-group">
                <FaClock
                  onClick={() => {
                    const timeFromInput = document.querySelector(
                      'input[name="timeFrom"]'
                    );
                    if (timeFromInput) {
                      (timeFromInput as HTMLElement).click();
                    }
                  }}
                />
                <input
                  type="time"
                  name="timeFrom"
                  value={bookingData.timeFrom}
                  onChange={(e) => handleCustomTimeChange(e, "timeFrom")}
                  min="08:00"
                  max="20:00"
                  required
                  style={{ cursor: "pointer" }}
                  onClick={(e) => {
                    e.currentTarget.showPicker();
                  }}
                />
              </div>
              <div className="SN-BS-form-group">
                <FaClock
                  onClick={() => {
                    const timeToInput = document.querySelector(
                      'input[name="timeTo"]'
                    );
                    if (timeToInput) {
                      (timeToInput as HTMLElement).click();
                    }
                  }}
                />
                <input
                  type="time"
                  name="timeTo"
                  value={bookingData.timeTo}
                  onChange={(e) => handleCustomTimeChange(e, "timeTo")}
                  min={bookingData.timeFrom || "08:00"}
                  max="20:00"
                  required
                  style={{ cursor: "pointer" }}
                  onClick={(e) => {
                    e.currentTarget.showPicker();
                  }}
                />
              </div>
            </div>
            <button type="submit" className="SN-BS-next-button">
              Find Service Providers
            </button>
          </form>
        )}

        {step === 3 && (
          <div className="SN-BS-booking-confirmation">
            <h2>Available Service Providers</h2>
            <div className="SN-BS-booking-summary">
              <h3>Booking Details</h3>
              <div className="SN-BS-summary-details">
                <p>
                  <strong>Service:</strong> {selectedService}
                </p>
                <p>
                  <strong>Location:</strong> {bookingData.location}
                </p>
                <p>
                  <strong>Address:</strong> {bookingData.address}
                </p>
                <p>
                  <strong>Date:</strong>{" "}
                  {new Date(bookingData.date).toLocaleDateString()}
                </p>
                <p>
                  <strong>Time:</strong> {bookingData.timeFrom} -{" "}
                  {bookingData.timeTo}
                </p>
              </div>
            </div>

            <div className="SN-BS-providers-list">
              {matchedProviders.length > 0 ? (
                matchedProviders.map((provider) => (
                  <div key={provider._id} className="SN-BS-provider-card">
                    <h3>{provider.fullName}</h3>
                    <div className="SN-BS-provider-details">
                      <p>
                        <strong>Experience:</strong> {provider.experience}
                      </p>
                      <p>
                        <strong>Service Fee / Hour :</strong> LKR{" "}
                        {provider.serviceFee}
                      </p>
                    </div>
                    <button
                      className="SN-BS-select-provider-button"
                      onClick={() =>
                        handleBookingConfirm(provider._id, provider.serviceFee)
                      }
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Processing..." : "Book Now"}
                    </button>
                  </div>
                ))
              ) : (
                <div className="SN-BS-no-providers">
                  <p>
                    No service providers available for the selected criteria.
                  </p>
                  <button
                    className="SN-BS-back-button"
                    onClick={() => {
                      setPreviousStep(step);
                      setShowTransition(true);
                      setTimeout(() => {
                        setStep(2);
                        setShowTransition(false);
                      }, 700);
                    }}
                  >
                    Modify Search
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {showModal && (
        <Modal
          isOpen={showModal}
          onRequestClose={() => setShowModal(false)}
          className="SN-BS-modal-content"
          overlayClassName="SN-BS-modal-overlay"
        >
          <h2>
            {bookingResponse.success
              ? "Request Sent Successfully! If the Service Provider accepts, you will be notified."
              : "Request Failed"}
          </h2>
          <div
            className={
              bookingResponse.success
                ? "SN-BS-success-message"
                : "SN-BS-error-message"
            }
          >
            <p>{bookingResponse.message}</p>
            {bookingResponse.success && (
              <div className="SN-BS-countdown-timer">
                Closing in {countdown} seconds
              </div>
            )}
          </div>
        </Modal>
      )}
      {showLogoutModal && (
        <Modal
          isOpen={showLogoutModal}
          onRequestClose={() => setShowLogoutModal(false)}
          className="SN-BS-modal-content"
          overlayClassName="SN-BS-modal-overlay"
        >
          <h2>Confirm Logout</h2>
          <p>Are you sure you want to log out from your account?</p>
          <div className="SN-BS-modal-buttons">
            <button
              className="SN-BS-confirm-button"
              onClick={handleLogoutConfirm}
            >
              Yes, Logout
            </button>
            <button
              className="SN-BS-cancel-button"
              onClick={() => setShowLogoutModal(false)}
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default BookService;
