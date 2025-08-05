import { useState, useEffect } from 'react';
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
  HiTrendingUp
} from 'react-icons/hi';
import axios from 'axios';
import UserManagement from '../components/Admin/UserManagement';
import AppointmentManagement from '../components/Admin/AppointmentManagement';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in and is admin
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'admin') {
      navigate('/');
      return;
    }

    setUser(parsedUser);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: HiHome },
    { id: 'users', label: 'User Management', icon: HiUsers },
    { id: 'appointments', label: 'Appointments', icon: HiCalendar },
    { id: 'analytics', label: 'Analytics', icon: HiChartBar },
    { id: 'settings', label: 'Settings', icon: HiCog },
  ];

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-gray-800">MediQ Admin</h1>
          <p className="text-sm text-gray-600 mt-1">Hospital Management</p>
        </div>
        
        <nav className="mt-6">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-6 py-3 text-left hover:bg-blue-50 transition-colors duration-200 ${
                  activeTab === item.id 
                    ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' 
                    : 'text-gray-700'
                }`}
              >
                <Icon className="h-5 w-5 mr-3" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-64 p-6 border-t">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-800">{user.name}</p>
              <p className="text-xs text-gray-600">Administrator</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
          >
            <HiLogout className="h-4 w-4 mr-2" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-800 capitalize">
              {activeTab === 'overview' ? 'Dashboard Overview' : activeTab.replace('-', ' ')}
            </h2>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && <OverviewContent />}
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'appointments' && <AppointmentManagement />}
          {activeTab === 'analytics' && <AnalyticsContent />}
          {activeTab === 'settings' && <SettingsContent />}
        </main>
      </div>
    </div>
  );
}

// Overview Content Component
function OverviewContent() {
  const [stats, setStats] = useState([
    { label: 'Total Users', value: '0', icon: HiUsers, color: 'bg-blue-500' },
    { label: 'Today\'s Appointments', value: '0', icon: HiCalendar, color: 'bg-green-500' },
    { label: 'Active Doctors', value: '0', icon: HiUserGroup, color: 'bg-purple-500' },
    { label: 'Pending Reviews', value: '0', icon: HiClipboardList, color: 'bg-orange-500' },
  ]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [statsResponse, activityResponse] = await Promise.all([
        axios.get('http://localhost:5001/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5001/api/admin/activity', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setStats([
        { label: 'Total Users', value: statsResponse.data.users.total.toString(), icon: HiUsers, color: 'bg-blue-500' },
        { label: 'Today\'s Appointments', value: statsResponse.data.appointments.todayAppointments.toString(), icon: HiCalendar, color: 'bg-green-500' },
        { label: 'Verified Users', value: statsResponse.data.users.verified.toString(), icon: HiUserGroup, color: 'bg-purple-500' },
        { label: 'Pending Appointments', value: statsResponse.data.appointments.pendingAppointments.toString(), icon: HiClipboardList, color: 'bg-orange-500' },
      ]);

      setActivities(activityResponse.data.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Keep default mock data if API fails
      setStats([
        { label: 'Total Users', value: '1,234', icon: HiUsers, color: 'bg-blue-500' },
        { label: 'Today\'s Appointments', value: '56', icon: HiCalendar, color: 'bg-green-500' },
        { label: 'Active Doctors', value: '23', icon: HiUserGroup, color: 'bg-purple-500' },
        { label: 'Pending Reviews', value: '12', icon: HiClipboardList, color: 'bg-orange-500' },
      ]);
      setActivities([
        { description: 'New user registered', user: 'John Doe', timestamp: new Date(Date.now() - 2 * 60 * 1000) },
        { description: 'Appointment scheduled', user: 'Jane Smith', timestamp: new Date(Date.now() - 15 * 60 * 1000) },
        { description: 'Doctor profile updated', user: 'Dr. Wilson', timestamp: new Date(Date.now() - 60 * 60 * 1000) },
        { description: 'System backup completed', user: 'System', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">Recent Activity</h3>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                    <p className="text-sm text-gray-600">by {activity.user}</p>
                  </div>
                  <span className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</span>
                </div>
              ))}
              {activities.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Placeholder components for other tabs

function AnalyticsContent() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Analytics Dashboard</h3>
      <p className="text-gray-600">Analytics and reporting functionality will be implemented here.</p>
    </div>
  );
}

function SettingsContent() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">System Settings</h3>
      <p className="text-gray-600">System settings and configuration will be implemented here.</p>
    </div>
  );
}
