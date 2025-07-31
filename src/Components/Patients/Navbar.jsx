import { useState, useContext, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HiMenu, HiX, HiUser, HiLogout, HiCog } from 'react-icons/hi';
import { AuthContext } from '../../App';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn, setIsLoggedIn } = useContext(AuthContext);
  const profileDropdownRef = useRef(null);

  // Get user data from localStorage
  const user = isLoggedIn ? JSON.parse(localStorage.getItem('user') || '{}') : null;
  const userName = user?.name || 'User';

  // Close dropdown when clicking outside
  useEffect(() => {
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
    setIsLoggedIn(false);
    setIsProfileDropdownOpen(false);
    navigate('/login');
  };

  const handleProfileClick = () => {
    navigate('/profile');
    setIsProfileDropdownOpen(false);
  };

  const navLinks = [
    { name: "Home", path: "#home" },
    { name: "About", path: "#about" },
    { name: "Services", path: "#services" },
    { name: "Contact", path: "#contact" },
  ];

  const handleNavClick = (e, path) => {
    e.preventDefault();
    // Set active section for styling
    if (path.startsWith('#')) {
      setActiveSection(path.substring(1));
    } else {
      setActiveSection('');
    }
    if (path.startsWith('#')) {
      if (location.pathname !== '/') {
        window.location.href = '/' + path;
        return;
      }
      const element = document.querySelector(path);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      window.location.href = path;
    }
    setIsOpen(false);
  };

  // Get initials from username
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <span className="text-2xl font-bold text-black">MediQ</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-10">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.path}
                onClick={(e) => handleNavClick(e, link.path)}
                className={`text-sm font-medium transition-colors duration-200 ${
                  (link.path.startsWith('#') && activeSection === link.path.substring(1) && location.pathname === '/') ||
                  (!link.path.startsWith('#') && location.pathname === link.path)
                    ? 'text-black border-b-2 border-black pb-1'
                    : 'text-gray-600 hover:text-black'
                }`}
              >
                {link.name}
              </a>
            ))}

            {/* Profile Section */}
            {isLoggedIn ? (
              <div className="relative" ref={profileDropdownRef}>
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-black transition-colors duration-200"
                >
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {getInitials(userName)}
                  </div>
                  <span className="hidden lg:block">{userName}</span>
                </button>

                {/* Profile Dropdown */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{userName}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    
                    <button
                      onClick={handleProfileClick}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                    >
                      <HiUser className="mr-3 h-4 w-4" />
                      Manage Account
                    </button>
                    
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                    >
                      <HiLogout className="mr-3 h-4 w-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="text-sm font-medium text-gray-600 hover:text-black transition-colors duration-200"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-600 hover:text-black focus:outline-none"
            >
              {isOpen ? <HiX className="h-6 w-6" /> : <HiMenu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-6 border-t border-gray-200">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.path}
                onClick={(e) => handleNavClick(e, link.path)}
                className="block px-4 py-3 text-base font-medium text-gray-600 hover:text-black hover:bg-gray-50"
              >
                {link.name}
              </a>
            ))}
            
            {/* Mobile Profile Section */}
            {isLoggedIn ? (
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="px-4 py-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {getInitials(userName)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{userName}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleProfileClick}
                  className="flex items-center w-full px-4 py-3 text-base font-medium text-gray-600 hover:text-black hover:bg-gray-50"
                >
                  <HiUser className="mr-3 h-5 w-5" />
                  Manage Account
                </button>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-3 text-base font-medium text-gray-600 hover:text-black hover:bg-gray-50"
                >
                  <HiLogout className="mr-3 h-5 w-5" />
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="block px-4 py-3 text-base font-medium text-gray-600 hover:text-black hover:bg-gray-50"
              >
                Login
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
} 