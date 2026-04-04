// ==========================================
// Axios API Instance
// ==========================================

import axios from 'axios';

const envBaseUrl = import.meta.env.VITE_API_BASE_URL;
const baseURL = typeof envBaseUrl === 'string' && envBaseUrl.trim()
  ? envBaseUrl.trim().replace(/\/+$/, '')
  : '/api';

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
