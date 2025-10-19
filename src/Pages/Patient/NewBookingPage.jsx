import { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useUser } from '@clerk/clerk-react';
import { AuthContext } from '../../App';
import { getCurrentUser } from '../../utils/auth';
import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../../config/api';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarDaysIcon,
  ClockIcon,
  UserCircleIcon,
  BuildingOffice2Icon,
  UserGroupIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  PlusIcon,
  XMarkIcon,
  VideoCameraIcon,
  HomeIcon
} from '@heroicons/react/24/outline';
import PrintBookingDetails from '../../Components/Patients/PrintBookingDetails.jsx';
import VideoConsultationDetails from '../../Components/Patients/VideoConsultationDetails.jsx';
import {
  DepartmentSelection,
  DoctorSelection,
  DateSelection,
  TimeSelection,
  BookingConfirmation
} from '../../Components/Patients/BookingComponents';

export default function NewBookingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const { token } = useContext(AuthContext);

  const [currentStep, setCurrentStep] = useState(() => {
    // Restore step from localStorage on component mount
    const savedStep = localStorage.getItem('bookingCurrentStep');
    return savedStep ? parseInt(savedStep) : 1;
  });
  const [loading, setLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [showAlternativeDoctors, setShowAlternativeDoctors] = useState(false);
  
  // Data states
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [availableSessions, setAvailableSessions] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [familyMembersLoading, setFamilyMembersLoading] = useState(false);
  const [availabilityRefreshing, setAvailabilityRefreshing] = useState(false);
  const [symptomAnalysis, setSymptomAnalysis] = useState(null);
  const [rescheduleFor, setRescheduleFor] = useState(null); // appointment id if rescheduling

  // Booking form data
  const [bookingData, setBookingData] = useState(() => {
    // Restore booking data from localStorage on component mount
    const savedData = localStorage.getItem('bookingData');
    return savedData ? JSON.parse(savedData) : {
      departmentId: '',
      departmentName: '',
      doctorId: '',
      doctorName: '',
      appointmentDate: '',
      appointmentTime: '',
      symptoms: '',
      familyMemberId: 'self',
      familyMemberName: '',
      familyMemberPatientId: '',
      paymentMethod: 'card',
      appointmentType: 'in-person' // Default to in-person, can be 'video'
    };
  });

  // Function to save current step to localStorage
  const saveCurrentStep = (step) => {
    setCurrentStep(step);
    localStorage.setItem('bookingCurrentStep', step.toString());
  };

  // Function to save booking data to localStorage
  const saveBookingData = (data) => {
    setBookingData(data);
    localStorage.setItem('bookingData', JSON.stringify(data));
  };

  // Function to clear booking data from localStorage
  const clearBookingData = () => {
    localStorage.removeItem('bookingData');
    localStorage.removeItem('bookingCurrentStep');
    setBookingData({
      departmentId: '',
      departmentName: '',
      doctorId: '',
      doctorName: '',
      appointmentDate: '',
      appointmentTime: '',
      symptoms: '',
      familyMemberId: 'self',
      familyMemberName: '',
      familyMemberPatientId: '',
      paymentMethod: 'card',
      appointmentType: 'in-person'
    });
    setCurrentStep(1);
  };

  // Reset booking progress when navigating away from booking page
  useEffect(() => {
    return () => {
      localStorage.removeItem('bookingData');
      localStorage.removeItem('bookingCurrentStep');
    };
  }, []);

  // Family member form
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    age: '',
    gender: 'male',
    relation: 'spouse',
    phone: '',
    bloodGroup: '',
    allergies: '',
    chronicConditions: ''
  });

  useEffect(() => {
    if (token) {
      fetchDepartments();
      
      // Simplified approach: fetch family members immediately with a small delay
      // to ensure user data is available
      const fetchDataWithDelay = () => {
        setTimeout(() => {
          fetchFamilyMembers();
        }, 100); // Small delay to ensure user data is loaded
      };
      
      fetchDataWithDelay();
      
      // Check for video consultation type
      const params = new URLSearchParams(location.search);
      const appointmentType = params.get('type');
      if (appointmentType === 'video') {
        const updatedData = {
          ...bookingData,
          appointmentType: 'video'
        };
        setBookingData(updatedData);
        saveBookingData(updatedData);
      }
      
      // Check reschedule query param
      const resId = params.get('reschedule');
      if (resId) {
        setRescheduleFor(resId);
        // Prefill existing appointment details
        const t = localStorage.getItem('token');
        axios.get(`${API_ENDPOINTS.PATIENT.APPOINTMENTS}/${resId}`, {
          headers: { Authorization: `Bearer ${t}` }
        }).then(({ data }) => {
          const apt = data.appointment;
          if (apt) {
            const newData = {
              ...bookingData,
              departmentId: apt.departmentId || '',
              departmentName: apt.departmentName || '',
              doctorId: apt.doctorId || '',
              doctorName: apt.doctorName || '',
              appointmentDate: '', // force user to pick a new date
              appointmentTime: '',
              selectedSession: null
            };
            saveBookingData(newData);
            if (apt.departmentId) {
              generateNext7Days(apt.departmentId);
              fetchDoctors(apt.departmentId);
            }
            // Ask whether to keep the same department using SweetAlert2
            Swal.fire({
              title: 'Reschedule Appointment',
              text: 'Do you want to keep the same department?',
              icon: 'question',
              showDenyButton: true,
              confirmButtonText: 'Yes, keep department',
              denyButtonText: 'No, change department',
              reverseButtons: true
            }).then((result) => {
              if (result.isConfirmed) {
                // Keep department → Date → Session → Doctor
                saveCurrentStep(3);
              } else if (result.isDenied) {
                // Change department → Symptoms → Department → Date → Session → Doctor
                const resetData = {
                  ...newData,
                  departmentId: '',
                  departmentName: '',
                  doctorId: '',
                  doctorName: '',
                  appointmentDate: '',
                  appointmentTime: '',
                  selectedSession: null
                };
                saveBookingData(resetData);
                saveCurrentStep(2);
              }
            });
          }
        }).catch(() => {
          // fallback to normal flow if fetch fails
          setRescheduleFor(null);
        });
      }
      
      // If we have saved booking data, restore the appropriate step
      const savedStep = localStorage.getItem('bookingCurrentStep');
      if (savedStep && parseInt(savedStep) > 1) {
        // If we're past step 1, we need to restore the data for that step
        const savedData = localStorage.getItem('bookingData');
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          
          // If coming from video consultation link, ensure appointment type is set
          if (appointmentType === 'video' && parsedData.appointmentType !== 'video') {
            parsedData.appointmentType = 'video';
            saveBookingData(parsedData);
          }
          
          if (parsedData.departmentId) {
            // Restore department data and prefetch dates + doctors
            generateNext7Days(parsedData.departmentId);
            fetchDoctors(parsedData.departmentId);
          }
          if (parsedData.appointmentDate) {
            // Restore session data for the stored date
            fetchRealSessionData(parsedData.departmentId, parsedData.appointmentDate);
          }
        }
      }
    }
  }, [token]);

  // Listen for localStorage changes to detect when user data becomes available
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'user' && e.newValue && token) {
        console.log('User data updated in localStorage, fetching family members');
        try {
          const userData = JSON.parse(e.newValue);
          if (userData && userData.name) {
            fetchFamilyMembers();
          }
        } catch (error) {
          console.error('Error parsing updated user data:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [token]);

  // Periodic refresh of availability data to prevent stale data
  useEffect(() => {
    if (bookingData.departmentId && bookingData.appointmentDate && currentStep >= 5) {
      const refreshInterval = setInterval(() => {
        console.log('Refreshing availability data to prevent stale data');
        fetchRealSessionData(bookingData.departmentId, bookingData.appointmentDate, true);
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(refreshInterval);
    }
  }, [bookingData.departmentId, bookingData.appointmentDate, currentStep]);

  // Cleanup effect to clear family members on unmount
  useEffect(() => {
    return () => {
      setFamilyMembers([]);
    };
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_ENDPOINTS.PATIENT.DEPARTMENTS, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDepartments(response.data.departments || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async (departmentId) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_ENDPOINTS.PATIENT.DOCTORS}/${departmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDoctors(response.data.doctors || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateNext7Days = async (departmentId) => {
    const dates = [];
    const today = new Date();
    
    // Generate the 7 days first
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Use local date to avoid UTC shift (matches backend formatting)
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      const isToday = i === 0;
      
      dates.push({
        date: dateStr,
        dayName: dayName,
        isToday: isToday,
        availableSessions: 0,
        totalSessions: 0,
        availableSlots: 0,
        totalSlots: 0
      });
    }

    // Fetch real slot data for each date and only keep dates with slots
    if (departmentId) {
      await fetchRealSlotDataForDates(dates, departmentId);
    } else {
      setAvailableDates([]);
    }
  };

  const fetchRealSlotDataForDates = async (dates, departmentId) => {
    try {
      if (!departmentId) {
        console.error('No department ID provided for fetching slot data');
        return;
      }

      // Fetch slot data for each date in parallel
      const slotPromises = dates.map(async (dateObj) => {
        try {
          const res = await axios.get(`${API_BASE_URL}/api/patient/departments/${departmentId}/available-dates`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { date: dateObj.date }
          });
          
          const dateData = res.data.availableDates?.find(d => d.date === dateObj.date);
          if (dateData && (dateData.availableSlots || 0) > 0) {
            return {
              ...dateObj,
              availableSlots: dateData.availableSlots || 0,
              totalSlots: dateData.totalSlots || 0,
              availableSessions: dateData.availableSessions || 0,
              totalSessions: dateData.totalSessions || 0
            };
          }
          // No slots for this date -> exclude by returning null
          return null;
        } catch (error) {
          console.error(`Error fetching slots for ${dateObj.date}:`, error);
          return null; // Exclude on error to avoid showing false availability
        }
      });
      
      const updatedDates = (await Promise.all(slotPromises)).filter(Boolean);
      setAvailableDates(updatedDates);
    } catch (error) {
      console.error('Error fetching real slot data:', error);
    }
  };

  const fetchDepartmentAvailableDates = async (departmentId) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/patient/departments/${departmentId}/available-dates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvailableDates(res.data.availableDates || []);
    } catch (error) {
      console.error('Error fetching department available dates:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartmentAvailableSessions = async (departmentId, date) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/patient/departments/${departmentId}/availability/${date}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvailableSessions(res.data.sessions || []);
    } catch (error) {
      console.error('Error fetching department available sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRealSessionData = async (departmentId, date, showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setAvailabilityRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const res = await axios.get(`${API_BASE_URL}/api/patient/departments/${departmentId}/availability/${date}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const sessions = res.data.sessions || [];
      setAvailableSessions(sessions);
    } catch (error) {
      console.error('Error fetching real session data:', error);
      // Fallback to empty sessions if API fails
      setAvailableSessions([]);
    } finally {
      if (showRefreshIndicator) {
        setAvailabilityRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const fetchDoctorCountsForSessions = async (departmentId, date, sessions) => {
    try {
      // Fetch doctor counts for both sessions in parallel
      const [morningRes, afternoonRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/patient/departments/${departmentId}/available-doctors`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { date, time: '09:00' }
        }).catch(() => ({ data: { doctors: [] } })),
        axios.get(`${API_BASE_URL}/api/patient/departments/${departmentId}/available-doctors`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { date, time: '14:00' }
        }).catch(() => ({ data: { doctors: [] } }))
      ]);

      const morningDoctors = morningRes.data.doctors || [];
      const afternoonDoctors = afternoonRes.data.doctors || [];

      // Update sessions with actual doctor counts
      setAvailableSessions(prev => prev.map(session => {
        if (session.id === 'morning') {
          return { ...session, doctorCount: morningDoctors.length, availableDoctors: morningDoctors };
        } else if (session.id === 'afternoon') {
          return { ...session, doctorCount: afternoonDoctors.length, availableDoctors: afternoonDoctors };
        }
        return session;
      }));
    } catch (error) {
      console.error('Error fetching doctor counts for sessions:', error);
      // Set all sessions to 0 doctors on error
      setAvailableSessions(prev => prev.map(session => 
        ({ ...session, doctorCount: 0, availableDoctors: [] })
      ));
    }
  };

  const fetchAvailableDoctorsForSession = async (departmentId, date, time) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const [allDeptRes, availableRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/patient/doctors/${departmentId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/api/patient/departments/${departmentId}/available-doctors`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { date, time }
        }).catch(() => ({ data: { doctors: [] } }))
      ]);

      const allDeptDoctors = (allDeptRes.data?.doctors || []).map(d => ({
        id: d.id,
        name: d.name,
        email: d.email,
        specialization: d.specialization,
        department: d.department,
        departmentId: d.departmentId,
        experience: d.experience,
        fee: d.fee,
        profilePhoto: d.profilePhoto,
        rating: d.rating,
        reviews: d.reviews,
        isAvailable: false,
        hasAvailableSlots: false
      }));

      const availableMap = new Map((availableRes.data?.doctors || []).map(doc => [String(doc.id), doc]));
      const merged = allDeptDoctors.map(doc => availableMap.has(String(doc.id)) ? { ...doc, ...availableMap.get(String(doc.id)), isAvailable: true } : doc);
      setDoctors(merged);
      
      // Update the session with actual doctor count
      setAvailableSessions(prev => prev.map(session => 
        session.startTime === time 
          ? { ...session, doctorCount: (availableRes.data?.doctors || []).length, availableDoctors: (availableRes.data?.doctors || []) }
          : session
      ));
    } catch (error) {
      console.error('Error fetching available doctors for session:', error);
      setDoctors([]);
      // Update session to show 0 doctors on error
      setAvailableSessions(prev => prev.map(session => 
        session.startTime === time 
          ? { ...session, doctorCount: 0, availableDoctors: [] }
          : session
      ));
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableDoctorsForSlot = async (departmentId, date, time) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/patient/departments/${departmentId}/available-doctors`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { date, time }
      });
      setDoctors(res.data.doctors || []);
    } catch (error) {
      console.error('Error fetching available doctors for slot:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFamilyMembers = async () => {
    try {
      if (!token) {
        console.warn('No token available for fetching family members');
        // Clear family members if no token
        setFamilyMembers([]);
        setFamilyMembersLoading(false);
        return;
      }
      
      setFamilyMembersLoading(true);
      // Clear existing family members first to prevent cross-contamination
      setFamilyMembers([]);
      
      // Get user name from multiple sources with fallback - do this first
      let userName = 'You';
      let patientId = 'P001';
      
      // First try localStorage (most reliable after Clerk sync)
      const currentUser = getCurrentUser();
      if (currentUser?.name) {
        userName = currentUser.name;
        patientId = currentUser.patientId || 'P001';
      } else if (user?.firstName || user?.lastName) {
        // Fallback to Clerk user data
        userName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      } else if (user?.fullName) {
        // Try fullName from Clerk
        userName = user.fullName;
      }
      
      // Fallback if still no name
      if (!userName || userName.trim() === '') {
        userName = 'You';
      }
      
      // Create self member first
      const selfMember = {
        id: 'self',
        patientId: patientId,
        name: userName,
        relation: 'self',
        age: 'Adult',
        gender: 'N/A'
      };
      
      // Set self member immediately to show user data
      setFamilyMembers([selfMember]);
      
      // Ensure default selection reflects the logged-in user visibly
      setBookingData(prev => ({
        ...prev,
        familyMemberId: 'self',
        familyMemberName: userName,
        familyMemberPatientId: selfMember.patientId
      }));
      
      // Now fetch additional family members from API
      try {
        const familyResponse = await axios.get('${API_BASE_URL}/api/patient/family-members', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('=== FRONTEND FAMILY MEMBERS DEBUG ===');
        console.log('API Response:', familyResponse.data);
        console.log('Family Members from API:', familyResponse.data.familyMembers);
        
        const members = familyResponse.data.familyMembers || [];
        
        // Filter out any existing 'self' members to avoid duplicates
        const filteredMembers = members.filter(member => member.relation !== 'self');
        const finalFamilyMembers = [selfMember, ...filteredMembers];
        
        console.log('Self Member:', selfMember);
        console.log('Filtered Members:', filteredMembers);
        console.log('Final Family Members List:', finalFamilyMembers);
        
        setFamilyMembers(finalFamilyMembers);
      } catch (apiError) {
        console.error('Error fetching additional family members from API:', apiError);
        // Keep the self member that was already set
      }
      
    } catch (error) {
      console.error('Error in fetchFamilyMembers:', error);
      // Set a fallback self member even if everything fails
      let userName = 'You';
      let patientId = 'P001';
      
      // First try localStorage (most reliable after Clerk sync)
      const currentUser = getCurrentUser();
      if (currentUser?.name) {
        userName = currentUser.name;
        patientId = currentUser.patientId || 'P001';
      } else if (user?.firstName || user?.lastName) {
        // Fallback to Clerk user data
        userName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      } else if (user?.fullName) {
        // Try fullName from Clerk
        userName = user.fullName;
      }
      
      const selfMember = {
        id: 'self',
        patientId: patientId,
        name: userName,
        relation: 'self',
        age: 'Adult',
        gender: 'N/A'
      };
      setFamilyMembers([selfMember]);
    } finally {
      setFamilyMembersLoading(false);
    }
  };

  const analyzeSymptoms = async (symptoms) => {
    try {
      setLoading(true);
      const response = await axios.post('${API_BASE_URL}/api/patient/analyze-symptoms', {
        symptoms
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSymptomAnalysis(response.data.analysis);
      return response.data.analysis;
    } catch (error) {
      console.error('Error analyzing symptoms:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelect = (member) => {
    const updatedData = {
      ...bookingData,
      familyMemberId: member.id,
      familyMemberName: member.name,
      familyMemberPatientId: member.patientId
    };
    setBookingData(updatedData);
    saveBookingData(updatedData);
    setCurrentStep(2);
  };

  const handleAppointmentTypeSelect = (type) => {
    const updatedData = {
      ...bookingData,
      appointmentType: type
    };
    setBookingData(updatedData);
    saveBookingData(updatedData);
    setCurrentStep(3);
  };

  const handleSymptomsSubmit = async (symptoms) => {
    setBookingData(prev => ({ ...prev, symptoms }));
    // Optional analysis; do not force step change
    await analyzeSymptoms(symptoms);
  };

  const handleDepartmentSelect = async (department) => {
    // Optimistically update UI to reduce perceived lag
    const newData = {
      ...bookingData,
      departmentId: department.id,
      departmentName: department.name,
      // reset downstream selections when department changes
      doctorId: '',
      doctorName: '',
      appointmentDate: '',
      appointmentTime: '',
      selectedSession: null
    };
    saveBookingData(newData);
    saveCurrentStep(4);
    // Preload dates and doctors without blocking UI
    generateNext7Days(department.id);
    fetchDoctors(department.id);
  };

  const handleDoctorSelect = (doctor) => {
    const newData = {
      ...bookingData,
      doctorId: doctor.id,
      doctorName: doctor.name
    };
    saveBookingData(newData);
    saveCurrentStep(7); // Go directly to payment/confirmation
  };

  const handleDateSelect = async (date) => {
    const newData = {
      ...bookingData,
      appointmentDate: date
    };
    saveBookingData(newData);
    saveCurrentStep(5);
    // Fetch real session data from backend
    await fetchRealSessionData(newData.departmentId, date);
  };

  const handleSessionSelect = async (session) => {
    // First refresh the session data to ensure we have the latest availability
    await fetchRealSessionData(bookingData.departmentId, bookingData.appointmentDate);
    
    // Find the updated session with current availability
    const updatedSessions = await axios.get(`${API_BASE_URL}/api/patient/departments/${bookingData.departmentId}/availability/${bookingData.appointmentDate}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const currentSession = updatedSessions.data.sessions?.find(s => s.startTime === session.startTime);
    if (!currentSession || currentSession.doctorCount === 0) {
      setBookingError('This time slot is no longer available. Please select another time.');
      return;
    }
    
    const newData = {
      ...bookingData,
      selectedSession: currentSession,
      appointmentTime: currentSession.startTime // Store session start time
    };
    saveBookingData(newData);
    
    // Merge all department doctors with currently available doctors for this session
    try {
      const token = localStorage.getItem('token');
      const [allDeptRes, availableRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/patient/doctors/${newData.departmentId}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        currentSession.availableDoctors
          ? Promise.resolve({ data: { doctors: currentSession.availableDoctors } })
          : axios.get(`${API_BASE_URL}/api/patient/departments/${newData.departmentId}/available-doctors`, {
              headers: { Authorization: `Bearer ${token}` },
              params: { date: newData.appointmentDate, time: currentSession.startTime }
            }).catch(() => ({ data: { doctors: [] } }))
      ]);

      const allDeptDoctors = (allDeptRes.data?.doctors || []).map(d => ({
        id: d.id,
        name: d.name,
        email: d.email,
        specialization: d.specialization,
        department: d.department,
        departmentId: d.departmentId,
        experience: d.experience,
        fee: d.fee,
        profilePhoto: d.profilePhoto,
        rating: d.rating,
        reviews: d.reviews,
        isAvailable: false,
        hasAvailableSlots: false
      }));

      const availableMap = new Map((availableRes.data?.doctors || []).map(doc => [String(doc.id), doc]));
      const merged = allDeptDoctors.map(doc => {
        const avail = availableMap.get(String(doc.id));
        return avail ? { ...doc, ...avail, isAvailable: true } : doc;
      });
      setDoctors(merged);
    } catch (e) {
      // Fallback to available-only if merge fails
      if (session.availableDoctors && session.availableDoctors.length > 0) {
        setDoctors(session.availableDoctors);
      } else {
        await fetchAvailableDoctorsForSession(newData.departmentId, newData.appointmentDate, session.startTime);
      }
    }
    saveCurrentStep(6);
  };

  const handleAutoAssign = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/api/patient/departments/${bookingData.departmentId}/auto-assign`, {
        date: bookingData.appointmentDate,
        sessionId: bookingData.selectedSession.id,
        familyMemberId: bookingData.familyMemberId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const { assignedDoctor, reason } = response.data;
      
      setBookingData(prev => ({
        ...prev,
        doctorId: assignedDoctor.id,
        doctorName: assignedDoctor.name,
        autoAssigned: true,
        autoAssignReason: reason
      }));

      setCurrentStep(7); // Skip doctor selection, go to payment
    } catch (error) {
      console.error('Auto-assign error:', error);
      setBookingError(error.response?.data?.message || 'Auto-assignment failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFamilyMemberSelect = (member) => {
    setBookingData(prev => ({
      ...prev,
      familyMemberId: member.id,
      familyMemberName: member.name,
      familyMemberPatientId: member.patientId
    }));
  };

  const handleAddFamilyMember = async () => {
    try {
      console.log('Adding family member:', newMember);
      console.log('Using token:', token ? 'Token present' : 'No token');
      
      // Validate required fields
      if (!newMember.name.trim() || !newMember.age) {
        alert('Please fill in name and age');
        return;
      }
      
      const response = await axios.post('${API_BASE_URL}/api/patient/family-members', newMember, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const addedMember = response.data.familyMember;
      // Ensure the added member has all required fields
      const memberWithDefaults = {
        ...addedMember,
        patientId: addedMember.patientId || 'FM0000'
      };
      
      // Add the new member to the existing list (excluding self)
      setFamilyMembers(prev => {
        const filteredPrev = prev.filter(member => member.relation !== 'self');
        return [...prev.slice(0, 1), ...filteredPrev, memberWithDefaults];
      });
      
      setNewMember({ 
        name: '', 
        age: '', 
        gender: 'male', 
        relation: 'spouse', 
        phone: '',
        bloodGroup: '',
        allergies: '',
        chronicConditions: ''
      });
      setShowAddMember(false);
      alert('Family member added successfully!');
    } catch (error) {
      console.error('Error adding family member:', error);
      alert('Error adding family member: ' + (error.response?.data?.message || 'Unknown error'));
    }
  };

  const handleBookAppointment = async () => {
    try {
      setLoading(true);
      setBookingError('');
      
      // Validate required fields before proceeding to payment
      if (!bookingData.departmentId || !bookingData.doctorId || !bookingData.appointmentDate || !bookingData.appointmentTime) {
        setBookingError('Please select department, doctor, date and time before confirming.');
        setLoading(false);
        return;
      }

      // Double-check slot availability before proceeding to payment
      try {
        const availabilityCheck = await axios.get(`${API_BASE_URL}/api/patient/doctors/${bookingData.doctorId}/availability/${bookingData.appointmentDate}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const availableSlots = availabilityCheck.data.slots || [];
        const isSlotStillAvailable = availableSlots.some(slot => slot.time === bookingData.appointmentTime && slot.available);
        
        if (!isSlotStillAvailable) {
          setBookingError('This time slot is no longer available. Please select another time or try a different doctor.');
          setLoading(false);
          
          // Refresh the availability data to show current state
          await fetchRealSessionData(bookingData.departmentId, bookingData.appointmentDate);
          return;
        }
      } catch (availabilityError) {
        console.error('Error checking slot availability:', availabilityError);
        // Continue with payment flow - backend will handle the final check during payment
      }

      // Don't save to database yet - just proceed to payment step
      // Database will be saved only after successful payment
      setBookingData(prev => ({
        ...prev,
        paymentStatus: 'pending'
      }));

      saveCurrentStep(7);

      // Payment will be handled by the PaymentStep component
    } catch (error) {
      console.error('Error preparing appointment:', error);
      const errorMessage = error.response?.data?.message || 'Unable to prepare appointment';
      const sessionCapacity = error.response?.data?.sessionCapacity;
      
      if (sessionCapacity) {
        setBookingError(`${errorMessage}\n\nSession Details:\n• ${sessionCapacity.session} session (${sessionCapacity.sessionTime})\n• Current bookings: ${sessionCapacity.current}/${sessionCapacity.max} patients\n\nSuggestions:\n• Try a different time slot\n• Choose another doctor in the same department\n• Book for a different date`);
        setShowAlternativeDoctors(true);
      } else {
        setBookingError(errorMessage);
        setShowAlternativeDoctors(false);
      }
    } finally {
      setLoading(false);
    }
  };

  // (SweetAlert2 handles reschedule choice inline)

  const handlePrevStep = () => {
    if (currentStep === 2) {
      saveCurrentStep(1);
      return;
    }
    if (currentStep > 1) {
      saveCurrentStep(currentStep - 1);
    }
  };

  const getStepTitle = () => {
    const titles = {
      1: 'Select Patient',
      2: 'Appointment Type',
      3: 'Symptoms and Department',
      4: 'Pick Date (Next 7 Days)',
      5: 'Select Session',
      6: 'Select Doctor',
      7: 'Payment & Confirmation'
    };
    return titles[currentStep];
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Book New Appointment</h1>
              <p className="text-gray-600 mt-1">{getStepTitle()}</p>
            </div>
            {currentStep > 1 && currentStep < 8 && (
              <button
                onClick={handlePrevStep}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeftIcon className="h-5 w-5" />
                <span>Back</span>
              </button>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5, 6, 7].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                      step <= currentStep
                        ? 'bg-black text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {step}
                  </div>
                  {step < 7 && (
                    <div
                      className={`w-12 h-1 mx-2 ${
                        step < currentStep ? 'bg-black' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* SweetAlert2 reschedule choice is shown programmatically; no inline UI here */}
          {/* Step 1: Select Patient */}
          {currentStep === 1 && (
            <PatientSelection
              familyMembers={familyMembers}
              selectedMemberId={bookingData.familyMemberId}
              onSelect={handlePatientSelect}
              showAddMember={showAddMember}
              setShowAddMember={setShowAddMember}
              newMember={newMember}
              setNewMember={setNewMember}
              onAddMember={handleAddFamilyMember}
              onRefresh={fetchFamilyMembers}
              loading={familyMembersLoading}
            />
          )}

          {/* Step 2: Appointment Type Selection */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Choose Appointment Type</h2>
              <p className="text-gray-600 mb-8">
                Select how you would like to consult with your doctor.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div
                  onClick={() => handleAppointmentTypeSelect('in-person')}
                  className={`p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    bookingData.appointmentType === 'in-person'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      bookingData.appointmentType === 'in-person'
                        ? 'bg-blue-500 text-white'
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      <HomeIcon className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">In-Person Visit</h3>
                      <p className="text-sm text-gray-600">Visit our clinic for a traditional consultation</p>
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => handleAppointmentTypeSelect('video')}
                  className={`p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    bookingData.appointmentType === 'video'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      bookingData.appointmentType === 'video'
                        ? 'bg-purple-500 text-white'
                        : 'bg-purple-100 text-purple-600'
                    }`}>
                      <VideoCameraIcon className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Video Consultation</h3>
                      <p className="text-sm text-gray-600">Consult from the comfort of your home</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Symptoms (optional) + Choose Department */}
          {currentStep === 3 && (
            <>
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-blue-800 text-sm">
                  Unsure which department to choose? Provide a brief description of symptoms below and we’ll recommend the most suitable department. You can also skip this and pick a department directly.
                </p>
              </div>
              <div className="mb-6">
            <SymptomsInput
              symptoms={bookingData.symptoms}
              onChange={(symptoms) => setBookingData(prev => ({ ...prev, symptoms }))}
              onNext={handleSymptomsSubmit}
            />
              </div>
            <DepartmentSuggestion
              analysis={symptomAnalysis}
              departments={departments}
              onSelect={handleDepartmentSelect}
              loading={loading}
            />
            </>
          )}

          {/* Step 4: Select Date */}
          {currentStep === 4 && (
            <DateSelection
              dates={availableDates}
              selectedDoctor={bookingData.departmentName}
              onSelect={handleDateSelect}
              loading={loading}
            />
          )}

          {/* Step 5: Select Session */}
          {currentStep === 5 && (
            <>
              {availabilityRefreshing && (
                <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Refreshing availability data...
                </div>
              )}
              {!!bookingError && (
                <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded">
                  {bookingError}
                </div>
              )}
              <TimeSelection
                sessions={availableSessions}
                selectedDate={bookingData.appointmentDate}
                onSelect={handleSessionSelect}
                loading={loading}
              />
            </>
          )}

          {/* Step 6: Doctor Selection */}
          {currentStep === 6 && (
            <>
              {!!bookingError && (
                <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded">
                  {bookingError}
                </div>
              )}
              
              {/* Session Info Header */}
              <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{bookingData.selectedSession?.name}</h3>
                    <p className="text-gray-600">{bookingData.selectedSession?.displayTime}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{doctors.length}</div>
                    <div className="text-sm text-gray-500">doctors available</div>
                  </div>
                </div>
              </div>
              
              <DoctorSelection
                doctors={doctors}
                selectedDepartment={bookingData.departmentName}
                onSelect={async (doctor) => {
                  try {
                    const token = localStorage.getItem('token');
                    
                    // Build query parameters, handling 'self' case properly
                    const params = new URLSearchParams({
                      date: bookingData.appointmentDate,
                      doctorId: doctor.id
                    });
                    
                    // Only add familyMemberId if it's not 'self' and not null/undefined
                    if (bookingData.familyMemberId && bookingData.familyMemberId !== 'self') {
                      params.append('familyMemberId', bookingData.familyMemberId);
                    }
                    
                    console.log('Checking conflict with params:', params.toString());
                    
                    const res = await axios.get(`${API_BASE_URL}/api/patient/appointments/conflict?${params.toString()}`, { 
                      headers: { Authorization: `Bearer ${token}` },
                      timeout: 10000 // 10 second timeout
                    });
                    
                    if (res.data?.conflict) {
                      setBookingError(res.data.message || 'You already have an appointment with this doctor on this date');
                      return; // block selecting same doctor for same date
                    }
                    
                    setBookingError('');
                    handleDoctorSelect(doctor);
                  } catch (e) {
                    console.error('Conflict check error:', e);
                    
                    // Provide more specific error messages based on the error type
                    if (e.code === 'ECONNABORTED' || e.message.includes('timeout')) {
                      setBookingError('Request timed out. Please check your connection and try again.');
                    } else if (e.response?.status === 500) {
                      setBookingError('Server error during availability check. Please try again.');
                    } else if (e.response?.status === 400) {
                      setBookingError('Invalid request parameters. Please refresh and try again.');
                    } else if (e.response?.status === 401) {
                      setBookingError('Authentication error. Please log in again.');
                    } else {
                      setBookingError('Unable to verify availability. Please try again.');
                    }
                  }
                }}
                onAutoAssign={handleAutoAssign}
                loading={loading}
              />
            </>
          )}


          {/* Show errors (including on step 7 before booking) */}
          {!!bookingError && (
            <div className="mt-4 mb-4 p-4 bg-yellow-100 text-yellow-800 rounded-lg border border-yellow-200">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-600 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-yellow-800 mb-2">Booking Not Available</h3>
                  <div className="text-sm text-yellow-700 whitespace-pre-line mb-3">
                    {bookingError}
                  </div>
                  
                  {showAlternativeDoctors && (
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => {
                          setShowAlternativeDoctors(false);
                          setBookingError('');
                          saveCurrentStep(6); // Go back to doctor selection
                        }}
                        className="inline-flex items-center px-3 py-2 border border-yellow-300 text-sm font-medium rounded-md text-yellow-800 bg-yellow-50 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                      >
                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        Try Different Doctor
                      </button>
                      
                      <button
                        onClick={() => {
                          setBookingError('');
                          // Refresh the current page data
                          window.location.reload();
                        }}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                      >
                        <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh Page
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 7: Confirm & Book */}
          {currentStep === 7 && bookingData.paymentStatus !== 'pending' && !bookingData.tokenNumber && (
            <PreBookingConfirmation
              bookingData={bookingData}
              onConfirm={handleBookAppointment}
              loading={loading}
            />
          )}

          {/* Step 7: Payment Step */}
          {currentStep === 7 && bookingData.paymentStatus === 'pending' && (
            <PaymentStep
              bookingData={bookingData}
              setBookingData={setBookingData}
              bookingError={bookingError}
              onClearError={() => setBookingError('')}
              onPaid={() => setBookingData(prev => ({ ...prev, paymentStatus: 'paid' }))}
            />
          )}

          {/* Step 7: Booking Confirmed + Success */}
          {currentStep === 7 && bookingData.paymentStatus === 'paid' && bookingData.tokenNumber && (
            <BookingSuccess
              bookingData={bookingData}
              user={user}
              onNewBooking={() => {
                setCurrentStep(1);
                setBookingData({
                  departmentId: '',
                  departmentName: '',
                  doctorId: '',
                  doctorName: '',
                  appointmentDate: '',
                  appointmentTime: '',
                  symptoms: '',
                  familyMemberId: 'self',
                  familyMemberName: '',
                  familyMemberPatientId: '',
                  paymentMethod: 'card'
                });
                setSymptomAnalysis(null);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Symptoms Input Component
function SymptomsInput({ symptoms, onChange, onNext }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Describe Symptoms</h2>
      <textarea
        value={symptoms}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Please describe the symptoms, concerns, or reason for the visit..."
        rows={6}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
      />
      <div className="flex justify-end mt-6">
        <button
          onClick={() => onNext(typeof symptoms === 'string' ? symptoms : String(symptoms || ''))}
          disabled={!String(symptoms || '').trim()}
          className="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

// Patient Selection Component
function PatientSelection({ 
  familyMembers, 
  selectedMemberId, 
  onSelect, 
  showAddMember, 
  setShowAddMember, 
  newMember, 
  setNewMember, 
  onAddMember, 
  onRefresh,
  loading 
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Select Patient</h2>
      
      {/* Family Members */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {loading ? (
          <div className="col-span-2 flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            <span className="ml-3 text-gray-600">Loading patients...</span>
          </div>
        ) : (
          familyMembers.map((member, index) => (
          <div
            key={member.id || `member-${index}`}
            onClick={() => onSelect(member)}
            className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
              selectedMemberId === member.id
                ? 'border-black bg-gray-50'
                : 'border-gray-200 hover:border-gray-400 hover:shadow-md'
            }`}
          >
            <div className="flex items-center space-x-3">
              <UserCircleIcon className="h-8 w-8 text-gray-600" />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{member.name}</h3>
                  {member.relation === 'self' && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-black text-white">You</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 capitalize">{member.relation}</p>
                <p className="text-sm text-gray-500">{member.age} years, {member.gender}</p>
                {member.patientId && (
                  <p className="text-xs text-blue-600 font-medium">Patient ID: {member.patientId}</p>
                )}
              </div>
              {selectedMemberId === member.id && (
                <CheckCircleIcon className="h-6 w-6 text-black ml-auto" />
              )}
            </div>
          </div>
          ))
        )}
      </div>

      {/* Add Family Member */}
      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Family Members</h3>
        </div>
        {!showAddMember ? (
          <button
            onClick={() => setShowAddMember(true)}
            className="flex items-center space-x-2 text-black hover:text-gray-700"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Add Family Member</span>
          </button>
        ) : (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Add Family Member</h3>
              <button
                onClick={() => setShowAddMember(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Name"
                value={newMember.name}
                onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
              <input
                type="number"
                placeholder="Age"
                value={newMember.age}
                onChange={(e) => setNewMember(prev => ({ ...prev, age: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
              <select
                value={newMember.gender}
                onChange={(e) => setNewMember(prev => ({ ...prev, gender: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              <select
                value={newMember.relation}
                onChange={(e) => setNewMember(prev => ({ ...prev, relation: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="spouse">Spouse</option>
                <option value="child">Child</option>
                <option value="parent">Parent</option>
                <option value="sibling">Sibling</option>
                <option value="other">Other</option>
              </select>
              <input
                type="tel"
                placeholder="Phone (optional)"
                value={newMember.phone}
                onChange={(e) => setNewMember(prev => ({ ...prev, phone: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent md:col-span-2"
              />
            </div>
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setShowAddMember(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={onAddMember}
                disabled={!newMember.name || !newMember.age}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Member
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

// Department Suggestion Component
function DepartmentSuggestion({ analysis, departments, onSelect, loading }) {
  if (!analysis) {
    return (
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Choose Department</h2>
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-blue-800 text-sm">
            If you're unsure which department to pick, describe your symptoms above to get smart recommendations.
          </p>
        </div>
        {/* Browse All Departments */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <div
              key={dept.id}
              onClick={() => onSelect(dept)}
              className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-gray-400 hover:shadow-sm transition-all"
            >
              <h4 className="font-medium text-gray-900 text-sm">{dept.name}</h4>
              <p className="text-xs text-gray-600 mt-1">{dept.description}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Choose Department</h2>
      
      {/* Analysis Results */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">Symptom Analysis</h3>
        <p className="text-blue-800 text-sm mb-2">{analysis.reasoning}</p>
        <div className="flex items-center space-x-4 text-sm">
          <span className="text-blue-700">Confidence: {Math.round(analysis.confidence * 100)}%</span>
          {analysis.matchedSymptoms.length > 0 && (
            <span className="text-blue-700">Matched: {analysis.matchedSymptoms.join(', ')}</span>
          )}
        </div>
      </div>

      {/* Primary Department */}
      {analysis.primaryDepartment && (
        <div className="mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Recommended Department</h3>
          <div
            onClick={() => onSelect(analysis.primaryDepartment)}
            className="p-4 border-2 border-green-500 bg-green-50 rounded-xl cursor-pointer hover:bg-green-100 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-green-900">{analysis.primaryDepartment.name}</h4>
                <p className="text-sm text-green-700">{analysis.primaryDepartment.description}</p>
              </div>
              <div className="text-green-600">
                <span className="text-xs bg-green-200 px-2 py-1 rounded-full">Recommended</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Related Departments */}
      {analysis.relatedDepartments && analysis.relatedDepartments.length > 0 && (
        <div>
          <h3 className="font-medium text-gray-900 mb-3">Alternative Departments</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysis.relatedDepartments.map((dept) => (
              <div
                key={dept.id}
                onClick={() => onSelect(dept)}
                className="p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-gray-400 hover:shadow-md transition-all"
              >
                <h4 className="font-semibold text-gray-900">{dept.name}</h4>
                <p className="text-sm text-gray-600">{dept.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Browse All Departments */}
      <div className="mt-8 pt-6 border-t">
        <h3 className="font-medium text-gray-900 mb-3">Browse All Departments</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <div
              key={dept.id}
              onClick={() => onSelect(dept)}
              className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-gray-400 hover:shadow-sm transition-all"
            >
              <h4 className="font-medium text-gray-900 text-sm">{dept.name}</h4>
              <p className="text-xs text-gray-600 mt-1">{dept.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Pre-Booking Confirmation Component
function PreBookingConfirmation({ bookingData, onConfirm, loading }) {
  const formatLocalYMD = (ymd) => {
    if (!ymd) return '';
    const parts = String(ymd).split('-').map(Number);
    if (parts.length === 3 && parts.every(n => !Number.isNaN(n))) {
      const dt = new Date(parts[0], parts[1] - 1, parts[2]);
      return dt.toLocaleDateString();
    }
    // fallback
    try { return new Date(ymd).toLocaleDateString(); } catch { return String(ymd); }
  };
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Confirm Booking</h2>
      
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Appointment Details</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Patient:</span>
            <span className="font-medium">{bookingData.familyMemberName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Doctor:</span>
            <span className="font-medium">{bookingData.doctorName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Department:</span>
            <span className="font-medium">{bookingData.departmentName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Date:</span>
            <span className="font-medium">{formatLocalYMD(bookingData.appointmentDate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Time:</span>
            <span className="font-medium">{bookingData.appointmentTime}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Appointment Type:</span>
            <span className="font-medium">
              {bookingData.appointmentType === 'video' ? 'Video Consultation' : 'In-Person Visit'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Symptoms:</span>
            <span className="font-medium text-right max-w-xs">{bookingData.symptoms}</span>
          </div>
          {bookingData.appointmentType === 'video' && (bookingData.meetingLink || bookingData.meeting_link) && (
            <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="font-semibold text-purple-900 mb-2">Video Consultation Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-purple-700">Meeting Link:</span>
                  <a 
                    href={(bookingData.meetingLink || bookingData.meeting_link).meetingUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:text-purple-800 underline break-all"
                  >
                    Join Video Call
                  </a>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700">Meeting ID:</span>
                  <span className="font-mono text-purple-900">{(bookingData.meetingLink || bookingData.meeting_link).meetingId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700">Password:</span>
                  <span className="font-mono text-purple-900">{(bookingData.meetingLink || bookingData.meeting_link).meetingPassword}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onConfirm}
          disabled={loading}
          className="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Confirm Payment'}
        </button>
      </div>
    </div>
  );
}

// Booking Success Component
function BookingSuccess({ bookingData, onNewBooking, user }) {
  return (
    <div className="text-center">
      <div className="mb-6">
        <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Appointment Booked Successfully!</h2>
        <p className="text-gray-600">Your appointment has been confirmed.</p>
      </div>

      {/* Video Consultation Details */}
      {bookingData.appointmentType === 'video' && (bookingData.meetingLink || bookingData.meeting_link) && (
        <VideoConsultationDetails
          meetingLink={bookingData.meetingLink || bookingData.meeting_link}
          appointmentDate={bookingData.appointmentDate}
          appointmentTime={bookingData.appointmentTime}
          doctorName={bookingData.doctorName}
          patientName={bookingData.familyMemberName}
        />
      )}

      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
        <h3 className="font-semibold text-green-900 mb-4">Booking Details</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-green-700">Token Number:</span>
            <span className="font-medium text-green-900">{bookingData.tokenNumber}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-green-700">Patient:</span>
            <div className="flex items-center space-x-2">
              <span className="font-medium text-green-900">{bookingData.familyMemberName}</span>
              {(user?.profilePhoto || user?.profile_photo) ? (
                <img
                  src={(user.profilePhoto || user.profile_photo).startsWith('http') 
                    ? (user.profilePhoto || user.profile_photo)
                    : `${API_BASE_URL}${user.profilePhoto || user.profile_photo}`
                  }
                  alt="Profile"
                  className="h-6 w-6 rounded-full object-cover border border-white shadow-sm"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
              ) : null}
              <UserCircleIcon 
                className={`h-6 w-6 text-gray-400 ${(user?.profilePhoto || user?.profile_photo) ? 'hidden' : 'block'}`} 
              />
            </div>
          </div>
          <div className="flex justify-between">
            <span className="text-green-700">Doctor:</span>
            <span className="font-medium text-green-900">{bookingData.doctorName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-700">Date & Time:</span>
            <span className="font-medium text-green-900">
              {new Date(bookingData.appointmentDate).toLocaleDateString()} at {bookingData.appointmentTime}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-700">Appointment Type:</span>
            <span className="font-medium text-green-900">
              {bookingData.appointmentType === 'video' ? 'Video Consultation' : 'In-Person Visit'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-center space-x-4">
        <PrintBookingDetails 
          bookingData={bookingData} 
          user={user}
          onPrint={() => {
            // Optional: Add any analytics or tracking here
            console.log('Booking details printed');
          }}
        />
        <button
          onClick={() => navigate('/appointments')}
          className="px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
        >
          View My Appointments
        </button>
        <button
          onClick={onNewBooking}
          className="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
        >
          Book Another Appointment
        </button>
      </div>
    </div>
  );
}

// Payment Step Component
function PaymentStep({ bookingData, onPaid, setBookingData, bookingError, onClearError }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [keyId, setKeyId] = useState('');
  // No dummy modal for professional Razorpay UI

  useEffect(() => {
    const init = async () => {
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get('${API_BASE_URL}/api/patient/payment/key', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setKeyId(data.keyId || 'rzp_test_dummy_key');
      } catch (e) {
        setKeyId('rzp_test_dummy_key');
      }
    };
    init();
  }, []);

  const openRazorpay = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      // 1) Create order (or dummy order)
      const amount = bookingData.fee || bookingData.doctorFee || 500;
      const { data: orderRes } = await axios.post('${API_BASE_URL}/api/patient/payment/create-order', {
        amount,
        currency: 'INR',
        receipt: `apt_${bookingData.tokenNumber || Date.now()}`
      }, { headers: { Authorization: `Bearer ${token}` } });

      const order = orderRes.order;

      // 2) Ensure Razorpay script is loaded
      if (!window.Razorpay) {
        try {
          await loadRazorpayScript('https://checkout.razorpay.com/v1/checkout.js');
        } catch (e) {
          setError('Failed to load Razorpay checkout. Check your network.');
          return;
        }
      }

      // 3) If backend returned dummy, keys are missing → show config error
      if (orderRes.dummy) {
        setError('Razorpay keys not configured. Add RAZORPAY_KEY_ID/SECRET in backend and restart.');
        return;
      }

      const options = {
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'Clinic Appointment',
        description: 'Consultation Fee',
        order_id: order.id,
        handler: async function (response) {
          try {
            // First create the appointment in the database
            const appointmentData = {
              doctorId: bookingData.doctorId,
              departmentId: bookingData.departmentId,
              appointmentDate: bookingData.appointmentDate,
              appointmentTime: bookingData.appointmentTime,
              symptoms: bookingData.symptoms,
              familyMemberId: bookingData.familyMemberId === 'self' ? null : bookingData.familyMemberId,
              paymentMethod: bookingData.paymentMethod,
              appointmentType: bookingData.appointmentType
            };

            const appointmentResponse = await axios.post('${API_BASE_URL}/api/patient/book-appointment', appointmentData, {
              headers: { Authorization: `Bearer ${token}` }
            });

            // Then mark payment as paid
            await axios.post('${API_BASE_URL}/api/patient/payment/mark-paid', {
              appointmentId: appointmentResponse.data?.appointment?.id,
              amount,
              method: bookingData.paymentMethod || 'card',
              reference: response.razorpay_payment_id
            }, { headers: { Authorization: `Bearer ${token}` } });

            // Update booking data with appointment details
            setBookingData(prev => ({
              ...prev,
              appointmentId: appointmentResponse.data?.appointment?.id,
              paymentStatus: 'paid',
              tokenNumber: appointmentResponse.data?.appointment?.tokenNumber || appointmentResponse.data?.tokenNumber,
              estimatedWaitTime: appointmentResponse.data?.appointment?.estimatedWaitTime,
              meetingLink: appointmentResponse.data?.appointment?.meetingLink || appointmentResponse.data?.appointment?.meeting_link || null
            }));

            onPaid();
          } catch (e) {
            console.error('Error creating appointment or verifying payment:', e);
            setError('Failed to create appointment or verify payment. Please contact support.');
          }
        },
        prefill: {
          name: bookingData.familyMemberName,
          email: '',
          contact: ''
        },
        theme: { color: '#111827' }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function () {
        setError('Payment failed. Please try again.');
      });
      rzp.open();
    } finally {
      setLoading(false);
    }
  };

  // ensure fee in bookingData
  useEffect(() => {
    // try to set fee from selected doctor in current doctors list if missing
    // no-op if already set
  }, [bookingData]);

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment</h2>
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-gray-600">Doctor</span><span className="font-medium">{bookingData.doctorName}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">Department</span><span className="font-medium">{bookingData.departmentName}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">Date & Time</span><span className="font-medium">{new Date(bookingData.appointmentDate).toLocaleDateString()} @ {bookingData.appointmentTime}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">Consultation Fee</span><span className="font-medium">₹{bookingData.fee || bookingData.doctorFee || 500}</span></div>
          <div className="flex justify-between"><span className="text-gray-600">Taxes</span><span className="font-medium">₹0</span></div>
          <div className="flex justify-between text-base"><span className="font-semibold">Total</span><span className="font-semibold">₹{bookingData.fee || bookingData.doctorFee || 500}</span></div>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 text-sm text-gray-700">
        <div className="font-semibold mb-1">Refund policy</div>
        <div>Full refund up to 2 hours before the appointment; no refund after.</div>
      </div>

      {(error || bookingError) && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded flex items-start justify-between">
          <span>{bookingError || error}</span>
          {bookingError && (
            <button onClick={onClearError} className="ml-4 text-red-700 underline text-sm">Dismiss</button>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={openRazorpay}
          disabled={loading}
          className="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Confirm Payment'}
        </button>
      </div>
    </div>
  );
}

// Appointment Type Selection Component
function AppointmentTypeSelection({ selectedType, onSelect }) {
  const appointmentTypes = [
    {
      id: 'in-person',
      title: 'In-Person Visit',
      description: 'Visit our clinic for a traditional face-to-face consultation with your doctor.',
      icon: <HomeIcon className="h-8 w-8" />,
      features: [
        'Physical examination',
        'Direct interaction with doctor',
        'Access to medical equipment',
        'Immediate test results'
      ],
      color: 'blue'
    },
    {
      id: 'video',
      title: 'Video Consultation',
      description: 'Consult with your doctor from the comfort of your home via secure video call.',
      icon: <VideoCameraIcon className="h-8 w-8" />,
      features: [
        'Convenient home consultation',
        'No travel required',
        'Digital prescriptions',
        'Follow-up care included'
      ],
      color: 'purple'
    }
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Choose Appointment Type</h2>
      <p className="text-gray-600 mb-8">
        Select how you would like to consult with your doctor. Both options provide quality medical care.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {appointmentTypes.map((type) => (
          <div
            key={type.id}
            onClick={() => onSelect(type.id)}
            className={`relative p-6 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedType === type.id
                ? `border-${type.color}-500 bg-${type.color}-50`
                : 'border-gray-200 hover:border-gray-400'
            }`}
          >
            <div className="flex items-start space-x-4">
              <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                selectedType === type.id
                  ? `bg-${type.color}-500 text-white`
                  : `bg-${type.color}-100 text-${type.color}-600`
              }`}>
                {type.icon}
              </div>
              <div className="flex-1">
                <h3 className={`text-lg font-semibold mb-2 ${
                  selectedType === type.id ? `text-${type.color}-900` : 'text-gray-900'
                }`}>
                  {type.title}
                </h3>
                <p className={`text-sm mb-4 ${
                  selectedType === type.id ? `text-${type.color}-700` : 'text-gray-600'
                }`}>
                  {type.description}
                </p>
                
                <div className="space-y-2">
                  {type.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        selectedType === type.id ? `bg-${type.color}-500` : 'bg-gray-400'
                      }`}></div>
                      <span className={`text-xs ${
                        selectedType === type.id ? `text-${type.color}-700` : 'text-gray-600'
                      }`}>
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {selectedType === type.id && (
              <div className="absolute top-4 right-4">
                <CheckCircleIcon className={`h-6 w-6 text-${type.color}-500`} />
              </div>
            )}
          </div>
        ))}
      </div>
      
      {selectedType && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <InformationCircleIcon className="h-5 w-5 text-blue-500" />
            <span className="font-medium text-gray-900">Important Note:</span>
          </div>
          <p className="text-sm text-gray-600">
            {selectedType === 'video' 
              ? 'For video consultations, ensure you have a stable internet connection and a device with camera and microphone. You will receive a secure link to join the consultation.'
              : 'For in-person visits, please arrive 10 minutes before your scheduled time. Bring any relevant medical documents or test results.'
            }
          </p>
        </div>
      )}
    </div>
  );
}

async function loadRazorpayScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

// Programmatic payment initiation to run right after booking
async function initiatePaymentFlow({ appointmentId, tokenNumber, amount = 500, paymentMethod = 'card' }) {
  const token = localStorage.getItem('token');
  // Fetch key
  let keyId = 'rzp_test_dummy_key';
  try {
    const { data } = await axios.get('${API_BASE_URL}/api/patient/payment/key', {
      headers: { Authorization: `Bearer ${token}` }
    });
    keyId = data.keyId || keyId;
  } catch {}

  // Create order (or dummy)
  const { data: orderRes } = await axios.post('${API_BASE_URL}/api/patient/payment/create-order', {
    amount,
    currency: 'INR',
    receipt: `apt_${tokenNumber || Date.now()}`
  }, { headers: { Authorization: `Bearer ${token}` } });

  const order = orderRes.order;
  const isDummy = orderRes.dummy || !window.Razorpay;
  if (isDummy) {
    await axios.post('${API_BASE_URL}/api/patient/payment/mark-paid', {
      appointmentId,
      amount,
      method: paymentMethod,
      reference: order.id
    }, { headers: { Authorization: `Bearer ${token}` } });
    return;
  }

  if (!window.Razorpay) {
    await loadRazorpayScript('https://checkout.razorpay.com/v1/checkout.js');
  }

  return new Promise((resolve) => {
    const options = {
      key: keyId,
      amount: order.amount,
      currency: order.currency,
      name: 'Clinic Appointment',
      description: 'Consultation Fee',
      order_id: order.id,
      handler: async function (response) {
        try {
          await axios.post('${API_BASE_URL}/api/patient/payment/mark-paid', {
            appointmentId,
            amount,
            method: paymentMethod,
            reference: response.razorpay_payment_id
          }, { headers: { Authorization: `Bearer ${token}` } });
        } catch {}
        resolve();
      },
      theme: { color: '#111827' }
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
  });
}