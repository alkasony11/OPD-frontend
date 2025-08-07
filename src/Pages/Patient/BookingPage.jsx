import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { AuthContext } from '../../App';
import {
  UserIcon,
  UsersIcon,
  PlusIcon,
  ArrowLeftIcon,
  CalendarDaysIcon,
  ClockIcon,
  CreditCardIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  PhoneIcon,
  IdentificationIcon,
  BanknotesIcon,
  StarIcon,
  ShieldCheckIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  BellIcon,
  SpeakerWaveIcon,
  BuildingOffice2Icon,
  UserCircleIcon,
  HeartIcon,
  BeakerIcon,
  WrenchScrewdriverIcon,
  FaceSmileIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';

export default function BookingPage() {
  const navigate = useNavigate();
  const { isSignedIn, user, isLoaded } = useUser();
  const { isLoggedIn } = useContext(AuthContext);

  // Professional booking system states
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [notifications, setNotifications] = useState([]);

  // Add state for showing history
  const [showHistory, setShowHistory] = useState(false);
  const [appointmentHistory, setAppointmentHistory] = useState([]);

  // Load appointment history
  useEffect(() => {
    const loadHistory = () => {
      const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
      setAppointmentHistory(appointments);
    };
    loadHistory();
  }, []);

  // Mock data for departments and doctors (since no backend changes)
  const [departments] = useState([
    { id: 1, name: 'Cardiology', description: 'Heart and cardiovascular system care', icon: 'heart' },
    { id: 2, name: 'Dermatology', description: 'Skin, hair, and nail treatments', icon: 'medical' },
    { id: 3, name: 'Orthopedics', description: 'Bone, joint, and muscle care', icon: 'bone' },
    { id: 4, name: 'Pediatrics', description: 'Healthcare for infants, children, and adolescents', icon: 'child' },
    { id: 5, name: 'Neurology', description: 'Brain and nervous system disorders', icon: 'brain' },
    { id: 6, name: 'General Medicine', description: 'Primary healthcare and general medical conditions', icon: 'hospital' },
    { id: 7, name: 'Gynecology', description: 'Women\'s reproductive health', icon: 'female' },
    { id: 8, name: 'ENT', description: 'Ear, nose, and throat specialists', icon: 'ear' }
  ]);

  const [doctors] = useState([
    { id: 1, name: 'Dr. Rajesh Kumar', specialization: 'Interventional Cardiology', department: 1, experience: 15, fee: 800, rating: 4.8, reviews: 120, image: null },
    { id: 2, name: 'Dr. Priya Sharma', specialization: 'Cosmetic Dermatology', department: 2, experience: 12, fee: 600, rating: 4.9, reviews: 95, image: null },
    { id: 3, name: 'Dr. Amit Patel', specialization: 'Joint Replacement Surgery', department: 3, experience: 18, fee: 900, rating: 4.7, reviews: 150, image: null },
    { id: 4, name: 'Dr. Sunita Reddy', specialization: 'Child Development', department: 4, experience: 10, fee: 500, rating: 4.9, reviews: 200, image: null },
    { id: 5, name: 'Dr. Vikram Singh', specialization: 'Stroke and Epilepsy', department: 5, experience: 14, fee: 1000, rating: 4.8, reviews: 80, image: null },
    { id: 6, name: 'Dr. Anita Gupta', specialization: 'Internal Medicine', department: 6, experience: 8, fee: 400, rating: 4.6, reviews: 180, image: null }
  ]);

  // Family Health Wallet
  const [familyMembers, setFamilyMembers] = useState([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    relation: 'Self',
    age: '',
    gender: 'male',
    phone: '',
    email: '',
    bloodGroup: '',
    allergies: '',
    medicalHistory: '',
    emergencyContact: { name: '', phone: '', relation: '' }
  });

  // Booking data
  const [bookingData, setBookingData] = useState({
    departmentId: '',
    doctorId: '',
    familyMemberId: '',
    appointmentDate: '',
    appointmentTime: '',
    symptoms: '',
    paymentMethod: 'card',
    tokenNumber: '',
    estimatedWaitTime: 0
  });

  // Initialize family members
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      const selfMember = {
        id: 'self',
        name: user.fullName || user.firstName || 'User',
        relation: 'Self',
        age: user.publicMetadata?.age || 25,
        gender: user.publicMetadata?.gender || 'male',
        phone: user.primaryPhoneNumber?.phoneNumber || '',
        email: user.primaryEmailAddress?.emailAddress || '',
        bloodGroup: '',
        allergies: '',
        medicalHistory: '',
        emergencyContact: { name: '', phone: '', relation: '' }
      };
      setFamilyMembers([selfMember]);
      setBookingData(prev => ({ ...prev, familyMemberId: 'self' }));
    } else if (isLoggedIn) {
      // Handle regular login users
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const selfMember = {
        id: 'self',
        name: userData.name || 'User',
        relation: 'Self',
        age: 25,
        gender: userData.gender || 'male',
        phone: userData.phone || '',
        email: userData.email || '',
        bloodGroup: '',
        allergies: '',
        medicalHistory: '',
        emergencyContact: { name: '', phone: '', relation: '' }
      };
      setFamilyMembers([selfMember]);
      setBookingData(prev => ({ ...prev, familyMemberId: 'self' }));
    }
  }, [isLoaded, isSignedIn, user, isLoggedIn]);

  // Generate available time slots with AI-based wait time estimation
  const generateTimeSlots = (doctorId) => {
    const slots = [];
    const startHour = 9;
    const endHour = 17;
    const doctor = doctors.find(d => d.id === doctorId);

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const queueLength = Math.floor(Math.random() * 10);
        const avgConsultationTime = doctor ? (doctor.experience > 15 ? 20 : 15) : 15;
        const rushHourMultiplier = (hour >= 10 && hour <= 12) || (hour >= 16 && hour <= 18) ? 1.3 : 1.0;
        const estimatedWait = Math.round(queueLength * avgConsultationTime * rushHourMultiplier);

        slots.push({
          time,
          available: Math.random() > 0.3, // 70% availability
          estimatedWaitTime: estimatedWait
        });
      }
    }
    return slots.filter(slot => slot.available);
  };

  // Smart appointment booking with overlap prevention
  const handleBookAppointment = () => {
    if (!bookingData.departmentId || !bookingData.doctorId || !bookingData.familyMemberId ||
        !bookingData.appointmentDate || !bookingData.appointmentTime || !bookingData.symptoms.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    // Check for overlapping appointments (mock check)
    const existingAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    const hasOverlap = existingAppointments.some(apt =>
      apt.familyMemberId === bookingData.familyMemberId &&
      apt.appointmentDate === bookingData.appointmentDate
    );

    if (hasOverlap) {
      setError('This family member already has an appointment on this date');
      return;
    }

    setLoading(true);

    // Simulate booking process
    setTimeout(() => {
      const tokenNumber = `TKN${Date.now().toString().slice(-6)}`;
      const selectedDoctor = doctors.find(d => d.id === bookingData.doctorId);
      const estimatedWaitTime = Math.floor(Math.random() * 60) + 15;

      const newAppointment = {
        ...bookingData,
        tokenNumber,
        estimatedWaitTime,
        status: 'confirmed',
        bookedAt: new Date().toISOString(),
        doctorName: selectedDoctor?.name,
        departmentName: departments.find(d => d.id === bookingData.departmentId)?.name
      };

      // Save to localStorage
      const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
      appointments.push(newAppointment);
      localStorage.setItem('appointments', JSON.stringify(appointments));

      setBookingData(prev => ({ ...prev, tokenNumber, estimatedWaitTime }));
      setSuccess(`Appointment booked successfully! Token: ${tokenNumber}`);
      setCurrentStep(7); // Success step
      setLoading(false);

      // Simulate notification sound (LinkedIn-style)
      playNotificationSound();
      addNotification('Appointment Confirmed', `Your appointment has been booked. Token: ${tokenNumber}`);
    }, 2000);
  };

  // Notification system
  const playNotificationSound = () => {
    try {
      // Create a simple notification sound
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Audio not supported');
    }
  };

  const addNotification = (title, message) => {
    const notification = {
      id: Date.now(),
      title,
      message,
      timestamp: new Date(),
      read: false
    };
    setNotifications(prev => [notification, ...prev]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  // Add family member
  const handleAddFamilyMember = () => {
    if (!newMember.name || !newMember.age) {
      setError('Please fill in required fields for family member');
      return;
    }

    const member = {
      ...newMember,
      id: Date.now().toString(),
      age: parseInt(newMember.age)
    };

    setFamilyMembers(prev => [...prev, member]);
    setNewMember({
      name: '',
      relation: 'Self',
      age: '',
      gender: 'male',
      phone: '',
      email: '',
      bloodGroup: '',
      allergies: '',
      medicalHistory: '',
      emergencyContact: { name: '', phone: '', relation: '' }
    });
    setShowAddMember(false);
    setSuccess('Family member added successfully');
  };

  // Show loading only if Clerk is still loading and no regular login
  if (!isLoaded && !isLoggedIn) {
    return (
      <div className="py-20 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-md p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading...</h2>
          <p className="text-gray-600">Please wait while we verify your authentication.</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated through either Clerk or regular login
  if (!isSignedIn && !isLoggedIn) {
    return (
      <div className="py-20 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-md p-8 max-w-md w-full text-center">
          <UserCircleIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Login Required</h2>
          <p className="text-gray-600 mb-6">Please login to access the booking dashboard.</p>
          <a
            href="/login"
            className="inline-block bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  const steps = [
    { number: 1, title: 'Department', icon: BuildingOffice2Icon },
    { number: 2, title: 'Doctor', icon: UserIcon },
    { number: 3, title: 'Date', icon: CalendarDaysIcon },
    { number: 4, title: 'Time', icon: ClockIcon },
    { number: 5, title: 'Patient', icon: UsersIcon },
    { number: 6, title: 'Payment', icon: CreditCardIcon },
    { number: 7, title: 'Confirmation', icon: CheckCircleIcon }
  ];

  // Update dashboardNavMode and navigation buttons:
  const dashboardNavMode = 'tab'; // or 'sidebar'
  const [activeSection, setActiveSection] = useState('book'); // 'book', 'history'

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-100">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200 mb-4"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back
        </button>

        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Book Your OPD Appointment
          </h1>
          {/* Removed 'View History' button */}
        </div>
      </div>

      {/* Section Navigation */}
      {dashboardNavMode === 'sidebar' && (
        <aside className="w-64 mr-8 hidden md:block">
          <nav className="bg-white rounded-xl shadow-md p-6 flex flex-col gap-4">
            <button onClick={() => setActiveSection('book')} className={`text-left px-4 py-2 rounded-lg font-semibold ${activeSection === 'book' ? 'bg-gray-200 text-black' : 'text-gray-700 hover:bg-gray-100'}`}>Book Appointment</button>
            <button onClick={() => setActiveSection('history')} className={`text-left px-4 py-2 rounded-lg font-semibold ${activeSection === 'history' ? 'bg-gray-200 text-black' : 'text-gray-700 hover:bg-gray-100'}`}>Appointment History</button>
          </nav>
        </aside>
      )}
      {dashboardNavMode === 'tab' && (
        <nav className="flex justify-center gap-4 mb-8">
          <button onClick={() => setActiveSection('book')} className={`px-6 py-3 rounded-t-lg font-semibold border-b-2 transition-colors duration-200 ${activeSection === 'book' ? 'border-black text-black bg-white' : 'border-transparent text-gray-700 hover:bg-gray-100'}`}>Book Appointment</button>
          <button onClick={() => setActiveSection('history')} className={`px-6 py-3 rounded-t-lg font-semibold border-b-2 transition-colors duration-200 ${activeSection === 'history' ? 'border-black text-black bg-white' : 'border-transparent text-gray-700 hover:bg-gray-100'}`}>Appointment History</button>
        </nav>
      )}

      {/* Section Content */}
      <div className="bg-white rounded-2xl shadow-xl p-8">
        {activeSection === 'book' && (
          <div className="flex justify-center">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-xl">
              {/* Floating Notifications */}
              {notifications.length > 0 && (
                <div className="fixed top-4 right-4 z-50 space-y-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="bg-white rounded-lg shadow-lg p-4 max-w-sm border-l-4 border-gray-400 animate-slide-in"
                    >
                      <div className="flex items-start">
                        <BellIcon className="h-5 w-5 text-gray-700 mt-0.5 mr-3" />
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-gray-900">{notification.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        </div>
                        <SpeakerWaveIcon className="h-4 w-4 text-gray-500" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Progress Steps */}
              <div className="mb-8">
                <div className="flex items-center justify-center gap-4">
                  {steps.map((step, index) => {
                    const isActive = currentStep === step.number;
                    const isCompleted = currentStep > step.number;
                    return (
                      <span
                        key={step.number}
                        className={`w-4 h-4 rounded-full ${isActive ? 'bg-black' : isCompleted ? 'bg-gray-600' : 'bg-gray-300'} transition-colors duration-200`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Error and Success Messages */}
              {error && (
                <div className="mb-6 p-4 bg-gray-100 border border-gray-400 text-gray-800 rounded-lg flex items-center">
                  <ExclamationCircleIcon className="h-5 w-5 mr-2" />
                  {error}
                  <button onClick={() => setError('')} className="ml-auto text-gray-600 hover:text-black">
                    ×
                  </button>
                </div>
              )}
              {success && (
                <div className="mb-6 p-4 bg-gray-100 border border-gray-400 text-gray-800 rounded-lg flex items-center">
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  {success}
                  <button onClick={() => setSuccess('')} className="ml-auto text-gray-600 hover:text-black">
                    ×
                  </button>
                </div>
              )}

              {/* Main Booking Flow */}
              {currentStep === 1 && (
                <DepartmentSelection
                  departments={departments}
                  onSelect={(deptId) => {
                    setBookingData(prev => ({ ...prev, departmentId: deptId }));
                    setCurrentStep(2);
                  }}
                />
              )}
              {currentStep === 2 && (
                <DoctorSelection
                  doctors={doctors.filter(d => d.department === bookingData.departmentId)}
                  onSelect={(doctorId) => {
                    setBookingData(prev => ({ ...prev, doctorId }));
                    setCurrentStep(3);
                  }}
                  onBack={() => setCurrentStep(1)}
                />
              )}
              {currentStep === 3 && (
                <DateSelection
                  onSelect={(date) => {
                    setBookingData(prev => ({ ...prev, appointmentDate: date }));
                    setCurrentStep(4);
                  }}
                  onBack={() => setCurrentStep(2)}
                />
              )}
              {currentStep === 4 && (
                <TimeSelection
                  doctorId={bookingData.doctorId}
                  generateTimeSlots={generateTimeSlots}
                  onSelect={(time) => {
                    setBookingData(prev => ({ ...prev, appointmentTime: time }));
                    setCurrentStep(5);
                  }}
                  onBack={() => setCurrentStep(3)}
                />
              )}
              {currentStep === 5 && (
                <PatientSelection
                  familyMembers={familyMembers}
                  bookingData={bookingData}
                  setBookingData={setBookingData}
                  showAddMember={showAddMember}
                  setShowAddMember={setShowAddMember}
                  newMember={newMember}
                  setNewMember={setNewMember}
                  onAddMember={handleAddFamilyMember}
                  onNext={() => setCurrentStep(6)}
                  onBack={() => setCurrentStep(4)}
                />
              )}
              {currentStep === 6 && (
                <PaymentSelection
                  bookingData={bookingData}
                  setBookingData={setBookingData}
                  doctors={doctors}
                  onBook={handleBookAppointment}
                  onBack={() => setCurrentStep(5)}
                  loading={loading}
                />
              )}
              {currentStep === 7 && (
                <BookingConfirmation
                  bookingData={bookingData}
                  onNewBooking={() => {
                    setCurrentStep(1);
                    setBookingData({
                      departmentId: '',
                      doctorId: '',
                      familyMemberId: '',
                      appointmentDate: '',
                      appointmentTime: '',
                      symptoms: '',
                      paymentMethod: 'card',
                      tokenNumber: '',
                      estimatedWaitTime: 0
                    });
                  }}
                />
              )}
            </div>
          </div>
        )}
        {activeSection === 'history' && (
          <div className="flex justify-center">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl" style={{ minHeight: '200px' }}>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Appointment History</h2>
              {appointmentHistory.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarDaysIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No previous appointments found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {appointmentHistory.map((appointment, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                            <UserIcon className="h-6 w-6 text-gray-700" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{appointment.doctorName}</h3>
                            <p className="text-sm text-gray-600">{appointment.departmentName}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.appointmentTime}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                            appointment.status === 'confirmed' ? 'bg-gray-200 text-gray-800' :
                            appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {appointment.status}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">Token: {appointment.tokenNumber}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Department Selection Component
function DepartmentSelection({ departments, onSelect }) {
  // Function to get the appropriate icon for each department
  const getDepartmentIcon = (iconType) => {
    const iconProps = "h-12 w-12 text-gray-700 mx-auto";

    switch (iconType) {
      case 'heart':
        return <HeartIcon className={iconProps} />;
      case 'medical':
        return <BeakerIcon className={iconProps} />;
      case 'bone':
        return <WrenchScrewdriverIcon className={iconProps} />;
      case 'child':
        return <FaceSmileIcon className={iconProps} />;
      case 'brain':
        return <CpuChipIcon className={iconProps} />;
      case 'hospital':
        return <BuildingOffice2Icon className={iconProps} />;
      case 'female':
        return <UserIcon className={iconProps} />;
      case 'ear':
        return <EyeIcon className={iconProps} />;
      default:
        return <BuildingOffice2Icon className={iconProps} />;
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        Select Department
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((department) => (
          <div
            key={department.id}
            onClick={() => onSelect(department.id)}
            className="p-6 border-2 border-gray-200 rounded-xl hover:border-gray-400 hover:shadow-lg transition-all duration-200 cursor-pointer group"
          >
            <div className="text-center">
              <div className="mb-4">
                {getDepartmentIcon(department.icon)}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-black">
                {department.name}
              </h3>
              <p className="text-sm text-gray-600">
                {department.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Doctor Selection Component
function DoctorSelection({ doctors, onSelect, onBack }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Select Doctor</h2>
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {doctors.map((doctor) => (
          <div
            key={doctor.id}
            onClick={() => onSelect(doctor.id)}
            className="p-6 border-2 border-gray-200 rounded-xl hover:border-black hover:shadow-lg transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                <UserIcon className="h-8 w-8 text-gray-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {doctor.name}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  {doctor.specialization}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  {doctor.experience} years experience
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <StarIcon className="h-4 w-4 text-yellow-400 mr-1" />
                    <span className="text-sm text-gray-600">{doctor.rating} ({doctor.reviews} reviews)</span>
                  </div>
                  <div className="text-lg font-semibold text-black">
                    ₹{doctor.fee}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Date Selection Component
function DateSelection({ onSelect, onBack }) {
  const [selectedDate, setSelectedDate] = useState('');

  // Generate next 30 days
  const generateDates = () => {
    const dates = [];
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }

    return dates;
  };

  const dates = generateDates();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Select Date</h2>
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {dates.map((date) => {
          const dateStr = date.toISOString().split('T')[0];
          const isToday = date.toDateString() === new Date().toDateString();
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
          const dayNumber = date.getDate();
          const monthName = date.toLocaleDateString('en-US', { month: 'short' });

          return (
            <div
              key={dateStr}
              onClick={() => {
                setSelectedDate(dateStr);
                onSelect(dateStr);
              }}
              className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 text-center ${
                selectedDate === dateStr
                  ? 'border-black bg-gray-100'
                  : 'border-gray-200 hover:border-gray-400 hover:shadow-md'
              }`}
            >
              <div className="text-sm text-gray-600 mb-1">{dayName}</div>
              <div className="text-lg font-semibold text-gray-900 mb-1">{dayNumber}</div>
              <div className="text-xs text-gray-500">{monthName}</div>
              {isToday && (
                <div className="text-xs text-black font-medium mt-1">Today</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Time Selection Component
function TimeSelection({ doctorId, generateTimeSlots, onSelect, onBack }) {
  const [selectedTime, setSelectedTime] = useState('');
  const slots = generateTimeSlots(doctorId);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Select Time Slot</h2>
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back
        </button>
      </div>

      {slots.length === 0 ? (
        <div className="text-center py-12">
          <ExclamationCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No available slots for this date</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {slots.map((slot) => (
            <div
              key={slot.time}
              onClick={() => {
                setSelectedTime(slot.time);
                onSelect(slot.time);
              }}
              className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                selectedTime === slot.time
                  ? 'border-black bg-gray-100'
                  : 'border-gray-200 hover:border-gray-400 hover:shadow-md'
              }`}
            >
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900 mb-1">
                  {slot.time}
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  ~{slot.estimatedWaitTime} min wait
                </div>
                <div className="flex items-center justify-center">
                  <CheckCircleIcon className="h-4 w-4 text-gray-600 mr-1" />
                  <span className="text-xs text-gray-600">Available</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Patient Selection Component
function PatientSelection({
  familyMembers,
  bookingData,
  setBookingData,
  showAddMember,
  setShowAddMember,
  newMember,
  setNewMember,
  onAddMember,
  onNext,
  onBack
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Select Patient & Add Symptoms</h2>
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back
        </button>
      </div>

      {/* Family Members */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Family Health Wallet</h3>
          <button
            onClick={() => setShowAddMember(true)}
            className="flex items-center text-black hover:text-gray-700 transition-colors"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Member
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {familyMembers.map((member) => (
            <div
              key={member.id}
              onClick={() => setBookingData({ ...bookingData, familyMemberId: member.id })}
              className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                bookingData.familyMemberId === member.id
                  ? 'border-black bg-gray-100'
                  : 'border-gray-200 hover:border-gray-400 hover:shadow-md'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <UserIcon className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{member.name}</h4>
                  <p className="text-sm text-gray-600">{member.relation} • {member.age} years</p>
                  <p className="text-xs text-gray-500">{member.gender}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Family Member</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Relation</label>
                  <select
                    value={newMember.relation}
                    onChange={(e) => setNewMember({ ...newMember, relation: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  >
                    <option value="Self">Self</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Child">Child</option>
                    <option value="Parent">Parent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <input
                    type="number"
                    value={newMember.age}
                    onChange={(e) => setNewMember({ ...newMember, age: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  value={newMember.gender}
                  onChange={(e) => setNewMember({ ...newMember, gender: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddMember(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onAddMember}
                className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Add Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Symptoms */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Describe Symptoms</h3>
        <textarea
          value={bookingData.symptoms}
          onChange={(e) => setBookingData({ ...bookingData, symptoms: e.target.value })}
          placeholder="Please describe the symptoms, concerns, or reason for the visit..."
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
        />
      </div>

      {/* Next Button */}
      <div className="flex justify-end">
        <button
          onClick={onNext}
          disabled={!bookingData.familyMemberId || !bookingData.symptoms.trim()}
          className="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue to Payment
        </button>
      </div>
    </div>
  );
}

// Payment Selection Component
function PaymentSelection({ bookingData, setBookingData, doctors, onBook, onBack, loading }) {
  const selectedDoctor = doctors.find(d => d.id === bookingData.doctorId);
  const consultationFee = selectedDoctor?.fee || 0;
  const platformFee = 50;
  const totalAmount = consultationFee + platformFee;

  const paymentMethods = [
    { id: 'card', name: 'Credit/Debit Card', icon: CreditCardIcon },
    { id: 'upi', name: 'UPI Payment', icon: PhoneIcon },
    { id: 'netbanking', name: 'Net Banking', icon: IdentificationIcon },
    { id: 'wallet', name: 'Digital Wallet', icon: BanknotesIcon }
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Payment & Confirmation</h2>
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment Methods */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Payment Method</h3>
          <div className="space-y-3">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              return (
                <div
                  key={method.id}
                  onClick={() => setBookingData({ ...bookingData, paymentMethod: method.id })}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                    bookingData.paymentMethod === method.id
                      ? 'border-black bg-gray-100'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="h-6 w-6 text-gray-600" />
                    <span className="font-medium text-gray-900">{method.name}</span>
                    {bookingData.paymentMethod === method.id && (
                      <CheckCircleIcon className="h-5 w-5 text-black ml-auto" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Booking Summary */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Summary</h3>
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Doctor</span>
                <span className="font-medium">{selectedDoctor?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date</span>
                <span className="font-medium">{new Date(bookingData.appointmentDate).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time</span>
                <span className="font-medium">{bookingData.appointmentTime}</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Consultation Fee</span>
                  <span className="font-medium">₹{consultationFee}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Platform Fee</span>
                  <span className="font-medium">₹{platformFee}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t pt-2 mt-2">
                  <span>Total Amount</span>
                  <span className="text-black">₹{totalAmount}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-100 rounded-lg">
            <div className="flex items-start space-x-3">
              <InformationCircleIcon className="h-5 w-5 text-gray-600 mt-0.5" />
              <div className="text-sm text-gray-800">
                <p className="font-medium mb-1">Secure Payment</p>
                <p>Your payment is secured with 256-bit SSL encryption. You can cancel your appointment up to 2 hours before the scheduled time for a full refund.</p>
              </div>
            </div>
          </div>

          <button
            onClick={onBook}
            disabled={loading}
            className="w-full mt-6 px-6 py-4 bg-black text-white rounded-xl font-semibold text-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <ShieldCheckIcon className="h-5 w-5 mr-2" />
                Confirm & Pay ₹{totalAmount}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Booking Confirmation Component
function BookingConfirmation({ bookingData, onNewBooking }) {
  return (
    <div className="text-center py-12">
      <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircleIcon className="h-12 w-12 text-black" />
      </div>

      <h2 className="text-3xl font-bold text-gray-900 mb-4">
        Booking Confirmed!
      </h2>

      <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
        Your appointment has been successfully booked. Token: <span className="font-semibold text-black">{bookingData.tokenNumber}</span>
      </p>

      <div className="bg-gray-100 rounded-xl p-6 mb-8 max-w-md mx-auto">
        <h3 className="font-semibold text-gray-800 mb-4">Appointment Details</h3>
        <div className="text-sm text-gray-700 space-y-2">
          <div className="flex justify-between">
            <span>Token Number:</span>
            <span className="font-semibold">{bookingData.tokenNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>Estimated Wait:</span>
            <span className="font-semibold">{bookingData.estimatedWaitTime} minutes</span>
          </div>
          <div className="flex justify-between">
            <span>Date:</span>
            <span className="font-semibold">{new Date(bookingData.appointmentDate).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Time:</span>
            <span className="font-semibold">{bookingData.appointmentTime}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={() => {
            // Download PDF confirmation
            const element = document.createElement('a');
            const file = new Blob([`Appointment Confirmation\nToken: ${bookingData.tokenNumber}\nDate: ${bookingData.appointmentDate}\nTime: ${bookingData.appointmentTime}`], {type: 'text/plain'});
            element.href = URL.createObjectURL(file);
            element.download = `appointment-${bookingData.tokenNumber}.txt`;
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
          }}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center"
        >
          <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
          Download Confirmation
        </button>
        <button
          onClick={onNewBooking}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
        >
          Book Another Appointment
        </button>
      </div>
    </div>
  );
}
