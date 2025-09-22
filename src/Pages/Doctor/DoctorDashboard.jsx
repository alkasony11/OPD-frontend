import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { HiCalendar, HiClock, HiUsers, HiDocumentText, HiChartBar, HiCog, HiExclamation, HiArrowRight, HiTrendingUp, HiTrendingDown, HiVideoCamera, HiExternalLink } from 'react-icons/hi';
import DoctorSidebar from '../../Components/Doctor/Sidebar';

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

  useEffect(() => {
    checkDoctorAuth();
  }, []);

  useEffect(() => {
    if (doctor) {
      fetchDashboardData();
      fetchTodayQueue();
      fetchNextPatient();
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

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');

      // Fetch all appointments for stats
      const allAppointmentsResponse = await axios.get(
        'http://localhost:5001/api/doctor/appointments',
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Fetch booked patients
      const bookedPatientsResponse = await axios.get(
        'http://localhost:5001/api/doctor/booked-patients',
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Fetch patients
      const patientsResponse = await axios.get(
        'http://localhost:5001/api/doctor/patients',
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Fetch schedules
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
      const schedulesResponse = await axios.get(
        `http://localhost:5001/api/doctor/schedules?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
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
      const res = await axios.get('http://localhost:5001/api/doctor/today-queue', {
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
      const res = await axios.get('http://localhost:5001/api/doctor/next-patient', {
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
      await axios.post('http://localhost:5001/api/doctor/consultation/start', { tokenId: nextPatient.id }, {
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
      await axios.post('http://localhost:5001/api/doctor/consultation/skip', { tokenId: nextPatient.id }, {
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
      await axios.post('http://localhost:5001/api/doctor/consultation/no-show', { tokenId: nextPatient.id }, {
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
        `http://localhost:5001/api/doctor/appointments?${params.toString()}`,
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

  const quickActions = [
    {
      title: 'View Appointments',
      description: 'Manage today\'s appointments',
      icon: HiCalendar,
      color: 'bg-blue-500',
      href: '/doctor/appointments'
    },
    {
      title: 'Patient List',
      description: 'View all your patients',
      icon: HiUsers,
      color: 'bg-green-500',
      href: '/doctor/patients'
    },
    {
      title: 'Schedule Management',
      description: 'Manage your availability',
      icon: HiClock,
      color: 'bg-purple-500',
      href: '/doctor/schedule'
    },
    {
      title: 'Medical Records',
      description: 'View patient records',
      icon: HiDocumentText,
      color: 'bg-indigo-500',
      href: '/doctor/records'
    },
    {
      title: 'Reports & Analytics',
      description: 'View performance reports',
      icon: HiChartBar,
      color: 'bg-orange-500',
      href: '/doctor/reports'
    },
    {
      title: 'Settings',
      description: 'Account preferences',
      icon: HiCog,
      color: 'bg-gray-500',
      href: '/doctor/settings'
    }
  ];

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
            <div className="flex justify-between items-center py-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
                <p className="text-gray-600 mt-1">Welcome back, Dr. {doctor?.name}</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setLeaveForm({ date: new Date().toISOString().split('T')[0], reason: '' });
                  setShowLeaveRequestModal(true);
                }}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center space-x-2"
              >
                <HiExclamation className="h-4 w-4" />
                <span>Request Leave</span>
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <HiCalendar className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Today's Appointments</p>
                <p className="text-3xl font-extrabold text-gray-900">{stats.todayAppointments}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <HiUsers className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Patients</p>
                <p className="text-3xl font-extrabold text-gray-900">{stats.totalPatients}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <HiUsers className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Booked Patients</p>
                <p className="text-3xl font-extrabold text-gray-900">{stats.bookedPatients}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <HiTrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-3xl font-extrabold text-gray-900">{stats.completedAppointments}</p>
            </div>
          </div>
        </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <HiTrendingDown className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-3xl font-extrabold text-gray-900">{stats.pendingAppointments}</p>
              </div>
            </div>
          </div>
                    </div>

        {/* Next Patient */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Next Patient</h2>
            <button onClick={fetchNextPatient} className="text-gray-600 hover:text-gray-800 flex items-center space-x-1">
              <HiCalendar className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
          {!nextPatient ? (
            <div className="text-sm text-gray-500">No patients waiting.</div>
          ) : (
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold text-gray-900">
                    Next Patient: Token #{nextPatient.tokenNumber} {nextPatient.patientName}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {nextPatient.age ? `Age: ${nextPatient.age}` : ''}{nextPatient.age && nextPatient.gender ? ' • ' : ''}{nextPatient.gender || ''}
                  </div>
                  {nextPatient.symptoms && (
                    <div className="text-sm text-gray-700 mt-1">Symptoms: {nextPatient.symptoms}</div>
                  )}
                  {nextPatient.appointmentType === 'video' && (nextPatient.meetingLink || nextPatient.meeting_link) && (
                    <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <HiVideoCamera className="h-4 w-4 text-purple-600" />
                          <span className="text-sm font-medium text-purple-900">Video Consultation</span>
                        </div>
                        <button
                          onClick={() => window.open((nextPatient.meetingLink || nextPatient.meeting_link).meetingUrl, '_blank', 'noopener,noreferrer')}
                          className="flex items-center space-x-1 px-2 py-1 bg-purple-600 text-white text-xs rounded-md hover:bg-purple-700"
                        >
                          <HiExternalLink className="h-3 w-3" />
                          <span>Join Meeting</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button onClick={startConsultation} className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Start Consultation</button>
                  <button onClick={skipConsultation} className="px-3 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200">Skip / Call Later</button>
                  <button onClick={markNoShow} className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Mark as No-Show</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Today's Queue by Session */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Today's Queue</h2>
            <button
              onClick={fetchTodayQueue}
              className="text-gray-600 hover:text-gray-800 flex items-center space-x-1"
              title="Refresh queue"
            >
              <HiCalendar className="h-4 w-4" />
              <span>{todayQueue.date || ''}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(['morning','afternoon','evening']).map((sid) => {
              const session = (todayQueue.sessions || []).find(s => s.id === sid) || { id: sid, name: sid, range: '', queue: [] };
              return (
                <div key={sid} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{session.name}</h3>
                      {session.range && <p className="text-sm text-gray-500">{session.range}</p>}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">{session.queue?.length || 0}</div>
                      <div className="text-xs text-gray-500">in queue</div>
                    </div>
                  </div>

                  {(!session.queue || session.queue.length === 0) ? (
                    <div className="text-sm text-gray-500">No patients in this session.</div>
                  ) : (
                    <div className="space-y-3">
                      {session.queue.map(item => (
                        <div key={item.id} className="border rounded p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center space-x-2">
                                {item.tokenNumber && (
                                  <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">Token #{item.tokenNumber}</span>
                                )}
                                <span className="text-sm font-medium text-gray-900">{item.patientName}</span>
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                {(item.age || item.gender) && (
                                  <span className="mr-3">{item.age ? `Age: ${item.age}` : ''}{item.age && item.gender ? ' • ' : ''}{item.gender || ''}</span>
                                )}
                                {item.symptoms && <span>Symptoms: {item.symptoms}</span>}
                              </div>
                              {item.appointmentType === 'video' && (item.meetingLink || item.meeting_link) && (
                                <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded">
                                  <button
                                    onClick={() => window.open((item.meetingLink || item.meeting_link).meetingUrl, '_blank', 'noopener,noreferrer')}
                                    className="flex items-center space-x-1 px-2 py-1 bg-purple-600 text-white text-xs rounded-md hover:bg-purple-700"
                                  >
                                    <HiVideoCamera className="h-3 w-3" />
                                    <span>Join Meeting</span>
                                  </button>
                                </div>
                              )}
                            </div>
                            <div className="text-right space-y-1">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                item.bookingStatus === 'booked' ? 'bg-yellow-100 text-yellow-800' :
                                item.bookingStatus === 'in_queue' ? 'bg-blue-100 text-blue-800' :
                                item.bookingStatus === 'consulted' ? 'bg-green-100 text-green-800' :
                                item.bookingStatus === 'cancelled' ? 'bg-red-100 text-red-800' :
                                item.bookingStatus === 'missed' ? 'bg-orange-100 text-orange-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>{item.bookingStatus}</span>
                              <div>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  item.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                                  item.paymentStatus === 'refunded' ? 'bg-purple-100 text-purple-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>{item.paymentStatus || 'pending'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.title}
                  onClick={() => navigate(action.href)}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 text-left group"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`${action.color} p-3 rounded-lg`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">{action.description}</p>
                    </div>
                    <HiArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600" />
                  </div>
                </button>
              );
            })}
          </div>
              </div>

        {/* Booked Patients */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Booked Patients</h2>
            <button
              onClick={() => navigate('/doctor/patients')}
              className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <span>View All</span>
              <HiArrowRight className="h-4 w-4" />
            </button>
              </div>

          {bookedPatients.length === 0 ? (
            <div className="text-center py-8">
              <HiUsers className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No booked patients</h3>
              <p className="mt-1 text-sm text-gray-500">Patients will appear here once they book appointments.</p>
                            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bookedPatients.slice(0, 6).map((patient) => (
                <div key={patient._id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <HiUsers className="h-5 w-5 text-blue-600" />
                              </div>
                              </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{patient.name}</p>
                      <p className="text-sm text-gray-500 truncate">{patient.email}</p>
                      {patient.phone && (
                        <p className="text-xs text-gray-500 truncate">{patient.phone}</p>
                            )}
                          </div>
                  </div>
                  {patient.nextAppointment && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-600">
                        Next: {new Date(patient.nextAppointment.booking_date).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">{patient.nextAppointment.time_slot}</p>
              </div>
                  )}
                </div>
              ))}
                </div>
          )}
                </div>

        {/* All Appointments */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">All Appointments</h2>
            <div className="flex space-x-2">
              <button
                onClick={fetchAppointments}
                className="text-gray-600 hover:text-gray-800 flex items-center space-x-1"
                title="Refresh appointments"
              >
                <HiCalendar className="h-4 w-4" />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => navigate('/doctor/appointments')}
                className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
              >
                <span>View Details</span>
                <HiArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {[
                  { key: 'all', label: 'All Appointments' },
                  { key: 'today', label: 'Today' },
                  { key: 'upcoming', label: 'Upcoming' },
                  { key: 'past', label: 'Past' }
                ].map((tab) => (
                      <button
                    key={tab.key}
                    onClick={() => {
                      setAppointmentFilter(tab.key);
                      setCurrentPage(1);
                    }}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      appointmentFilter === tab.key
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                      </button>
                ))}
              </nav>
            </div>
                    </div>
          
          {allAppointments.length === 0 ? (
            <div className="text-center py-8">
              <HiCalendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {appointmentFilter === 'today' ? 'No appointments today' :
                 appointmentFilter === 'upcoming' ? 'No upcoming appointments' :
                 appointmentFilter === 'past' ? 'No past appointments' :
                 'No appointments found'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {appointmentFilter === 'today' ? 'You have a free day!' :
                 appointmentFilter === 'upcoming' ? 'No future appointments scheduled.' :
                 appointmentFilter === 'past' ? 'No completed appointments yet.' :
                 'No appointments have been scheduled yet.'}
              </p>
            </div>
          ) : (
            <>
                  <div className="space-y-4">
                {allAppointments.map((appointment) => (
                  <div key={appointment._id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <HiUsers className="h-5 w-5 text-blue-600" />
                    </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{appointment.patient_name}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>{new Date(appointment.booking_date).toLocaleDateString()}</span>
                            <span>{appointment.time_slot}</span>
                            {appointment.token_number && (
                              <span className="bg-gray-100 px-2 py-1 rounded text-xs">Token #{appointment.token_number}</span>
                            )}
                          </div>
                          {appointment.symptoms && (
                            <p className="text-xs text-gray-600 mt-1">Symptoms: {appointment.symptoms}</p>
                          )}
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
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
                  ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
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
                      'http://localhost:5001/api/doctor/leave-requests',
                      { date: leaveForm.date, reason: leaveForm.reason },
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
      </div>
    </div>
  );
}