import { useUser, useAuth } from '@clerk/clerk-react';
import { useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../App';
import { getCurrentUser, clearAuthData } from '../utils/auth';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

export const useClerkAuth = () => {
  const { user, isLoaded: userLoaded } = useUser();
  const { isSignedIn, signOut } = useAuth();
  const authContext = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // Safety check for context
  if (!authContext) {
    console.warn('AuthContext is not available');
    return {
      user,
      isSignedIn,
      userLoaded,
      handleSignOut: () => {}
    };
  }

  const { setIsLoggedIn } = authContext;

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
          const response = await axios.post(API_ENDPOINTS.AUTH.CLERK_SYNC, userData);

          // Store the backend token
          if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            setIsLoggedIn(true);
            console.log('User synced successfully');

            // Check if this is a new user or if profile is incomplete
            const { isNewUser, isProfileComplete, user: userData } = response.data;
            const userRole = userData.role;

            // Handle role-based redirection with delay to ensure state is updated
            setTimeout(() => {
              console.log('User role from backend:', userRole);
              console.log('Current location:', location.pathname);
              
              if (userRole === 'admin') {
                console.log('Admin user detected, redirecting to admin dashboard');
                navigate('/admin/dashboard');
              } else if (userRole === 'doctor') {
                console.log('Doctor user detected, redirecting to doctor dashboard');
                navigate('/doctor/dashboard');
              } else if ((isNewUser || !isProfileComplete) && location.pathname !== '/manage-account') {
                console.log('Redirecting new/incomplete user to manage-account page');
                navigate('/manage-account', {
                  state: {
                    message: isNewUser
                      ? 'Welcome! Please complete your profile to get started.'
                      : 'Please complete your profile information to continue.',
                    isProfileIncomplete: !isProfileComplete,
                    isNewUser: isNewUser
                  }
                });
              } else if (userRole === 'patient' && location.pathname !== '/') {
                // Redirect patient users to home page if they're not already there
                console.log('Patient user detected, redirecting to home page');
                navigate('/');
              } else {
                console.log('No specific redirection needed for role:', userRole);
              }
            }, 100); // Small delay to ensure state is properly updated
          }
        } catch (error) {
          console.error('Error syncing with backend:', error.response?.data || error.message);

          // Check if it's a network error or server error
          if (error.response?.status >= 500) {
            console.log('Server error during sync, allowing login with Clerk data only');
            setIsLoggedIn(true);
            
            // Fallback: Check if we have existing user data in localStorage
            const existingUser = localStorage.getItem('user');
            if (existingUser) {
              try {
                const userData = JSON.parse(existingUser);
                console.log('Using existing user data for fallback:', userData);
                
                // Redirect based on existing user role
                setTimeout(() => {
                  if (userData.role === 'admin') {
                    navigate('/admin/dashboard');
                  } else if (userData.role === 'doctor') {
                    navigate('/doctor/dashboard');
                  } else if (userData.role === 'patient') {
                    navigate('/');
                  }
                }, 100);
              } catch (parseError) {
                console.error('Error parsing existing user data:', parseError);
              }
            }
          } else if (error.response?.status === 401) {
            console.log('Authentication error during sync, signing out');
            try {
              await signOut();
            } catch (signOutError) {
              console.error('Error signing out:', signOutError);
            }
            setIsLoggedIn(false);
          } else {
            console.log('Other error during sync, allowing login');
            setIsLoggedIn(true);
            
            // Fallback: Check if we have existing user data in localStorage
            const existingUser = localStorage.getItem('user');
            if (existingUser) {
              try {
                const userData = JSON.parse(existingUser);
                console.log('Using existing user data for fallback:', userData);
                
                // Redirect based on existing user role
                setTimeout(() => {
                  if (userData.role === 'admin') {
                    navigate('/admin/dashboard');
                  } else if (userData.role === 'doctor') {
                    navigate('/doctor/dashboard');
                  } else if (userData.role === 'patient') {
                    navigate('/');
                  }
                }, 100);
              } catch (parseError) {
                console.error('Error parsing existing user data:', parseError);
              }
            }
          }
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