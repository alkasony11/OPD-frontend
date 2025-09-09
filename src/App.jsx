import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import Navbar from "./Components/Patients/Navbar";
import Footer from "./Components/Patients/Footer";
import LandingPage from "./Pages/Patient/LandingPage";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import { createContext, useEffect, useState } from "react";
import NewBookingPage from "./Pages/Patient/NewBookingPage";
import Profile from "./Pages/Patient/Profile";
import Appointments from './Pages/Patient/Appointments';
import ForgotPassword from './Pages/ForgotPassword';
import ResetPassword from './Pages/ResetPassword';
import SSOCallback from './Pages/SSOCallback';
import AdminDashboard from './Pages/Admin/AdminDashboard';
import ReceptionistDashboard from './Pages/Receptionist/ReceptionistDashboard';
import DoctorDashboard from './Pages/Doctor/DoctorDashboard';
import DoctorAppointmentsPage from './Pages/Doctor/DoctorAppointmentsPage';
import DoctorPatientsPage from './Pages/Doctor/DoctorPatientsPage';
import DoctorSchedulePage from './Pages/Doctor/DoctorSchedulePage';
import DoctorLeaveRequestsPage from './Pages/Doctor/DoctorLeaveRequestsPage';
import DoctorRecordsPage from './Pages/Doctor/DoctorRecordsPage';
import DoctorReportsPage from './Pages/Doctor/DoctorReportsPage';
import DoctorSettingsPage from './Pages/Doctor/DoctorSettingsPage';
import { useClerkAuth } from './hooks/useClerkAuth';
import { isAuthenticated } from './utils/auth';
import { ProtectedRoute, GuestRoute } from './Components/ProtectedRoute';

export const AuthContext = createContext();

// Separate component to use the hook inside the context
function AppContent() {
  const location = useLocation();

  // Initialize Clerk auth hook
  useClerkAuth();

  // Routes where navbar and footer should be hidden
  const hideNavbarFooterRoutes = [
    '/login', '/register', '/forgot-password', '/reset-password',
    '/admin/dashboard', '/admin/doctors', '/admin/doctor-schedules', '/admin/patients', '/admin/departments', '/admin/leave-requests',
    '/doctor/dashboard', '/doctor/appointments', '/doctor/patients',
    '/doctor/schedule', '/doctor/leave-requests', '/doctor/records', '/doctor/reports', '/doctor/settings',
    '/receptionist/dashboard', '/receptionist/appointments', '/receptionist/patients',
    '/receptionist/queue', '/receptionist/billing', '/receptionist/reports', '/receptionist/settings'
  ];
  const shouldHideNavbarFooter = hideNavbarFooterRoutes.includes(location.pathname);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {!shouldHideNavbarFooter && <Navbar />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
          <Route path="/booking" element={<NewBookingPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/appointments" element={<ProtectedRoute requiredRole="patient"><Appointments /></ProtectedRoute>} />
          <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
          <Route path="/reset-password" element={<GuestRoute><ResetPassword /></GuestRoute>} />
          <Route path="/sso-callback" element={<SSOCallback />} />
          <Route path="/admin/dashboard" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/doctors" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/doctor-schedules" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/patients" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/departments" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/leave-requests" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/doctor/dashboard" element={<ProtectedRoute requiredRole="doctor"><DoctorDashboard /></ProtectedRoute>} />
          <Route path="/doctor/appointments" element={<ProtectedRoute requiredRole="doctor"><DoctorAppointmentsPage /></ProtectedRoute>} />
          <Route path="/doctor/patients" element={<ProtectedRoute requiredRole="doctor"><DoctorPatientsPage /></ProtectedRoute>} />
          <Route path="/doctor/schedule" element={<ProtectedRoute requiredRole="doctor"><DoctorSchedulePage /></ProtectedRoute>} />
          <Route path="/doctor/leave-requests" element={<ProtectedRoute requiredRole="doctor"><DoctorLeaveRequestsPage /></ProtectedRoute>} />
          <Route path="/doctor/records" element={<ProtectedRoute requiredRole="doctor"><DoctorRecordsPage /></ProtectedRoute>} />
          <Route path="/doctor/reports" element={<ProtectedRoute requiredRole="doctor"><DoctorReportsPage /></ProtectedRoute>} />
          <Route path="/doctor/settings" element={<ProtectedRoute requiredRole="doctor"><DoctorSettingsPage /></ProtectedRoute>} />
          <Route path="/receptionist/dashboard" element={<ProtectedRoute requiredRole="receptionist"><ReceptionistDashboard /></ProtectedRoute>} />
          <Route path="/receptionist/appointments" element={<ProtectedRoute requiredRole="receptionist"><ReceptionistDashboard /></ProtectedRoute>} />
          <Route path="/receptionist/patients" element={<ProtectedRoute requiredRole="receptionist"><ReceptionistDashboard /></ProtectedRoute>} />
          <Route path="/receptionist/queue" element={<ProtectedRoute requiredRole="receptionist"><ReceptionistDashboard /></ProtectedRoute>} />
          <Route path="/receptionist/billing" element={<ProtectedRoute requiredRole="receptionist"><ReceptionistDashboard /></ProtectedRoute>} />
          <Route path="/receptionist/reports" element={<ProtectedRoute requiredRole="receptionist"><ReceptionistDashboard /></ProtectedRoute>} />
          <Route path="/receptionist/settings" element={<ProtectedRoute requiredRole="receptionist"><ReceptionistDashboard /></ProtectedRoute>} />
        </Routes>
      </main>
      {!shouldHideNavbarFooter && <Footer />}
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