import {
  Check,
  Image as ImageIcon,
  Plus,
  Trash2,
  X,
  Upload,
  Loader2,
  Clock,
  RefreshCw,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { toast } from "react-hot-toast";
import { io } from "socket.io-client";
import AdminDateFilter, {
  AdminCityFilter,
  getDateFilterParams,
} from "../components/AdminDateFilter";
import { useAdminCityFilter } from "../hooks/useAdminCityFilter";
import { usePermissions } from "../hooks/usePermissions";
import { adminService } from "../services/adminService";
import API from "../services/api";

const MAX_BANNER_VIDEO_SECONDS = 30;

const Banners = () => {
  const { can } = usePermissions();
  const [banners, setBanners] = useState([]);
  const [deletedBanners, setDeletedBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const { cities, selectedCity, setSelectedCity, cityParams } =
    useAdminCityFilter();
  const [showModal, setShowModal] = useState(false);
  const [settings, setSettings] = useState(null);
  const [availableCities, setAvailableCities] = useState([]);
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    brandLabel: "CLICK DELIVER",
    imageUrl: "",
    videoUrl: "",
    videoDuration: 0,
    days: 1,
    targetType: "none",
    cities: [],
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const tempVideoRef = useRef(null);

  const handleVideoUrlChange = (e) => {
    const url = e.target.value;
    setForm({ ...form, videoUrl: url, videoDuration: 0 });
    if (url && tempVideoRef.current) {
      tempVideoRef.current.src = url;
    }
  };

  const handleVideoLoadedMetadata = () => {
    if (tempVideoRef.current) {
      const duration = tempVideoRef.current.duration;
      if (duration > MAX_BANNER_VIDEO_SECONDS) {
        alert(
          `Video must be ${MAX_BANNER_VIDEO_SECONDS} seconds or less. Selected video is ${Math.round(
            duration,
          )} seconds.`,
        );
        setForm({ ...form, videoUrl: "", videoDuration: 0 });
      } else {
        setForm({ ...form, videoDuration: duration });
      }
    }
  };

  const load = async () => {
    try {
      setLoading(true);
      const filterParams = {
        ...getDateFilterParams(dateFilter, customStartDate, customEndDate),
        ...cityParams,
      };
      const [bannersData, citiesData, deletedBannersData] = await Promise.all([
        adminService.getBanners(filter || undefined, filterParams),
        adminService.getCities(),
        adminService.getDeletedBanners(filterParams),
      ]);
      setBanners(bannersData);
      setAvailableCities(citiesData || []);
      setDeletedBanners(deletedBannersData || []);
    } catch (error) {
      toast.error(error.message || "Failed to load banners");
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const data = await adminService.getAdminSettings();
      setSettings(data);
    } catch (error) {
      toast.error(error.message || "Failed to load settings");
    }
  };

  useEffect(() => {
    load();
    loadSettings();
  }, [filter, dateFilter, customStartDate, customEndDate, selectedCity]);

  useEffect(() => {
    const socketBaseUrl = API.defaults.baseURL.replace("/api", "");
    const socket = io(socketBaseUrl, { transports: ["websocket", "polling"] });

    socket.on("admin:bannerRequest", (banner) => {
      // Reload banners when a new request comes in
      load();
    });

    return () => socket.disconnect();
  }, []);

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const data = await adminService.uploadImage(file);
      setForm((prev) => ({ ...prev, imageUrl: data.imageUrl }));
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleVideoSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Get video duration first
    const getVideoDuration = (file) => {
      return new Promise((resolve, reject) => {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.onloadedmetadata = () => {
          resolve(video.duration);
          URL.revokeObjectURL(video.src);
        };
        video.onerror = reject;
        video.src = URL.createObjectURL(file);
      });
    };

    try {
      const duration = await getVideoDuration(file);
      if (duration > MAX_BANNER_VIDEO_SECONDS) {
        alert(
          `Video must be ${MAX_BANNER_VIDEO_SECONDS} seconds or less. Selected video is ${Math.round(duration)} seconds.`,
        );
        return;
      }

      setUploadingVideo(true);
      const data = await adminService.uploadVideo(file);
      setForm({ ...form, videoUrl: data.videoUrl, videoDuration: duration });
    } catch (err) {
      alert("Failed to process video");
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const bannerData = {
        ...form,
        dailyRate: form.videoUrl
          ? settings?.bannerVideoDailyRate ??
            settings?.bannerDailyRate ??
            500
          : settings?.bannerImageDailyRate ??
            settings?.bannerDailyRate ??
            500,
      };
      await adminService.createBanner(bannerData);
      toast.success("Banner published successfully!");
      setForm({
        title: "",
        subtitle: "",
        brandLabel: "CLICK DELIVER",
        imageUrl: "",
        videoUrl: "",
        days: 1,
        targetType: "none",
        cities: [],
      });
      setShowModal(false);
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Publish failed");
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setForm({
      title: "",
      subtitle: "",
      brandLabel: "CLICK DELIVER",
      imageUrl: "",
      videoUrl: "",
      videoDuration: 0,
      days: 1,
      targetType: "none",
      cities: [],
    });
  };

  const handleApprove = async (id, markPaid) => {
    try {
      await adminService.approveBanner(id, markPaid);
      toast.success("Banner approved");
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Approve failed");
    }
  };

  const handleReject = async (id) => {
    const reason = prompt("Reason for rejection:");
    if (reason === null) return;
    try {
      await adminService.rejectBanner(id, reason);
      toast.success("Banner rejected");
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Reject failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this banner?")) return;
    try {
      await adminService.deleteBanner(id);
      toast.success("Banner deleted");
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Delete failed");
    }
  };

  const handleExpire = async (id) => {
    if (!window.confirm("Expire this banner?")) return;
    try {
      await adminService.expireBanner(id);
      toast.success("Banner expired");
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Expire failed");
    }
  };

  const handleRestore = async (id) => {
    if (!window.confirm("Restore this banner?")) return;
    try {
      await adminService.restoreBanner(id);
      toast.success("Banner restored");
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Restore failed");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "status-delivered";
      case "rejected":
        return "status-cancelled";
      case "pending_payment":
        return "status-pending";
      case "pending_review":
        return "status-transit";
      default:
        return "";
    }
  };

  return (
    <div className="content-area animate-fade-in">
      <div className="section-header">
        <div>
          <h1 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ImageIcon size={28} className="text-primary" />
            Banners Management
          </h1>
          <p className="section-subtitle">
            Manage home carousel ads. Shopkeepers pay according to the daily
            rate set in Settings for promotion after admin approval.
          </p>
        </div>
        {can("banners", "create") && (
          <button
            className="primary-btn icon-text-btn"
            onClick={() => setShowModal(true)}
          >
            <Plus size={18} /> New Banner
          </button>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel animate-fade-in">
            <div className="modal-header">
              <h3>Create New Banner</h3>
              <button className="icon-btn close-btn" onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="modal-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    required
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Subtitle</label>
                  <input
                    value={form.subtitle}
                    onChange={(e) =>
                      setForm({ ...form, subtitle: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Duration (Days)</label>
                  <input
                    type="number"
                    min="1"
                    value={form.days}
                    onChange={(e) => setForm({ ...form, days: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: "0.5rem" }}>
                <label>Target Cities (Multi-select / All)</label>
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
                      checked={form.cities?.includes("All")}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setForm({ ...form, cities: ["All"] });
                        } else {
                          setForm({ ...form, cities: [] });
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
                        color: form.cities?.includes("All")
                          ? "var(--text-muted)"
                          : "var(--text-secondary)",
                        opacity: form.cities?.includes("All") ? 0.5 : 1,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={
                          form.cities?.includes("All") ||
                          form.cities?.includes(c.name)
                        }
                        disabled={form.cities?.includes("All")}
                        onChange={(e) => {
                          let updatedCities = [...(form.cities || [])];
                          if (e.target.checked) {
                            updatedCities.push(c.name);
                          } else {
                            updatedCities = updatedCities.filter(
                              (name) => name !== c.name,
                            );
                          }
                          setForm({
                            ...form,
                            cities: updatedCities,
                          });
                        }}
                      />
                      {c.name}
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label>Image</label>
                <div
                  className="image-upload-controls"
                  style={{ display: "flex", gap: "0.5rem" }}
                >
                  <input
                    type="text"
                    placeholder="Paste URL or upload file →"
                    value={form.imageUrl}
                    onChange={(e) =>
                      setForm({ ...form, imageUrl: e.target.value })
                    }
                    style={{ flex: 1 }}
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    accept="image/*"
                    onChange={handleImageSelect}
                  />
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => fileInputRef.current.click()}
                    disabled={uploadingImage}
                    title="Upload from system"
                    style={{
                      height: "42px",
                      width: "42px",
                      backgroundColor: "var(--accent-primary)",
                      color: "white",
                      borderRadius: "8px",
                    }}
                  >
                    {uploadingImage ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Upload size={18} />
                    )}
                  </button>
                </div>
                {form.imageUrl && (
                  <div
                    className="image-preview-mini"
                    style={{ marginTop: "0.5rem" }}
                  >
                    <img
                      src={form.imageUrl}
                      alt="Preview"
                      style={{
                        height: "60px",
                        borderRadius: "4px",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                <label>Video</label>
                <div
                  className="image-upload-controls"
                  style={{ display: "flex", gap: "0.5rem" }}
                >
                  <input
                    type="text"
                    placeholder="Paste URL or upload file →"
                    value={form.videoUrl}
                    onChange={handleVideoUrlChange}
                    style={{ flex: 1 }}
                  />
                  {/* Hidden video element to get duration for pasted URLs */}
                  <video
                    ref={tempVideoRef}
                    style={{ display: "none" }}
                    onLoadedMetadata={handleVideoLoadedMetadata}
                  />
                  <input
                    type="file"
                    ref={videoInputRef}
                    style={{ display: "none" }}
                    accept="video/*"
                    onChange={handleVideoSelect}
                  />
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => videoInputRef.current.click()}
                    disabled={uploadingVideo}
                    title="Upload from system"
                    style={{
                      height: "42px",
                      width: "42px",
                      backgroundColor: "var(--accent-primary)",
                      color: "white",
                      borderRadius: "8px",
                    }}
                  >
                    {uploadingVideo ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Upload size={18} />
                    )}
                  </button>
                </div>
                {form.videoUrl && (
                  <div
                    className="image-preview-mini"
                    style={{ marginTop: "0.5rem" }}
                  >
                    <video
                      src={form.videoUrl}
                      alt="Preview"
                      style={{
                        height: "60px",
                        borderRadius: "4px",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                      muted
                      playsInline
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="submit-btn primary-btn"
                style={{ marginTop: "1rem" }}
              >
                Publish Banner Now
              </button>
            </form>
          </div>
        </div>
      )}

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
          {[
            { id: "", label: "All Banners" },
            { id: "pending_review", label: "Pending Review" },
            { id: "pending_payment", label: "Pending Payment" },
            { id: "approved", label: "Active/Approved" },
            { id: "rejected", label: "Rejected" },
            { id: "deleted", label: "Deleted" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              style={{
                padding: "0.625rem 1.25rem",
                borderRadius: "var(--radius-md)",
                border: "none",
                background:
                  filter === tab.id ? "var(--accent-primary)" : "transparent",
                color: filter === tab.id ? "white" : "var(--text-muted)",
                fontWeight: 500,
                fontSize: "0.875rem",
                cursor: "pointer",
                transition: "all 0.2s ease",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                if (filter !== tab.id) {
                  e.target.style.background = "rgba(255, 255, 255, 0.05)";
                }
              }}
              onMouseLeave={(e) => {
                if (filter !== tab.id) {
                  e.target.style.background = "transparent";
                }
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="table-loader">Loading banners...</div>
      ) : filter === "deleted" ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {deletedBanners.map((b) => (
            <div
              key={b._id}
              className="glass-panel"
              style={{
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                padding: 0,
                borderRadius: "var(--radius-md)",
              }}
            >
              <div
                style={{
                  height: "140px",
                  background: "var(--bg-secondary)",
                  position: "relative",
                }}
              >
                {b.videoUrl ? (
                  <video
                    src={b.videoUrl}
                    alt={b.title}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      opacity: 0.6,
                    }}
                    muted
                    playsInline
                  />
                ) : (
                  <img
                    src={b.imageUrl}
                    alt={b.title}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      opacity: 0.6,
                    }}
                  />
                )}
                <div
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    display: "flex",
                    gap: "5px",
                  }}
                >
                  <span
                    className="status-pill"
                    style={{
                      background: "#64748b",
                      textTransform: "capitalize",
                      padding: "4px 8px",
                      fontSize: "11px",
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    Deleted
                  </span>
                </div>
              </div>
              <div
                style={{
                  padding: "16px",
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <h3
                  style={{
                    margin: "0 0 4px 0",
                    fontSize: "1.1rem",
                    opacity: 0.7,
                  }}
                >
                  {b.title}
                </h3>
                <p
                  style={{
                    margin: 0,
                    color: "var(--text-muted)",
                    fontSize: "0.9rem",
                    flex: 1,
                  }}
                >
                  {b.subtitle || "No subtitle"}
                </p>

                <div
                  style={{
                    marginTop: "12px",
                    fontSize: "0.85rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "4px",
                    }}
                  >
                    <span>Source:</span>{" "}
                    <strong
                      style={{
                        color: "var(--text-main)",
                        textTransform: "capitalize",
                      }}
                    >
                      {b.source}
                    </strong>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "4px",
                    }}
                  >
                    <span>Duration:</span>{" "}
                    <strong style={{ color: "var(--text-main)" }}>
                      {b.days} Days
                    </strong>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "4px",
                    }}
                  >
                    <span>Cities:</span>{" "}
                    <strong style={{ color: "var(--text-main)" }}>
                      {b.cities?.includes("All")
                        ? "All"
                        : b.cities?.length > 0
                          ? b.cities.join(", ")
                          : "All"}
                    </strong>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: "auto",
                    display: "flex",
                    gap: "8px",
                    paddingTop: "12px",
                    borderTop: "1px solid var(--border-color)",
                  }}
                >
                  <button
                    className="primary-btn"
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      padding: "8px",
                    }}
                    onClick={() => handleRestore(b._id)}
                  >
                    <RefreshCw size={16} /> Restore
                  </button>
                </div>
              </div>
            </div>
          ))}
          {deletedBanners.length === 0 && (
            <div
              style={{
                gridColumn: "1 / -1",
                textAlign: "center",
                padding: "3rem",
                color: "var(--text-muted)",
              }}
            >
              <ImageIcon
                size={48}
                style={{ opacity: 0.3, marginBottom: "1rem" }}
              />
              <p>No deleted banners found.</p>
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {banners.map((b) => (
            <div
              key={b._id}
              className="glass-panel"
              style={{
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                padding: 0,
                borderRadius: "var(--radius-md)",
              }}
            >
              <div
                style={{
                  height: "140px",
                  background: "var(--bg-secondary)",
                  position: "relative",
                }}
              >
                {b.videoUrl ? (
                  <video
                    src={b.videoUrl}
                    alt={b.title}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                    muted
                    playsInline
                  />
                ) : (
                  <img
                    src={b.imageUrl}
                    alt={b.title}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                )}
                <div
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    display: "flex",
                    gap: "5px",
                  }}
                >
                  <span
                    className={`status-pill ${getStatusColor(b.status)}`}
                    style={{
                      textTransform: "capitalize",
                      padding: "4px 8px",
                      fontSize: "11px",
                      backdropFilter: "blur(4px)",
                      background: "rgba(0,0,0,0.6)",
                    }}
                  >
                    {b.status.replace("_", " ")}
                  </span>
                  {b.source === "shopkeeper" && (
                    <span
                      className="status-pill status-pending"
                      style={{
                        textTransform: "capitalize",
                        padding: "4px 8px",
                        fontSize: "11px",
                        backdropFilter: "blur(4px)",
                        background: "rgba(0,0,0,0.6)",
                      }}
                    >
                      {b.paymentStatus}
                    </span>
                  )}
                </div>
              </div>
              <div
                style={{
                  padding: "16px",
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <h3 style={{ margin: "0 0 4px 0", fontSize: "1.1rem" }}>
                  {b.title}
                </h3>
                <p
                  style={{
                    margin: 0,
                    color: "var(--text-muted)",
                    fontSize: "0.9rem",
                    flex: 1,
                  }}
                >
                  {b.subtitle || "No subtitle"}
                </p>

                <div
                  style={{
                    marginTop: "12px",
                    fontSize: "0.85rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "4px",
                    }}
                  >
                    <span>Source:</span>{" "}
                    <strong
                      style={{
                        color: "var(--text-main)",
                        textTransform: "capitalize",
                      }}
                    >
                      {b.source}
                    </strong>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "4px",
                    }}
                  >
                    <span>Duration:</span>{" "}
                    <strong style={{ color: "var(--text-main)" }}>
                      {b.days} Days
                    </strong>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "4px",
                    }}
                  >
                    <span>Cities:</span>{" "}
                    <strong style={{ color: "var(--text-main)" }}>
                      {b.cities?.includes("All")
                        ? "All"
                        : b.cities?.length > 0
                          ? b.cities.join(", ")
                          : "All"}
                    </strong>
                  </div>
                  {b.paymentScreenshot ? (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: "8px",
                        paddingTop: "8px",
                        borderTop: "1px dashed rgba(255,255,255,0.08)",
                      }}
                    >
                      <span>Receipt:</span>
                      <a
                        href={b.paymentScreenshot}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          color: "var(--accent-primary)",
                          textDecoration: "underline",
                          fontSize: "0.85rem",
                          fontWeight: 600,
                        }}
                      >
                        View Screenshot
                      </a>
                    </div>
                  ) : null}
                </div>

                <div
                  style={{
                    marginTop: "auto",
                    display: "flex",
                    gap: "8px",
                    paddingTop: "12px",
                    borderTop: "1px solid var(--border-color)",
                  }}
                >
                  {(b.status === "pending_review" ||
                    b.status === "pending_payment") &&
                    can("banners", "request_approve") && (
                      <button
                        className="primary-btn"
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          padding: "8px",
                        }}
                        onClick={() =>
                          handleApprove(b._id, b.paymentStatus !== "paid")
                        }
                      >
                        <Check size={16} /> Approve
                      </button>
                    )}
                  {b.status === "pending_review" &&
                    can("banners", "request_reject") && (
                      <button
                        className="view-btn"
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          padding: "8px",
                        }}
                        onClick={() => handleReject(b._id)}
                      >
                        <X size={16} /> Reject
                      </button>
                    )}
                  {b.status === "approved" &&
                    b.isActive &&
                    can("banners", "expire") && (
                      <button
                        className="view-btn"
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          padding: "8px",
                        }}
                        onClick={() => handleExpire(b._id)}
                      >
                        <Clock size={16} /> Expire
                      </button>
                    )}
                  {can("banners", "delete") && (
                    <button
                      className="icon-btn"
                      style={{
                        color: "#ef4444",
                        border: "1px solid var(--border-color)",
                        borderRadius: "var(--radius-md)",
                        padding: "8px",
                      }}
                      onClick={() => handleDelete(b._id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {banners.length === 0 && (
            <div
              style={{
                gridColumn: "1 / -1",
                textAlign: "center",
                padding: "3rem",
                color: "var(--text-muted)",
              }}
            >
              <ImageIcon
                size={48}
                style={{ opacity: 0.3, marginBottom: "1rem" }}
              />
              <p>No banners found matching your criteria.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Banners;
