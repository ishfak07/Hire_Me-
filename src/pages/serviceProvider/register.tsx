import React, { useState } from "react";
import {
  FaClock,
  FaEnvelope,
  FaLock,
  FaMapMarkerAlt,
  FaPhone,
  FaTools,
  FaUserCircle,
  FaCheckCircle,
  FaMoneyBillWave,
} from "react-icons/fa";
import "./register.css";

const ServiceProviderRegister: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    serviceType: [] as string[],
    phoneNumber: "",
    serviceArea: "",
    experience: "",
    availableDays: [] as string[],
    timeFrom: "",
    timeTo: "",
    serviceFee: "",
  });

  const serviceTypes = [
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

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type } = target;

    if (type === "checkbox") {
      const day = name.replace("day-", "");
      setFormData((prev) => ({
        ...prev,
        availableDays: target.checked
          ? [...prev.availableDays, day]
          : prev.availableDays.filter((d) => d !== day),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Add validation for service types
    if (formData.serviceType.length === 0) {
      alert("Please select at least one service type");
      return;
    }

    // Add validation for service fee
    if (!formData.serviceFee || Number(formData.serviceFee) <= 0) {
      alert("Please enter a valid service fee");
      return;
    }

    try {
      // Create a new object with serviceFee converted to number
      const submitData = {
        ...formData,
        serviceFee: Number(formData.serviceFee),
      };

      const response = await fetch(
        "http://localhost:5000/api/service-providers/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(submitData),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setShowSuccessModal(true);
        // Reset form after successful submission
        setFormData({
          fullName: "",
          email: "",
          password: "",
          serviceType: [],
          phoneNumber: "",
          serviceArea: "",
          experience: "",
          availableDays: [],
          timeFrom: "",
          timeTo: "",
          serviceFee: "",
        });
      } else {
        alert(data.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      alert("Registration failed. Please try again.");
    }
  };
  return (
    <div className="register-container">
      <div className="register-card">
        <div className="login-link-container">
          <a href="/service-provider/login" className="login-text-link">
            Login
          </a>
        </div>
        <div className="register-header">
          <FaTools className="register-icon" />
          <h2>Service Provider Registration</h2>
        </div>

        <div className="revenue-notice revenue-notice-top">
          <p className="revenue-notice-text">
            <strong>Important:</strong> You need to pay 15% of your revenue which are earned in this platform.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <FaUserCircle className="input-icon" />
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Full Name"
              required
            />
          </div>

          <div className="form-group">
            <FaEnvelope className="input-icon" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              required
            />
          </div>

          <div className="form-group">
            <FaLock className="input-icon" />
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              required
            />
          </div>

          <div className="form-group service-type-selection">
            <label className="service-type-label">
              Service Types <span className="required">*</span>
              {formData.serviceType.length === 0 && (
                <span className="error-text">
                  Please select at least one service type
                </span>
              )}
            </label>
            <div className="service-type-grid">
              {serviceTypes.map((service, index) => (
                <label key={index} className="service-checkbox">
                  <input
                    type="checkbox"
                    name={`service-${service}`}
                    checked={formData.serviceType.includes(service)}
                    onChange={(e) => {
                      const service = e.target.name.replace("service-", "");
                      setFormData((prev) => ({
                        ...prev,
                        serviceType: e.target.checked
                          ? [...prev.serviceType, service]
                          : prev.serviceType.filter((s) => s !== service),
                      }));
                    }}
                  />
                  <span className="checkbox-text">{service}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <FaPhone className="input-icon" />
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="Phone Number"
              required
            />
          </div>

          <div className="form-group">
            <FaMapMarkerAlt className="input-icon" />
            <input
              type="text"
              name="serviceArea"
              value={formData.serviceArea}
              onChange={handleChange}
              placeholder="Service Area"
              required
            />
          </div>

          <div className="form-group days-selection">
            <label className="days-label">Available Days</label>
            <div className="days-grid">
              {daysOfWeek.map((day, index) => (
                <label key={index} className="day-checkbox">
                  <input
                    type="checkbox"
                    name={`day-${day}`}
                    checked={formData.availableDays.includes(day)}
                    onChange={handleChange}
                  />
                  <span className="checkbox-text">{day}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group time-range">
            <div className="time-inputs">
              <div className="time-input-wrapper">
                <FaClock className="input-icon" />
                <select
                  name="timeFrom"
                  value={formData.timeFrom}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select start time</option>
                  {Array.from({ length: 25 }).map((_, i) => {
                    const hour = Math.floor(i / 2) + 8;
                    const minute = i % 2 === 0 ? "00" : "30";
                    const time = `${hour
                      .toString()
                      .padStart(2, "0")}:${minute}`;
                    return (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    );
                  })}
                </select>
              </div>
              <span className="time-separator">to</span>
              <div className="time-input-wrapper">
                <FaClock className="input-icon" />
                <select
                  name="timeTo"
                  value={formData.timeTo}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select end time</option>
                  {Array.from({ length: 25 }).map((_, i) => {
                    const hour = Math.floor(i / 2) + 8;
                    const minute = i % 2 === 0 ? "00" : "30";
                    const time = `${hour
                      .toString()
                      .padStart(2, "0")}:${minute}`;
                    return (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>

          <div className="form-group">
            <textarea
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              placeholder="Brief description of your experience"
              rows={4}
              required
            />
          </div>
          <div className="form-group">
            <FaMoneyBillWave className="input-icon" />
            <input
              type="number"
              name="serviceFee"
              value={formData.serviceFee}
              onChange={handleChange}
              placeholder="Service Fee per Hour (LKR)"
              min="0"
              step="0.01"
              required
              onWheel={(e) => e.currentTarget.blur()} // Prevents mouse wheel from changing the value
            />
          </div>
          <button type="submit" className="register-button">
            Register as Service Provider
          </button>
        </form>
        <div className="auth-link">
          Already have an account?
          <a href="/service-provider/login">Login here</a>
        </div>
      </div>
      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <FaCheckCircle className="modal-icon" />
            <h3 className="modal-title">Registration Successful!</h3>
            <p className="modal-message">
              Your profile is being sent to the admin. After the admin review,
              you can login to the system. This process may take some time.
            </p>
            <button
              className="modal-button"
              onClick={() => setShowSuccessModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceProviderRegister;
