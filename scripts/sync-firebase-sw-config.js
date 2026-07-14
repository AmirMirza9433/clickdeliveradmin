/**
 * Writes public/firebase-messaging-config.js for the service worker.
 */
const fs = require("fs");
const path = require("path");

const outPath = path.join(__dirname, "..", "public", "firebase-messaging-config.js");

const config = {
  apiKey: "AIzaSyBtsbfiP6_YmHlnz6eNjU2LuwghJgyxv8U",
  authDomain: "clickdeliver-85000.firebaseapp.com",
  projectId: "clickdeliver-85000",
  storageBucket: "clickdeliver-85000.firebasestorage.app",
  messagingSenderId: "877430124185",
  appId: "1:877430124185:web:af39f158d53d6a781d1208",
};

const contents = `// Auto-generated — do not edit. Run: node scripts/sync-firebase-sw-config.js
self.__FIREBASE_MESSAGING_CONFIG__ = ${JSON.stringify(config, null, 2)};
`;

fs.writeFileSync(outPath, contents);
