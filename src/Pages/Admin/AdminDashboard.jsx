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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {/* Patient Management */}
              <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Quick Access</p>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Patient Management</h3>
                <p className="text-gray-600 text-sm mb-4">View, search, and manage all registered patients in the system</p>
                <button
                  onClick={() => navigate('/admin/patients')}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                >
                  View Patients
                </button>
              </div>

              {/* Doctor Management */}
              <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Quick Access</p>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Doctor Management</h3>
                <p className="text-gray-600 text-sm mb-4">Add, edit, and manage doctor profiles and schedules</p>
                <button
                  onClick={() => navigate('/admin/doctors')}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-4 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                >
                  Manage Doctors
                </button>
              </div>

              {/* User Management */}
              <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Quick Access</p>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">User Management</h3>
                <p className="text-gray-600 text-sm mb-4">Add doctors and receptionists, manage user accounts</p>
                <button
                  onClick={() => navigate('/admin/users')}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-4 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                >
                  Manage Users
                </button>
              </div>

              {/* Department Management */}
              <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-orange-100 rounded-xl">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Quick Access</p>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Department Management</h3>
                <p className="text-gray-600 text-sm mb-4">Create and manage hospital departments and specialties</p>
                <button
                  onClick={() => navigate('/admin/departments')}
                  className="w-full bg-gradient-to-r from-orange-600 to-orange-700 text-white py-3 px-4 rounded-xl hover:from-orange-700 hover:to-orange-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                >
                  Manage Departments
                </button>
              </div>

              {/* Appointment Management */}
              <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-indigo-100 rounded-xl">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Quick Access</p>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Appointment Management</h3>
                <p className="text-gray-600 text-sm mb-4">Schedule, manage, and track all patient appointments</p>
                <button
                  onClick={() => navigate('/admin/appointments')}
                  className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-3 px-4 rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                >
                  Manage Appointments
                </button>
              </div>

              {/* System Analytics */}
              <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-red-100 rounded-xl">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Analytics</p>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">System Analytics</h3>
                <p className="text-gray-600 text-sm mb-4">View comprehensive reports and system performance metrics</p>
                <button
                  onClick={() => navigate('/admin/doctor-load')}
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 px-4 rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                >
                  View Analytics
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
      <div className="flex-1 ml-16 lg:ml-64 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Professional Header */}
        <div className="bg-white shadow-xl border-b border-gray-200 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 opacity-50"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-6 sm:py-8 space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="h-12 w-12 sm:h-14 sm:w-14 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="h-6 w-6 sm:h-7 sm:w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">{getPageTitle()}</h1>
                  <p className="text-base sm:text-lg text-gray-600 mt-1">Welcome back, Administrator</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 sm:space-x-4 w-full sm:w-auto">
                <div className="text-right bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2 shadow-sm">
                  <p className="text-sm text-gray-500">Last updated</p>
                  <p className="text-sm font-medium text-gray-900">{new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
          {/* Dynamic Content */}
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

