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
  
  // Normalize multiple spaces to single space
  const normalizedName = name.replace(/\s{2,}/g, ' ').trim();
  
  if (normalizedName.length < 2) {
    return { isValid: false, message: 'Name must be at least 2 characters long' };
  }
  
  if (normalizedName.length > 50) {
    return { isValid: false, message: 'Name is too long (max 50 characters)' };
  }
  
  const nameRegex = /^[a-zA-Z\s'-]+$/;
  if (!nameRegex.test(normalizedName)) {
    return { isValid: false, message: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
  }
  
  return { isValid: true, message: '' };
};

// Sanitize name input - remove numbers and normalize spaces
export const sanitizeNameInput = (value) => {
  // Remove numbers and special characters except spaces, hyphens, apostrophes
  let sanitized = value.replace(/[^a-zA-Z\s'-]/g, '');
  // Normalize multiple spaces to single space
  sanitized = sanitized.replace(/\s{2,}/g, ' ');
  return sanitized;
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

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
  const response = await fetch(`${API_BASE_URL}/api/auth/availability?${params.toString()}`);
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

/**
 * Age validation
 * @param {string|number} age - Age to validate
 * @returns {object} - { isValid: boolean, message: string }
 */
export const validateAge = (age) => {
  if (!age) {
    return { isValid: false, message: 'Age is required' };
  }
  
  const ageNum = parseInt(age);
  if (isNaN(ageNum)) {
    return { isValid: false, message: 'Age must be a valid number' };
  }
  
  if (ageNum < 0) {
    return { isValid: false, message: 'Age cannot be negative' };
  }
  
  if (ageNum < 1) {
    return { isValid: false, message: 'Age must be at least 1 year' };
  }
  
  if (ageNum > 150) {
    return { isValid: false, message: 'Age cannot exceed 150 years' };
  }
  
  return { isValid: true, message: '' };
};

/**
 * Blood group validation
 * @param {string} bloodGroup - Blood group to validate
 * @returns {object} - { isValid: boolean, message: string }
 */
export const validateBloodGroup = (bloodGroup) => {
  if (!bloodGroup) {
    return { isValid: true, message: '' }; // Optional field
  }
  
  const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  if (!validBloodGroups.includes(bloodGroup)) {
    return { isValid: false, message: 'Please select a valid blood group' };
  }
  
  return { isValid: true, message: '' };
};

/**
 * Relation validation
 * @param {string} relation - Relation to validate
 * @returns {object} - { isValid: boolean, message: string }
 */
export const validateRelation = (relation) => {
  if (!relation) {
    return { isValid: false, message: 'Relation is required' };
  }
  
  const validRelations = ['spouse', 'child', 'parent', 'sibling', 'other'];
  if (!validRelations.includes(relation)) {
    return { isValid: false, message: 'Please select a valid relation' };
  }
  
  return { isValid: true, message: '' };
};

/**
 * Address validation
 * @param {string} address - Address to validate
 * @returns {object} - { isValid: boolean, message: string }
 */
export const validateAddress = (address) => {
  if (!address) {
    return { isValid: true, message: '' }; // Optional field
  }
  
  if (address.trim().length < 10) {
    return { isValid: false, message: 'Address must be at least 10 characters long' };
  }
  
  if (address.trim().length > 500) {
    return { isValid: false, message: 'Address is too long (max 500 characters)' };
  }
  
  return { isValid: true, message: '' };
};

/**
 * Emergency contact validation
 * @param {object} emergencyContact - Emergency contact object
 * @returns {object} - { isValid: boolean, errors: object }
 */
export const validateEmergencyContact = (emergencyContact) => {
  const errors = {};
  let isValid = true;
  
  if (!emergencyContact) {
    return { isValid: true, errors: {} }; // Optional field
  }
  
  // Name validation
  if (emergencyContact.name) {
    const nameValidation = validateName(emergencyContact.name);
    if (!nameValidation.isValid) {
      errors.name = nameValidation.message;
      isValid = false;
    }
  }
  
  // Phone validation
  if (emergencyContact.phone) {
    const phoneValidation = validatePhone(emergencyContact.phone);
    if (!phoneValidation.isValid) {
      errors.phone = phoneValidation.message;
      isValid = false;
    }
  }
  
  // Relation validation
  if (emergencyContact.relation) {
    const relationValidation = validateRelation(emergencyContact.relation);
    if (!relationValidation.isValid) {
      errors.relation = relationValidation.message;
      isValid = false;
    }
  }
  
  return { isValid, errors };
};

/**
 * Family member validation
 * @param {object} member - Family member object
 * @returns {object} - { isValid: boolean, errors: object }
 */
export const validateFamilyMember = (member) => {
  const errors = {};
  let isValid = true;
  
  // Name validation
  const nameValidation = validateName(member.name);
  if (!nameValidation.isValid) {
    errors.name = nameValidation.message;
    isValid = false;
  }
  
  // Age validation
  const ageValidation = validateAge(member.age);
  if (!ageValidation.isValid) {
    errors.age = ageValidation.message;
    isValid = false;
  }
  
  // Gender validation
  const genderValidation = validateGender(member.gender);
  if (!genderValidation.isValid) {
    errors.gender = genderValidation.message;
    isValid = false;
  }
  
  // Phone validation (optional)
  if (member.phone) {
    const phoneValidation = validatePhone(member.phone);
    if (!phoneValidation.isValid) {
      errors.phone = phoneValidation.message;
      isValid = false;
    }
  }
  
  // Relation validation
  const relationValidation = validateRelation(member.relation);
  if (!relationValidation.isValid) {
    errors.relation = relationValidation.message;
    isValid = false;
  }
  
  // Blood group validation (optional)
  if (member.bloodGroup) {
    const bloodGroupValidation = validateBloodGroup(member.bloodGroup);
    if (!bloodGroupValidation.isValid) {
      errors.bloodGroup = bloodGroupValidation.message;
      isValid = false;
    }
  }
  
  return { isValid, errors };
};

/**
 * Profile update validation
 * @param {object} profileData - Profile data to validate
 * @returns {object} - { isValid: boolean, errors: object }
 */
export const validateProfileUpdate = (profileData) => {
  const errors = {};
  let isValid = true;
  
  // Name validation
  const nameValidation = validateName(profileData.name);
  if (!nameValidation.isValid) {
    errors.name = nameValidation.message;
    isValid = false;
  }
  
  // Age validation
  const ageValidation = validateAge(profileData.age);
  if (!ageValidation.isValid) {
    errors.age = ageValidation.message;
    isValid = false;
  }
  
  // Gender validation
  const genderValidation = validateGender(profileData.gender);
  if (!genderValidation.isValid) {
    errors.gender = genderValidation.message;
    isValid = false;
  }
  
  // Phone validation
  const phoneValidation = validatePhone(profileData.phone);
  if (!phoneValidation.isValid) {
    errors.phone = phoneValidation.message;
    isValid = false;
  }
  
  // Email validation
  const emailValidation = validateEmail(profileData.email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.message;
    isValid = false;
  }
  
  // Address validation (optional)
  if (profileData.address) {
    const addressValidation = validateAddress(profileData.address);
    if (!addressValidation.isValid) {
      errors.address = addressValidation.message;
      isValid = false;
    }
  }
  
  // Blood group validation (optional)
  if (profileData.bloodGroup) {
    const bloodGroupValidation = validateBloodGroup(profileData.bloodGroup);
    if (!bloodGroupValidation.isValid) {
      errors.bloodGroup = bloodGroupValidation.message;
      isValid = false;
    }
  }
  
  // Emergency contact validation (optional)
  if (profileData.emergencyContact) {
    const emergencyValidation = validateEmergencyContact(profileData.emergencyContact);
    if (!emergencyValidation.isValid) {
      Object.assign(errors, emergencyValidation.errors);
      isValid = false;
    }
  }
  
  return { isValid, errors };
};

/**
 * Password change validation
 * @param {object} passwordData - Password change data
 * @returns {object} - { isValid: boolean, errors: object }
 */
export const validatePasswordChange = (passwordData) => {
  const errors = {};
  let isValid = true;
  
  // Current password validation
  if (!passwordData.currentPassword) {
    errors.currentPassword = 'Current password is required';
    isValid = false;
  }
  
  // New password validation
  const newPasswordValidation = validatePassword(passwordData.newPassword, false);
  if (!newPasswordValidation.isValid) {
    errors.newPassword = newPasswordValidation.message;
    isValid = false;
  }
  
  // Confirm password validation
  if (!passwordData.confirmPassword) {
    errors.confirmPassword = 'Please confirm your new password';
    isValid = false;
  } else if (passwordData.newPassword && passwordData.confirmPassword !== passwordData.newPassword) {
    errors.confirmPassword = 'Passwords do not match';
    isValid = false;
  }
  
  // Check if new password is same as current
  if (passwordData.currentPassword && passwordData.newPassword && 
      passwordData.currentPassword === passwordData.newPassword) {
    errors.newPassword = 'New password must be different from current password';
    isValid = false;
  }
  
  return { isValid, errors };
};