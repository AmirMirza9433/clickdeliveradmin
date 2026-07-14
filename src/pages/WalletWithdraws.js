import React, { useState, useEffect } from "react";
import { adminService } from "../services/adminService";
import {
  Check,
  X,
  Wallet,
  Loader2,
  Image as ImageIcon,
  Upload,
  RefreshCw,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { usePermissions } from "../hooks/usePermissions";
import AdminDateFilter, {
  AdminCityFilter,
  getDateFilterParams,
} from "../components/AdminDateFilter";
import { useAdminCityFilter } from "../hooks/useAdminCityFilter";

const WalletWithdraws = () => {
  const { can } = usePermissions();
  const [withdraws, setWithdraws] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWithdrawId, setSelectedWithdrawId] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [viewProofModal, setViewProofModal] = useState(false);
  const [proofImageUrl, setProofImageUrl] = useState(null);
  const [dateFilter, setDateFilter] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const { cities, selectedCity, setSelectedCity, cityParams } =
    useAdminCityFilter();

  useEffect(() => {
    fetchWithdraws();
  }, [dateFilter, customStartDate, customEndDate, selectedCity]);

  const fetchWithdraws = async () => {
    setLoading(true);
    try {
      const filterParams = {
        ...getDateFilterParams(dateFilter, customStartDate, customEndDate),
        ...cityParams,
      };
      const data = await adminService.getWalletWithdraws(filterParams);
      setWithdraws(data || []);
    } catch (error) {
      toast.error(error.message || "Failed to load wallet withdraws");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleApprove = async (id) => {
    setSelectedWithdrawId(id);
    setShowApprovalModal(true);
  };

  const confirmApprove = async () => {
    if (!selectedWithdrawId) return;

    try {
      setUploading(true);
      let withdrawalProofScreenshot = null;

      if (selectedFile) {
        const uploadData = await adminService.uploadImage(selectedFile);
        withdrawalProofScreenshot = uploadData.imageUrl;
      }

      await adminService.approveWalletWithdraw(selectedWithdrawId, {
        withdrawalProofScreenshot,
      });

      toast.success("Withdraw approved successfully!");
      setShowApprovalModal(false);
      setSelectedFile(null);
      setSelectedWithdrawId(null);
      fetchWithdraws();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to approve withdraw",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleReject = async (id) => {
    const reason = prompt("Enter reason for rejecting this withdraw request:");
    if (reason === null) return; // Cancelled prompt
    try {
      await adminService.rejectWalletWithdraw(id, { rejectionReason: reason });
      toast.success("Withdraw request rejected.");
      fetchWithdraws();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reject withdraw");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "status-delivered";
      case "rejected":
        return "status-cancelled";
      default:
        return "status-pending";
    }
  };

  return (
    <div className="content-area animate-fade-in">
      <div className="section-header">
        <div>
          <h2
            className="page-title"
            style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
          >
            <div
              className="logo-circle"
              style={{ width: 32, height: 32, boxShadow: "none" }}
            >
              <Wallet size={18} />
            </div>
            Wallet Withdraw Approvals
          </h2>
          <p className="section-subtitle">
            Verify user withdraw requests, attach proof screenshots, and debit
            users' in-app wallets.
          </p>
        </div>
        <button className="primary-btn icon-text-btn" onClick={fetchWithdraws}>
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

      <div className="glass-panel" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div className="table-loader">
            <Loader2
              className="animate-spin"
              size={24}
              style={{ margin: "0 auto" }}
            />
            <p style={{ marginTop: "0.5rem" }}>Loading withdraw requests...</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>User Details</th>
                <th>Withdrawal Account</th>
                <th>Requested Amount</th>
                <th style={{ textAlign: "center" }}>Proof Screenshot</th>
                <th style={{ textAlign: "center" }}>Status</th>
                <th style={{ width: "180px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {withdraws.map((w) => (
                <tr key={w._id}>
                  <td>
                    {new Date(w.createdAt).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: "var(--text-main)" }}>
                      {w.user?.name || "N/A"}
                    </div>
                    <div
                      style={{ fontSize: "12px", color: "var(--text-muted)" }}
                    >
                      {w.user?.email || "N/A"}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        textTransform: "capitalize",
                      }}
                    >
                      Role: {w.user?.role || "user"}
                    </div>
                  </td>
                  <td>
                    {w.withdrawalAccountDetails ? (
                      <>
                        <div
                          style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "var(--text-main)",
                          }}
                        >
                          {w.withdrawalAccountDetails.accountTitle}
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "var(--text-muted)",
                          }}
                        >
                          {w.withdrawalAccountDetails.accountNumber}
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "var(--text-muted)",
                          }}
                        >
                          {w.withdrawalAccountDetails.bankName}
                        </div>
                      </>
                    ) : (
                      <span
                        style={{ color: "var(--text-muted)", fontSize: "12px" }}
                      >
                        No account details
                      </span>
                    )}
                  </td>
                  <td>
                    <strong
                      style={{
                        fontSize: "1.1rem",
                        color: "var(--accent-primary)",
                      }}
                    >
                      Rs {w.amount}
                    </strong>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {w.withdrawalProofScreenshot ? (
                      <button
                        onClick={() => {
                          setProofImageUrl(w.withdrawalProofScreenshot);
                          setViewProofModal(true);
                        }}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          color: "var(--accent-primary)",
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          textDecoration: "underline",
                        }}
                      >
                        <ImageIcon size={14} /> View Proof
                      </button>
                    ) : (
                      <span style={{ color: "var(--text-muted)" }}>
                        No proof
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span
                      className={`status-pill ${getStatusColor(w.status)}`}
                      style={{ textTransform: "capitalize" }}
                    >
                      {w.status}
                    </span>
                    {w.status === "rejected" && w.rejectionReason && (
                      <div
                        style={{
                          fontSize: "11px",
                          color: "red",
                          marginTop: "4px",
                          maxWidth: "200px",
                        }}
                      >
                        Reason: {w.rejectionReason}
                      </div>
                    )}
                  </td>
                  <td>
                    {w.status === "pending" ? (
                      <div
                        className="action-btns"
                        style={{ justifyContent: "flex-end", gap: "0.5rem" }}
                      >
                        {can("walletDeposits", "approve") && (
                          <button
                            className="primary-btn"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "4px",
                              padding: "6px 12px",
                              fontSize: "12px",
                              fontWeight: 600,
                              borderRadius: "6px",
                              border: "none",
                              background: "var(--accent-success)",
                              color: "white",
                              cursor: "pointer",
                            }}
                            title="Approve & Debit Balance"
                            onClick={() => handleApprove(w._id)}
                          >
                            <Check size={14} /> Approve
                          </button>
                        )}
                        {can("walletDeposits", "reject") && (
                          <button
                            className="view-btn"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "4px",
                              padding: "6px 12px",
                              fontSize: "12px",
                              fontWeight: 600,
                              borderRadius: "6px",
                              border: "1px solid var(--accent-danger)",
                              background: "transparent",
                              color: "var(--accent-danger)",
                              cursor: "pointer",
                            }}
                            title="Reject request"
                            onClick={() => handleReject(w._id)}
                          >
                            <X size={14} /> Reject
                          </button>
                        )}
                      </div>
                    ) : (
                      <div
                        style={{
                          color: "var(--text-muted)",
                          textAlign: "right",
                          fontSize: "13px",
                        }}
                      >
                        Processed
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {withdraws.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty-table-msg">
                    No withdraw requests found in records.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showApprovalModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3>Approve Withdraw Request</h3>
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setSelectedFile(null);
                  setSelectedWithdrawId(null);
                }}
                className="close-btn"
              >
                <X size={20} />
              </button>
            </div>
            <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
              Attach a proof of the payment transfer (optional but recommended).
            </p>

            <div className="form-group">
              <label>Proof Screenshot</label>
              <div
                style={{
                  border: "2px dashed var(--border-color)",
                  borderRadius: "var(--radius-md)",
                  padding: "2rem",
                  textAlign: "center",
                  cursor: "pointer",
                  background: "rgba(255,255,255,0.03)",
                  transition: "all 0.2s",
                }}
                onClick={() =>
                  document.getElementById("proof-file-input")?.click()
                }
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = "var(--accent-primary)";
                  e.currentTarget.style.background = "rgba(59, 130, 246, 0.1)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-color)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                }}
              >
                <input
                  id="proof-file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
                {selectedFile ? (
                  <div>
                    <ImageIcon
                      size={36}
                      style={{
                        margin: "0 auto 0.75rem",
                        color: "var(--accent-primary)",
                      }}
                    />
                    <p
                      style={{
                        fontSize: "0.95rem",
                        fontWeight: 700,
                        color: "var(--text-main)",
                      }}
                    >
                      {selectedFile.name}
                    </p>
                    <p
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--text-muted)",
                        marginTop: "0.5rem",
                      }}
                    >
                      Click to change
                    </p>
                  </div>
                ) : (
                  <div>
                    <Upload
                      size={36}
                      style={{
                        margin: "0 auto 0.75rem",
                        color: "var(--text-muted)",
                      }}
                    />
                    <p
                      style={{
                        fontSize: "0.95rem",
                        fontWeight: 700,
                        color: "var(--text-main)",
                      }}
                    >
                      Click to upload proof screenshot
                    </p>
                    <p
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--text-muted)",
                        marginTop: "0.5rem",
                      }}
                    >
                      PNG, JPG up to 10MB
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "1rem",
                justifyContent: "flex-end",
                marginTop: "1rem",
              }}
            >
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setSelectedFile(null);
                  setSelectedWithdrawId(null);
                }}
                className="view-btn"
                style={{ padding: "0.75rem 1.5rem", fontWeight: 700 }}
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                onClick={confirmApprove}
                className="primary-btn"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontWeight: 800,
                  background: "var(--accent-success)",
                }}
                disabled={uploading}
              >
                {uploading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Check size={18} />
                )}
                {uploading ? "Processing..." : "Approve Withdraw"}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewProofModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "600px" }}>
            <div className="modal-header">
              <h3>Payment Proof</h3>
              <button
                onClick={() => {
                  setViewProofModal(false);
                  setProofImageUrl(null);
                }}
                className="close-btn"
              >
                <X size={20} />
              </button>
            </div>
            {proofImageUrl && (
              <img
                src={proofImageUrl}
                alt="Payment Proof"
                style={{
                  width: "100%",
                  borderRadius: "8px",
                  maxHeight: "70vh",
                  objectFit: "contain",
                }}
              />
            )}
            <button
              onClick={() => {
                setViewProofModal(false);
                setProofImageUrl(null);
              }}
              className="view-btn"
              style={{
                width: "100%",
                marginTop: "20px",
                padding: "12px",
                fontWeight: "700",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletWithdraws;
