import { useUser, useAuth } from '@clerk/clerk-react';
import { useContext, useEffect } from 'react';
import { AuthContext } from '../App';
import axios from 'axios';

export const useClerkAuth = () => {
  const { user, isLoaded: userLoaded } = useUser();
  const { isSignedIn, signOut } = useAuth();
  const { setIsLoggedIn } = useContext(AuthContext);

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
          
          // Store the backend token
          if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            setIsLoggedIn(true);
            console.log('User synced successfully');
          }
        } catch (error) {
          console.error('Error syncing with backend:', error.response?.data || error.message);
          // Don't prevent login if backend sync fails
          setIsLoggedIn(true);
        }
      } else if (userLoaded && !isSignedIn) {
        // User is signed out, clear local storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsLoggedIn(false);
      }
    };

    // Add a small delay to ensure Clerk is fully loaded
    const timeoutId = setTimeout(syncClerkWithBackend, 100);
    return () => clearTimeout(timeoutId);
  }, [userLoaded, isSignedIn, user, setIsLoggedIn]);

  const handleSignOut = async () => {
    try {
      await signOut();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsLoggedIn(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return {
    user,
    isSignedIn,
    userLoaded,
    handleSignOut
  };
};