import React from "react";
import { useNavigate } from "react-router-dom";
import Logo from '../components/Logo';
import "./userType.css";
import { FaUser, FaTools, FaUserShield, FaHouseDamage } from "react-icons/fa";
import { FaToolbox } from "react-icons/fa6";

const UserType: React.FC = () => {
  const navigate = useNavigate();

  const handleUserTypeSelection = (type: string) => {
    try {
      console.log("Selected user type:", type);
      switch (type) {
        case "service-needer":
          navigate("/service-needer/home");
          break;
        case "service-provider":
          navigate("/service-provider/register");
          break;
        case "admin":
          navigate("/admin");
          break;
        default:
          console.error("Unknown user type:", type);
      }
    } catch (error) {
      console.error("Navigation error:", error);
    }
  };

  return (
    <div className="userType-container">
      <Logo />
      <div className="userType-grid">
        <div
          className="userType-card"
          onClick={() => handleUserTypeSelection("service-needer")}
        >
          <img
            src="/serviceNeeder.webp"
            alt="Service Needer Background"
            className="card-background"
          />
          <div className="card-content">
            <FaUser  className="userType-icon" />
            <h2 className="userType-title">Service Needer</h2>
            <p className="userType-description">
              Looking for professional services? Find qualified service
              providers here.
            </p>
          </div>
        </div>

        <div
          className="userType-card"
          onClick={() => handleUserTypeSelection("service-provider")}
        >
          <img
            src="/serviceProvider.webp"
            alt="Service Provider Background"
            className="card-background"
          />
          <div className="card-content">
            <FaTools className="userType-icon" />
            <h2 className="userType-title">Service Provider</h2>
            <p className="userType-description">
              Offer your professional services and connect with clients.
            </p>
          </div>
        </div>

        

        <div
          className="userType-card"
          onClick={() => handleUserTypeSelection("admin")}
        >
          <img
            src="/admin.jpg"
            alt="Admin Background"
            className="card-background"
          />
          <div className="card-content">
            <FaUserShield className="userType-icon" />
            <h2 className="userType-title">Admin</h2>
            <p className="userType-description">
              Manage the platform and oversee service operations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserType;
