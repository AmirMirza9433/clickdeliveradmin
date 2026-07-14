import React, { useState, useEffect } from "react";
import { adminService } from "../services/adminService";
import AdminDateFilter, {
  AdminCityFilter,
} from "../components/AdminDateFilter";
import { useAdminCityFilter } from "../hooks/useAdminCityFilter";
import {
  PERMISSION_MODULES,
  getActionLabel,
} from "../constants/permissions";
import {
  Search,
  RefreshCw,
  Trash2,
  Plus,
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Shield,
  Pencil,
} from "lucide-react";

const SubAdmins = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    city: "",
    permissions: [],
    accessibleCities: [],
  });
  const [availableCities, setAvailableCities] = useState([]);
  const { cities, selectedCity, setSelectedCity } = useAdminCityFilter();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [adminsData, citiesData] = await Promise.all([
        adminService.getAdmins(),
        adminService.getCities(),
      ]);
      setAdmins(adminsData);
      setAvailableCities(citiesData || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (admin) => {
    setEditingAdmin(admin);
    setFormData({
      name: admin.name,
      email: admin.email,
      password: "",
      phone: admin.phone,
      city: admin.city,
      permissions: admin.permissions || [],
      accessibleCities: admin.accessibleCities || [],
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this sub-admin?")) {
      try {
        await adminService.deleteSubAdmin(id);
        fetchData();
      } catch (error) {
        alert("Failed to delete sub-admin");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAdmin) {
        await adminService.updateSubAdmin(editingAdmin._id, formData);
      } else {
        await adminService.createSubAdmin(formData);
      }
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      alert(`Failed to ${editingAdmin ? "update" : "create"} sub-admin`);
    }
  };

  const resetForm = () => {
    setEditingAdmin(null);
    setFormData({
      name: "",
      email: "",
      password: "",
      phone: "",
      city: "",
      permissions: [],
      accessibleCities: [],
    });
  };

  const handlePermissionToggle = (moduleId, actionId) => {
    setFormData((prev) => {
      // Find the module
      const existingModuleIndex = prev.permissions.findIndex(
        (p) => p.module === moduleId
      );

      let newPermissions;

      if (existingModuleIndex === -1) {
        // Module doesn't exist, add it with this action
        newPermissions = [
          ...prev.permissions,
          { module: moduleId, actions: [actionId] },
        ];
      } else {
        // Module exists
        const existingModule = prev.permissions[existingModuleIndex];

        if (existingModule.actions.includes(actionId)) {
          // Remove the action
          const newActions = existingModule.actions.filter((a) => a !== actionId);

          if (newActions.length === 0) {
            // No actions left, remove the module entirely
            newPermissions = prev.permissions.filter(
              (_, index) => index !== existingModuleIndex
            );
          } else {
            // Update the module with new actions
            newPermissions = prev.permissions.map((p, index) =>
              index === existingModuleIndex ? { ...p, actions: newActions } : p
            );
          }
        } else {
          // Add the action
          newPermissions = prev.permissions.map((p, index) =>
            index === existingModuleIndex
              ? { ...p, actions: [...p.actions, actionId] }
              : p
          );
        }
      }

      return { ...prev, permissions: newPermissions };
    });
  };

  const isActionSelected = (moduleId, actionId) => {
    const module = formData.permissions.find((p) => p.module === moduleId);
    return module?.actions.includes(actionId) || false;
  };

  const filteredAdmins = admins.filter(
    (admin) =>
      admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPermissionLabel = (moduleId) => {
    return (
      PERMISSION_MODULES.find((m) => m.id === moduleId)?.label || moduleId
    );
  };

  // Helper to display permissions in the table
  const getDisplayPermissions = (perms) => {
    if (!perms || perms.length === 0) return [];
    return perms
      .map((p) => getPermissionLabel(p.module))
      .slice(0, 3);
  };

  return (
    <div className="content-area animate-fade-in">
      <div className="section-header">
        <div>
          <h2>Admin Management</h2>
          <p className="section-subtitle">
            Manage main admin and sub-admins with permissions
          </p>
        </div>
        <div className="header-actions">
          <button
            className="icon-btn"
            onClick={fetchData}
            style={{ marginRight: "1rem" }}
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            className="primary-btn icon-text-btn"
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
          >
            <Plus size={18} />
            Add Sub Admin
          </button>
        </div>
      </div>

      <AdminDateFilter
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
          <div className="table-loader">Loading admins...</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Contact Info</th>
                <th>Role</th>
                <th>Permissions</th>
                <th>Accessible Cities</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAdmins.map((admin) => (
                <tr key={admin._id}>
                  <td>
                    <div className="user-info-cell">
                      <div className="user-avatar customer-avatar">
                        <img
                          src={
                            admin.image ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              admin.name
                            )}&background=random`
                          }
                          alt={admin.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            borderRadius: "12px",
                            objectFit: "cover",
                          }}
                        />
                      </div>
                      <div className="user-name">
                        {admin.name}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="contact-info">
                      <div className="info-item">
                        <Mail size={14} style={{ marginRight: "0.5rem" }} />
                        <span>{admin.email}</span>
                      </div>
                      <div className="info-item">
                        <Phone size={14} style={{ marginRight: "0.5rem" }} />
                        <span>{admin.phone}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      className="status-badge"
                      style={{
                        backgroundColor: admin.role === "admin" ? "#f59e0b" : "#10b981",
                        color: "white",
                        fontSize: "12px",
                        padding: "4px 10px",
                        textTransform: "capitalize",
                      }}
                    >
                      {admin.role}
                    </span>
                  </td>
                  <td>
                    {admin.role === "admin" ? (
                      <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>
                        Full Access
                      </span>
                    ) : (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                        {getDisplayPermissions(admin.permissions).map((label, i) => (
                          <span
                            key={i}
                            style={{
                              backgroundColor: "rgba(59,130,246,0.1)",
                              color: "var(--accent-primary)",
                              padding: "2px 8px",
                              borderRadius: "6px",
                              fontSize: "10px",
                            }}
                          >
                            {label}
                          </span>
                        ))}
                        {admin.permissions?.length > 3 && (
                          <span
                            style={{ fontSize: "10px", color: "var(--text-muted)" }}
                          >
                            +{admin.permissions.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td>
                    {admin.role === "admin" ? (
                      <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>
                        All Cities
                      </span>
                    ) : (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                        {(admin.accessibleCities || []).slice(0, 2).map((city, i) => (
                          <span
                            key={i}
                            style={{
                              backgroundColor: "rgba(16,185,129,0.1)",
                              color: "#10b981",
                              padding: "2px 8px",
                              borderRadius: "6px",
                              fontSize: "10px",
                            }}
                          >
                            {city}
                          </span>
                        ))}
                        {admin.accessibleCities?.length > 2 && (
                          <span
                            style={{ fontSize: "10px", color: "var(--text-muted)" }}
                          >
                            +{admin.accessibleCities.length - 2} more
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td>
                    {admin.role === "sub-admin" ? (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          className="action-btn"
                          onClick={() => handleEdit(admin)}
                          title="Edit Sub Admin"
                          style={{ color: "var(--accent-primary)" }}
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          className="action-btn delete"
                          onClick={() => handleDelete(admin._id)}
                          title="Delete Sub Admin"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>
                        Main Admin
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredAdmins.length === 0 && (
                <tr>
                  <td colSpan="6" className="empty-table-msg">
                    No admins found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal for create/edit */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal-content glass-panel animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "800px", maxHeight: "90vh", overflowY: "auto" }}
          >
            <div className="modal-header">
              <h3>{editingAdmin ? "Edit Sub Admin" : "Add Sub Admin"}</h3>
              <button
                className="icon-btn close-btn"
                onClick={() => setShowModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>
                    <User size={12} style={{ marginRight: 4 }} /> Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    placeholder="Enter full name"
                  />
                </div>
                <div className="form-group">
                  <label>
                    <Mail size={12} style={{ marginRight: 4 }} /> Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                    placeholder="Enter email"
                  />
                </div>
                <div className="form-group">
                  <label>
                    <Phone size={12} style={{ marginRight: 4 }} /> Phone *
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    required
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="form-group">
                  <label>
                    <MapPin size={12} style={{ marginRight: 4 }} /> City *
                  </label>
                  <select
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    required
                  >
                    <option value="">Select City</option>
                    {availableCities.map((c) => (
                      <option key={c._id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label>
                    Password {!editingAdmin && "*"}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder={
                      editingAdmin
                        ? "Leave blank to keep current password"
                        : "Enter password"
                    }
                    required={!editingAdmin}
                  />
                </div>
              </div>

              <div
                className="form-group"
                style={{ marginTop: "1.5rem" }}
              >
                <label>
                  <Shield size={12} style={{ marginRight: 4 }} /> Accessible Cities
                </label>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.75rem",
                    marginTop: "0.5rem",
                    padding: "0.75rem",
                    backgroundColor: "rgba(255,255,255,0.02)",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      cursor: "pointer",
                      color: "var(--text-primary)",
                      fontWeight: 500,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={formData.accessibleCities?.includes("All")}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, accessibleCities: ["All"] });
                        } else {
                          setFormData({ ...formData, accessibleCities: [] });
                        }
                      }}
                    />
                    All Cities
                  </label>
                  {availableCities.map((c) => (
                    <label
                      key={c._id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        cursor: "pointer",
                        color: formData.accessibleCities?.includes("All")
                          ? "var(--text-muted)"
                          : "var(--text-secondary)",
                        opacity: formData.accessibleCities?.includes("All") ? 0.5 : 1,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={
                          formData.accessibleCities?.includes("All") ||
                          formData.accessibleCities?.includes(c.name)
                        }
                        disabled={formData.accessibleCities?.includes("All")}
                        onChange={(e) => {
                          let updatedCities = [...(formData.accessibleCities || [])];
                          if (e.target.checked) {
                            updatedCities.push(c.name);
                          } else {
                            updatedCities = updatedCities.filter(
                              (name) => name !== c.name
                            );
                          }
                          setFormData({
                            ...formData,
                            accessibleCities: updatedCities,
                          });
                        }}
                      />
                      {c.name}
                    </label>
                  ))}
                </div>
              </div>

              <div
                className="form-group"
                style={{ marginTop: "1.5rem" }}
              >
                <label>
                  <Shield size={12} style={{ marginRight: 4 }} /> Permissions
                </label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: "1rem",
                    marginTop: "0.75rem",
                  }}
                >
                  {PERMISSION_MODULES.map((module) => (
                    <div
                      key={module.id}
                      style={{
                        padding: "1rem",
                        backgroundColor: "rgba(255,255,255,0.02)",
                        borderRadius: "8px",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 600,
                          marginBottom: "0.75rem",
                          fontSize: "0.875rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        {module.label}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "0.5rem",
                        }}
                      >
                        {module.actions.map((action) => (
                          <label
                            key={action}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.375rem",
                              cursor: "pointer",
                              fontSize: "0.75rem",
                              padding: "0.375rem 0.625rem",
                              backgroundColor: isActionSelected(
                                module.id,
                                action
                              )
                                ? "rgba(59,130,246,0.2)"
                                : "rgba(255,255,255,0.05)",
                              borderRadius: "6px",
                              border: isActionSelected(module.id, action)
                                ? "1px solid rgba(59,130,246,0.5)"
                                : "1px solid transparent",
                              color: isActionSelected(module.id, action)
                                ? "var(--accent-primary)"
                                : "var(--text-secondary)",
                              transition: "all 0.2s",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isActionSelected(module.id, action)}
                              onChange={() =>
                                handlePermissionToggle(module.id, action)
                              }
                              style={{ display: "none" }}
                            />
                            {getActionLabel(action)}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "1rem",
                  marginTop: "1.5rem",
                }}
              >
                <button
                  type="button"
                  className="view-btn"
                  onClick={() => setShowModal(false)}
                  style={{ flex: 1, height: "48px" }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="primary-btn" 
                  style={{ 
                    flex: 1, 
                    height: "48px",
                    display: "flex", 
                    justifyContent: "center", 
                    alignItems: "center", 
                    gap: "0.5rem" 
                  }}
                >
                  {editingAdmin ? "Update Sub Admin" : "Create Sub Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubAdmins;
