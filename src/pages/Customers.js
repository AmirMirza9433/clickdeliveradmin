import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { Search, RefreshCw, Trash2, Mail, Phone, MapPin, UserCheck } from 'lucide-react';
import AdminDateFilter, { AdminCityFilter, getDateFilterParams } from '../components/AdminDateFilter';
import { useAdminCityFilter } from '../hooks/useAdminCityFilter';
import { usePermissions } from '../hooks/usePermissions';

const Customers = () => {
  const { can } = usePermissions();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const { cities, selectedCity, setSelectedCity, cityParams } = useAdminCityFilter();

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const filterParams = {
        ...getDateFilterParams(dateFilter, customStartDate, customEndDate),
        ...cityParams,
      };
      const data = await adminService.getUsers('customer', filterParams);
      setCustomers(data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [dateFilter, customStartDate, customEndDate, selectedCity]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await adminService.deleteUser(id);
        setCustomers(customers.filter(c => c._id !== id));
      } catch (error) {
        alert('Failed to delete customer');
      }
    }
  };

  const handleActivate = async (id) => {
    if (window.confirm('Are you sure you want to reactivate this account?')) {
      try {
        await adminService.activateUser(id);
        setCustomers(customers.map(c => c._id === id ? { ...c, isDeleted: false } : c));
      } catch (error) {
        alert('Failed to reactivate account');
      }
    }
  };

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="content-area animate-fade-in">
      <div className="section-header">
        <div>
          <h2>Customer Management</h2>
          <p className="section-subtitle">Track and manage your customer base</p>
        </div>
        <button className="primary-btn icon-text-btn" onClick={fetchCustomers}>
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
          <div className="table-loader">Loading customers...</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Contact Info</th>
                <th>Address</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer._id}>
                  <td>
                    <div className="user-info-cell">
                      <div className="user-avatar customer-avatar">
                        <img 
                          src={customer.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(customer.name)}&background=random`} 
                          alt={customer.name} 
                          style={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover' }}
                        />
                      </div>
                      <div className="user-name" style={{ display: 'flex', alignItems: 'center' }}>
                        {customer.name}
                        {customer.isDeleted && customer.activationRequested ? (
                          <span className="status-badge" style={{ backgroundColor: '#f59e0b', color: 'white', fontSize: '10px', padding: '2px 6px', marginLeft: '8px' }}>Activation Requested</span>
                        ) : customer.isDeleted ? (
                          <span className="status-badge" style={{ backgroundColor: '#ef4444', color: 'white', fontSize: '10px', padding: '2px 6px', marginLeft: '8px' }}>Deleted</span>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="contact-info">
                      <div className="info-item">
                        <Mail size={14} /> {customer.email}
                      </div>
                      <div className="info-item">
                        <Phone size={14} /> {customer.phone || 'N/A'}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="address-cell">
                      <MapPin size={14} />
                      <span>{customer.address || 'Not provided'}</span>
                    </div>
                  </td>
                  <td>
                    {customer.isDeleted ? (
                      <button 
                        className="action-btn verify" 
                        onClick={() => handleActivate(customer._id)}
                        title="Reactivate Customer"
                      >
                        <UserCheck size={18} />
                      </button>
                    ) : (
                      can('customers', 'delete') && (
                      <button 
                        className="action-btn delete" 
                        onClick={() => handleDelete(customer._id)}
                        title="Delete Customer"
                      >
                        <Trash2 size={18} />
                      </button>
                      )
                    )}
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan="4" className="empty-table-msg">No customers found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Customers;
