import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClerk } from '@clerk/clerk-react';

export default function SSOCallback() {
  const navigate = useNavigate();
  const { handleRedirectCallback } = useClerk();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        await handleRedirectCallback();
        // Redirect will be handled by the useClerkAuth hook
        navigate('/');
      } catch (error) {
        console.error('SSO callback error:', error);
        navigate('/login?error=sso_failed');
      }
    };

    handleCallback();
  }, [handleRedirectCallback, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-12">
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-xl shadow-md p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Completing Sign In
          </h2>
          <p className="text-gray-600">
            Please wait while we complete your authentication...
          </p>
        </div>
      </div>
    </div>
  );
}