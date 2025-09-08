import { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { useSignUp } from '@clerk/clerk-react';
import { AuthContext } from '../App';
import axios from 'axios';
import { HiArrowLeft } from 'react-icons/hi';
import { useRegistrationValidation } from '../hooks/useFormValidation';
import { ValidatedInput, PasswordInput, ValidatedSelect, PhoneInput, OTPInput } from '../Components/FormComponents';

export default function Register() {
  const navigate = useNavigate();
  const { signUp, isLoaded } = useSignUp();
  const { setIsLoggedIn } = useContext(AuthContext);
  const [step, setStep] = useState(1); // 1: form, 2: OTP verification
  
  // Use the validation hook
  const {
    values: formData,
    errors,
    touched,
    isValid,
    handleChange,
    handleBlur,
    handleFocus,
    validateAllFields,
    setFieldError,
    clearFieldError,
    validateForm,
    setFieldValue
  } = useRegistrationValidation();
  // Sanitize name: collapse multiple spaces on change; trim on blur
  const handleNameChange = (e) => {
    const sanitized = e.target.value.replace(/\s{2,}/g, ' ');
    setFieldValue('name', sanitized);
  };

  const handleNameBlur = (e) => {
    const trimmed = (e.target.value || '').trim();
    setFieldValue('name', trimmed);
    handleBlur({
      ...e,
      target: {
        ...e.target,
        value: trimmed
      }
    });
  };


  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState('');

  // Check if user is already logged in and redirect them
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        setIsLoggedIn(true);

        // Redirect based on user role
        switch (user.role) {
          case 'admin':
            navigate('/admin/dashboard', { replace: true });
            break;
          case 'doctor':
            navigate('/doctor/dashboard', { replace: true });
            break;
          case 'receptionist':
            navigate('/', { replace: true });
            break;
          default:
            navigate('/', { replace: true });
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, [navigate, setIsLoggedIn]);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setServerError('');
    setSuccess('');
    
    // Validate all fields before sending OTP
    const validation = validateAllFields();
    if (!validation.isValid) {
      return;
    }
    
    setLoading(true);

    try {
      await axios.post('http://localhost:5001/api/auth/send-otp', {
        email: formData.email

        
      });
      setSuccess('OTP sent to your email! Please check your inbox.');
      setStep(2);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to send OTP';
      
      // Handle specific field errors
      if (errorMessage.toLowerCase().includes('email') || errorMessage.toLowerCase().includes('exists')) {
        setFieldError('email', errorMessage);
      } else {
        setServerError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setServerError('');
    setOtpError('');
    
    // Validate OTP
    if (!otp) {
      setOtpError('OTP is required');
      return;
    }
    
    if (otp.length !== 6) {
      setOtpError('OTP must be 6 digits');
      return;
    }
    
    if (!/^\d{6}$/.test(otp)) {
      setOtpError('OTP must contain only numbers');
      return;
    }
    
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5001/api/auth/register', {
        ...formData,
        otp
      });

      // Auto-login after successful registration
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setIsLoggedIn(true);
        alert('Registration successful! Welcome!');
        navigate('/');
      } else {
        navigate('/login');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Registration failed';
      
      // Handle specific OTP errors
      if (errorMessage.toLowerCase().includes('otp')) {
        setOtpError(errorMessage);
      } else {
        setServerError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setServerError('');
    setOtpError('');
    
    try {
      await axios.post('http://localhost:5001/api/auth/send-otp', {
        email: formData.email
      });
      setSuccess('OTP resent successfully!');
    } catch (err) {
      setServerError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    if (!isLoaded) return;
    
    setGoogleLoading(true);
    setServerError('');
    
    try {
      await signUp.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: `${window.location.origin}/sso-callback`,
        redirectUrlComplete: '/',
        customOAuthParameters: {
          prompt: 'select_account'
        }
      });
    } catch (err) {
      setServerError('Google sign-up failed. Please try again.');
      setGoogleLoading(false);
    }
  };

  if (step === 1) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-12">
        <div className="w-full max-w-md">
          {/* Back Button */}
          <div className="mb-6">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              <HiArrowLeft className="h-5 w-5 mr-2" />
              Back
            </button>
          </div>

          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Create Account
          </h2>
          <div className="bg-white rounded-xl shadow-md p-8">
            {serverError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg animate-fadeIn">
                {serverError}
              </div>
            )}
            <form className="space-y-6" onSubmit={handleSendOTP}>
              <ValidatedInput
                label="Full Name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleNameChange}
                onBlur={handleNameBlur}
                onFocus={handleFocus}
                error={errors.name}
                touched={touched.name}
                required
                placeholder="Enter your full name"
                autoComplete="name"
              />

              <PhoneInput
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
                error={errors.phone}
                touched={touched.phone}
                required
              />

              <ValidatedInput
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
                error={errors.email}
                touched={touched.email}
                required
                placeholder="Enter your email"
                autoComplete="email"
              />

              <ValidatedInput
                label="Date of Birth"
                name="dob"
                type="date"
                value={formData.dob}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
                error={errors.dob}
                touched={touched.dob}
                required
              />

              <ValidatedSelect
                label="Gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
                error={errors.gender}
                touched={touched.gender}
                required
                options={[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                  { value: 'other', label: 'Other' }
                ]}
                placeholder="Select Gender"
              />

              <PasswordInput
                name="password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
                error={errors.password}
                touched={touched.password}
                required
                placeholder="Create a strong password"
                showStrength={true}
                strength={validateForm().passwordStrength}
                requirements={[
                  { label: '8+ characters', met: (formData.password || '').length >= 8 },
                  { label: 'Uppercase letter', met: /[A-Z]/.test(formData.password || '') },
                  { label: 'Lowercase letter', met: /[a-z]/.test(formData.password || '') },
                  { label: 'Number', met: /\d/.test(formData.password || '') },
                  { label: 'Special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password || '') },
                  { label: 'No spaces', met: !/\s/.test(formData.password || '') }
                ]}
                autoComplete="new-password"
              />

              {/* Confirm Password */}
              <PasswordInput
                label="Confirm Password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
                error={errors.confirmPassword}
                touched={touched.confirmPassword}
                required
                placeholder="Re-enter your password"
                showStrength={false}
                autoComplete="new-password"
              />

              {/* Terms and Conditions */}
              <div className="space-y-2">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="termsAccepted"
                      name="termsAccepted"
                      type="checkbox"
                      checked={formData.termsAccepted}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      onFocus={handleFocus}
                      className={`h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${
                        touched.termsAccepted && errors.termsAccepted ? 'border-red-500 focus:ring-red-200' : ''
                      }`}
                    />
                  </div>
                  <label htmlFor="termsAccepted" className="ml-3 text-sm text-gray-700">
                    I agree to the <a className="text-blue-600 hover:text-blue-700" href="#" target="_blank" rel="noreferrer">Terms</a> and <a className="text-blue-600 hover:text-blue-700" href="#" target="_blank" rel="noreferrer">Privacy Policy</a>
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                </div>
                {touched.termsAccepted && errors.termsAccepted && (
                  <div className="flex items-center space-x-1 text-red-600 text-sm animate-fadeIn">
                    <span>{errors.termsAccepted}</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !isValid}
                className={`w-full py-3 rounded-lg font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isValid && !loading
                    ? 'bg-black text-white hover:bg-gray-600'
                    : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                }`}
              >
                {loading ? 'Sending OTP...' : 'Create Account'}
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignUp}
                disabled={googleLoading || !isLoaded}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FcGoogle className="h-5 w-5 mr-3" />
                {googleLoading ? 'Signing up...' : 'Sign up with Google'}
              </button>
            </form>
          </div>
        </div>
        <p className="text-center text-gray-600 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  // OTP Verification Step
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-12">
      <div className="w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
          Verify Your Email
        </h2>
        <div className="bg-white rounded-xl shadow-md p-8">
          {serverError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg animate-fadeIn">
              {serverError}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg animate-fadeIn">
              {success}
            </div>
          )}
          
          <div className="text-center mb-6">
            <p className="text-gray-600 mb-2">
              We've sent a 6-digit OTP to:
            </p>
            <p className="font-semibold text-gray-900">{formData.email}</p>
            <p className="text-sm text-gray-500 mt-2">
              Please check your email and enter the OTP below
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Enter OTP <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setOtp(value);
                  if (otpError) setOtpError('');
                }}
                maxLength={6}
                className={`w-full px-4 py-3 border rounded-lg text-center text-2xl tracking-widest transition-all duration-200 ${
                  otpError 
                    ? 'border-red-500 focus:ring-2 focus:ring-red-200 focus:border-red-500' 
                    : otp.length === 6
                      ? 'border-green-500 focus:ring-2 focus:ring-green-200 focus:border-green-500'
                      : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                }`}
                placeholder="000000"
                autoComplete="one-time-code"
              />
              {otpError && (
                <div className="flex items-center space-x-1 text-red-600 text-sm animate-fadeIn">
                  <span>{otpError}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className={`w-full py-3 rounded-lg font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                otp.length === 6 && !loading
                  ? 'bg-black text-white hover:bg-gray-600'
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed'
              }`}
            >
              {loading ? 'Verifying...' : 'Complete Registration'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={loading}
                className="text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Resend OTP'}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-gray-600 hover:text-gray-700 font-medium"
              >
                ← Back to Registration
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 