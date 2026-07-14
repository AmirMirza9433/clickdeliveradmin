import {
  Bell,
  Image as ImageIcon,
  Loader2,
  Send,
  User,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { adminService } from "../services/adminService";
import { usePermissions } from "../hooks/usePermissions";

const Notifications = () => {
  const { can } = usePermissions();
  const [formData, setFormData] = useState({
    recipientType: "all",
    recipientIds: [],
    title: "",
    message: "",
    imageUrl: "",
    notificationType: "both",
  });
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async () => {
    try {
      const data = await adminService.getUsers();
      setAllUsers(data);
    } catch (error) {
      toast.error(error.message || "Error fetching users");
    } finally {
      setFetchingUsers(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData({ ...formData, imageUrl: "" });
  };

  const handleUserSelect = (user) => {
    const isSelected = selectedUsers.some((u) => u._id === user._id);
    let newSelectedUsers;
    if (isSelected) {
      newSelectedUsers = selectedUsers.filter((u) => u._id !== user._id);
    } else {
      newSelectedUsers = [...selectedUsers, user];
    }
    setSelectedUsers(newSelectedUsers);
    setFormData({
      ...formData,
      recipientIds: newSelectedUsers.map((u) => u._id),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.message) {
      toast.error("Title and message are required");
      return;
    }

    if (
      formData.recipientType === "specific" &&
      formData.recipientIds.length === 0
    ) {
      toast.error("Please select at least one user");
      return;
    }

    setLoading(true);
    try {
      let uploadedImageUrl = formData.imageUrl;

      if (imageFile) {
        const uploadResponse = await adminService.uploadImage(imageFile);
        uploadedImageUrl = uploadResponse.imageUrl;
      }

      await adminService.sendCustomNotification({
        ...formData,
        imageUrl: uploadedImageUrl,
      });

      toast.success("Notification sent successfully!");

      setFormData({
        recipientType: "all",
        recipientIds: [],
        title: "",
        message: "",
        imageUrl: "",
        notificationType: "both",
      });
      setSelectedUsers([]);
      setImageFile(null);
      setImagePreview(null);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Error sending notification",
      );
    } finally {
      setLoading(false);
    }
  };

  if (fetchingUsers) {
    return (
      <div className="content-area">
        <div className="table-loader">
          <Loader2 className="animate-spin" size={24} />
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

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
              <Bell size={18} />
            </div>
            Send Custom Notifications
          </h2>
          <p className="section-subtitle">
            Send push notifications to specific users or groups
          </p>
        </div>
      </div>

      <div
        className="glass-panel"
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          padding: "2.5rem",
          borderRadius: 30,
        }}
      >
        <form onSubmit={handleSubmit}>
          <div className="input-field">
            <label style={{ fontSize: "0.85rem", marginBottom: "0.75rem" }}>
              RECIPIENT TYPE
            </label>
            <div className="input-wrapper input-wrapper-select">
              <div className="input-icon">
                <Users size={18} />
              </div>
              <select
                value={formData.recipientType}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    recipientType: e.target.value,
                    recipientIds: [],
                  });
                  setSelectedUsers([]);
                }}
              >
                <option value="all">All Users</option>
                <option value="customers">All Customers</option>
                <option value="riders">All Riders</option>
                <option value="shops">All Shops</option>
                <option value="specific">Specific User(s)</option>
              </select>
            </div>
          </div>

          {formData.recipientType === "specific" && (
            <div className="input-field" style={{ marginTop: "2rem" }}>
              <label style={{ fontSize: "0.85rem", marginBottom: "0.75rem" }}>
                SELECT USERS
              </label>
              <div
                style={{
                  maxHeight: "300px",
                  overflowY: "auto",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-lg)",
                  padding: "1rem",
                  background: "rgba(255, 255, 255, 0.02)",
                }}
              >
                {allUsers.map((user) => (
                  <div
                    key={user._id}
                    onClick={() => handleUserSelect(user)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.75rem",
                      marginBottom: "0.5rem",
                      borderRadius: "var(--radius-md)",
                      cursor: "pointer",
                      background: selectedUsers.some((u) => u._id === user._id)
                        ? "rgba(59, 130, 246, 0.1)"
                        : "transparent",
                      border: selectedUsers.some((u) => u._id === user._id)
                        ? "1px solid rgba(59, 130, 246, 0.3)"
                        : "1px solid transparent",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: "50%",
                          background: "var(--accent-primary)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontWeight: 600,
                        }}
                      >
                        {user.name?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{user.name}</div>
                        <div
                          style={{
                            fontSize: "0.8rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          {user.email} • {user.role}
                        </div>
                      </div>
                    </div>
                    {selectedUsers.some((u) => u._id === user._id) && (
                      <div style={{ color: "var(--accent-primary)" }}>
                        <User size={20} fill="currentColor" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="input-field" style={{ marginTop: "2rem" }}>
            <label style={{ fontSize: "0.85rem", marginBottom: "0.75rem" }}>
              NOTIFICATION TITLE
            </label>
            <div className="input-wrapper">
              <div className="input-icon">
                <Bell size={18} />
              </div>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Enter notification title"
              />
            </div>
          </div>

          <div className="input-field" style={{ marginTop: "2rem" }}>
            <label style={{ fontSize: "0.85rem", marginBottom: "0.75rem" }}>
              NOTIFICATION MESSAGE
            </label>
            <div className="input-wrapper">
              <textarea
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                placeholder="Enter notification message"
                rows={4}
                style={{
                  width: "100%",
                  padding: "0.875rem 1rem",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--border-color)",
                  background: "rgba(255, 255, 255, 0.03)",
                  color: "var(--text-main)",
                  fontSize: "1rem",
                  resize: "vertical",
                  outline: "none",
                  transition: "all 0.2s ease",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--accent-primary)";
                  e.target.style.boxShadow =
                    "0 0 0 4px rgba(59, 130, 246, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--border-color)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>
          </div>

          <div className="input-field" style={{ marginTop: "2rem" }}>
            <label style={{ fontSize: "0.85rem", marginBottom: "0.75rem" }}>
              IMAGE (OPTIONAL)
            </label>
            {imagePreview ? (
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  maxWidth: 300,
                  borderRadius: "var(--radius-lg)",
                  overflow: "hidden",
                }}
              >
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{ width: "100%", height: "auto" }}
                />
                <button
                  type="button"
                  onClick={removeImage}
                  style={{
                    position: "absolute",
                    top: "0.75rem",
                    right: "0.75rem",
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "rgba(0,0,0,0.7)",
                    border: "none",
                    color: "white",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = "rgba(239, 68, 68, 0.8)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "rgba(0,0,0,0.7)";
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <div className="input-wrapper">
                <div className="input-icon">
                  <ImageIcon size={18} />
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </div>
            )}
          </div>

          <div className="input-field" style={{ marginTop: "2rem" }}>
            <label style={{ fontSize: "0.85rem", marginBottom: "0.75rem" }}>
              NOTIFICATION TYPE
            </label>
            <div className="input-wrapper input-wrapper-select">
              <div className="input-icon">
                <Bell size={18} />
              </div>
              <select
                value={formData.notificationType}
                onChange={(e) =>
                  setFormData({ ...formData, notificationType: e.target.value })
                }
              >
                <option value="push">Push Notification</option>
                <option value="normal">Normal Notification</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>

          <div style={{ marginTop: "3rem" }}>
            <button
              type="submit"
              className="primary-btn"
              style={{
                width: "100%",
                height: "52px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "0.75rem",
                fontSize: "1rem",
              }}
              disabled={loading || !can('notifications', 'yes')}
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Send size={20} />
              )}
              Send Notification
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Notifications;
