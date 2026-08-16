import React from "react";
import { X, User, MapPin, Phone, Truck, Package, DollarSign, Clock, Store } from "lucide-react";

const OrderDetailsModal = ({ order, onClose }) => {
  if (!order) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div className="modal-content glass-panel" style={{ maxWidth: "600px", width: "100%", maxHeight: "90vh", overflowY: "auto", padding: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Package size={20} /> Order Details #{order._id.substring(order._id.length - 8).toUpperCase()}
          </h3>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-main)" }}>
            <X size={24} />
          </button>
        </div>

        {/* Status and Timestamps */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem", background: "var(--bg-secondary)", padding: "1rem", borderRadius: "8px" }}>
          <div>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block" }}>Status</span>
            <span className={`status-pill status-${order.status.toLowerCase().replace(' ', '-')}`} style={{ display: "inline-block", marginTop: "0.25rem" }}>
              {order.status}
            </span>
          </div>
          <div>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block" }}>Created At</span>
            <div style={{ fontSize: "0.9rem", marginTop: "0.25rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <Clock size={14}/> {new Date(order.createdAt).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Customer & Shop */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
          <div style={{ background: "var(--bg-secondary)", padding: "1rem", borderRadius: "8px" }}>
            <h4 style={{ margin: "0 0 0.5rem 0", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--accent-primary)" }}>
              <User size={16} /> Customer
            </h4>
            <div style={{ fontSize: "0.9rem" }}>
              <div><strong>{order.customer?.name || "Unknown"}</strong></div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", marginTop: "0.25rem" }}><Phone size={14}/> {order.customer?.phone || "N/A"}</div>
            </div>
          </div>
          <div style={{ background: "var(--bg-secondary)", padding: "1rem", borderRadius: "8px" }}>
            <h4 style={{ margin: "0 0 0.5rem 0", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--accent-primary)" }}>
              <Store size={16} /> Shop
            </h4>
            <div style={{ fontSize: "0.9rem" }}>
              <div><strong>{order.shops?.[0]?.shopDetails?.name || order.shops?.[0]?.name || "Unknown"}</strong></div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", marginTop: "0.25rem" }}><Phone size={14}/> {order.shops?.[0]?.phone || "N/A"}</div>
            </div>
          </div>
        </div>

        {/* Address */}
        <div style={{ marginBottom: "1.5rem", background: "var(--bg-secondary)", padding: "1rem", borderRadius: "8px" }}>
          <h4 style={{ margin: "0 0 0.5rem 0", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--accent-primary)" }}>
            <MapPin size={16} /> Delivery Address
          </h4>
          <p style={{ margin: 0, fontSize: "0.9rem" }}>{order.deliveryAddress?.address || "No address provided"}</p>
        </div>

        {/* Rider */}
        <div style={{ marginBottom: "1.5rem", background: "var(--bg-secondary)", padding: "1rem", borderRadius: "8px" }}>
          <h4 style={{ margin: "0 0 0.5rem 0", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--accent-primary)" }}>
            <Truck size={16} /> Rider
          </h4>
          {order.rider ? (
            <div style={{ fontSize: "0.9rem" }}>
              <div><strong>{order.rider.name}</strong></div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", marginTop: "0.25rem" }}><Phone size={14}/> {order.rider.phone || "N/A"}</div>
            </div>
          ) : (
            <div style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>Not assigned yet</div>
          )}
        </div>

        {/* Items */}
        <div style={{ marginBottom: "1.5rem" }}>
          <h4 style={{ margin: "0 0 1rem 0", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--accent-primary)" }}>
            <Package size={16} /> Ordered Items
          </h4>
          <div style={{ background: "var(--bg-secondary)", borderRadius: "8px", overflow: "hidden" }}>
            {order.items?.map((item, index) => (
              <div key={index} style={{ padding: "1rem", borderBottom: index < order.items.length - 1 ? "1px solid var(--border-color)" : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                  <strong style={{ fontSize: "0.95rem" }}>{item.quantity}x {item.product?.name || "Product"}</strong>
                  <strong style={{ fontSize: "0.95rem" }}>PKR {item.total_item_price || (item.price * item.quantity)}</strong>
                </div>
                {item.selected_variant?.title && (
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginLeft: "1.5rem" }}>
                    Variant: {item.selected_variant.title} (+PKR {item.selected_variant.price})
                  </div>
                )}
                {item.selected_addons?.map((addon, idx) => (
                  <div key={idx} style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginLeft: "1.5rem" }}>
                    Addon: {addon.quantity}x {addon.name} (+PKR {addon.price * addon.quantity})
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Financials */}
        <div style={{ marginBottom: "1.5rem", background: "var(--bg-secondary)", padding: "1.5rem", borderRadius: "8px" }}>
          <h4 style={{ margin: "0 0 1rem 0", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--accent-primary)" }}>
            <DollarSign size={16} /> Payment Details
          </h4>
          
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
            <span>Subtotal</span>
            <span>PKR {order.subtotal || 0}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
            <span>Delivery Fee</span>
            <span>PKR {order.deliveryFee || 0}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border-color)", fontSize: "1.1rem", fontWeight: "bold" }}>
            <span>Total Price</span>
            <span style={{ color: "var(--accent-primary)" }}>PKR {order.totalPrice || 0}</span>
          </div>
          
          <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border-color)", display: "flex", gap: "1rem", fontSize: "0.9rem" }}>
            <div>
              <span style={{ color: "var(--text-muted)" }}>Method: </span> 
              <strong>{order.paymentMethod}</strong>
            </div>
            <div>
              <span style={{ color: "var(--text-muted)" }}>Status: </span> 
              <span className={`status-pill ${order.isPaid ? 'status-delivered' : 'status-pending'}`} style={{ padding: "2px 6px", fontSize: "0.8rem" }}>
                {order.isPaid ? "Paid" : "Pending"}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button className="primary-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;
