import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiArrowLeft, HiCalendar, HiClock, HiUser, HiPhone, HiMail, HiCheck, HiX, HiPencil, HiEye, HiClipboardList } from 'react-icons/hi';
import axios from 'axios';
import PatientDetailsModal from '../../Components/Doctor/PatientDetailsModal';
import PrescriptionModal from '../../Components/Doctor/PrescriptionModal';
import DoctorSidebar from '../../Components/Doctor/Sidebar';

export default function DoctorAppointmentsPage() {
  const navigate = useNavigate();
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
    checkDoctorAuth();
  }, []);

  useEffect(() => {
    if (loading) {
      fetchAppointments();
    }
  }, [filter]);

  const checkDoctorAuth = () => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!userData || !token) {
      navigate('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 'doctor') {
        alert('Access denied. Doctor privileges required.');
        navigate('/');
        return;
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      navigate('/login');
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        console.error('No token found');
        return;
      }

      const response = await axios.get(`http://localhost:5001/api/doctor/appointments?filter=${filter}`, {
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
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      setUpdating(true);
      const token = localStorage.getItem('token');
      
      await axios.put(
        `http://localhost:5001/api/doctor/appointments/${appointmentId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state
      setAppointments(prev => prev.map(apt => 
        apt._id === appointmentId ? { ...apt, status: newStatus } : apt
      ));
      
      alert('Appointment status updated successfully!');
    } catch (error) {
      console.error('Error updating appointment status:', error);
      alert('Error updating appointment status');
    } finally {
      setUpdating(false);
    }
  };

  const addNotesAndDiagnosis = async () => {
    if (!selectedAppointment || !notes.trim() || !diagnosis.trim()) {
      alert('Please provide both notes and diagnosis');
      return;
    }

    try {
      setUpdating(true);
      const token = localStorage.getItem('token');
      
      await axios.put(
        `http://localhost:5001/api/doctor/appointments/${selectedAppointment._id}/notes`,
        { notes: notes.trim(), diagnosis: diagnosis.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state
      setAppointments(prev => prev.map(apt => 
        apt._id === selectedAppointment._id 
          ? { ...apt, notes: notes.trim(), diagnosis: diagnosis.trim() }
          : apt
      ));
      
      setShowNotesModal(false);
      setNotes('');
      setDiagnosis('');
      setSelectedAppointment(null);
      alert('Notes and diagnosis added successfully!');
    } catch (error) {
      console.error('Error adding notes and diagnosis:', error);
      alert('Error adding notes and diagnosis');
    } finally {
      setUpdating(false);
    }
  };

  const getFilteredAppointments = () => {
    const today = new Date().toISOString().split('T')[0];
    
    switch (filter) {
      case 'today':
        return appointments.filter(apt => apt.booking_date.split('T')[0] === today);
      case 'upcoming':
        return appointments.filter(apt => apt.booking_date.split('T')[0] > today);
      case 'all':
        return appointments;
      default:
        return appointments;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DoctorSidebar />
      <div className="flex-1 ml-64">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/doctor/dashboard')}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                >
                  <HiArrowLeft className="h-5 w-5" />
                  <span>Back to Dashboard</span>
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
                  <p className="text-gray-600">Manage your patient appointments</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'today', label: 'Today', count: appointments.filter(apt => apt.booking_date.split('T')[0] === new Date().toISOString().split('T')[0]).length },
                { key: 'upcoming', label: 'Upcoming', count: appointments.filter(apt => apt.booking_date.split('T')[0] > new Date().toISOString().split('T')[0]).length },
                { key: 'all', label: 'All Appointments', count: appointments.length }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    filter === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Appointments List */}
        <div className="bg-white shadow-sm rounded-lg">
          {getFilteredAppointments().length === 0 ? (
            <div className="text-center py-12">
              <HiCalendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments</h3>
              <p className="mt-1 text-sm text-gray-500">
                {filter === 'today' ? "You don't have any appointments today." :
                 filter === 'upcoming' ? "You don't have any upcoming appointments." :
                 "You don't have any appointments yet."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {getFilteredAppointments().map((appointment) => (
                <div key={appointment._id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <HiUser className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {appointment.patient_name}
                          </p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                            {appointment.status}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <HiCalendar className="h-4 w-4" />
                            <span>{new Date(appointment.booking_date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <HiClock className="h-4 w-4" />
                            <span>{appointment.time_slot}</span>
                          </div>
                          {appointment.patient_phone && (
                            <div className="flex items-center space-x-1">
                              <HiPhone className="h-4 w-4" />
                              <span>{appointment.patient_phone}</span>
                            </div>
                          )}
                        </div>
                        {appointment.symptoms && (
                          <p className="mt-1 text-sm text-gray-600">
                            <strong>Symptoms:</strong> {appointment.symptoms}
                          </p>
                        )}
                        {appointment.diagnosis && (
                          <p className="mt-1 text-sm text-gray-600">
                            <strong>Diagnosis:</strong> {appointment.diagnosis}
                          </p>
                        )}
                        {appointment.notes && (
                          <p className="mt-1 text-sm text-gray-600">
                            <strong>Notes:</strong> {appointment.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedAppointment(appointment);
                          setShowPatientModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Patient Details"
                      >
                        <HiEye className="h-5 w-5" />
                      </button>
                      {appointment.status === 'booked' || appointment.status === 'in_queue' ? (
                        <>
                          <button
                            onClick={() => updateAppointmentStatus(appointment._id, 'consulted')}
                            disabled={updating}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                            title="Mark as Consulted"
                          >
                            <HiCheck className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => updateAppointmentStatus(appointment._id, 'cancelled')}
                            disabled={updating}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            title="Cancel Appointment"
                          >
                            <HiX className="h-5 w-5" />
                          </button>
                        </>
                      ) : null}
                      {appointment.status === 'consulted' && !appointment.notes && (
                        <button
                          onClick={() => {
                            setSelectedAppointment(appointment);
                            setShowNotesModal(true);
                          }}
                          className="text-purple-600 hover:text-purple-900"
                          title="Add Notes & Diagnosis"
                        >
                          <HiClipboardList className="h-5 w-5" />
                        </button>
                      )}
                      {appointment.status === 'consulted' && (
                        <button
                          onClick={() => {
                            setSelectedAppointment(appointment);
                            setShowPrescriptionModal(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Add Prescription"
                        >
                          <HiPencil className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notes Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add Notes & Diagnosis</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Diagnosis</label>
                <input
                  type="text"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Enter diagnosis"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={4}
                  placeholder="Enter consultation notes"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowNotesModal(false);
                  setNotes('');
                  setDiagnosis('');
                  setSelectedAppointment(null);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={addNotesAndDiagnosis}
                disabled={updating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {updating ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Patient Details Modal */}
      {showPatientModal && selectedAppointment && (
        <PatientDetailsModal
          patient={selectedAppointment}
          onClose={() => {
            setShowPatientModal(false);
            setSelectedAppointment(null);
          }}
        />
      )}

      {/* Prescription Modal */}
      {showPrescriptionModal && selectedAppointment && (
        <PrescriptionModal
          appointment={selectedAppointment}
          onClose={() => {
            setShowPrescriptionModal(false);
            setSelectedAppointment(null);
          }}
        />
      )}
      </div>
    </div>
  );
}