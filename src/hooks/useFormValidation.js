import { useState, useCallback, useEffect } from 'react';

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

    if (validateOnChange && touched[name]) {
      debouncedValidation(name, fieldValue);
    }
  }, [validateOnChange, touched, debouncedValidation]);

  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;
    
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));

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
  }, [validateOnBlur, validateField, validateForm]);

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
  password: ''
}) => {
  const validationRules = useCallback((formData) => {
    const errors = {};
    let isValid = true;
    let passwordStrength = 'none';

    // Name validation
    if (!formData.name) {
      errors.name = 'Name is required';
      isValid = false;
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters long';
      isValid = false;
    } else if (!/^[a-zA-Z\s'-]+$/.test(formData.name.trim())) {
      errors.name = 'Name can only contain letters, spaces, hyphens, and apostrophes';
      isValid = false;
    }

    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
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
      } else if (!/^(\+91|91)?[6-9]\d{9}$/.test(cleanPhone)) {
        errors.phone = 'Please enter a valid Indian phone number';
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
      }
    }

    return { isValid, errors, passwordStrength };
  }, []);

  return useFormValidation(initialValues, validationRules, {
    validateOnChange: true,
    validateOnBlur: true,
    debounceMs: 500
  });
};