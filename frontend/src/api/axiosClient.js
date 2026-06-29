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

export default axiosClient;
