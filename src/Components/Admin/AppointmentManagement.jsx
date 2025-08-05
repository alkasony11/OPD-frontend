import { useState, useEffect } from 'react';
import { HiCalendar, HiClock, HiUser, HiPhone, HiMail, HiCheck, HiX, HiEye } from 'react-icons/hi';
import axios from 'axios';

export default function AppointmentManagement() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [appointmentsPerPage] = useState(8);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/api/admin/appointments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAppointments(response.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      // Mock data for demonstration
      setAppointments([
        {
          _id: '1',
          patientName: 'John Doe',
          patientEmail: 'john@example.com',
          patientPhone: '+1234567890',
          doctorName: 'Dr. Smith',
          department: 'Cardiology',
          appointmentDate: '2024-01-25',
          appointmentTime: '10:00',
          status: 'pending',
          symptoms: 'Chest pain and shortness of breath',
          createdAt: '2024-01-20T09:30:00Z'
        },
        {
          _id: '2',
          patientName: 'Jane Wilson',
          patientEmail: 'jane@example.com',
          patientPhone: '+1234567891',
          doctorName: 'Dr. Johnson',
          department: 'Dermatology',
          appointmentDate: '2024-01-24',
          appointmentTime: '14:30',
          status: 'confirmed',
          symptoms: 'Skin rash and itching',
          createdAt: '2024-01-19T11:15:00Z'
        },
        {
          _id: '3',
          patientName: 'Mike Brown',
          patientEmail: 'mike@example.com',
          patientPhone: '+1234567892',
          doctorName: 'Dr. Davis',
          department: 'Orthopedics',
          appointmentDate: '2024-01-23',
          appointmentTime: '09:00',
          status: 'completed',
          symptoms: 'Knee pain after sports injury',
          createdAt: '2024-01-18T16:45:00Z'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:5001/api/admin/appointments/${appointmentId}`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setAppointments(appointments.map(apt => 
        apt._id === appointmentId ? { ...apt, status: newStatus } : apt
      ));
    } catch (error) {
      console.error('Error updating appointment:', error);
      // For demo, update locally
      setAppointments(appointments.map(apt => 
        apt._id === appointmentId ? { ...apt, status: newStatus } : apt
      ));
    }
  };

  const filteredAppointments = appointments.filter(appointment => {
    const matchesStatus = filterStatus === 'all' || appointment.status === filterStatus;
    const matchesDate = !filterDate || appointment.appointmentDate === filterDate;
    return matchesStatus && matchesDate;
  });

  const indexOfLastAppointment = currentPage * appointmentsPerPage;
  const indexOfFirstAppointment = indexOfLastAppointment - appointmentsPerPage;
  const currentAppointments = filteredAppointments.slice(indexOfFirstAppointment, indexOfLastAppointment);
  const totalPages = Math.ceil(filteredAppointments.length / appointmentsPerPage);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Appointment Management</h3>
          <p className="text-sm text-gray-600">Manage all patient appointments</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <span className="text-sm text-gray-600">
            Total: {filteredAppointments.length} appointments
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="text-sm text-gray-600 flex items-center">
            Showing {currentAppointments.length} of {filteredAppointments.length} appointments
          </div>
        </div>
      </div>

      {/* Appointments Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {currentAppointments.map((appointment) => (
          <div key={appointment._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {appointment.patientName.charAt(0).toUpperCase()}
                </div>
                <div className="ml-3">
                  <h4 className="text-lg font-semibold text-gray-900">{appointment.patientName}</h4>
                  <p className="text-sm text-gray-600">{appointment.department}</p>
                </div>
              </div>
              <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
              </span>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <HiUser className="h-4 w-4 mr-2" />
                <span>Dr. {appointment.doctorName}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <HiCalendar className="h-4 w-4 mr-2" />
                <span>{formatDate(appointment.appointmentDate)}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <HiClock className="h-4 w-4 mr-2" />
                <span>{appointment.appointmentTime}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <HiPhone className="h-4 w-4 mr-2" />
                <span>{appointment.patientPhone}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <HiMail className="h-4 w-4 mr-2" />
                <span>{appointment.patientEmail}</span>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Symptoms:</span> {appointment.symptoms}
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex space-x-2">
                {appointment.status === 'pending' && (
                  <>
                    <button
                      onClick={() => updateAppointmentStatus(appointment._id, 'confirmed')}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                    >
                      <HiCheck className="h-3 w-3 mr-1" />
                      Confirm
                    </button>
                    <button
                      onClick={() => updateAppointmentStatus(appointment._id, 'cancelled')}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                    >
                      <HiX className="h-3 w-3 mr-1" />
                      Cancel
                    </button>
                  </>
                )}
                {appointment.status === 'confirmed' && (
                  <button
                    onClick={() => updateAppointmentStatus(appointment._id, 'completed')}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <HiCheck className="h-3 w-3 mr-1" />
                    Mark Complete
                  </button>
                )}
              </div>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                <HiEye className="h-4 w-4 inline mr-1" />
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{indexOfFirstAppointment + 1}</span> to{' '}
                <span className="font-medium">{Math.min(indexOfLastAppointment, filteredAppointments.length)}</span> of{' '}
                <span className="font-medium">{filteredAppointments.length}</span> results
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
