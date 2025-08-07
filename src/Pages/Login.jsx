import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { useSignIn, useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import { AuthContext } from '../App';
import { HiArrowLeft } from 'react-icons/hi';

export default function Login() {
  const navigate = useNavigate();
  const { setIsLoggedIn, redirectPath, setRedirectPath } = useContext(AuthContext);
  const { signIn, isLoaded } = useSignIn();
  const { signOut } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const [googleLoading, setGoogleLoading] = useState(false); 
  const [error, setError] = useState('');
  const [showGoogleConfirm, setShowGoogleConfirm] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post('http://localhost:5001/api/auth/login', formData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setIsLoggedIn(true);

      // Check user role and redirect accordingly
      if (response.data.user.role === 'admin') {
        alert('Welcome Admin!');
        navigate('/admin/dashboard');
      } else if (response.data.user.role === 'doctor') {
        alert('Welcome Doctor!');
        navigate('/doctor/dashboard');
      } else {
        alert('Login successful!');
        navigate(redirectPath || '/');
      }
      setRedirectPath('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
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
    setError('');

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
          setError('Google sign-in failed. Please try again.');
          setGoogleLoading(false);
        }
      }, 500);

    } catch (err) {
      console.error('Google sign-in error:', err);
      setError('Google sign-in failed. Please try again.');
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
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
              />
            </div>
            
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
              disabled={loading}
              className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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