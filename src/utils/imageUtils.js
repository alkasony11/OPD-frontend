import { API_BASE_URL } from '../config/api';

/**
 * Get the proper image URL for display
 * @param {string} imageUrl - The image URL from the database
 * @param {Object} options - Optional transformation options for Cloudinary
 * @returns {string} - The complete image URL
 */
export const getImageUrl = (imageUrl, options = {}) => {
  if (!imageUrl) return '';
  
  // If it's already a complete URL (Cloudinary, external, etc.)
  if (imageUrl.startsWith('http')) {
    // If it's a Cloudinary URL and we have transformation options
    if (imageUrl.includes('cloudinary.com') && Object.keys(options).length > 0) {
      return getCloudinaryTransformedUrl(imageUrl, options);
    }
    return imageUrl;
  }
  
  // If it's a local path, prepend the API base URL
  return `${API_BASE_URL}${imageUrl}`;
};

/**
 * Get Cloudinary transformed URL
 * @param {string} cloudinaryUrl - The original Cloudinary URL
 * @param {Object} options - Transformation options
 * @returns {string} - The transformed URL
 */
export const getCloudinaryTransformedUrl = (cloudinaryUrl, options = {}) => {
  if (!cloudinaryUrl || !cloudinaryUrl.includes('cloudinary.com')) {
    return cloudinaryUrl;
  }

  const {
    width = null,
    height = null,
    crop = 'fill',
    quality = 'auto',
    format = 'auto',
    gravity = 'auto'
  } = options;

  if (!width && !height) {
    return cloudinaryUrl;
  }

  try {
    const transformations = [];
    if (width) transformations.push(`w_${width}`);
    if (height) transformations.push(`h_${height}`);
    if (crop) transformations.push(`c_${crop}`);
    if (quality) transformations.push(`q_${quality}`);
    if (format) transformations.push(`f_${format}`);
    if (gravity) transformations.push(`g_${gravity}`);

    const baseUrl = cloudinaryUrl.split('/upload/')[0];
    const path = cloudinaryUrl.split('/upload/')[1];
    return `${baseUrl}/upload/${transformations.join(',')}/${path}`;
  } catch (error) {
    console.error('Error transforming Cloudinary URL:', error);
    return cloudinaryUrl;
  }
};

/**
 * Get profile image URL with common transformations
 * @param {string} imageUrl - The image URL from the database
 * @param {string} size - Size preset ('small', 'medium', 'large')
 * @returns {string} - The transformed image URL
 */
export const getProfileImageUrl = (imageUrl, size = 'medium') => {
  if (!imageUrl) return '';

  const sizePresets = {
    small: { width: 32, height: 32 },
    medium: { width: 64, height: 64 },
    large: { width: 128, height: 128 },
    xlarge: { width: 256, height: 256 }
  };

  const options = sizePresets[size] || sizePresets.medium;
  return getImageUrl(imageUrl, options);
};

/**
 * Check if an image URL is a Cloudinary URL
 * @param {string} imageUrl - The image URL to check
 * @returns {boolean} - True if it's a Cloudinary URL
 */
export const isCloudinaryUrl = (imageUrl) => {
  return imageUrl && imageUrl.includes('cloudinary.com');
};

/**
 * Get a fallback image URL
 * @param {string} type - Type of fallback ('profile', 'doctor', 'patient')
 * @returns {string} - Fallback image URL
 */
export const getFallbackImageUrl = (type = 'profile') => {
  // You can add fallback images here or use a placeholder service
  const fallbacks = {
    profile: 'https://via.placeholder.com/64x64/cccccc/666666?text=U',
    doctor: 'https://via.placeholder.com/64x64/4f46e5/ffffff?text=D',
    patient: 'https://via.placeholder.com/64x64/10b981/ffffff?text=P'
  };
  
  return fallbacks[type] || fallbacks.profile;
};
