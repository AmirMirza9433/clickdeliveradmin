import axios from "axios";

const API = axios.create({
  baseURL: "https://clickdeliverbackend-latest.onrender.com/api",
  // baseURL: "http://192.168.0.49:5001/api",

});

// Add a request interceptor to include the token
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
