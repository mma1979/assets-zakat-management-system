import axios from 'axios';

// const base = (process.env.BACKEND_URL && !process.env.BACKEND_URL.includes('__APP_'))
//   ? `${process.env.BACKEND_URL}/api`
//   : '/api';

const http = axios.create({
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
