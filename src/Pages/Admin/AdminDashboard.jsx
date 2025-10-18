import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useClerkAuth } from '../../hooks/useClerkAuth';

// Import new sidebar and components
import AdminSidebar from '../../Components/Admin/Sidebar';
import DashboardStats from '../../Components/Admin/DashboardStats';
import DashboardCharts from '../../Components/Admin/DashboardCharts';
import UserManagement from '../../Components/Admin/UserManagement';
import DoctorManagement from '../../Components/Admin/DoctorManagement';
import AppointmentManagement from '../../Components/Admin/AppointmentManagement';
import DepartmentManagement from '../../Components/Admin/DepartmentManagement';
import PatientManagement from '../../Components/Admin/PatientManagement';
import RegisteredPatients from '../../Components/Admin/RegisteredPatients';
import DoctorScheduleManagement from '../../Components/Admin/DoctorScheduleManagement';
import LeaveRequests from '../../Components/Admin/LeaveRequests';
import DoctorLoadAnalytics from '../../Components/Admin/DoctorLoadAnalytics';
import RealTimeAlerts from '../../Components/Admin/RealTimeAlerts';
import FeedbackManagement from '../../Components/Admin/FeedbackManagement';
import FamilyMemberManagement from '../../Components/Admin/FamilyMemberManagement';
import PaymentManagement from '../../Components/Admin/PaymentManagement';
import CommunicationManagement from '../../Components/Admin/CommunicationManagement';
import ScheduleRequests from '../../Components/Admin/ScheduleRequests';
import PatientProfile from './PatientProfile';
// New Patient Category views
import PatientCategoryRegistered from '../../Components/Admin/PatientCategory/RegisteredPatientsDashboard';
import PatientCategoryManagement from '../../Components/Admin/PatientCategory/PatientManagementView';
import PatientCategoryFamily from '../../Components/Admin/PatientCategory/FamilyAccountManagement';
import PatientCategoryHistory from '../../Components/Admin/PatientCategory/PatientHistoryRecords';
import PatientCategoryNotifications from '../../Components/Admin/PatientCategory/CommunicationNotifications';
import PatientCategoryPayments from '../../Components/Admin/PatientCategory/PaymentRefunds';
import PatientCategoryBlocking from '../../Components/Admin/PatientCategory/PatientBlocking';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  useClerkAuth(); // Ensures Clerk user data is synced to localStorage

  useEffect(() => {
    // Check if user is logged in and is admin
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!userData || !token) {
      console.log('No user data or token found, redirecting to login');
      navigate('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      console.log('Admin dashboard - User role:', parsedUser.role);
      console.log('Admin dashboard - User email:', parsedUser.email);

      // Check both role field and admin email
      const isAdmin = parsedUser.role === 'admin' || parsedUser.email === import.meta.env.VITE_ADMIN_EMAIL;

      if (!isAdmin) {
        console.log('User is not admin, redirecting to home');
        alert('Access denied. Admin privileges required.');
        navigate('/');
        return;
      }

      console.log('Admin access granted');
    } catch (error) {
      console.error('Error parsing user data:', error);
      navigate('/login');
    }
  }, [navigate]);



  // Function to render content based on current route
  const renderContent = () => {
    const path = location.pathname;

    switch (path) {
      case '/admin/dashboard':
        return (
          <>
            <DashboardStats />
            <DashboardCharts />
            <div className="mt-8">
              <RealTimeAlerts />
            </div>
            {/* Dashboard Overview Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
              {/* Patient Management */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Patient Management</h3>
                  <div className="text-gray-400">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-4">View, search, and manage all registered patients</p>
                <button
                  onClick={() => navigate('/admin/patients')}
                  className="w-full bg-gray-800 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  View Patients
                </button>
              </div>

              {/* Doctor Management */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Doctor Management</h3>
                  <div className="text-gray-400">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                    </svg>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-4">Add, edit, and manage doctor profiles</p>
                <button
                  onClick={() => navigate('/admin/doctors')}
                  className="w-full bg-gray-800 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Manage Doctors
                </button>
              </div>

              {/* User Management */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
                  <div className="text-gray-400">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                    </svg>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-4">Add doctors and receptionists, manage user accounts</p>
                <button
                  onClick={() => navigate('/admin/users')}
                  className="w-full bg-gray-800 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Manage Users
                </button>
              </div>

              {/* Department Management */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Department Management</h3>
                  <div className="text-gray-400">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                    </svg>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-4">Create and manage hospital departments</p>
                <button
                  onClick={() => navigate('/admin/departments')}
                  className="w-full bg-gray-800 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Manage Departments
                </button>
              </div>
            </div>
          </>
        );
      case '/admin/users':
        return <UserManagement />;
      case '/admin/doctors':
        return <DoctorManagement />;
      case '/admin/doctor-schedules':
        return <DoctorScheduleManagement />;
      case '/admin/schedule-requests':
        return <ScheduleRequests />;
      case '/admin/patients':
        return <PatientManagement />;
      case '/admin/family-members':
        return <FamilyMemberManagement />;
      case '/admin/payments':
        return <PaymentManagement />;
      case '/admin/messages':
        return <CommunicationManagement />;
      case '/admin/registered-patients':
        return (
          <div className="bg-white rounded-lg shadow-sm p-4">
            <RegisteredPatients />
          </div>
        );
      case '/admin/patient-category/registered':
        return <PatientCategoryRegistered />;
      case '/admin/patient-category/management':
        return <PatientCategoryManagement />;
      case '/admin/patient-category/family':
        return <PatientCategoryFamily />;
      case '/admin/patient-category/history':
        return <PatientCategoryHistory />;
      case '/admin/patient-category/notifications':
        return <PatientCategoryNotifications />;
      case '/admin/patient-category/payments':
        return <PatientCategoryPayments />;
      case '/admin/patient-category/blocking':
        return <PatientCategoryBlocking />;
      case '/admin/departments':
        return <DepartmentManagement />;
      case '/admin/leave-requests':
        return <LeaveRequests />;
      case '/admin/feedback':
        return <FeedbackManagement />;
      case '/admin/appointments':
        return <AppointmentManagement />;
      case '/admin/reports':
        return (
          <div className="text-center py-12">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Coming Soon</h3>
              <p className="text-yellow-700">Reports & Analytics feature is under development.</p>
            </div>
          </div>
        );
      case '/admin/logs':
        return (
          <div className="text-center py-12">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Coming Soon</h3>
              <p className="text-yellow-700">System Logs feature is under development.</p>
            </div>
          </div>
        );
      case '/admin/doctor-load':
        return <DoctorLoadAnalytics />;
      case '/admin/priority':
        return (
          <div className="text-center py-12">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Coming Soon</h3>
              <p className="text-yellow-700">Smart Priority feature is under development.</p>
            </div>
          </div>
        );
      default:
        // Handle dynamic patient profile routes
        if (path.startsWith('/admin/patient/')) {
          return <PatientProfile />;
        }
        return (
          <>
            <DashboardStats />
            <div className="text-center py-8">
              <p className="text-gray-600">Select a menu item from the sidebar</p>
            </div>
          </>
        );
    }
  };

  // Get page title based on route
  const getPageTitle = () => {
    const path = location.pathname;
    switch (path) {
      case '/admin/dashboard': return 'Admin Dashboard';
      case '/admin/users': return 'User Management';
      case '/admin/doctors': return 'Doctor Management';
      case '/admin/doctor-schedules': return 'Doctor Schedule Management';
      case '/admin/schedule-requests': return 'Schedule Requests';
      case '/admin/patients': return 'Patient Management';
      case '/admin/family-members': return 'Family Member Management';
      case '/admin/payments': return 'Payment Management';
      case '/admin/messages': return 'Communication Management';
      case '/admin/departments': return 'Department Management';
      case '/admin/leave-requests': return 'Leave Requests';
      case '/admin/feedback': return 'Patient Feedback & Complaints';
      case '/admin/appointments': return 'Appointment Management';
      case '/admin/doctor-load': return 'Doctor Load Analytics';
      case '/admin/reports': return 'Reports & Analytics (Coming Soon)';
      case '/admin/logs': return 'System Logs (Coming Soon)';
      case '/admin/priority': return 'Smart Priority (Coming Soon)';
      case '/admin/patient-category/registered': return 'Registered Patients';
      case '/admin/patient-category/management': return 'Patient Management';
      case '/admin/patient-category/family': return 'Family Account Management';
      case '/admin/patient-category/history': return 'Patient History & Records';
      case '/admin/patient-category/notifications': return 'Communication & Notifications';
      case '/admin/patient-category/payments': return 'Payment & Refunds';
      case '/admin/patient-category/blocking': return 'Patient Blocking / Restrictions';
      default: return 'Admin Dashboard';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 ml-64 overflow-y-auto">
        <div className="p-6 space-y-6 pb-20">
          {/* Header */}
         

          {/* Dynamic Content */}
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

