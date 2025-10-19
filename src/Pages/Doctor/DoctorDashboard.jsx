import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HiCalendar, HiUsers, HiArrowRight, HiTrendingUp, HiVideoCamera, HiExternalLink, HiCheckCircle, HiEye } from 'react-icons/hi';
import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../../config/api';
import DoctorSidebar from '../../Components/Doctor/Sidebar';
import NotificationBell from '../../Components/Doctor/NotificationBell';
import DiagnosisModal from '../../Components/Admin/DiagnosisModal';
import PatientConsultationModal from '../../Components/Doctor/PatientConsultationModal';

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [doctor, setDoctor] = useState(null);
  const [stats, setStats] = useState({
    todayAppointments: 0,
    totalPatients: 0,
    bookedPatients: 0,
    availableDays: 0,
    leaveDays: 0,
    activeTokens: 0,
    completedAppointments: 0,
    pendingAppointments: 0
  });
  const [allAppointments, setAllAppointments] = useState([]);
  const [bookedPatients, setBookedPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLeaveRequestModal, setShowLeaveRequestModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ date: '', reason: '' });
  const [appointmentFilter, setAppointmentFilter] = useState('all'); // all, today, upcoming, past
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [todayQueue, setTodayQueue] = useState({ date: '', sessions: [] });
  const [nextPatient, setNextPatient] = useState(null);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);
  const [showConsultationModal, setShowConsultationModal] = useState(false);

  useEffect(() => {
    checkDoctorAuth();
  }, []);

  useEffect(() => {
    if (doctor) {
      fetchDashboardData();
      fetchTodayQueue();
      fetchNextPatient();
      fetchLeaveRequests();
      // If sidebar link was used to open leave modal
      const params = new URLSearchParams(location.search);
      if (params.get('open') === 'leave') {
        setLeaveForm({ date: new Date().toISOString().split('T')[0], reason: '' });
        setShowLeaveRequestModal(true);
      }
    }
  }, [doctor, location.search]);

  useEffect(() => {
    if (doctor) {
      fetchAppointments();
    }
  }, [doctor, appointmentFilter, currentPage]);

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
      setDoctor(parsedUser);
    } catch (error) {
      console.error('Error parsing user data:', error);
      navigate('/login');
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('${API_BASE_URL}/api/doctor/leave-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeaveRequests(Array.isArray(res.data?.leaveRequests) ? res.data.leaveRequests : []);
    } catch (e) {
      console.error('Error fetching leave requests:', e);
      setLeaveRequests([]);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');

      // Fetch all appointments for stats
      const allAppointmentsResponse = await axios.get(
        '${API_BASE_URL}/api/doctor/appointments',
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Fetch booked patients
      const bookedPatientsResponse = await axios.get(
        '${API_BASE_URL}/api/doctor/booked-patients',
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Fetch patients
      const patientsResponse = await axios.get(
        '${API_BASE_URL}/api/doctor/patients',
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Fetch schedules
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
      const schedulesResponse = await axios.get(
        `${API_BASE_URL}/api/doctor/schedules?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const allAppointmentsData = Array.isArray(allAppointmentsResponse.data?.appointments)
        ? allAppointmentsResponse.data.appointments
        : [];
      const patients = Array.isArray(patientsResponse.data?.patients)
        ? patientsResponse.data.patients
        : [];
      const schedules = Array.isArray(schedulesResponse.data?.schedules)
        ? schedulesResponse.data.schedules
        : [];
      const bookedPatientsData = Array.isArray(bookedPatientsResponse.data?.patients)
        ? bookedPatientsResponse.data.patients
        : [];

      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      const todayAppointments = allAppointmentsData.filter(apt => {
        const d = apt?.booking_date;
        if (!d) return false;
        const isoDay = typeof d === 'string' && d.includes('T') ? d.split('T')[0] : new Date(d).toISOString().split('T')[0];
        return isoDay === today;
      });
      const completedAppointments = allAppointmentsData.filter(apt => apt?.status === 'consulted').length;
      const pendingAppointments = allAppointmentsData.filter(apt => apt?.status === 'booked' || apt?.status === 'in_queue').length;
      const availableDays = schedules.filter(s => s?.isAvailable).length;
      const leaveDays = schedules.filter(s => !s.isAvailable).length;
      const activeTokens = allAppointmentsData.filter(apt => apt.status === 'booked' || apt.status === 'in_queue').length;

      setStats({
        todayAppointments: todayAppointments.length,
        totalPatients: patients.length,
        bookedPatients: bookedPatientsData.length,
        availableDays,
        leaveDays,
        activeTokens,
        completedAppointments,
        pendingAppointments
      });
      
      // Set booked patients
      setBookedPatients(bookedPatientsData);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayQueue = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('${API_BASE_URL}/api/doctor/today-queue', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTodayQueue(res.data || { date: '', sessions: [] });
    } catch (error) {
      console.error('Error fetching today queue:', error);
      setTodayQueue({ date: '', sessions: [] });
    }
  };

  const fetchNextPatient = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('${API_BASE_URL}/api/doctor/next-patient', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNextPatient(res.data?.next || null);
    } catch (e) {
      console.error('Error fetching next patient:', e);
      setNextPatient(null);
    }
  };

  const startConsultation = async () => {
    if (!nextPatient) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post('${API_BASE_URL}/api/doctor/consultation/start', { tokenId: nextPatient.id }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchTodayQueue();
      await fetchNextPatient();
      navigate('/doctor/appointments');
    } catch (e) {
      console.error('Start consultation error:', e);
    }
  };

  const skipConsultation = async () => {
    if (!nextPatient) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post('${API_BASE_URL}/api/doctor/consultation/skip', { tokenId: nextPatient.id }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchTodayQueue();
      await fetchNextPatient();
    } catch (e) {
      console.error('Skip consultation error:', e);
    }
  };

  const markNoShow = async () => {
    if (!nextPatient) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post('${API_BASE_URL}/api/doctor/consultation/no-show', { tokenId: nextPatient.id }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchTodayQueue();
      await fetchNextPatient();
    } catch (e) {
      console.error('No-show error:', e);
    }
  };

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      
      // Always append the filter parameter, including 'all'
      params.append('filter', appointmentFilter);
      params.append('page', currentPage);
      params.append('limit', 10);

      const response = await axios.get(
        `${API_BASE_URL}/api/doctor/appointments?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAllAppointments(response.data.appointments || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleStartConsultation = (appointment) => {
    setSelectedAppointment(appointment);
    setShowConsultationModal(true);
  };

  const handleDiagnosisSaved = () => {
    setShowDiagnosisModal(false);
    setSelectedAppointment(null);
    // Refresh the queue data
    fetchTodayQueue();
    fetchNextPatient();
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex">
      <DoctorSidebar />
      <div className="flex-1 ml-64">
        {/* Professional Header */}
        <div className="bg-white shadow-lg border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-6 sm:py-8 space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center">
                  <HiUsers className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Medical Dashboard</h1>
                  <p className="text-base sm:text-lg text-gray-600 mt-1">Welcome back, Dr. {doctor?.name}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 sm:space-x-4 w-full sm:w-auto">
                <NotificationBell />
                <button
                  onClick={handleLogout}
                  className="bg-red-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl hover:bg-red-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl text-sm sm:text-base"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Enhanced Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* Today's Appointments */}
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 sm:p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide">Today's Appointments</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{stats.todayAppointments}</p>
                  <p className="text-xs text-gray-500 mt-1">Scheduled for today</p>
                </div>
                <div className="h-12 w-12 sm:h-16 sm:w-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
                  <HiCalendar className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
              </div>
            </div>
            
            {/* Total Patients */}
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 sm:p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide">Total Patients</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{stats.totalPatients}</p>
                  <p className="text-xs text-gray-500 mt-1">Registered patients</p>
                </div>
                <div className="h-12 w-12 sm:h-16 sm:w-16 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center">
                  <HiUsers className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
              </div>
            </div>
            
            {/* Completed Today */}
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 sm:p-6 border-l-4 border-emerald-500">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide">Completed Today</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{stats.completedAppointments}</p>
                  <p className="text-xs text-gray-500 mt-1">Consultations finished</p>
                </div>
                <div className="h-12 w-12 sm:h-16 sm:w-16 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                  <HiTrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
              </div>
            </div>
            
            {/* Pending Appointments */}
            <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-4 sm:p-6 border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide">Pending</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{stats.pendingAppointments}</p>
                  <p className="text-xs text-gray-500 mt-1">Awaiting consultation</p>
                </div>
                <div className="h-12 w-12 sm:h-16 sm:w-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center">
                  <HiCheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions & Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-6 sm:mb-8">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="h-10 w-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center">
                  <HiCheckCircle className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Quick Actions</h3>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/doctor/appointments')}
                  className="w-full flex items-center space-x-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all duration-200 group"
                >
                  <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <HiCalendar className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">View All Appointments</p>
                    <p className="text-xs text-gray-600">Manage your schedule</p>
                  </div>
                </button>
                <button
                  onClick={() => navigate('/doctor/patients')}
                  className="w-full flex items-center space-x-3 p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-all duration-200 group"
                >
                  <div className="h-8 w-8 bg-green-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <HiUsers className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Patient Records</p>
                    <p className="text-xs text-gray-600">Access patient history</p>
                  </div>
                </button>
                <button
                  onClick={() => navigate('/doctor/schedule')}
                  className="w-full flex items-center space-x-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-all duration-200 group"
                >
                  <div className="h-8 w-8 bg-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                    <HiTrendingUp className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Manage Schedule</p>
                    <p className="text-xs text-gray-600">Update availability</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="h-10 w-10 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center">
                  <HiTrendingUp className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Performance</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Completion Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalPatients > 0 ? Math.round((stats.completedAppointments / stats.totalPatients) * 100) : 0}%
                    </p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <HiCheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Active Tokens</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.activeTokens}</p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <HiUsers className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Available Days</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.availableDays}</p>
                  </div>
                  <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <HiCalendar className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Leave Requests Summary */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6 md:col-span-2 lg:col-span-1">
              <div className="flex items-center space-x-3 mb-6">
                <div className="h-10 w-10 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl flex items-center justify-center">
                  <HiCalendar className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Leave Requests</h3>
              </div>
              <div className="space-y-4">
                {leaveRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <HiCheckCircle className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500 font-medium">No leave requests</p>
                  </div>
                ) : (
                  <>
                    {leaveRequests.slice(0, 3).map((lr, index) => {
                      const s = new Date(lr.start_date);
                      const e = new Date(lr.end_date);
                      const dateStr = s.toDateString() === e.toDateString() ? s.toLocaleDateString() : `${s.toLocaleDateString()} - ${e.toLocaleDateString()}`;
                      return (
                        <div key={lr._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{dateStr}</p>
                            <p className="text-xs text-gray-600 capitalize">{lr.leave_type?.replace('_', ' ')}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            lr.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            lr.status === 'approved' ? 'bg-green-100 text-green-800' :
                            lr.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {lr.status}
                          </span>
                        </div>
                      );
                    })}
                    {leaveRequests.length > 3 && (
                      <button
                        onClick={() => navigate('/doctor/leave-requests')}
                        className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium py-2"
                      >
                        View all {leaveRequests.length} requests
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Next Patient - Enhanced Design */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-xl border border-blue-100 p-6 sm:p-8 mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <HiUsers className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Next Patient</h2>
              </div>
              <button 
                onClick={fetchNextPatient} 
                className="flex items-center space-x-2 px-4 py-2 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-md hover:shadow-lg w-full sm:w-auto"
              >
                <HiCalendar className="h-4 w-4" />
                <span className="font-medium">Refresh</span>
              </button>
            </div>
            
            {!nextPatient ? (
              <div className="text-center py-12">
                <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <HiUsers className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No patients waiting</h3>
                <p className="text-gray-500">All patients have been attended to</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="h-12 w-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                        <span className="text-white font-bold text-lg">#{nextPatient.tokenNumber}</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{nextPatient.patientName}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                          {nextPatient.age && <span>Age: {nextPatient.age}</span>}
                          {nextPatient.gender && <span>• {nextPatient.gender}</span>}
                        </div>
                      </div>
                    </div>
                    
                    {nextPatient.symptoms && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                        <h4 className="text-sm font-semibold text-yellow-800 mb-1">Symptoms</h4>
                        <p className="text-yellow-700">{nextPatient.symptoms}</p>
                      </div>
                    )}
                    
                    {nextPatient.appointmentType === 'video' && (nextPatient.meetingLink || nextPatient.meeting_link) && (
                      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 bg-purple-600 rounded-lg flex items-center justify-center">
                              <HiVideoCamera className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-purple-900">Video Consultation</h4>
                              <p className="text-xs text-purple-700">Click to join the meeting</p>
                            </div>
                          </div>
                          <button
                            onClick={() => window.open((nextPatient.meetingLink || nextPatient.meeting_link).meetingUrl, '_blank', 'noopener,noreferrer')}
                            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-all duration-200 shadow-md hover:shadow-lg"
                          >
                            <HiExternalLink className="h-4 w-4" />
                            <span>Join Meeting</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row lg:flex-col space-y-3 sm:space-y-0 sm:space-x-3 lg:space-x-0 lg:space-y-3 mt-6 lg:mt-0 lg:ml-6">
                    <button 
                      onClick={startConsultation} 
                      className="px-4 sm:px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl text-sm sm:text-base"
                    >
                      Start Consultation
                    </button>
                    <button 
                      onClick={skipConsultation} 
                      className="px-4 sm:px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium text-sm sm:text-base"
                    >
                      Skip / Call Later
                    </button>
                    <button 
                      onClick={markNoShow} 
                      className="px-4 sm:px-6 py-3 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-all duration-200 font-medium text-sm sm:text-base"
                    >
                      Mark as No-Show
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>


        {/* Leave Requests Tracker */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Leave Requests</h2>
            <button onClick={fetchLeaveRequests} className="text-gray-600 hover:text-gray-800 flex items-center space-x-1">
              <HiCalendar className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
          {leaveRequests.length === 0 ? (
            <div className="text-sm text-gray-500">No leave requests yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Session</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leaveRequests.slice(0, 8).map(lr => {
                    const s = new Date(lr.start_date);
                    const e = new Date(lr.end_date);
                    const dateStr = s.toDateString() === e.toDateString() ? s.toLocaleDateString() : `${s.toLocaleDateString()} - ${e.toLocaleDateString()}`;
                    return (
                      <tr key={lr._id}>
                        <td className="px-4 py-2 text-sm text-gray-900">{dateStr}</td>
                        <td className="px-4 py-2 text-sm capitalize">{lr.leave_type?.replace('_', ' ')}</td>
                        <td className="px-4 py-2 text-sm capitalize">{lr.leave_type === 'half_day' ? (lr.session || '-') : '-'}</td>
                        <td className="px-4 py-2 text-sm text-gray-700">{lr.reason || '-'}</td>
                        <td className="px-4 py-2 text-sm">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            lr.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            lr.status === 'approved' ? 'bg-green-100 text-green-800' :
                            lr.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>{lr.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>



          {/* Recent Appointments - Enhanced Design */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center">
                  <HiCalendar className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Recent Appointments</h2>
              </div>
              <button
                onClick={() => navigate('/doctor/appointments')}
                className="flex items-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl w-full sm:w-auto text-sm sm:text-base"
              >
                <span>View All</span>
                <HiArrowRight className="h-4 w-4" />
              </button>
            </div>

            {/* Enhanced Filter Tabs */}
            <div className="mb-6 sm:mb-8">
              <div className="bg-gray-50 rounded-2xl p-2">
                <nav className="flex flex-wrap gap-2">
                  {[
                    { key: 'all', label: 'All Appointments', icon: HiCalendar },
                    { key: 'today', label: 'Today', icon: HiCheckCircle },
                    { key: 'upcoming', label: 'Upcoming', icon: HiTrendingUp },
                    { key: 'past', label: 'Past', icon: HiEye }
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => {
                          setAppointmentFilter(tab.key);
                          setCurrentPage(1);
                        }}
                        className={`flex items-center space-x-2 px-3 sm:px-4 py-2 sm:py-3 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-200 ${
                          appointmentFilter === tab.key
                            ? 'bg-white text-blue-600 shadow-md'
                            : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          
            {allAppointments.length === 0 ? (
              <div className="text-center py-16">
                <div className="h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <HiCalendar className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {appointmentFilter === 'today' ? 'No appointments today' :
                   appointmentFilter === 'upcoming' ? 'No upcoming appointments' :
                   appointmentFilter === 'past' ? 'No past appointments' :
                   'No appointments found'}
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  {appointmentFilter === 'today' ? 'You have a free day! Take some time to review your schedule or catch up on other tasks.' :
                   appointmentFilter === 'upcoming' ? 'No future appointments scheduled. Check back later or update your availability.' :
                   appointmentFilter === 'past' ? 'No completed appointments yet. Your consultation history will appear here.' :
                   'No appointments have been scheduled yet. Patients can book appointments through the system.'}
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {allAppointments.map((appointment) => (
                    <div key={appointment._id} className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                            <HiUsers className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 mb-1">{appointment.patient_name}</h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                              <span className="flex items-center space-x-1">
                                <HiCalendar className="h-4 w-4" />
                                <span>{new Date(appointment.booking_date).toLocaleDateString()}</span>
                              </span>
                              <span className="font-medium">{appointment.time_slot}</span>
                            </div>
                            {appointment.token_number && (
                              <div className="inline-flex items-center space-x-1 bg-gray-100 px-3 py-1 rounded-full text-xs font-semibold text-gray-700 mb-3">
                                <span>Token #{appointment.token_number}</span>
                              </div>
                            )}
                            {appointment.symptoms && (
                              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                <p className="text-sm text-yellow-800 font-medium">Symptoms: {appointment.symptoms}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            appointment.status === 'booked' ? 'bg-yellow-100 text-yellow-800' :
                            appointment.status === 'in_queue' ? 'bg-blue-100 text-blue-800' :
                            appointment.status === 'consulted' ? 'bg-green-100 text-green-800' :
                            appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            appointment.status === 'missed' ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {appointment.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Enhanced Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-between">
                    <div className="text-sm text-gray-600 font-medium">
                      Showing page {currentPage} of {totalPages}
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-all duration-200"
                      >
                        <span>Previous</span>
                      </button>
                      <div className="flex items-center space-x-2">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const pageNum = i + 1;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all duration-200 ${
                                currentPage === pageNum
                                  ? 'bg-blue-600 text-white shadow-lg'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-all duration-200"
                      >
                        <span>Next</span>
                      </button>
                    </div>
                  </div>
                )}
            </>
          )}
              </div>
            </div>

      {/* Leave Request Modal */}
      {showLeaveRequestModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Request Leave</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input
                  type="date"
                  value={leaveForm.date}
                  onChange={(e) => setLeaveForm(prev => ({ ...prev, date: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Reason</label>
                <input
                  type="text"
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm(prev => ({ ...prev, reason: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="e.g., Medical leave, Vacation"
                />
              </div>
              <div className="text-xs text-gray-500">
                Your request will be reviewed by the admin. If approved, bookings for that date will be disabled and existing tokens cancelled.
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowLeaveRequestModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!leaveForm.date) { alert('Please select a date'); return; }
                  try {
                    const token = localStorage.getItem('token');
                  await axios.post(
                    '${API_BASE_URL}/api/doctor/leave-requests',
                    { 
                      leave_type: 'full_day',
                      start_date: leaveForm.date,
                      end_date: leaveForm.date,
                      reason: leaveForm.reason 
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                  );
                    setShowLeaveRequestModal(false);
                    setLeaveForm({ date: '', reason: '' });
                    alert('Leave request submitted');
                  } catch (error) {
                    console.error('Submit leave request error:', error);
                    alert('Error submitting leave request');
                  }
                }}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

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
          fetchTodayQueue();
          fetchNextPatient();
        }}
      />
      </div>
    </div>
  );
}