import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { HiArrowLeft, HiEye, HiEyeOff } from 'react-icons/hi';
import { API_ENDPOINTS } from '../config/api';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [verifyingToken, setVerifyingToken] = useState(true);
  const [userEmail, setUserEmail] = useState('');

  // Verify token on component mount
  useEffect(() => {
    const verifyToken = async () => {
      console.log('Reset password page - Token from URL:', token);

      if (!token) {
        console.log('No token found in URL');
        setError('Invalid reset link. Please request a new password reset.');
        setVerifyingToken(false);
        return;
      }

      try {
        console.log('Verifying token with backend...');
        const response = await axios.get(`${API_ENDPOINTS.AUTH.VERIFY_RESET_TOKEN}/${token}`);
        console.log('Token verification successful:', response.data);
        setTokenValid(true);
        setUserEmail(response.data.email);
      } catch (err) {
        console.error('Token verification failed:', err.response?.data || err.message);
        setError(err.response?.data?.message || 'Invalid or expired reset link');
      } finally {
        setVerifyingToken(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async e => {
    e.preventDefault();
    setMsg(''); setError('');

    // Validate passwords
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Check password strength
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      setError('Password must contain uppercase, lowercase, and numbers');
      return;
    }

    if (!hasSpecialChar) {
      setError('Password must contain at least one special character');
      return;
    }

    setLoading(true);

    try {
      await axios.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
        token,
        password
      });
      setMsg('Password reset successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error resetting password');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while verifying token
  if (verifyingToken) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-12">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-xl shadow-md p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Verifying Reset Link
            </h2>
            <p className="text-gray-600">
              Please wait while we verify your password reset link...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show error if token is invalid
  if (!tokenValid) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-12">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <button
              onClick={() => navigate('/forgot-password')}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              <HiArrowLeft className="h-5 w-5 mr-2" />
              Request New Reset Link
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Invalid Reset Link</h2>
            <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
            <p className="text-gray-600 mb-6">
              This password reset link is either invalid or has expired. Please request a new one.
            </p>
            <button
              onClick={() => navigate('/forgot-password')}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200"
            >
              Request New Reset Link
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-12">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/login')}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200"
          >
            <HiArrowLeft className="h-5 w-5 mr-2" />
            Back to Login
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md p-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">
            Set New Password
          </h2>
          <p className="text-center text-gray-600 mb-8">
            Enter a new password for {userEmail}
          </p>

          {msg && (
            <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              {msg}
            </div>
          )}
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Must be at least 8 characters with uppercase, lowercase, numbers, and special characters
              </p>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <HiEyeOff className="h-5 w-5" />
                  ) : (
                    <HiEye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <HiEyeOff className="h-5 w-5" />
                  ) : (
                    <HiEye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}