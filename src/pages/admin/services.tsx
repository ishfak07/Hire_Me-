import React, { useState, useEffect } from "react";
import {
  FaArrowLeft,
  FaEye,
  FaMapMarkerAlt,
  FaRegCalendarAlt,
  FaSearch,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./services.css";

// Interface to match backend data structure
interface Service {
  _id: string;
  serviceDetails: {
    serviceType: string;
    totalFee: number;
    location?: string;
    date?: string;
    description?: string;
  };
  serviceProvider: {
    name: string;
    id: string;
  };
  serviceNeeder?: {
    name: string;
    id: string;
  };
  status: string;
  createdAt: string;
  acceptedAt?: string;
}

// Interface for frontend display
interface FormattedService {
  id: string;
  name: string;
  category: string;
  price: number;
  status: "requested" | "approved" | "rejected";
  createdAt: string;
  providerName: string;
  neederName?: string;
  location?: string;
  date?: string;
  description?: string;
}

interface ServiceDetailsModalProps {
  service: FormattedService | null;
  onClose: () => void;
}

const API_BASE_URL = "http://localhost:5000/api";

// Service Details Modal Component
const ServiceDetailsModal: React.FC<ServiceDetailsModalProps> = ({
  service,
  onClose,
}) => {
  if (!service) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{service.name}</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="detail-row">
            <span className="detail-label">Status:</span>
            <span className={`status-badge ${service.status}`}>
              {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Category:</span>
            <span>{service.category}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Price:</span>
            <span className="price-tag">${service.price.toFixed(2)}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Service Provider:</span>
            <span>{service.providerName}</span>
          </div>
          {service.neederName && (
            <div className="detail-row">
              <span className="detail-label">Customer:</span>
              <span>{service.neederName}</span>
            </div>
          )}
          {service.location && (
            <div className="detail-row">
              <span className="detail-label">
                <FaMapMarkerAlt /> Location:
              </span>
              <span>{service.location}</span>
            </div>
          )}
          {service.date && (
            <div className="detail-row">
              <span className="detail-label">
                <FaRegCalendarAlt /> Scheduled Date:
              </span>
              <span>{service.date}</span>
            </div>
          )}
          <div className="detail-row">
            <span className="detail-label">Created On:</span>
            <span>{new Date(service.createdAt).toLocaleString()}</span>
          </div>
          {service.description && (
            <div className="detail-description">
              <h3>Description</h3>
              <p>{service.description}</p>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="secondary-btn" onClick={onClose}>
            Close
          </button>
          {/* {service.status === "requested" && (
            <>
              <button className="approve-btn">Approve Request</button>
              <button className="reject-btn">Reject Request</button>
            </>
          )} */}
        </div>
      </div>
    </div>
  );
};

const ServicesPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    "requested" | "approved" | "rejected"
  >("requested");
  const [services, setServices] = useState<FormattedService[]>([]);
  const [filteredServices, setFilteredServices] = useState<FormattedService[]>(
    []
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedService, setSelectedService] =
    useState<FormattedService | null>(null);

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      setError(null);
      try {
        let endpoint = "";

        // Select the appropriate endpoint based on active tab
        switch (activeTab) {
          case "requested":
            endpoint = `${API_BASE_URL}/service-requests`;
            break;
          case "approved":
            endpoint = `${API_BASE_URL}/service-requests/approved`;
            break;
          case "rejected":
            endpoint = `${API_BASE_URL}/service-requests/rejected`;
            break;
        }

        const response = await axios.get(endpoint);
        console.log("Raw service data:", response.data);
        const formattedServices = formatServicesData(response.data, activeTab);
        console.log("Formatted services:", formattedServices);
        setServices(formattedServices);
        setFilteredServices(formattedServices);
      } catch (error) {
        console.error("Error fetching services:", error);
        setError("Failed to fetch services. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, [activeTab]);

  // Effect to filter services based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredServices(services);
      console.log("Showing all services:", services.length);
    } else {
      const searchTermLower = searchTerm.toLowerCase();
      const filtered = services.filter(
        (service) =>
          service.name.toLowerCase().includes(searchTermLower) ||
          service.providerName.toLowerCase().includes(searchTermLower) ||
          (service.neederName &&
            service.neederName.toLowerCase().includes(searchTermLower))
      );
      console.log(`Filtered services for "${searchTerm}":`, filtered.length);
      setFilteredServices(filtered);
    }
  }, [searchTerm, services]);

  // Format the data from backend to match our frontend requirements
  const formatServicesData = (
    data: Service[],
    status: "requested" | "approved" | "rejected"
  ): FormattedService[] => {
    if (!Array.isArray(data)) {
      console.error("Expected array but received:", data);
      return [];
    }

    return data.map((service) => ({
      id: service._id,
      name: service.serviceDetails.serviceType,
      category: service.serviceDetails.serviceType.split(" ")[0],
      price: service.serviceDetails.totalFee,
      status: status,
      createdAt: service.createdAt
        ? new Date(service.createdAt).toISOString().split("T")[0]
        : service.acceptedAt
        ? new Date(service.acceptedAt).toISOString().split("T")[0]
        : "N/A",
      providerName: service.serviceProvider.name,
      neederName: service.serviceNeeder?.name,
      location: service.serviceDetails.location,
      date: service.serviceDetails.date,
      description: service.serviceDetails.description,
    }));
  };

  const handleViewDetails = (service: FormattedService) => {
    setSelectedService(service);
  };

  const closeModal = () => {
    setSelectedService(null);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    console.log("Search term updated:", value);
  };

  return (
    <div
      className={`services-container-1 ${
        filteredServices.length === 0 && !loading && !error
          ? "empty-background"
          : ""
      }`}
    >
      <header className="services-header-1">
        <div className="header-left-1">
          <button
            className="back-button-1"
            onClick={() => navigate("/admin/dashboard")}
          >
            <FaArrowLeft />
          </button>
          <h1>Service Management</h1>
        </div>
        <div className="services-summary">
          <div className="summary-item">
            <span className="summary-value">{services.length}</span>
            <span className="summary-label">{activeTab} Services</span>
          </div>
        </div>
      </header>

      <div className="controls-section">
        <div className="tabs-1">
          <button
            className={`tab-1 ${activeTab === "requested" ? "active" : ""}`}
            onClick={() => setActiveTab("requested")}
          >
            Requested
          </button>
          <button
            className={`tab-1 ${activeTab === "approved" ? "active" : ""}`}
            onClick={() => setActiveTab("approved")}
          >
            Approved
          </button>
          <button
            className={`tab-1 ${activeTab === "rejected" ? "active" : ""}`}
            onClick={() => setActiveTab("rejected")}
          >
            Rejected
          </button>
        </div>

        <div className="search-filter-container">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by service or provider name..."
              value={searchTerm}
              onChange={handleSearchChange}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading services...</p>
        </div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : filteredServices.length === 0 ? (
        <div className="no-services-1">
          {searchTerm ? (
            <>
              <p>
                No results found for <strong>"{searchTerm}"</strong>
              </p>
              <p>
                Try a different search term or clear the search to see all{" "}
                {activeTab} services.
              </p>
              <button
                onClick={() => setSearchTerm("")}
                className="clear-search-btn"
              >
                Clear Search
              </button>
            </>
          ) : (
            `No ${activeTab} services found.`
          )}
        </div>
      ) : (
        <div className="services-grid">
          {filteredServices.map((service) => (
            <div key={service.id} className="service-card">
              <div className="service-header">
                <h3>{service.name}</h3>
                <span className="service-category">{service.category}</span>
              </div>

              <div className="service-details">
                <p>
                  <span className="label">Provider</span>
                  <span className="value">{service.providerName}</span>
                </p>
                {activeTab !== "requested" && service.neederName && (
                  <p>
                    <span className="label">Customer</span>
                    <span className="value">{service.neederName}</span>
                  </p>
                )}
                <p>
                  <span className="label">Price</span>
                  <span className="value price-tag">
                    ${service.price.toFixed(2)}
                  </span>
                </p>
                {service.location && (
                  <p>
                    <span className="label">
                      <FaMapMarkerAlt /> Location
                    </span>
                    <span className="value">{service.location}</span>
                  </p>
                )}
                {service.date && (
                  <p>
                    <span className="label">
                      <FaRegCalendarAlt /> Date
                    </span>
                    <span className="value">{service.date}</span>
                  </p>
                )}
                <p>
                  <span className="label">Created</span>
                  <span className="value">
                    {new Date(service.createdAt).toLocaleDateString()}
                  </span>
                </p>
                <p>
                  <span className="label">Status</span>
                  <span className={`status-badge ${service.status}`}>
                    {service.status.charAt(0).toUpperCase() +
                      service.status.slice(1)}
                  </span>
                </p>
              </div>

              <div className="action-buttons">
                <button
                  className="view-btn"
                  onClick={() => handleViewDetails(service)}
                >
                  <FaEye /> View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Service Details Modal */}
      {selectedService && (
        <ServiceDetailsModal service={selectedService} onClose={closeModal} />
      )}
    </div>
  );
};

export default ServicesPage;