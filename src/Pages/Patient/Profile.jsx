import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../App';

export default function Profile() {
  const navigate = useNavigate();
  const { isLoggedIn } = useContext(AuthContext);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }

    // Redirect to the new Manage Account page
    navigate('/manage-account', { replace: true });
  }, [isLoggedIn, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
    </div>
  );
} 