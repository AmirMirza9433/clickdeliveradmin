import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { io } from "socket.io-client";
import API from "../services/api";
import { fcmService, showSystemNotification } from "../services/fcmService";

const STORAGE_KEY = "admin_notifications_seen";
const NOTIFICATIONS_STORAGE_KEY = "admin_notifications_list";
const DEDUP_WINDOW_MS = 5000; // 5 second dedup window for socket + FCM

// Track recently added notifications to prevent duplicates
const recentNotifications = new Map();

const buildNotificationId = (item) => {
  // Normalize entityId - could come from multiple sources
  const entityId =
    item.entityId || item.data?.entityId || item.payload?.entityId;
  const type = item.type || item.data?.type || "GENERAL";
  const title = item.title || item.notification?.title || item.data?.title;

  // Build ID from type and entityId (most reliable)
  if (entityId) {
    return `${type}-${entityId}`;
  }

  // Fallback to type and title
  if (title) {
    return `${type}-${title}`;
  }

  // Last resort - use ID if present
  return item.id || `${type}-fallback`;
};

const isRecentlyAdded = (id) => {
  const lastTime = recentNotifications.get(id);
  if (!lastTime) return false;
  return Date.now() - lastTime < DEDUP_WINDOW_MS;
};

export const useAdminNotifications = (user, activationRequests = []) => {
  const [notifications, setNotifications] = useState(() => {
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [seenIds, setSeenIds] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const socketRef = useRef(null);

  const addNotification = useCallback((item) => {
    const id = buildNotificationId(item);

    // Check if this notification was added recently (prevent duplicates)
    if (isRecentlyAdded(id)) {
      return;
    }

    // Mark this notification as added now
    recentNotifications.set(id, Date.now());

    setNotifications((prev) => {
      // Final check in state
      if (prev.some((n) => buildNotificationId(n) === id)) {
        return prev;
      }

      const updated = [
        {
          ...item,
          id,
          seen: false,
          createdAt: item.time || new Date().toISOString(),
        },
        ...prev,
      ].slice(0, 100);
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
    toast.success(item.title, { duration: 4000 });
  }, []);

  useEffect(() => {
    if (!user?._id) return undefined;

    const socketBaseUrl = API.defaults.baseURL.replace("/api", "");
    const socket = io(socketBaseUrl, {
      transports: ["polling", "websocket"],
      reconnection: true,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join", user._id);
    });

    socket.on("admin:notification", (payload) => {
      addNotification({
        type: payload.type || "GENERAL",
        title: payload.title || "Notification",
        message: payload.message || "",
        entityId: payload.entityId,
        entityType: payload.entityType,
        link: getLinkForNotification(payload),
        time: payload.time,
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?._id, addNotification]);

  useEffect(() => {
    if (!user?._id) return undefined;

    let unsubscribeForeground = () => {};
    let unsubscribeSwClick = () => {};

    unsubscribeForeground = fcmService.setupForegroundListener((payload) => {
      const data = payload.data || {};
      const title = payload.notification?.title || data.title || "Notification";
      const message = payload.notification?.body || data.message || "";
      addNotification({
        type: data.type || "GENERAL",
        title,
        message,
        entityId: data.entityId,
        entityType: data.entityType,
        link: data.link || getLinkForNotification(data),
        time: new Date().toISOString(),
      });
    });

    unsubscribeSwClick = fcmService.setupServiceWorkerClickListener((data) => {
      if (data?.link && window.location.pathname !== data.link) {
        window.location.href = data.link;
      }
    });

    return () => {
      unsubscribeForeground();
      unsubscribeSwClick();
    };
  }, [user?._id, addNotification]);

  const markAllSeen = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, seen: true }));
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
    setSeenIds((prev) => {
      const allIds = [
        ...prev,
        ...notifications.map((n) => buildNotificationId(n)),
        ...activationRequests.map((r) => `activation-${r._id}`),
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allIds));
      return allIds;
    });
  }, [notifications, activationRequests]);

  const markSeen = useCallback((id) => {
    setSeenIds((prev) => {
      const next = prev.includes(id) ? prev : [...prev, id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
    setNotifications((prev) => {
      const updated = prev.map((n) =>
        buildNotificationId(n) === id ? { ...n, seen: true } : n,
      );
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const activationNotifications = activationRequests.map((req) => ({
    id: `activation-${req._id}`,
    type: "ACTIVATION_REQUEST",
    title: "Activation Request",
    message: `${req.name} (${req.email}) has requested account reactivation.`,
    entityId: req._id,
    entityType: "activation",
    link:
      req.role === "rider"
        ? "/riders"
        : req.role === "shopkeeper"
          ? "/shops"
          : "/customers",
    seen: seenIds.includes(`activation-${req._id}`),
  }));

  const socketNotifications = notifications.map((n) => ({
    ...n,
    seen: n.seen || seenIds.includes(buildNotificationId(n)),
  }));

  const allNotifications = [
    ...socketNotifications,
    ...activationNotifications,
  ].sort(
    (a, b) =>
      new Date(b.createdAt || b.time || 0) -
      new Date(a.createdAt || a.time || 0),
  );

  const unseenCount = allNotifications.filter((n) => !n.seen).length;

  return {
    notifications: allNotifications,
    unseenCount,
    markAllSeen,
    markSeen,
  };
};

const getLinkForNotification = (payload) => {
  switch (payload.entityType) {
    case "order":
      return "/orders";
    case "custom_order":
      return "/custom-orders";
    case "ride":
      return "/rides";
    case "safety_alert":
      return "/safety-alerts";
    case "banner":
      return "/banners";
    case "chat":
      return "/chats";
    default:
      return null;
  }
};

export { getLinkForNotification };
