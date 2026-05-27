import axios from 'axios';
import { clearAccessToken, getAccessToken, isAccessTokenValid, loginPath } from './auth';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token && isAccessTokenValid(token)) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (token) {
    clearAccessToken();
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearAccessToken();
      if (typeof window !== 'undefined' && window.location.pathname !== loginPath) {
        window.history.replaceState(null, '', loginPath);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    }

    return Promise.reject(error);
  },
);

export default api;
