import React, { useEffect, useState } from "react";
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaClock,
  FaEnvelope,
  FaMapMarkerAlt,
  FaPhone,
  FaSpinner,
  FaTools,
  FaUser,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./allServiceProviders.css";

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
  serviceFee: number;
  approvedAt: string;
  createdAt: string;
}

const AllServiceProviders: React.FC = () => {
  const navigate = useNavigate();
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterServiceType, setFilterServiceType] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [sortBy, setSortBy] = useState("name"); // name, fee, experience

  useEffect(() => {
    const fetchAllServiceProviders = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/service-needer/login");
          return;
        }

        const response = await fetch(
          "http://localhost:5000/api/service-requests/all-service-providers",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch service providers");
        }

        const data = await response.json();
        console.log("Service providers data:", data);
        setProviders(data);
      } catch (error) {
        console.error("Error fetching service providers:", error);
        setError(
          error instanceof Error
            ? error.message
            : "An unexpected error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAllServiceProviders();
  }, [navigate]);

  const handleRetryFetch = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/service-needer/login");
        return;
      }

      const response = await fetch(
        "http://localhost:5000/api/service-requests/all-service-providers",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch service providers");
      }

      const data = await response.json();
      console.log("Service providers data:", data);
      setProviders(data);
      setError("");
    } catch (error) {
      console.error("Error fetching service providers:", error);
      setError(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  // Get unique service types for filter dropdown
  const uniqueServiceTypes = Array.from(
    new Set(providers.flatMap((provider) => provider.serviceType))
  ).sort();

  // Get unique locations for filter dropdown
  const uniqueLocations = Array.from(
    new Set(providers.map((provider) => provider.serviceArea))
  ).sort();

  // Filter and sort providers
  const filteredAndSortedProviders = providers
    .filter((provider) => {
      const matchesSearch = provider.fullName
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesServiceType =
        !filterServiceType || provider.serviceType.includes(filterServiceType);
      const matchesLocation =
        !filterLocation || provider.serviceArea === filterLocation;

      return matchesSearch && matchesServiceType && matchesLocation;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.fullName.localeCompare(b.fullName);
        case "fee":
          return a.serviceFee - b.serviceFee;
        case "experience":
          return parseInt(b.experience) - parseInt(a.experience);
        default:
          return 0;
      }
    });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="all-providers-container">
      {/* Navigation */}
      <nav className="all-providers-navbar">
        <div className="nav-left">
          <button
            className="back-btn"
            onClick={() => navigate("/book-service")}
          >
            <FaArrowLeft /> Back to Book Service
          </button>
        </div>
        <div className="nav-center">
          <h1>HireMe</h1>
        </div>
        <div className="nav-right">
          <button
            className="track-service-btn"
            onClick={() => navigate("/service-needer/track-service")}
          >
            Track Service
          </button>
          <button
            className="logout-btn"
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/service-needer/login");
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="all-providers-content">
        <div className="page-header">
          <h1>All Service Providers</h1>
          <p>Browse through all our verified and approved service providers</p>
        </div>

        {/* Filters and Search */}
        <div className="filters-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by provider name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-controls">
            <select
              value={filterServiceType}
              onChange={(e) => setFilterServiceType(e.target.value)}
            >
              <option value="">All Service Types</option>
              {uniqueServiceTypes.map((serviceType) => (
                <option key={serviceType} value={serviceType}>
                  {serviceType}
                </option>
              ))}
            </select>

            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
            >
              <option value="">All Locations</option>
              {uniqueLocations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>

            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="name">Sort by Name</option>
              <option value="fee">Sort by Fee (Low to High)</option>
              <option value="experience">Sort by Experience</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="results-info">
          <p>
            Showing {filteredAndSortedProviders.length} of {providers.length}{" "}
            service providers
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="loading-spinner">
            <FaSpinner className="spinner" />
            <p>Loading service providers...</p>
          </div>
        ) : error ? (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={handleRetryFetch}>Try Again</button>
          </div>
        ) : filteredAndSortedProviders.length === 0 ? (
          <div className="no-providers">
            <p>No service providers found matching your criteria.</p>
            <button
              onClick={() => {
                setSearchTerm("");
                setFilterServiceType("");
                setFilterLocation("");
              }}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="providers-grid">
            {filteredAndSortedProviders.map((provider) => (
              <div key={provider._id} className="provider-card">
                <div className="provider-header">
                  <div className="provider-name">
                    <FaUser className="provider-icon" />
                    <h3>{provider.fullName}</h3>
                  </div>
                </div>

                <div className="provider-details">
                  <div className="detail-row">
                    <FaTools className="detail-icon" />
                    <div className="detail-content">
                      <span className="detail-label">Services:</span>
                      <div className="service-tags">
                        {provider.serviceType.map((service, index) => (
                          <span key={index} className="service-tag">
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="detail-row">
                    <FaMapMarkerAlt className="detail-icon" />
                    <div className="detail-content">
                      <span className="detail-label">Service Area:</span>
                      <span className="detail-value">
                        {provider.serviceArea}
                      </span>
                    </div>
                  </div>

                  <div className="detail-row">
                    <FaClock className="detail-icon" />
                    <div className="detail-content">
                      <span className="detail-label">Working Hours:</span>
                      <span className="detail-value">
                        {provider.timeFrom} - {provider.timeTo}
                      </span>
                    </div>
                  </div>

                  <div className="detail-row">
                    <FaCalendarAlt className="detail-icon" />
                    <div className="detail-content">
                      <span className="detail-label">Available Days:</span>
                      <div className="days-tags">
                        {provider.availableDays.map((day, index) => (
                          <span key={index} className="day-tag">
                            {day}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
{/* // Uncomment if phone and email are available (mail and phone are not in the current context) */}
                 
                  {/* <div className="detail-row">
                    <FaPhone className="detail-icon" />
                    <div className="detail-content">
                      <span className="detail-label">Phone:</span>
                      <span className="detail-value">
                        {provider.phoneNumber}
                      </span>
                    </div>
                  </div> */}

                  {/* <div className="detail-row">
                    <FaEnvelope className="detail-icon" />
                    <div className="detail-content">
                      <span className="detail-label">Email:</span>
                      <span className="detail-value">{provider.email}</span>
                    </div>
                  </div> */}

                  <div className="provider-stats">
                    <div className="stat-item">
                      <span className="stat-label">Experience:</span>
                      <span className="stat-value">
                        {provider.experience} years
                      </span>
                    </div>
                    <div className="stat-item fee-highlight">
                      <span className="stat-label">Service Fee:</span>
                      <span className="stat-value">
                        LKR {provider.serviceFee}/hour
                      </span>
                    </div>
                  </div>

                  <div className="provider-footer">
                    <small className="approved-date">
                      Approved on {formatDate(provider.approvedAt)}
                    </small>
                    {/* <button
                      className="book-now-btn"
                      onClick={() => navigate("/book-service")}
                    >
                      Book Service
                    </button> */}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllServiceProviders;
