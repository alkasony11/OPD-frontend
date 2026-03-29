import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClerk, useUser } from '@clerk/clerk-react';

export default function SSOCallback() {
  const navigate = useNavigate();
  const { handleRedirectCallback } = useClerk();
  const { user } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        await handleRedirectCallback();

        // Check if the user is admin
        const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
        const userEmail = user?.primaryEmailAddress?.emailAddress;
        console.log('SSO Callback - User email:', userEmail);
        console.log('SSO Callback - Admin email:', adminEmail);

        if (userEmail === adminEmail) {
          console.log('SSO Callback - Admin user detected');
          setIsAdmin(true);
        }

        // Redirect will be handled by the useClerkAuth hook
        // Small delay to allow the auth hook to process admin detection
        setTimeout(() => {
          navigate('/');
        }, 1000);
      } catch (error) {
        console.error('SSO callback error:', error);
        navigate('/login?error=sso_failed');
      }
    };

    handleCallback();
  }, [handleRedirectCallback, navigate, user]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-12">
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-xl shadow-md p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {isAdmin ? 'Welcome Admin!' : 'Completing Sign In'}
          </h2>
          <p className="text-gray-600">
            {isAdmin
              ? 'Redirecting to admin dashboard...'
              : 'Please wait while we complete your authentication...'
            }
          </p>
          {isAdmin && (
            <div className="mt-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded-lg">
              <p className="text-sm font-medium">Admin access detected</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}