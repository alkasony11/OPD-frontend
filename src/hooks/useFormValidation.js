import { useState, useCallback, useEffect, useRef } from 'react';
import { checkAvailability } from '../utils/validation';

/**
 * Custom hook for real-time form validation
 * @param {object} initialValues - Initial form values
 * @param {function} validationRules - Function that returns validation results
 * @param {object} options - Additional options
 * @returns {object} - Form state and handlers
 */
export const useFormValidation = (initialValues, validationRules, options = {}) => {
  const {
    validateOnChange = true,
    validateOnBlur = true,
    debounceMs = 300
  } = options;

  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const availabilityAbortRef = useRef(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Debounced validation
  const [validationTimeout, setValidationTimeout] = useState(null);

  const validateField = useCallback((fieldName, value) => {
    if (!validationRules) return { isValid: true, message: '' };
    
    // Create a temporary form data object for validation
    const tempFormData = { ...values, [fieldName]: value };
    const validation = validationRules(tempFormData);
    
    return {
      isValid: !validation.errors || !validation.errors[fieldName],
      message: validation.errors ? validation.errors[fieldName] || '' : '',
      fieldErrors: validation.errors || {},
      formValid: validation.isValid
    };
  }, [values, validationRules]);

  const validateForm = useCallback(() => {
    if (!validationRules) return { isValid: true, errors: {} };
    
    const validation = validationRules(values);
    return {
      isValid: validation.isValid,
      errors: validation.errors || {},
      passwordStrength: validation.passwordStrength
    };
  }, [values, validationRules]);

  const debouncedValidation = useCallback((fieldName, value) => {
    if (validationTimeout) {
      clearTimeout(validationTimeout);
    }

    const timeout = setTimeout(() => {
      setIsValidating(true);
      const validation = validateField(fieldName, value);
      
      setErrors(prev => ({
        ...prev,
        [fieldName]: validation.message
      }));
      
      // Update overall form validity
      const formValidation = validateForm();
      setIsValid(formValidation.isValid);
      setIsValidating(false);
    }, debounceMs);

    setValidationTimeout(timeout);
  }, [validateField, validateForm, validationTimeout, debounceMs]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;

    setValues(prev => ({
      ...prev,
      [name]: fieldValue
    }));

    // Mark field as touched on first change for dynamic validation UX
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));

    // On first interaction, mark all fields as touched to reveal missing required fields
    if (!hasInteracted) {
      setHasInteracted(true);
      setTouched(prev => {
        const allTouched = Object.keys({ ...values, [name]: fieldValue }).reduce((acc, key) => {
          acc[key] = true;
          return acc;
        }, {});
        return allTouched;
      });
      const fullValidation = validateForm();
      setErrors(fullValidation.errors);
      setIsValid(fullValidation.isValid);
    }

    if (validateOnChange) {
      debouncedValidation(name, fieldValue);
    }
  }, [validateOnChange, debouncedValidation, hasInteracted, validateForm, values]);

  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;
    
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));

    if (!hasInteracted) {
      setHasInteracted(true);
      setTouched(prev => {
        const allTouched = Object.keys(values).reduce((acc, key) => {
          acc[key] = true;
          return acc;
        }, {});
        return allTouched;
      });
    }

    if (validateOnBlur) {
      setIsValidating(true);
      const validation = validateField(name, value);
      
      setErrors(prev => ({
        ...prev,
        [name]: validation.message
      }));
      
      // Update overall form validity
      const formValidation = validateForm();
      setIsValid(formValidation.isValid);
      setIsValidating(false);
    }
  }, [validateOnBlur, validateField, validateForm, hasInteracted, values]);

  const handleFocus = useCallback((e) => {
    const { name } = e.target;
    
    // Clear error when user starts typing in a field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  }, [errors]);

  const validateAllFields = useCallback(() => {
    const validation = validateForm();
    setErrors(validation.errors);
    setIsValid(validation.isValid);
    
    // Mark all fields as touched
    const allTouched = Object.keys(values).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);
    
    return validation;
  }, [validateForm, values]);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsValid(false);
    setIsValidating(false);
    
    if (validationTimeout) {
      clearTimeout(validationTimeout);
      setValidationTimeout(null);
    }
  }, [initialValues, validationTimeout]);

  const setFieldValue = useCallback((fieldName, value) => {
    setValues(prev => ({
      ...prev,
      [fieldName]: value
    }));

    if (validateOnChange && touched[fieldName]) {
      debouncedValidation(fieldName, value);
    }
  }, [validateOnChange, touched, debouncedValidation]);

  const setFieldError = useCallback((fieldName, error) => {
    setErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));
  }, []);

  const clearFieldError = useCallback((fieldName) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  // Update form validity when values change
  useEffect(() => {
    const validation = validateForm();
    setIsValid(validation.isValid);
  }, [values, validateForm]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (validationTimeout) {
        clearTimeout(validationTimeout);
      }
    };
  }, [validationTimeout]);

  return {
    values,
    errors,
    touched,
    isValid,
    isValidating,
    handleChange,
    handleBlur,
    handleFocus,
    validateAllFields,
    resetForm,
    setFieldValue,
    setFieldError,
    clearFieldError,
    validateField,
    validateForm
  };
};

/**
 * Hook specifically for login form validation
 */
export const useLoginValidation = (initialValues = { email: '', password: '' }) => {
  const validationRules = useCallback((formData) => {
    const errors = {};
    let isValid = true;

    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
      isValid = false;
    }

    // Password validation (simple for login)
    if (!formData.password) {
      errors.password = 'Password is required';
      isValid = false;
    }

    return { isValid, errors };
  }, []);

  return useFormValidation(initialValues, validationRules, {
    validateOnChange: true,
    validateOnBlur: true,
    debounceMs: 300
  });
};

/**
 * Hook specifically for registration form validation
 */
export const useRegistrationValidation = (initialValues = {
  name: '',
  email: '',
  phone: '',
  dob: '',
  gender: '',
  password: '',
  confirmPassword: '',
  termsAccepted: false
}) => {
  const validationRules = useCallback((formData) => {
    const errors = {};
    let isValid = true;
    let passwordStrength = 'none';

    // Normalize name spaces (no multiple spaces) before validation
    const normalizedName = (formData.name || '').replace(/\s{2,}/g, ' ').trim();

    // Name validation
    if (!normalizedName) {
      errors.name = 'Name is required';
      isValid = false;
    } else if (normalizedName.length < 2) {
      errors.name = 'Name must be at least 2 characters long';
      isValid = false;
    } else if (normalizedName.length > 50) {
      errors.name = 'Name is too long (max 50 characters)';
      isValid = false;
    } else if (!/^[a-zA-Z\s'-]+$/.test(normalizedName)) {
      errors.name = 'Name can only contain letters, spaces, hyphens, and apostrophes';
      isValid = false;
    }

    // Email validation (strict)
    if (!formData.email) {
      errors.email = 'Email is required';
      isValid = false;
    } else {
      const email = (formData.email || '').trim().toLowerCase();
      const hasSpace = /\s/.test(email);
      const parts = email.split('@');
      const validParts = parts.length === 2 && parts[0] && parts[1];
      const local = validParts ? parts[0] : '';
      const domain = validParts ? parts[1] : '';

      const tooLong = email.length > 254 || local.length > 64;
      const hasConsecutiveDots = /\.\./.test(local) || /\.\./.test(domain);
      const localStartsOrEndsWithDot = local.startsWith('.') || local.endsWith('.');
      const invalidDomainLabel = domain
        .split('.')
        .some(label => !label || label.length > 63 || label.startsWith('-') || label.endsWith('-'));
      const tld = domain.includes('.') ? domain.split('.').pop() : '';
      const invalidTldShape = !tld || tld.length < 2 || tld.length > 24 || /[^a-z]/.test(tld);
      // Restrict to commonly used/public TLDs for signup
      const allowedTlds = ['com','net','org','edu','gov','mil','info','io','co','in','ai','app','dev'];
      const invalidTld = invalidTldShape || !allowedTlds.includes(tld);

      const basicRegex = /^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/i;
      // Additional strict local-part rule: must start with a letter
      const localStartsWithLetter = /^[a-z][a-z0-9._%+\-]*$/i.test(local);

      if (hasSpace || !validParts || !basicRegex.test(email)) {
        errors.email = 'Please enter a valid email address';
        isValid = false;
      } else if (tooLong) {
        errors.email = 'Email is too long';
        isValid = false;
      } else if (hasConsecutiveDots || localStartsOrEndsWithDot) {
        errors.email = 'Email cannot contain consecutive dots or end with dot';
        isValid = false;
      } else if (!localStartsWithLetter) {
        errors.email = 'Email must start with a letter';
        isValid = false;
      } else if (invalidDomainLabel || invalidTld) {
        errors.email = 'Please enter a valid domain (e.g. example.com)';
        isValid = false;
      }
    }

    // Phone validation (strict - India)
    if (!formData.phone) {
      errors.phone = 'Phone number is required';
      isValid = false;
    } else {
      // Normalize to 10-digit Indian mobile number
      let digits = formData.phone.replace(/\D/g, '');
      if (digits.startsWith('0')) digits = digits.replace(/^0+/, '');
      if (digits.startsWith('91') && digits.length === 12) digits = digits.slice(2);
      if (digits.length !== 10) {
        errors.phone = 'Enter a 10-digit Indian mobile number';
        isValid = false;
      } else if (!/^[6-9]\d{9}$/.test(digits)) {
        errors.phone = 'Number must start with 6-9 and be 10 digits';
        isValid = false;
      } else if (/^(\d)\1{9}$/.test(digits)) {
        errors.phone = 'Phone number cannot be all same digits';
        isValid = false;
      } else if (digits === '1234567890' || digits === '0123456789' || digits === '0987654321') {
        errors.phone = 'Enter a real phone number';
        isValid = false;
      }
    }

    // Date of birth validation
    if (!formData.dob) {
      errors.dob = 'Date of birth is required';
      isValid = false;
    } else {
      const birthDate = new Date(formData.dob);
      const today = new Date();
      
      if (isNaN(birthDate.getTime())) {
        errors.dob = 'Please enter a valid date';
        isValid = false;
      } else if (birthDate >= today) {
        errors.dob = 'Date of birth cannot be in the future';
        isValid = false;
      } else {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(today.getFullYear() - 1);
        
        if (birthDate > oneYearAgo) {
          errors.dob = 'Age must be at least 1 year';
          isValid = false;
        }
      }
    }

    // Gender validation
    if (!formData.gender) {
      errors.gender = 'Gender is required';
      isValid = false;
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
      isValid = false;
      passwordStrength = 'none';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
      isValid = false;
      passwordStrength = 'weak';
    } else {
      const hasUpperCase = /[A-Z]/.test(formData.password);
      const hasLowerCase = /[a-z]/.test(formData.password);
      const hasNumbers = /\d/.test(formData.password);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(formData.password);
      const hasWhitespace = /\s/.test(formData.password);
      // Avoid including name or email local-part in password
      const emailLocalPart = (formData.email || '').split('@')[0] || '';
      const normalizedPassword = formData.password.toLowerCase();
      const normalizedName = (formData.name || '').toLowerCase();
      const normalizedEmailLocal = emailLocalPart.toLowerCase();
      
      let strengthScore = 0;
      if (hasUpperCase) strengthScore++;
      if (hasLowerCase) strengthScore++;
      if (hasNumbers) strengthScore++;
      if (hasSpecialChar) strengthScore++;
      if (formData.password.length >= 12) strengthScore++;
      
      if (strengthScore >= 4) passwordStrength = 'strong';
      else if (strengthScore >= 3) passwordStrength = 'medium';
      else passwordStrength = 'weak';
      
      if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
        errors.password = 'Password must contain uppercase, lowercase, and numbers';
        isValid = false;
      } else if (passwordStrength === 'weak') {
        errors.password = 'Password is too weak. Add special characters or make it longer';
        isValid = false;
      } else if (hasWhitespace) {
        errors.password = 'Password cannot contain spaces';
        isValid = false;
      } else if (
        (normalizedName && normalizedName.length >= 3 && normalizedPassword.includes(normalizedName)) ||
        (normalizedEmailLocal && normalizedEmailLocal.length >= 3 && normalizedPassword.includes(normalizedEmailLocal))
      ) {
        errors.password = 'Password should not contain your name or email';
        isValid = false;
      }
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (formData.password && formData.confirmPassword !== formData.password) {
      errors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    // Terms acceptance validation
    if (!formData.termsAccepted) {
      errors.termsAccepted = 'You must accept the Terms and Privacy Policy';
      isValid = false;
    }

    return { isValid, errors, passwordStrength };
  }, []);

  const base = useFormValidation(initialValues, validationRules, {
    validateOnChange: true,
    validateOnBlur: true,
    debounceMs: 500
  });

  // Async availability checks for email and phone
  useEffect(() => {
    const run = async () => {
      const email = base.values.email?.trim();
      const rawPhone = base.values.phone?.trim() || '';
      // Normalize phone for availability (10-digit)
      let phone = rawPhone.replace(/\D/g, '');
      if (phone.startsWith('0')) phone = phone.replace(/^0+/, '');
      if (phone.startsWith('91') && phone.length === 12) phone = phone.slice(2);
      if (phone && phone.length !== 10) {
        // Do not call availability if not a valid 10-digit
        phone = '';
      }

      // Only check when fields are syntactically valid and touched
      const shouldCheckEmail = !!email && !base.errors.email && base.touched.email;
      const shouldCheckPhone = !!phone && !base.errors.phone && base.touched.phone;

      if (!shouldCheckEmail && !shouldCheckPhone) return;

      try {
        const result = await checkAvailability({ email: shouldCheckEmail ? email : undefined, phone: shouldCheckPhone ? phone : undefined });
        if (shouldCheckEmail && result.email && result.email.available === false) {
          base.setFieldError('email', 'Email is already registered');
        }
        if (shouldCheckPhone && result.phone && result.phone.available === false) {
          base.setFieldError('phone', 'Phone is already registered');
        }
      } catch (err) {
        // Silently ignore network errors for availability
      }
    };

    const t = setTimeout(run, 400);
    return () => clearTimeout(t);
  }, [base.values.email, base.values.phone, base.errors.email, base.errors.phone, base.touched.email, base.touched.phone]);

  return base;
};

/**
 * Hook specifically for profile update validation
 */
export const useProfileUpdateValidation = (initialValues = {
  name: '',
  age: '',
  gender: 'male',
  phone: '',
  email: '',
  address: '',
  bloodGroup: '',
  allergies: '',
  chronicConditions: '',
  emergencyContact: {
    name: '',
    phone: '',
    relation: ''
  }
}) => {
  const validationRules = useCallback((formData) => {
    const errors = {};
    let isValid = true;

    // Name validation
    if (!formData.name) {
      errors.name = 'Name is required';
      isValid = false;
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters long';
      isValid = false;
    } else if (formData.name.trim().length > 50) {
      errors.name = 'Name is too long (max 50 characters)';
      isValid = false;
    } else if (!/^[a-zA-Z\s'-]+$/.test(formData.name.trim())) {
      errors.name = 'Name can only contain letters, spaces, hyphens, and apostrophes';
      isValid = false;
    }

    // Age validation
    if (!formData.age) {
      errors.age = 'Age is required';
      isValid = false;
    } else {
      const ageNum = parseInt(formData.age);
      if (isNaN(ageNum)) {
        errors.age = 'Age must be a valid number';
        isValid = false;
      } else if (ageNum < 1) {
        errors.age = 'Age must be at least 1 year';
        isValid = false;
      } else if (ageNum > 150) {
        errors.age = 'Age cannot exceed 150 years';
        isValid = false;
      }
    }

    // Gender validation
    if (!formData.gender) {
      errors.gender = 'Gender is required';
      isValid = false;
    } else if (!['male', 'female', 'other'].includes(formData.gender)) {
      errors.gender = 'Please select a valid gender';
      isValid = false;
    }

    // Phone validation
    if (!formData.phone) {
      errors.phone = 'Phone number is required';
      isValid = false;
    } else {
      const cleanPhone = formData.phone.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        errors.phone = 'Phone number must be at least 10 digits';
        isValid = false;
      } else if (cleanPhone.length > 15) {
        errors.phone = 'Phone number is too long';
        isValid = false;
      } else if (!/^(\+91|91)?[6-9]\d{9}$/.test(cleanPhone)) {
        errors.phone = 'Please enter a valid Indian phone number';
        isValid = false;
      }
    }

    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
      isValid = false;
    }

    // Address validation (optional)
    if (formData.address && formData.address.trim().length > 0) {
      if (formData.address.trim().length < 10) {
        errors.address = 'Address must be at least 10 characters long';
        isValid = false;
      } else if (formData.address.trim().length > 500) {
        errors.address = 'Address is too long (max 500 characters)';
        isValid = false;
      }
    }

    // Blood group validation (optional)
    if (formData.bloodGroup && formData.bloodGroup.trim().length > 0) {
      const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
      if (!validBloodGroups.includes(formData.bloodGroup)) {
        errors.bloodGroup = 'Please select a valid blood group';
        isValid = false;
      }
    }

    // Emergency contact validation (optional)
    if (formData.emergencyContact) {
      const { name, phone, relation } = formData.emergencyContact;
      
      if (name && name.trim().length > 0) {
        if (name.trim().length < 2) {
          errors['emergencyContact.name'] = 'Emergency contact name must be at least 2 characters';
          isValid = false;
        } else if (!/^[a-zA-Z\s'-]+$/.test(name.trim())) {
          errors['emergencyContact.name'] = 'Name can only contain letters, spaces, hyphens, and apostrophes';
          isValid = false;
        }
      }
      
      if (phone && phone.trim().length > 0) {
        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length < 10) {
          errors['emergencyContact.phone'] = 'Phone number must be at least 10 digits';
          isValid = false;
        } else if (!/^(\+91|91)?[6-9]\d{9}$/.test(cleanPhone)) {
          errors['emergencyContact.phone'] = 'Please enter a valid Indian phone number';
          isValid = false;
        }
      }
      
      if (relation && relation.trim().length > 0) {
        const validRelations = ['spouse', 'parent', 'child', 'sibling', 'friend', 'other'];
        if (!validRelations.includes(relation)) {
          errors['emergencyContact.relation'] = 'Please select a valid relation';
          isValid = false;
        }
      }
    }

    return { isValid, errors };
  }, []);

  return useFormValidation(initialValues, validationRules, {
    validateOnChange: true,
    validateOnBlur: true,
    debounceMs: 300
  });
};

/**
 * Hook specifically for family member validation
 */
export const useFamilyMemberValidation = (initialValues = {
  name: '',
  age: '',
  gender: 'male',
  phone: '',
  relation: 'spouse',
  bloodGroup: '',
  allergies: '',
  chronicConditions: ''
}) => {
  const validationRules = useCallback((formData) => {
    const errors = {};
    let isValid = true;

    // Name validation
    if (!formData.name) {
      errors.name = 'Name is required';
      isValid = false;
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters long';
      isValid = false;
    } else if (formData.name.trim().length > 50) {
      errors.name = 'Name is too long (max 50 characters)';
      isValid = false;
    } else if (!/^[a-zA-Z\s'-]+$/.test(formData.name.trim())) {
      errors.name = 'Name can only contain letters, spaces, hyphens, and apostrophes';
      isValid = false;
    }

    // Age validation
    if (!formData.age) {
      errors.age = 'Age is required';
      isValid = false;
    } else {
      const ageNum = parseInt(formData.age);
      if (isNaN(ageNum)) {
        errors.age = 'Age must be a valid number';
        isValid = false;
      } else if (ageNum < 1) {
        errors.age = 'Age must be at least 1 year';
        isValid = false;
      } else if (ageNum > 150) {
        errors.age = 'Age cannot exceed 150 years';
        isValid = false;
      }
    }

    // Gender validation
    if (!formData.gender) {
      errors.gender = 'Gender is required';
      isValid = false;
    } else if (!['male', 'female', 'other'].includes(formData.gender)) {
      errors.gender = 'Please select a valid gender';
      isValid = false;
    }

    // Phone validation (optional)
    if (formData.phone && formData.phone.trim().length > 0) {
      const cleanPhone = formData.phone.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        errors.phone = 'Phone number must be at least 10 digits';
        isValid = false;
      } else if (cleanPhone.length > 15) {
        errors.phone = 'Phone number is too long';
        isValid = false;
      } else if (!/^(\+91|91)?[6-9]\d{9}$/.test(cleanPhone)) {
        errors.phone = 'Please enter a valid Indian phone number';
        isValid = false;
      }
    }

    // Relation validation
    if (!formData.relation) {
      errors.relation = 'Relation is required';
      isValid = false;
    } else {
      const validRelations = ['spouse', 'parent', 'child', 'sibling', 'other'];
      if (!validRelations.includes(formData.relation)) {
        errors.relation = 'Please select a valid relation';
        isValid = false;
      }
    }

    // Blood group validation (optional)
    if (formData.bloodGroup && formData.bloodGroup.trim().length > 0) {
      const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
      if (!validBloodGroups.includes(formData.bloodGroup)) {
        errors.bloodGroup = 'Please select a valid blood group';
        isValid = false;
      }
    }

    return { isValid, errors };
  }, []);

  return useFormValidation(initialValues, validationRules, {
    validateOnChange: true,
    validateOnBlur: true,
    debounceMs: 300
  });
};

/**
 * Hook specifically for password change validation
 */
export const usePasswordChangeValidation = (initialValues = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
}) => {
  const validationRules = useCallback((formData) => {
    const errors = {};
    let isValid = true;

    // Current password validation
    if (!formData.currentPassword) {
      errors.currentPassword = 'Current password is required';
      isValid = false;
    }

    // New password validation
    if (!formData.newPassword) {
      errors.newPassword = 'New password is required';
      isValid = false;
    } else if (formData.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters long';
      isValid = false;
    } else {
      const hasUpperCase = /[A-Z]/.test(formData.newPassword);
      const hasLowerCase = /[a-z]/.test(formData.newPassword);
      const hasNumbers = /\d/.test(formData.newPassword);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword);
      const hasWhitespace = /\s/.test(formData.newPassword);

      if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
        errors.newPassword = 'Password must contain uppercase, lowercase, and numbers';
        isValid = false;
      } else if (hasWhitespace) {
        errors.newPassword = 'Password cannot contain spaces';
        isValid = false;
      } else if (formData.currentPassword && formData.newPassword === formData.currentPassword) {
        errors.newPassword = 'New password must be different from current password';
        isValid = false;
      }
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
      isValid = false;
    } else if (formData.newPassword && formData.confirmPassword !== formData.newPassword) {
      errors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    return { isValid, errors };
  }, []);

  return useFormValidation(initialValues, validationRules, {
    validateOnChange: true,
    validateOnBlur: true,
    debounceMs: 300
  });
};