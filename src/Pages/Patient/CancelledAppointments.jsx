import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_CONFIG } from '../../config/urls';
import { 
  HiArrowLeft, 
  HiCalendar, 
  HiClock, 
  HiUser, 
  HiX, 
  HiDocumentText, 
  HiCreditCard,
  HiExclamationCircle
} from 'react-icons/hi';

export default function CancelledAppointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchCancelledAppointments();
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      setUser(userData);
    } catch (err) {
      console.error('Failed to load user data:', err);
    }
  };

  const fetchCancelledAppointments = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const response = await axios.get('${API_CONFIG.BASE_URL}/api/patient/appointments', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Filter only cancelled appointments
      const cancelledAppointments = response.data.appointments.filter(apt => apt.status === 'cancelled');
      setAppointments(cancelledAppointments);
    } catch (err) {
      console.error('Failed to load cancelled appointments:', err);
      setError('Failed to load cancelled appointments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'cancelled':
        return <HiX className="h-4 w-4" />;
      default:
        return <HiDocumentText className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading cancelled appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <HiArrowLeft className="h-5 w-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Cancelled Appointments</h1>
              <p className="text-sm text-slate-500">Your cancelled appointment records</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center">
              <HiExclamationCircle className="h-4 w-4 text-red-500 mr-2" />
              <span className="text-red-700 text-sm font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Appointments List */}
        {appointments.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiX className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No Cancelled Appointments</h3>
            <p className="text-slate-500">You haven't cancelled any appointments yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`px-3 py-1 rounded-full border text-xs font-medium flex items-center space-x-1 ${getStatusColor(appointment.status)}`}>
                        {getStatusIcon(appointment.status)}
                        <span>Cancelled</span>
                      </div>
                      <span className="text-sm text-slate-500">
                        {appointment.tokenNumber ? `Token #${appointment.tokenNumber}` : `Appointment #${appointment.id.slice(-6)}`}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center space-x-3">
                        <HiUser className="h-5 w-5 text-slate-400" />
                        <div>
                          <p className="text-sm font-medium text-slate-900">Dr. {appointment.doctorName}</p>
                          <p className="text-xs text-slate-500">{appointment.department}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <HiCalendar className="h-5 w-5 text-slate-400" />
                        <div>
                          <p className="text-sm font-medium text-slate-900">{formatDate(appointment.appointmentDate)}</p>
                          <p className="text-xs text-slate-500">{formatTime(appointment.timeSlot)}</p>
                        </div>
                      </div>
                    </div>

                    {appointment.patientName && (
                      <div className="flex items-center space-x-3 mb-4">
                        <HiUser className="h-5 w-5 text-slate-400" />
                        <div>
                          <p className="text-sm text-slate-600">Patient: {appointment.patientName}</p>
                        </div>
                      </div>
                    )}

                    {appointment.cancelReason && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                        <div className="flex items-start space-x-2">
                          <HiExclamationCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-red-800">Cancellation Reason:</p>
                            <p className="text-sm text-red-700">{appointment.cancelReason}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {appointment.consultationType === 'video' && (
                      <div className="flex items-center space-x-2 text-blue-600 text-sm">
                        <HiVideoCamera className="h-4 w-4" />
                        <span>Video Consultation</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={() => navigate('/invoices')}
                      className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors flex items-center space-x-2"
                    >
                      <HiCreditCard className="h-4 w-4" />
                      <span>View Invoice</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
