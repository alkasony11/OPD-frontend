import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiArrowLeft, HiChartBar, HiCalendar, HiUsers, HiDocumentText, HiDownload, HiTrendingUp, HiTrendingDown } from 'react-icons/hi';
import axios from 'axios';
import DoctorSidebar from '../../Components/Doctor/Sidebar';

export default function DoctorReportsPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState({
    appointments: [],
    patients: [],
    schedules: [],
    records: []
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [stats, setStats] = useState({
    totalAppointments: 0,
    totalPatients: 0,
    completedAppointments: 0,
    cancelledAppointments: 0,
    averagePatientsPerDay: 0,
    mostCommonDiagnosis: '',
    totalRecords: 0
  });

  useEffect(() => {
    checkDoctorAuth();
  }, []);

  useEffect(() => {
    if (loading) {
      fetchReports();
    }
  }, [dateRange]);

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

  const fetchReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        console.error('No token found');
        return;
      }

      // Fetch appointments
      const appointmentsResponse = await axios.get(
        `http://localhost:5001/api/doctor/appointments?startDate=${dateRange.start}&endDate=${dateRange.end}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Fetch patients
      const patientsResponse = await axios.get(
        'http://localhost:5001/api/doctor/patients',
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Fetch schedules
      const schedulesResponse = await axios.get(
        `http://localhost:5001/api/doctor/schedules?startDate=${dateRange.start}&endDate=${dateRange.end}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Fetch medical records
      const recordsResponse = await axios.get(
        'http://localhost:5001/api/doctor/medical-records',
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const appointments = appointmentsResponse.data.appointments || [];
      const patients = patientsResponse.data.patients || [];
      const schedules = schedulesResponse.data.schedules || [];
      const records = recordsResponse.data.records || [];

      setReports({ appointments, patients, schedules, records });

      // Calculate statistics
      const completedAppointments = appointments.filter(apt => apt.status === 'consulted').length;
      const cancelledAppointments = appointments.filter(apt => apt.status === 'cancelled').length;
      
      // Calculate average patients per day
      const workingDays = schedules.filter(s => s.isAvailable).length;
      const averagePatientsPerDay = workingDays > 0 ? (appointments.length / workingDays).toFixed(1) : 0;

      // Find most common diagnosis
      const diagnosisCount = {};
      records.forEach(record => {
        if (record.diagnosis) {
          diagnosisCount[record.diagnosis] = (diagnosisCount[record.diagnosis] || 0) + 1;
        }
      });
      const mostCommonDiagnosis = Object.keys(diagnosisCount).reduce((a, b) => 
        diagnosisCount[a] > diagnosisCount[b] ? a : b, 'N/A'
      );

      setStats({
        totalAppointments: appointments.length,
        totalPatients: patients.length,
        completedAppointments,
        cancelledAppointments,
        averagePatientsPerDay,
        mostCommonDiagnosis,
        totalRecords: records.length
      });

    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    const reportData = {
      dateRange,
      stats,
      summary: {
        totalAppointments: stats.totalAppointments,
        completedAppointments: stats.completedAppointments,
        cancelledAppointments: stats.cancelledAppointments,
        totalPatients: stats.totalPatients,
        averagePatientsPerDay: stats.averagePatientsPerDay,
        mostCommonDiagnosis: stats.mostCommonDiagnosis,
        totalRecords: stats.totalRecords
      },
      appointments: reports.appointments,
      patients: reports.patients,
      schedules: reports.schedules,
      records: reports.records
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `doctor-report-${dateRange.start}-to-${dateRange.end}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getAppointmentStatusCounts = () => {
    const statusCounts = {};
    reports.appointments.forEach(apt => {
      statusCounts[apt.status] = (statusCounts[apt.status] || 0) + 1;
    });
    return statusCounts;
  };

  const getDailyAppointmentTrend = () => {
    const dailyCounts = {};
    reports.appointments.forEach(apt => {
      const date = apt.booking_date.split('T')[0];
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });
    return Object.entries(dailyCounts).sort(([a], [b]) => new Date(a) - new Date(b));
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
                  <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
                  <p className="text-gray-600">View your performance and patient statistics</p>
                </div>
              </div>
            <button
              onClick={exportReport}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <HiDownload className="h-4 w-4" />
              <span>Export Report</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Date Range Filter */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Report Period</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          </div>
        </div>

        {/* Key Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <HiCalendar className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Appointments</p>
                <p className="text-3xl font-extrabold text-gray-900">{stats.totalAppointments}</p>
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
                <HiTrendingDown className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Cancelled</p>
                <p className="text-3xl font-extrabold text-gray-900">{stats.cancelledAppointments}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <HiChartBar className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg Patients/Day</p>
                <p className="text-2xl font-extrabold text-gray-900">{stats.averagePatientsPerDay}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <HiDocumentText className="h-8 w-8 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Medical Records</p>
                <p className="text-2xl font-extrabold text-gray-900">{stats.totalRecords}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <HiChartBar className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Most Common Diagnosis</p>
                <p className="text-sm font-extrabold text-gray-900 truncate" title={stats.mostCommonDiagnosis}>
                  {stats.mostCommonDiagnosis}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Appointment Status Breakdown */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Appointment Status Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(getAppointmentStatusCounts()).map(([status, count]) => (
              <div key={status} className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-sm text-gray-600 capitalize">{status.replace('_', ' ')}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Appointment Trend */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Appointment Trend</h3>
          {getDailyAppointmentTrend().length === 0 ? (
            <p className="text-gray-500 text-center py-4">No appointments in the selected period</p>
          ) : (
            <div className="space-y-2">
              {getDailyAppointmentTrend().map(([date, count]) => (
                <div key={date} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(date).toLocaleDateString()}
                  </span>
                  <span className="text-sm text-gray-600">{count} appointments</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity Summary */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity Summary</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <HiCalendar className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-900">Appointments in Period</span>
              </div>
              <span className="text-sm font-bold text-blue-600">{stats.totalAppointments}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <HiUsers className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-gray-900">Unique Patients</span>
              </div>
              <span className="text-sm font-bold text-green-600">{stats.totalPatients}</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <HiDocumentText className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-900">Medical Records Created</span>
              </div>
              <span className="text-sm font-bold text-purple-600">{stats.totalRecords}</span>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}