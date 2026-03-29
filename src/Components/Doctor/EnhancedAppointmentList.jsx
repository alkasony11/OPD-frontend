import { useState, useEffect } from 'react';
import { 
  HiCalendar, HiClock, HiUser, HiPhone, HiMail, HiCheck, HiX, 
  HiEye, HiClipboardList, HiVideoCamera, HiExternalLink, 
  HiArrowRight, HiDocumentText, HiCash, HiLocationMarker,
  HiStatusOnline, HiStatusOffline
} from 'react-icons/hi';
import axios from 'axios';
import PatientDetailsModal from './PatientDetailsModal';
import PrescriptionModal from './PrescriptionModal';
import PatientConsultationModal from './PatientConsultationModal';
import { useRealtimeSync } from '../../hooks/useRealtimeSync';
import { API_BASE_URL } from '../../config/api';

export default function EnhancedAppointmentList() {
  const [appointments, setAppointments] = useState([]);
  const [allAppointments, setAllAppointments] = useState([]); // Store all appointments for count calculation
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // today, upcoming, all, completed, cancelled
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('time'); // time, status, patient, date

  useEffect(() => {
    fetchAppointments();
  }, [filter]);

  // Real-time sync handlers
  const handleAppointmentUpdate = (data) => {
    console.log('📡 Real-time appointment update received:', data);
    fetchAppointments();
    setLastUpdated(new Date());
  };

  const handleQueueUpdate = (data) => {
    console.log('📡 Real-time queue update received:', data);
    fetchAppointments();
    setLastUpdated(new Date());
  };

  // Initialize real-time sync
  const { isConnected } = useRealtimeSync(
    'doctor',
    null, // schedule change
    null, // availability change
    null, // department change
    null, // leave approval
    handleAppointmentUpdate,
    handleQueueUpdate,
    null  // system alert
  );

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        console.error('No token found');
        return;
      }

      console.log('🔍 Fetching appointments with filter:', filter);
      
      // Fetch appointments for the current filter
      const response = await axios.get(`${API_BASE_URL}/api/doctor/appointments?filter=${filter}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('🔍 API Response:', response.data);
      console.log('🔍 Appointments count:', response.data.appointments?.length || 0);
      console.log('🔍 Appointment dates:', response.data.appointments?.map(apt => ({
        date: apt.booking_date,
        status: apt.status,
        patient: apt.patient_name
      })));
      setAppointments(response.data.appointments || []);
      
      // Also fetch all appointments for count calculation (including cancelled)
      const allResponse = await axios.get(`${API_BASE_URL}/api/doctor/appointments?filter=all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Fetch cancelled appointments separately for count calculation
      const cancelledResponse = await axios.get(`${API_BASE_URL}/api/doctor/appointments?filter=cancelled`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Combine all appointments for count calculation
      const allAppointmentsForCount = [
        ...(allResponse.data.appointments || []),
        ...(cancelledResponse.data.appointments || [])
      ];
      
      console.log('🔍 All appointments count:', allResponse.data.appointments?.length || 0);
      console.log('🔍 Cancelled appointments count:', cancelledResponse.data.appointments?.length || 0);
      console.log('🔍 Combined appointments count:', allAppointmentsForCount.length);
      console.log('🔍 All appointment dates:', allAppointmentsForCount.map(apt => ({
        date: apt.booking_date,
        status: apt.status,
        patient: apt.patient_name
      })));
      setAllAppointments(allAppointmentsForCount);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching appointments:', error);
      console.error('Error details:', error.response?.data);
      setAppointments([]);
      setAllAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'booked':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_queue':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'consulted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'missed':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'referred':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'booked':
        return <HiCalendar className="h-4 w-4" />;
      case 'in_queue':
        return <HiClock className="h-4 w-4" />;
      case 'consulted':
        return <HiCheck className="h-4 w-4" />;
      case 'cancelled':
        return <HiX className="h-4 w-4" />;
      case 'missed':
        return <HiExclamation className="h-4 w-4" />;
      case 'referred':
        return <HiArrowRight className="h-4 w-4" />;
      default:
        return <HiCalendar className="h-4 w-4" />;
    }
  };

  const updateAppointmentStatus = async (appointmentId, newStatus, additionalData = {}) => {
    try {
      setUpdating(true);
      const token = localStorage.getItem('token');

      const updateData = { status: newStatus, ...additionalData };

      await axios.patch(
        `${API_BASE_URL}/api/doctor/appointments/${appointmentId}/status`,
        updateData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await fetchAppointments();
      
      const statusMessages = {
        'in_queue': 'Patient moved to consultation queue',
        'consulted': 'Appointment marked as completed',
        'cancelled': 'Appointment cancelled',
        'missed': 'Marked as no-show',
        'referred': 'Patient referred to another doctor'
      };
      
      if (statusMessages[newStatus]) {
        alert(statusMessages[newStatus]);
      }
    } catch (error) {
      console.error('Error updating appointment status:', error);
      alert('Failed to update appointment status');
    } finally {
      setUpdating(false);
    }
  };


  const openPatientModal = (appointment) => {
    setSelectedAppointment(appointment);
    setShowPatientModal(true);
  };

  const openPrescriptionModal = (appointment) => {
    setSelectedAppointment(appointment);
    setShowPrescriptionModal(true);
  };


  const handleDoctorJoinMeeting = async (appointmentId, meetingUrl) => {
    try {
      const token = localStorage.getItem('token');
      
      // Call the API to mark doctor as joined
      const response = await axios.post(
        `${API_BASE_URL}/api/doctor/join-video-consultation/${appointmentId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.message === 'Successfully joined video consultation') {
        // Show success message
        alert('You have successfully joined the video consultation. The patient has been notified and can now join the meeting.');
        
        // Open the meeting URL
        window.open(meetingUrl, '_blank', 'noopener,noreferrer');
        
        // Refresh the appointments data to update the UI
        await fetchAppointments();
      }
    } catch (error) {
      console.error('Error joining video consultation:', error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('Failed to join video consultation. Please try again.');
      }
    }
  };

  const handleDoctorCloseMeeting = async (appointmentId) => {
    try {
      const token = localStorage.getItem('token');
      
      // Call the API to mark doctor as left the meeting
      const response = await axios.post(
        `${API_BASE_URL}/api/doctor/close-video-consultation/${appointmentId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.message === 'Successfully closed video consultation') {
        // Show success message
        alert('Video consultation has been closed. The patient has been notified that the meeting has ended.');
        
        // Refresh the appointments data to update the UI
        await fetchAppointments();
      }
    } catch (error) {
      console.error('Error closing video consultation:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('Failed to close video consultation. Please try again.');
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return timeString || 'N/A';
  };

  const getFilteredAndSortedAppointments = () => {
    let filtered = appointments;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(apt =>
        apt.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.patient_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.symptoms?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.token_number?.toString().includes(searchTerm)
      );
    }

    // Apply status filter
    if (filter === 'completed') {
      filtered = filtered.filter(apt => apt.status === 'consulted');
    } else if (filter === 'cancelled') {
      filtered = filtered.filter(apt => apt.status === 'cancelled' || apt.status === 'missed');
    } else if (filter === 'today') {
      // For 'today' filter, exclude cancelled and missed appointments
      filtered = filtered.filter(apt => apt.status !== 'cancelled' && apt.status !== 'missed');
    } else if (filter === 'upcoming') {
      // For 'upcoming' filter, exclude cancelled and missed appointments
      filtered = filtered.filter(apt => apt.status !== 'cancelled' && apt.status !== 'missed');
    } else if (filter === 'all') {
      // For 'all' filter, exclude cancelled and missed appointments
      filtered = filtered.filter(apt => apt.status !== 'cancelled' && apt.status !== 'missed');
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'time':
          return new Date(a.booking_date + ' ' + a.time_slot) - new Date(b.booking_date + ' ' + b.time_slot);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'patient':
          return a.patient_name?.localeCompare(b.patient_name);
        case 'date':
          return new Date(a.booking_date) - new Date(b.booking_date);
        default:
          return 0;
      }
    });

    return filtered;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Enhanced Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Appointment Management</h2>
            <div className="flex items-center space-x-4 mt-1">
              <div className="flex items-center space-x-2">
                {isConnected ? (
                  <HiStatusOnline className="h-4 w-4 text-green-500" />
                ) : (
                  <HiStatusOffline className="h-4 w-4 text-red-500" />
                )}
                <span className="text-xs text-gray-500">
                  {isConnected ? 'Live sync active' : 'Offline mode'}
                </span>
              </div>
              {lastUpdated && (
                <span className="text-xs text-gray-500">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by patient name, email, symptoms, or token number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="time">Sort by Time</option>
              <option value="status">Sort by Status</option>
              <option value="patient">Sort by Patient</option>
              <option value="date">Sort by Date</option>
            </select>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mt-4">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'today', label: 'Today', count: allAppointments.filter(apt => {
                const appointmentDate = new Date(apt.booking_date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                return appointmentDate >= today && appointmentDate < tomorrow && apt.status !== 'cancelled' && apt.status !== 'missed';
              }).length },
              { key: 'upcoming', label: 'Upcoming', count: allAppointments.filter(apt => {
                const appointmentDate = new Date(apt.booking_date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                return appointmentDate >= tomorrow && apt.status !== 'cancelled' && apt.status !== 'missed';
              }).length },
              { key: 'completed', label: 'Completed', count: allAppointments.filter(apt => apt.status === 'consulted').length },
              { key: 'cancelled', label: 'Cancelled', count: allAppointments.filter(apt => apt.status === 'cancelled' || apt.status === 'missed').length },
              { key: 'all', label: 'All', count: allAppointments.filter(apt => apt.status !== 'cancelled' && apt.status !== 'missed').length }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === tab.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="p-6">
        {getFilteredAndSortedAppointments().length === 0 ? (
          <div className="text-center py-12">
            <HiCalendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No appointments found for the selected filter</p>
          </div>
        ) : (
          <div className="space-y-4">
            {getFilteredAndSortedAppointments().map((appointment, index) => (
              <div key={appointment._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <HiUser className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {/* Patient Info */}
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{appointment.patient_name}</h3>
                        <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
                          {getStatusIcon(appointment.status)}
                          <span className="capitalize">{appointment.status.replace('_', ' ')}</span>
                        </span>
                        {appointment.token_number && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            Token #{appointment.token_number}
                          </span>
                        )}
                      </div>

                      {/* Contact Info */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                        <div className="flex items-center space-x-1">
                          <HiMail className="h-4 w-4" />
                          <span>{appointment.patient_email || 'N/A'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <HiPhone className="h-4 w-4" />
                          <span>{appointment.patient_phone || 'N/A'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <HiCalendar className="h-4 w-4" />
                          <span>{formatDate(appointment.booking_date)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <HiClock className="h-4 w-4" />
                          <span>{formatTime(appointment.time_slot)}</span>
                        </div>
                      </div>

                      {/* Medical Info */}
                      <div className="space-y-2">
                        {appointment.symptoms && (
                          <div className="text-sm">
                            <span className="font-medium text-gray-700">Symptoms:</span>
                            <span className="text-gray-600 ml-2">{appointment.symptoms}</span>
                          </div>
                        )}
                        {appointment.diagnosis && (
                          <div className="text-sm">
                            <span className="font-medium text-gray-700">Diagnosis:</span>
                            <span className="text-gray-600 ml-2">{appointment.diagnosis}</span>
                          </div>
                        )}
                        {appointment.doctorNotes && (
                          <div className="text-sm">
                            <span className="font-medium text-gray-700">Notes:</span>
                            <span className="text-gray-600 ml-2">{appointment.doctorNotes}</span>
                          </div>
                        )}
                        {appointment.referredDoctor && (
                          <div className="text-sm">
                            <span className="font-medium text-gray-700">Referred to:</span>
                            <span className="text-gray-600 ml-2">{appointment.referredDoctor}</span>
                          </div>
                        )}
                      </div>

                      {/* Video Consultation Link */}
                      {appointment.appointmentType === 'video' && appointment.meeting_link && appointment.status !== 'consulted' && (
                        <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <HiVideoCamera className="h-4 w-4 text-purple-600" />
                              <span className="text-sm font-medium text-purple-900">Video Consultation</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              {!appointment.meeting_link.doctorJoined ? (
                                <button
                                  onClick={() => handleDoctorJoinMeeting(appointment._id, appointment.meeting_link.meetingUrl)}
                                  className="flex items-center space-x-1 px-3 py-1 bg-purple-600 text-white text-xs rounded-md hover:bg-purple-700 transition-colors"
                                >
                                  <HiExternalLink className="h-3 w-3" />
                                  <span>Join Meeting</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleDoctorCloseMeeting(appointment._id)}
                                  className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 transition-colors"
                                >
                                  <HiX className="h-3 w-3" />
                                  <span>Close Meeting</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Consultation Data for Completed Appointments */}
                      {appointment.status === 'consulted' && appointment.consultationData && (
                        <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center space-x-2 mb-3">
                            <HiCheck className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-900">Consultation Completed</span>
                          </div>
                          
                          <div className="space-y-3">
                            {appointment.consultationData.chiefComplaint && (
                              <div>
                                <span className="text-xs font-medium text-gray-700">Chief Complaint:</span>
                                <p className="text-sm text-gray-600 mt-1">{appointment.consultationData.chiefComplaint}</p>
                              </div>
                            )}
                            
                            {appointment.consultationData.diagnosis && (
                              <div>
                                <span className="text-xs font-medium text-gray-700">Diagnosis:</span>
                                <p className="text-sm text-gray-600 mt-1">{appointment.consultationData.diagnosis}</p>
                              </div>
                            )}
                            
                            {appointment.consultationData.treatmentPlan && (
                              <div>
                                <span className="text-xs font-medium text-gray-700">Treatment Plan:</span>
                                <p className="text-sm text-gray-600 mt-1">{appointment.consultationData.treatmentPlan}</p>
                              </div>
                            )}
                            
                            {appointment.consultationData.medications && (
                              <div>
                                <span className="text-xs font-medium text-gray-700">Prescription:</span>
                                <p className="text-sm text-gray-600 mt-1">{appointment.consultationData.medications}</p>
                              </div>
                            )}
                            
                            {appointment.consultationData.followUpInstructions && (
                              <div>
                                <span className="text-xs font-medium text-gray-700">Follow-up Instructions:</span>
                                <p className="text-sm text-gray-600 mt-1">{appointment.consultationData.followUpInstructions}</p>
                              </div>
                            )}
                          </div>
                          
                          {appointment.consultation_completed_at && (
                            <div className="mt-3 pt-3 border-t border-green-200">
                              <span className="text-xs text-green-600">
                                Completed: {new Date(appointment.consultation_completed_at).toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 ml-4">
                    {/* Status-based actions */}
                    {appointment.status === 'booked' && (
                      <>
                        <button
                          onClick={() => updateAppointmentStatus(appointment._id, 'in_queue')}
                          disabled={updating}
                          className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 disabled:opacity-50"
                          title="Start consultation"
                        >
                          <HiClock className="h-3 w-3" />
                          <span>Start</span>
                        </button>
                      </>
                    )}

                     {appointment.status === 'in_queue' && (
                       <>
                         <button
                           onClick={() => {
                             setSelectedAppointment(appointment);
                             setShowConsultationModal(true);
                           }}
                           disabled={updating}
                           className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 disabled:opacity-50"
                           title="Start consultation"
                         >
                           <HiCheck className="h-3 w-3" />
                           <span>Start</span>
                         </button>
                        <button
                          onClick={() => {
                            const referredDoctor = prompt('Enter the name of the doctor to refer to:');
                            if (referredDoctor) {
                              updateAppointmentStatus(appointment._id, 'referred', { referredDoctor });
                            }
                          }}
                          disabled={updating}
                          className="flex items-center space-x-1 px-3 py-1 bg-purple-600 text-white text-xs rounded-md hover:bg-purple-700 disabled:opacity-50"
                          title="Refer to another doctor"
                        >
                          <HiArrowRight className="h-3 w-3" />
                          <span>Refer</span>
                        </button>
                      </>
                    )}

                    {/* General actions - Different for referred patients */}
                    {appointment.status === 'referred' ? (
                      <button
                        onClick={() => openPatientModal(appointment)}
                        className="flex items-center space-x-1 px-3 py-1 bg-indigo-600 text-white text-xs rounded-md hover:bg-indigo-700"
                        title="View medical records"
                      >
                        <HiDocumentText className="h-3 w-3" />
                        <span>Medical Records</span>
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => openPatientModal(appointment)}
                          className="flex items-center space-x-1 px-3 py-1 bg-indigo-600 text-white text-xs rounded-md hover:bg-indigo-700"
                          title="View patient details"
                        >
                          <HiEye className="h-3 w-3" />
                          <span>Details</span>
                        </button>


                        <button
                          onClick={() => openPrescriptionModal(appointment)}
                          className="flex items-center space-x-1 px-3 py-1 bg-teal-600 text-white text-xs rounded-md hover:bg-teal-700"
                          title="Add prescription"
                        >
                          <HiClipboardList className="h-3 w-3" />
                          <span>Prescription</span>
                        </button>
                      </>
                    )}

                    {(appointment.status === 'booked' || appointment.status === 'in_queue') && (
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to cancel this appointment?')) {
                            updateAppointmentStatus(appointment._id, 'cancelled');
                          }
                        }}
                        disabled={updating}
                        className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 disabled:opacity-50"
                        title="Cancel appointment"
                      >
                        <HiX className="h-3 w-3" />
                        <span>Cancel</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>


      {/* Patient Details Modal */}
      <PatientDetailsModal
        appointment={selectedAppointment}
        isOpen={showPatientModal}
        onClose={() => setShowPatientModal(false)}
      />

       {/* Prescription Modal */}
       <PrescriptionModal
         appointment={selectedAppointment}
         isOpen={showPrescriptionModal}
         onClose={() => setShowPrescriptionModal(false)}
         onPrescriptionAdded={() => fetchAppointments()}
       />

       {/* Consultation Modal */}
       <PatientConsultationModal
         appointment={selectedAppointment}
         isOpen={showConsultationModal}
         onClose={() => {
           setShowConsultationModal(false);
           setSelectedAppointment(null);
         }}
         onSave={() => {
           setShowConsultationModal(false);
           setSelectedAppointment(null);
           fetchAppointments();
         }}
       />
     </div>
   );
 }
