import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import {
  FaArrowLeft,
  FaChartBar,
  FaChartLine,
  FaDownload,
  FaFileAlt,
  FaMapMarkerAlt,
  FaRedo,
  FaUsers,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
// @ts-expect-error - html2pdf.js doesn't have TypeScript definitions
import html2pdf from "html2pdf.js";
import "./reports.css";

const API_BASE_URL = "http://localhost:5000/api";

interface RevenueData {
  month: string;
  revenue: number;
  services: number;
}

interface ServiceTypeData {
  name: string;
  value: number;
  color: string;
}

interface LocationData {
  location: string;
  count: number;
  revenue: number;
}

interface TopPerformer {
  id: string;
  name: string;
  servicesCompleted: number;
  totalRevenue: number;
  rating?: number;
}

interface ServiceData {
  _id: string;
  serviceDetails: {
    totalFee: number;
    location?: string;
    serviceType: string;
  };
  serviceProvider: {
    id: string;
    name: string;
  };
  serviceNeeder?: {
    id: string;
    name: string;
  };
  createdAt: string;
  completedAt?: string;
}

const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const reportRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [serviceTypeData, setServiceTypeData] = useState<ServiceTypeData[]>([]);
  const [locationData, setLocationData] = useState<LocationData[]>([]);
  const [topProviders, setTopProviders] = useState<TopPerformer[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopPerformer[]>([]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  useEffect(() => {
    const fetchReportsData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch analytics data
        const analyticsResponse = await axios.get(
          `${API_BASE_URL}/analytics/dashboard`
        );
        const analyticsData = analyticsResponse.data;

        // Set revenue data
        setRevenueData(analyticsData.revenueByMonth || []);

        // Set service type data
        setServiceTypeData(analyticsData.servicesByType || []);

        // Fetch additional data for reports
        const [, , completedServicesResponse, ,] = await Promise.all([
          axios.get(`${API_BASE_URL}/service-needers/all`),
          axios.get(`${API_BASE_URL}/service-providers/approved`),
          axios.get(`${API_BASE_URL}/service-requests/completed-services`),
          axios.get(`${API_BASE_URL}/service-requests/all`),
        ]);

        const completedServices = completedServicesResponse.data;

        // Calculate location data
        const locationMap = new Map<
          string,
          { count: number; revenue: number }
        >();
        completedServices.forEach((service: ServiceData) => {
          const location = service.serviceDetails?.location || "Unknown";
          const revenue = service.serviceDetails?.totalFee || 0;

          if (locationMap.has(location)) {
            const current = locationMap.get(location)!;
            locationMap.set(location, {
              count: current.count + 1,
              revenue: current.revenue + revenue,
            });
          } else {
            locationMap.set(location, { count: 1, revenue });
          }
        });

        const locationDataArray = Array.from(locationMap.entries())
          .map(([location, data]) => ({
            location,
            count: data.count,
            revenue: data.revenue,
          }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 10);

        setLocationData(locationDataArray);

        // Calculate top performers (providers)
        const providerMap = new Map<
          string,
          { count: number; revenue: number; name: string }
        >();
        completedServices.forEach((service: ServiceData) => {
          const providerId = service.serviceProvider?.id || "unknown";
          const providerName = service.serviceProvider?.name || "Unknown";
          const revenue = service.serviceDetails?.totalFee || 0;

          if (providerId && providerMap.has(providerId)) {
            const current = providerMap.get(providerId)!;
            providerMap.set(providerId, {
              count: current.count + 1,
              revenue: current.revenue + revenue,
              name: providerName,
            });
          } else if (providerId) {
            providerMap.set(providerId, {
              count: 1,
              revenue,
              name: providerName,
            });
          }
        });

        const topProvidersArray = Array.from(providerMap.entries())
          .map(([id, data]) => ({
            id,
            name: data.name,
            servicesCompleted: data.count,
            totalRevenue: data.revenue,
          }))
          .sort((a, b) => b.totalRevenue - a.totalRevenue)
          .slice(0, 10);

        setTopProviders(topProvidersArray);

        // Calculate top customers
        const customerMap = new Map<
          string,
          { count: number; revenue: number; name: string }
        >();
        completedServices.forEach((service: ServiceData) => {
          const customerId = service.serviceNeeder?.id || "unknown";
          const customerName = service.serviceNeeder?.name || "Unknown";
          const revenue = service.serviceDetails?.totalFee || 0;

          if (customerId && customerMap.has(customerId)) {
            const current = customerMap.get(customerId)!;
            customerMap.set(customerId, {
              count: current.count + 1,
              revenue: current.revenue + revenue,
              name: customerName,
            });
          } else if (customerId) {
            customerMap.set(customerId, {
              count: 1,
              revenue,
              name: customerName,
            });
          }
        });

        const topCustomersArray = Array.from(customerMap.entries())
          .map(([id, data]) => ({
            id,
            name: data.name,
            servicesCompleted: data.count,
            totalRevenue: data.revenue,
          }))
          .sort((a, b) => b.totalRevenue - a.totalRevenue)
          .slice(0, 10);

        setTopCustomers(topCustomersArray);
      } catch (err) {
        console.error("Error fetching reports data:", err);
        setError("Failed to load reports data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    const token = localStorage.getItem("adminToken");
    if (!token) {
      navigate("/admin");
    } else {
      fetchReportsData();
    }
  }, [navigate]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  const handleDownloadReport = async () => {
    if (!reportRef.current || isGeneratingPDF) return;

    setIsGeneratingPDF(true);

    try {
      const element = reportRef.current;

      // PDF options for better quality and color preservation
      const options = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: `hireme-reports-${
          new Date().toISOString().split("T")[0]
        }.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#121212",
          logging: false,
          letterRendering: true,
          removeContainer: true,
        },
        jsPDF: {
          unit: "in",
          format: "a4",
          orientation: "portrait",
          compress: true,
        },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      };

      // Generate PDF
      await html2pdf().set(options).from(element).save();
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (loading) {
    return (
      <div className="reports-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reports-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="reports-container">
      <header className="reports-header">
        <div className="header-left">
          <button
            className="back-button"
            onClick={() => navigate("/admin/dashboard")}
          >
            <FaArrowLeft />
          </button>
          <div className="header-title">
            <h1>Reports & Analytics</h1>
            <p>Comprehensive business insights and performance metrics</p>
          </div>
        </div>
        <div className="header-actions">
          <button
            className={`action-btn download-btn ${
              isGeneratingPDF ? "generating" : ""
            }`}
            onClick={handleDownloadReport}
            disabled={isGeneratingPDF}
          >
            <FaDownload />{" "}
            {isGeneratingPDF ? "Generating PDF..." : "Download PDF"}
          </button>
          <button
            className="action-btn refresh-btn"
            onClick={() => window.location.reload()}
          >
            <FaRedo /> Refresh
          </button>
        </div>
      </header>

      <div ref={reportRef} className="reports-content">
        {/* Revenue Trend */}
        <div className="chart-section">
          <h2>Revenue Trend</h2>
          <div className="chart-container">
            <div className="revenue-chart">
              {revenueData.length > 0 ? (
                <div className="chart-bars">
                  {revenueData.map((data, index) => {
                    const maxRevenue = Math.max(
                      ...revenueData.map((d) => d.revenue)
                    );
                    const height =
                      maxRevenue > 0 ? (data.revenue / maxRevenue) * 200 : 0;
                    return (
                      <div key={index} className="bar-container">
                        <div
                          className="revenue-bar"
                          style={{ height: `${height}px` }}
                          title={`${data.month}: ${formatCurrency(
                            data.revenue
                          )}`}
                        />
                        <span className="bar-label">{data.month}</span>
                        <span className="bar-value">
                          {formatCurrency(data.revenue)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="no-data">
                  <FaChartBar />
                  <p>No revenue data available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Service Types Distribution */}
        <div className="chart-section">
          <h2>Service Types Distribution</h2>
          <div className="chart-container">
            {serviceTypeData.length > 0 ? (
              <div className="service-types-chart">
                {serviceTypeData.map((service, index) => {
                  const total = serviceTypeData.reduce(
                    (sum, s) => sum + s.value,
                    0
                  );
                  const percentage =
                    total > 0 ? ((service.value / total) * 100).toFixed(1) : 0;
                  return (
                    <div key={index} className="service-type-item">
                      <div
                        className="service-color"
                        style={{ backgroundColor: service.color }}
                      />
                      <div className="service-info">
                        <span className="service-name">{service.name}</span>
                        <span className="service-stats">
                          {service.value} services ({percentage}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="no-data">
                <FaChartBar />
                <p>No service type data available</p>
              </div>
            )}
          </div>
        </div>

        <div className="reports-grid">
          {/* Top Locations */}
          <div className="report-section">
            <h2>
              <FaMapMarkerAlt /> Top Service Locations
            </h2>
            <div className="table-container">
              {locationData.length > 0 ? (
                <table className="reports-table">
                  <thead>
                    <tr>
                      <th>Location</th>
                      <th>Services</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {locationData.map((location, index) => (
                      <tr key={index}>
                        <td>{location.location}</td>
                        <td>{formatNumber(location.count)}</td>
                        <td>{formatCurrency(location.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="no-data">
                  <p>No location data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Top Service Providers */}
          <div className="report-section">
            <h2>
              <FaChartLine /> Top Service Providers
            </h2>
            <div className="table-container">
              {topProviders.length > 0 ? (
                <table className="reports-table">
                  <thead>
                    <tr>
                      <th>Provider</th>
                      <th>Services</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProviders.map((provider, index) => (
                      <tr key={provider.id}>
                        <td>
                          <div className="performer-info">
                            <span className="rank">#{index + 1}</span>
                            <span className="name">{provider.name}</span>
                          </div>
                        </td>
                        <td>{formatNumber(provider.servicesCompleted)}</td>
                        <td>{formatCurrency(provider.totalRevenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="no-data">
                  <p>No provider data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Top Customers */}
          <div className="report-section">
            <h2>
              <FaUsers /> Top Customers
            </h2>
            <div className="table-container">
              {topCustomers.length > 0 ? (
                <table className="reports-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Services</th>
                      <th>Spent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topCustomers.map((customer, index) => (
                      <tr key={customer.id}>
                        <td>
                          <div className="performer-info">
                            <span className="rank">#{index + 1}</span>
                            <span className="name">{customer.name}</span>
                          </div>
                        </td>
                        <td>{formatNumber(customer.servicesCompleted)}</td>
                        <td>{formatCurrency(customer.totalRevenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="no-data">
                  <p>No customer data available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="reports-footer">
          <div className="footer-info">
            <FaFileAlt />
            <p>
              Report generated on {new Date().toLocaleString()} |{" "}
              <span>HireMe Admin Dashboard</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
