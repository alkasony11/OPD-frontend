import { useState, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  HiHome, 
  HiCalendar, 
  HiUsers, 
  HiClipboardList, 
  HiCog, 
  HiLogout,
  HiMenu,
  HiX,
  HiUser,
  HiClock,
  HiChartBar,
  HiDocumentText
} from 'react-icons/hi';
import { useClerk } from '@clerk/clerk-react';
import { AuthContext } from '../../App';

export default function DoctorSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { setIsLoggedIn } = useContext(AuthContext);
  const { signOut } = useClerk();

  const menuItems = [
    { name: 'Dashboard', icon: HiHome, path: '/doctor/dashboard' },
    { name: 'Appointments', icon: HiCalendar, path: '/doctor/appointments' },
    { name: 'Patients', icon: HiUsers, path: '/doctor/patients' },
    { name: 'Schedule', icon: HiClock, path: '/doctor/schedule' },
    { name: 'Medical Records', icon: HiDocumentText, path: '/doctor/records' },
    { name: 'Reports', icon: HiChartBar, path: '/doctor/reports' },
    { name: 'Profile Settings', icon: HiCog, path: '/doctor/settings' },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsLoggedIn(false);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if Clerk fails
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setIsLoggedIn(false);
      navigate('/login');
    }
  };

  const isActive = (path) => location.pathname === path;

  // Get user data from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div className={`bg-blue-900 text-white h-screen fixed left-0 top-0 z-50 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-blue-700">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <HiUser className="h-8 w-8 text-blue-300" />
            <span className="text-xl font-bold">Doctor Portal</span>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {isCollapsed ? <HiMenu className="h-5 w-5" /> : <HiX className="h-5 w-5" />}
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="mt-6">
        <ul className="space-y-2 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.name}>
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? 'bg-blue-600 text-white'
                      : 'text-blue-200 hover:bg-blue-700 hover:text-white'
                  }`}
                  title={isCollapsed ? item.name : ''}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && <span>{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile & Logout */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-blue-700">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <HiUser className="h-5 w-5" />
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name || 'Doctor'}</p>
              <p className="text-xs text-blue-300 truncate">Medical Professional</p>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className={`flex items-center space-x-3 w-full px-3 py-2 text-blue-200 hover:bg-red-600 hover:text-white rounded-lg transition-colors ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title={isCollapsed ? 'Logout' : ''}
        >
          <HiLogout className="h-5 w-5 flex-shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}
