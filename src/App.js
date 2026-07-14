import {
  AlertTriangle,
  BarChart3,
  Bell,
  Bike,
  Clock,
  LayoutDashboard,
  LogOut,
  Map,
  MessageCircle,
  Moon,
  Package,
  Settings as SettingsIcon,
  ShoppingBag,
  Store,
  Sun,
  TrendingDown,
  TrendingUp,
  Truck,
  Users,
  XCircle,
  Image,
  CreditCard,
  Wallet,
  Shield,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import {
  Link,
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import "./App.css";
import {
  DATE_FILTER_LABELS,
  DATE_FILTER_OPTIONS,
  getDateFilterParams,
} from "./components/AdminDateFilter";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { hasModuleAccess } from "./constants/permissions";
import { useAdminNotifications } from "./hooks/useAdminNotifications";
import Cities from "./pages/Cities";
import Customers from "./pages/Customers";
import Login from "./pages/Login";
import Notifications from "./pages/Notifications";
import Orders from "./pages/Orders";
import Products from "./pages/Products";
import Riders from "./pages/Riders";
import Settings from "./pages/Settings";
import Shops from "./pages/Shops";
import Banners from "./pages/Banners";
import Chats from "./pages/Chats";
import CustomOrders from "./pages/CustomOrders";
import Rides from "./pages/Rides";
import PaymentMethods from "./pages/PaymentMethods";
import WalletDeposits from "./pages/WalletDeposits";
import WalletWithdraws from "./pages/WalletWithdraws";
import SubAdmins from "./pages/SubAdmins";
import SafetyAlerts from "./pages/SafetyAlerts";
import { adminService } from "./services/adminService";

// Helper function to check if user can access a permission module
const hasPermission = (user, moduleId) => hasModuleAccess(user, moduleId);

const Sidebar = () => {
  const location = useLocation();
  const { logout, user } = useAuth();

  const navItems = [
    {
      path: "/",
      label: "Overview",
      icon: LayoutDashboard,
      permission: "overview",
    },
    {
      path: "/sub-admins",
      label: "Sub Admins",
      icon: Shield,
      permission: null,
      onlyMainAdmin: true,
    },
    {
      path: "/notifications",
      label: "Notifications",
      icon: Bell,
      permission: "notifications",
    },
    {
      path: "/chats",
      label: "Chats",
      icon: MessageCircle,
      permission: "chats",
    },
    { path: "/cities", label: "Cities", icon: Map, permission: "cities" },
    {
      path: "/orders",
      label: "Orders",
      icon: ShoppingBag,
      permission: "orders",
    },
    {
      path: "/custom-orders",
      label: "Custom Orders",
      icon: Package,
      permission: "customOrders",
    },
    {
      path: "/rides",
      label: "Rides & Parcels",
      icon: Bike,
      permission: "rides",
    },
    {
      path: "/safety-alerts",
      label: "Safety Alerts",
      icon: AlertTriangle,
      permission: "rides",
    },
    {
      path: "/products",
      label: "Products",
      icon: Package,
      permission: "products",
    },
    {
      path: "/customers",
      label: "Customers",
      icon: Users,
      permission: "customers",
    },
    { path: "/riders", label: "Riders", icon: Bike, permission: "riders" },
    { path: "/shops", label: "Shops", icon: Store, permission: "shops" },
    { path: "/banners", label: "Banners", icon: Image, permission: "banners" },
    {
      path: "/payment-methods",
      label: "Payments",
      icon: CreditCard,
      permission: "paymentMethods",
    },
    {
      path: "/wallet-deposits",
      label: "Wallet Deposits",
      icon: Wallet,
      permission: "walletDeposits",
    },
    {
      path: "/wallet-withdraws",
      label: "Wallet Withdraws",
      icon: Wallet,
      permission: "walletDeposits",
    },
    {
      path: "/settings",
      label: "Settings",
      icon: SettingsIcon,
      permission: "settings",
    },
  ];

  const filteredNavItems = navItems.filter((item) => {
    if (user?.role === "admin") return true;
    if (item.onlyMainAdmin) return false;
    if (!item.permission) return true;
    return hasPermission(user, item.permission);
  });

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-circle">
          <ShoppingBag size={24} />
        </div>
        <div className="logo-text">ClickDeliver</div>
      </div>
      <nav className="nav-menu">
        {filteredNavItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? "active" : ""}`}
          >
            <item.icon size={20} />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="sidebar-footer">
        <button className="nav-item logout-btn" onClick={logout}>
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </aside>
  );
};

const getNotificationColor = (type) => {
  switch (type) {
    case "NEW_ORDER":
    case "NEW_CUSTOM_ORDER":
      return "#3b82f6";
    case "NEW_RIDE":
      return "#10b981";
    case "PENDING_ORDER_ALERT":
    case "PENDING_RIDE_ALERT":
    case "PENDING_CUSTOM_ORDER_ALERT":
      return "#ef4444";
    case "CHAT_MESSAGE":
      return "#8b5cf6";
    case "BANNER_REQUEST":
      return "#06b6d4";
    case "ACTIVATION_REQUEST":
      return "#f59e0b";
    default:
      return "#64748b";
  }
};

const Topbar = ({ theme, toggleTheme }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [activationRequests, setActivationRequests] = useState([]);

  const fetchActivationRequests = async () => {
    try {
      const data = await adminService.getActivationRequests();
      setActivationRequests(
        data.filter((u) => u.isDeleted && u.activationRequested),
      );
    } catch (error) {}
  };

  useEffect(() => {
    fetchActivationRequests();
    const interval = setInterval(fetchActivationRequests, 15000);
    return () => clearInterval(interval);
  }, []);

  const { notifications, unseenCount, markAllSeen, markSeen } =
    useAdminNotifications(user, activationRequests);

  const handleToggleNotifications = () => {
    const next = !showNotifications;
    setShowNotifications(next);
    if (next && unseenCount > 0) {
      markAllSeen();
    }
  };

  const handleNotificationClick = (notif) => {
    markSeen(notif.id);
    setShowNotifications(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  return (
    <header className="topbar animate-fade-in">
      <div className="page-title">Admin Dashboard</div>
      <div className="topbar-actions">
        <button
          className="icon-btn"
          onClick={toggleTheme}
          aria-label="Toggle Theme"
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className="notification-menu-wrap">
          <button
            className="icon-btn"
            aria-label="Notifications"
            onClick={handleToggleNotifications}
          >
            <Bell size={20} />
            {unseenCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: -2,
                  right: -2,
                  backgroundColor: "#ef4444",
                  color: "white",
                  fontSize: "10px",
                  minWidth: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  border: "2px solid var(--surface-color)",
                  padding: "0 4px",
                }}
              >
                {unseenCount > 99 ? "99+" : unseenCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="notification-dropdown">
              <div className="notification-dropdown-header">
                <span>Notifications</span>
                {unseenCount > 0 && (
                  <span
                    style={{
                      fontSize: "12px",
                      color: "var(--text-muted)",
                      fontWeight: "normal",
                    }}
                  >
                    {unseenCount} unread
                  </span>
                )}
              </div>
              <div className="notification-dropdown-list">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <button
                      key={notif.id}
                      type="button"
                      onClick={() => handleNotificationClick(notif)}
                      className={`notification-dropdown-item ${notif.seen ? "" : "unread"}`}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        {!notif.seen && (
                          <div
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              backgroundColor: getNotificationColor(notif.type),
                              flexShrink: 0,
                            }}
                          />
                        )}
                        <span style={{ fontSize: "14px", fontWeight: "600" }}>
                          {notif.title}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: "13px",
                          color: "var(--text-muted)",
                          marginLeft: notif.seen ? 0 : "16px",
                          lineHeight: "1.4",
                        }}
                      >
                        {notif.message}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="notification-dropdown-empty">
                    No notifications yet
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="profile-widget">
          <div className="profile-initials">
            {user?.name?.substring(0, 2).toUpperCase() || "AD"}
          </div>
          <span style={{ fontWeight: 500, fontSize: "0.9rem" }}>
            {user?.name || "Admin"}
          </span>
        </div>
      </div>
    </header>
  );
};

const DashboardHome = () => {
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [cities, setCities] = useState([]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const { startDate = null, endDate = null } = getDateFilterParams(
        filterType,
        customStartDate,
        customEndDate,
      );

      const data = await adminService.getStats(
        startDate,
        endDate,
        selectedCity,
      );
      setStatsData(data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadCities = async () => {
      try {
        const data = await adminService.getCities();
        setCities(data || []);
      } catch (error) {
        setCities([]);
      }
    };

    loadCities();
  }, []);

  useEffect(() => {
    fetchStats();
  }, [filterType, customStartDate, customEndDate, selectedCity]);

  const filterLabels = DATE_FILTER_LABELS;

  const formatCurrency = (value) =>
    `PKR ${Number(value || 0).toLocaleString()}`;

  const formatDuration = (minutes) => {
    if (!minutes) return "0 min";
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const selectedCityLabel =
    selectedCity === "all"
      ? "All Cities"
      : cities.find((city) => city.name === selectedCity)?.name || selectedCity;

  const dashboardStats = [
    {
      title: "App Revenue",
      value: formatCurrency(statsData?.appRevenue),
      icon: TrendingUp,
      subtitle: `Orders: ${statsData?.deliveredOrdersCount || 0} | Custom: ${statsData?.deliveredCustomOrdersCount || 0} | Rides: ${statsData?.completedRidesCount || 0}`,
    },
    {
      title: "Total Revenue",
      value: formatCurrency(statsData?.totalShopsRevenue),
      icon: Store,
      subtitle: "Combined product sales across all shops",
    },
    {
      title: "Total Wallet Balance",
      value: formatCurrency(statsData?.totalWalletBalance),
      icon: Wallet,
      subtitle: "All users combined wallet balance",
    },
    {
      title: "Shop Commission",
      value: formatCurrency(statsData?.totalPercentageCharge),
      icon: Store,
      subtitle: `Commission Shops: ${statsData?.shopsWithCommission || 0}`,
    },
    {
      title: "Banner Revenue",
      value: formatCurrency(statsData?.totalBannerRevenue),
      icon: Image,
      subtitle: `Total Banners: ${statsData?.totalBanners || 0} | Active: ${statsData?.activeBanners || 0} | Pending: ${statsData?.pendingBanners || 0}`,
    },
    {
      title: "Total Deliveries & Orders",
      value: statsData?.totalDeliveries?.toString() || "0",
      icon: Truck,
      subtitle: `Orders: ${statsData?.deliveredOrdersCount || 0} (Cash: ${statsData?.cashOrdersCount || 0}, Online: ${statsData?.onlineOrdersCount || 0}) | Custom: ${statsData?.deliveredCustomOrdersCount || 0} (Cash: ${statsData?.cashCustomOrdersCount || 0}, Online: ${statsData?.onlineCustomOrdersCount || 0}) | Rides: ${statsData?.completedRidesCount || 0} (Cash: ${statsData?.cashRidesCount || 0}, Online: ${statsData?.onlineRidesCount || 0})`,
    },
    {
      title: "Average Delivery Time",
      value: formatDuration(statsData?.averageDeliveryTimeMinutes),
      icon: Clock,
      subtitle: "From acceptance to delivery",
    },
    {
      title: "Order Success Rate",
      value: `${statsData?.orderSuccessRate || 0}%`,
      icon: TrendingUp,
      subtitle: "Completed vs total attempts",
    },
    {
      title: "Cancelled Orders",
      value: statsData?.cancelledOrders?.toString() || "0",
      icon: XCircle,
      subtitle: "Orders, custom orders & rides",
    },
    {
      title: "Failed Deliveries",
      value: statsData?.failedDeliveries?.toString() || "0",
      icon: AlertTriangle,
      subtitle: "Cancelled after rider assignment",
    },
    {
      title: "Active Orders",
      value: statsData?.activeOrders?.toString() || "0",
      icon: ShoppingBag,
    },
    {
      title: "Registered Riders",
      value: statsData?.totalRiders?.toString() || "0",
      icon: Bike,
    },
    {
      title: "Active Shops",
      value: statsData?.totalShops?.toString() || "0",
      icon: Store,
    },
    {
      title: "Total Customers",
      value: statsData?.totalCustomers?.toString() || "0",
      icon: Users,
    },
    {
      title: "Total Products",
      value: statsData?.totalProducts?.toString() || "0",
      icon: Package,
    },
  ];

  const peakHours = statsData?.peakHoursAnalytics || [];
  const maxPeakCount = Math.max(...peakHours.map((item) => item.count), 1);
  const topPeakHours = [...peakHours]
    .sort((a, b) => b.count - a.count)
    .filter((item) => item.count > 0)
    .slice(0, 8);
  const topProducts = statsData?.topSellingProducts || [];
  const topShops = statsData?.topPerformingShops || [];
  const topRiders = statsData?.topPerformingRiders || [];

  const renderStatCard = (stat, index) => (
    <div
      key={stat.title}
      className="stat-card"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="stat-card-header">
        <div className="stat-title">{stat.title}</div>
        <div
          className="stat-icon"
          style={{
            background: "rgba(59, 130, 246, 0.1)",
            color: "var(--accent-primary)",
          }}
        >
          <stat.icon size={24} />
        </div>
      </div>
      <div className="stat-value">{stat.value}</div>
      {stat.subtitle ? (
        <div className="stat-subtitle">{stat.subtitle}</div>
      ) : null}
    </div>
  );

  const renderRankingTable = (title, rows, columns) => (
    <div className="analytics-panel">
      <h3 className="analytics-panel-title">{title}</h3>
      {rows.length ? (
        <div className="analytics-table-wrap">
          <table className="analytics-table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.productId || row.shopId || row.riderId || index}>
                  {columns.map((column) => (
                    <td key={column.key}>
                      {column.render
                        ? column.render(row, index)
                        : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="analytics-empty">No data for selected period.</p>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="content-area">
        <div className="table-loader">Loading overview statistics...</div>
      </div>
    );
  }

  return (
    <div className="content-area">
      {/* Date Filter Section */}
      <div
        className="glass-panel dashboard-filters"
        style={{
          marginBottom: "1.5rem",
          padding: "1rem",
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
          alignItems: "center",
          borderRadius: "12px",
        }}
      >
        <div className="dashboard-city-filter">
          <label htmlFor="dashboard-city">City</label>
          <select
            id="dashboard-city"
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="dashboard-city-select"
          >
            <option value="all">All Cities</option>
            {cities.map((city) => (
              <option key={city._id} value={city.name}>
                {city.name}
              </option>
            ))}
          </select>
        </div>

        {DATE_FILTER_OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => setFilterType(option.id)}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "8px",
              border: "none",
              background:
                filterType === option.id
                  ? "var(--accent-primary)"
                  : "rgba(255, 255, 255, 0.05)",
              color: filterType === option.id ? "white" : "var(--text-muted)",
              fontWeight: 500,
              fontSize: "0.875rem",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (filterType !== option.id) {
                e.target.style.background = "rgba(255, 255, 255, 0.1)";
              }
            }}
            onMouseLeave={(e) => {
              if (filterType !== option.id) {
                e.target.style.background = "rgba(255, 255, 255, 0.05)";
              }
            }}
          >
            {option.label}
          </button>
        ))}

        {/* Custom Date Inputs */}
        {filterType === "custom" && (
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              flexWrap: "wrap",
              marginTop: "0.5rem",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.25rem",
              }}
            >
              <label
                style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}
              >
                From Date
              </label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: "8px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  background: "var(--surface-color)",
                  color: "var(--text-primary)",
                  fontSize: "0.875rem",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.25rem",
              }}
            >
              <label
                style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}
              >
                To Date
              </label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                style={{
                  padding: "0.5rem 0.75rem",
                  borderRadius: "8px",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  background: "var(--surface-color)",
                  color: "var(--text-primary)",
                  fontSize: "0.875rem",
                }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="dashboard-section-header">
        <h2>Overview Metrics</h2>
        <div className="dashboard-filter-badges">
          <span className="dashboard-filter-badge">{selectedCityLabel}</span>
          <span className="dashboard-filter-badge">
            {filterLabels[filterType] || "All Time"}
          </span>
        </div>
      </div>

      <div className="stats-grid">{dashboardStats.map(renderStatCard)}</div>

      <div className="analytics-grid">
        <div className="analytics-panel analytics-panel-wide">
          <div className="analytics-panel-header">
            <h3 className="analytics-panel-title">Peak Hours Analytics</h3>
            <BarChart3 size={20} />
          </div>
          {topPeakHours.length ? (
            <div className="peak-hours-chart">
              {topPeakHours.map((item) => (
                <div key={item.hour} className="peak-hour-row">
                  <span className="peak-hour-label">
                    {String(item.hour).padStart(2, "0")}:00
                  </span>
                  <div className="peak-hour-bar-track">
                    <div
                      className="peak-hour-bar-fill"
                      style={{
                        width: `${(item.count / maxPeakCount) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="peak-hour-count">{item.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="analytics-empty">
              No delivery activity for selected period.
            </p>
          )}
        </div>

        {renderRankingTable("Top Selling Products", topProducts, [
          { key: "rank", label: "#", render: (_, index) => index + 1 },
          { key: "name", label: "Product" },
          {
            key: "totalQuantity",
            label: "Qty Sold",
            render: (row) => row.totalQuantity,
          },
          {
            key: "totalRevenue",
            label: "Revenue",
            render: (row) => formatCurrency(row.totalRevenue),
          },
        ])}

        {renderRankingTable("Top Performing Shops", topShops, [
          { key: "rank", label: "#", render: (_, index) => index + 1 },
          { key: "name", label: "Shop" },
          {
            key: "orderCount",
            label: "Orders",
            render: (row) => row.orderCount,
          },
          {
            key: "revenue",
            label: "Revenue",
            render: (row) => formatCurrency(row.revenue),
          },
        ])}

        {renderRankingTable("Top Performing Riders", topRiders, [
          { key: "rank", label: "#", render: (_, index) => index + 1 },
          { key: "name", label: "Rider" },
          {
            key: "deliveryCount",
            label: "Deliveries",
            render: (row) => row.deliveryCount,
          },
          {
            key: "revenue",
            label: "Revenue",
            render: (row) => formatCurrency(row.revenue),
          },
        ])}
      </div>

      <div
        className="glass-panel"
        style={{ padding: "2rem", marginTop: "2rem", borderRadius: "12px" }}
      >
        <h2 style={{ marginBottom: "1.5rem", fontSize: "1.25rem" }}>
          System Overview
        </h2>
        <div style={{ color: "var(--text-muted)", lineHeight: "1.6" }}>
          Welcome back! The dashboard is connected to live business metrics for{" "}
          <strong>{selectedCityLabel}</strong> during{" "}
          <strong>{filterLabels[filterType] || "All Time"}</strong>. Currently,
          you have <strong>{statsData?.activeOrders}</strong> active orders
          being processed by <strong>{statsData?.totalRiders}</strong> riders
          across <strong>{statsData?.totalShops}</strong> shops, serving{" "}
          <strong>{statsData?.totalCustomers}</strong> registered customers with
          a catalog of <strong>{statsData?.totalProducts}</strong> products. For
          the selected period, app revenue is{" "}
          <strong>{formatCurrency(statsData?.appRevenue)}</strong>, total shops
          revenue is{" "}
          <strong>{formatCurrency(statsData?.totalShopsRevenue)}</strong>, with{" "}
          <strong>{statsData?.totalDeliveries || 0}</strong> total deliveries
          and orders (<strong>{statsData?.deliveredOrdersCount || 0}</strong>{" "}
          orders, <strong>{statsData?.deliveredCustomOrdersCount || 0}</strong>{" "}
          custom orders, <strong>{statsData?.completedRidesCount || 0}</strong>{" "}
          rides), <strong>{statsData?.orderSuccessRate || 0}%</strong> success
          rate, and{" "}
          <strong>{formatCurrency(statsData?.totalPercentageCharge)}</strong>{" "}
          shop commission collected.
        </div>
      </div>
    </div>
  );
};

const PlaceholderComponent = ({ title }) => (
  <div className="content-area">
    <h2>{title} Management</h2>
    <p style={{ marginTop: "1rem", color: "var(--text-muted)" }}>
      This section is currently under development.
    </p>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

const PermissionProtectedRoute = ({ children, permission, onlyMainAdmin }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // If user is main admin, allow everything
  if (user?.role === "admin") return children;
  // If only main admin allowed, redirect to home
  if (onlyMainAdmin) return <Navigate to="/" replace />;
  // If no permission required, allow
  if (!permission) return children;
  // If sub-admin has permission module, allow
  if (hasPermission(user, permission)) return children;
  // Otherwise redirect to home
  return <Navigate to="/" replace />;
};

function AppContent() {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // FCM Configuration validation
  useEffect(() => {
    if (!("Notification" in window)) {
    }
    if (!("serviceWorker" in navigator)) {
    }
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <div className="layout">
              <Sidebar />
              <main className="main-content">
                <Topbar theme={theme} toggleTheme={toggleTheme} />
                <Routes>
                  <Route
                    path="/"
                    element={
                      <PermissionProtectedRoute permission="overview">
                        <DashboardHome />
                      </PermissionProtectedRoute>
                    }
                  />
                  <Route
                    path="/sub-admins"
                    element={
                      <PermissionProtectedRoute onlyMainAdmin>
                        <SubAdmins />
                      </PermissionProtectedRoute>
                    }
                  />
                  <Route
                    path="/notifications"
                    element={
                      <PermissionProtectedRoute permission="notifications">
                        <Notifications />
                      </PermissionProtectedRoute>
                    }
                  />
                  <Route
                    path="/chats"
                    element={
                      <PermissionProtectedRoute permission="chats">
                        <Chats />
                      </PermissionProtectedRoute>
                    }
                  />
                  <Route
                    path="/cities"
                    element={
                      <PermissionProtectedRoute permission="cities">
                        <Cities />
                      </PermissionProtectedRoute>
                    }
                  />
                  <Route
                    path="/orders"
                    element={
                      <PermissionProtectedRoute permission="orders">
                        <Orders />
                      </PermissionProtectedRoute>
                    }
                  />
                  <Route
                    path="/custom-orders"
                    element={
                      <PermissionProtectedRoute permission="customOrders">
                        <CustomOrders />
                      </PermissionProtectedRoute>
                    }
                  />
                  <Route
                    path="/rides"
                    element={
                      <PermissionProtectedRoute permission="rides">
                        <Rides />
                      </PermissionProtectedRoute>
                    }
                  />
                  <Route
                    path="/safety-alerts"
                    element={
                      <PermissionProtectedRoute permission="rides">
                        <SafetyAlerts />
                      </PermissionProtectedRoute>
                    }
                  />
                  <Route
                    path="/products"
                    element={
                      <PermissionProtectedRoute permission="products">
                        <Products />
                      </PermissionProtectedRoute>
                    }
                  />
                  <Route
                    path="/customers"
                    element={
                      <PermissionProtectedRoute permission="customers">
                        <Customers />
                      </PermissionProtectedRoute>
                    }
                  />
                  <Route
                    path="/riders"
                    element={
                      <PermissionProtectedRoute permission="riders">
                        <Riders />
                      </PermissionProtectedRoute>
                    }
                  />
                  <Route
                    path="/shops"
                    element={
                      <PermissionProtectedRoute permission="shops">
                        <Shops />
                      </PermissionProtectedRoute>
                    }
                  />
                  <Route
                    path="/banners"
                    element={
                      <PermissionProtectedRoute permission="banners">
                        <Banners />
                      </PermissionProtectedRoute>
                    }
                  />
                  <Route
                    path="/payment-methods"
                    element={
                      <PermissionProtectedRoute permission="paymentMethods">
                        <PaymentMethods />
                      </PermissionProtectedRoute>
                    }
                  />
                  <Route
                    path="/wallet-deposits"
                    element={
                      <PermissionProtectedRoute permission="walletDeposits">
                        <WalletDeposits />
                      </PermissionProtectedRoute>
                    }
                  />
                  <Route
                    path="/wallet-withdraws"
                    element={
                      <PermissionProtectedRoute permission="walletDeposits">
                        <WalletWithdraws />
                      </PermissionProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <PermissionProtectedRoute permission="settings">
                        <Settings />
                      </PermissionProtectedRoute>
                    }
                  />
                </Routes>
              </main>
            </div>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
          }}
        />
      </Router>
    </AuthProvider>
  );
}

export default App;
