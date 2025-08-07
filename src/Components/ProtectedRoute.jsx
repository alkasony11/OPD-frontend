import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Component to protect routes that require authentication
export function ProtectedRoute({ children, requiredRole = null }) {
  const navigate = useNavigate();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');

      if (!token || !userData) {
        // Not logged in, redirect to login
        navigate('/login', { replace: true });
        return;
      }

      try {
        const user = JSON.parse(userData);
        
        // Check if specific role is required
        if (requiredRole && user.role !== requiredRole) {
          // User doesn't have required role, redirect to appropriate dashboard
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
          return;
        }

        // User is authorized
        setIsAuthorized(true);
      } catch (error) {
        console.error('Error parsing user data:', error);
        // Clear invalid data and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login', { replace: true });
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate, requiredRole]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Render children if authorized
  return isAuthorized ? children : null;
}

// Component to prevent logged-in users from accessing auth pages (login, register)
export function GuestRoute({ children }) {
  const navigate = useNavigate();
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');

      if (token && userData) {
        try {
          const user = JSON.parse(userData);
          
          // User is logged in, redirect to appropriate dashboard
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
          return;
        } catch (error) {
          console.error('Error parsing user data:', error);
          // Clear invalid data
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }

      // User is not logged in (guest)
      setIsGuest(true);
      setIsLoading(false);
    };

    checkAuth();
  }, [navigate]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Render children if user is guest (not logged in)
  return isGuest ? children : null;
}
