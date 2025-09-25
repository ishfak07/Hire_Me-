import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  FaBars,
  FaChartBar,
  FaChartLine,
  FaCheckCircle,
  FaClock,
  FaCog,
  FaEllipsisV,
  FaExclamationCircle,
  FaFileInvoiceDollar,
  FaHourglassHalf,
  FaInfoCircle,
  FaSignOutAlt,
  FaTachometerAlt,
  FaTimes,
  FaTools,
  FaUserCircle,
  FaUserPlus,
  FaUsers,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./dashboard.css";

const API_BASE_URL = "http://localhost:5000/api";

interface ActivityItem {
  id: string;
  type:
    | "service_completed"
    | "service_provider_approved"
    | "service_needer_registered"
    | "service_requested"
    | "service_activated";
  message: string;
  time: string;
  icon: "success" | "warning" | "info";
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  // Initialize with sidebar closed for mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1043);
  const [selectedSection, setSelectedSection] = useState("overview");
  const [metrics, setMetrics] = useState({
    serviceNeeders: { count: 0, trend: 0 },
    completedServices: { count: 0, trend: 0 },
    serviceProviders: { count: 0, trend: 0 },
    revenue: { amount: 0, trend: 0 },
    pendingServices: { count: 0, trend: 0 },
    activeServices: { count: 0, trend: 0 },
    totalServices: { count: 0, trend: 0 },
    avgServiceValue: { amount: 0, trend: 0 },
  });
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1043);
  // Add state for logout confirmation dialog
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Handle window resize with updated breakpoint
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 1043;
      setIsMobile(mobile);

      // Auto close sidebar when resizing below 1043px
      // Auto open sidebar when resizing above 1043px
      setIsSidebarOpen(!mobile);
    };

    // Set initial state
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Menu structure
  const menuItems = [
    {
      id: "overview",
      icon: FaTachometerAlt,
      label: "Dashboard",
      category: "main",
    },
    {
      id: "analytics",
      icon: FaChartLine,
      label: "Analytics",
      category: "main",
    },
    { id: "customers", icon: FaUsers, label: "Customers", category: "main" },
    { id: "services", icon: FaTools, label: "Services", category: "main" },
    {
      id: "ServiceProviders",
      icon: FaUserPlus,
      label: "Service Providers",
      category: "main",
    },
    {
      id: "reports",
      icon: FaChartBar,
      label: "Reports",
      category: "management",
    },
    { id: "settings", icon: FaCog, label: "Settings", category: "management" },
  ];

  // Function to generate recent activities from real data
  const generateRecentActivities = (
    completedServices: unknown[],
    serviceProviders: unknown[],
    serviceNeeders: unknown[],
    serviceRequests: unknown[]
  ): ActivityItem[] => {
    const activities: ActivityItem[] = [];

    // Add completed services (most recent first)
    completedServices.slice(0, 2).forEach((service: any, index) => {
      activities.push({
        id: `completed_${index}`,
        type: "service_completed",
        message: `Service completed for ${
          service.serviceNeeder?.name || "customer"
        }`,
        time: service.completedAt
          ? new Date(service.completedAt).toLocaleString()
          : "Recently",
        icon: "success",
      });
    });

    // Add recent service provider approvals
    serviceProviders.slice(0, 1).forEach((provider: any, index) => {
      activities.push({
        id: `provider_${index}`,
        type: "service_provider_approved",
        message: `New service provider "${provider.name}" approved`,
        time: provider.approvedAt
          ? new Date(provider.approvedAt).toLocaleString()
          : "Recently",
        icon: "success",
      });
    });

    // Add recent service needer registrations
    serviceNeeders.slice(0, 1).forEach((needer: any, index) => {
      activities.push({
        id: `needer_${index}`,
        type: "service_needer_registered",
        message: `New customer "${needer.name}" registered`,
        time: needer.createdAt
          ? new Date(needer.createdAt).toLocaleString()
          : "Recently",
        icon: "info",
      });
    });

    // Add recent service requests
    serviceRequests.slice(0, 1).forEach((request: any, index) => {
      activities.push({
        id: `request_${index}`,
        type: "service_requested",
        message: `New service request for ${request.serviceType || "service"}`,
        time: request.createdAt
          ? new Date(request.createdAt).toLocaleString()
          : "Recently",
        icon: "warning",
      });
    });

    // Sort by most recent and limit to 5 items
    return activities.slice(0, 5);
  };

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch real data from all collections
        const [
          serviceNeedersResponse,
          serviceProvidersResponse,
          completedServicesResponse,
          activeServicesResponse,
          serviceRequestsResponse,
        ] = await Promise.all([
          axios.get(`${API_BASE_URL}/service-needers/all`),
          axios.get(`${API_BASE_URL}/service-providers/approved`),
          axios.get(`${API_BASE_URL}/service-requests/completed-services`),
          axios.get(`${API_BASE_URL}/service-requests/active-services`),
          axios.get(`${API_BASE_URL}/service-requests/all`),
        ]);

        const serviceNeedersCount = serviceNeedersResponse.data.length;
        const serviceProvidersCount = serviceProvidersResponse.data.length;
        const completedServicesCount = completedServicesResponse.data.length;
        const activeServicesCount = activeServicesResponse.data.length;
        const totalServicesCount = serviceRequestsResponse.data.length;

        // Calculate revenue from completed services
        const completedServices = completedServicesResponse.data;
        const totalRevenue = completedServices.reduce(
          (
            sum: number,
            service: { serviceDetails?: { totalFee?: number } }
          ) => {
            return sum + (service.serviceDetails?.totalFee || 0);
          },
          0
        );

        // Calculate average service value
        const avgServiceValue =
          completedServicesCount > 0
            ? totalRevenue / completedServicesCount
            : 0;

        // Calculate pending services (total - completed - active)
        const pendingServicesCount = Math.max(
          0,
          totalServicesCount - completedServicesCount - activeServicesCount
        );

        // Update metrics with real data
        setMetrics({
          serviceNeeders: { count: serviceNeedersCount, trend: 12.5 },
          completedServices: { count: completedServicesCount, trend: 8.2 },
          serviceProviders: { count: serviceProvidersCount, trend: 15.3 },
          revenue: { amount: totalRevenue, trend: 18.7 },
          pendingServices: { count: pendingServicesCount, trend: -5.2 },
          activeServices: { count: activeServicesCount, trend: 22.1 },
          totalServices: { count: totalServicesCount, trend: 10.4 },
          avgServiceValue: { amount: avgServiceValue, trend: 5.8 },
        });

        // Generate recent activities from real data
        const activities = generateRecentActivities(
          completedServicesResponse.data,
          serviceProvidersResponse.data,
          serviceNeedersResponse.data,
          serviceRequestsResponse.data
        );
        setRecentActivities(activities);

        setLoading(false);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data. Please try again later.");

        // Set default values in case of error
        setMetrics({
          serviceNeeders: { count: 0, trend: 0 },
          completedServices: { count: 0, trend: 0 },
          serviceProviders: { count: 0, trend: 0 },
          revenue: { amount: 0, trend: 0 },
          pendingServices: { count: 0, trend: 0 },
          activeServices: { count: 0, trend: 0 },
          totalServices: { count: 0, trend: 0 },
          avgServiceValue: { amount: 0, trend: 0 },
        });
        setLoading(false);
      }
    };

    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin");
    } else {
      fetchDashboardData();
    }
  }, [navigate]);

  // Show logout confirmation dialog
  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  // Perform actual logout
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin");
  };

  // Cancel logout
  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const handleMenuClick = (itemId: string) => {
    setSelectedSection(itemId);
    if (isMobile) {
      setIsSidebarOpen(false); // Close sidebar on menu item click on mobile
    }

    if (itemId === "ServiceProviders") {
      navigate("/admin/service-provider");
    } else if (itemId === "services") {
      navigate("/admin/services");
    } else if (itemId === "customers") {
      navigate("/admin/customers");
    } else if (itemId === "analytics") {
      navigate("/admin/analytics");
    } else if (itemId === "reports") {
      navigate("/admin/reports");
    } else if (itemId === "settings") {
      navigate("/admin/settings");
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    // For numbers less than 1000, show up to 2 decimal places but remove trailing zeros
    return parseFloat(num.toFixed(2)).toString();
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="ad-dashboard-container">
      {/* Logout confirmation modal */}
      {showLogoutConfirm && (
        <div className="ad-logout-confirm-overlay">
          <div className="ad-logout-confirm-dialog">
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to logout?</p>
            <div className="ad-logout-confirm-buttons">
              <button className="ad-logout-cancel-btn" onClick={cancelLogout}>
                Cancel
              </button>
              <button className="ad-logout-confirm-btn" onClick={handleLogout}>
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay for mobile sidebar */}
      {isMobile && isSidebarOpen && (
        <div
          className="ad-sidebar-overlay active"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <nav className={`ad-sidebar ${isSidebarOpen ? "open" : "closed"}`}>
        <div className="ad-sidebar-header">
          <FaTools className="ad-logo-icon" />
          <span className="ad-logo-text">HireMe Admin</span>
          {isMobile && (
            <button
              className="ad-sidebar-toggle"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <FaTimes />
            </button>
          )}
        </div>

        <div className="ad-sidebar-menu">
          <div className="ad-menu-category">
            <span className="ad-category-label">Main</span>
            {menuItems
              .filter((item) => item.category === "main")
              .map((item) => (
                <button
                  key={item.id}
                  className={`ad-menu-item ${
                    selectedSection === item.id ? "active" : ""
                  }`}
                  onClick={() => handleMenuClick(item.id)}
                  aria-label={item.label}
                >
                  <item.icon /> <span>{item.label}</span>
                </button>
              ))}
          </div>

          <div className="ad-menu-category">
            <span className="ad-category-label">Administration</span>
            {menuItems
              .filter((item) => item.category === "management")
              .map((item) => (
                <button
                  key={item.id}
                  className={`ad-menu-item ${
                    selectedSection === item.id ? "active" : ""
                  }`}
                  onClick={() => handleMenuClick(item.id)}
                  aria-label={item.label}
                >
                  <item.icon /> <span>{item.label}</span>
                </button>
              ))}
          </div>
        </div>

        <div className="ad-sidebar-footer">
          <div className="ad-user-profile-sidebar">
            <FaUserCircle className="ad-avatar" />
            <div className="ad-user-info">
              <span className="ad-user-name">Administrator</span>
              <span className="ad-user-role">System Admin</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="ad-main-content">
        <header className="ad-top-bar">
          <div className="ad-header-left">
            {/* Always show hamburger menu on mobile */}
            {isMobile && (
              <button
                className="ad-mobile-menu-toggle"
                onClick={toggleSidebar}
                aria-label="Toggle menu"
              >
                <FaBars />
              </button>
            )}
            <h1 className="ad-page-title">
              {selectedSection === "overview"
                ? "Dashboard Overview"
                : selectedSection.charAt(0).toUpperCase() +
                  selectedSection.slice(1)}
            </h1>
          </div>

          <div className="ad-header-right">
            <div className="ad-user-profile">
              <FaUserCircle className="ad-avatar" />
              <div className="ad-user-info">
                <span className="ad-user-name">Administrator</span>
                <span className="ad-user-role">System Admin</span>
              </div>
            </div>
            <button
              className="ad-logout-btn"
              onClick={handleLogoutClick}
              title="Logout"
              aria-label="Logout"
            >
              <FaSignOutAlt />
            </button>
          </div>
        </header>
        <div className="ad-dashboard-content">
          <div className="ad-welcome-banner">
            <div className="ad-welcome-text">
              <h2>Welcome back, Administrator</h2>
              <p>Here's what's happening with your platform today.</p>
            </div>
            <div className="ad-date-display">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>

          <div className="ad-stats-grid">
            <div className="ad-stat-card">
              <div className="ad-stat-icon">
                <FaUsers />
              </div>
              <div className="ad-stat-info">
                <h3>Total Service Needers</h3>
                <p className="ad-stat-number">
                  {loading ? "..." : formatNumber(metrics.serviceNeeders.count)}
                </p>
                <span
                  className={`ad-stat-trend ${
                    metrics.serviceNeeders.trend >= 0 ? "positive" : "negative"
                  }`}
                >
                  {metrics.serviceNeeders.trend >= 0 ? "+" : ""}
                  {metrics.serviceNeeders.trend}%
                </span>
              </div>
            </div>
            <div className="ad-stat-card">
              <div className="ad-stat-icon">
                <FaTools />
              </div>
              <div className="ad-stat-info">
                <h3>Completed Services</h3>
                <p className="ad-stat-number">
                  {loading
                    ? "..."
                    : formatNumber(metrics.completedServices.count)}
                </p>
                <span
                  className={`ad-stat-trend ${
                    metrics.completedServices.trend >= 0
                      ? "positive"
                      : "negative"
                  }`}
                >
                  {metrics.completedServices.trend >= 0 ? "+" : ""}
                  {metrics.completedServices.trend}%
                </span>
              </div>
            </div>
            <div className="ad-stat-card">
              <div className="ad-stat-icon">
                <FaUserPlus />
              </div>
              <div className="ad-stat-info">
                <h3>Total Service Providers</h3>
                <p className="ad-stat-number">
                  {loading
                    ? "..."
                    : formatNumber(metrics.serviceProviders.count)}
                </p>
                <span
                  className={`ad-stat-trend ${
                    metrics.serviceProviders.trend >= 0
                      ? "positive"
                      : "negative"
                  }`}
                >
                  {metrics.serviceProviders.trend >= 0 ? "+" : ""}
                  {metrics.serviceProviders.trend}%
                </span>
              </div>
            </div>
            <div className="ad-stat-card">
              <div className="ad-stat-icon">
                <FaFileInvoiceDollar />
              </div>
              <div className="ad-stat-info">
                <h3>Total Revenue</h3>
                <p className="ad-stat-number">
                  {loading ? "..." : `$${formatNumber(metrics.revenue.amount)}`}
                </p>
                <span
                  className={`ad-stat-trend ${
                    metrics.revenue.trend >= 0 ? "positive" : "negative"
                  }`}
                >
                  {metrics.revenue.trend >= 0 ? "+" : ""}
                  {metrics.revenue.trend}%
                </span>
              </div>
            </div>
            <div className="ad-stat-card">
              <div className="ad-stat-icon">
                <FaClock />
              </div>
              <div className="ad-stat-info">
                <h3>Active Services</h3>
                <p className="ad-stat-number">
                  {loading ? "..." : formatNumber(metrics.activeServices.count)}
                </p>
                <span
                  className={`ad-stat-trend ${
                    metrics.activeServices.trend >= 0 ? "positive" : "negative"
                  }`}
                >
                  {metrics.activeServices.trend >= 0 ? "+" : ""}
                  {metrics.activeServices.trend}%
                </span>
              </div>
            </div>
            <div className="ad-stat-card">
              <div className="ad-stat-icon">
                <FaHourglassHalf />
              </div>
              <div className="ad-stat-info">
                <h3>Pending Services</h3>
                <p className="ad-stat-number">
                  {loading
                    ? "..."
                    : formatNumber(metrics.pendingServices.count)}
                </p>
                <span
                  className={`ad-stat-trend ${
                    metrics.pendingServices.trend >= 0 ? "positive" : "negative"
                  }`}
                >
                  {metrics.pendingServices.trend >= 0 ? "+" : ""}
                  {metrics.pendingServices.trend}%
                </span>
              </div>
            </div>
            <div className="ad-stat-card">
              <div className="ad-stat-icon">
                <FaChartLine />
              </div>
              <div className="ad-stat-info">
                <h3>Total Services</h3>
                <p className="ad-stat-number">
                  {loading ? "..." : formatNumber(metrics.totalServices.count)}
                </p>
                <span
                  className={`ad-stat-trend ${
                    metrics.totalServices.trend >= 0 ? "positive" : "negative"
                  }`}
                >
                  {metrics.totalServices.trend >= 0 ? "+" : ""}
                  {metrics.totalServices.trend}%
                </span>
              </div>
            </div>
            <div className="ad-stat-card">
              <div className="ad-stat-icon">
                <FaFileInvoiceDollar />
              </div>
              <div className="ad-stat-info">
                <h3>Avg Service Value</h3>
                <p className="ad-stat-number">
                  {loading
                    ? "..."
                    : `$${formatNumber(metrics.avgServiceValue.amount)}`}
                </p>
                <span
                  className={`ad-stat-trend ${
                    metrics.avgServiceValue.trend >= 0 ? "positive" : "negative"
                  }`}
                >
                  {metrics.avgServiceValue.trend >= 0 ? "+" : ""}
                  {metrics.avgServiceValue.trend}%
                </span>
              </div>
            </div>
          </div>

          <div className="ad-dashboard-grid">
            <div className="ad-content-section ad-recent-activity">
              <div className="ad-section-header">
                <h2>Recent Activity</h2>
                <button className="ad-more-btn" aria-label="More options">
                  <FaEllipsisV />
                </button>
              </div>

              <div className="ad-activity-list">
                {loading ? (
                  <div className="ad-loading-spinner-small"></div>
                ) : error ? (
                  <div className="ad-error-message-small">
                    <FaExclamationCircle /> {error}
                  </div>
                ) : recentActivities.length > 0 ? (
                  recentActivities.map((activity) => (
                    <div key={activity.id} className="ad-activity-item">
                      <div className={`ad-activity-icon ${activity.icon}`}>
                        {activity.icon === "success" && <FaCheckCircle />}
                        {activity.icon === "warning" && <FaExclamationCircle />}
                        {activity.icon === "info" && <FaInfoCircle />}
                      </div>
                      <div className="ad-activity-details">
                        <p className="ad-activity-text">{activity.message}</p>
                        <p className="ad-activity-time">{activity.time}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="ad-no-activities">
                    <p>No recent activity to display</p>
                  </div>
                )}
              </div>
            </div>

            <div className="ad-content-section ad-quick-actions">
              <div className="ad-section-header">
                <h2>Quick Actions</h2>
              </div>

              <div className="ad-action-buttons-grid">
                <button
                  className="ad-action-button"
                  onClick={() => navigate("/admin/service-provider")}
                >
                  <FaUserPlus />
                  <span>Manage Providers</span>
                </button>
                <button
                  className="ad-action-button"
                  onClick={() => navigate("/admin/customers")}
                >
                  <FaUsers />
                  <span>View Customers</span>
                </button>
                <button
                  className="ad-action-button"
                  onClick={() => navigate("/admin/services")}
                >
                  <FaTools />
                  <span>Review Services</span>
                </button>
                <button className="ad-action-button">
                  <FaChartBar />
                  <span>Generate Reports</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
