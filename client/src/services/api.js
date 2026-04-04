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

// Orders API calls
export const ordersAPI = {
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  archive: (ids) => api.put('/orders/archive', { ids }),
  deleteDrafts: (ids) => api.delete('/orders', { data: { ids } }),
};

// Payments API calls
export const paymentsAPI = {
  getAll: () => api.get('/payments'),
  getGrouped: () => api.get('/payments/grouped'),
  create: (data) => api.post('/payments', data),
};

// Customers API calls
export const customersAPI = {
  getAll: (params) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
};

// Products API calls
export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  bulkArchive: (ids) => api.put('/products/bulk/archive', { ids }),
  bulkDelete: (ids) => api.delete('/products/bulk', { data: { ids } }),
};

// Categories API calls
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  remove: (id) => api.delete(`/categories/${id}`),
};

// Floors API calls
export const floorsAPI = {
  getAll: (params) => api.get('/floors', { params }),
  create: (data) => api.post('/floors', data),
  update: (id, data) => api.put(`/floors/${id}`, data),
  remove: (id) => api.delete(`/floors/${id}`),
};

// Tables API calls
export const tablesAPI = {
  getAll: (params) => api.get('/tables', { params }),
  create: (data) => api.post('/tables', data),
  update: (id, data) => api.put(`/tables/${id}`, data),
  bulkDuplicate: (ids) => api.post('/tables/bulk/duplicate', { ids }),
  bulkDelete: (ids) => api.delete('/tables/bulk', { data: { ids } }),
};

export default api;
