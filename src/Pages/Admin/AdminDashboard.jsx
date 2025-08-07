import { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiUsers,
  HiCalendar,
  HiChartBar,
  HiCog,
  HiLogout,
  HiHome,
  HiUserGroup,
  HiClipboardList,
  HiTrendingUp,
  HiBell,
  HiUser,
  HiOfficeBuilding,
  HiDocumentText,
  HiLightningBolt,
  HiKey,
  HiShieldCheck
} from 'react-icons/hi';
import axios from 'axios';
import UserManagement from '../../Components/Admin/UserManagement';
import AppointmentManagement from '../../Components/Admin/AppointmentManagement';
import { useUser } from '@clerk/clerk-react';
import { useClerkAuth } from '../../hooks/useClerkAuth';
import { AuthContext } from '../../App';
import DoctorManagement from '../../Components/Admin/DoctorManagement';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef(null);
  const { isLoggedIn } = useContext(AuthContext);
  const { user: clerkUser } = useUser();
  useClerkAuth(); // Ensures Clerk user data is synced to localStorage
  // Get user data - prioritize localStorage (updated profile) over Clerk data
  const localUser = isLoggedIn ? JSON.parse(localStorage.getItem('user') || '{}') : null;
  const mergedUser = localUser && localUser.name ? localUser : (clerkUser ? {
    name: clerkUser.fullName || `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
    email: clerkUser.primaryEmailAddress?.emailAddress,
    profileImage: clerkUser.imageUrl
  } : null);

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

      setUser(parsedUser);
      console.log('Admin access granted');
    } catch (error) {
      console.error('Error parsing user data:', error);
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: HiTrendingUp },
    { id: 'patients', label: 'Patients', icon: HiUsers },
    { id: 'doctors', label: 'Doctors', icon: HiUser },
    { id: 'departments', label: 'Departments', icon: HiOfficeBuilding },
    { id: 'appointments', label: 'Appointments', icon: HiCalendar },
    { id: 'system-logs', label: 'System Logs', icon: HiDocumentText },
    { id: 'settings', label: 'Settings', icon: HiCog },
  ];

  const adminName = mergedUser?.name || 'Admin';
  const adminProfileImage = mergedUser?.profileImage || '';

  if (!mergedUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col border-r border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-black">MedAdmin</h1>
        </div>
        
        <nav className="mt-6">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-6 py-3 text-left transition-colors duration-200 ${
                  activeTab === item.id 
                    ? 'bg-black text-white' 
                    : 'text-black hover:bg-gray-100'
                }`}
              >
                <Icon className="h-5 w-5 mr-3" />
                {item.label}
              </button>
            );
          })}
        </nav>
        {/* Removed Admin Tools section */}
        {/* Logout Section */}
        <div className="mt-auto pt-6 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-6 py-3 text-left text-black hover:bg-gray-100 transition-colors duration-200"
          >
            <HiLogout className="h-5 w-5 mr-3" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm px-6 py-4">
          <div className="flex items-center justify-between">
            <div></div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-black hover:text-gray-600">
                <HiBell className="h-6 w-6" />
              </button>
              {/* Admin Profile Dropdown */}
              <div className="relative" ref={profileDropdownRef}>
                <button
                  onClick={() => setIsProfileDropdownOpen((prev) => !prev)}
                  className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-black transition-colors duration-200"
                >
                  {adminProfileImage ? (
                    <img
                      src={adminProfileImage}
                      alt={adminName}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                      <HiUser className="h-5 w-5 text-white" />
                    </div>
                  )}
                  <span className="hidden sm:block">{adminName}</span>
                </button>
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200 min-w-[180px] w-48">
                    <button
                      onClick={() => {
                        setActiveTab('manage-account');
                        setIsProfileDropdownOpen(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                    >
                      <HiCog className="mr-3 h-4 w-4" />
                      Manage Account
                    </button>
                    <button
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                    >
                      <HiLogout className="mr-3 h-4 w-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === 'dashboard' && <DashboardContent />}
          {activeTab === 'patients' && <UserManagement />}
          {activeTab === 'doctors' && <DoctorManagement />}
          {activeTab === 'departments' && <DepartmentsContent />}
          {activeTab === 'appointments' && <AppointmentManagement />}
          {activeTab === 'system-logs' && <SystemLogsContent />}
          {activeTab === 'settings' && <SettingsContent />}
          {activeTab === 'manage-account' && <ManageAccountContent />}
          {activeTab === 'admin-profile' && <AdminProfileContent />}
          {activeTab === 'security' && <SecurityContent />}
        </main>
      </div>
    </div>
  );
}

// Dashboard Content Component
function DashboardContent() {
  const [stats, setStats] = useState([
    { label: 'Total Patients', value: '2,847', icon: HiUsers, color: 'bg-blue-500' },
    { label: 'Active Doctors', value: '156', icon: HiUser, color: 'bg-green-500' },
    { label: 'Today\'s Appointments', value: '89', icon: HiCalendar, color: 'bg-purple-500' },
    { label: 'System Alerts', value: '12', icon: HiBell, color: 'bg-orange-500' },
  ]);

  const managementModules = [
    {
      title: 'Patient Management',
      description: 'View, search, and manage all registered patients.',
      icon: HiUsers,
      buttonText: 'View Patients',
      action: () => console.log('Navigate to Patient Management')
    },
    {
      title: 'Doctor Management',
      description: 'Add, edit, and manage doctor profiles and availability.',
      icon: HiUser,
      buttonText: 'Manage Doctors',
      action: () => console.log('Navigate to Doctor Management')
    },
    {
      title: 'System Logs',
      description: 'Monitor system activities, overrides, and cancellations.',
      icon: HiDocumentText,
      buttonText: 'View Logs',
      action: () => console.log('Navigate to System Logs')
    },
    {
      title: 'Smart Priority',
      description: 'Enable or disable smart priority features.',
      icon: HiLightningBolt,
      buttonText: 'Configure Priority',
      action: () => console.log('Navigate to Smart Priority')
    },
    {
      title: 'Department Management',
      description: 'Add doctors to departments and manage assignments.',
      icon: HiOfficeBuilding,
      buttonText: 'Manage Departments',
      action: () => console.log('Navigate to Department Management')
    },
    {
      title: 'Reports & Analytics',
      description: 'Generate reports and view system analytics.',
      icon: HiChartBar,
      buttonText: 'View Reports',
      action: () => console.log('Navigate to Reports & Analytics')
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="bg-black p-3 rounded-lg">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-black">{stat.label}</p>
                  <p className="text-2xl font-semibold text-black">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Management Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {managementModules.map((module, index) => {
          const Icon = module.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow p-6 border border-gray-200">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <Icon className="h-6 w-6 text-black" />
                </div>
                <h3 className="ml-3 text-lg font-semibold text-black">{module.title}</h3>
              </div>
              <p className="text-sm text-black mb-4">{module.description}</p>
              <button
                onClick={module.action}
                className="w-full bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors duration-200"
              >
                {module.buttonText}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Placeholder components for other tabs
function DepartmentsContent() {
  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-black mb-4">Department Management</h3>
      <p className="text-black">Department management functionality will be implemented here.</p>
    </div>
  );
}

function SystemLogsContent() {
  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-black mb-4">System Logs</h3>
      <p className="text-black">System logs and monitoring functionality will be implemented here.</p>
    </div>
  );
}

function SettingsContent() {
  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-black mb-4">System Settings</h3>
      <p className="text-black">System settings and configuration will be implemented here.</p>
    </div>
  );
}

function ManageAccountContent() {
  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-black mb-4">Manage Account</h3>
      <p className="text-black">Account management functionality will be implemented here.</p>
    </div>
  );
}

function AdminProfileContent() {
  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-black mb-4">Admin Profile</h3>
      <p className="text-black">Admin profile management functionality will be implemented here.</p>
    </div>
  );
}

function SecurityContent() {
  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-black mb-4">Security Settings</h3>
      <p className="text-black">Security and authentication settings will be implemented here.</p>
    </div>
  );
}


