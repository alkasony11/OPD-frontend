import { useState, useEffect } from 'react';
import { HiCalendar, HiClock, HiUser, HiPlus } from 'react-icons/hi';

export default function AppointmentScheduler() {
  const [appointments, setAppointments] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/receptionist/appointments/today`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch appointments');
      }

      const data = await response.json();
      setAppointments(data.appointments || []);
    } finally {
      setLoading(false);
    }
  };

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30'
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isSlotBooked = (time) => {
    return appointments.some(apt => apt.timeSlot === time);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
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
          <h2 className="text-xl font-semibold text-gray-900">Appointment Scheduler</h2>
          <div className="flex items-center space-x-4">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <HiPlus className="h-5 w-5" />
              <span>New Appointment</span>
            </button>
          </div>
        </div>
      </div>

      {/* Time Slots Grid */}
      <div className="p-6">
        <div className="grid grid-cols-4 gap-4">
          {timeSlots.map((time) => {
            const appointment = appointments.find(apt => apt.timeSlot === time);
            const isBooked = isSlotBooked(time);

            return (
              <div
                key={time}
                className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                  isBooked
                    ? getStatusColor(appointment.status)
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1">
                    <HiClock className="h-4 w-4" />
                    <span className="font-medium">{time}</span>
                  </div>
                  {isBooked && (
                    <span className="text-xs px-2 py-1 rounded-full bg-white bg-opacity-50">
                      {appointment.tokenNumber}
                    </span>
                  )}
                </div>

                {isBooked ? (
                  <div>
                    <div className="flex items-center space-x-1 mb-1">
                      <HiUser className="h-3 w-3" />
                      <span className="text-sm font-medium">{appointment.patientName}</span>
                    </div>
                    <div className="text-xs text-gray-600">{appointment.doctorName}</div>
                    <div className="text-xs text-gray-600 capitalize">{appointment.status}</div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">Available</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 pb-6">
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-100 border-2 border-green-200 rounded"></div>
            <span>Confirmed</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-100 border-2 border-yellow-200 rounded"></div>
            <span>Pending</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-100 border-2 border-red-200 rounded"></div>
            <span>Cancelled</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-50 border-2 border-gray-200 rounded"></div>
            <span>Available</span>
          </div>
        </div>
      </div>
    </div>
  );
}
