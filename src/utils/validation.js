// Validation utility functions for forms

/**
 * Email validation
 * @param {string} email - Email to validate
 * @returns {object} - { isValid: boolean, message: string }
 */
export const validateEmail = (email) => {
  if (!email) {
    return { isValid: false, message: 'Email is required' };
  }
  
  if (email.length < 3) {
    return { isValid: false, message: 'Email is too short' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Please enter a valid email address' };
  }
  
  if (email.length > 254) {
    return { isValid: false, message: 'Email is too long' };
  }
  
  return { isValid: true, message: '' };
};

/**
 * Password validation
 * @param {string} password - Password to validate
 * @param {boolean} isLogin - Whether this is for login (less strict) or registration
 * @returns {object} - { isValid: boolean, message: string, strength: string }
 */
export const validatePassword = (password, isLogin = false) => {
  if (!password) {
    return { isValid: false, message: 'Password is required', strength: 'none' };
  }
  
  if (isLogin) {
    // For login, just check if password exists
    return { isValid: true, message: '', strength: 'unknown' };
  }
  
  // For registration, apply strict validation
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long', strength: 'weak' };
  }
  
  if (password.length > 128) {
    return { isValid: false, message: 'Password is too long (max 128 characters)', strength: 'weak' };
  }
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  let strength = 'weak';
  let strengthScore = 0;
  
  if (hasUpperCase) strengthScore++;
  if (hasLowerCase) strengthScore++;
  if (hasNumbers) strengthScore++;
  if (hasSpecialChar) strengthScore++;
  if (password.length >= 12) strengthScore++;
  
  if (strengthScore >= 4) strength = 'strong';
  else if (strengthScore >= 3) strength = 'medium';
  
  if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
    return { 
      isValid: false, 
      message: 'Password must contain uppercase, lowercase, and numbers', 
      strength 
    };
  }
  
  if (strength === 'weak') {
    return { 
      isValid: false, 
      message: 'Password is too weak. Add special characters or make it longer', 
      strength 
    };
  }
  
  return { isValid: true, message: '', strength };
};

/**
 * Name validation
 * @param {string} name - Name to validate
 * @returns {object} - { isValid: boolean, message: string }
 */
export const validateName = (name) => {
  if (!name) {
    return { isValid: false, message: 'Name is required' };
  }
  
  if (name.trim().length < 2) {
    return { isValid: false, message: 'Name must be at least 2 characters long' };
  }
  
  if (name.trim().length > 50) {
    return { isValid: false, message: 'Name is too long (max 50 characters)' };
  }
  
  const nameRegex = /^[a-zA-Z\s'-]+$/;
  if (!nameRegex.test(name.trim())) {
    return { isValid: false, message: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
  }
  
  return { isValid: true, message: '' };
};

/**
 * Phone validation
 * @param {string} phone - Phone number to validate
 * @returns {object} - { isValid: boolean, message: string }
 */
export const validatePhone = (phone) => {
  if (!phone) {
    return { isValid: false, message: 'Phone number is required' };
  }
  
  // Remove all non-digit characters for validation
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.length < 10) {
    return { isValid: false, message: 'Phone number must be at least 10 digits' };
  }
  
  if (cleanPhone.length > 15) {
    return { isValid: false, message: 'Phone number is too long' };
  }
  
  // Indian phone number validation (optional country code +91)
  const indianPhoneRegex = /^(\+91|91)?[6-9]\d{9}$/;
  if (!indianPhoneRegex.test(cleanPhone)) {
    return { isValid: false, message: 'Please enter a valid Indian phone number' };
  }
  
  return { isValid: true, message: '' };
};

/**
 * Date of Birth validation
 * @param {string} dob - Date of birth to validate
 * @returns {object} - { isValid: boolean, message: string }
 */
export const validateDateOfBirth = (dob) => {
  if (!dob) {
    return { isValid: false, message: 'Date of birth is required' };
  }
  
  const birthDate = new Date(dob);
  const today = new Date();
  
  if (isNaN(birthDate.getTime())) {
    return { isValid: false, message: 'Please enter a valid date' };
  }
  
  if (birthDate >= today) {
    return { isValid: false, message: 'Date of birth cannot be in the future' };
  }
  
  // Check minimum age (1 year)
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(today.getFullYear() - 1);
  
  if (birthDate > oneYearAgo) {
    return { isValid: false, message: 'Age must be at least 1 year' };
  }
  
  // Check maximum age (150 years)
  const maxAge = new Date();
  maxAge.setFullYear(today.getFullYear() - 150);
  
  if (birthDate < maxAge) {
    return { isValid: false, message: 'Please enter a valid date of birth' };
  }
  
  return { isValid: true, message: '' };
};

/**
 * Gender validation
 * @param {string} gender - Gender to validate
 * @returns {object} - { isValid: boolean, message: string }
 */
export const validateGender = (gender) => {
  if (!gender) {
    return { isValid: false, message: 'Gender is required' };
  }
  
  const validGenders = ['male', 'female', 'other'];
  if (!validGenders.includes(gender.toLowerCase())) {
    return { isValid: false, message: 'Please select a valid gender' };
  }
  
  return { isValid: true, message: '' };
};

/**
 * OTP validation
 * @param {string} otp - OTP to validate
 * @returns {object} - { isValid: boolean, message: string }
 */
export const validateOTP = (otp) => {
  if (!otp) {
    return { isValid: false, message: 'OTP is required' };
  }
  
  if (otp.length !== 6) {
    return { isValid: false, message: 'OTP must be 6 digits' };
  }
  
  if (!/^\d{6}$/.test(otp)) {
    return { isValid: false, message: 'OTP must contain only numbers' };
  }
  
  return { isValid: true, message: '' };
};

/**
 * Validate entire login form
 * @param {object} formData - Form data to validate
 * @returns {object} - { isValid: boolean, errors: object }
 */
export const validateLoginForm = (formData) => {
  const errors = {};
  let isValid = true;
  
  const emailValidation = validateEmail(formData.email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.message;
    isValid = false;
  }
  
  const passwordValidation = validatePassword(formData.password, true);
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.message;
    isValid = false;
  }
  
  return { isValid, errors };
};

/**
 * Validate entire registration form
 * @param {object} formData - Form data to validate
 * @returns {object} - { isValid: boolean, errors: object }
 */
export const validateRegistrationForm = (formData) => {
  const errors = {};
  let isValid = true;
  
  const nameValidation = validateName(formData.name);
  if (!nameValidation.isValid) {
    errors.name = nameValidation.message;
    isValid = false;
  }
  
  const emailValidation = validateEmail(formData.email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.message;
    isValid = false;
  }
  
  const phoneValidation = validatePhone(formData.phone);
  if (!phoneValidation.isValid) {
    errors.phone = phoneValidation.message;
    isValid = false;
  }
  
  const dobValidation = validateDateOfBirth(formData.dob);
  if (!dobValidation.isValid) {
    errors.dob = dobValidation.message;
    isValid = false;
  }
  
  const genderValidation = validateGender(formData.gender);
  if (!genderValidation.isValid) {
    errors.gender = genderValidation.message;
    isValid = false;
  }
  
  const passwordValidation = validatePassword(formData.password, false);
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.message;
    isValid = false;
  }
  
  return { isValid, errors, passwordStrength: passwordValidation.strength };
};

// Async availability checker for email/phone
export const checkAvailability = async ({ email, phone }) => {
  const params = new URLSearchParams();
  if (email) params.append('email', email);
  if (phone) params.append('phone', phone);

  const response = await fetch(`http://localhost:5001/api/auth/availability?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to check availability');
  }
  return response.json();
};

/**
 * Get password strength color
 * @param {string} strength - Password strength
 * @returns {string} - CSS color class
 */
export const getPasswordStrengthColor = (strength) => {
  switch (strength) {
    case 'weak':
      return 'text-red-500';
    case 'medium':
      return 'text-yellow-500';
    case 'strong':
      return 'text-green-500';
    default:
      return 'text-gray-500';
  }
};

/**
 * Get password strength text
 * @param {string} strength - Password strength
 * @returns {string} - Human readable strength
 */
export const getPasswordStrengthText = (strength) => {
  switch (strength) {
    case 'weak':
      return 'Weak';
    case 'medium':
      return 'Medium';
    case 'strong':
      return 'Strong';
    default:
      return '';
  }
};