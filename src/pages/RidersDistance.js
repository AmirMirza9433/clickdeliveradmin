import React, { useState, useEffect } from "react";
import { adminService } from "../services/adminService";
import { Bike, Search, MapPin, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import AdminDateFilter, { getDateFilterParams } from "../components/AdminDateFilter";

const RidersDistance = () => {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const fetchRidersDistance = async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getDateFilterParams(
        dateFilter,
        customStartDate,
        customEndDate
      );
      
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const data = await adminService.getRidersDistance(params);
      setRiders(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load riders distance data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRidersDistance();
  }, [dateFilter, customStartDate, customEndDate]);

  const filteredRiders = riders.filter((rider) =>
    rider.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rider.phone?.includes(searchTerm)
  );

  return (
    <div className="content-area animate-fade-in">
      <div className="section-header">
        <div>
          <h2>Riders Distance</h2>
          <p className="section-subtitle">Total distance covered by verified riders across Orders, Custom Orders, and Rides</p>
        </div>
        <button className="primary-btn icon-text-btn" onClick={fetchRidersDistance}>
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
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
      />

      <div className="search-bar-container glass-panel" style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
        <Search size={20} className="search-icon" />
        <input 
          type="text" 
          placeholder="Search riders by name or phone..." 
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        {loading ? (
          <div className="table-loader">Loading Riders Distance...</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Rider Info</th>
                <th>Status</th>
                <th>Orders Distance</th>
                <th>Custom Orders Distance</th>
                <th>Rides Distance</th>
                <th>Total Distance</th>
              </tr>
            </thead>
            <tbody>
              {filteredRiders.map((rider) => (
                <tr key={rider._id}>
                  <td>
                    <div className="user-info-cell" style={{ gap: '16px' }}>
                      <div className="user-avatar" style={{ flexShrink: 0 }}>
                        <Bike size={20} />
                      </div>
                      <div className="user-details" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span className="user-name" style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
                          {rider.name || "N/A"}
                        </span>
                        <span className="user-phone" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                          {rider.phone}
                        </span>
                        {rider.city && (
                          <span className="user-email" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', color: 'var(--text-muted)', fontSize: '12px' }}>
                            <MapPin size={12} /> {rider.city}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span className="status-badge status-delivered">Verified</span>
                      <span className={`status-badge ${rider.isOnline ? "status-transit" : "status-cancelled"}`}>
                        {rider.isOnline ? "Online" : "Offline"}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                      {(rider.orderDistance || 0).toFixed(2)} km
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                      {(rider.customOrderDistance || 0).toFixed(2)} km
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                      {(rider.rideDistance || 0).toFixed(2)} km
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          padding: '6px 12px',
                          background: 'rgba(59, 130, 246, 0.1)',
                          color: 'var(--accent-primary)',
                          borderRadius: '6px',
                          fontWeight: '700',
                          fontSize: '14px',
                          border: '1px solid rgba(59, 130, 246, 0.2)'
                        }}
                      >
                        {(rider.totalDistance || 0).toFixed(2)} km
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRiders.length === 0 && (
                <tr>
                  <td colSpan="6" className="empty-state" style={{ padding: '3rem' }}>
                    No verified riders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default RidersDistance;
