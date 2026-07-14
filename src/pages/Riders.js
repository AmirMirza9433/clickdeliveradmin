import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Search, RefreshCw, Trash2, ShieldAlert, UserCheck } from 'lucide-react';
import { adminService } from '../services/adminService';
import AdminDateFilter, { AdminCityFilter, getDateFilterParams } from '../components/AdminDateFilter';
import { useAdminCityFilter } from '../hooks/useAdminCityFilter';
import { usePermissions } from '../hooks/usePermissions';

const Riders = () => {
  const { can } = usePermissions();
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const { cities, selectedCity, setSelectedCity, cityParams } = useAdminCityFilter();

  const fetchRiders = async () => {
    setLoading(true);
    try {
      const filterParams = {
        ...getDateFilterParams(dateFilter, customStartDate, customEndDate),
        ...cityParams,
      };
      const data = await adminService.getUsers('rider', filterParams);
      setRiders(data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiders();
  }, [dateFilter, customStartDate, customEndDate, selectedCity]);

  const handleVerify = async (id, isVerified) => {
    try {
      await adminService.verifyRider(id, isVerified);
      setRiders(riders.map(r => r._id === id ? { ...r, isRiderVerified: isVerified } : r));
    } catch (error) {
      alert('Failed to update verification status');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this rider?')) {
      try {
        await adminService.deleteUser(id);
        setRiders(riders.filter(r => r._id !== id));
      } catch (error) {
        alert('Failed to delete rider');
      }
    }
  };

  const handleActivate = async (id) => {
    if (window.confirm('Are you sure you want to reactivate this account?')) {
      try {
        await adminService.activateUser(id);
        setRiders(riders.map(r => r._id === id ? { ...r, isDeleted: false } : r));
      } catch (error) {
        alert('Failed to reactivate account');
      }
    }
  };

  const filteredRiders = riders.filter(rider => 
    rider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rider.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="content-area animate-fade-in">
      <div className="section-header">
        <div>
          <h2>Rider Management</h2>
          <p className="section-subtitle">Manage and verify delivery partners</p>
        </div>
        <button className="primary-btn icon-text-btn" onClick={fetchRiders}>
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
        leadingContent={
          <AdminCityFilter
            cities={cities}
            selectedCity={selectedCity}
            setSelectedCity={setSelectedCity}
          />
        }
      />

      <div className="search-bar-container glass-panel">
        <Search size={20} className="search-icon" />
        <input 
          type="text" 
          placeholder="Search by name or email..." 
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="glass-panel" style={{ marginTop: "2rem" }}>
        {loading ? (
          <div className="table-loader">Loading riders...</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Rider Details</th>
                <th>Vehicle</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRiders.map((rider) => (
                <tr key={rider._id}>
                  <td>
                    <div className="user-info-cell">
                      <div className="user-avatar">
                        <img 
                          src={rider.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(rider.name)}&background=random`} 
                          alt={rider.name} 
                          style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                        />
                      </div>
                      <div>
                        <div className="user-name">{rider.name}</div>
                        <div className="user-email">{rider.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="vehicle-info">
                      {rider.bikeDetails?.name || 'N/A'}
                      <span className="vehicle-model">{rider.bikeDetails?.model}</span>
                    </div>
                  </td>
                  <td>
                    {rider.isDeleted && rider.activationRequested ? (
                      <span className="status-badge" style={{ backgroundColor: '#f59e0b', color: 'white', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        Activation Requested
                      </span>
                    ) : rider.isDeleted ? (
                      <span className="status-badge" style={{ backgroundColor: '#ef4444', color: 'white', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        Deleted
                      </span>
                    ) : (
                      <span className={`status-badge ${rider.isRiderVerified ? 'verified' : 'pending'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        {!rider.isRiderVerified && <ShieldAlert size={14} />}
                        {rider.isRiderVerified ? 'Verified' : 'Pending Verification'}
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="action-btns">
                      {rider.isDeleted ? (
                        <button 
                          className="action-btn verify" 
                          onClick={() => handleActivate(rider._id)}
                          title="Reactivate Account"
                        >
                          <UserCheck size={18} />
                        </button>
                      ) : (
                        <>
                          {can('riders', 'verify') && (
                          <>
                          {!rider.isRiderVerified ? (
                            <button 
                              className="action-btn verify" 
                              onClick={() => handleVerify(rider._id, true)}
                              title="Verify Rider"
                            >
                              <CheckCircle size={18} />
                            </button>
                          ) : (
                            <button 
                              className="action-btn unverify" 
                              onClick={() => handleVerify(rider._id, false)}
                              title="Unverify Rider"
                            >
                              <XCircle size={18} />
                            </button>
                          )}
                          </>
                          )}
                          {can('riders', 'delete') && (
                          <button 
                            className="action-btn delete" 
                            onClick={() => handleDelete(rider._id)}
                            title="Delete Account"
                          >
                            <Trash2 size={18} />
                          </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRiders.length === 0 && (
                <tr>
                  <td colSpan="4" className="empty-table-msg">No riders found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Riders;
