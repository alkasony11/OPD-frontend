import { useState, useContext, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  HiHome,
  HiUsers,
  HiUserGroup,
  HiChartBar,
  HiCog,
  HiLogout,
  HiMenu,
  HiX,
  HiUser,
  HiClipboardList,
  HiShieldCheck,
  HiStar,
  HiOfficeBuilding,
  HiDocumentReport,
  HiCalendar
} from 'react-icons/hi';
import { useClerk } from '@clerk/clerk-react';
import { AuthContext } from '../../App';

export default function AdminSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { setIsLoggedIn } = useContext(AuthContext);
  const { signOut } = useClerk();

  useEffect(() => {
    // Get logged admin details from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setAdminUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  // Working functionalities (fully implemented)
  const workingFeatures = [
    { name: 'Dashboard', icon: HiHome, path: '/admin/dashboard', status: 'working' },
    { name: 'User Management', icon: HiUser, path: '/admin/users', status: 'working' },
    { name: 'Doctor Management', icon: HiUserGroup, path: '/admin/doctors', status: 'working' },
    { name: 'Doctor Schedules', icon: HiCalendar, path: '/admin/doctor-schedules', status: 'working' },
    { name: 'Department Management', icon: HiOfficeBuilding, path: '/admin/departments', status: 'working' },
    { name: 'Patient Management', icon: HiUsers, path: '/admin/patients', status: 'working' },
    { name: 'Leave Requests', icon: HiClipboardList, path: '/admin/leave-requests', status: 'working' },
  ];

  // Partially implemented or planned features
  const plannedFeatures = [
    { name: 'Appointment Management', icon: HiClipboardList, path: '/admin/appointments', status: 'planned' },
    { name: 'Reports & Analytics', icon: HiDocumentReport, path: '/admin/reports', status: 'planned' },
    { name: 'System Logs', icon: HiClipboardList, path: '/admin/logs', status: 'planned' },
    { name: 'Smart Priority', icon: HiStar, path: '/admin/priority', status: 'planned' },
  ];

  const menuItems = [...workingFeatures, ...plannedFeatures];

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Clerk logout error:', error);
    } finally {
      // Always clear localStorage and redirect
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.clear(); // Clear everything to ensure fresh start
      setIsLoggedIn(false);
      navigate('/login', { replace: true });
      // Force page reload to clear any cached data
      window.location.reload();
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className={`bg-gray-800 shadow-xl h-screen fixed left-0 top-0 z-50 transition-all duration-300 flex flex-col ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">MA</span>
            </div>
            <span className="text-lg font-semibold text-white">MedAdmin</span>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg hover:bg-gray-700 transition-colors text-gray-300 hover:text-white"
        >
          {isCollapsed ? <HiMenu className="h-5 w-5" /> : <HiX className="h-5 w-5" />}
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="mt-6 flex-1 overflow-y-auto">
        <ul className="space-y-2 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.name}>
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                    isActive(item.path)
                      ? 'bg-gray-700 text-white shadow-lg border-l-4 border-white'
                      : item.status === 'working'
                      ? 'text-white hover:bg-gray-700 hover:text-white hover:shadow-md'
                      : 'text-gray-400 hover:bg-gray-700 hover:text-gray-300 hover:shadow-md cursor-not-allowed'
                  }`}
                  title={isCollapsed ? (item.status === 'working' ? item.name : `${item.name} (Coming Soon)`) : ''}
                  onClick={item.status === 'planned' ? (e) => {
                    e.preventDefault();
                    alert(`${item.name} is coming soon!`);
                  } : undefined}
                >
                  <Icon className={`h-5 w-5 flex-shrink-0 ${
                    isActive(item.path) 
                      ? 'text-white' 
                      : item.status === 'working'
                      ? 'text-white group-hover:text-gray-200'
                      : 'text-gray-400 group-hover:text-gray-300'
                  }`} />
                  {!isCollapsed && (
                    <span className={`text-sm font-medium truncate ${
                      item.status === 'working' ? 'text-white' : 'text-gray-400'
                    }`}>{item.name}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-gray-700 flex-shrink-0">
        {!isCollapsed && (
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
              <HiUser className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {adminUser?.name || 'Admin'}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {adminUser?.email || 'System Administrator'}
              </p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={`flex items-center space-x-3 w-full px-4 py-3 text-white hover:bg-red-600 hover:text-white rounded-lg transition-all duration-200 ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title={isCollapsed ? 'Logout' : ''}
        >
          <HiLogout className="h-5 w-5 flex-shrink-0 text-white" />
          {!isCollapsed && <span className="text-sm font-medium text-white">Logout</span>}
        </button>
      </div>
    </div>
  );
}
