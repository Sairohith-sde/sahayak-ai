import axios from 'axios';
import { useAuthStore } from '../store/auth.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL
});

// Request Interceptor: Automatically inject JWT bearer tokens
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response Interceptor: Catch auth expirations and auto-logout
api.interceptors.response.use((response) => {
  return response;
}, (error) => {
  if (error.response && error.response.status === 401) {
    console.warn("⚠️ Authentication expired or invalid. Logging user out automatically.");
    useAuthStore.getState().logout();
  }
  return Promise.reject(error);
});

export default api;
