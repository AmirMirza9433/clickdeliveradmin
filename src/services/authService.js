import API from './api';

export const authService = {
  login: async (email, password, fcmToken = '') => {
    const response = await API.post('/auth/login', { email, password, fcmToken });
    return response.data;
  },

  getProfile: async () => {
    const response = await API.get('/auth/profile');
    return response.data;
  },

  updateFcmToken: async (fcmToken) => {
    const response = await API.put('/auth/profile', { fcmToken });
    return response.data;
  },
};
