import { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useUser } from '@clerk/clerk-react';
import { AuthContext } from '../../App';
import { getCurrentUser } from '../../utils/auth';
import axios from 'axios';
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
  XMarkIcon
} from '@heroicons/react/24/outline';
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
  
  // Data states
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [availableSessions, setAvailableSessions] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
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
      paymentMethod: 'card'
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
      paymentMethod: 'card'
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
    phone: ''
  });

  useEffect(() => {
    if (token) {
      fetchDepartments();
      fetchFamilyMembers();
      // Check reschedule query param
      const params = new URLSearchParams(location.search);
      const resId = params.get('reschedule');
      if (resId) {
        setRescheduleFor(resId);
        // Prefill existing appointment details
        const t = localStorage.getItem('token');
        axios.get(`http://localhost:5001/api/patient/appointments/${resId}`, {
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

  // Also fetch family members when user changes (for Clerk auth)
  useEffect(() => {
    if (user && token) {
      fetchFamilyMembers();
    }
  }, [user, token]);

  // Additional effect to ensure family members are loaded after a short delay
  useEffect(() => {
    if (token && familyMembers.length === 0) {
      const timer = setTimeout(() => {
        fetchFamilyMembers();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [token, familyMembers.length]);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5001/api/patient/departments', {
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
      const response = await axios.get(`http://localhost:5001/api/patient/doctors/${departmentId}`, {
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
      
      const dateStr = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      const isToday = i === 0;
      
      dates.push({
        date: dateStr,
        dayName: dayName,
        isToday: isToday,
        availableSessions: 2, // Morning and afternoon
        totalSessions: 2,
        availableSlots: 0, // Will be updated with real data
        totalSlots: 0
      });
    }
    
    setAvailableDates(dates);
    
    // Now fetch real slot data for each date
    if (departmentId) {
      await fetchRealSlotDataForDates(dates, departmentId);
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
          const res = await axios.get(`http://localhost:5001/api/patient/departments/${departmentId}/available-dates`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { date: dateObj.date }
          });
          
          const dateData = res.data.availableDates?.find(d => d.date === dateObj.date);
          if (dateData) {
            return {
              ...dateObj,
              availableSlots: dateData.availableSlots || 0,
              totalSlots: dateData.totalSlots || 0,
              availableSessions: dateData.availableSessions || 2,
              totalSessions: dateData.totalSessions || 2
            };
          }
          return dateObj;
        } catch (error) {
          console.error(`Error fetching slots for ${dateObj.date}:`, error);
          return dateObj; // Return original data if fetch fails
        }
      });
      
      const updatedDates = await Promise.all(slotPromises);
      setAvailableDates(updatedDates);
    } catch (error) {
      console.error('Error fetching real slot data:', error);
    }
  };

  const fetchDepartmentAvailableDates = async (departmentId) => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5001/api/patient/departments/${departmentId}/available-dates`, {
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
      const res = await axios.get(`http://localhost:5001/api/patient/departments/${departmentId}/availability/${date}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvailableSessions(res.data.sessions || []);
    } catch (error) {
      console.error('Error fetching department available sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRealSessionData = async (departmentId, date) => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5001/api/patient/departments/${departmentId}/availability/${date}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const sessions = res.data.sessions || [];
      setAvailableSessions(sessions);
    } catch (error) {
      console.error('Error fetching real session data:', error);
      // Fallback to empty sessions if API fails
      setAvailableSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorCountsForSessions = async (departmentId, date, sessions) => {
    try {
      // Fetch doctor counts for both sessions in parallel
      const [morningRes, afternoonRes] = await Promise.all([
        axios.get(`http://localhost:5001/api/patient/departments/${departmentId}/available-doctors`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { date, time: '09:00' }
        }).catch(() => ({ data: { doctors: [] } })),
        axios.get(`http://localhost:5001/api/patient/departments/${departmentId}/available-doctors`, {
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
      const res = await axios.get(`http://localhost:5001/api/patient/departments/${departmentId}/available-doctors`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { date, time }
      });
      const doctors = res.data.doctors || [];
      setDoctors(doctors);
      
      // Update the session with actual doctor count
      setAvailableSessions(prev => prev.map(session => 
        session.startTime === time 
          ? { ...session, doctorCount: doctors.length, availableDoctors: doctors }
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
      const res = await axios.get(`http://localhost:5001/api/patient/departments/${departmentId}/available-doctors`, {
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
        return;
      }
      const response = await axios.get('http://localhost:5001/api/patient/family-members', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const members = response.data.familyMembers || [];
      
      // Add self as first option - get name from stored user data
      const currentUser = getCurrentUser();
      const userName = currentUser?.name || (user?.firstName + ' ' + user?.lastName) || 'You';
      
      const selfMember = {
        id: 'self',
        patientId: currentUser?.patientId || 'P001',
        name: userName,
        relation: 'self',
        age: 'Adult',
        gender: 'N/A'
      };
      
      // Filter out any existing 'self' members to avoid duplicates
      const filteredMembers = members.filter(member => member.relation !== 'self');
      setFamilyMembers([selfMember, ...filteredMembers]);

      // Ensure default selection reflects the logged-in user visibly
      setBookingData(prev => ({
        ...prev,
        familyMemberId: 'self',
        familyMemberName: userName,
        familyMemberPatientId: selfMember.patientId
      }));
    } catch (error) {
      console.error('Error fetching family members:', error);
      // Set a fallback self member even if API fails
      const currentUser = getCurrentUser();
      const userName = currentUser?.name || (user?.firstName + ' ' + user?.lastName) || 'You';
      const selfMember = {
        id: 'self',
        patientId: currentUser?.patientId || 'P001',
        name: userName,
        relation: 'self',
        age: 'Adult',
        gender: 'N/A'
      };
      setFamilyMembers([selfMember]);
    }
  };

  const analyzeSymptoms = async (symptoms) => {
    try {
      setLoading(true);
      const response = await axios.post('http://localhost:5001/api/patient/analyze-symptoms', {
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
    setBookingData(prev => ({
      ...prev,
      familyMemberId: member.id,
      familyMemberName: member.name,
      familyMemberPatientId: member.patientId
    }));
    setCurrentStep(2);
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
    saveCurrentStep(3);
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
    saveCurrentStep(6); // Go directly to payment/confirmation
  };

  const handleDateSelect = async (date) => {
    const newData = {
      ...bookingData,
      appointmentDate: date
    };
    saveBookingData(newData);
    saveCurrentStep(4);
    // Fetch real session data from backend
    await fetchRealSessionData(newData.departmentId, date);
  };

  const handleSessionSelect = async (session) => {
    const newData = {
      ...bookingData,
      selectedSession: session,
      appointmentTime: session.startTime // Store session start time
    };
    saveBookingData(newData);
    
    // Use the doctors that were already fetched with the session data
    if (session.availableDoctors && session.availableDoctors.length > 0) {
      setDoctors(session.availableDoctors);
    } else {
      // Fallback: fetch doctors if not available in session data
      await fetchAvailableDoctorsForSession(newData.departmentId, newData.appointmentDate, session.startTime);
    }
    saveCurrentStep(5);
  };

  const handleAutoAssign = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`http://localhost:5001/api/patient/departments/${bookingData.departmentId}/auto-assign`, {
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

      setCurrentStep(6); // Skip doctor selection, go to payment
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
      
      const response = await axios.post('http://localhost:5001/api/patient/family-members', newMember, {
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
      
      setNewMember({ name: '', age: '', gender: 'male', relation: 'spouse', phone: '' });
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
      // Validate required fields before calling API
      if (!bookingData.departmentId || !bookingData.doctorId || !bookingData.appointmentDate || !bookingData.appointmentTime) {
        setBookingError('Please select department, doctor, date and time before confirming.');
        setLoading(false);
        return;
      }

      const appointmentData = {
        doctorId: bookingData.doctorId,
        departmentId: bookingData.departmentId,
        appointmentDate: bookingData.appointmentDate,
        appointmentTime: bookingData.appointmentTime,
        symptoms: bookingData.symptoms,
        familyMemberId: bookingData.familyMemberId === 'self' ? null : bookingData.familyMemberId,
        paymentMethod: bookingData.paymentMethod
      };

      let response;
      if (rescheduleFor) {
        response = await axios.post(`http://localhost:5001/api/patient/appointments/${rescheduleFor}/reschedule`, {
          doctorId: bookingData.doctorId,
          newDate: bookingData.appointmentDate,
          newTime: bookingData.appointmentTime
        }, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        response = await axios.post('http://localhost:5001/api/patient/book-appointment', appointmentData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      setBookingData(prev => ({
        ...prev,
        tokenNumber: response.data?.appointment?.tokenNumber || response.data?.tokenNumber,
        estimatedWaitTime: response.data?.appointment?.estimatedWaitTime
      }));

      saveCurrentStep(6);
      
      // Clear booking data after success (with a delay to show confirmation)
      setTimeout(() => {
        clearBookingData();
        setRescheduleFor(null);
        navigate('/appointments');
      }, 5000); // Clear after 5 seconds
    } catch (error) {
      console.error('Error booking appointment:', error);
      setBookingError(error.response?.data?.message || 'Unable to book appointment');
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
      2: 'Symptoms and Department',
      3: 'Pick Date (Next 7 Days)',
      4: 'Select Session',
      5: 'Select Doctor',
      6: 'Payment & Confirmation'
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
            {currentStep > 1 && currentStep < 7 && (
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
              {[1, 2, 3, 4, 5, 6].map((step) => (
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
                  {step < 6 && (
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
              loading={loading}
            />
          )}

          {/* Step 2: Symptoms (optional) + Choose Department */}
          {currentStep === 2 && (
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

          {/* Step 3: Select Date */}
          {currentStep === 3 && (
            <DateSelection
              dates={availableDates}
              selectedDoctor={bookingData.departmentName}
              onSelect={handleDateSelect}
              loading={loading}
            />
          )}

          {/* Step 4: Select Session */}
          {currentStep === 4 && (
            <>
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

          {/* Step 5: Doctor Selection */}
          {currentStep === 5 && (
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
                    const params = new URLSearchParams({
                      date: bookingData.appointmentDate,
                      doctorId: doctor.id,
                      familyMemberId: bookingData.familyMemberId
                    });
                    const res = await axios.get(`http://localhost:5001/api/patient/appointments/conflict?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
                    if (res.data?.conflict) {
                      setBookingError(res.data.message || 'You already have an appointment with this doctor on this date');
                      return; // block selecting same doctor for same date
                    }
                    setBookingError('');
                    handleDoctorSelect(doctor);
                  } catch (e) {
                    // If the check fails, be conservative and block selection
                    setBookingError('Unable to verify availability. Please try again.');
                  }
                }}
                loading={loading}
              />
            </>
          )}


          {/* Inline conflict warning (if any) shown above payment too) */}
          {!!bookingError && currentStep !== 7 && (
            <div className="mt-4 mb-4 p-3 bg-yellow-100 text-yellow-800 rounded">
              {bookingError}
            </div>
          )}

          {/* Step 6: Confirm & Book (Payment removed for testing) */}
          {currentStep === 6 && !bookingData.tokenNumber && (
            <PreBookingConfirmation
              bookingData={bookingData}
              onConfirm={handleBookAppointment}
              loading={loading}
            />
          )}

          {/* Step 6: Booking Confirmed */}
          {currentStep === 6 && bookingData.tokenNumber && (
            <BookingSuccess
              bookingData={bookingData}
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
        {familyMembers.map((member, index) => (
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
        ))}
      </div>

      {/* Add Family Member */}
      <div className="border-t pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Family Members</h3>
          <button
            onClick={onRefresh}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Refresh
          </button>
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
            <span className="text-gray-600">Symptoms:</span>
            <span className="font-medium text-right max-w-xs">{bookingData.symptoms}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onConfirm}
          disabled={loading}
          className="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Booking...' : 'Confirm Booking'}
        </button>
      </div>
    </div>
  );
}

// Booking Success Component
function BookingSuccess({ bookingData, onNewBooking }) {
  return (
    <div className="text-center">
      <div className="mb-6">
        <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Appointment Booked Successfully!</h2>
        <p className="text-gray-600">Your appointment has been confirmed.</p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
        <h3 className="font-semibold text-green-900 mb-4">Booking Details</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-green-700">Token Number:</span>
            <span className="font-medium text-green-900">{bookingData.tokenNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-700">Patient:</span>
            <span className="font-medium text-green-900">{bookingData.familyMemberName}</span>
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
          {bookingData.estimatedWaitTime && (
            <div className="flex justify-between">
              <span className="text-green-700">Estimated Wait:</span>
              <span className="font-medium text-green-900">{bookingData.estimatedWaitTime} minutes</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center space-x-4">
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

  useEffect(() => {
    // Razorpay temporarily disabled: mark as configured to enable button
    setKeyId('disabled');
  }, []);

  const openRazorpay = async () => {
    setLoading(true);
    try {
      // Temporary flow: skip payment and move to next step
      onPaid();
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

async function loadRazorpayScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}