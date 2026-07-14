import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import {
  Dialog,
  Loader2 as MUILoader
} from '@mui/material';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  MapPin, 
  X,
  Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { usePermissions } from '../hooks/usePermissions';

const Cities = () => {
  const { can } = usePermissions();
  const [cities, setCities] = useState([]);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentCity, setCurrentCity] = useState({ id: '', name: '' });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    try {
      const data = await adminService.getCities();
      setCities(data);
    } catch (error) {
      toast.error(error.message || 'Error fetching cities');
    } finally {
      setFetching(false);
    }
  };

  const handleOpen = (city = null) => {
    if (city) {
      setEditMode(true);
      setCurrentCity({ id: city._id, name: city.name });
    } else {
      setEditMode(false);
      setCurrentCity({ id: '', name: '' });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setCurrentCity({ id: '', name: '' });
  };

  const handleSubmit = async () => {
    if (!currentCity.name) {
      toast.error('City name is required');
      return;
    }

    setLoading(true);
    try {
      if (editMode) {
        await adminService.updateCity(currentCity.id, { name: currentCity.name });
        toast.success('City updated successfully');
      } else {
        await adminService.createCity({ name: currentCity.name });
        toast.success('City added successfully');
      }
      fetchCities();
      handleClose();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Error processing request');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this city?')) {
      try {
        await adminService.deleteCity(id);
        toast.success('City deleted successfully');
        fetchCities();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error deleting city');
      }
    }
  };

  return (
    <div className="content-area animate-fade-in">
      <div className="section-header">
        <div>
          <h2 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="logo-circle" style={{ width: 32, height: 32, boxShadow: 'none' }}>
              <MapPin size={18} />
            </div>
            Cities Management
          </h2>
          <p className="section-subtitle">Manage service locations and regional availability</p>
        </div>
        {can('cities', 'create') && (
        <button className="primary-btn icon-text-btn" onClick={() => handleOpen()}>
          <Plus size={18} />
          Add City
        </button>
        )}
      </div>

      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {fetching ? (
          <div className="table-loader">
            <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto' }} />
            <p style={{ marginTop: '0.5rem' }}>Loading cities...</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '80px', textAlign: 'center' }}>#</th>
                <th>City Name</th>
                <th style={{ width: '120px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cities.map((city, index) => (
                <tr key={city._id}>
                  <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{index + 1}</td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '1rem' }}>
                      {city.name}
                    </div>
                  </td>
                  <td>
                    <div className="action-btns" style={{ justifyContent: 'flex-end' }}>
                      {can('cities', 'edit') && (
                      <button className="action-btn verify" title="Edit" onClick={() => handleOpen(city)}>
                        <Pencil size={16} />
                      </button>
                      )}
                      {can('cities', 'delete') && (
                      <button className="action-btn delete" title="Delete" onClick={() => handleDelete(city._id)}>
                        <Trash2 size={16} />
                      </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {cities.length === 0 && (
                <tr>
                  <td colSpan={3} className="empty-table-msg">
                    No cities found. Start by adding a new service city.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <Dialog 
        open={open} 
        onClose={handleClose} 
        PaperProps={{ 
          className: "glass-panel animate-fade-in",
          style: { 
            background: 'var(--bg-secondary)', 
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-xl)',
            width: '100%',
            maxWidth: 440,
            padding: 0
          } 
        }}
      >
        <div style={{ padding: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              {editMode ? 'Update City' : 'Add New City'}
            </h3>
            <button className="icon-btn" onClick={handleClose} style={{ border: 'none' }}>
              <X size={20} />
            </button>
          </div>
          
          <div className="input-field">
            <label style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>CITY NAME</label>
            <div className="input-wrapper">
              <div className="input-icon">
                <MapPin size={18} />
              </div>
              <input
                type="text"
                value={currentCity.name}
                onChange={(e) => setCurrentCity({ ...currentCity, name: e.target.value })}
                placeholder="e.g. Lahore, Karachi"
                autoFocus
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '3rem' }}>
            <button className="view-btn" onClick={handleClose} style={{ flex: 1, height: '48px' }}>
              Cancel
            </button>
            <button 
              className="primary-btn" 
              onClick={handleSubmit} 
              style={{ 
                flex: 1, 
                height: '48px',
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                gap: '0.5rem' 
              }}
              disabled={loading}
            >
              {loading && <Loader2 className="animate-spin" size={18} />}
              {editMode ? 'Update City' : 'Create City'}
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default Cities;
