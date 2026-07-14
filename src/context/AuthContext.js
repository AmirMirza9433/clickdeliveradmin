import React, { createContext, useState, useContext, useEffect } from "react";
import { authService } from "../services/authService";
import { fcmService } from "../services/fcmService";
import API from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Safely get token and avoid string 'undefined'
  const getInitialToken = () => {
    const stored = localStorage.getItem("adminToken");
    if (stored === "undefined" || stored === "null") return null;
    return stored;
  };

  const [token, setToken] = useState(getInitialToken());
  const [loading, setLoading] = useState(true);

  // Initialize auth state on refresh
  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      if (!token) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        // Make sure API always has the fresh token when fetching profile
        API.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        const profile = await authService.getProfile();

        // Ensure only admin or sub-admin gets access
        if (profile?.role !== "admin" && profile?.role !== "sub-admin") {
          throw new Error("Not authorized as admin or sub-admin");
        }

        if (isMounted) {
          setUser(profile);
          setLoading(false);
          fcmService.syncTokenToServer(false);
        }
      } catch (error) {
        if (isMounted) {
          // Only logout if the token is explicitly rejected (401)
          if (error.response && error.response.status === 401) {
            handleLogout();
          }
          setLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const login = async (email, password) => {
    try {
      // Request FCM permission and token FIRST (before login)
      const fcmToken = await fcmService.requestPermissionAndGetToken(true);

      // Now login with the token (even if empty, don't block login)
      const data = await authService.login(email, password, fcmToken || "");

      if (data.role !== "admin" && data.role !== "sub-admin") {
        throw new Error("Access denied. Admin or Sub-admin only.");
      }

      const adminToken = data.token;

      // Store securely
      localStorage.setItem("adminToken", adminToken);
      API.defaults.headers.common["Authorization"] = `Bearer ${adminToken}`;

      // Update Context
      setToken(adminToken);
      setUser(data);

      // Ensure FCM token is synced to server
      const syncedToken = await fcmService.syncTokenToServer(false);
      return data;
    } catch (err) {
      throw err;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    fcmService.clearToken();
    delete API.defaults.headers.common["Authorization"];
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, logout: handleLogout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
