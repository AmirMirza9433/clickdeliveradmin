/* eslint-disable no-undef */
importScripts(
  "https://www.gstatic.com/firebasejs/12.10.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/12.10.0/firebase-messaging-compat.js",
);
importScripts("/firebase-messaging-config.js");

firebase.initializeApp(self.__FIREBASE_MESSAGING_CONFIG__);

const messaging = firebase.messaging();

function broadcastToClients(payload) {
  return clients
    .matchAll({ type: "window", includeUncontrolled: true })
    .then((clientList) => {
      clientList.forEach((client) => {
        client.postMessage({
          type: "FCM_PUSH_RECEIVED",
          payload,
        });
      });
    });
}

function showPushNotification(payload) {
  const data = payload.data || {};
  const title = payload.notification?.title || data.title || "Notification";
  const body = payload.notification?.body || data.message || data.body || "";

  const link = data.link || getLinkFromEntity(data);

  return self.registration.showNotification(title, {
    body,
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: data.entityId || data.type || "admin-notification",
    data: { ...data, link },
    sound: "/notification-sound.wav",
    requireInteraction: true,
    vibrate: [200, 100, 200],
    actions: [
      {
        action: "close",
        title: "Close",
      },
    ],
  });
}

messaging.onBackgroundMessage((payload) => {
  broadcastToClients(payload);

  return showPushNotification(payload);
});

function getLinkFromEntity(data) {
  if (!data) return "/";
  switch (data.entityType) {
    case "order":
      return "/orders";
    case "custom_order":
      return "/custom-orders";
    case "ride":
      return "/rides";
    case "banner":
      return "/banners";
    case "chat":
      return "/chats";
    default:
      return "/";
  }
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = event.notification.data?.link || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.postMessage({
              type: "FCM_NOTIFICATION_CLICK",
              data: event.notification.data,
            });
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(self.location.origin + link);
        }
      }),
  );
});
