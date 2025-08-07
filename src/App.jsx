import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import Navbar from "./Components/Patients/Navbar";
import Footer from "./Components/Patients/Footer";
import LandingPage from "./Pages/Patient/LandingPage";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import { createContext, useEffect, useState } from "react";
import BookingPage from "./Pages/Patient/BookingPage";
import Profile from "./Pages/Patient/Profile";
import ForgotPassword from './Pages/ForgotPassword';
import ResetPassword from './Pages/ResetPassword';
import SSOCallback from './Pages/SSOCallback';
import AdminDashboard from './Pages/Admin/AdminDashboard';
import DoctorDashboard from './Pages/Doctor/doctordash';
import { useClerkAuth } from './hooks/useClerkAuth';
import { isAuthenticated } from './utils/auth';

export const AuthContext = createContext();

// Separate component to use the hook inside the context
function AppContent() {
  const location = useLocation();

  // Initialize Clerk auth hook
  useClerkAuth();

  // Routes where navbar and footer should be hidden
  const hideNavbarFooterRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/admin/dashboard', '/doctor/dashboard'];
  const shouldHideNavbarFooter = hideNavbarFooterRoutes.includes(location.pathname);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {!shouldHideNavbarFooter && <Navbar />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/booking" element={<BookingPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/sso-callback" element={<SSOCallback />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
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

  return (
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn, redirectPath, setRedirectPath }}>
      <AppContent />
    </AuthContext.Provider>
  );
}

export default App; 