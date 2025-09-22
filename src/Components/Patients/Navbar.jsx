import { useState, useContext, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HiMenu, HiX, HiUser, HiLogout, HiCog, HiChevronDown, HiCalendar, HiClipboardList, HiVideoCamera } from 'react-icons/hi';
import { useClerk, useUser } from '@clerk/clerk-react';
import { AuthContext } from '../../App';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isAppointmentDropdownOpen, setIsAppointmentDropdownOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [userProfileVersion, setUserProfileVersion] = useState(0); // Force re-render when profile updates
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn, setIsLoggedIn } = useContext(AuthContext);
  const { signOut } = useClerk();
  const { user: clerkUser } = useUser();
  const profileDropdownRef = useRef(null);
  const appointmentDropdownRef = useRef(null);

  // Get user data - prioritize localStorage (updated profile) over Clerk data
  const localUser = isLoggedIn ? JSON.parse(localStorage.getItem('user') || '{}') : null;

  // If we have local user data, use it (this includes updated profile info)
  // Otherwise, fall back to Clerk user data
  const user = localUser && localUser.name ? localUser : (clerkUser ? {
    name: clerkUser.fullName || `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
    email: clerkUser.primaryEmailAddress?.emailAddress,
    profileImage: clerkUser.imageUrl
  } : null);

  // Get profile photo - prioritize uploaded photo over Clerk image
  const profilePhoto = user?.profilePhoto || user?.profile_photo || user?.profileImage;

  const userName = user?.name || 'User';

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
      if (appointmentDropdownRef.current && !appointmentDropdownRef.current.contains(event.target)) {
        setIsAppointmentDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Listen for profile updates
  useEffect(() => {
    const handleProfileUpdate = (event) => {
      console.log('Profile updated, refreshing navbar:', event.detail);
      setUserProfileVersion(prev => prev + 1); // Force re-render
    };

    window.addEventListener('userProfileUpdated', handleProfileUpdate);
    return () => {
      window.removeEventListener('userProfileUpdated', handleProfileUpdate);
    };
  }, []);

  // Fetch latest user data when component mounts or profile version changes
  useEffect(() => {
    const fetchLatestUserData = async () => {
      if (!isLoggedIn) return;
      
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const response = await fetch('http://localhost:5001/api/patient/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            // Update localStorage with latest user data
            localStorage.setItem('user', JSON.stringify(data.user));
            // Force re-render by updating version
            setUserProfileVersion(prev => prev + 1);
          }
        }
      } catch (error) {
        console.error('Error fetching latest user data:', error);
      }
    };

    fetchLatestUserData();
  }, [isLoggedIn, userProfileVersion]);

  // Update active section based on current location
  useEffect(() => {
    if (location.pathname === '/') {
      // On home page, check if there's a hash or default to 'home'
      const hash = location.hash || '#home';
      setActiveSection(hash.substring(1));
    } else {
      // On other pages, clear active section
      setActiveSection('');
    }
  }, [location.pathname, location.hash]);

  const handleLogout = async () => {
    try {
      // Sign out from Clerk if user is signed in with Clerk
      if (clerkUser) {
        await signOut();
      }
      
      // Clear local storage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Clear any persisted booking progress
      localStorage.removeItem('bookingData');
      localStorage.removeItem('bookingCurrentStep');
      setIsLoggedIn(false);
      setIsProfileDropdownOpen(false);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if Clerk signout fails
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('bookingData');
      localStorage.removeItem('bookingCurrentStep');
      setIsLoggedIn(false);
      setIsProfileDropdownOpen(false);
      navigate('/login');
    }
  };

  const handleProfileClick = () => {
    navigate('/manage-account');
    setIsProfileDropdownOpen(false);
  };

  const handleAppointmentClick = (path) => {
    navigate(path);
    setIsAppointmentDropdownOpen(false);
    setIsOpen(false); // Close mobile menu
  };

  const navLinks = [
    { name: "Home", path: "#home" },
    { name: "About", path: "#about" },
    { name: "Services", path: "#services" },
    { name: "Our Doctors", path: "#doctors" },
    { name: "Contact", path: "#contact" },
  ];

  const handleVideoConsultationClick = () => {
    navigate('/', {
      state: { scrollTo: '#video-consultation' }
    });
    setIsOpen(false);
  };

  // Additional links for logged-in patients (removed duplicate Our Doctors)
  const patientLinks = [];

  // Combine nav links with patient-specific links for logged-in users
  const allNavLinks = isLoggedIn ? [...navLinks, ...patientLinks] : navLinks;

  // Calculate dropdown width based on content
  const getDropdownWidth = () => {
    const emailLength = user?.email?.length || 0;
    const nameLength = userName?.length || 0;
    const maxLength = Math.max(emailLength, nameLength);

    // Base width + dynamic width based on content
    const baseWidth = 200; // minimum width
    const dynamicWidth = Math.max(0, (maxLength - 20) * 8); // 8px per extra character
    return Math.min(baseWidth + dynamicWidth, 350); // max width 350px
  };

  const handleNavClick = (e, path) => {
    e.preventDefault();

    // Close mobile menu
    setIsOpen(false);

    if (path.startsWith('#')) {
      // For hash links, navigate to home page with scroll target in state
      setActiveSection(path.substring(1));
      navigate('/', {
        state: { scrollTo: path }
      });
    } else {
      // For non-anchor links, navigate directly
      setActiveSection('');
      navigate(path);
    }
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
            {allNavLinks.map((link) => (
              link.path.startsWith('#') ? (
                <button
                  key={link.name}
                  onClick={(e) => handleNavClick(e, link.path)}
                  className={`text-sm font-medium transition-colors duration-200 hover:text-black cursor-pointer ${
                    activeSection === link.path.substring(1) && location.pathname === '/'
                      ? 'text-black border-b-2 border-black pb-1'
                      : 'text-gray-600'
                  }`}
                >
                  {link.name}
                </button>
              ) : (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`text-sm font-medium transition-colors duration-200 hover:text-black ${
                    location.pathname === link.path
                      ? 'text-black border-b-2 border-black pb-1'
                      : 'text-gray-600'
                  }`}
                >
                  {link.name}
                </Link>
              )
            ))}

            {/* Video Consultation Button */}
            <button
              onClick={handleVideoConsultationClick}
              className="flex items-center space-x-1 text-sm font-medium text-gray-600 hover:text-black transition-colors duration-200"
            >
              <HiVideoCamera className="w-4 h-4" />
              <span>Video Consultation</span>
            </button>

            {/* Appointment Dropdown - Only for logged-in users */}
            {isLoggedIn && (
              <div className="relative" ref={appointmentDropdownRef}>
                <button
                  onClick={() => setIsAppointmentDropdownOpen(!isAppointmentDropdownOpen)}
                  className={`flex items-center space-x-1 text-sm font-medium transition-colors duration-200 hover:text-black ${
                    location.pathname === '/booking' || location.pathname === '/appointments'
                      ? 'text-black border-b-2 border-black pb-1'
                      : 'text-gray-600'
                  }`}
                >
                  <span>Appointment</span>
                  <HiChevronDown className={`w-4 h-4 transition-transform duration-200 ${isAppointmentDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Appointment Dropdown Menu */}
                {isAppointmentDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50 border border-gray-200">
                    <button
                      onClick={() => handleAppointmentClick('/booking')}
                      className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                    >
                      <HiCalendar className="mr-3 h-4 w-4 text-blue-600" />
                      Book Appointment
                    </button>
                    <button
                      onClick={() => handleAppointmentClick('/appointments')}
                      className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                    >
                      <HiClipboardList className="mr-3 h-4 w-4 text-green-600" />
                      My Appointments
                    </button>
                  </div>
                )}
              </div>
            )}


            {/* Profile Section */}
            {isLoggedIn ? (
              <div className="relative" ref={profileDropdownRef}>
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-black transition-colors duration-200"
                >
                  {profilePhoto ? (
                    <img 
                      src={profilePhoto.startsWith('http') 
                        ? profilePhoto
                        : `http://localhost:5001${profilePhoto}`
                      }
                      alt={userName}
                      className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className={`w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm ${profilePhoto ? 'hidden' : 'flex'}`}>
                    {getInitials(userName)}
                  </div>
                  <span className="hidden lg:block">{userName}</span>
                </button>

                {/* Profile Dropdown */}
                {isProfileDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200"
                    style={{ width: `${getDropdownWidth()}px` }}
                  >
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 truncate" title={userName}>{userName}</p>
                      <p className="text-xs text-gray-500 truncate" title={user?.email}>{user?.email}</p>
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
            {allNavLinks.map((link) => (
              link.path.startsWith('#') ? (
                <button
                  key={link.name}
                  onClick={(e) => handleNavClick(e, link.path)}
                  className="block w-full text-left px-4 py-3 text-base font-medium text-gray-600 hover:text-black hover:bg-gray-50"
                >
                  {link.name}
                </button>
              ) : (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-left px-4 py-3 text-base font-medium text-gray-600 hover:text-black hover:bg-gray-50"
                >
                  {link.name}
                </Link>
              )
            ))}

            {/* Mobile Video Consultation */}
            <button
              onClick={handleVideoConsultationClick}
              className="flex items-center w-full px-4 py-3 text-base font-medium text-gray-600 hover:text-black hover:bg-gray-50"
            >
              <HiVideoCamera className="mr-3 h-5 w-5 text-purple-600" />
              Video Consultation
            </button>

            {/* Mobile Appointment Section - Only for logged-in users */}
            {isLoggedIn && (
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="px-4 py-2">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Appointment</h3>
                </div>
                <button
                  onClick={() => handleAppointmentClick('/booking')}
                  className="flex items-center w-full px-4 py-3 text-base font-medium text-gray-600 hover:text-black hover:bg-gray-50"
                >
                  <HiCalendar className="mr-3 h-5 w-5 text-blue-600" />
                  Book Appointment
                </button>
                <button
                  onClick={() => handleAppointmentClick('/appointments')}
                  className="flex items-center w-full px-4 py-3 text-base font-medium text-gray-600 hover:text-black hover:bg-gray-50"
                >
                  <HiClipboardList className="mr-3 h-5 w-5 text-green-600" />
                  My Appointments
                </button>
              </div>
            )}
            
            
            {/* Mobile Profile Section */}
            {isLoggedIn ? (
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="px-4 py-2">
                  <div className="flex items-center space-x-3">
                    {profilePhoto ? (
                      <img 
                        src={profilePhoto.startsWith('http') 
                          ? profilePhoto
                          : `http://localhost:5001${profilePhoto}`
                        }
                        alt={userName}
                        className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={`w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm ${profilePhoto ? 'hidden' : 'flex'}`}>
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