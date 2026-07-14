import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { firebaseConfig } from "./config/firebase";
import { fcmService } from "./services/fcmService";
// Register SW early so getToken() can attach before login.
if ("serviceWorker" in navigator) {
  fcmService.registerServiceWorker().catch(() => {});
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
