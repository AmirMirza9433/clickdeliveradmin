import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { Search, RefreshCw, User, MapPin, Navigation, Bike, Package, Edit } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminDateFilter, { AdminCityFilter, getDateFilterParams } from '../components/AdminDateFilter';
import { useAdminCityFilter } from '../hooks/useAdminCityFilter';
import { usePermissions } from '../hooks/usePermissions';

const Rides = () => {
  const { can } = usePermissions();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const { cities, selectedCity, setSelectedCity, cityParams } = useAdminCityFilter();
  
  const [selectedRide, setSelectedRide] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'Pending', label: 'Pending' },
    { id: 'Accepted', label: 'Accepted' },
    { id: 'Arrived', label: 'Arrived' },
    { id: 'Started', label: 'Started' },
    { id: 'Completed', label: 'Completed' },
    { id: 'Cancelled', label: 'Cancelled' },
  ];

  const fetchRides = async () => {
    setLoading(true);
    try {
      const filterParams = {
        ...getDateFilterParams(dateFilter, customStartDate, customEndDate),
        ...cityParams,
      };
      const response = await adminService.getRides(filterParams);
      setRides(response.rides || []);
    } catch (error) {
      toast.error('Failed to fetch rides');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRides();
  }, [dateFilter, customStartDate, customEndDate, selectedCity]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'status-pending';
      case 'Accepted':
      case 'Arrived':
      case 'Started': return 'status-preparing';
      case 'Completed': return 'status-delivered';
      case 'Cancelled': return 'status-cancelled';
      default: return '';
    }
  };

  const filteredRides = rides.filter(ride => {
    const matchesTab = activeTab === 'all' || ride.status === activeTab;
    const matchesSearch = 
      ride._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ride.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ride.pickupLocation?.address || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ride.dropoffLocation?.address || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const openEditModal = (ride) => {
    setSelectedRide(ride);
    setSelectedStatus(ride.status);
    setEditModalVisible(true);
  };

  const closeEditModal = () => {
    setEditModalVisible(false);
    setSelectedRide(null);
  };

  const handleUpdateStatus = async () => {
    setIsUpdating(true);
    try {
      await adminService.updateRideStatus(selectedRide._id, { status: selectedStatus });
      toast.success('Ride updated successfully');
      fetchRides();
      closeEditModal();
    } catch (error) {
      toast.error('Failed to update ride');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="content-area animate-fade-in">
      <div className="section-header">
        <div>
          <h2>Rides & Parcels</h2>
          <p className="section-subtitle">Manage ride-hailing and parcel delivery requests</p>
        </div>
        <button className="primary-btn icon-text-btn" onClick={fetchRides}>
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

      <div className="glass-panel" style={{ padding: '0.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.625rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: activeTab === tab.id ? 'var(--accent-primary)' : 'transparent',
                color: activeTab === tab.id ? 'white' : 'var(--text-muted)',
                fontWeight: 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
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
          placeholder="Search by ID, Customer, or Address..." 
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="glass-panel" style={{ marginTop: "2rem", overflowX: 'auto' }}>
        {loading ? (
          <div className="table-loader">Loading requests...</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Customer</th>
                <th>Rider</th>
                <th>Route</th>
                <th>Status</th>
                <th>Fare</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRides.map((ride) => (
                <tr key={ride._id}>
                  <td>
                    <div className="order-id-cell">
                      <span className="id-hash">#</span>
                      {ride._id.substring(ride._id.length - 6).toUpperCase()}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {ride.type === 'Ride' ? <Bike size={16} /> : <Package size={16} />}
                      {ride.type}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <User size={14} /> {ride.customer?.name || 'Unknown'}
                    </div>
                  </td>
                  <td>
                    {ride.rider ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Bike size={14} /> {ride.rider.name}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Unassigned</span>
                    )}
                  </td>
                  <td>
                    <div style={{ maxWidth: '250px', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#4CAF50' }}>
                        <MapPin size={12} /> {ride.pickupLocation.address}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#F44336', marginTop: '0.3rem' }}>
                        <Navigation size={12} /> {ride.dropoffLocation.address}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`status-pill ${getStatusColor(ride.status)}`}>
                      {ride.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                      PKR {ride.fare}
                    </div>
                    {ride.paymentType && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Payment: <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{ride.paymentType}</span>
                      </div>
                    )}
                  </td>
                  <td>
                    {can('rides', 'edit') && (
                    <button className="icon-btn" onClick={() => openEditModal(ride)}>
                      <Edit size={18} />
                    </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editModalVisible && selectedRide && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '500px', width: '100%' }}>
            <h3>Manage {selectedRide.type} Request</h3>
            
            <div className="input-field" style={{ marginTop: '1.5rem' }}>
              <label>Update Status</label>
              <div className="input-wrapper input-wrapper-select">
                <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                  {tabs.filter(t => t.id !== 'all').map(t => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button className="secondary-btn" style={{ flex: 1 }} onClick={closeEditModal}>Close</button>
              <button className="primary-btn" style={{ flex: 1 }} onClick={handleUpdateStatus} disabled={isUpdating}>
                {isUpdating ? 'Updating...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rides;
