// Authentication utility functions

/**
 * Check if a JWT token is valid and not expired
 * @param {string} token - JWT token to validate
 * @returns {boolean} - True if token is valid and not expired
 */
export const isTokenValid = (token) => {
  if (!token) return false;
  
  try {
    // Decode JWT token (simple base64 decode for payload)
    const payload = JSON.parse(atob(token.split('.')[1]));
    
    // Check if token is expired
    const currentTime = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < currentTime) {
      console.log('Token expired');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Invalid token format:', error);
    return false;
  }
};

/**
 * Check if user is authenticated with valid token and user data
 * @returns {boolean} - True if user is properly authenticated
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  if (!token || !user) {
    return false;
  }
  
  // Validate token format and expiration
  if (!isTokenValid(token)) {
    // Clear invalid/expired token
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return false;
  }
  
  // Validate user data format
  try {
    JSON.parse(user);
    return true;
  } catch (error) {
    console.error('Invalid user data format:', error);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return false;
  }
};

/**
 * Clear all authentication data
 */
export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

/**
 * Get current user data from localStorage
 * @returns {object|null} - User data or null if not authenticated
 */
export const getCurrentUser = () => {
  if (!isAuthenticated()) {
    return null;
  }
  
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch (error) {
    console.error('Error parsing user data:', error);
    clearAuthData();
    return null;
  }
};
