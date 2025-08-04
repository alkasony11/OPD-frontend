import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import Navbar from "./Components/Patients/Navbar";
import Footer from "./Components/Patients/Footer";
import LandingPage from "./Pages/LandingPage";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import { createContext, useEffect, useState } from "react";
import BookingPage from "./Pages/BookingPage";
import Profile from "./Pages/Profile";
import ForgotPassword from './Pages/ForgotPassword';
import ResetPassword from './Pages/ResetPassword';
import SSOCallback from './Pages/SSOCallback';
import { useClerkAuth } from './hooks/useClerkAuth';

export const AuthContext = createContext();

// Separate component to use the hook inside the context
function AppContent() {
  // Initialize Clerk auth hook
  useClerkAuth();

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
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
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [redirectPath, setRedirectPath] = useState('/');

  // Keep login state in sync with localStorage
  useEffect(() => {
    const onStorage = () => setIsLoggedIn(!!localStorage.getItem('token'));
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn, redirectPath, setRedirectPath }}>
      <AppContent />
    </AuthContext.Provider>
  );
}

export default App; 