import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClerkAuth } from '../../hooks/useClerkAuth';

// Import new sidebar and components
import ReceptionistSidebar from '../../Components/Receptionist/Sidebar';
import AppointmentScheduler from '../../Components/Receptionist/AppointmentScheduler';
import PatientRegistration from '../../Components/Receptionist/PatientRegistration';

export default function ReceptionistDashboard() {
  const navigate = useNavigate();
  useClerkAuth(); // Ensures Clerk user data is synced to localStorage

  useEffect(() => {
    // Check if user is logged in and is receptionist
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!userData || !token) {
      console.log('No user data or token found, redirecting to login');
      navigate('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      console.log('Receptionist dashboard - User role:', parsedUser.role);

      if (parsedUser.role !== 'receptionist') {
        console.log('User is not receptionist, redirecting to home');
        navigate('/');
        return;
      }

      console.log('Receptionist access granted');
    } catch (error) {
      console.error('Error parsing user data:', error);
      navigate('/login');
    }
  }, [navigate]);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <ReceptionistSidebar />
      
      {/* Main Content */}
      <div className="flex-1 ml-64 overflow-hidden">
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AppointmentScheduler />
            <PatientRegistration />
          </div>
        </div>
      </div>
    </div>
  );
}
