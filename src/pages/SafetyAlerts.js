import React, { useState, useEffect } from "react";
import { adminService } from "../services/adminService";
import {
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Phone,
  Calendar,
  User,
  Bike,
  Package,
} from "lucide-react";
import toast from "react-hot-toast";
import AdminDateFilter, { AdminCityFilter, getDateFilterParams } from "../components/AdminDateFilter";
import { useAdminCityFilter } from "../hooks/useAdminCityFilter";

const SafetyAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [actionInProgress, setActionInProgress] = useState({});

  const [dateFilter, setDateFilter] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const { cities, selectedCity, setSelectedCity, cityParams } = useAdminCityFilter();

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const filterParams = {
        ...getDateFilterParams(dateFilter, customStartDate, customEndDate),
        ...cityParams,
      };
      const data = await adminService.getSafetyAlerts(filterParams);
      setAlerts(data || []);
    } catch (error) {
      toast.error("Failed to fetch safety alerts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [dateFilter, customStartDate, customEndDate, selectedCity]);

  const handleResolve = async (id) => {
    setActionInProgress((prev) => ({ ...prev, [id]: true }));
    try {
      await adminService.resolveSafetyAlert(id);
      toast.success("Safety issue marked as resolved!");
      fetchAlerts();
    } catch (error) {
      toast.error(error.message || "Failed to resolve safety issue");
    } finally {
      setActionInProgress((prev) => ({ ...prev, [id]: false }));
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    const matchesTab = activeTab === "all" || alert.status === activeTab;
    const matchesSearch =
      alert._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (alert.reporter?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (alert.details || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (alert.ride?._id || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="content-area animate-fade-in">
      <div className="section-header">
        <div>
          <h2>Safety Center & SOS</h2>
          <p className="section-subtitle">
            Monitor and resolve safety concerns reported by customers or riders
          </p>
        </div>
        <button className="primary-btn icon-text-btn" onClick={fetchAlerts}>
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <AdminDateFilter
        filterType={dateFilter}
        setFilterType={setDateFilter}
        customStartDate={customStartDate}
        setCustomStartDate={setCustomStartDate}
        customEndDate={customEndDate}
        setCustomEndDate={setCustomEndDate}
        leadingContent={
          <AdminCityFilter
            cities={cities}
            selectedCity={selectedCity}
            setSelectedCity={setSelectedCity}
          />
        }
      />

      <div className="glass-panel" style={{ padding: "0.5rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {[
            { id: "all", label: "All Alerts" },
            { id: "Pending", label: "Pending" },
            { id: "Resolved", label: "Resolved" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "0.625rem 1.25rem",
                borderRadius: "var(--radius-md)",
                border: "none",
                background: activeTab === tab.id ? "var(--accent-primary)" : "transparent",
                color: activeTab === tab.id ? "white" : "var(--text-muted)",
                fontWeight: 500,
                fontSize: "0.875rem",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="search-bar-container glass-panel">
        <Search size={20} className="search-icon" />
        <input
          type="text"
          placeholder="Search by Alert ID, Reporter, Ride, or details..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="glass-panel" style={{ marginTop: "2rem", overflowX: "auto" }}>
        {loading ? (
          <div className="table-loader">Loading safety alerts...</div>
        ) : filteredAlerts.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            <AlertTriangle size={48} style={{ marginBottom: "1rem", color: "var(--accent-primary)" }} />
            <p>No safety alerts found.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Alert ID</th>
                <th>Ride Info</th>
                <th>Reporter</th>
                <th>Safety Concern</th>
                <th>Reported At</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlerts.map((alert) => (
                <tr key={alert._id}>
                  <td>
                    <div className="order-id-cell">
                      <span className="id-hash">#</span>
                      {alert._id.substring(alert._id.length - 6).toUpperCase()}
                    </div>
                  </td>
                  <td>
                    {alert.ride ? (
                      <div style={{ fontSize: "0.85rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: "bold" }}>
                          {alert.ride.type === "Ride" ? <Bike size={14} /> : <Package size={14} />}
                          <span>Ride #{alert.ride._id.substring(alert.ride._id.length - 6).toUpperCase()}</span>
                        </div>
                        <div style={{ color: "var(--text-muted)", marginTop: "0.25rem" }}>
                          Fare: PKR {alert.ride.fare} | Status: {alert.ride.status}
                        </div>
                      </div>
                    ) : (
                      <span style={{ color: "var(--text-muted)" }}>Unknown Ride</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 500 }}>
                        <User size={14} /> {alert.reporter?.name || "Unknown"}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        <Phone size={10} /> {alert.reporter?.phone || "N/A"}
                      </div>
                      <span
                        style={{
                          alignSelf: "flex-start",
                          fontSize: "0.7rem",
                          padding: "0.1rem 0.4rem",
                          borderRadius: "4px",
                          background: alert.reporter?.role === "rider" ? "rgba(79, 70, 229, 0.15)" : "rgba(16, 185, 129, 0.15)",
                          color: alert.reporter?.role === "rider" ? "#818CF8" : "#34D399",
                          textTransform: "capitalize",
                          fontWeight: "bold",
                        }}
                      >
                        {alert.reporter?.role}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div
                      style={{
                        maxWidth: "280px",
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                        fontSize: "0.85rem",
                        color: "var(--text-primary)",
                        backgroundColor: "rgba(239, 68, 68, 0.05)",
                        borderLeft: "3px solid #EF4444",
                        padding: "0.5rem",
                        borderRadius: "0 4px 4px 0",
                      }}
                    >
                      {alert.details}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      <Calendar size={12} /> {formatDate(alert.createdAt)}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`status-badge ${
                        alert.status === "Resolved" ? "status-delivered" : "status-cancelled"
                      }`}
                      style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
                    >
                      {alert.status === "Resolved" ? <CheckCircle size={12} /> : <AlertTriangle size={12} />}
                      {alert.status}
                    </span>
                  </td>
                  <td>
                    {alert.status === "Pending" ? (
                      <button
                        className="primary-btn icon-text-btn"
                        onClick={() => handleResolve(alert._id)}
                        disabled={actionInProgress[alert._id]}
                        style={{
                          backgroundColor: "#EF4444",
                          borderColor: "#EF4444",
                          padding: "0.4rem 0.8rem",
                          fontSize: "0.8rem",
                        }}
                      >
                        {actionInProgress[alert._id] ? (
                          <RefreshCw size={14} className="animate-spin" />
                        ) : (
                          "Resolve / Done"
                        )}
                      </button>
                    ) : (
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        Done by {alert.resolvedBy?.name || "Admin"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default SafetyAlerts;
