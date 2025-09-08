import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const { user } = useUser();
  const { token } = useContext(AuthContext);

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Data states
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);

  // Booking form data
  const [bookingData, setBookingData] = useState({
    departmentId: '',
    departmentName: '',
    doctorId: '',
    doctorName: '',
    appointmentDate: '',
    appointmentTime: '',
    symptoms: '',
    familyMemberId: 'self',
    familyMemberName: '',
    paymentMethod: 'card'
  });

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
    fetchDepartments();
    fetchFamilyMembers();
  }, []);

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

  const fetchAvailableDates = async (doctorId) => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5001/api/patient/doctors/${doctorId}/available-dates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvailableDates(response.data.availableDates || []);
    } catch (error) {
      console.error('Error fetching available dates:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async (doctorId, date) => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5001/api/patient/doctors/${doctorId}/availability/${date}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAvailableSlots(response.data.slots || []);
    } catch (error) {
      console.error('Error fetching available slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFamilyMembers = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/patient/family-members', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const members = response.data.familyMembers || [];
      
      // Add self as first option - get name from stored user data
      const currentUser = getCurrentUser();
      const userName = currentUser?.name || user?.firstName + ' ' + user?.lastName || 'You';
      
      const selfMember = {
        id: 'self',
        name: userName,
        relation: 'self',
        age: 'Adult',
        gender: 'N/A'
      };
      
      setFamilyMembers([selfMember, ...members]);

      // Ensure default selection reflects the logged-in user visibly
      setBookingData(prev => ({
        ...prev,
        familyMemberId: 'self',
        familyMemberName: userName
      }));
    } catch (error) {
      console.error('Error fetching family members:', error);
    }
  };

  const handleDepartmentSelect = (department) => {
    setBookingData(prev => ({
      ...prev,
      departmentId: department.id,
      departmentName: department.name
    }));
    fetchDoctors(department.id);
    setCurrentStep(2);
  };

  const handleDoctorSelect = (doctor) => {
    setBookingData(prev => ({
      ...prev,
      doctorId: doctor.id,
      doctorName: doctor.name
    }));
    fetchAvailableDates(doctor.id);
    setCurrentStep(3);
  };

  const handleDateSelect = (date) => {
    setBookingData(prev => ({
      ...prev,
      appointmentDate: date
    }));
    fetchAvailableSlots(bookingData.doctorId, date);
    setCurrentStep(4);
  };

  const handleTimeSelect = (time) => {
    setBookingData(prev => ({
      ...prev,
      appointmentTime: time
    }));
    setCurrentStep(5);
  };

  const handleSymptomsSubmit = () => {
    setCurrentStep(6);
  };

  const handleFamilyMemberSelect = (member) => {
    setBookingData(prev => ({
      ...prev,
      familyMemberId: member.id,
      familyMemberName: member.name
    }));
  };

  const handleAddFamilyMember = async () => {
    try {
      const response = await axios.post('http://localhost:5001/api/patient/family-members', newMember, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const addedMember = response.data.familyMember;
      setFamilyMembers(prev => [...prev, addedMember]);
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
      const appointmentData = {
        doctorId: bookingData.doctorId,
        departmentId: bookingData.departmentId,
        appointmentDate: bookingData.appointmentDate,
        appointmentTime: bookingData.appointmentTime,
        symptoms: bookingData.symptoms,
        familyMemberId: bookingData.familyMemberId === 'self' ? null : bookingData.familyMemberId,
        paymentMethod: bookingData.paymentMethod
      };

      const response = await axios.post('http://localhost:5001/api/patient/book-appointment', appointmentData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setBookingData(prev => ({
        ...prev,
        tokenNumber: response.data.tokenNumber,
        estimatedWaitTime: response.data.estimatedWaitTime
      }));

      setCurrentStep(7);
      alert('Appointment booked successfully!');
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert('Error booking appointment: ' + (error.response?.data?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getStepTitle = () => {
    const titles = {
      1: 'Select Department',
      2: 'Choose Doctor',
      3: 'Pick Date',
      4: 'Select Time',
      5: 'Describe Symptoms',
      6: 'Select Patient',
      7: 'Booking Confirmed'
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
          {/* Step 1: Select Department */}
          {currentStep === 1 && (
            <DepartmentSelection
              departments={departments}
              onSelect={handleDepartmentSelect}
              loading={loading}
            />
          )}

          {/* Step 2: Select Doctor */}
          {currentStep === 2 && (
            <DoctorSelection
              doctors={doctors}
              selectedDepartment={bookingData.departmentName}
              onSelect={handleDoctorSelect}
              loading={loading}
            />
          )}

          {/* Step 3: Select Date */}
          {currentStep === 3 && (
            <DateSelection
              dates={availableDates}
              selectedDoctor={bookingData.doctorName}
              onSelect={handleDateSelect}
              loading={loading}
            />
          )}

          {/* Step 4: Select Time */}
          {currentStep === 4 && (
            <TimeSelection
              slots={availableSlots}
              selectedDate={bookingData.appointmentDate}
              onSelect={handleTimeSelect}
              loading={loading}
            />
          )}

          {/* Step 5: Enter Symptoms */}
          {currentStep === 5 && (
            <SymptomsInput
              symptoms={bookingData.symptoms}
              onChange={(symptoms) => setBookingData(prev => ({ ...prev, symptoms }))}
              onNext={handleSymptomsSubmit}
            />
          )}

          {/* Step 6: Select Patient */}
          {currentStep === 6 && (
            <PatientSelection
              familyMembers={familyMembers}
              selectedMemberId={bookingData.familyMemberId}
              onSelect={handleFamilyMemberSelect}
              showAddMember={showAddMember}
              setShowAddMember={setShowAddMember}
              newMember={newMember}
              setNewMember={setNewMember}
              onAddMember={handleAddFamilyMember}
              onNext={() => handleBookAppointment()}
              loading={loading}
            />
          )}

          {/* Step 7: Confirmation */}
          {currentStep === 7 && (
            <BookingConfirmation
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
                  paymentMethod: 'card'
                });
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
          onClick={onNext}
          disabled={!symptoms.trim()}
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
  onNext, 
  loading 
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Select Patient</h2>
      
      {/* Family Members */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {familyMembers.map((member) => (
          <div
            key={member.id}
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

      <div className="flex justify-end mt-8">
        <button
          onClick={onNext}
          disabled={loading}
          className="px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Booking...' : 'Book Appointment'}
        </button>
      </div>
    </div>
  );
}