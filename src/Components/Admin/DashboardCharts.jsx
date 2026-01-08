import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

export default function DashboardCharts() {
  const [chartData, setChartData] = useState({
    userStats: null,
    appointmentStats: null,
    dailyTrends: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChartData();
  }, []);

  const fetchChartData = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('🔍 Fetching chart data...');
      
      // Fetch user statistics (get all users for accurate counts)
      console.log('📊 Fetching users from:', `${API_BASE_URL}/api/admin/users`);
      const usersResponse = await axios.get(`${API_BASE_URL}/api/admin/users?limit=1000`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Users response:', usersResponse.data);

      // Fetch appointment statistics
      console.log('📊 Fetching stats from:', `${API_BASE_URL}/api/admin/stats`);
      const statsResponse = await axios.get(`${API_BASE_URL}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Stats response:', statsResponse.data);

      // Fetch appointment stats for charts
      console.log('📊 Fetching appointment stats from:', `${API_BASE_URL}/api/admin/appointment-stats`);
      const appointmentStatsResponse = await axios.get(`${API_BASE_URL}/api/admin/appointment-stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Appointment stats response:', appointmentStatsResponse.data);

      // Process user data for charts
      const users = usersResponse.data?.users || [];
      console.log('📊 Raw users data:', users);
      const userStats = {
        doctors: users.filter(u => u.role === 'doctor').length,
        patients: users.filter(u => u.role === 'patient').length,
        receptionists: users.filter(u => u.role === 'receptionist').length,
        admins: users.filter(u => u.role === 'admin').length
      };
      console.log('📈 Processed user stats:', userStats);

      // Process appointment data
      const appointmentStats = statsResponse.data.appointments || {};
      const chartStats = appointmentStatsResponse.data || {};
      console.log('📈 Raw appointment stats:', statsResponse.data);
      console.log('📈 Processed appointment stats:', appointmentStats);
      console.log('📈 Raw chart stats:', appointmentStatsResponse.data);
      console.log('📈 Processed chart stats:', chartStats);

      setChartData({
        userStats,
        appointmentStats,
        dailyTrends: chartStats.dailyTrends || [],
        statusCounts: chartStats.statusCounts || {}
      });
    } catch (error) {
      console.error('❌ Error fetching chart data:', error);
      console.error('❌ Error details:', error.response?.data || error.message);
      
      // Set default empty data to prevent crashes
      setChartData({
        userStats: { doctors: 0, patients: 0, receptionists: 0, admins: 0 },
        appointmentStats: {},
        dailyTrends: [],
        statusCounts: {}
      });
    } finally {
      setLoading(false);
    }
  };

  const generateDailyTrends = () => {
    const last7Days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      last7Days.push({
        date: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('en-US', { weekday: 'short' })
      });
    }
    
    return last7Days;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  // User Role Distribution Chart
  const userRoleData = {
    labels: ['Doctors', 'Patients'],
    datasets: [
      {
        label: 'User Count',
        data: [
          chartData.userStats?.doctors || 0,
          chartData.userStats?.patients || 0
        ],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)'
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  // Only show chart if there's real data
  const hasUserData = (chartData.userStats?.doctors || 0) > 0 || (chartData.userStats?.patients || 0) > 0;
  console.log('📊 User role data:', chartData.userStats);
  console.log('📊 Has user data:', hasUserData);

  // Appointment Status Distribution Chart
  const appointmentStatusData = {
    labels: ['Completed', 'Pending', 'Cancelled', 'Missed'],
    datasets: [
      {
        label: 'Appointments',
        data: [
          chartData.statusCounts?.consulted || 0,
          (chartData.statusCounts?.booked || 0) + (chartData.statusCounts?.in_queue || 0),
          chartData.statusCounts?.cancelled || 0,
          chartData.statusCounts?.missed || 0
        ],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(156, 163, 175, 0.8)'
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(156, 163, 175, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  // Only show chart if there's real appointment data
  const totalAppointments = (chartData.statusCounts?.consulted || 0) + 
                           (chartData.statusCounts?.booked || 0) + 
                           (chartData.statusCounts?.in_queue || 0) + 
                           (chartData.statusCounts?.cancelled || 0) + 
                           (chartData.statusCounts?.missed || 0);
  
  const hasAppointmentData = totalAppointments > 0;
  console.log('📊 Appointment status data:', chartData.statusCounts);
  console.log('📊 Total appointments:', totalAppointments);
  console.log('📊 Has appointment data:', hasAppointmentData);

  // Generate 7 days of data, filling in missing days with zeros
  const generateLast7Days = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Find data for this date or use zeros
      const dayData = chartData.dailyTrends?.find(d => d.date === dateStr) || {
        date: dateStr,
        appointments: 0,
        newPatients: 0
      };
      
      days.push({
        ...dayData,
        label: date.toLocaleDateString('en-US', { weekday: 'short' })
      });
    }
    
    return days;
  };

  const last7Days = generateLast7Days();
  console.log('📊 Daily trends raw data:', chartData.dailyTrends);
  console.log('📊 Generated 7 days data:', last7Days);
  const hasDailyTrendsData = true; // Always show the chart with 7 days

  const dailyTrendsData = {
    labels: last7Days.map(day => day.label),
    datasets: [
      {
        label: 'Appointments',
        data: last7Days.map(day => day.appointments || 0),
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'New Patients',
        data: last7Days.map(day => day.newPatients || 0),
        borderColor: 'rgba(16, 185, 129, 1)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Dashboard Analytics'
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Role Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Role Distribution</h3>
          <div className="h-64">
            {hasUserData ? (
              <Doughnut data={userRoleData} options={doughnutOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <div className="text-4xl mb-2">📊</div>
                  <p>No user data available</p>
                  <p className="text-sm">Data will appear when users are registered</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Appointment Status Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointment Status</h3>
          <div className="h-64">
            {hasAppointmentData ? (
              <Bar data={appointmentStatusData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <div className="text-4xl mb-2">📅</div>
                  <p>No appointment data available</p>
                  <p className="text-sm">Data will appear when appointments are created</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Daily Trends Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Trends (Last 7 Days)</h3>
        <div className="h-80">
          {hasDailyTrendsData ? (
            <Line data={dailyTrendsData} options={chartOptions} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <div className="text-4xl mb-2">📈</div>
                <p>No trend data available</p>
                <p className="text-sm">Data will appear when appointments are scheduled</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
