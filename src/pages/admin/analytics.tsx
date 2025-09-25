import React, { useEffect, useState } from "react";
import {
  FaArrowDown,
  FaArrowLeft,
  FaArrowUp,
  FaBars,
  FaChartLine,
  FaClock,
  FaEye,
  FaFileInvoiceDollar,
  FaSignOutAlt,
  FaTimes,
  FaTools,
  FaUserCircle,
  FaUsers,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "./analytics.css";

interface AnalyticsData {
  kpis: {
    totalRevenue: number;
    activeServices: number;
    totalUsers: number;
    monthlyGrowth: string;
  };
  servicesByType: { name: string; value: number; color: string }[];
  revenueByMonth: { month: string; revenue: number; services: number }[];
  providerPerformance: { name: string; completed: number; revenue: number }[];
  userGrowth: { month: string; serviceNeeders: number; providers: number }[];
  serviceStatus: { name: string; value: number; color: string }[];
}

const AdminAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1043);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1043);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    kpis: {
      totalRevenue: 0,
      activeServices: 0,
      totalUsers: 0,
      monthlyGrowth: "0%",
    },
    servicesByType: [],
    revenueByMonth: [],
    providerPerformance: [],
    userGrowth: [],
    serviceStatus: [],
  });

  // Fetch analytics data from API
  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "http://localhost:5000/api/analytics/dashboard"
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setAnalyticsData(data);
      setError(null);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      setError("Failed to load analytics data. Please try again later.");

      // Fallback to sample data if API fails
      setAnalyticsData(generateSampleData());
    } finally {
      setLoading(false);
    }
  };

  // Sample data for fallback
  const generateSampleData = (): AnalyticsData => {
    return {
      kpis: {
        totalRevenue: 125430,
        activeServices: 234,
        totalUsers: 1247,
        monthlyGrowth: "+12.5%",
      },
      servicesByType: [
        { name: "Plumbing", value: 35, color: "#FFD700" },
        { name: "Electrical", value: 28, color: "#FF6B6B" },
        { name: "Cleaning", value: 22, color: "#4ECDC4" },
        { name: "Carpentry", value: 15, color: "#45B7D1" },
        { name: "Others", value: 12, color: "#96CEB4" },
      ],
      revenueByMonth: [
        { month: "Jan", revenue: 4500, services: 18 },
        { month: "Feb", revenue: 5200, services: 22 },
        { month: "Mar", revenue: 4800, services: 20 },
        { month: "Apr", revenue: 6100, services: 26 },
        { month: "May", revenue: 5800, services: 24 },
        { month: "Jun", revenue: 7200, services: 30 },
      ],
      providerPerformance: [
        { name: "Mike's Plumbing", completed: 15, revenue: 2400 },
        { name: "ElectroFix Pro", completed: 12, revenue: 2100 },
        { name: "Clean Masters", completed: 18, revenue: 1800 },
        { name: "Wood Works", completed: 8, revenue: 1600 },
        { name: "Quick Repairs", completed: 10, revenue: 1400 },
      ],
      userGrowth: [
        { month: "Jan", serviceNeeders: 45, providers: 12 },
        { month: "Feb", serviceNeeders: 52, providers: 15 },
        { month: "Mar", serviceNeeders: 48, providers: 18 },
        { month: "Apr", serviceNeeders: 65, providers: 22 },
        { month: "May", serviceNeeders: 72, providers: 25 },
        { month: "Jun", serviceNeeders: 89, providers: 28 },
      ],
      serviceStatus: [
        { name: "Pending", value: 45, color: "#FFEAA7" },
        { name: "Active", value: 30, color: "#4ECDC4" },
        { name: "Completed", value: 85, color: "#96CEB4" },
        { name: "Rejected", value: 12, color: "#FF6B6B" },
      ],
    };
  };

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 1043;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const handleLogoutClick = () => setShowLogoutConfirm(true);
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin");
  };
  const cancelLogout = () => setShowLogoutConfirm(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  if (loading) {
    return (
      <div className="ana-loading-container">
        <div className="ana-loading-spinner"></div>
        <p>Loading Analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ana-error-container">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="ana-dashboard-container">
      {/* Logout confirmation modal */}
      {showLogoutConfirm && (
        <div className="ana-logout-confirm-overlay">
          <div className="ana-logout-confirm-dialog">
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to logout?</p>
            <div className="ana-logout-confirm-buttons">
              <button className="ana-logout-cancel-btn" onClick={cancelLogout}>
                Cancel
              </button>
              <button className="ana-logout-confirm-btn" onClick={handleLogout}>
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile sidebar overlay */}
      {isMobile && isSidebarOpen && (
        <div
          className="ana-sidebar-overlay active"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <nav className={`ana-sidebar ${isSidebarOpen ? "open" : "closed"}`}>
        <div className="ana-sidebar-header">
          <FaTools className="ana-logo-icon" />
          <span className="ana-logo-text">HireMe Admin</span>
          {isMobile && (
            <button
              className="ana-sidebar-toggle"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <FaTimes />
            </button>
          )}
        </div>

        <div className="ana-sidebar-menu">
          <button
            className="ana-back-btn"
            onClick={() => navigate("/admin/dashboard")}
          >
            <FaArrowLeft />
            <span>Back to Dashboard</span>
          </button>
        </div>

        <div className="ana-sidebar-footer">
          <div className="ana-user-profile-sidebar">
            <FaUserCircle className="ana-avatar" />
            <div className="ana-user-info">
              <span className="ana-user-name">Administrator</span>
              <span className="ana-user-role">Analytics View</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="ana-main-content">
        <header className="ana-top-bar">
          <div className="ana-header-left">
            {isMobile && (
              <button
                className="ana-mobile-menu-toggle"
                onClick={toggleSidebar}
                aria-label="Toggle menu"
              >
                <FaBars />
              </button>
            )}
            <h1 className="ana-page-title">
              <FaChartLine className="ana-title-icon" />
              Analytics Dashboard
            </h1>
          </div>

          <div className="ana-header-right">
            <div className="ana-view-mode">
              <FaEye />
              <span>View Only</span>
            </div>
            <button
              className="ana-logout-btn"
              onClick={handleLogoutClick}
              title="Logout"
              aria-label="Logout"
            >
              <FaSignOutAlt />
            </button>
          </div>
        </header>

        <div className="ana-dashboard-content">
          {/* Header Stats */}
          <div className="ana-stats-overview">
            <div className="ana-stat-card">
              <div className="ana-stat-icon revenue">
                <FaFileInvoiceDollar />
              </div>
              <div className="ana-stat-info">
                <h3>Total Revenue</h3>
                <p className="ana-stat-number">
                  ${analyticsData.kpis.totalRevenue.toLocaleString()}
                </p>
                <div className="ana-trend positive">
                  <FaArrowUp />
                  <span>{analyticsData.kpis.monthlyGrowth}</span>
                </div>
              </div>
            </div>

            <div className="ana-stat-card">
              <div className="ana-stat-icon services-">
                <FaTools />
              </div>
              <div className="ana-stat-info">
                <h3>Active Services</h3>
                <p className="ana-stat-number">
                  {analyticsData.kpis.activeServices}
                </p>
                <div className="ana-trend positive">
                  <FaArrowUp />
                  <span>+8.7%</span>
                </div>
              </div>
            </div>

            <div className="ana-stat-card">
              <div className="ana-stat-icon users">
                <FaUsers />
              </div>
              <div className="ana-stat-info">
                <h3>Total Users</h3>
                <p className="ana-stat-number">
                  {analyticsData.kpis.totalUsers}
                </p>
                <div className="ana-trend positive">
                  <FaArrowUp />
                  <span>{analyticsData.kpis.monthlyGrowth}</span>
                </div>
              </div>
            </div>

            <div className="ana-stat-card">
              <div className="ana-stat-icon time">
                <FaClock />
              </div>
              <div className="ana-stat-info">
                <h3>Avg Response Time</h3>
                <p className="ana-stat-number">2.4h</p>
                <div className="ana-trend negative">
                  <FaArrowDown />
                  <span>-5.1%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="ana-charts-grid">
            {/* Revenue Trend Chart */}
            <div className="ana-chart-card large">
              <div className="ana-chart-header">
                <h3>Revenue & Services Trend</h3>
                <p>Monthly performance overview</p>
              </div>
              <div
                style={{
                  width: "100%",
                  height: "300px",
                  background: "rgba(0,0,0,0.1)",
                  border: "1px solid #FFD700",
                }}
              >
                <AreaChart
                  width={800}
                  height={300}
                  data={analyticsData.revenueByMonth}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <defs>
                    <linearGradient
                      id="revenueGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#FFD700" stopOpacity={0.8} />
                      <stop
                        offset="95%"
                        stopColor="#FFD700"
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#666"
                    strokeOpacity={1}
                  />
                  <XAxis
                    dataKey="month"
                    stroke="#ccc"
                    tick={{ fill: "#ccc", fontSize: 12 }}
                  />
                  <YAxis stroke="#ccc" tick={{ fill: "#ccc", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1a1a",
                      border: "2px solid #FFD700",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#FFD700"
                    strokeWidth={4}
                    fillOpacity={1}
                    fill="url(#revenueGradient)"
                  />
                </AreaChart>
              </div>
            </div>{" "}
            {/* Services by Type Pie Chart */}
            <div className="ana-chart-card">
              <div className="ana-chart-header">
                <h3>Services by Type</h3>
                <p>Distribution breakdown</p>
              </div>
              <div
                style={{
                  width: "100%",
                  height: "300px",
                  background: "rgba(0,0,0,0.1)",
                  border: "1px solid #FFD700",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <PieChart
                  width={400}
                  height={300}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <Pie
                    data={analyticsData.servicesByType}
                    cx={200}
                    cy={150}
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    stroke="#fff"
                    strokeWidth={2}
                  >
                    {analyticsData.servicesByType.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="#fff"
                        strokeWidth={1}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1a1a",
                      border: "2px solid #FFD700",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                </PieChart>
              </div>
            </div>
            {/* User Growth Chart */}
            <div className="ana-chart-card">
              <div className="ana-chart-header">
                <h3>User Growth</h3>
                <p>Service needers vs providers</p>
              </div>
              <div
                style={{
                  width: "100%",
                  height: "300px",
                  background: "rgba(0,0,0,0.1)",
                  border: "1px solid #FFD700",
                }}
              >
                <LineChart
                  width={800}
                  height={300}
                  data={analyticsData.userGrowth}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="month" stroke="#ccc" />
                  <YAxis stroke="#ccc" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1a1a",
                      border: "1px solid #FFD700",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="serviceNeeders"
                    stroke="#4ECDC4"
                    strokeWidth={3}
                    name="Service Needers"
                  />
                  <Line
                    type="monotone"
                    dataKey="providers"
                    stroke="#FF6B6B"
                    strokeWidth={3}
                    name="Providers"
                  />
                </LineChart>
              </div>
            </div>
            {/* Service Status Distribution */}
            {/* <div className="ana-chart-card">
              <div className="ana-chart-header">
                <h3>Service Status</h3>
                <p>Current status distribution</p>
              </div>
              <div
                style={{
                  width: "100%",
                  height: "300px",
                  background: "rgba(0,0,0,0.1)",
                  border: "1px solid #FFD700",
                }}
              >
                <BarChart
                  width={800}
                  height={300}
                  data={analyticsData.serviceStatus}
                  layout="horizontal"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis type="number" stroke="#ccc" />
                  <YAxis dataKey="name" type="category" stroke="#ccc" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1a1a",
                      border: "1px solid #FFD700",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="value">
                    {analyticsData.serviceStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </div>
            </div> */}
            {/* Top Providers Performance */}
            <div className="ana-chart-card large">
              <div className="ana-chart-header">
                <h3>Top Provider Performance</h3>
                <p>Services completed vs revenue generated</p>
              </div>
              <div
                style={{
                  width: "100%",
                  height: "300px",
                  background: "rgba(0,0,0,0.1)",
                  border: "1px solid #FFD700",
                }}
              >
                <BarChart
                  width={800}
                  height={300}
                  data={analyticsData.providerPerformance}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="name" stroke="#ccc" />
                  <YAxis stroke="#ccc" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1a1a1a",
                      border: "1px solid #FFD700",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="completed"
                    fill="#4ECDC4"
                    name="Services Completed"
                  />
                  <Bar
                    dataKey="revenue"
                    fill="#FFD700"
                    name="Revenue ($100s)"
                  />
                </BarChart>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminAnalytics;
