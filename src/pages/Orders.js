import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { Search, RefreshCw, ShoppingBag, Package, Truck, Edit } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminDateFilter, { AdminCityFilter, getDateFilterParams } from '../components/AdminDateFilter';
import { useAdminCityFilter } from '../hooks/useAdminCityFilter';
import { usePermissions } from '../hooks/usePermissions';

const Orders = () => {
  const { can } = usePermissions();
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const { cities, selectedCity, setSelectedCity, cityParams } = useAdminCityFilter();

  // Edit Modal states
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedRiderId, setSelectedRiderId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'accepted', label: 'Accepted' },
    { id: 'preparing', label: 'Preparing' },
    { id: 'on the way', label: 'On the Way' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  const fetchOrdersAndRiders = async () => {
    setLoading(true);
    try {
      const filterParams = {
        ...getDateFilterParams(dateFilter, customStartDate, customEndDate),
        ...cityParams,
      };
      const [ordersData, ridersData] = await Promise.all([
        adminService.getOrders(filterParams),
        adminService.getUsers('rider', cityParams)
      ]);
      setOrders(ordersData);
      setRiders(ridersData);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersAndRiders();
  }, [dateFilter, customStartDate, customEndDate, selectedCity]);

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'status-pending';
      case 'accepted': return 'status-accepted';
      case 'preparing': return 'status-preparing';
      case 'on the way': return 'status-transit';
      case 'delivered': return 'status-delivered';
      case 'cancelled': return 'status-cancelled';
      default: return '';
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesTab = activeTab === 'all' || order.status.toLowerCase() === activeTab.toLowerCase();
    const matchesSearch = 
      order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      ((order.shops?.[0]?.shopDetails?.name || order.shops?.[0]?.name || '')).toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const openEditModal = (order) => {
    setSelectedOrder(order);
    setSelectedRiderId(order.rider?._id || '');
    setSelectedStatus(order.status);
    setCancelReason(order.cancellationReason || '');
    setEditModalVisible(true);
  };

  const closeEditModal = () => {
    setEditModalVisible(false);
    setSelectedOrder(null);
    setSelectedRiderId('');
    setSelectedStatus('');
    setCancelReason('');
  };

  const handleAssignRider = async () => {
    if (!selectedRiderId) {
      toast.error('Please select a rider');
      return;
    }
    setIsUpdating(true);
    try {
      await adminService.assignRiderToOrder(selectedOrder._id, selectedRiderId);
      toast.success('Rider assigned successfully');
      fetchOrdersAndRiders();
      closeEditModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign rider');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (selectedStatus === 'Cancelled' && !cancelReason.trim()) {
      toast.error('Please provide a cancellation reason');
      return;
    }
    setIsUpdating(true);
    try {
      await adminService.updateOrderStatusAdmin(selectedOrder._id, selectedStatus, cancelReason);
      toast.success('Order status updated successfully');
      fetchOrdersAndRiders();
      closeEditModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update order status');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="content-area animate-fade-in">
      <div className="section-header">
        <div>
          <h2>Order Management</h2>
          <p className="section-subtitle">Real-time overview of all delivery operations</p>
        </div>
        <button className="primary-btn icon-text-btn" onClick={fetchOrdersAndRiders}>
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
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', overflowX: 'auto' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.625rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: activeTab === tab.id 
                  ? 'var(--accent-primary)' 
                  : 'transparent',
                color: activeTab === tab.id 
                  ? 'white' 
                  : 'var(--text-muted)',
                fontWeight: 500,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.target.style.background = 'transparent';
                }
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
          placeholder="Search by ID, Customer or Shop..." 
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="glass-panel" style={{ marginTop: "2rem", overflowX: 'auto' }}>
        {loading ? (
          <div className="table-loader">Loading orders...</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer / Shop</th>
                <th>Items / Price</th>
                <th>Status</th>
                <th>Rider</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order._id}>
                  <td>
                    <div className="order-id-cell">
                      <span className="id-hash">#</span>
                      {order._id.substring(order._id.length - 8).toUpperCase()}
                    </div>
                    <div className="order-date">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td>
                    <div className="order-parties">
                      <div className="party-item">
                        <Package size={14} /> {order.customer?.name || 'Unknown'}
                      </div>
                      <div className="party-divider"></div>
                      <div className="party-item">
                        <ShoppingBag size={14} /> {order.shops?.[0]?.shopDetails?.name || order.shops?.[0]?.name || 'Unknown Shop'}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="order-summary">
                      <div className="price-tag">PKR {order.totalPrice}</div>
                      <div className="item-count">{order.items?.length || 0} Items</div>
                      {order.paymentType && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                          Payment: <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{order.paymentType}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`status-pill ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>
                    {order.rider ? (
                      <div className="rider-assigned">
                        <Truck size={14} /> {order.rider.name}
                      </div>
                    ) : (
                      <span className="no-rider">Waiting for Rider...</span>
                    )}
                  </td>
                  <td>
                    {can('orders', 'edit') && (
                    <button 
                      className="icon-btn" 
                      onClick={() => openEditModal(order)}
                      title="Edit Order"
                      style={{ color: 'var(--text-main)' }}
                    >
                      <Edit size={18} />
                    </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan="6" className="empty-table-msg">No orders found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {editModalVisible && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ maxWidth: '500px', width: '100%', padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-main)', fontSize: '1.25rem' }}>
              Edit Order #{selectedOrder._id.substring(selectedOrder._id.length - 8).toUpperCase()}
            </h3>

            {/* Assign Rider Section (Only if order is Pending or has no rider, or to reassign) */}
            <div className="input-field" style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.85rem', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
                ASSIGN RIDER
              </label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="input-wrapper input-wrapper-select" style={{ flex: 1 }}>
                  <select
                    value={selectedRiderId}
                    onChange={(e) => setSelectedRiderId(e.target.value)}
                    disabled={['Delivered', 'Cancelled'].includes(selectedOrder.status)}
                  >
                    <option value="">Select a rider...</option>
                    {riders.map(r => (
                      <option key={r._id} value={r._id}>{r.name} ({r.phone})</option>
                    ))}
                  </select>
                </div>
                <button 
                  className="primary-btn"
                  onClick={handleAssignRider}
                  disabled={isUpdating || !selectedRiderId || ['Delivered', 'Cancelled'].includes(selectedOrder.status)}
                  style={{ padding: '0 1.5rem' }}
                >
                  Assign
                </button>
              </div>
            </div>

            <hr style={{ borderTop: '1px solid var(--border-color)', margin: '1.5rem 0' }} />

            {/* Update Status Section */}
            <div className="input-field" style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.85rem', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
                UPDATE STATUS
              </label>
              <div className="input-wrapper input-wrapper-select">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  {['Pending', 'Accepted', 'Preparing', 'On the way', 'Delivered', 'Cancelled'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {selectedStatus === 'Cancelled' && (
              <div className="input-field" style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.85rem', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
                  CANCELLATION REASON
                </label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Enter reason for cancellation"
                  />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button 
                className="secondary-btn" 
                onClick={closeEditModal}
                style={{ flex: 1 }}
                disabled={isUpdating}
              >
                Close
              </button>
              <button 
                className="primary-btn" 
                onClick={handleUpdateStatus}
                style={{ flex: 1 }}
                disabled={isUpdating}
              >
                {isUpdating ? 'Updating...' : 'Save Status'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
