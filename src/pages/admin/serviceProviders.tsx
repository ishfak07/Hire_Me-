import React, { useState, useEffect } from "react";
import { FaCheck, FaTimes, FaSpinner, FaArrowLeft, FaSearch, FaUserCog } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./serviceProviders.css";

interface ProviderRequest {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  serviceType: string[];
  experience: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  serviceArea: string;
  availableDays: string[];
  timeFrom: string;
  timeTo: string;
  approvedAt?: string;
  rejectedAt?: string;
  serviceFee: number;
}

interface ProviderDetailsModalProps {
  provider: ProviderRequest | null;
  onClose: () => void;
  onStatusChange?: (providerId: string, status: "approved" | "rejected") => Promise<void>;
}

const ProviderDetailsModal: React.FC<ProviderDetailsModalProps> = ({ 
  provider, 
  onClose, 
  onStatusChange 
}) => {
  if (!provider) return null;
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-with-icon">
            <FaUserCog />
            <h2>{provider.fullName}</h2>
          </div>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="detail-row">
            <span className="detail-label">Status:</span>
            <span className={`status-badge ${provider.status}`}>
              {provider.status === "pending" && <FaSpinner className="spinning" />}
              {provider.status.charAt(0).toUpperCase() + provider.status.slice(1)}
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Email:</span>
            <span>{provider.email}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Phone:</span>
            <span>{provider.phoneNumber}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Service Fee:</span>
            <span className="price-tag">LKR {provider.serviceFee}/hr</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Services Offered:</span>
            <span>{provider.serviceType.join(", ")}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Service Area:</span>
            <span>{provider.serviceArea}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Experience:</span>
            <span>{provider.experience}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Availability:</span>
            <span>{provider.availableDays.join(", ")}, {provider.timeFrom} - {provider.timeTo}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Application Date:</span>
            <span>{new Date(provider.createdAt).toLocaleDateString()}</span>
          </div>
          {provider.approvedAt && (
            <div className="detail-row">
              <span className="detail-label">Date Approved:</span>
              <span>{new Date(provider.approvedAt).toLocaleDateString()}</span>
            </div>
          )}
          {provider.rejectedAt && (
            <div className="detail-row">
              <span className="detail-label">Date Rejected:</span>
              <span>{new Date(provider.rejectedAt).toLocaleDateString()}</span>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="secondary-btn" onClick={onClose}>Close</button>
          {provider.status === "pending" && onStatusChange && (
            <>
              <button 
                className="approve-btn" 
                onClick={() => onStatusChange(provider._id, "approved")}
              >
                <FaCheck /> Approve Provider
              </button>
              <button 
                className="reject-btn" 
                onClick={() => onStatusChange(provider._id, "rejected")}
              >
                <FaTimes /> Reject Provider
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const ServiceProviders: React.FC = () => {
  const navigate = useNavigate();
  const [pendingRequests, setPendingRequests] = useState<ProviderRequest[]>([]);
  const [approvedProviders, setApprovedProviders] = useState<ProviderRequest[]>([]);
  const [rejectedProviders, setRejectedProviders] = useState<ProviderRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected">("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<ProviderRequest | null>(null);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setLoading(true);
        const [pendingResponse, approvedResponse, rejectedResponse] =
          await Promise.all([
            axios.get("http://localhost:5000/api/service-providers/all"),
            axios.get("http://localhost:5000/api/service-providers/approved"),
            axios.get("http://localhost:5000/api/service-providers/rejected"),
          ]);

        setPendingRequests(
          pendingResponse.data.map((provider: any) => ({
            ...provider,
            status: "pending" as const,
          }))
        );

        setApprovedProviders(
          approvedResponse.data.map((provider: any) => ({
            ...provider,
            status: "approved" as const,
          }))
        );

        setRejectedProviders(
          rejectedResponse.data.map((provider: any) => ({
            ...provider,
            status: "rejected" as const,
          }))
        );

        setError(null);
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to fetch service providers";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, []);

  const handleStatusChange = async (
    requestId: string,
    newStatus: "approved" | "rejected"
  ) => {
    try {
      if (newStatus === "approved") {
        await axios.put(
          `http://localhost:5000/api/service-providers/approve/${requestId}`
        );

        const approvedProvider = pendingRequests.find(
          (req) => req._id === requestId
        );
        if (approvedProvider) {
          setPendingRequests((requests) =>
            requests.filter((req) => req._id !== requestId)
          );
          setApprovedProviders((providers) => [
            {
              ...approvedProvider,
              status: "approved",
              approvedAt: new Date().toISOString(),
            },
            ...providers,
          ]);
        }
        
        // Close modal if the current selected provider is the one being approved
        if (selectedProvider && selectedProvider._id === requestId) {
          setSelectedProvider(null);
        }

        alert("Service provider approved successfully!");
      } else {
        await axios.put(
          `http://localhost:5000/api/service-providers/reject/${requestId}`
        );

        const rejectedProvider = pendingRequests.find(
          (req) => req._id === requestId
        );
        if (rejectedProvider) {
          setPendingRequests((requests) =>
            requests.filter((req) => req._id !== requestId)
          );
          setRejectedProviders((providers) => [
            {
              ...rejectedProvider,
              status: "rejected",
              rejectedAt: new Date().toISOString(),
            },
            ...providers,
          ]);
        }
        
        // Close modal if the current selected provider is the one being rejected
        if (selectedProvider && selectedProvider._id === requestId) {
          setSelectedProvider(null);
        }

        alert("Service provider rejected successfully!");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to update service provider status"
      );
    }
  };

  const getProviders = () => {
    switch (filter) {
      case "approved":
        return approvedProviders;
      case "rejected":
        return rejectedProviders;
      case "pending":
      default:
        return pendingRequests;
    }
  };

  const filteredProviders = getProviders().filter(provider => 
    provider.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    provider.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    provider.serviceType.some(service => 
      service.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleViewDetails = (provider: ProviderRequest) => {
    setSelectedProvider(provider);
  };

  const closeModal = () => {
    setSelectedProvider(null);
  };

  return (
    <div className="provider-reqs-container">
      <header className="providers-header">
        <div className="header-left">
          <button className="back-button" onClick={() => navigate("/admin/dashboard")}>
            <FaArrowLeft />
          </button>
          <h1>Service Provider Management</h1>
        </div>
        <div className="providers-summary">
          <div className="summary-item">
            <span className="summary-value">{getProviders().length}</span>
            <span className="summary-label">{filter} Providers</span>
          </div>
        </div>
      </header>

      <div className="controls-section">
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === "pending" ? "active" : ""}`}
            onClick={() => setFilter("pending")}
          >
            Pending
          </button>
          <button
            className={`filter-btn ${filter === "approved" ? "active" : ""}`}
            onClick={() => setFilter("approved")}
          >
            Approved
          </button>
          <button
            className={`filter-btn ${filter === "rejected" ? "active" : ""}`}
            onClick={() => setFilter("rejected")}
          >
            Rejected
          </button>
        </div>
        
        <div className="search-filter-container">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by name, email or service..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading service providers...</p>
        </div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : filteredProviders.length === 0 ? (
        <div className="no-data-message">
          {searchTerm ? 
            `No results found for "${searchTerm}". Try a different search term.` : 
            `No ${filter} service providers found.`}
        </div>
      ) : (
        <div className="requests-grid">
          {filteredProviders.map((provider) => (
            <div key={provider._id} className="request-card">
              <div className="request-header">
                <h3>{provider.fullName}</h3>
                <span className={`status-badge ${provider.status}`}>
                  {provider.status === "pending" && <FaSpinner className="spinning" />}
                  {provider.status.charAt(0).toUpperCase() + provider.status.slice(1)}
                </span>
              </div>
              <div className="request-details">
                <p>
                  <span className="label">Email:</span>
                  <span className="value">{provider.email}</span>
                </p>
                <p>
                  <span className="label">Services:</span>
                  <span className="value">{provider.serviceType.join(", ")}</span>
                </p>
                <p>
                  <span className="label">Service Fee:</span>
                  <span className="value price-tag">LKR {provider.serviceFee}/hr</span>
                </p>
                <p>
                  <span className="label">Area:</span>
                  <span className="value">{provider.serviceArea}</span>
                </p>
                <p>
                  <span className="label">Application Date:</span>
                  <span className="value">{new Date(provider.createdAt).toLocaleDateString()}</span>
                </p>
              </div>
              <div className="card-footer">
                <button 
                  className="view-details-btn" 
                  onClick={() => handleViewDetails(provider)}
                >
                  View Details
                </button>
                {provider.status === "pending" && (
                  <div className="action-buttons">
                    <button
                      className="approve-btn"
                      onClick={() => handleStatusChange(provider._id, "approved")}
                    >
                      <FaCheck /> Approve
                    </button>
                    <button
                      className="reject-btn"
                      onClick={() => handleStatusChange(provider._id, "rejected")}
                    >
                      <FaTimes /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Provider Details Modal */}
      {selectedProvider && (
        <ProviderDetailsModal
          provider={selectedProvider}
          onClose={closeModal}
          onStatusChange={selectedProvider.status === "pending" ? handleStatusChange : undefined}
        />
      )}
    </div>
  );
};

export default ServiceProviders;