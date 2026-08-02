import { getToken, onMessage, deleteToken } from "firebase/messaging";
import {
  getFirebaseMessaging,
  vapidKey,
  firebaseConfig,
} from "../config/firebase";
import { authService } from "./authService";

const FCM_TOKEN_KEY = "admin_fcm_token";
const SOUND_URL = "/notification-sound.wav";

let swRegistration = null;
let foregroundListenerAttached = false;
const foregroundSubscribers = new Set();
let sharedAudio = null;
let sharedAudioContext = null;
let audioUnlocked = false;
let unlockListenersAttached = false;
const recentAlerts = new Map();
const ALERT_DEDUP_MS = 5000;

const alertKey = (data = {}, title = "") =>
  `${data.type || "GENERAL"}-${data.entityId || title || data.message || "x"}`;

const claimAlertSlot = (data = {}, title = "") => {
  const key = alertKey(data, title);
  const last = recentAlerts.get(key);
  if (last && Date.now() - last < ALERT_DEDUP_MS) {
    return false;
  }
  recentAlerts.set(key, Date.now());
  return true;
};

const getSharedAudio = () => {
  if (typeof window === "undefined") return null;
  if (!sharedAudio) {
    sharedAudio = new Audio(SOUND_URL);
    sharedAudio.preload = "auto";
    sharedAudio.volume = 1;
  }
  return sharedAudio;
};

const getSharedAudioContext = () => {
  if (typeof window === "undefined") return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!sharedAudioContext) {
    sharedAudioContext = new Ctx();
  }
  return sharedAudioContext;
};

const playBeepFallback = async () => {
  try {
    const ctx = getSharedAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
    const now = ctx.currentTime;
    const playTone = (freq, start, duration) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.type = "sine";
      oscillator.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.35, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.02);
    };
    // Two short beeps so it's noticeable
    playTone(880, now, 0.18);
    playTone(1175, now + 0.22, 0.22);
  } catch {
    // ignore
  }
};

/** Call after a user gesture (login / Enable notifications) so browsers allow sound. */
export const unlockNotificationAudio = async () => {
  try {
    const audio = getSharedAudio();
    if (audio) {
      audio.muted = true;
      await audio.play();
      audio.pause();
      audio.currentTime = 0;
      audio.muted = false;
    }
    const ctx = getSharedAudioContext();
    if (ctx?.state === "suspended") {
      await ctx.resume();
    }
    audioUnlocked = true;
  } catch {
    // Autoplay may still be blocked until a clearer gesture
  }
};

/** Unlock audio on first click/keypress anywhere in the admin panel. */
export const installAudioUnlockListeners = () => {
  if (typeof window === "undefined" || unlockListenersAttached) {
    return () => {};
  }
  unlockListenersAttached = true;

  const unlock = () => {
    unlockNotificationAudio();
  };

  document.addEventListener("click", unlock, true);
  document.addEventListener("keydown", unlock, true);
  document.addEventListener("touchstart", unlock, true);

  return () => {
    document.removeEventListener("click", unlock, true);
    document.removeEventListener("keydown", unlock, true);
    document.removeEventListener("touchstart", unlock, true);
    unlockListenersAttached = false;
  };
};

export const playNotificationSound = () => {
  // Fresh Audio instance avoids "play interrupted" when alerts arrive quickly
  try {
    const audio = new Audio(SOUND_URL);
    audio.volume = 1;
    const playPromise = audio.play();
    if (playPromise?.catch) {
      playPromise.catch(() => {
        const shared = getSharedAudio();
        if (shared) {
          shared.currentTime = 0;
          shared.play().catch(() => {
            playBeepFallback();
          });
          return;
        }
        playBeepFallback();
      });
    }
  } catch {
    playBeepFallback();
  }
};

const dispatchToSubscribers = (payload) => {
  foregroundSubscribers.forEach((callback) => {
    try {
      callback(payload);
    } catch {
      // ignore subscriber errors
    }
  });
};

/**
 * Browser OS notification + sound.
 * Always show popup even when the admin tab is in the background (another tab focused).
 */
export const showSystemNotification = async (
  title,
  body,
  data = {},
  { force = false } = {},
) => {
  if (typeof window === "undefined") {
    return;
  }

  if (!claimAlertSlot(data, title)) {
    return;
  }

  // Always attempt sound first (works best when audio was unlocked by a user gesture)
  playNotificationSound();

  if (!("Notification" in window)) {
    return;
  }

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
    body: body || "",
    icon: "/logo192.png",
    badge: "/favicon.ico",
    data,
    tag: String(data.entityId || data.type || title || "admin-notification"),
    requireInteraction: true,
    silent: false,
    vibrate: [200, 100, 200, 100, 200],
    renotify: true,
  };

  try {
    // Prefer SW notification — works while tab is open OR backgrounded
    if ("serviceWorker" in navigator) {
      const registration =
        swRegistration || (await navigator.serviceWorker.getRegistration());
      if (registration) {
        await registration.showNotification(title, options);
        return;
      }
    }
    // force kept for API compatibility
    void force;
    new Notification(title, options);
  } catch (error) {
    try {
      new Notification(title, options);
    } catch {
      // ignore
    }
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
    // Foreground FCM: list/toast/sound handled by subscribers via addNotification.
    // Also show OS popup while tab is focused.
    const data = payload.data || {};
    const title = payload.notification?.title || data.title || "Notification";
    const body = payload.notification?.body || data.message || data.body || "";
    showSystemNotification(title, body, data, { force: true });
    dispatchToSubscribers(payload);
  });

  foregroundListenerAttached = true;
};

const attachServiceWorkerBridge = () => {
  if (!navigator.serviceWorker) return () => {};

  const handler = (event) => {
    if (event.data?.type === "FCM_PUSH_RECEIVED") {
      // Background SW already showed the OS notification — update UI + play sound once.
      const payload = event.data.payload || {};
      const data = payload.data || {};
      const title = payload.notification?.title || data.title || "Notification";
      if (claimAlertSlot(data, title)) {
        playNotificationSound();
      }
      dispatchToSubscribers(payload);
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

      if (registration.installing) {
        await new Promise((resolve) => {
          const worker = registration.installing;
          const onStateChange = () => {
            if (worker.state === "activated" || worker.state === "redundant") {
              worker.removeEventListener("statechange", onStateChange);
              resolve();
            }
          };
          worker.addEventListener("statechange", onStateChange);
          setTimeout(resolve, 10000);
        });
      }

      await navigator.serviceWorker.ready;
      swRegistration = registration.active
        ? registration
        : (await navigator.serviceWorker.getRegistration()) || registration;

      if (!swBridgeCleanup) {
        swBridgeCleanup = attachServiceWorkerBridge();
      }

      await attachForegroundListener(swRegistration);
      return swRegistration;
    } catch (error) {
      console.error("[FCM] service worker register failed:", error);
      return null;
    }
  },

  async requestPermissionAndGetToken(forceRefresh = false) {
    if (!vapidKey) {
      console.warn(
        "[FCM] Missing vapidKey in admin-panel/src/config/firebase.js",
      );
      return null;
    }

    if (!("Notification" in window)) {
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return null;
    }

    await unlockNotificationAudio();

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
        } catch {
          // ignore
        }
        localStorage.removeItem(FCM_TOKEN_KEY);
      }
      const token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration,
      });

      if (token) {
        localStorage.setItem(FCM_TOKEN_KEY, token);
      }
      return token || null;
    } catch (error) {
      console.error("[FCM] getToken failed:", error);
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
      console.error("[FCM] sync token failed:", error);
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

  isAudioUnlocked() {
    return audioUnlocked;
  },
};
