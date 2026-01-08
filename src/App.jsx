import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import Navbar from "./Components/Patients/Navbar";
import Footer from "./Components/Patients/Footer";
import LandingPage from "./Pages/Patient/LandingPage";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import { createContext, useContext, useEffect, useState } from "react";
import NewBookingPage from "./Pages/Patient/NewBookingPage";
import Profile from "./Pages/Patient/Profile";
import Appointments from './Pages/Patient/Appointments';
import ManageAccount from './Pages/Patient/ManageAccount';
import ForgotPassword from './Pages/ForgotPassword';
import ResetPassword from './Pages/ResetPassword';
import SSOCallback from './Pages/SSOCallback';
import Terms from './Pages/Terms';
import Privacy from './Pages/Privacy';
import AdminDashboard from './Pages/Admin/AdminDashboard';
import AdminPatientProfile from './Pages/Admin/PatientProfile';
import PatientConsultations from './Pages/Admin/PatientConsultations';
import DebugPage from './Pages/DebugPage';
import RegisteredPatients from './Components/Admin/RegisteredPatients';
import ReceptionistDashboard from './Pages/Receptionist/ReceptionistDashboard';
import DoctorDashboard from './Pages/Doctor/DoctorDashboard';
import DoctorAppointmentsPage from './Pages/Doctor/DoctorAppointmentsPage';
import DoctorConsultationsPage from './Pages/Doctor/DoctorConsultationsPage';
import DoctorPatientsPage from './Pages/Doctor/DoctorPatientsPage';
import DoctorHistoryPage from './Pages/Doctor/DoctorHistoryPage';
import DoctorSchedulePage from './Pages/Doctor/DoctorSchedulePage';
import DoctorLeaveRequestsPage from './Pages/Doctor/DoctorLeaveRequestsPage';
import DoctorRecordsPage from './Pages/Doctor/DoctorRecordsPage';
import DoctorReportsPage from './Pages/Doctor/DoctorReportsPage';
import DoctorSettingsPage from './Pages/Doctor/DoctorSettingsPage';
import PatientChatbotPage from './Pages/Patient/ChatbotPage';
import DoctorProfilesPage from './Pages/Patient/DoctorProfilesPage';
import Settings from './Pages/Patient/Settings';
import DoctorDetailPage from './Pages/Patient/DoctorDetailPage';
import Invoices from './Pages/Patient/Invoices';
import ConsultedAppointments from './Pages/Patient/ConsultedAppointments';
import CancelledAppointments from './Pages/Patient/CancelledAppointments';
import Notifications from './Pages/Patient/Notifications';
import Prescriptions from './Pages/Patient/Prescriptions';
import { useClerkAuth } from './hooks/useClerkAuth';
import { isAuthenticated } from './utils/auth';
import { ProtectedRoute, GuestRoute } from './Components/ProtectedRoute';
import ChatbotWidget from './Components/Chatbot/ChatbotWidget';

export const AuthContext = createContext();

// Separate component to use the hook inside the context
function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  
  // Safety check for context
  if (!authContext) {
    console.warn('AuthContext is not available in AppContent');
    return <div>Loading...</div>;
  }
  
  const { isLoggedIn } = authContext;

  // Initialize Clerk auth only after context is available
  useClerkAuth();

  // Check if logged-in user should be redirected to their dashboard
  useEffect(() => {
    if (isLoggedIn) {
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          console.log('AppContent - Checking user role:', user.role, 'Current path:', location.pathname);
          
          // Only redirect if user is on the home page and should be on a different dashboard
          if (location.pathname === '/') {
            switch (user.role) {
              case 'admin':
                console.log('AppContent - Redirecting admin to dashboard');
                navigate('/admin/dashboard', { replace: true });
                break;
              case 'doctor':
                console.log('AppContent - Redirecting doctor to dashboard');
                navigate('/doctor/dashboard', { replace: true });
                break;
              case 'receptionist':
                console.log('AppContent - Redirecting receptionist to dashboard');
                navigate('/receptionist/dashboard', { replace: true });
                break;
              // Patient users can stay on home page (LandingPage)
            }
          }
        } catch (error) {
          console.error('AppContent - Error parsing user data:', error);
        }
      }
    }
  }, [isLoggedIn, location.pathname, navigate]);

  // Routes where navbar and footer should be hidden
  const hideNavbarFooterRoutes = [
    '/login', '/register', '/forgot-password', '/reset-password', '/terms', '/privacy',
    '/admin/dashboard', '/admin/users', '/admin/registered-patients', '/admin/doctors', '/admin/doctor-schedules', '/admin/schedule-requests', '/admin/patients', '/admin/family-members', '/admin/payments', '/admin/messages', '/admin/departments', '/admin/leave-requests', '/admin/feedback', '/admin/appointments', '/admin/reports', '/admin/logs', '/admin/doctor-load', '/admin/priority',
    '/admin/patient-category/registered', '/admin/patient-category/management', '/admin/patient-category/family', '/admin/patient-category/history', '/admin/patient-category/notifications', '/admin/patient-category/payments', '/admin/patient-category/blocking',
    '/doctor', '/doctor/dashboard', '/doctor/appointments', '/doctor/consultations', '/doctor/patients', '/doctor/history',
    '/doctor/schedule', '/doctor/leave-requests', '/doctor/records', '/doctor/reports', '/doctor/settings',
    '/receptionist/dashboard', '/receptionist/appointments', '/receptionist/patients',
    '/receptionist/queue', '/receptionist/billing', '/receptionist/reports', '/receptionist/settings',
    '/chatbot'
  ];
  // Also hide footer on booking, appointments, manage-account, and history pages
  const hideFooterOnlyRoutes = ['/booking', '/appointments', '/manage-account', '/consulted-appointments', '/cancelled-appointments'];
  const shouldHideNavbarFooter = hideNavbarFooterRoutes.includes(location.pathname);
  const shouldHideFooterOnly = hideFooterOnlyRoutes.includes(location.pathname);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {!shouldHideNavbarFooter && <Navbar />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/booking" element={<NewBookingPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/appointments" element={<ProtectedRoute requiredRole="patient"><Appointments /></ProtectedRoute>} />
          <Route path="/manage-account" element={<ProtectedRoute requiredRole="patient"><ManageAccount /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute requiredRole="patient"><Settings /></ProtectedRoute>} />
          <Route path="/invoices" element={<ProtectedRoute requiredRole="patient"><Invoices /></ProtectedRoute>} />
          <Route path="/consulted-appointments" element={<ProtectedRoute requiredRole="patient"><ConsultedAppointments /></ProtectedRoute>} />
          <Route path="/cancelled-appointments" element={<ProtectedRoute requiredRole="patient"><CancelledAppointments /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute requiredRole="patient"><Notifications /></ProtectedRoute>} />
          <Route path="/prescriptions" element={<ProtectedRoute requiredRole="patient"><Prescriptions /></ProtectedRoute>} />
          <Route path="/chatbot" element={<ProtectedRoute requiredRole="patient"><PatientChatbotPage /></ProtectedRoute>} />
          <Route path="/doctors" element={<DoctorProfilesPage />} />
          <Route path="/doctors/:doctorId" element={<DoctorDetailPage />} />
          <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
          <Route path="/reset-password" element={<GuestRoute><ResetPassword /></GuestRoute>} />
          <Route path="/sso-callback" element={<SSOCallback />} />
          <Route path="/debug" element={<ProtectedRoute><DebugPage /></ProtectedRoute>} />
          <Route path="/admin/dashboard" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/doctors" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/doctor-schedules" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/schedule-requests" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/patients" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/family-members" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/payments" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/messages" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/registered-patients" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/departments" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/appointments" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/consultations" element={<ProtectedRoute requiredRole="admin"><PatientConsultations /></ProtectedRoute>} />
          <Route path="/admin/patient/:patientId" element={<ProtectedRoute requiredRole="admin"><AdminPatientProfile /></ProtectedRoute>} />
          <Route path="/admin/leave-requests" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/feedback" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
          {/* Patient Category Routes */}
          <Route path="/admin/patient-category/registered" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/patient-category/management" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/patient-category/family" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/patient-category/history" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/patient-category/notifications" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/patient-category/payments" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/patient-category/blocking" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/doctor/dashboard" element={<ProtectedRoute requiredRole="doctor"><DoctorDashboard /></ProtectedRoute>} />
          <Route path="/doctor/appointments" element={<ProtectedRoute requiredRole="doctor"><DoctorAppointmentsPage /></ProtectedRoute>} />
          <Route path="/doctor/consultations" element={<ProtectedRoute requiredRole="doctor"><DoctorConsultationsPage /></ProtectedRoute>} />
          <Route path="/doctor/patients" element={<ProtectedRoute requiredRole="doctor"><DoctorPatientsPage /></ProtectedRoute>} />
          <Route path="/doctor/history" element={<ProtectedRoute requiredRole="doctor"><DoctorHistoryPage /></ProtectedRoute>} />
          <Route path="/doctor/schedule" element={<ProtectedRoute requiredRole="doctor"><DoctorSchedulePage /></ProtectedRoute>} />
          <Route path="/doctor/leave-requests" element={<ProtectedRoute requiredRole="doctor"><DoctorLeaveRequestsPage /></ProtectedRoute>} />
          <Route path="/doctor/records" element={<ProtectedRoute requiredRole="doctor"><DoctorRecordsPage /></ProtectedRoute>} />
          <Route path="/doctor/reports" element={<ProtectedRoute requiredRole="doctor"><DoctorReportsPage /></ProtectedRoute>} />
          <Route path="/doctor/settings" element={<ProtectedRoute requiredRole="doctor"><DoctorSettingsPage /></ProtectedRoute>} />
          <Route path="/doctor" element={<ProtectedRoute requiredRole="doctor"><DoctorDashboard /></ProtectedRoute>} />
          <Route path="/receptionist/dashboard" element={<ProtectedRoute requiredRole="receptionist"><ReceptionistDashboard /></ProtectedRoute>} />
          <Route path="/receptionist/appointments" element={<ProtectedRoute requiredRole="receptionist"><ReceptionistDashboard /></ProtectedRoute>} />
          <Route path="/receptionist/patients" element={<ProtectedRoute requiredRole="receptionist"><ReceptionistDashboard /></ProtectedRoute>} />
          <Route path="/receptionist/queue" element={<ProtectedRoute requiredRole="receptionist"><ReceptionistDashboard /></ProtectedRoute>} />
          <Route path="/receptionist/billing" element={<ProtectedRoute requiredRole="receptionist"><ReceptionistDashboard /></ProtectedRoute>} />
          <Route path="/receptionist/reports" element={<ProtectedRoute requiredRole="receptionist"><ReceptionistDashboard /></ProtectedRoute>} />
          <Route path="/receptionist/settings" element={<ProtectedRoute requiredRole="receptionist"><ReceptionistDashboard /></ProtectedRoute>} />
        </Routes>
      </main>
      {!shouldHideNavbarFooter && !shouldHideFooterOnly && <Footer />}
      
      {/* Chatbot Widget - Show only for authenticated patients, but not on chatbot page, admin pages, or doctor pages */}
      {isLoggedIn && location.pathname !== '/chatbot' && !location.pathname.startsWith('/admin') && !location.pathname.startsWith('/doctor') && <ChatbotWidget />}
      
    </div>
  );
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    // Initialize from localStorage with proper validation
    return isAuthenticated();
  });
  const [redirectPath, setRedirectPath] = useState('/');

  // Keep login state in sync with localStorage
  useEffect(() => {
    const onStorage = () => {
      setIsLoggedIn(isAuthenticated());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Periodic check for token expiration (every 5 minutes)
  useEffect(() => {
    const checkAuthStatus = () => {
      const currentAuthStatus = isAuthenticated();
      if (currentAuthStatus !== isLoggedIn) {
        console.log('Authentication status changed:', {
          previous: isLoggedIn,
          current: currentAuthStatus
        });
        setIsLoggedIn(currentAuthStatus);
      }
    };

    // Check immediately
    checkAuthStatus();

    // Set up periodic check
    const interval = setInterval(checkAuthStatus, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [isLoggedIn]);

  const [token, setToken] = useState(() => {
    return localStorage.getItem('token');
  });

  // Keep token in sync with localStorage
  useEffect(() => {
    const onStorage = () => {
      setToken(localStorage.getItem('token'));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn, redirectPath, setRedirectPath, token, setToken }}>
      <AppContent />
    </AuthContext.Provider>
  );
}

export default App; 