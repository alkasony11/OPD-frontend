import { useState, useEffect } from 'react';
import { HiCalendar, HiClock, HiUser, HiPhone, HiMail, HiCheck, HiX, HiEye } from 'react-icons/hi';
import api from '../../utils/api';
import { mapAdminAppointment } from '../../utils/mappers';

export default function AppointmentManagement() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [appointmentsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [showDetails, setShowDetails] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => { fetchDoctors(); }, []);

  useEffect(() => {
    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, filterDate, doctorId, currentPage]);

  const fetchAppointments = async () => {
    try {
      const query = new URLSearchParams();
      if (filterStatus && filterStatus !== 'all') query.append('status', filterStatus);
      if (filterDate) {
        query.append('startDate', filterDate);
        query.append('endDate', filterDate);
      }
      if (doctorId) query.append('doctorId', doctorId);
      query.append('page', String(currentPage));
      query.append('limit', String(appointmentsPerPage));
      const response = await api.get(`/api/admin/appointments?${query.toString()}`);
      // Normalize API response: { appointments, total, page, limit }
      const rows = Array.isArray(response.data?.appointments) ? response.data.appointments : [];
      setAppointments(rows.map(mapAdminAppointment));
      const total = Number(response.data?.total || rows.length);
      setTotalPages(Math.max(1, Math.ceil(total / appointmentsPerPage)));
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await api.get('/api/admin/doctors');
      const list = Array.isArray(res.data) ? res.data : [];
      setDoctors(list.map(d => ({ id: d._id, name: d.name })));
    } catch {
      setDoctors([]);
    }
  };

  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      await api.patch(`/api/admin/appointments/${appointmentId}`, { status: newStatus });
      setAppointments(appointments.map(apt => 
        (apt.id === appointmentId || apt._id === appointmentId) ? { ...apt, status: newStatus } : apt
      ));
    } catch (error) {
      console.error('Error updating appointment:', error);
      setAppointments(appointments.map(apt => 
        (apt.id === appointmentId || apt._id === appointmentId) ? { ...apt, status: newStatus } : apt
      ));
    }
  };

  const filteredAppointments = appointments.filter(appointment => {
    const matchesStatus = filterStatus === 'all' || appointment.status === filterStatus;
    const matchesDate = !filterDate || (appointment.date && new Date(appointment.date).toISOString().split('T')[0] === filterDate);
    return matchesStatus && matchesDate;
  });

  const indexOfLastAppointment = currentPage * appointmentsPerPage; // legacy calc (not used in server mode)
  const indexOfFirstAppointment = indexOfLastAppointment - appointmentsPerPage; // legacy calc (not used in server mode)
  const currentAppointments = appointments; // server-paginated list

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'consulted': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getSessionDisplay = (timeString) => {
    if (timeString === '09:00') {
      return 'Morning Session (9:00 AM - 1:00 PM)';
    } else if (timeString === '14:00') {
      return 'Afternoon Session (2:00 PM - 6:00 PM)';
    }
    return timeString;
  };

  const exportCsv = async () => {
    const query = new URLSearchParams();
    if (filterStatus && filterStatus !== 'all') query.append('status', filterStatus);
    if (filterDate) { query.append('startDate', filterDate); query.append('endDate', filterDate); }
    if (doctorId) query.append('doctorId', doctorId);
    query.append('page', '1');
    query.append('limit', '500');
    const res = await api.get(`/api/admin/appointments?${query.toString()}`);
    const rows = (res.data?.appointments || []).map(mapAdminAppointment);
    const header = ['Date','Time','Patient','Doctor','Department','Status','Token'];
    const body = rows.map(r => [
      r.date ? new Date(r.date).toLocaleDateString() : '',
      r.time || '',
      r.patientName || '',
      r.doctor || '',
      r.department || '',
      r.status || '',
      r.tokenNumber || ''
    ]);
    const csv = [header, ...body]
      .map(line => line.map(v => String(v).replace(/"/g,'""')).map(v=>`"${v}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `appointments_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          <select
            value={doctorId}
            onChange={(e) => { setDoctorId(e.target.value); setCurrentPage(1); }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Doctors</option>
            {doctors.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">Page {currentPage} of {totalPages}</div>
            <button onClick={exportCsv} className="px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700">Export CSV</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {currentAppointments.map((appointment) => (
          <div key={appointment.id || appointment._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {(appointment.patientName || 'U').charAt(0).toUpperCase()}
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
                <span>Dr. {appointment.doctor}</span>
                {appointment.autoAssigned && (
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    Auto-Assigned
                  </span>
                )}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <HiCalendar className="h-4 w-4 mr-2" />
                <span>{formatDate(appointment.date)}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <HiClock className="h-4 w-4 mr-2" />
                <span>{getSessionDisplay(appointment.time)}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <HiPhone className="h-4 w-4 mr-2" />
                <span>{appointment.patientPhone || ''}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <HiMail className="h-4 w-4 mr-2" />
                <span>{appointment.patientEmail || ''}</span>
              </div>
              {appointment.tokenNumber && (
                <div className="flex items-center text-sm text-gray-600">
                  <span className="font-medium mr-2">Token:</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-mono">
                    {appointment.tokenNumber}
                  </span>
                </div>
              )}
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
                      onClick={() => updateAppointmentStatus(appointment.id || appointment._id, 'confirmed')}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                    >
                      <HiCheck className="h-3 w-3 mr-1" />
                      Confirm
                    </button>
                    <button
                      onClick={() => updateAppointmentStatus(appointment.id || appointment._id, 'cancelled')}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                    >
                      <HiX className="h-3 w-3 mr-1" />
                      Cancel
                    </button>
                  </>
                )}
                {appointment.status === 'confirmed' && (
                  <button
                    onClick={() => updateAppointmentStatus(appointment.id || appointment._id, 'completed')}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <HiCheck className="h-3 w-3 mr-1" />
                    Mark Complete
                  </button>
                )}
              </div>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium" onClick={() => { setSelected(appointment); setShowDetails(true); }}>
                <HiEye className="h-4 w-4 inline mr-1" />
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Server paginated list
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetails && selected && (
        <div className="fixed inset-0 bg-gray-900/30 z-50 flex justify-end">
          <div className="w-full max-w-md h-full bg-white shadow-xl p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Appointment Details</h3>
              <button onClick={() => setShowDetails(false)} className="text-gray-500 hover:text-gray-700">Close</button>
            </div>
            <div className="space-y-3 text-sm">
              <div><span className="font-medium">Patient:</span> {selected.patientName}</div>
              <div><span className="font-medium">Doctor:</span> {selected.doctor}</div>
              <div><span className="font-medium">Department:</span> {selected.department}</div>
              <div><span className="font-medium">Date:</span> {selected.date ? new Date(selected.date).toLocaleDateString() : ''}</div>
              <div><span className="font-medium">Time:</span> {selected.time || ''}</div>
              <div><span className="font-medium">Status:</span> {selected.status}</div>
              {selected.tokenNumber && (<div><span className="font-medium">Token:</span> {selected.tokenNumber}</div>)}
              {selected.patientEmail && (<div><span className="font-medium">Email:</span> {selected.patientEmail}</div>)}
              {selected.patientPhone && (<div><span className="font-medium">Phone:</span> {selected.patientPhone}</div>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
