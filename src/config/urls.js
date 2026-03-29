// API Configuration for backward compatibility
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'
};

// Re-export from api.js for consistency
export { API_BASE_URL, API_ENDPOINTS } from './api.js';
