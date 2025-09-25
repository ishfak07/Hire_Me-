import React, { useState, useEffect } from "react";
import {
  FaArrowLeft,
  FaEye,
  FaMapMarkerAlt,
  FaRegCalendarAlt,
  FaSearch,
  FaEnvelope,
  FaPhone,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./customers.css";

// Updated interfaces based on your MongoDB models
interface ServiceNeeder {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  createdAt: string;
  servicesRequested?: number;
}

interface ServiceProvider {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  serviceArea: string;
  serviceType: string[];
  availableDays: string[];
  timeFrom: string;
  timeTo: string;
  approvedAt: string;
  experience: string;
  serviceFee: number;
  servicesProvided?: number;
}

// Combined interface for display
interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  registeredDate: string;
  type: "service-provider" | "service-needer";
  status: "active" | "inactive" | "pending";
  servicesRequested?: number;
  servicesProvided?: number;
  serviceType?: string[];
  experience?: string;
  serviceFee?: number;
  availableDays?: string[];
  timeFrom?: string;
  timeTo?: string;
}

interface CustomerDetailsModalProps {
  customer: Customer | null;
  onClose: () => void;
}

const API_BASE_URL = "http://localhost:5000/api";

// Customer Details Modal Component
const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({
  customer,
  onClose,
}) => {
  if (!customer) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{customer.name}</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="detail-row">
            <span className="detail-label">Status:</span>
            <span className={`status-badge ${customer.status}`}>
              {customer.status.charAt(0).toUpperCase() +
                customer.status.slice(1)}
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Type:</span>
            <span className="customer-type-badge">
              {customer.type === "service-provider"
                ? "Service Provider"
                : "Customer"}
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">
              <FaEnvelope /> Email:
            </span>
            <span>{customer.email}</span>
          </div>
          {customer.phone && (
            <div className="detail-row">
              <span className="detail-label">
                <FaPhone /> Phone:
              </span>
              <span>{customer.phone}</span>
            </div>
          )}
          {customer.location && (
            <div className="detail-row">
              <span className="detail-label">
                <FaMapMarkerAlt /> Location:
              </span>
              <span>{customer.location}</span>
            </div>
          )}
          <div className="detail-row">
            <span className="detail-label">
              <FaRegCalendarAlt /> Registered On:
            </span>
            <span>
              {new Date(customer.registeredDate).toLocaleDateString()}
            </span>
          </div>
          {customer.type === "service-needer" && (
            <div className="detail-row">
              <span className="detail-label">Services Requested:</span>
              <span>{customer.servicesRequested || 0}</span>
            </div>
          )}
          {customer.type === "service-provider" && (
            <>
              <div className="detail-row">
                <span className="detail-label">Services Provided:</span>
                <span>{customer.servicesProvided || 0}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Service Types:</span>
                <span>{customer.serviceType?.join(", ")}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Available Days:</span>
                <span>{customer.availableDays?.join(", ")}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Working Hours:</span>
                <span>
                  {customer.timeFrom} - {customer.timeTo}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Experience:</span>
                <span>{customer.experience}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Service Fee:</span>
                <span>${customer.serviceFee}</span>
              </div>
            </>
          )}
        </div>
        <div className="modal-footer">
          <button className="secondary-btn" onClick={onClose}>
            Close
          </button>
          {customer.status === "pending" && (
            <>
              <button className="approve-btn">Approve</button>
              <button className="reject-btn">Reject</button>
            </>
          )}
          {customer.status === "active" && (
            <button className="reject-btn">Deactivate</button>
          )}
          {customer.status === "inactive" && (
            <button className="approve-btn">Activate</button>
          )}
        </div>
      </div>
    </div>
  );
};

const CustomersPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    "service-provider" | "service-needer"
  >("service-needer");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );

  useEffect(() => {
    // Fetch data from the appropriate collection based on active tab
    const fetchCustomers = async () => {
      setLoading(true);
      setError(null);
      try {
        let endpoint = "";
        let transformedData: Customer[] = [];

        if (activeTab === "service-needer") {
          // Updated to use the correct backend route
          endpoint = `${API_BASE_URL}/service-needers/all`;

          const response = await axios.get(endpoint);

          // Transform the service needer data
          transformedData = response.data.map((item: ServiceNeeder) => ({
            _id: item._id,
            name: item.name,
            email: item.email,
            phone: item.phoneNumber,
            registeredDate: item.createdAt,
            type: "service-needer" as const,
            status: "active", // Assuming all service needers are active
            servicesRequested: item.servicesRequested || 0,
          }));
        } else {
          // Fixed endpoint to match your backend route structure
          endpoint = `${API_BASE_URL}/service-providers/approved`;

          const response = await axios.get(endpoint);

          // Transform the service provider data
          transformedData = response.data.map((item: ServiceProvider) => ({
            _id: item._id,
            name: item.fullName,
            email: item.email,
            phone: item.phoneNumber,
            location: item.serviceArea,
            registeredDate: item.approvedAt,
            type: "service-provider" as const,
            status: "active", // These are approved providers
            servicesProvided: item.servicesProvided || 0,
            serviceType: item.serviceType,
            availableDays: item.availableDays,
            timeFrom: item.timeFrom,
            timeTo: item.timeTo,
            experience: item.experience,
            serviceFee: item.serviceFee,
          }));
        }

        setCustomers(transformedData);
        setFilteredCustomers(transformedData);
        setLoading(false);
      } catch (error) {
        console.error(`Error fetching ${activeTab}:`, error);
        setError(
          `Failed to fetch ${
            activeTab === "service-needer" ? "customers" : "service providers"
          }. Please try again later.`
        );
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [activeTab]);

  
  // Effect to filter customers based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredCustomers(customers);
    } else {
      const searchTermLower = searchTerm.toLowerCase();
      const filtered = customers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchTermLower) ||
          customer.email.toLowerCase().includes(searchTermLower) ||
          (customer.phone && customer.phone.includes(searchTerm)) ||
          (customer.location &&
            customer.location.toLowerCase().includes(searchTermLower))
      );
      setFilteredCustomers(filtered);
    }
  }, [searchTerm, customers]);

  const handleViewDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
  };

  const closeModal = () => {
    setSelectedCustomer(null);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div
      className={`customers-container ${
        filteredCustomers.length === 0 && !loading && !error
          ? "empty-background"
          : ""
      }`}
    >
      <header className="customers-header">
        <div className="header-left">
          <button
            className="back-button"
            onClick={() => navigate("/admin/dashboard")}
          >
            <FaArrowLeft />
          </button>
          <h1>Customer Management</h1>
        </div>
        <div className="customers-summary">
          <div className="summary-item">
            <span className="summary-value">{customers.length}</span>
            <span className="summary-label">
              {activeTab === "service-needer"
                ? "Customers"
                : "Service Providers"}
            </span>
          </div>
        </div>
      </header>

      <div className="controls-section">
        <div className="tabs">
          <button
            className={`tab ${activeTab === "service-needer" ? "active" : ""}`}
            onClick={() => setActiveTab("service-needer")}
          >
            Service Needers
          </button>
          <button
            className={`tab ${
              activeTab === "service-provider" ? "active" : ""
            }`}
            onClick={() => setActiveTab("service-provider")}
          >
            Service Providers
          </button>
        </div>

        <div className="search-filter-container">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by name, email, phone..."
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
          <p>Loading customers...</p>
        </div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : filteredCustomers.length === 0 ? (
        <div className="no-customers">
          {searchTerm ? (
            <>
              <p>
                No results found for <strong>"{searchTerm}"</strong>
              </p>
              <p>
                Try a different search term or clear the search to see all
                customers.
              </p>
              <button
                onClick={() => setSearchTerm("")}
                className="clear-search-btn"
              >
                Clear Search
              </button>
            </>
          ) : (
            `No ${
              activeTab === "service-needer" ? "customers" : "service providers"
            } found.`
          )}
        </div>
      ) : (
        <div className="customers-grid">
          {filteredCustomers.map((customer) => (
            <div key={customer._id} className="customer-card">
              <div className="customer-header">
                <h3>{customer.name}</h3>
                <span className={`status-badge ${customer.status}`}>
                  {customer.status.charAt(0).toUpperCase() +
                    customer.status.slice(1)}
                </span>
              </div>

              <div className="customer-details">
                <p>
                  <span className="label">
                    <FaEnvelope /> Email
                  </span>
                  <span className="value">{customer.email}</span>
                </p>
                {customer.phone && (
                  <p>
                    <span className="label">
                      <FaPhone /> Phone
                    </span>
                    <span className="value">{customer.phone}</span>
                  </p>
                )}
                {customer.location && (
                  <p>
                    <span className="label">
                      <FaMapMarkerAlt /> Location
                    </span>
                    <span className="value">{customer.location}</span>
                  </p>
                )}
                <p>
                  <span className="label">
                    <FaRegCalendarAlt /> Registered
                  </span>
                  <span className="value">
                    {new Date(customer.registeredDate).toLocaleDateString()}
                  </span>
                </p>
                {customer.type === "service-needer" && (
                  <p>
                    <span className="label">Services Requested</span>
                    <span className="value">
                      {customer.servicesRequested || 0}
                    </span>
                  </p>
                )}
                {customer.type === "service-provider" && (
                  <>
                    <p>
                      <span className="label">Services Provided</span>
                      <span className="value">
                        {customer.servicesProvided || 0}
                      </span>
                    </p>
                    {customer.serviceFee && (
                      <p>
                        <span className="label">Service Fee</span>
                        <span className="value">${customer.serviceFee}</span>
                      </p>
                    )}
                  </>
                )}
              </div>

              <div className="action-buttons">
                <button
                  className="view-btn"
                  onClick={() => handleViewDetails(customer)}
                >
                  <FaEye /> View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <CustomerDetailsModal
          customer={selectedCustomer}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default CustomersPage;
