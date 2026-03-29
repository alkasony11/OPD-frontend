import React from 'react';
import { HiEye, HiEyeOff, HiExclamationCircle, HiCheckCircle } from 'react-icons/hi';

/**
 * Enhanced Input Field with validation
 */
export const ValidatedInput = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  onFocus,
  error,
  touched,
  required = false,
  placeholder,
  className = '',
  disabled = false,
  autoComplete,
  maxLength,
  ...props
}) => {
  const hasError = error; // Show error immediately, not just when touched
  const isValid = touched && !error && value;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          maxLength={maxLength}
          className={`
            w-full px-4 py-3 border rounded-lg transition-all duration-200
            ${hasError 
              ? 'border-red-500 focus:ring-2 focus:ring-red-200 focus:border-red-500' 
              : isValid
                ? 'border-green-500 focus:ring-2 focus:ring-green-200 focus:border-green-500'
                : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            }
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
            ${className}
          `}
          {...props}
        />
        
        {/* Validation Icons */}
        {(touched || hasError) && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {hasError ? (
              <HiExclamationCircle className="h-5 w-5 text-red-500" />
            ) : isValid ? (
              <HiCheckCircle className="h-5 w-5 text-green-500" />
            ) : null}
          </div>
        )}
      </div>
      
      {/* Error Message */}
      {hasError && (
        <div className="flex items-center space-x-1 text-red-600 text-sm animate-fadeIn">
          <HiExclamationCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

/**
 * Password Input with strength indicator
 */
export const PasswordInput = ({
  label = 'Password',
  name,
  value,
  onChange,
  onBlur,
  onFocus,
  error,
  touched,
  required = false,
  placeholder = 'Enter your password',
  showStrength = false,
  strength = 'none',
  requirements = [],
  className = '',
  disabled = false,
  ...props
}) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const hasError = touched && error;
  const isValid = touched && !error && value;

  const getStrengthColor = (strength) => {
    switch (strength) {
      case 'weak': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'strong': return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  };

  const getStrengthWidth = (strength) => {
    switch (strength) {
      case 'weak': return 'w-1/3';
      case 'medium': return 'w-2/3';
      case 'strong': return 'w-full';
      default: return 'w-0';
    }
  };

  const getStrengthText = (strength) => {
    switch (strength) {
      case 'weak': return 'Weak';
      case 'medium': return 'Medium';
      case 'strong': return 'Strong';
      default: return '';
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full px-4 py-3 pr-12 border rounded-lg transition-all duration-200
            ${hasError 
              ? 'border-red-500 focus:ring-2 focus:ring-red-200 focus:border-red-500' 
              : isValid
                ? 'border-green-500 focus:ring-2 focus:ring-green-200 focus:border-green-500'
                : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            }
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
            ${className}
          `}
          {...props}
        />
        
        {/* Password Toggle Button */}
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
          disabled={disabled}
        >
          {showPassword ? (
            <HiEyeOff className="h-5 w-5" />
          ) : (
            <HiEye className="h-5 w-5" />
          )}
        </button>
      </div>
      
      {/* Password Strength Indicator */}
      {showStrength && value && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Password strength:</span>
            <span className={`font-medium ${
              strength === 'weak' ? 'text-red-600' :
              strength === 'medium' ? 'text-yellow-600' :
              strength === 'strong' ? 'text-green-600' : 'text-gray-600'
            }`}>
              {getStrengthText(strength)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(strength)} ${getStrengthWidth(strength)}`}
            />
          </div>
          {/* Dynamic requirements checklist */}
          {Array.isArray(requirements) && requirements.length > 0 && (
            <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              {requirements.map((req) => (
                <li key={req.label} className={`flex items-center ${req.met ? 'text-green-600' : 'text-gray-600'}`}>
                  {req.met ? (
                    <HiCheckCircle className="h-4 w-4 mr-1" />
                  ) : (
                    <HiExclamationCircle className="h-4 w-4 mr-1 text-gray-400" />
                  )}
                  <span>{req.label}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      
      {/* Error Message */}
      {hasError && (
        <div className="flex items-center space-x-1 text-red-600 text-sm animate-fadeIn">
          <HiExclamationCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

/**
 * Select Input with validation
 */
export const ValidatedSelect = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  onFocus,
  error,
  touched,
  required = false,
  options = [],
  placeholder = 'Select an option',
  className = '',
  disabled = false,
  ...props
}) => {
  const hasError = error; // Show error immediately, not just when touched
  const isValid = touched && !error && value;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <select
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          disabled={disabled}
          className={`
            w-full px-4 py-3 border rounded-lg transition-all duration-200 appearance-none bg-white
            ${hasError 
              ? 'border-red-500 focus:ring-2 focus:ring-red-200 focus:border-red-500' 
              : isValid
                ? 'border-green-500 focus:ring-2 focus:ring-green-200 focus:border-green-500'
                : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            }
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
            ${className}
          `}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
        {/* Custom Arrow */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
        
        {/* Validation Icons */}
        {(touched || hasError) && (
          <div className="absolute inset-y-0 right-8 flex items-center pr-3">
            {hasError ? (
              <HiExclamationCircle className="h-5 w-5 text-red-500" />
            ) : isValid ? (
              <HiCheckCircle className="h-5 w-5 text-green-500" />
            ) : null}
          </div>
        )}
      </div>
      
      {/* Error Message */}
      {hasError && (
        <div className="flex items-center space-x-1 text-red-600 text-sm animate-fadeIn">
          <HiExclamationCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

/**
 * Phone Input with formatting
 */
export const PhoneInput = ({
  label = 'Phone Number',
  name,
  value,
  onChange,
  onBlur,
  onFocus,
  error,
  touched,
  required = false,
  placeholder = '+91 98765 43210',
  className = '',
  disabled = false,
  ...props
}) => {
  const formatPhoneNumber = (value) => {
    // Remove all non-digit characters
    const cleaned = value.replace(/\D/g, '');
    
    // Format as +91 XXXXX XXXXX
    if (cleaned.length <= 10) {
      return cleaned.replace(/(\d{5})(\d{0,5})/, '$1 $2').trim();
    } else if (cleaned.startsWith('91') && cleaned.length <= 12) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{0,5})/, '+$1 $2 $3').trim();
    } else {
      return cleaned.replace(/(\d{5})(\d{0,5})/, '$1 $2').trim();
    }
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    onChange({
      target: {
        name,
        value: formatted,
        type: 'text'
      }
    });
  };

  return (
    <ValidatedInput
      label={label}
      name={name}
      type="tel"
      value={value}
      onChange={handlePhoneChange}
      onBlur={onBlur}
      onFocus={onFocus}
      error={error}
      touched={touched}
      required={required}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
      maxLength={17}
      {...props}
    />
  );
};

/**
 * OTP Input with auto-focus
 */
export const OTPInput = ({
  label = 'Enter OTP',
  name,
  value,
  onChange,
  onBlur,
  onFocus,
  error,
  touched,
  required = false,
  placeholder = '000000',
  className = '',
  disabled = false,
  ...props
}) => {
  const handleOTPChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    onChange({
      target: {
        name,
        value,
        type: 'text'
      }
    });
  };

  return (
    <ValidatedInput
      label={label}
      name={name}
      type="text"
      value={value}
      onChange={handleOTPChange}
      onBlur={onBlur}
      onFocus={onFocus}
      error={error}
      touched={touched}
      required={required}
      placeholder={placeholder}
      className={`text-center text-2xl tracking-widest ${className}`}
      disabled={disabled}
      maxLength={6}
      autoComplete="one-time-code"
      {...props}
    />
  );
};