import React from "react";
import { X, User, MapPin, Phone, Truck, FileText, Image as ImageIcon, Mic, DollarSign, Clock, List } from "lucide-react";

const CustomOrderDetailsModal = ({ order, onClose }) => {
  if (!order) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div className="modal-content glass-panel" style={{ maxWidth: "600px", width: "100%", maxHeight: "90vh", overflowY: "auto", padding: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <FileText size={20} /> Custom Order #{order._id.substring(order._id.length - 8).toUpperCase()}
          </h3>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-main)" }}>
            <X size={24} />
          </button>
        </div>

        {/* Status and Type */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem", background: "var(--bg-secondary)", padding: "1rem", borderRadius: "8px" }}>
          <div>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block" }}>Status</span>
            <span className={`status-pill status-${order.status.toLowerCase().replace(' ', '-')}`} style={{ display: "inline-block", marginTop: "0.25rem" }}>
              {order.status}
            </span>
          </div>
          <div>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block" }}>Type</span>
            <span className="status-pill" style={{ 
              display: "inline-block", 
              marginTop: "0.25rem",
              background: order.type === "medicine" ? "rgba(34, 197, 94, 0.1)" : "rgba(59, 130, 246, 0.1)",
              color: order.type === "medicine" ? "#22c55e" : "var(--accent-primary)"
            }}>
              {order.type === "medicine" ? "Medicine" : "Custom"}
            </span>
          </div>
        </div>

        {/* Timestamps */}
        <div style={{ marginBottom: "1.5rem", background: "var(--bg-secondary)", padding: "1rem", borderRadius: "8px", fontSize: "0.9rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Clock size={16} color="var(--accent-primary)" />
            <strong>Created:</strong> {new Date(order.createdAt).toLocaleString()}
          </div>
          {order.updatedAt && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
              <Clock size={16} color="var(--accent-primary)" />
              <strong>Last Updated:</strong> {new Date(order.updatedAt).toLocaleString()}
            </div>
          )}
        </div>

        {/* Customer & Rider */}
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
              <Truck size={16} /> Assigned Rider
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
        </div>

        {/* Address */}
        <div style={{ marginBottom: "1.5rem", background: "var(--bg-secondary)", padding: "1rem", borderRadius: "8px" }}>
          <h4 style={{ margin: "0 0 0.5rem 0", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--accent-primary)" }}>
            <MapPin size={16} /> Delivery Address
          </h4>
          <p style={{ margin: 0, fontSize: "0.9rem" }}>{order.deliveryAddress?.address || "No address provided"}</p>
        </div>

        {/* Request Details */}
        <div style={{ marginBottom: "1.5rem", background: "var(--bg-secondary)", padding: "1rem", borderRadius: "8px" }}>
          <h4 style={{ margin: "0 0 0.5rem 0", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--accent-primary)" }}>
            <FileText size={16} /> Description
          </h4>
          <p style={{ margin: 0, fontSize: "0.95rem", lineHeight: "1.5", color: "var(--text-main)" }}>
            {order.description || "No description provided."}
          </p>

          {(order.image || order.voiceNote) && (
            <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border-color)" }}>
              {order.image && (
                <a href={order.image} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--accent-primary)", textDecoration: "none", fontSize: "0.9rem" }}>
                  <ImageIcon size={18} /> View Image Attachment
                </a>
              )}
              {order.voiceNote && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", width: "100%" }}>
                  <Mic size={18} color="var(--accent-primary)" />
                  <audio controls src={order.voiceNote} style={{ height: "30px", flex: 1 }} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Selected Products */}
        {order.selectedProducts && order.selectedProducts.length > 0 && (
          <div style={{ marginBottom: "1.5rem" }}>
            <h4 style={{ margin: "0 0 1rem 0", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--accent-primary)" }}>
              <List size={16} /> Selected Products (By Shop/Rider)
            </h4>
            <div style={{ background: "var(--bg-secondary)", borderRadius: "8px", overflow: "hidden" }}>
              {order.selectedProducts.map((p, idx) => (
                <div key={idx} style={{ padding: "0.75rem 1rem", borderBottom: idx < order.selectedProducts.length - 1 ? "1px solid var(--border-color)" : "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.95rem" }}>{p.name}</span>
                  <strong style={{ fontSize: "0.95rem" }}>PKR {p.price}</strong>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Financials & Bill */}
        <div style={{ marginBottom: "1.5rem", background: "var(--bg-secondary)", padding: "1.5rem", borderRadius: "8px" }}>
          <h4 style={{ margin: "0 0 1rem 0", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--accent-primary)" }}>
            <DollarSign size={16} /> Financials
          </h4>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>Estimated Budget</span>
              <strong style={{ fontSize: "1.1rem" }}>PKR {order.budget || 0}</strong>
            </div>
            <div>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>Final Price</span>
              <strong style={{ fontSize: "1.1rem", color: "var(--accent-primary)" }}>PKR {order.finalPrice || 0}</strong>
            </div>
            {order.paymentType && (
              <div style={{ gridColumn: "1 / -1", marginTop: "0.5rem" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "inline-block", marginRight: "0.5rem" }}>Payment Method:</span>
                <strong>{order.paymentType}</strong>
              </div>
            )}
          </div>

          {order.billImage && (
            <div style={{ marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "1px solid var(--border-color)" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "block", marginBottom: "0.5rem" }}>Rider Uploaded Bill</span>
              <a href={order.billImage} target="_blank" rel="noreferrer">
                <img src={order.billImage} alt="Shop Bill" style={{ width: "100%", maxHeight: "200px", objectFit: "cover", borderRadius: "8px", border: "1px solid var(--border-light)" }} />
              </a>
              {order.billAmount && (
                <div style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "var(--accent-primary)", fontWeight: 500 }}>
                  Bill Amount: PKR {order.billAmount}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button className="primary-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default CustomOrderDetailsModal;
