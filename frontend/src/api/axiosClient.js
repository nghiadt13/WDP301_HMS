import axios from 'axios';

const getDefaultApiUrl = () => {
  if (typeof window === 'undefined') {
    return 'http://localhost:9999/api';
  }

  const hostname = window.location.hostname.includes(':')
    ? `[${window.location.hostname}]`
    : window.location.hostname;

  return `${window.location.protocol}//${hostname}:9999/api`;
};

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || getDefaultApiUrl(),
  headers: {
    'Content-Type': 'application/json'
  }
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('hotelify_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Force logout if token is invalid or session is revoked
      localStorage.removeItem('hotelify_token');
      localStorage.removeItem('hotelify_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
