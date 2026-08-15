import React from "react";
import { X, User, MapPin, Phone, Mail, FileText, CreditCard } from "lucide-react";

const UserDetailsModal = ({ user, onClose }) => {
  if (!user) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div className="modal-content glass-panel" style={{ maxWidth: "600px", width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <User size={20} /> User Details ({user.role})
          </h3>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-main)" }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ display: "flex", gap: "1.5rem", marginBottom: "2rem", alignItems: "center" }}>
          <img 
            src={user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`} 
            alt={user.name}
            style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover" }}
          />
          <div>
            <h2 style={{ margin: "0 0 0.5rem 0" }}>{user.name}</h2>
            <div style={{ display: "flex", gap: "1rem", color: "var(--text-muted)", fontSize: "0.9rem", flexWrap: "wrap" }}>
              {user.email && <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}><Mail size={14}/> {user.email}</span>}
              <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}><Phone size={14}/> {user.phone}</span>
              <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}><MapPin size={14}/> {user.city}</span>
            </div>
            <div style={{ marginTop: "0.5rem" }}>
              <span className={`status-badge ${user.isOnline ? "verified" : "pending"}`} style={{ display: "inline-block", marginRight: "0.5rem" }}>
                {user.isOnline ? "Online" : "Offline"}
              </span>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Joined: {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Global Details */}
        <div className="input-field" style={{ marginBottom: "1.5rem" }}>
          <label>Address</label>
          <div style={{ padding: "0.75rem", background: "var(--bg-secondary)", borderRadius: "8px", fontSize: "0.9rem" }}>
            {user.address || "No address provided."}
          </div>
        </div>

        {/* Rider Specific Details */}
        {user.role === "rider" && (
          <div style={{ background: "var(--bg-secondary)", padding: "1.5rem", borderRadius: "12px", marginBottom: "1.5rem" }}>
            <h4 style={{ margin: "0 0 1rem 0", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--accent-primary)" }}>
              <FileText size={18} /> Rider Documents & Info
            </h4>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
              <div>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>CNIC</span>
                {user.cnic && (user.cnic.startsWith("http") || user.cnic.startsWith("data:")) ? (
                  <img src={user.cnic} alt="CNIC" style={{ width: "100%", height: "100px", objectFit: "cover", borderRadius: "8px", border: "1px solid var(--border-color)" }} />
                ) : (
                  <div style={{ fontWeight: 500 }}>{user.cnic || "Not provided"}</div>
                )}
              </div>
              <div>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>Driving License</span>
                {user.drivingLicense && (user.drivingLicense.startsWith("http") || user.drivingLicense.startsWith("data:")) ? (
                  <img src={user.drivingLicense} alt="License" style={{ width: "100%", height: "100px", objectFit: "cover", borderRadius: "8px", border: "1px solid var(--border-color)" }} />
                ) : (
                  <div style={{ fontWeight: 500 }}>{user.drivingLicense || "Not provided"}</div>
                )}
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginBottom: "0.5rem" }}>Bike Details</span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.9rem" }}>
                <div><strong>Make:</strong> {user.bikeDetails?.name || "N/A"}</div>
                <div><strong>Model:</strong> {user.bikeDetails?.model || "N/A"}</div>
                <div><strong>Plate:</strong> {user.bikeDetails?.plateNumber || "N/A"}</div>
                <div><strong>Color:</strong> {user.bikeDetails?.color || "N/A"}</div>
              </div>
            </div>
          </div>
        )}

        {/* Shopkeeper Specific Details */}
        {user.role === "shopkeeper" && (
          <div style={{ background: "var(--bg-secondary)", padding: "1.5rem", borderRadius: "12px", marginBottom: "1.5rem" }}>
            <h4 style={{ margin: "0 0 1rem 0", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--accent-primary)" }}>
              <FileText size={18} /> Shop Details
            </h4>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", fontSize: "0.9rem" }}>
              <div><strong>Shop Name:</strong> <br/> {user.shopDetails?.name || "N/A"}</div>
              <div><strong>Business Type:</strong> <br/> {user.shopDetails?.businessType || "N/A"}</div>
              <div><strong>Category:</strong> <br/> {user.shopDetails?.category || "N/A"}</div>
              <div><strong>Commission:</strong> <br/> {user.shopDetails?.percentageCharge || 0}%</div>
              <div><strong>Working Hours:</strong> <br/> {user.shopDetails?.startTime} - {user.shopDetails?.endTime}</div>
              <div><strong>Extra Contact:</strong> <br/> {user.shopDetails?.extraNumber || "N/A"}</div>
            </div>
            
            {user.shopDetails?.availabilityDays && user.shopDetails.availabilityDays.length > 0 && (
              <div style={{ marginTop: "1rem" }}>
                <strong>Days Open:</strong>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                  {user.shopDetails.availabilityDays.map(day => (
                    <span key={day} style={{ background: "var(--accent-primary)", color: "white", padding: "2px 8px", borderRadius: "12px", fontSize: "0.8rem" }}>
                      {day}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Wallet & Accounts */}
        <div style={{ background: "var(--bg-secondary)", padding: "1.5rem", borderRadius: "12px" }}>
          <h4 style={{ margin: "0 0 1rem 0", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--accent-primary)" }}>
            <CreditCard size={18} /> Financials
          </h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", fontSize: "0.9rem" }}>
            <div>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block" }}>Wallet Balance</span>
              <strong style={{ fontSize: "1.1rem" }}>PKR {user.walletBalance || 0}</strong>
            </div>
            <div>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block" }}>Withdrawal Account</span>
              {user.withdrawalAccountDetails ? (
                <div>
                  <div>{user.withdrawalAccountDetails.bankName}</div>
                  <div>{user.withdrawalAccountDetails.accountTitle}</div>
                  <div style={{ color: "var(--text-muted)" }}>{user.withdrawalAccountDetails.accountNumber}</div>
                </div>
              ) : (
                <span style={{ color: "var(--text-muted)" }}>Not setup</span>
              )}
            </div>
          </div>
        </div>

        <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end" }}>
          <button className="primary-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;
