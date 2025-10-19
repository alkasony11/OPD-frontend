import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    // Surface a minimal normalized error
    const message = error.response?.data?.message || error.message || 'Request failed';
    console.error('[API ERROR]', message);
    return Promise.reject(error);
  }
);

export default api;


