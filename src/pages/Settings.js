import React, { useState, useEffect } from "react";
import { adminService } from "../services/adminService";
import {
  Settings as SettingsIcon,
  Truck,
  Navigation,
  Save,
  Loader2,
  Bell,
  BellOff,
  Image as ImageIcon,
  MapPin,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { fcmService } from "../services/fcmService";
import { usePermissions } from "../hooks/usePermissions";
import { useAuth } from "../context/AuthContext";
import { useAdminCityFilter } from "../hooks/useAdminCityFilter";
import { getCityFilterParams } from "../components/AdminDateFilter";

const Settings = () => {
  const { can } = usePermissions();
  const { user } = useAuth();
  const { cities, selectedCity, setSelectedCity } = useAdminCityFilter();
  const [settings, setSettings] = useState({
    deliveryFee: 50,
    pricePerKm: 50,
    appFee: 0,
    bannerDailyRate: 500,
    bannerImageDailyRate: 500,
    bannerVideoDailyRate: 500,
    deliveryRadiusKm: 5,
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [pushStatus, setPushStatus] = useState("default");
  const [pushSyncing, setPushSyncing] = useState(false);
  const [fcmConfigured, setFcmConfigured] = useState(true);

  const isSubAdmin = user?.role === "sub-admin";
  const hasAllCitiesAccess = user?.accessibleCities?.includes("All");
  const cityParams = getCityFilterParams(selectedCity);
  const canUpdateSelectedCity =
    !isSubAdmin || hasAllCitiesAccess || Boolean(cityParams.city);

  useEffect(() => {
    setPushStatus(fcmService.getPermissionStatus());
    setFcmConfigured(fcmService.isConfigured());
  }, []);

  useEffect(() => {
    if (
      isSubAdmin &&
      !hasAllCitiesAccess &&
      cities.length > 0 &&
      selectedCity === "all"
    ) {
      setSelectedCity(cities[0].name);
    }
  }, [isSubAdmin, hasAllCitiesAccess, cities, selectedCity, setSelectedCity]);

  useEffect(() => {
    if (
      isSubAdmin &&
      !hasAllCitiesAccess &&
      (selectedCity === "all" || !cities.length)
    ) {
      return;
    }

    fetchSettings();
  }, [selectedCity, isSubAdmin, hasAllCitiesAccess, cities.length]);

  const fetchSettings = async () => {
    try {
      setFetching(true);
      const data = await adminService.getAdminSettings(cityParams.city);
      setSettings({
        deliveryFee: data.deliveryFee,
        pricePerKm: data.pricePerKm,
        appFee: data.appFee || 0,
        bannerDailyRate: data.bannerDailyRate || 500,
        bannerImageDailyRate:
          data.bannerImageDailyRate ?? data.bannerDailyRate ?? 500,
        bannerVideoDailyRate:
          data.bannerVideoDailyRate ?? data.bannerDailyRate ?? 500,
        deliveryRadiusKm: data.deliveryRadiusKm ?? 5,
      });
    } catch (error) {
      toast.error(error.message || "Error fetching settings");
    } finally {
      setFetching(false);
    }
  };

  const handleTestPush = async () => {
    setPushSyncing(true);
    try {
      const result = await adminService.testPushNotification();
      toast.success(`Test push sent (${result.messageId})`);
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.code ||
        "Test push failed — check backend terminal logs";
      toast.error(msg);
    } finally {
      setPushSyncing(false);
    }
  };

  const handleEnablePush = async () => {
    setPushSyncing(true);
    try {
      const token = await fcmService.syncTokenToServer(true);
      setPushStatus(fcmService.getPermissionStatus());
      if (token) {
        toast.success("Push notifications enabled for this browser");
      } else if (!fcmService.isConfigured()) {
        toast.error(
          "Firebase is not configured. Check admin-panel/src/config/firebase.js.",
        );
      } else {
        toast.error(
          "Could not enable push. Check browser notification permission.",
        );
      }
    } catch (error) {
      toast.error("Failed to register for push notifications");
    } finally {
      setPushSyncing(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!canUpdateSelectedCity) {
      toast.error("Select an assigned city to update settings");
      return;
    }
    setLoading(true);
    try {
      await adminService.updateAdminSettings(settings, cityParams.city);
      toast.success("Settings updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error updating settings");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="content-area">
        <div className="table-loader">
          <Loader2 className="animate-spin" size={24} />
          <p>Loading configuration...</p>
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
              <SettingsIcon size={18} />
            </div>
            Application Settings
          </h2>
          <p className="section-subtitle">
            Configure delivery fees and pricing for each city
          </p>
        </div>
      </div>

      <div
        className="glass-panel"
        style={{
          maxWidth: "600px",
          margin: "0 auto 1.5rem",
          padding: "1rem",
          borderRadius: "12px",
        }}
      >
        <div className="dashboard-city-filter">
          <label htmlFor="settings-city">City</label>
          {isSubAdmin && !hasAllCitiesAccess && cities.length === 1 ? (
            <div className="dashboard-city-select" style={{ padding: "0.65rem 1rem" }}>
              {cities[0].name}
            </div>
          ) : (
            <select
              id="settings-city"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="dashboard-city-select"
            >
              {(!isSubAdmin || hasAllCitiesAccess) && (
                <option value="all">Default (All Cities)</option>
              )}
              {cities.map((city) => (
                <option key={city._id} value={city.name}>
                  {city.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div
        className="glass-panel"
        style={{
          maxWidth: "600px",
          margin: "0 auto 2rem",
          padding: "2rem 2.5rem",
          borderRadius: 30,
        }}
      >
        <h3
          style={{
            margin: "0 0 0.5rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Bell size={20} />
          Browser push notifications
        </h3>
        <p
          style={{
            margin: "0 0 1.25rem",
            fontSize: "0.85rem",
            color: "var(--text-muted)",
          }}
        >
          New orders, rides, chats, banner requests, and pending alerts are sent
          here when this browser is allowed. Chat push only arrives when someone
          else messages you — not when you send from this admin panel.
        </p>
        {!fcmConfigured && (
          <p
            style={{
              margin: "0 0 1rem",
              fontSize: "0.85rem",
              color: "#f59e0b",
            }}
          >
            Missing Firebase VAPID key in admin-panel/src/config/firebase.js.
          </p>
        )}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <div style={{ fontSize: "0.9rem" }}>
            Status:{" "}
            <strong>
              {pushStatus === "granted"
                ? "Allowed"
                : pushStatus === "denied"
                  ? "Blocked"
                  : pushStatus === "unsupported"
                    ? "Not supported"
                    : "Not enabled yet"}
            </strong>
          </div>
          <button
            type="button"
            className="primary-btn"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.6rem 1.25rem",
            }}
            onClick={handleEnablePush}
            disabled={pushSyncing || pushStatus === "unsupported"}
          >
            {pushSyncing ? (
              <Loader2 className="animate-spin" size={18} />
            ) : pushStatus === "granted" ? (
              <Bell size={18} />
            ) : (
              <BellOff size={18} />
            )}
            {pushStatus === "granted"
              ? "Refresh push token"
              : "Enable notifications"}
          </button>
          {pushStatus === "granted" && (
            <button
              type="button"
              className="primary-btn"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.6rem 1.25rem",
                background: "var(--surface-elevated, #1e293b)",
              }}
              onClick={handleTestPush}
              disabled={pushSyncing}
            >
              {pushSyncing ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Bell size={18} />
              )}
              Send test push
            </button>
          )}
        </div>
        {pushStatus === "denied" && (
          <p
            style={{
              margin: "1rem 0 0",
              fontSize: "0.8rem",
              color: "var(--text-muted)",
            }}
          >
            Permission is blocked in the browser. Reset it in site settings,
            then click Enable again. On macOS, also allow Chrome in System
            Settings → Notifications.
          </p>
        )}
      </div>

      <div
        className="glass-panel"
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          padding: "2.5rem",
          borderRadius: 30,
        }}
      >
        <form onSubmit={handleUpdate}>
          <div className="input-field">
            <label style={{ fontSize: "0.85rem", marginBottom: "0.75rem" }}>
              BASE DELIVERY FEE (Rs.)
            </label>
            <div className="input-wrapper">
              <div className="input-icon">
                <Truck size={18} />
              </div>
              <input
                type="number"
                value={settings.deliveryFee}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    deliveryFee: Number(e.target.value),
                  })
                }
                placeholder="e.g. 50"
                min="0"
              />
            </div>
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                marginTop: "0.5rem",
              }}
            >
              The minimum fee charged for any delivery.
            </p>
          </div>

          <div className="input-field" style={{ marginTop: "2rem" }}>
            <label style={{ fontSize: "0.85rem", marginBottom: "0.75rem" }}>
              DELIVERY RADIUS (KM)
            </label>
            <div className="input-wrapper">
              <div className="input-icon">
                <MapPin size={18} />
              </div>
              <input
                type="number"
                value={settings.deliveryRadiusKm}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    deliveryRadiusKm: Number(e.target.value),
                  })
                }
                placeholder="e.g. 5"
                min="0.1"
                step="0.1"
              />
            </div>
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                marginTop: "0.5rem",
              }}
            >
              Maximum distance from the shop where delivery is allowed. Customers
              outside this radius cannot place orders.
            </p>
          </div>

          <div className="input-field" style={{ marginTop: "2rem" }}>
            <label style={{ fontSize: "0.85rem", marginBottom: "0.75rem" }}>
              RIDE PER KM FEE (Rs.)
            </label>
            <div className="input-wrapper">
              <div className="input-icon">
                <Navigation size={18} />
              </div>
              <input
                type="number"
                value={settings.pricePerKm}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    pricePerKm: Number(e.target.value),
                  })
                }
                placeholder="e.g. 50"
                min="0"
              />
            </div>
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                marginTop: "0.5rem",
              }}
            >
              Additional fee charged for each kilometer of distance.
            </p>
          </div>

          <div className="input-field" style={{ marginTop: "2rem" }}>
            <label style={{ fontSize: "0.85rem", marginBottom: "0.75rem" }}>
              APP FEE (Rs.)
            </label>
            <div className="input-wrapper">
              <div className="input-icon">
                <SettingsIcon size={18} />
              </div>
              <input
                type="number"
                value={settings.appFee}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    appFee: Number(e.target.value),
                  })
                }
                placeholder="e.g. 10"
                min="0"
              />
            </div>
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                marginTop: "0.5rem",
              }}
            >
              Platform fee added to each ride or parcel request.
            </p>
          </div>

          <div className="input-field" style={{ marginTop: "2rem" }}>
            <label style={{ fontSize: "0.85rem", marginBottom: "0.75rem" }}>
              BANNER IMAGE DAILY RATE (Rs.)
            </label>
            <div className="input-wrapper">
              <div className="input-icon">
                <ImageIcon size={18} />
              </div>
              <input
                type="number"
                value={settings.bannerImageDailyRate}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    bannerImageDailyRate: Number(e.target.value),
                  })
                }
                placeholder="e.g. 500"
                min="0"
              />
            </div>
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                marginTop: "0.5rem",
              }}
            >
              Daily rate charged to shopkeepers for image banners.
            </p>
          </div>

          <div className="input-field" style={{ marginTop: "2rem" }}>
            <label style={{ fontSize: "0.85rem", marginBottom: "0.75rem" }}>
              BANNER VIDEO DAILY RATE (Rs.)
            </label>
            <div className="input-wrapper">
              <div className="input-icon">
                <ImageIcon size={18} />
              </div>
              <input
                type="number"
                value={settings.bannerVideoDailyRate}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    bannerVideoDailyRate: Number(e.target.value),
                  })
                }
                placeholder="e.g. 800"
                min="0"
              />
            </div>
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                marginTop: "0.5rem",
              }}
            >
              Daily rate charged to shopkeepers for video banners.
            </p>
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
              disabled={
                loading ||
                !can("settings", "update") ||
                !canUpdateSelectedCity
              }
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Save size={20} />
              )}
              Save Changes
            </button>
          </div>
        </form>
      </div>

      <div style={{ marginTop: "2rem", textAlign: "center" }}>
        <div
          className="glass-panel"
          style={{
            display: "inline-block",
            padding: "1rem 2.5rem",
            borderRadius: "var(--radius-full)",
            background: "rgba(59, 130, 246, 0.05)",
            border: "1px solid rgba(59, 130, 246, 0.1)",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "0.9rem",
              color: "var(--text-muted)",
            }}
          >
            These values are used to calculate total delivery costs for all new
            orders.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
