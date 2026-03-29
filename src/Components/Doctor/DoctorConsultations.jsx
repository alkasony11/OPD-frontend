import { useState, useEffect } from 'react';
import { 
  HiCalendar, 
  HiClock, 
  HiUser, 
  HiPhone, 
  HiMail, 
  HiEye, 
  HiCheckCircle,
  HiXCircle,
  HiRefresh,
  HiFilter,
  HiSearch,
  HiChevronDown,
  HiChevronUp
} from 'react-icons/hi';
import axios from 'axios';
import DiagnosisModal from '../Admin/DiagnosisModal';

export default function DoctorConsultations() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('booked');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchDoctorAppointments();
  }, [selectedStatus, currentPage]);

  const fetchDoctorAppointments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      let url = '/api/doctor/appointments?';
      const params = new URLSearchParams();
      
      if (selectedStatus !== 'all') {
        params.append('filter', selectedStatus);
      }
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      params.append('page', currentPage);
      params.append('limit', 20);

      const response = await axios.get(url + params.toString(), {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAppointments(response.data.appointments || []);
      setTotalPages(Math.ceil((response.data.total || 0) / 20));
    } catch (error) {
      console.error('Error fetching doctor appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAttendAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setShowDiagnosisModal(true);
  };

  const handleDiagnosisSaved = () => {
    setShowDiagnosisModal(false);
    setSelectedAppointment(null);
    fetchDoctorAppointments(); // Refresh the list
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'booked':
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'booked':
        return <HiCalendar className="h-4 w-4" />;
      case 'consulted':
        return <HiCheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <HiXCircle className="h-4 w-4" />;
      case 'missed':
        return <HiXCircle className="h-4 w-4" />;
      default:
        return <HiCalendar className="h-4 w-4" />;
    }
  };

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = !searchTerm || 
      appointment.patient_id?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.token_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Consultations</h1>
        <p className="text-gray-600">Manage and conduct consultations with your patients</p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by patient name or token..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <HiFilter className="h-5 w-5" />
            <span>Filters</span>
            {showFilters ? <HiChevronUp className="h-4 w-4" /> : <HiChevronDown className="h-4 w-4" />}
          </button>

          {/* Refresh */}
          <button
            onClick={fetchDoctorAppointments}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <HiRefresh className="h-5 w-5" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Appointments</option>
                  <option value="booked">Booked (Ready for Consultation)</option>
                  <option value="consulted">Consulted</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="missed">Missed</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading appointments...</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="p-8 text-center">
            <HiCalendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No appointments found</p>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
                <div className="col-span-2">Token</div>
                <div className="col-span-3">Patient</div>
                <div className="col-span-2">Date & Time</div>
                <div className="col-span-2">Symptoms</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-2">Actions</div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-200">
              {filteredAppointments.map((appointment) => (
                <div key={appointment._id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Token */}
                    <div className="col-span-2">
                      <span className="font-medium text-blue-600">
                        #{appointment.token_number}
                      </span>
                    </div>

                    {/* Patient */}
                    <div className="col-span-3">
                      <div className="flex items-center space-x-2">
                        <HiUser className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {appointment.patient_id?.name || 'N/A'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {appointment.family_member_id?.name && 
                              `(${appointment.family_member_id.relation})`
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Date & Time */}
                    <div className="col-span-2">
                      <div className="flex items-center space-x-2">
                        <HiCalendar className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(appointment.booking_date).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-500 flex items-center">
                            <HiClock className="h-3 w-3 mr-1" />
                            {appointment.time_slot}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Symptoms */}
                    <div className="col-span-2">
                      <p className="text-sm text-gray-900">
                        {appointment.symptoms || 'Not provided'}
                      </p>
                    </div>

                    {/* Status */}
                    <div className="col-span-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                        {getStatusIcon(appointment.status)}
                        <span className="ml-1 capitalize">{appointment.status}</span>
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="col-span-2">
                      {appointment.status === 'booked' ? (
                        <button
                          onClick={() => handleAttendAppointment(appointment)}
                          className="inline-flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <HiCheckCircle className="h-4 w-4 mr-1" />
                          Start Consultation
                        </button>
                      ) : appointment.status === 'consulted' ? (
                        <button
                          onClick={() => handleAttendAppointment(appointment)}
                          className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <HiEye className="h-4 w-4 mr-1" />
                          View Consultation
                        </button>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Diagnosis Modal */}
      {showDiagnosisModal && selectedAppointment && (
        <DiagnosisModal
          appointment={selectedAppointment}
          onClose={() => {
            setShowDiagnosisModal(false);
            setSelectedAppointment(null);
          }}
          onSave={handleDiagnosisSaved}
        />
      )}
    </div>
  );
}
