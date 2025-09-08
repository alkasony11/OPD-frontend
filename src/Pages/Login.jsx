import { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { useSignIn, useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import { AuthContext } from '../App';
import { HiArrowLeft } from 'react-icons/hi';
import { useLoginValidation } from '../hooks/useFormValidation';
import { ValidatedInput, PasswordInput } from '../Components/FormComponents';

export default function Login() {
  const navigate = useNavigate();
  const { setIsLoggedIn, redirectPath, setRedirectPath } = useContext(AuthContext);
  const { signIn, isLoaded } = useSignIn();
  const { signOut } = useAuth();
  
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
    clearFieldError
  } = useLoginValidation();

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false); 
  const [serverError, setServerError] = useState('');
  const [showGoogleConfirm, setShowGoogleConfirm] = useState(false);

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
            navigate('/', { replace: true }); // No specific receptionist dashboard yet
            break;
          default:
            navigate('/', { replace: true });
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        // Clear invalid data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, [navigate, setIsLoggedIn]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear any previous server errors
    setServerError('');
    clearFieldError('email');
    clearFieldError('password');
    
    // Validate all fields before submission
    const validation = validateAllFields();
    if (!validation.isValid) {
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await axios.post('http://localhost:5001/api/auth/login', formData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setIsLoggedIn(true);

      // Use the redirectTo from backend response
      const redirectUrl = response.data.redirectTo || '/';
      
      // Show role-specific welcome message
      const roleMessages = {
        admin: 'Welcome Admin!',
        doctor: 'Welcome Doctor!',
        receptionist: 'Welcome!',
        patient: 'Login successful!'
      };
      
      alert(roleMessages[response.data.user.role] || 'Login successful!');
      navigate(redirectUrl);
      setRedirectPath('/');
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed';
      
      // Handle specific field errors
      if (errorMessage.toLowerCase().includes('email')) {
        setFieldError('email', errorMessage);
      } else if (errorMessage.toLowerCase().includes('password') || errorMessage.toLowerCase().includes('credentials')) {
        setFieldError('password', 'Invalid email or password');
      } else {
        setServerError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    proceedWithGoogleSignIn();
  };

  const proceedWithGoogleSignIn = async () => {
    if (!isLoaded) return;

    setGoogleLoading(true);
    setServerError('');

    try {
      // First, ensure any existing Clerk session is cleared
      try {
        await signOut();
      } catch (signOutError) {
        console.log('No existing session to clear');
      }

      // Add a small delay and then initiate Google sign-in
      setTimeout(async () => {
        try {
          // Use the authenticateWithRedirect method
          await signIn.authenticateWithRedirect({
            strategy: 'oauth_google',
            redirectUrl: `${window.location.origin}/sso-callback`,
            redirectUrlComplete: redirectPath || '/',
            customOAuthParameters: {
              prompt: 'select_account'
            }
          });
        } catch (authError) {
          console.error('Google authentication error:', authError);
          setServerError('Google sign-in failed. Please try again.');
          setGoogleLoading(false);
        }
      }, 500);

    } catch (err) {
      console.error('Google sign-in error:', err);
      setServerError('Google sign-in failed. Please try again.');
      setGoogleLoading(false);
    }
  };

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
          Sign In
        </h2>
        <div className="bg-white rounded-xl shadow-md p-8">
          {serverError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg animate-fadeIn">
              {serverError}
            </div>
          )}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <ValidatedInput
              label="Email"
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
            
            <PasswordInput
              label="Password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handleBlur}
              onFocus={handleFocus}
              error={errors.password}
              touched={touched.password}
              required
              placeholder="Enter your password"
              autoComplete="current-password"
            />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
              <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Forgot password?
              </Link>
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
              {loading ? 'Signing In...' : 'Sign In'}
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
              onClick={handleGoogleSignIn}
              disabled={loading || !isLoaded}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FcGoogle className="h-5 w-5 mr-3" />
                {googleLoading ? 'Redirecting to Google...' : 'Continue with Google'}
            </button>

            {googleLoading && (
              <div className="mt-3 text-center">
                <p className="text-sm text-gray-600">
                  You'll be redirected to Google to select your account
                </p>
              </div>
            )}
          </form>
          <p className="text-center text-gray-600 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
