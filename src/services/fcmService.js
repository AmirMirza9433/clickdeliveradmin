import { getToken, onMessage, deleteToken } from "firebase/messaging";
import {
  getFirebaseMessaging,
  vapidKey,
  firebaseConfig,
} from "../config/firebase";
import { authService } from "./authService";

const FCM_TOKEN_KEY = "admin_fcm_token";

let swRegistration = null;
let foregroundListenerAttached = false;
const foregroundSubscribers = new Set();

const dispatchForegroundPayload = (payload) => {
  const data = payload.data || {};
  const title = payload.notification?.title || data.title || "Notification";
  const body = payload.notification?.body || data.message || data.body || "";
  showSystemNotification(title, body, data);

  foregroundSubscribers.forEach((callback) => {
    try {
      callback(payload);
    } catch (error) {
    }
  });
};

const showSystemNotification = async (title, body, data = {}) => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return;
  }
  // If permission is not granted, request it
  if (Notification.permission !== "granted") {
    if (Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        return;
      }
    } else {
      return;
    }
  }

  const options = {
    body,
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    data,
    tag: data.entityId || data.type || "admin-notification",
    sound: "/notification-sound.wav",
    requireInteraction: true,
    vibrate: [200, 100, 200],
    actions: [
      {
        action: "close",
        title: "Close",
      },
    ],
  };

  try {
    if ("serviceWorker" in navigator && swRegistration) {
      await swRegistration.showNotification(title, options);
      playNotificationSound();
      return;
    }
    new Notification(title, options);
    playNotificationSound();
  } catch (error) {
  }
};

const playNotificationSound = () => {
  try {
    const audioContext = new (
      window.AudioContext || window.webkitAudioContext
    )();

    // Resume context if it's suspended (required for autoplay)
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    const now = audioContext.currentTime;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    oscillator.start(now);
    oscillator.stop(now + 0.5);
  } catch (error) {
  }
};

const attachForegroundListener = async (registration) => {
  if (foregroundListenerAttached) {
    return;
  }
  const messaging = await getFirebaseMessaging(registration);
  if (!messaging) {
    return;
  }

  onMessage(messaging, (payload) => {
    dispatchForegroundPayload(payload);
  });

  foregroundListenerAttached = true;
};

const attachServiceWorkerBridge = () => {
  if (!navigator.serviceWorker) return () => {};

  const handler = (event) => {
    if (event.data?.type === "FCM_PUSH_RECEIVED") {
      dispatchForegroundPayload(event.data.payload);
    }
  };

  navigator.serviceWorker.addEventListener("message", handler);
  return () => navigator.serviceWorker.removeEventListener("message", handler);
};

let swBridgeCleanup = null;

export const fcmService = {
  async registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
      return null;
    }
    try {
      const registration = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js",
        { scope: "/" },
      );
      // Wait for SW to become active
      await new Promise((resolve) => {
        if (registration.active) {
          resolve();
        } else {
          const activateHandler = () => {
            registration.removeEventListener("activate", activateHandler);
            resolve();
          };
          registration.addEventListener("activate", activateHandler);

          // Timeout after 30 seconds
          setTimeout(() => {
            registration.removeEventListener("activate", activateHandler);
            resolve();
          }, 30000);
        }
      });

      await navigator.serviceWorker.ready;
      swRegistration = registration;

      // Don't attach service worker bridge - use Firebase's onMessage() instead
      // This prevents duplicate messages
      // if (!swBridgeCleanup) {
      //   swBridgeCleanup = attachServiceWorkerBridge();
      // }

      await attachForegroundListener(registration);
      return registration;
    } catch (error) {
      return null;
    }
  },

  async requestPermissionAndGetToken(forceRefresh = false) {
    if (!vapidKey) {
      return null;
    }

    if (!("Notification" in window)) {
      return null;
    }

    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return null;
    }
    const registration = await this.registerServiceWorker();
    if (!registration) {
      return null;
    }

    const messaging = await getFirebaseMessaging(registration);
    if (!messaging) {
      return null;
    }

    try {
      if (forceRefresh) {
        try {
          await deleteToken(messaging);
        } catch (e) {
        }
        localStorage.removeItem(FCM_TOKEN_KEY);
      }
      const token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration,
      });

      if (token) {
        localStorage.setItem(FCM_TOKEN_KEY, token);
      } else {
      }
      return token || null;
    } catch (error) {
      localStorage.removeItem(FCM_TOKEN_KEY);
      return null;
    }
  },

  async syncTokenToServer(forceRefresh = false) {
    const token = await this.requestPermissionAndGetToken(forceRefresh);
    if (!token) {
      return null;
    }

    try {
      await authService.updateFcmToken(token);
      return token;
    } catch (error) {
      return null;
    }
  },

  setupForegroundListener(callback) {
    foregroundSubscribers.add(callback);

    if (swRegistration) {
      attachForegroundListener(swRegistration);
    } else {
      this.registerServiceWorker();
    }

    return () => {
      foregroundSubscribers.delete(callback);
    };
  },

  setupServiceWorkerClickListener(callback) {
    if (!navigator.serviceWorker) {
      return () => {};
    }
    const handler = (event) => {
      if (event.data?.type === "FCM_NOTIFICATION_CLICK") {
        callback(event.data.data);
      }
    };
    navigator.serviceWorker.addEventListener("message", handler);
    return () =>
      navigator.serviceWorker.removeEventListener("message", handler);
  },

  clearToken() {
    localStorage.removeItem(FCM_TOKEN_KEY);
    foregroundListenerAttached = false;
  },

  getPermissionStatus() {
    if (!("Notification" in window)) return "unsupported";
    return Notification.permission;
  },

  isConfigured() {
    return Boolean(vapidKey && firebaseConfig.apiKey);
  },
};

export { showSystemNotification };
