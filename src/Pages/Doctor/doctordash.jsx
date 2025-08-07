import { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { AuthContext } from '../../App';
import {
  UserIcon,
  UsersIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  BellIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  HomeIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  UserCircleIcon,
  PencilIcon,
  ArrowPathIcon,
  EyeIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  AcademicCapIcon,
  StarIcon,
  ClockIcon as TimeIcon,
  CalendarIcon,
  DocumentTextIcon,
  HeartIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const { isSignedIn, user, isLoaded } = useUser();
  const { isLoggedIn } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const profileDropdownRef = useRef(null);

  // Get user data - prioritize localStorage over Clerk data
  const localUser = isLoggedIn ? JSON.parse(localStorage.getItem('user') || '{}') : null;
  const mergedUser = localUser && localUser.name ? localUser : (user ? {
    name: user.fullName || user.firstName || 'Doctor',
    email: user.primaryEmailAddress?.emailAddress || '',
    profileImage: user.imageUrl || ''
  } : null);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Show loading if authentication is still being determined
  if (!isLoaded && !isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isSignedIn && !isLoggedIn) {
    navigate('/login');
    return null;
  }

  if (!mergedUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Check if user has doctor role
  const userData = localStorage.getItem('user');
  if (userData) {
    try {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 'doctor') {
        console.log('User is not a doctor, redirecting to home');
        alert('Access denied. Doctor privileges required.');
        navigate('/');
        return null;
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      navigate('/login');
      return null;
    }
  }

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: HomeIcon },
    { id: 'patient-queue', label: 'Patient Queue', icon: UsersIcon },
    { id: 'appointments', label: 'Appointments', icon: CalendarDaysIcon },
    { id: 'consultations', label: 'Consultations', icon: ClipboardDocumentListIcon },
    { id: 'schedule', label: 'Schedule', icon: CalendarIcon },
    { id: 'working-hours', label: 'Working Hours', icon: TimeIcon },
    { id: 'leave-management', label: 'Leave Management', icon: DocumentTextIcon },
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'settings', label: 'Settings', icon: Cog6ToothIcon },
  ];

  const doctorName = mergedUser?.name || 'Dr. Johnson';
  const doctorProfileImage = mergedUser?.profileImage || '';

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col border-r border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center">
            <HeartIcon className="h-8 w-8 text-blue-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-900">Med Doctor</h1>
          </div>
        </div>

        <div className="p-4 border-b border-gray-200">
          <p className="text-sm text-gray-600 mb-1">MAIN MENU</p>
        </div>

        <nav className="flex-1 px-4">
          {sidebarItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-4 py-3 text-left transition-colors duration-200 rounded-lg mb-1 ${
                  activeTab === item.id
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-5 w-5 mr-3" />
                {item.label}
              </button>
            );
          })}

          <div className="py-4">
            <p className="text-sm text-gray-600 mb-2 px-4">PATIENT MANAGEMENT</p>
          </div>

          {sidebarItems.slice(4, 7).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-4 py-3 text-left transition-colors duration-200 rounded-lg mb-1 ${
                  activeTab === item.id
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-5 w-5 mr-3" />
                {item.label}
              </button>
            );
          })}

          <div className="py-4">
            <p className="text-sm text-gray-600 mb-2 px-4">SETTINGS</p>
          </div>

          {sidebarItems.slice(7).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-4 py-3 text-left transition-colors duration-200 rounded-lg mb-1 ${
                  activeTab === item.id
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-5 w-5 mr-3" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Logout Section */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 text-left text-gray-700 hover:bg-gray-100 transition-colors duration-200 rounded-lg"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <p className="text-sm text-gray-500">{formatDate(currentTime)}</p>
              <p className="text-lg font-semibold text-gray-900">{formatTime(currentTime)}</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-600 hover:text-gray-900 relative">
                <BellIcon className="h-6 w-6" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">3</span>
              </button>

              {/* Doctor Profile Dropdown */}
              <div className="relative" ref={profileDropdownRef}>
                <button
                  onClick={() => setIsProfileDropdownOpen((prev) => !prev)}
                  className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors duration-200"
                >
                  {doctorProfileImage ? (
                    <img
                      src={doctorProfileImage}
                      alt={doctorName}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {doctorName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                  )}
                  <span className="hidden md:block">{doctorName}</span>
                </button>

                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    <button
                      onClick={() => {
                        setActiveTab('profile');
                        setIsProfileDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('settings');
                        setIsProfileDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Settings
                    </button>
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
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
          {activeTab === 'dashboard' && <DashboardContent currentTime={currentTime} doctorName={doctorName} />}
          {activeTab === 'patient-queue' && <PatientQueueContent />}
          {activeTab === 'appointments' && <AppointmentsContent />}
          {activeTab === 'consultations' && <ConsultationsContent />}
          {activeTab === 'schedule' && <ScheduleContent currentTime={currentTime} />}
          {activeTab === 'working-hours' && <WorkingHoursContent />}
          {activeTab === 'leave-management' && <LeaveManagementContent />}
          {activeTab === 'profile' && <ProfileContent doctorName={doctorName} />}
          {activeTab === 'settings' && <SettingsContent />}
        </main>
      </div>
    </div>
  );
}

// Dashboard Content Component - Main Overview
function DashboardContent({ currentTime, doctorName }) {
  const [todayStats, setTodayStats] = useState({
    totalPatients: 24,
    inQueue: 8,
    completed: 16,
    appointments: 12
  });

  const [currentQueue, setCurrentQueue] = useState([
    {
      id: 1,
      tokenNumber: '01',
      patientName: 'John Smith',
      tokenId: 'A001',
      symptoms: 'Fever, Headache',
      waitingTime: '15 mins',
      status: 'current'
    },
    {
      id: 2,
      tokenNumber: '02',
      patientName: 'Maria Garcia',
      tokenId: 'A002',
      symptoms: 'Chest Pain',
      waitingTime: '8 mins',
      status: 'waiting'
    },
    {
      id: 3,
      tokenNumber: '03',
      patientName: 'Robert Johnson',
      tokenId: 'A003',
      symptoms: 'Regular Checkup',
      waitingTime: '3 mins',
      status: 'waiting'
    }
  ]);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <UsersIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Today's Patients</p>
              <p className="text-2xl font-bold text-gray-900">{todayStats.totalPatients}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Queue</p>
              <p className="text-2xl font-bold text-gray-900">{todayStats.inQueue}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{todayStats.completed}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <CalendarDaysIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Appointments</p>
              <p className="text-2xl font-bold text-gray-900">{todayStats.appointments}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Patient Queue */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Current Patient Queue</h2>
              <button className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium">
                <ArrowPathIcon className="h-4 w-4 mr-1" />
                Refresh
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {currentQueue.map((patient) => (
                <div key={patient.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                      patient.status === 'current' ? 'bg-blue-600' : 'bg-gray-400'
                    }`}>
                      {patient.tokenNumber}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{patient.patientName}</h4>
                      <p className="text-sm text-gray-600">Token: {patient.tokenId} • {patient.symptoms}</p>
                      <p className="text-xs text-gray-500">Waiting: {patient.waitingTime}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {patient.status === 'current' ? (
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                        Start Consultation
                      </button>
                    ) : (
                      <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300">
                        Waiting
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Today's Schedule & Profile Summary */}
        <div className="space-y-6">
          {/* Today's Schedule */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Today's Schedule</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <TimeIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">Working Hours</p>
                      <p className="text-sm text-gray-600">9:00 AM - 1:00 PM</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-green-600">Available</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <TimeIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">Break Time</p>
                      <p className="text-sm text-gray-600">11:00 AM - 11:15 AM</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-600">Available</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">Status</p>
                      <p className="text-sm text-gray-600">Available</p>
                    </div>
                  </div>
                  <button className="text-sm font-medium text-blue-600 hover:text-blue-700">
                    Manage Schedule
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Profile Summary</h2>
            </div>
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {doctorName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{doctorName}</h3>
                  <p className="text-sm text-blue-600">Cardiologist</p>
                  <p className="text-sm text-gray-600">License: MD-12345</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Experience</span>
                  <span className="text-sm font-medium text-gray-900">12 years</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Patients Today</span>
                  <span className="text-sm font-medium text-gray-900">24</span>
                </div>
              </div>

              <button className="w-full mt-4 px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Patient Queue Content Component
function PatientQueueContent() {
  const [queue, setQueue] = useState([
    { id: 1, tokenNumber: '01', patientName: 'John Smith', tokenId: 'A001', symptoms: 'Fever, Headache', waitingTime: '15 mins', status: 'current' },
    { id: 2, tokenNumber: '02', patientName: 'Maria Garcia', tokenId: 'A002', symptoms: 'Chest Pain', waitingTime: '8 mins', status: 'waiting' },
    { id: 3, tokenNumber: '03', patientName: 'Robert Johnson', tokenId: 'A003', symptoms: 'Regular Checkup', waitingTime: '3 mins', status: 'waiting' },
    { id: 4, tokenNumber: '04', patientName: 'Sarah Wilson', tokenId: 'A004', symptoms: 'Back Pain', waitingTime: '0 mins', status: 'waiting' }
  ]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Patient Queue Management</h2>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Refresh Queue
          </button>
        </div>

        <div className="space-y-4">
          {queue.map((patient) => (
            <div key={patient.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${
                  patient.status === 'current' ? 'bg-blue-600' : 'bg-gray-400'
                }`}>
                  {patient.tokenNumber}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{patient.patientName}</h4>
                  <p className="text-sm text-gray-600">Token: {patient.tokenId} • {patient.symptoms}</p>
                  <p className="text-xs text-gray-500">Waiting: {patient.waitingTime}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                {patient.status === 'current' ? (
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">
                    Start Consultation
                  </button>
                ) : (
                  <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300">
                    Call Next
                  </button>
                )}
                <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
                  <EyeIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Appointments Content Component
function AppointmentsContent() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Appointments Management</h2>
      <p className="text-gray-600">View and manage your scheduled appointments here.</p>
      <div className="mt-6 p-8 bg-gray-50 rounded-lg text-center">
        <CalendarDaysIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Appointments management functionality will be implemented here.</p>
      </div>
    </div>
  );
}

// Consultations Content Component
function ConsultationsContent() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Consultations</h2>
      <p className="text-gray-600">Manage ongoing and completed consultations.</p>
      <div className="mt-6 p-8 bg-gray-50 rounded-lg text-center">
        <ClipboardDocumentListIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Consultations management functionality will be implemented here.</p>
      </div>
    </div>
  );
}

// Schedule Content Component
function ScheduleContent({ currentTime }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Schedule Management</h2>
      <p className="text-gray-600">Manage your daily and weekly schedule.</p>
      <div className="mt-6 p-8 bg-gray-50 rounded-lg text-center">
        <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Schedule management functionality will be implemented here.</p>
        <p className="text-sm text-gray-400 mt-2">Current time: {currentTime.toLocaleTimeString()}</p>
      </div>
    </div>
  );
}

// Working Hours Content Component
function WorkingHoursContent() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Working Hours</h2>
      <p className="text-gray-600">Set and manage your working hours and availability.</p>
      <div className="mt-6 p-8 bg-gray-50 rounded-lg text-center">
        <TimeIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Working hours management functionality will be implemented here.</p>
      </div>
    </div>
  );
}

// Leave Management Content Component
function LeaveManagementContent() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Leave Management</h2>
      <p className="text-gray-600">Request and manage your leave applications.</p>
      <div className="mt-6 p-8 bg-gray-50 rounded-lg text-center">
        <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Leave management functionality will be implemented here.</p>
      </div>
    </div>
  );
}

// Profile Content Component
function ProfileContent({ doctorName }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Doctor Profile</h2>

      <div className="flex items-center space-x-6 mb-8">
        <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
          {doctorName.split(' ').map(n => n[0]).join('').substring(0, 2)}
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{doctorName}</h3>
          <p className="text-blue-600 font-medium">Cardiologist</p>
          <p className="text-gray-600">License: MD-12345</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Experience</label>
            <p className="text-gray-900">12 years</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Patients Today</label>
            <p className="text-gray-900">24</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <p className="text-gray-900">dr.johnson@medicare.com</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <p className="text-gray-900">+1 (555) 123-4567</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <p className="text-gray-900">Cardiology</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
              Available
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8 flex space-x-4">
        <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
          <PencilIcon className="h-4 w-4 mr-2" />
          Edit Profile
        </button>
        <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
          Change Password
        </button>
      </div>
    </div>
  );
}

// Settings Content Component
function SettingsContent() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Settings</h2>
      <p className="text-gray-600">Manage your account settings and preferences.</p>
      <div className="mt-6 p-8 bg-gray-50 rounded-lg text-center">
        <Cog6ToothIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Settings functionality will be implemented here.</p>
      </div>
    </div>
  );
}