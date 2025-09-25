import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  FaArrowLeft,
  FaCheck,
  FaEdit,
  FaExclamationTriangle,
  FaEye,
  FaEyeSlash,
  FaSave,
  FaShieldAlt,
  FaTimes,
  FaUser,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./settings.css";

const API_BASE_URL = "http://localhost:5000/api";

interface AdminProfile {
  email: string;
  createdAt: string;
  updatedAt: string;
}

interface SecuritySettings {
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordMinLength: number;
  requireSpecialChars: boolean;
  twoFactorAuth: boolean;
}

const AdminSettings: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Profile states
  const [adminProfile, setAdminProfile] = useState<AdminProfile>({
    email: "",
    createdAt: "",
    updatedAt: "",
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    currentEmail: "",
    newEmail: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Security settings
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    sessionTimeout: 60,
    maxLoginAttempts: 3,
    passwordMinLength: 8,
    requireSpecialChars: true,
    twoFactorAuth: false,
  });

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin");
      return;
    }

    const fetchSettingsData = async () => {
      setLoading(true);
      try {
        // Fetch admin profile and settings from API
        const response = await axios.get(`${API_BASE_URL}/admin/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const { email, createdAt, updatedAt, securitySettings } = response.data;

        setAdminProfile({
          email,
          createdAt,
          updatedAt,
        });

        setProfileForm((prev) => ({
          ...prev,
          currentEmail: email,
        }));

        setSecuritySettings(securitySettings);

        setLoading(false);
      } catch (err) {
        console.error("Error fetching settings data:", err);
        setError("Failed to load settings data");

        // If token is invalid, redirect to login
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          localStorage.removeItem("adminToken");
          navigate("/admin");
        }

        setLoading(false);
      }
    };

    fetchSettingsData();
  }, [navigate]);

  const handleProfileUpdate = async () => {
    try {
      if (
        profileForm.newPassword &&
        profileForm.newPassword !== profileForm.confirmPassword
      ) {
        setError("New passwords do not match");
        return;
      }

      const token = localStorage.getItem("adminToken");
      if (!token) {
        navigate("/admin");
        return;
      }

      const updateData: {
        newEmail?: string;
        currentPassword?: string;
        newPassword?: string;
      } = {};

      // Only include fields that have been changed
      if (
        profileForm.newEmail &&
        profileForm.newEmail !== profileForm.currentEmail
      ) {
        updateData.newEmail = profileForm.newEmail;
      }

      if (profileForm.newPassword) {
        if (!profileForm.currentPassword) {
          setError("Current password is required to change password");
          return;
        }
        updateData.currentPassword = profileForm.currentPassword;
        updateData.newPassword = profileForm.newPassword;
      }

      // If no changes, just close edit mode
      if (Object.keys(updateData).length === 0) {
        setIsEditingProfile(false);
        return;
      }

      const response = await axios.put(
        `${API_BASE_URL}/admin/profile`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Update local state with response data
      setAdminProfile((prev) => ({
        ...prev,
        email: response.data.email,
        updatedAt: response.data.updatedAt,
      }));

      setProfileForm((prev) => ({
        ...prev,
        currentEmail: response.data.email,
        newEmail: "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));

      setSuccess("Profile updated successfully");
      setIsEditingProfile(false);
    } catch (error) {
      console.error("Profile update error:", error);

      if (axios.isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.message || "Failed to update profile";
        setError(errorMessage);

        // If token is invalid, redirect to login
        if (error.response?.status === 401) {
          localStorage.removeItem("adminToken");
          navigate("/admin");
        }
      } else {
        setError("Failed to update profile");
      }
    }
  };

  const handleSecuritySettingsUpdate = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        navigate("/admin");
        return;
      }

      const response = await axios.put(
        `${API_BASE_URL}/admin/security-settings`,
        securitySettings,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Update local state with response data
      setSecuritySettings(response.data.securitySettings);
      setSuccess("Security settings updated successfully");
    } catch (error) {
      console.error("Security settings error:", error);

      if (axios.isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.message || "Failed to update security settings";
        setError(errorMessage);

        // If token is invalid, redirect to login
        if (error.response?.status === 401) {
          localStorage.removeItem("adminToken");
          navigate("/admin");
        }
      } else {
        setError("Failed to update security settings");
      }
    }
  };

  const tabItems = [
    { id: "profile", label: "Profile", icon: FaUser },
    { id: "security", label: "Security", icon: FaShieldAlt },
  ];

  if (loading) {
    return (
      <div className="settings-container">
        <div className="settings-loading">
          <div className="loading-spinner"></div>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <button
          className="back-button"
          onClick={() => navigate("/admin/dashboard")}
        >
          <FaArrowLeft />
        </button>
        <div className="header-content">
          <h1>Admin Settings</h1>
          <p>Manage system configuration and administrative settings</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <FaExclamationTriangle />
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <FaTimes />
          </button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <FaCheck />
          <span>{success}</span>
          <button onClick={() => setSuccess(null)}>
            <FaTimes />
          </button>
        </div>
      )}

      <div className="settings-content">
        <div className="settings-sidebar">
          <nav className="settings-nav">
            {tabItems.map((item) => (
              <button
                key={item.id}
                className={`nav-item ${activeTab === item.id ? "active" : ""}`}
                onClick={() => setActiveTab(item.id)}
              >
                <item.icon />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="settings-main">
          {activeTab === "profile" && (
            <div className="settings-section">
              <div className="section-header">
                <h2>Admin Profile</h2>
                <button
                  className={`edit-button ${isEditingProfile ? "active" : ""}`}
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                >
                  <FaEdit />
                  {isEditingProfile ? "Cancel" : "Edit"}
                </button>
              </div>

              <div className="profile-info">
                <div className="info-group">
                  <label>Email Address</label>
                  {isEditingProfile ? (
                    <input
                      type="email"
                      value={profileForm.newEmail || profileForm.currentEmail}
                      onChange={(e) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          newEmail: e.target.value,
                        }))
                      }
                      placeholder="Enter new email"
                    />
                  ) : (
                    <p>{adminProfile.email}</p>
                  )}
                </div>

                <div className="info-group">
                  <label>Account Created</label>
                  <p>{new Date(adminProfile.createdAt).toLocaleDateString()}</p>
                </div>

                <div className="info-group">
                  <label>Last Updated</label>
                  <p>{new Date(adminProfile.updatedAt).toLocaleDateString()}</p>
                </div>

                {isEditingProfile && (
                  <>
                    <div className="info-group">
                      <label>Current Password</label>
                      <div className="password-input">
                        <input
                          type={showPasswords.current ? "text" : "password"}
                          value={profileForm.currentPassword}
                          onChange={(e) =>
                            setProfileForm((prev) => ({
                              ...prev,
                              currentPassword: e.target.value,
                            }))
                          }
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswords((prev) => ({
                              ...prev,
                              current: !prev.current,
                            }))
                          }
                        >
                          {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>

                    <div className="info-group">
                      <label>New Password</label>
                      <div className="password-input">
                        <input
                          type={showPasswords.new ? "text" : "password"}
                          value={profileForm.newPassword}
                          onChange={(e) =>
                            setProfileForm((prev) => ({
                              ...prev,
                              newPassword: e.target.value,
                            }))
                          }
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswords((prev) => ({
                              ...prev,
                              new: !prev.new,
                            }))
                          }
                        >
                          {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>

                    <div className="info-group">
                      <label>Confirm New Password</label>
                      <div className="password-input">
                        <input
                          type={showPasswords.confirm ? "text" : "password"}
                          value={profileForm.confirmPassword}
                          onChange={(e) =>
                            setProfileForm((prev) => ({
                              ...prev,
                              confirmPassword: e.target.value,
                            }))
                          }
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPasswords((prev) => ({
                              ...prev,
                              confirm: !prev.confirm,
                            }))
                          }
                        >
                          {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>

                    <button
                      className="save-button"
                      onClick={handleProfileUpdate}
                    >
                      <FaSave />
                      Save Changes
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="settings-section">
              <div className="section-header">
                <h2>Security Settings</h2>
              </div>

              <div className="settings-form">
                <div className="setting-item">
                  <div className="setting-info">
                    <h3>Session Timeout</h3>
                    <p>Automatically logout after inactivity (minutes)</p>
                  </div>
                  <input
                    type="number"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) =>
                      setSecuritySettings((prev) => ({
                        ...prev,
                        sessionTimeout: parseInt(e.target.value) || 60,
                      }))
                    }
                    min="15"
                    max="480"
                  />
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h3>Max Login Attempts</h3>
                    <p>Maximum failed login attempts before account lockout</p>
                  </div>
                  <input
                    type="number"
                    value={securitySettings.maxLoginAttempts}
                    onChange={(e) =>
                      setSecuritySettings((prev) => ({
                        ...prev,
                        maxLoginAttempts: parseInt(e.target.value) || 3,
                      }))
                    }
                    min="3"
                    max="10"
                  />
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h3>Password Minimum Length</h3>
                    <p>Minimum password length for all users</p>
                  </div>
                  <input
                    type="number"
                    value={securitySettings.passwordMinLength}
                    onChange={(e) =>
                      setSecuritySettings((prev) => ({
                        ...prev,
                        passwordMinLength: parseInt(e.target.value) || 8,
                      }))
                    }
                    min="6"
                    max="32"
                  />
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h3>Require Special Characters</h3>
                    <p>Force passwords to include special characters</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={securitySettings.requireSpecialChars}
                      onChange={(e) =>
                        setSecuritySettings((prev) => ({
                          ...prev,
                          requireSpecialChars: e.target.checked,
                        }))
                      }
                    />
                    <span className="slider"></span>
                  </label>
                </div>

                {/* <div className="setting-item">
                  <div className="setting-info">
                    <h3>Two-Factor Authentication</h3>
                    <p>Enable 2FA for admin accounts</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={securitySettings.twoFactorAuth}
                      onChange={(e) =>
                        setSecuritySettings((prev) => ({
                          ...prev,
                          twoFactorAuth: e.target.checked,
                        }))
                      }
                    />
                    <span className="slider"></span>
                  </label>
                </div> */}

                <button
                  className="save-button"
                  onClick={handleSecuritySettingsUpdate}
                >
                  <FaSave />
                  Save Security Settings
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
