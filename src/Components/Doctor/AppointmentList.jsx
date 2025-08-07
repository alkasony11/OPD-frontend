import { useState, useEffect } from 'react';
import { HiCalendar, HiClock, HiUser, HiPhone, HiMail } from 'react-icons/hi';

export default function AppointmentList() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('today'); // today, upcoming, all

  useEffect(() => {
    fetchAppointments();
  }, [filter]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API call
      const mockAppointments = [
        {
          id: 1,
          patientName: 'John Doe',
          patientEmail: 'john@example.com',
          patientPhone: '+1-555-0123',
          date: '2024-01-15',
          time: '10:00 AM',
          type: 'Consultation',
          status: 'confirmed',
          notes: 'Regular checkup'
        },
        {
          id: 2,
          patientName: 'Jane Smith',
          patientEmail: 'jane@example.com',
          patientPhone: '+1-555-0124',
          date: '2024-01-15',
          time: '11:30 AM',
          type: 'Follow-up',
          status: 'pending',
          notes: 'Follow-up for previous treatment'
        },
        {
          id: 3,
          patientName: 'Mike Johnson',
          patientEmail: 'mike@example.com',
          patientPhone: '+1-555-0125',
          date: '2024-01-16',
          time: '2:00 PM',
          type: 'Emergency',
          status: 'confirmed',
          notes: 'Urgent consultation needed'
        }
      ];

      // Filter appointments based on selected filter
      let filteredAppointments = mockAppointments;
      const today = new Date().toISOString().split('T')[0];

      if (filter === 'today') {
        filteredAppointments = mockAppointments.filter(apt => apt.date === today);
      } else if (filter === 'upcoming') {
        filteredAppointments = mockAppointments.filter(apt => apt.date >= today);
      }

      setAppointments(filteredAppointments);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Emergency':
        return 'bg-red-100 text-red-800';
      case 'Follow-up':
        return 'bg-blue-100 text-blue-800';
      case 'Consultation':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
            {appointments.map((appointment) => (
              <div key={appointment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <HiUser className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{appointment.patientName}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <HiCalendar className="h-4 w-4" />
                          <span>{appointment.date}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <HiClock className="h-4 w-4" />
                          <span>{appointment.time}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <HiPhone className="h-4 w-4" />
                          <span>{appointment.patientPhone}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(appointment.type)}`}>
                      {appointment.type}
                    </span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                      {appointment.status}
                    </span>
                  </div>
                </div>
                {appointment.notes && (
                  <div className="mt-3 text-sm text-gray-600">
                    <strong>Notes:</strong> {appointment.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
