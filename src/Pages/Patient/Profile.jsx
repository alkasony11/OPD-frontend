import { useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../App';

export default function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn } = useContext(AuthContext);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    // Redirect to manage-account for profile completion
    navigate('/manage-account', { 
      replace: true,
      state: {
        message: 'Please complete your profile information.',
        isProfileIncomplete: true
      }
    });
  }, [isLoggedIn, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
    </div>
  );
} 