import axios from 'axios';

const getBaseUrl = () => {
  const backendUrl = process.env.BACKEND_URL;
  // If backendUrl is the placeholder or local, we might want to default to /api for web
  // but on mobile we need the full IP.
  if (backendUrl && !backendUrl.includes('__APP_')) {
    return `${backendUrl}/api`;
  }
  return '/api';
};

const http = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' }
});

http.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Dynamic import to avoid circular dependency
        const { refreshToken, setStoredAuth } = await import('./auth');
        const data = await refreshToken();
        if (data) {
          setStoredAuth(data);
          originalRequest.headers.Authorization = `Bearer ${data.token}`;
          return http(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed', refreshError);
      }
      
      // If refresh fails, clear auth and redirect
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_refresh_token');
      localStorage.removeItem('auth_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default http;
