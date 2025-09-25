import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock, FaUserCircle } from "react-icons/fa";
import "./login.css";

const ServiceProviderLogin: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Update the handleSubmit function
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(
        "http://localhost:5000/api/service-providers/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (response.ok && data.status === "approved") {
        // Handle successful login for approved providers
        localStorage.setItem("token", data.token);
        navigate("/service-provider/dashboard");
      } else {
        // Handle different status messages
        switch (data.status) {
          case "pending":
            alert(
              "Your profile is pending approval from admin. Please wait for approval."
            );
            break;
          case "not_found":
            alert("Account not found. Please register first.");
            break;
          case "invalid":
            alert("Invalid credentials. Please check your email and password.");
            break;
          default:
            alert(data.message || "Login failed");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed. Please try again.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <FaUserCircle className="login-icon" />
          <h2>Service Provider Login</h2>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
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
          <div className="forgot-password">
            <span onClick={() => navigate("/service-provider/forgot-password")}>
              Forgot Password?
            </span>
          </div>

          <button type="submit" className="login-submit-button">
            Login
          </button>
        </form>
        <div className="auth-link">
          Don't have an account?
          <a href="/service-provider/register">Register here</a>
        </div>
      </div>
    </div>
  );
};

export default ServiceProviderLogin;
