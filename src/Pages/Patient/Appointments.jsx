import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { HiArrowLeft, HiCalendar, HiClock, HiTag, HiX, HiPencil } from 'react-icons/hi';

export default function Appointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('upcoming'); // upcoming | past | all
  const [rescheduling, setRescheduling] = useState(null); // appointment being rescheduled
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlots, setRescheduleSlots] = useState([]);

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    applyFilter(filter);
  }, [appointments, filter]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/api/patient/appointments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAppointments(response.data.appointments || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = (type) => {
    if (!appointments || appointments.length === 0) {
      setFiltered([]);
      return;
    }

    const now = new Date();
    const list = appointments.filter((apt) => {
      const aptDate = new Date(apt.appointmentDate);
      const isUpcoming = aptDate >= new Date(now.toDateString());
      if (type === 'upcoming') return isUpcoming;
      if (type === 'past') return !isUpcoming;
      return true;
    });
    setFiltered(list);
  };

  const cancelAppointment = async (apt) => {
    if (!window.confirm('Cancel this appointment? You can cancel up to 2 hours before.')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5001/api/patient/appointments/${apt.id}/cancel`, { reason: 'User cancelled' }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchAppointments();
      alert('Appointment cancelled');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel');
    }
  };

  const openReschedule = async (apt) => {
    setRescheduling(apt);
    setRescheduleDate('');
    setRescheduleSlots([]);
  };

  const loadSlots = async () => {
    if (!rescheduling || !rescheduleDate) return;
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`http://localhost:5001/api/patient/doctors/${rescheduling.doctorId}/availability/${rescheduleDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRescheduleSlots(data.slots || []);
    } catch (err) {
      setRescheduleSlots([]);
    }
  };

  const submitReschedule = async (slotTime) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5001/api/patient/appointments/${rescheduling.id}/reschedule`, {
        doctorId: rescheduling.doctorId,
        newDate: rescheduleDate,
        newTime: slotTime
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRescheduling(null);
      setRescheduleDate('');
      setRescheduleSlots([]);
      await fetchAppointments();
      alert('Appointment rescheduled');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reschedule');
    }
  };

  const formatDate = (date) => new Date(date).toLocaleDateString(undefined, {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
              <p className="text-gray-600 mt-1">View and track your bookings</p>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <HiArrowLeft className="h-5 w-5" />
              <span>Back</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* Filters */}
          <div className="flex items-center gap-2 mb-6">
            {['upcoming', 'past', 'all'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  filter === f ? 'bg-black text-white border-black' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {f[0].toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading appointments...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <HiCalendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No appointments found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((apt) => (
                <div key={apt.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{apt.doctorName}</h3>
                      <p className="text-sm text-gray-600">{apt.departmentName}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      apt.status === 'booked' ? 'bg-green-100 text-green-800' :
                      apt.status === 'in_queue' ? 'bg-blue-100 text-blue-800' :
                      apt.status === 'consulted' ? 'bg-purple-100 text-purple-800' :
                      apt.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      apt.status === 'missed' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {apt.status}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <HiCalendar className="h-4 w-4 text-gray-500" />
                      <span>{formatDate(apt.appointmentDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <HiClock className="h-4 w-4 text-gray-500" />
                      <span>{apt.appointmentTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <HiTag className="h-4 w-4 text-gray-500" />
                      <span>Token: {apt.tokenNumber || '-'}</span>
                    </div>
                  </div>
                  {apt.symptoms && (
                    <p className="mt-3 text-sm text-gray-600 line-clamp-2">Symptoms: {apt.symptoms}</p>
                  )}
                  <div className="mt-3 flex gap-2">
                    {apt.status === 'booked' && (
                      <>
                        <button onClick={() => cancelAppointment(apt)} className="px-3 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 flex items-center gap-1">
                          <HiX className="h-4 w-4" /> Cancel
                        </button>
                        <button onClick={() => openReschedule(apt)} className="px-3 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50 flex items-center gap-1">
                          <HiPencil className="h-4 w-4" /> Reschedule
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reschedule Modal */}
      {rescheduling && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Reschedule Appointment</h3>
              <button onClick={() => { setRescheduling(null); setRescheduleDate(''); setRescheduleSlots([]); }} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Date</label>
                <input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                <button onClick={loadSlots} disabled={!rescheduleDate} className="mt-2 px-3 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">Load Slots</button>
              </div>
              <div>
                {rescheduleSlots.length === 0 ? (
                  <p className="text-sm text-gray-600">Select a date and click Load Slots.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 max-h-56 overflow-auto">
                    {rescheduleSlots.map((s) => (
                      <button key={s.time} onClick={() => submitReschedule(s.time)} className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                        {s.displayTime || s.time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

