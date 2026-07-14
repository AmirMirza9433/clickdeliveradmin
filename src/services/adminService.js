import API from "./api";

export const adminService = {
  getStats: async (startDate, endDate, city) => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (city && city !== "all") params.city = city;
    const response = await API.get("/admin/stats", { params });
    return response.data;
  },

  getUsers: async (role, params = {}) => {
    const queryParams = { ...params };
    if (role) queryParams.role = role;
    const response = await API.get("/admin/users", { params: queryParams });
    return response.data;
  },

  getActivationRequests: async () => {
    const response = await API.get("/admin/users?activationRequested=true");
    return response.data;
  },

  verifyRider: async (riderId, isVerified = true) => {
    const response = await API.put(`/admin/riders/${riderId}/verify`, {
      isVerified,
    });
    return response.data;
  },

  verifyShopkeeper: async (shopkeeperId, isVerified = true) => {
    const response = await API.put(
      `/admin/shopkeepers/${shopkeeperId}/verify`,
      {
        isVerified,
      },
    );
    return response.data;
  },
  updateShopkeeperPercentage: async (shopkeeperId, percentageCharge) => {
    const response = await API.put(
      `/admin/shopkeepers/${shopkeeperId}/percentage`,
      {
        percentageCharge,
      },
    );
    return response.data;
  },

  deleteUser: async (userId) => {
    const response = await API.delete(`/admin/users/${userId}`);
    return response.data;
  },

  activateUser: async (userId) => {
    const response = await API.put(`/admin/users/${userId}/activate`);
    return response.data;
  },

  getOrders: async (params) => {
    const response = await API.get("/orders", { params });
    return response.data;
  },

  updateOrderStatus: async (orderId, status) => {
    const response = await API.put(`/orders/${orderId}/status`, { status });
    return response.data;
  },

  getProducts: async (params = {}) => {
    const response = await API.get("/products", {
      params: { limit: 1000, ...params },
    });
    return response.data;
  },

  createProduct: async (productData) => {
    const response = await API.post("/products", productData);
    return response.data;
  },

  deleteProduct: async (productId) => {
    const response = await API.delete(`/products/${productId}`);
    return response.data;
  },

  updateProduct: async (productId, productData) => {
    const response = await API.put(`/products/${productId}`, productData);
    return response.data;
  },

  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append("image", file);
    const response = await API.post("/upload/image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  uploadVideo: async (file) => {
    const formData = new FormData();
    formData.append("video", file);
    const response = await API.post("/upload/video", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  getCities: async () => {
    const response = await API.get("/cities");
    return response.data;
  },

  createCity: async (cityData) => {
    const response = await API.post("/cities", cityData);
    return response.data;
  },

  updateCity: async (cityId, cityData) => {
    const response = await API.put(`/cities/${cityId}`, cityData);
    return response.data;
  },

  deleteCity: async (cityId) => {
    const response = await API.delete(`/cities/${cityId}`);
    return response.data;
  },
  getAdminSettings: async (city) => {
    const response = await API.get("/admin/settings", { params: { city } });
    return response.data;
  },
  updateAdminSettings: async (settingsData, city) => {
    const response = await API.put("/admin/settings", {
      ...settingsData,
      city,
    });
    return response.data;
  },
  testPushNotification: async () => {
    const response = await API.post("/admin/notifications/test-push");
    return response.data;
  },

  sendCustomNotification: async (notificationData) => {
    const response = await API.post(
      "/admin/notifications/send",
      notificationData,
    );
    return response.data;
  },

  assignRiderToOrder: async (orderId, riderId) => {
    const response = await API.put(`/admin/orders/${orderId}/assign-rider`, {
      riderId,
    });
    return response.data;
  },

  updateOrderStatusAdmin: async (orderId, status, cancellationReason) => {
    const response = await API.put(`/admin/orders/${orderId}/status`, {
      status,
      cancellationReason,
    });
    return response.data;
  },

  getBanners: async (status, params = {}) => {
    const queryParams = { ...params };
    if (status) queryParams.status = status;
    const response = await API.get("/admin/banners", { params: queryParams });
    return response.data;
  },

  createBanner: async (data) => {
    const response = await API.post("/admin/banners", data);
    return response.data;
  },

  approveBanner: async (id, markPaid = false) => {
    const response = await API.put(`/admin/banners/${id}/approve`, {
      markPaid,
    });
    return response.data;
  },

  rejectBanner: async (id, reason) => {
    const response = await API.put(`/admin/banners/${id}/reject`, { reason });
    return response.data;
  },

  deleteBanner: async (id) => {
    const response = await API.delete(`/admin/banners/${id}`);
    return response.data;
  },
  getDeletedBanners: async (params) => {
    const response = await API.get("/admin/banners/deleted", { params });
    return response.data;
  },
  restoreBanner: async (id) => {
    const response = await API.put(`/admin/banners/${id}/restore`);
    return response.data;
  },
  expireBanner: async (id) => {
    const response = await API.put(`/admin/banners/${id}`);
    return response.data;
  },

  getCustomOrders: async (params) => {
    const response = await API.get("/custom-orders", { params });
    return response.data;
  },

  updateCustomOrderStatus: async (id, data) => {
    const response = await API.put(`/custom-orders/${id}/status`, data);
    return response.data;
  },

  getRides: async (params) => {
    const response = await API.get("/rides", { params });
    return response.data;
  },

  updateRideStatus: async (id, data) => {
    const response = await API.put(`/rides/${id}/status`, data);
    return response.data;
  },

  getPaymentMethods: async () => {
    const response = await API.get("/payment-methods");
    return response.data;
  },

  createPaymentMethod: async (data) => {
    const response = await API.post("/payment-methods", data);
    return response.data;
  },

  updatePaymentMethod: async (id, data) => {
    const response = await API.put(`/payment-methods/${id}`, data);
    return response.data;
  },

  deletePaymentMethod: async (id) => {
    const response = await API.delete(`/payment-methods/${id}`);
    return response.data;
  },

  getWalletDeposits: async (params = {}) => {
    const response = await API.get("/wallet/admin/deposits", { params });
    return response.data;
  },

  approveWalletDeposit: async (id) => {
    const response = await API.put(`/wallet/admin/deposits/${id}/approve`);
    return response.data;
  },

  rejectWalletDeposit: async (id, data) => {
    const response = await API.put(`/wallet/admin/deposits/${id}/reject`, data);
    return response.data;
  },

  getWalletWithdraws: async (params = {}) => {
    const response = await API.get("/wallet/admin/withdraws", { params });
    return response.data;
  },

  approveWalletWithdraw: async (id, data) => {
    const response = await API.put(
      `/wallet/admin/withdraws/${id}/approve`,
      data,
    );
    return response.data;
  },

  rejectWalletWithdraw: async (id, data) => {
    const response = await API.put(
      `/wallet/admin/withdraws/${id}/reject`,
      data,
    );
    return response.data;
  },

  // Sub-admin management
  getAdmins: async () => {
    const response = await API.get("/admin/sub-admins");
    return response.data;
  },
  createSubAdmin: async (data) => {
    const response = await API.post("/admin/sub-admins", data);
    return response.data;
  },
  updateSubAdmin: async (id, data) => {
    const response = await API.put(`/admin/sub-admins/${id}`, data);
    return response.data;
  },
  deleteSubAdmin: async (id) => {
    const response = await API.delete(`/admin/sub-admins/${id}`);
    return response.data;
  },

  getSafetyAlerts: async (params) => {
    const response = await API.get("/admin/safety-alerts", { params });
    return response.data;
  },

  resolveSafetyAlert: async (id) => {
    const response = await API.put(`/admin/safety-alerts/${id}/resolve`);
    return response.data;
  },
};
