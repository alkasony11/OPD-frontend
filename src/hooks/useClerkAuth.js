import { useUser, useAuth } from '@clerk/clerk-react';
import { useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../App';
import { getCurrentUser, clearAuthData } from '../utils/auth';
import axios from 'axios';

export const useClerkAuth = () => {
  const { user, isLoaded: userLoaded } = useUser();
  const { isSignedIn, signOut } = useAuth();
  const { setIsLoggedIn } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const syncClerkWithBackend = async () => {
      if (userLoaded && isSignedIn && user) {
        try {
          // Sync user data with your backend
          const userData = {
            clerkId: user.id,
            email: user.primaryEmailAddress?.emailAddress,
            name: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            phone: user.primaryPhoneNumber?.phoneNumber || '',
            profileImage: user.imageUrl
          };

          console.log('Syncing user with backend:', userData);

          // Send user data to your backend
          const response = await axios.post('http://localhost:5001/api/auth/clerk-sync', userData);

          console.log('Backend sync response:', response.data);

          // Store the backend token
          if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            setIsLoggedIn(true);
            console.log('User synced successfully');

            // Check if user is admin and redirect accordingly
            const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
            const isAdminByRole = response.data.user.role === 'admin';
            const isAdminByEmail = response.data.user.email === adminEmail;

            console.log('Admin detection - User email:', response.data.user.email);
            console.log('Admin detection - Admin email from env:', adminEmail);
            console.log('Admin detection - Is admin by role:', isAdminByRole);
            console.log('Admin detection - Is admin by email:', isAdminByEmail);

            if (isAdminByRole || isAdminByEmail) {
              console.log('Admin user detected via Google Sign-In, redirecting to admin dashboard');
              navigate('/admin/dashboard');
              return; // Exit early for admin users
            }

            // Check if this is a new user or if profile is incomplete
            const { isNewUser, isProfileComplete } = response.data;

            // Only redirect if we're not already on the profile page and user needs to complete profile
            if ((isNewUser || !isProfileComplete) && location.pathname !== '/profile') {
              console.log('Redirecting new/incomplete user to profile page');
              navigate('/profile', {
                state: {
                  message: isNewUser
                    ? 'Welcome! Please complete your profile to get started.'
                    : 'Please complete your profile information.'
                }
              });
            }
          }
        } catch (error) {
          console.error('Error syncing with backend:', error.response?.data || error.message);
          // Don't prevent login if backend sync fails
          setIsLoggedIn(true);
        }
      } else if (userLoaded && !isSignedIn) {
        // Only clear localStorage if the user was previously authenticated with Clerk
        const currentUser = getCurrentUser();
        if (currentUser && currentUser.clerkId) {
          console.log('Clerk user signed out, clearing localStorage');
          clearAuthData();
          setIsLoggedIn(false);
        }
        // If it's a regular login user (no clerkId), don't clear their session
      }
    };

    // Add a small delay to ensure Clerk is fully loaded
    const timeoutId = setTimeout(syncClerkWithBackend, 100);
    return () => clearTimeout(timeoutId);
  }, [userLoaded, isSignedIn, user, setIsLoggedIn]); // Removed location and navigate from dependencies

  const handleSignOut = async () => {
    try {
      await signOut();
      clearAuthData();
      setIsLoggedIn(false);
    } catch (error) {
      console.error('Error signing out:', error);
      // Force logout even if Clerk signout fails
      clearAuthData();
      setIsLoggedIn(false);
    }
  };

  return {
    user,
    isSignedIn,
    userLoaded,
    handleSignOut
  };
};