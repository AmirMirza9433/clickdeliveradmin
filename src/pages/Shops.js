import React, { useState, useEffect } from "react";
import { adminService } from "../services/adminService";
import AdminDateFilter, {
  AdminCityFilter,
  getDateFilterParams,
} from "../components/AdminDateFilter";
import { useAdminCityFilter } from "../hooks/useAdminCityFilter";
import { usePermissions } from "../hooks/usePermissions";
import {
  Search,
  RefreshCw,
  Trash2,
  Tag,
  Eye,
  UserCheck,
  CheckCircle,
  XCircle,
  ShieldAlert,
  Edit2,
  Check,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";

const Shops = () => {
  const { can } = usePermissions();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingShopId, setEditingShopId] = useState(null);
  const [editPercentageValue, setEditPercentageValue] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const { cities, selectedCity, setSelectedCity, cityParams } =
    useAdminCityFilter();

  const fetchShops = async () => {
    setLoading(true);
    try {
      const filterParams = {
        ...getDateFilterParams(dateFilter, customStartDate, customEndDate),
        ...cityParams,
      };
      const data = await adminService.getUsers("shopkeeper", filterParams);
      setShops(data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, [dateFilter, customStartDate, customEndDate, selectedCity]);

  const handleVerify = async (id, isVerified) => {
    try {
      await adminService.verifyShopkeeper(id, isVerified);
      setShops(
        shops.map((s) =>
          s._id === id ? { ...s, isShopkeeperVerified: isVerified } : s,
        ),
      );
    } catch (error) {
      alert("Failed to update verification status");
    }
  };

  const handleDelete = async (id) => {
    if (
      window.confirm(
        "Are you sure you want to delete this shopkeeper and their shop?",
      )
    ) {
      try {
        await adminService.deleteUser(id);
        setShops(shops.filter((s) => s._id !== id));
      } catch (error) {
        alert("Failed to delete shop");
      }
    }
  };

  const handleActivate = async (id) => {
    if (window.confirm("Are you sure you want to reactivate this account?")) {
      try {
        await adminService.activateUser(id);
        setShops(
          shops.map((s) => (s._id === id ? { ...s, isDeleted: false } : s)),
        );
      } catch (error) {
        alert("Failed to reactivate account");
      }
    }
  };

  const startEditingPercentage = (shop) => {
    setEditingShopId(shop._id);
    setEditPercentageValue(shop.shopDetails?.percentageCharge || 0);
  };

  const handleSavePercentage = async (shopId) => {
    const val = Number(editPercentageValue);
    if (isNaN(val) || val < 0 || val > 100) {
      alert("Please enter a valid percentage between 0 and 100");
      return;
    }
    try {
      await adminService.updateShopkeeperPercentage(shopId, val);
      setShops(
        shops.map((s) =>
          s._id === shopId
            ? {
                ...s,
                shopDetails: {
                  ...(s.shopDetails || {}),
                  percentageCharge: val,
                },
              }
            : s,
        ),
      );
      setEditingShopId(null);
    } catch (error) {
      alert("Failed to update percentage charge");
    }
  };

  const handleCancelEditing = () => {
    setEditingShopId(null);
    setEditPercentageValue("");
  };

  const filteredShops = shops.filter(
    (shop) =>
      (shop.shopDetails?.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      shop.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="content-area animate-fade-in">
      <div className="section-header">
        <div>
          <h2>Shop Management</h2>
          <p className="section-subtitle">
            Monitor registered vendors and their stores
          </p>
        </div>
        <button className="primary-btn icon-text-btn" onClick={fetchShops}>
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

      <div className="search-bar-container glass-panel rounded-12">
        <Search size={20} className="search-icon" />
        <input
          type="text"
          placeholder="Search by shop name or owner..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="glass-panel" style={{ marginTop: "2rem" }}>
        {loading ? (
          <div className="table-loader">Loading shops...</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Shop Details</th>
                <th>Owner</th>
                <th>Category</th>
                <th>Percentage Charge</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredShops.map((shop) => (
                <tr key={shop._id}>
                  <td>
                    <div className="user-info-cell">
                      <div className="user-avatar shop-avatar">
                        <img
                          src={
                            shop.image ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(shop.name)}&background=random`
                          }
                          alt={shop.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            borderRadius: "50%",
                            objectFit: "cover",
                          }}
                        />
                      </div>
                      <div>
                        <div className="user-name">
                          {shop.shopDetails?.name || "Unnamed Shop"}
                        </div>
                        <div className="user-email">
                          {shop.shopDetails?.businessType || "N/A"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="owner-info">
                      <div
                        className="owner-name"
                        style={{ display: "flex", alignItems: "center" }}
                      >
                        {shop.name}
                      </div>
                      <div className="owner-contact">{shop.email}</div>
                    </div>
                  </td>
                  <td>
                    <div className="category-badge">
                      <Tag size={12} />
                      {shop.shopDetails?.businessType || "General"}
                    </div>
                  </td>
                  <td>
                    {editingShopId === shop._id ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.25rem",
                        }}
                      >
                        <input
                          type="number"
                          value={editPercentageValue}
                          onChange={(e) =>
                            setEditPercentageValue(e.target.value)
                          }
                          style={{
                            width: "55px",
                            padding: "0.25rem",
                            borderRadius: "4px",
                            border: "1px solid var(--border-color)",
                            background: "var(--bg-secondary)",
                            color: "var(--text-main)",
                          }}
                          min="0"
                          max="100"
                        />
                        <span
                          style={{
                            color: "var(--text-muted)",
                            fontSize: "14px",
                          }}
                        >
                          %
                        </span>
                        <button
                          onClick={() => handleSavePercentage(shop._id)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#10b981",
                            cursor: "pointer",
                            padding: "4px",
                            display: "flex",
                          }}
                          title="Save"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={handleCancelEditing}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#ef4444",
                            cursor: "pointer",
                            padding: "4px",
                            display: "flex",
                          }}
                          title="Cancel"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <span style={{ fontWeight: "600" }}>
                          {shop.shopDetails?.percentageCharge || 0}%
                        </span>
                        {!shop.isDeleted && can('shops', 'manage_percentage_charge') && (
                          <button
                            onClick={() => startEditingPercentage(shop)}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "var(--text-muted)",
                              cursor: "pointer",
                              padding: "4px",
                              display: "flex",
                            }}
                            title="Edit Percentage Charge"
                          >
                            <Edit2 size={14} />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td>
                    {shop.isDeleted && shop.activationRequested ? (
                      <span
                        className="status-badge"
                        style={{
                          backgroundColor: "#f59e0b",
                          color: "white",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        Activation Requested
                      </span>
                    ) : shop.isDeleted ? (
                      <span
                        className="status-badge"
                        style={{
                          backgroundColor: "#ef4444",
                          color: "white",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        Deleted
                      </span>
                    ) : (
                      <span
                        className={`status-badge ${shop.isShopkeeperVerified ? "verified" : "pending"}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        {!shop.isShopkeeperVerified && (
                          <ShieldAlert size={14} />
                        )}
                        {shop.isShopkeeperVerified
                          ? "Verified"
                          : "Pending Verification"}
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <Link
                        to={`/products?shop=${encodeURIComponent(shop.shopDetails?.name || "")}`}
                        className="action-btn"
                        style={{
                          color: "var(--primary)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        title="View Shop Products"
                      >
                        <Eye size={18} />
                      </Link>
                      {shop.isDeleted ? (
                        <button
                          className="action-btn verify"
                          onClick={() => handleActivate(shop._id)}
                          title="Reactivate Shopkeeper"
                        >
                          <UserCheck size={18} />
                        </button>
                      ) : (
                        <>
                          {can('shops', 'verify') && (
                          <>
                          {!shop.isShopkeeperVerified ? (
                            <button
                              className="action-btn verify"
                              onClick={() => handleVerify(shop._id, true)}
                              title="Verify Shopkeeper"
                            >
                              <CheckCircle size={18} />
                            </button>
                          ) : (
                            <button
                              className="action-btn unverify"
                              onClick={() => handleVerify(shop._id, false)}
                              title="Unverify Shopkeeper"
                            >
                              <XCircle size={18} />
                            </button>
                          )}
                          </>
                          )}
                          {can('shops', 'delete') && (
                          <button
                            className="action-btn delete"
                            onClick={() => handleDelete(shop._id)}
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
              {filteredShops.length === 0 && (
                <tr>
                  <td colSpan="6" className="empty-table-msg">
                    No shops found.
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

export default Shops;
