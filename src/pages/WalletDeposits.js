import React, { useState, useEffect } from "react";
import { adminService } from "../services/adminService";
import {
  Check,
  X,
  Wallet,
  Loader2,
  Image as ImageIcon,
  RefreshCw,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { usePermissions } from "../hooks/usePermissions";
import AdminDateFilter, {
  AdminCityFilter,
  getDateFilterParams,
} from "../components/AdminDateFilter";
import { useAdminCityFilter } from "../hooks/useAdminCityFilter";

const WalletDeposits = () => {
  const { can } = usePermissions();
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const { cities, selectedCity, setSelectedCity, cityParams } =
    useAdminCityFilter();

  useEffect(() => {
    fetchDeposits();
  }, [dateFilter, customStartDate, customEndDate, selectedCity]);

  const fetchDeposits = async () => {
    setLoading(true);
    try {
      const filterParams = {
        ...getDateFilterParams(dateFilter, customStartDate, customEndDate),
        ...cityParams,
      };
      const data = await adminService.getWalletDeposits(filterParams);
      setDeposits(data || []);
    } catch (error) {
      toast.error(error.message || "Failed to load wallet deposits");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (
      !window.confirm(
        "Approve this deposit? The amount will be added to the user's wallet balance.",
      )
    )
      return;
    try {
      await adminService.approveWalletDeposit(id);
      toast.success("Deposit approved successfully!");
      fetchDeposits();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to approve deposit");
    }
  };

  const handleReject = async (id) => {
    const reason = prompt("Enter reason for rejecting this deposit request:");
    if (reason === null) return; // Cancelled prompt
    try {
      await adminService.rejectWalletDeposit(id, { rejectionReason: reason });
      toast.success("Deposit request rejected.");
      fetchDeposits();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reject deposit");
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
            Wallet Deposit Approvals
          </h2>
          <p className="section-subtitle">
            Verify user deposit requests, view receipt screenshots, and credit
            users' in-app wallets.
          </p>
        </div>
        <button className="primary-btn icon-text-btn" onClick={fetchDeposits}>
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
            <p style={{ marginTop: "0.5rem" }}>Loading deposit requests...</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>User Details</th>
                <th>Requested Amount</th>
                <th style={{ textAlign: "center" }}>Receipt Screenshot</th>
                <th style={{ textAlign: "center" }}>Status</th>
                <th style={{ width: "180px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {deposits.map((dep) => (
                <tr key={dep._id}>
                  <td>
                    {new Date(dep.createdAt).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: "var(--text-main)" }}>
                      {dep.user?.name || "N/A"}
                    </div>
                    <div
                      style={{ fontSize: "12px", color: "var(--text-muted)" }}
                    >
                      {dep.user?.email || "N/A"}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        textTransform: "capitalize",
                      }}
                    >
                      Role: {dep.user?.role || "user"}
                    </div>
                  </td>
                  <td>
                    <strong
                      style={{
                        fontSize: "1.1rem",
                        color: "var(--accent-primary)",
                      }}
                    >
                      Rs {dep.amount}
                    </strong>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {dep.paymentScreenshot ? (
                      <a
                        href={dep.paymentScreenshot}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          color: "var(--accent-primary)",
                          textDecoration: "underline",
                          fontSize: "0.875rem",
                          fontWeight: 600,
                        }}
                      >
                        <ImageIcon size={14} /> View Receipt
                      </a>
                    ) : (
                      <span style={{ color: "var(--text-muted)" }}>
                        No proof
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span
                      className={`status-pill ${getStatusColor(dep.status)}`}
                      style={{ textTransform: "capitalize" }}
                    >
                      {dep.status}
                    </span>
                    {dep.status === "rejected" && dep.rejectionReason && (
                      <div
                        style={{
                          fontSize: "11px",
                          color: "red",
                          marginTop: "4px",
                          maxWidth: "200px",
                        }}
                      >
                        Reason: {dep.rejectionReason}
                      </div>
                    )}
                  </td>
                  <td>
                    {dep.status === "pending" ? (
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
                            title="Approve & Credit Balance"
                            onClick={() => handleApprove(dep._id)}
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
                            onClick={() => handleReject(dep._id)}
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
              {deposits.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-table-msg">
                    No deposit requests found in records.
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

export default WalletDeposits;
