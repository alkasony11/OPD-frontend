import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useClerkAuth } from '../../hooks/useClerkAuth';

// Import new sidebar and components
import ReceptionistSidebar from '../../Components/Receptionist/Sidebar';
import AppointmentScheduler from '../../Components/Receptionist/AppointmentScheduler';
import PatientRegistration from '../../Components/Receptionist/PatientRegistration';
import QueueManagement from '../../Components/Receptionist/QueueManagement';
import PatientSearch from '../../Components/Receptionist/PatientSearch';
import BillingManagement from '../../Components/Receptionist/BillingManagement';

export default function ReceptionistDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
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

  // Function to render content based on current route
  const renderContent = () => {
    const path = location.pathname;

    switch (path) {
      case '/receptionist/dashboard':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AppointmentScheduler />
              <PatientRegistration />
            </div>
            <QueueManagement />
          </div>
        );
      case '/receptionist/appointments':
        return <AppointmentScheduler />;
      case '/receptionist/patients':
        return <PatientSearch />;
      case '/receptionist/queue':
        return <QueueManagement />;
      case '/receptionist/billing':
        return <BillingManagement />;
      case '/receptionist/reports':
        return (
          <div className="text-center py-12">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Coming Soon</h3>
              <p className="text-yellow-700">Reports feature is under development.</p>
            </div>
          </div>
        );
      case '/receptionist/settings':
        return (
          <div className="text-center py-12">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Coming Soon</h3>
              <p className="text-yellow-700">Settings feature is under development.</p>
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AppointmentScheduler />
              <PatientRegistration />
            </div>
            <QueueManagement />
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <ReceptionistSidebar />
      
      {/* Main Content */}
      <div className="flex-1 ml-64 overflow-hidden">
        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
