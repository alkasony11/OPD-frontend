import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useClerkAuth } from '../../hooks/useClerkAuth';

// Import new sidebar and components
import DoctorSidebar from '../../Components/Doctor/Sidebar';
import AppointmentList from '../../Components/Doctor/AppointmentList';
import PatientList from '../../Components/Doctor/PatientList';
import ScheduleManagement from '../../Components/Doctor/ScheduleManagement';
import AdvancedSearch from '../../Components/Doctor/AdvancedSearch';
export default function DoctorDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  useClerkAuth(); // Ensures Clerk user data is synced to localStorage

  useEffect(() => {
    // Check if user is logged in and is doctor
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!userData || !token) {
      console.log('No user data or token found, redirecting to login');
      navigate('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      console.log('Doctor dashboard - User role:', parsedUser.role);

      if (parsedUser.role !== 'doctor') {
        console.log('User is not doctor, redirecting to home');
        navigate('/');
        return;
      }

      console.log('Doctor access granted');
    } catch (error) {
      console.error('Error parsing user data:', error);
      navigate('/login');
    }
  }, [navigate]);



  // Function to render content based on current route
  const renderContent = () => {
    const path = location.pathname;

    switch (path) {
      case '/doctor/dashboard':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AppointmentList />
            <PatientList />
          </div>
        );
      case '/doctor/appointments':
        return (
          <div className="space-y-6">
            <AdvancedSearch />
            <AppointmentList />
          </div>
        );
      case '/doctor/patients':
        return (
          <div className="w-full">
            <PatientList />
          </div>
        );
      case '/doctor/schedule':
        return (
          <div className="w-full">
            <ScheduleManagement />
          </div>
        );
      case '/doctor/records':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Medical Records</h2>
            <p className="text-gray-600">Medical records feature coming soon...</p>
          </div>
        );
      case '/doctor/reports':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Reports</h2>
            <p className="text-gray-600">Reports feature coming soon...</p>
          </div>
        );
      case '/doctor/settings':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Profile Settings</h2>
            <p className="text-gray-600">Settings feature coming soon...</p>
          </div>
        );
      default:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AppointmentList />
            <PatientList />
          </div>
        );
    }
  };

  // Get page title based on route
  const getPageTitle = () => {
    const path = location.pathname;
    switch (path) {
      case '/doctor/dashboard': return 'Doctor Dashboard';
      case '/doctor/appointments': return 'Appointments';
      case '/doctor/patients': return 'Patients';
      case '/doctor/schedule': return 'Schedule';
      case '/doctor/records': return 'Medical Records';
      case '/doctor/reports': return 'Reports';
      case '/doctor/settings': return 'Settings';
      default: return 'Doctor Dashboard';
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <DoctorSidebar />

      {/* Main Content */}
      <div className="flex-1 ml-64 overflow-hidden">
        <div className="p-6 space-y-6">
          {/* Header with Test Data Button */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h1>
              <p className="text-gray-600">Manage your appointments and patients</p>
            </div>

          </div>

          {/* Dynamic Content */}
          {renderContent()}
        </div>
      </div>
    </div>
  );
}