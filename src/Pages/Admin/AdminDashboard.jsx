import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClerkAuth } from '../../hooks/useClerkAuth';

// Import new sidebar and components
import AdminSidebar from '../../Components/Admin/Sidebar';
import DashboardStats from '../../Components/Admin/DashboardStats';
import UserManagement from '../../Components/Admin/UserManagement';
import DoctorManagement from '../../Components/Admin/DoctorManagement';
import AppointmentManagement from '../../Components/Admin/AppointmentManagement';

export default function AdminDashboard() {
  const navigate = useNavigate();
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
      console.log('Admin dashboard - Admin email from env:', import.meta.env.VITE_ADMIN_EMAIL);

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



  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 ml-64 overflow-hidden">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Manage your hospital system efficiently</p>
          </div>

          {/* Stats Cards */}
          <DashboardStats />

          {/* Management Sections */}
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
              <p className="text-gray-600 text-sm mb-4">Add, edit, and manage doctor profiles and availability</p>
              <button
                onClick={() => navigate('/admin/doctors')}
                className="w-full bg-gray-800 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Manage Doctors
              </button>
            </div>

            {/* System Logs */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">System Logs</h3>
                <div className="text-gray-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 001 1h6a1 1 0 001-1V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-4">Monitor system activities, overrides, and cancellations</p>
              <button
                onClick={() => navigate('/admin/logs')}
                className="w-full bg-gray-800 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
              >
                View Logs
              </button>
            </div>
          </div>

          {/* Additional Management Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Smart Priority */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Smart Priority</h3>
                <div className="text-gray-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-4">Enable or disable smart priority features</p>
              <button
                onClick={() => navigate('/admin/priority')}
                className="w-full bg-gray-800 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Configure Priority
              </button>
            </div>

            {/* Department Management */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Department Management</h3>
                <div className="text-gray-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                    <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-4">Add doctors to departments and manage assignments</p>
              <button
                onClick={() => navigate('/admin/departments')}
                className="w-full bg-gray-800 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Manage Departments
              </button>
            </div>

            {/* Reports & Analytics */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Reports & Analytics</h3>
                <div className="text-gray-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-4">Generate reports and view system analytics</p>
              <button
                onClick={() => navigate('/admin/reports')}
                className="w-full bg-gray-800 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
              >
                View Reports
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

