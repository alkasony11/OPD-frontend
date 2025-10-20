// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

// Add a function to test API connectivity
export const testApiConnection = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/test`);
    return response.ok;
  } catch (error) {
    console.error('API connection test failed:', error);
    return false;
  }
};

// Centralized API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    SEND_OTP: `${API_BASE_URL}/api/auth/send-otp`,
    FORGOT_PASSWORD: `${API_BASE_URL}/api/auth/forgot-password`,
    RESET_PASSWORD: `${API_BASE_URL}/api/auth/reset-password`,
    VERIFY_RESET_TOKEN: `${API_BASE_URL}/api/auth/verify-reset-token`,
    CLERK_SYNC: `${API_BASE_URL}/api/auth/clerk-sync`,
    AVAILABILITY: `${API_BASE_URL}/api/auth/availability`
  },
  PATIENT: {
    PROFILE: `${API_BASE_URL}/api/patient/profile`,
    APPOINTMENTS: `${API_BASE_URL}/api/patient/appointments`,
    DEPARTMENTS: `${API_BASE_URL}/api/patient/departments`,
    DOCTORS: `${API_BASE_URL}/api/patient/doctors`,
    FAMILY_MEMBERS: `${API_BASE_URL}/api/patient/family-members`,
    BOOK_APPOINTMENT: `${API_BASE_URL}/api/patient/book-appointment`,
    ANALYZE_SYMPTOMS: `${API_BASE_URL}/api/patient/analyze-symptoms`,
    PAYMENT: {
      KEY: `${API_BASE_URL}/api/patient/payment/key`,
      CREATE_ORDER: `${API_BASE_URL}/api/patient/payment/create-order`,
      MARK_PAID: `${API_BASE_URL}/api/patient/payment/mark-paid`
    }
  },
  DOCTOR: {
    PROFILE: `${API_BASE_URL}/api/doctor/profile`,
    APPOINTMENTS: `${API_BASE_URL}/api/doctor/appointments`,
    PATIENTS: `${API_BASE_URL}/api/doctor/patients`,
    SCHEDULES: `${API_BASE_URL}/api/doctor/schedules`,
    LEAVE_REQUESTS: `${API_BASE_URL}/api/doctor/leave-requests`,
    MEDICAL_RECORDS: `${API_BASE_URL}/api/doctor/medical-records`,
    TODAY_QUEUE: `${API_BASE_URL}/api/doctor/today-queue`,
    NEXT_PATIENT: `${API_BASE_URL}/api/doctor/next-patient`,
    CONSULTATION: {
      START: `${API_BASE_URL}/api/doctor/consultation/start`,
      SKIP: `${API_BASE_URL}/api/doctor/consultation/skip`,
      NO_SHOW: `${API_BASE_URL}/api/doctor/consultation/no-show`
    }
  },
  ADMIN: {
    DEPARTMENTS: `${API_BASE_URL}/api/admin/departments`,
    DOCTORS: `${API_BASE_URL}/api/admin/doctors`,
    PATIENTS: `${API_BASE_URL}/api/admin/patients`,
    USERS: `${API_BASE_URL}/api/admin/users`
  },
  NOTIFICATIONS: `${API_BASE_URL}/api/notifications`
};

// Helper function to build API URLs
export const buildApiUrl = (endpoint, params = {}) => {
  let url = endpoint;
  Object.keys(params).forEach(key => {
    url = url.replace(`:${key}`, params[key]);
  });
  return url;
};
