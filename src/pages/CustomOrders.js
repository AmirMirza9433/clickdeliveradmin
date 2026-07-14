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
  User,
  Image as ImageIcon,
  Mic,
  Edit,
} from "lucide-react";
import toast from "react-hot-toast";

const CustomOrders = () => {
  const { can } = usePermissions();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const { cities, selectedCity, setSelectedCity, cityParams } =
    useAdminCityFilter();

  // Edit Modal states
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [finalPrice, setFinalPrice] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const tabs = [
    { id: "all", label: "All" },
    { id: "Pending", label: "Pending" },
    { id: "Reviewing", label: "Reviewing" },
    { id: "Accepted", label: "Accepted" },
    { id: "Preparing", label: "Preparing" },
    { id: "Picked up", label: "Picked up" },
    { id: "On the way", label: "On the way" },
    { id: "Delivered", label: "Delivered" },
    { id: "Cancelled", label: "Cancelled" },
    { id: "Rejected", label: "Rejected" },
  ];

  const fetchCustomOrders = async () => {
    setLoading(true);
    try {
      const dateParams = getDateFilterParams(
        dateFilter,
        customStartDate,
        customEndDate,
      );
      const response = await adminService.getCustomOrders({
        ...dateParams,
        ...cityParams,
      });
      setOrders(response.orders || []);
    } catch (error) {
      toast.error("Failed to fetch custom orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomOrders();
  }, [dateFilter, customStartDate, customEndDate, selectedCity]);

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "status-pending";
      case "Reviewing":
      case "Preparing":
        return "status-preparing";
      case "Accepted":
        return "status-accepted";
      case "Picked up":
      case "On the way":
        return "status-shipped"; // Assuming this color exists, otherwise status-preparing
      case "Rejected":
      case "Cancelled":
        return "status-cancelled";
      case "Delivered":
      case "Completed":
        return "status-delivered";
      default:
        return "";
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesTab = activeTab === "all" || order.status === activeTab;
    const matchesSearch =
      order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customer?.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (order.description || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const openEditModal = (order) => {
    setSelectedOrder(order);
    setSelectedStatus(order.status);
    setFinalPrice(order.finalPrice || "");
    setEditModalVisible(true);
  };

  const closeEditModal = () => {
    setEditModalVisible(false);
    setSelectedOrder(null);
    setSelectedStatus("");
    setFinalPrice("");
  };

  const handleUpdateStatus = async () => {
    setIsUpdating(true);
    try {
      await adminService.updateCustomOrderStatus(selectedOrder._id, {
        status: selectedStatus,
        finalPrice: parseFloat(finalPrice) || 0,
      });
      toast.success("Custom order updated successfully");
      fetchCustomOrders();
      closeEditModal();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update order");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="content-area animate-fade-in">
      <div className="section-header">
        <div>
          <h2>Custom Orders</h2>
          <p className="section-subtitle">
            Manage special requests and custom delivery orders
          </p>
        </div>
        <button
          className="primary-btn icon-text-btn"
          onClick={fetchCustomOrders}
        >
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

      <div
        className="glass-panel"
        style={{ padding: "0.5rem", marginBottom: "1.5rem" }}
      >
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            flexWrap: "wrap",
            overflowX: "auto",
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "0.625rem 1.25rem",
                borderRadius: "var(--radius-md)",
                border: "none",
                background:
                  activeTab === tab.id
                    ? "var(--accent-primary)"
                    : "transparent",
                color: activeTab === tab.id ? "white" : "var(--text-muted)",
                fontWeight: 500,
                fontSize: "0.875rem",
                cursor: "pointer",
                transition: "all 0.2s ease",
                whiteSpace: "nowrap",
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
          placeholder="Search by ID, Customer or Description..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div
        className="glass-panel"
        style={{ marginTop: "2rem", overflowX: "auto" }}
      >
        {loading ? (
          <div className="table-loader">Loading custom orders...</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Type</th>
                <th>Description</th>
                <th>Assets</th>
                <th>Status</th>
                <th>Budget / Price</th>
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
                  </td>
                  <td>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <User size={14} /> {order.customer?.name || "Unknown"}
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      {order.customer?.phone}
                    </div>
                  </td>
                  <td>
                    <span
                      className="status-pill"
                      style={{
                        background:
                          order.type === "medicine"
                            ? "rgba(34, 197, 94, 0.1)"
                            : "rgba(59, 130, 246, 0.1)",
                        color:
                          order.type === "medicine"
                            ? "#22c55e"
                            : "var(--accent-primary)",
                      }}
                    >
                      {order.type === "medicine" ? "Medicine" : "Custom"}
                    </span>
                  </td>
                  <td>
                    <div
                      style={{
                        maxWidth: "200px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={order.description}
                    >
                      {order.description}
                    </div>
                    {order.selectedProducts?.length > 0 && (
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--accent-primary)",
                        }}
                      >
                        {order.selectedProducts.length} items selected
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      {order.image && (
                        <a
                          href={order.image}
                          target="_blank"
                          rel="noreferrer"
                          title="View Image"
                        >
                          <ImageIcon size={18} color="var(--accent-primary)" />
                        </a>
                      )}
                      {order.voiceNote && (
                        <a
                          href={order.voiceNote}
                          target="_blank"
                          rel="noreferrer"
                          title="Play Voice Note"
                        >
                          <Mic size={18} color="var(--accent-primary)" />
                        </a>
                      )}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`status-pill ${getStatusColor(order.status)}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td>
                    <div className="order-summary">
                      <div className="item-count">
                        Budget: PKR {order.budget}
                      </div>
                      <div className="price-tag">
                        Final: PKR {order.finalPrice}
                      </div>
                      {order.paymentType && (
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--text-muted)",
                            marginTop: "0.25rem",
                          }}
                        >
                          Payment:{" "}
                          <span
                            style={{
                              color: "var(--accent-primary)",
                              fontWeight: 600,
                            }}
                          >
                            {order.paymentType}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    {can('customOrders', 'edit') && (
                    <button
                      className="icon-btn"
                      onClick={() => openEditModal(order)}
                      title="Edit Order"
                    >
                      <Edit size={18} />
                    </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan="9" className="empty-table-msg">
                    No custom orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {editModalVisible && selectedOrder && (
        <div className="modal-overlay">
          <div
            className="modal-content glass-panel"
            style={{ maxWidth: "500px", width: "100%", padding: "2rem" }}
          >
            <h3
              style={{
                marginBottom: "1.5rem",
                color: "var(--text-main)",
                fontSize: "1.25rem",
              }}
            >
              Process Custom Order #
              {selectedOrder._id
                .substring(selectedOrder._id.length - 8)
                .toUpperCase()}
            </h3>

            <div
              style={{
                marginBottom: "1.5rem",
                background: "rgba(255,255,255,0.05)",
                padding: "1rem",
                borderRadius: "8px",
              }}
            >
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "var(--text-secondary)",
                  marginBottom: "0.5rem",
                }}
              >
                DESCRIPTION
              </p>
              <p style={{ color: "var(--text-main)" }}>
                {selectedOrder.description}
              </p>
              {selectedOrder.selectedProducts?.length > 0 && (
                <div style={{ marginTop: "1rem" }}>
                  <p
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--text-secondary)",
                    }}
                  >
                    SELECTED PRODUCTS:
                  </p>
                  <ul
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--text-main)",
                      paddingLeft: "1.2rem",
                    }}
                  >
                    {selectedOrder.selectedProducts.map((p) => (
                      <li key={p._id}>
                        {p.name} - PKR {p.price}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {selectedOrder.billImage && (
                <div style={{ marginTop: "1rem" }}>
                  <p
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--text-secondary)",
                      marginBottom: "0.5rem",
                    }}
                  >
                    RIDER UPLOADED BILL:
                  </p>
                  <a
                    href={selectedOrder.billImage}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <img
                      src={selectedOrder.billImage}
                      alt="Shop Bill"
                      style={{
                        width: "100%",
                        borderRadius: "8px",
                        border: "1px solid var(--border-light)",
                      }}
                    />
                  </a>
                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--accent-primary)",
                      marginTop: "0.5rem",
                    }}
                  >
                    Bill Amount: PKR {selectedOrder.billAmount || 0}
                  </p>
                </div>
              )}
            </div>

            <div className="input-field" style={{ marginBottom: "1.5rem" }}>
              <label
                style={{
                  fontSize: "0.85rem",
                  marginBottom: "0.75rem",
                  color: "var(--text-secondary)",
                }}
              >
                SET FINAL PRICE (PKR)
              </label>
              <div className="input-wrapper">
                <input
                  type="number"
                  value={finalPrice}
                  onChange={(e) => setFinalPrice(e.target.value)}
                  placeholder="Enter final price for this order"
                />
              </div>
            </div>

            <div className="input-field" style={{ marginBottom: "1.5rem" }}>
              <label
                style={{
                  fontSize: "0.85rem",
                  marginBottom: "0.75rem",
                  color: "var(--text-secondary)",
                }}
              >
                UPDATE STATUS
              </label>
              <div className="input-wrapper input-wrapper-select">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  {[
                    "Pending",
                    "Reviewing",
                    "Accepted",
                    "Preparing",
                    "Picked up",
                    "On the way",
                    "Delivered",
                    "Cancelled",
                    "Rejected",
                  ].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
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
                {isUpdating ? "Updating..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomOrders;
