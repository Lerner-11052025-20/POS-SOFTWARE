import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Intercept requests — attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pos_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept responses — handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('pos_token');
      localStorage.removeItem('pos_user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  checkUsername: (username) => api.get(`/auth/check-username/${username}`),
  checkEmail: (email) => api.get(`/auth/check-email/${email}`),
};

// POS Configuration API calls
export const posAPI = {
  getConfigs: () => api.get('/pos/configs'),
  getConfig: (id) => api.get(`/pos/configs/${id}`),
  createConfig: (data) => api.post('/pos/configs', data),
  updateConfig: (id, data) => api.put(`/pos/configs/${id}`, data),
  deleteConfig: (id) => api.delete(`/pos/configs/${id}`),
  updatePaymentMethods: (id, data) => api.put(`/pos/configs/${id}/payment-methods`, data),
  openSession: (id, data) => api.post(`/pos/configs/${id}/open-session`, data),
  closeSession: (id, data) => api.post(`/pos/configs/${id}/close-session`, data),
  getSessions: (id) => api.get(`/pos/configs/${id}/sessions`),
};

export default api;
