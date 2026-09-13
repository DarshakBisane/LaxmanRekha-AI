import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let currentAuthToken: string | null = localStorage.getItem('laxmanrekha_token');
let currentCsrfToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  currentAuthToken = token;
  if (token) {
    localStorage.setItem('laxmanrekha_token', token);
  } else {
    localStorage.removeItem('laxmanrekha_token');
  }
};

export const getAuthToken = () => currentAuthToken;

export const setCsrfToken = (token: string | null) => {
  currentCsrfToken = token;
};

apiClient.interceptors.request.use((config) => {
  if (currentAuthToken) {
    config.headers['Authorization'] = `Bearer ${currentAuthToken}`;
  }
  if (currentCsrfToken && ['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
    config.headers['X-CSRF-Token'] = currentCsrfToken;
  }
  return config;
});
