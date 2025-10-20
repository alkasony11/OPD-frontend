import { useState, useEffect } from 'react';
import { HiCalendar, HiClock, HiUser, HiPhone, HiMail, HiCheck, HiX, HiPencil, HiEye, HiClipboardList, HiVideoCamera, HiExternalLink } from 'react-icons/hi';
import axios from 'axios';
import PatientDetailsModal from './PatientDetailsModal';
import PrescriptionModal from './PrescriptionModal';
import { API_BASE_URL } from '../../config/api';

export default function AppointmentList() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('today'); // today, upcoming, all
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, [filter]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        console.error('No token found');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/doctor/appointments?filter=${filter}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAppointments(response.data.appointments || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'booked':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_queue':
        return 'bg-blue-100 text-blue-800';
      case 'consulted':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'missed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'video':
        return 'bg-purple-100 text-purple-800';
      case 'in-person':
        return 'bg-green-100 text-green-800';
      case 'emergency':
        return 'bg-red-100 text-red-800';
      case 'follow-up':
        return 'bg-blue-100 text-blue-800';
      case 'consultation':
        return 'bg-purple-100 text-purple-800';
      case 'routine-checkup':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Update appointment status
  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      setUpdating(true);
      const token = localStorage.getItem('token');

      await axios.patch(
        `${API_BASE_URL}/api/doctor/appointments/${appointmentId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh appointments
      await fetchAppointments();
    } catch (error) {
      console.error('Error updating appointment status:', error);
      alert('Failed to update appointment status');
    } finally {
      setUpdating(false);
    }
  };

  // Open notes modal
  const openNotesModal = (appointment) => {
    setSelectedAppointment(appointment);
    setNotes(appointment.doctorNotes || '');
    setDiagnosis(appointment.diagnosis || '');
    setShowNotesModal(true);
  };

  // Open patient details modal
  const openPatientModal = (appointment) => {
    setSelectedAppointment(appointment);
    setShowPatientModal(true);
  };

  // Open prescription modal
  const openPrescriptionModal = (appointment) => {
    setSelectedAppointment(appointment);
    setShowPrescriptionModal(true);
  };

  // Handle prescription added
  const handlePrescriptionAdded = (updatedAppointment) => {
    // Update the appointment in the local state
    setAppointments(prev =>
      prev.map(apt =>
        apt._id === updatedAppointment._id ? updatedAppointment : apt
      )
    );
  };

  // Save notes and diagnosis
  const saveNotes = async () => {
    try {
      setUpdating(true);
      const token = localStorage.getItem('token');

      await axios.patch(
        `${API_BASE_URL}/api/doctor/appointments/${selectedAppointment._id}/notes`,
        { doctorNotes: notes, diagnosis },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowNotesModal(false);
      await fetchAppointments();
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('Failed to save notes');
    } finally {
      setUpdating(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Appointments</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('today')}
              className={`px-3 py-1 rounded-full text-sm ${
                filter === 'today' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setFilter('upcoming')}
              className={`px-3 py-1 rounded-full text-sm ${
                filter === 'upcoming' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-full text-sm ${
                filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              All
            </button>
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="p-6">
        {appointments.length === 0 ? (
          <div className="text-center py-8">
            <HiCalendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No appointments found for the selected filter</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment, index) => (
              <div key={appointment._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <HiUser className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{appointment.patientName}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <HiCalendar className="h-4 w-4" />
                          <span>{formatDate(appointment.appointmentDate)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <HiClock className="h-4 w-4" />
                          <span>{appointment.appointmentTime}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <HiPhone className="h-4 w-4" />
                          <span>{appointment.patientPhone}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(appointment.appointmentType)}`}>
                      {appointment.appointmentType}
                    </span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                      {appointment.status}
                    </span>
                  </div>
                </div>

                {/* Video Consultation Meeting Link */}
                {appointment.appointmentType === 'video' && appointment.meeting_link && (
                  <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <HiVideoCamera className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-900">Video Consultation</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-purple-700">
                          ID: {appointment.meeting_link.meetingId}
                        </span>
                        <button
                          onClick={() => window.open(appointment.meeting_link.meetingUrl, '_blank', 'noopener,noreferrer')}
                          className="flex items-center space-x-1 px-2 py-1 bg-purple-600 text-white text-xs rounded-md hover:bg-purple-700"
                        >
                          <HiExternalLink className="h-3 w-3" />
                          <span>Join Meeting</span>
                        </button>
                      </div>
                    </div>
                    {appointment.meeting_link.meetingPassword && (
                      <div className="mt-2 text-xs text-purple-700">
                        Password: <span className="font-mono">{appointment.meeting_link.meetingPassword}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Symptoms */}
                {appointment.symptoms && (
                  <div className="mt-3 text-sm text-gray-600">
                    <strong>Symptoms:</strong> {appointment.symptoms}
                  </div>
                )}

                {/* Doctor Notes */}
                {appointment.doctorNotes && (
                  <div className="mt-2 text-sm text-gray-600">
                    <strong>Notes:</strong> {appointment.doctorNotes}
                  </div>
                )}

                {/* Diagnosis */}
                {appointment.diagnosis && (
                  <div className="mt-2 text-sm text-gray-600">
                    <strong>Diagnosis:</strong> {appointment.diagnosis}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-4 flex items-center space-x-2">
                  {appointment.status === 'booked' && (
                    <button
                      onClick={() => updateAppointmentStatus(appointment._id, 'in_queue')}
                      disabled={updating}
                      className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      <HiClock className="h-3 w-3" />
                      <span>Start Queue</span>
                    </button>
                  )}

                  {appointment.status === 'in_queue' && (
                    <button
                      onClick={() => updateAppointmentStatus(appointment._id, 'consulted')}
                      disabled={updating}
                      className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 disabled:opacity-50"
                    >
                      <HiCheck className="h-3 w-3" />
                      <span>Complete</span>
                    </button>
                  )}

                  <button
                    onClick={() => openPatientModal(appointment)}
                    className="flex items-center space-x-1 px-3 py-1 bg-indigo-600 text-white text-xs rounded-md hover:bg-indigo-700"
                  >
                    <HiEye className="h-3 w-3" />
                    <span>Details</span>
                  </button>

                  <button
                    onClick={() => openNotesModal(appointment)}
                    className="flex items-center space-x-1 px-3 py-1 bg-purple-600 text-white text-xs rounded-md hover:bg-purple-700"
                  >
                    <HiPencil className="h-3 w-3" />
                    <span>Notes</span>
                  </button>

                  <button
                    onClick={() => openPrescriptionModal(appointment)}
                    className="flex items-center space-x-1 px-3 py-1 bg-teal-600 text-white text-xs rounded-md hover:bg-teal-700"
                  >
                    <HiClipboardList className="h-3 w-3" />
                    <span>Prescription</span>
                  </button>

                  {(appointment.status === 'booked' || appointment.status === 'in_queue') && (
                    <button
                      onClick={() => updateAppointmentStatus(appointment._id, 'cancelled')}
                      disabled={updating}
                      className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 disabled:opacity-50"
                    >
                      <HiX className="h-3 w-3" />
                      <span>Cancel</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notes Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Add Notes - {selectedAppointment?.patientName}
              </h3>
              <button
                onClick={() => setShowNotesModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <HiX className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Diagnosis
                </label>
                <input
                  type="text"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter diagnosis..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Doctor Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your notes..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowNotesModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={saveNotes}
                disabled={updating}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {updating ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>
        </div>
      )}

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
        onPrescriptionAdded={handlePrescriptionAdded}
      />
    </div>
  );
}
