import React, { useState, useEffect, useRef } from "react";
import { adminService } from "../services/adminService";
import { Dialog } from "@mui/material";
import { Plus, Pencil, Trash2, CreditCard, X, Loader2, Upload } from "lucide-react";
import { toast } from "react-hot-toast";
import { usePermissions } from "../hooks/usePermissions";

const PaymentMethods = () => {
  const { can } = usePermissions();
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [uploadingBankImage, setUploadingBankImage] = useState(false);
  const [uploadingQrImage, setUploadingQrImage] = useState(false);

  const [form, setForm] = useState({
    id: "",
    bankImage: "",
    bankName: "",
    accountTitle: "",
    accountNumber: "",
    qrImage: "",
  });

  const bankImageInputRef = useRef(null);
  const qrImageInputRef = useRef(null);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const data = await adminService.getPaymentMethods();
      setPaymentMethods(data || []);
    } catch (error) {
      toast.error(error.message || "Error fetching payment methods");
    } finally {
      setFetching(false);
    }
  };

  const handleOpen = (pm = null) => {
    if (pm) {
      setEditMode(true);
      setForm({
        id: pm._id,
        bankImage: pm.bankImage,
        bankName: pm.bankName,
        accountTitle: pm.accountTitle,
        accountNumber: pm.accountNumber,
        qrImage: pm.qrImage || "",
      });
    } else {
      setEditMode(false);
      setForm({
        id: "",
        bankImage: "",
        bankName: "",
        accountTitle: "",
        accountNumber: "",
        qrImage: "",
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setForm({
      id: "",
      bankImage: "",
      bankName: "",
      accountTitle: "",
      accountNumber: "",
      qrImage: "",
    });
  };

  const handleImageSelect = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (type === "bank") {
      setUploadingBankImage(true);
    } else {
      setUploadingQrImage(true);
    }

    try {
      const data = await adminService.uploadImage(file);
      if (type === "bank") {
        setForm((prev) => ({ ...prev, bankImage: data.imageUrl }));
        toast.success("Bank image uploaded");
      } else {
        setForm((prev) => ({ ...prev, qrImage: data.imageUrl }));
        toast.success("QR code image uploaded");
      }
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      if (type === "bank") {
        setUploadingBankImage(false);
      } else {
        setUploadingQrImage(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.bankImage || !form.bankName || !form.accountTitle || !form.accountNumber) {
      toast.error("Please fill in all required fields (Logo, Bank Name, Account Title, Account Number)");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        bankImage: form.bankImage,
        bankName: form.bankName,
        accountTitle: form.accountTitle,
        accountNumber: form.accountNumber,
        qrImage: form.qrImage || "",
      };

      if (editMode) {
        await adminService.updatePaymentMethod(form.id, payload);
        toast.success("Payment method updated successfully");
      } else {
        await adminService.createPaymentMethod(payload);
        toast.success("Payment method added successfully");
      }
      fetchPaymentMethods();
      handleClose();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Error processing request");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this payment method?")) {
      try {
        await adminService.deletePaymentMethod(id);
        toast.success("Payment method deleted successfully");
        fetchPaymentMethods();
      } catch (error) {
        toast.error(error.response?.data?.message || "Error deleting payment method");
      }
    }
  };

  return (
    <div className="content-area animate-fade-in">
      <div className="section-header">
        <div>
          <h2 className="page-title" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div className="logo-circle" style={{ width: 32, height: 32, boxShadow: "none" }}>
              <CreditCard size={18} />
            </div>
            Payments Management
          </h2>
          <p className="section-subtitle">Configure bank payment details and QR codes for user profile details in the app</p>
        </div>
        {can('paymentMethods', 'create') && (
        <button className="primary-btn icon-text-btn" onClick={() => handleOpen()}>
          <Plus size={18} />
          Add Payment Method
        </button>
        )}
      </div>

      <div className="glass-panel" style={{ padding: 0, overflow: "hidden" }}>
        {fetching ? (
          <div className="table-loader">
            <Loader2 className="animate-spin" size={24} style={{ margin: "0 auto" }} />
            <p style={{ marginTop: "0.5rem" }}>Loading payment methods...</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: "80px", textAlign: "center" }}>Logo</th>
                <th>Bank Name</th>
                <th>Account Title</th>
                <th>Account Number</th>
                <th style={{ width: "100px", textAlign: "center" }}>QR Code</th>
                <th style={{ width: "120px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paymentMethods.map((pm) => (
                <tr key={pm._id}>
                  <td style={{ textAlign: "center" }}>
                    <img
                      src={pm.bankImage}
                      alt={pm.bankName}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "8px",
                        objectFit: "cover",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    />
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: "var(--text-main)", fontSize: "1rem" }}>
                      {pm.bankName}
                    </div>
                  </td>
                  <td>{pm.accountTitle}</td>
                  <td>
                    <code style={{ background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: "4px" }}>
                      {pm.accountNumber}
                    </code>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {pm.qrImage ? (
                      <img
                        src={pm.qrImage}
                        alt="QR Code"
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "4px",
                          objectFit: "contain",
                          border: "1px solid rgba(255,255,255,0.08)",
                        }}
                      />
                    ) : (
                      <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>N/A</span>
                    )}
                  </td>
                  <td>
                    <div className="action-btns" style={{ justifyContent: "flex-end" }}>
                      {can('paymentMethods', 'edit') && (
                      <button className="action-btn verify" title="Edit" onClick={() => handleOpen(pm)}>
                        <Pencil size={16} />
                      </button>
                      )}
                      {can('paymentMethods', 'delete') && (
                      <button className="action-btn delete" title="Delete" onClick={() => handleDelete(pm._id)}>
                        <Trash2 size={16} />
                      </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {paymentMethods.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-table-msg">
                    No payment methods configured. Click "Add Payment Method" to configure one.
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
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-xl)",
            width: "100%",
            maxWidth: 480,
            padding: 0,
          },
        }}
      >
        <div style={{ padding: "2.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
            <h3 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0, color: "var(--text-main)" }}>
              {editMode ? "Update Payment Method" : "Add Payment Method"}
            </h3>
            <button className="icon-btn" onClick={handleClose} style={{ border: "none" }}>
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="modal-form" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Bank Image Upload */}
            <div className="form-group">
              <label style={{ fontSize: "0.85rem", marginBottom: "0.5rem", display: "block" }}>BANK LOGO IMAGE *</label>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                <input
                  type="text"
                  placeholder="Paste bank logo URL or upload →"
                  value={form.bankImage}
                  onChange={(e) => setForm({ ...form, bankImage: e.target.value })}
                  style={{ flex: 1 }}
                  required
                />
                <input
                  type="file"
                  ref={bankImageInputRef}
                  style={{ display: "none" }}
                  accept="image/*"
                  onChange={(e) => handleImageSelect(e, "bank")}
                />
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => bankImageInputRef.current.click()}
                  disabled={uploadingBankImage}
                  style={{
                    height: "42px",
                    width: "42px",
                    backgroundColor: "var(--accent-primary)",
                    color: "white",
                    borderRadius: "8px",
                  }}
                >
                  {uploadingBankImage ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Upload size={18} />
                  )}
                </button>
              </div>
              {form.bankImage && (
                <div style={{ marginTop: "0.5rem" }}>
                  <img
                    src={form.bankImage}
                    alt="Logo Preview"
                    style={{ height: "48px", width: "48px", borderRadius: "8px", objectFit: "cover" }}
                  />
                </div>
              )}
            </div>

            {/* Bank Name */}
            <div className="input-field">
              <label style={{ fontSize: "0.85rem", marginBottom: "0.5rem", display: "block" }}>BANK NAME *</label>
              <input
                type="text"
                required
                value={form.bankName}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                placeholder="e.g. Meezan Bank, JazzCash"
              />
            </div>

            {/* Account Title */}
            <div className="input-field">
              <label style={{ fontSize: "0.85rem", marginBottom: "0.5rem", display: "block" }}>ACCOUNT TITLE *</label>
              <input
                type="text"
                required
                value={form.accountTitle}
                onChange={(e) => setForm({ ...form, accountTitle: e.target.value })}
                placeholder="e.g. John Doe"
              />
            </div>

            {/* Account Number */}
            <div className="input-field">
              <label style={{ fontSize: "0.85rem", marginBottom: "0.5rem", display: "block" }}>ACCOUNT NUMBER / IBAN *</label>
              <input
                type="text"
                required
                value={form.accountNumber}
                onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
                placeholder="e.g. PK89 MEZN 0012 3456 7890"
              />
            </div>

            {/* QR Image Upload (Optional) */}
            <div className="form-group">
              <label style={{ fontSize: "0.85rem", marginBottom: "0.5rem", display: "block" }}>QR CODE IMAGE (OPTIONAL)</label>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                <input
                  type="text"
                  placeholder="Paste QR Code URL or upload →"
                  value={form.qrImage}
                  onChange={(e) => setForm({ ...form, qrImage: e.target.value })}
                  style={{ flex: 1 }}
                />
                <input
                  type="file"
                  ref={qrImageInputRef}
                  style={{ display: "none" }}
                  accept="image/*"
                  onChange={(e) => handleImageSelect(e, "qr")}
                />
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => qrImageInputRef.current.click()}
                  disabled={uploadingQrImage}
                  style={{
                    height: "42px",
                    width: "42px",
                    backgroundColor: "var(--accent-primary)",
                    color: "white",
                    borderRadius: "8px",
                  }}
                >
                  {uploadingQrImage ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Upload size={18} />
                  )}
                </button>
              </div>
              {form.qrImage && (
                <div style={{ marginTop: "0.5rem" }}>
                  <img
                    src={form.qrImage}
                    alt="QR Preview"
                    style={{ height: "60px", width: "60px", borderRadius: "8px", objectFit: "contain" }}
                  />
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
              <button type="button" className="view-btn" onClick={handleClose} style={{ flex: 1, height: "48px" }}>
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
                  gap: "0.5rem",
                }}
                disabled={loading}
              >
                {loading && <Loader2 className="animate-spin" size={18} />}
                {editMode ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </div>
      </Dialog>
    </div>
  );
};

export default PaymentMethods;
