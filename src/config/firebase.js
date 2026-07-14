import { initializeApp } from "firebase/app";
import { getMessaging, isSupported } from "firebase/messaging";

export const firebaseConfig = {
  apiKey: "AIzaSyBtsbfiP6_YmHlnz6eNjU2LuwghJgyxv8U",
  authDomain: "clickdeliver-85000.firebaseapp.com",
  projectId: "clickdeliver-85000",
  storageBucket: "clickdeliver-85000.firebasestorage.app",
  messagingSenderId: "877430124185",
  appId: "1:877430124185:web:af39f158d53d6a781d1208",
};

// Add Firebase Web Push (VAPID) key here to enable admin browser push notifications
export const vapidKey = "";

let app = null;

export const getFirebaseApp = () => {
  if (!firebaseConfig.apiKey || !firebaseConfig.appId) {
    return null;
  }
  if (!app) {
    app = initializeApp(firebaseConfig);
  }
  return app;
};

export const getFirebaseMessaging = async (serviceWorkerRegistration) => {
  const supported = await isSupported();

  if (!supported) {
    return null;
  }

  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) {
    return null;
  }

  if (serviceWorkerRegistration) {
    return getMessaging(firebaseApp, { serviceWorkerRegistration });
  }

  return getMessaging(firebaseApp);
};
