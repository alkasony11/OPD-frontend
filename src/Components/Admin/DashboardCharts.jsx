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
      
      // Fetch user statistics
      const usersResponse = await axios.get('http://localhost:5001/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Fetch appointment statistics
      const statsResponse = await axios.get('http://localhost:5001/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Fetch appointment stats for charts
      const appointmentStatsResponse = await axios.get('http://localhost:5001/api/admin/appointment-stats', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Process user data for charts
      const users = usersResponse.data || [];
      const userStats = {
        doctors: users.filter(u => u.role === 'doctor').length,
        patients: users.filter(u => u.role === 'patient').length,
        receptionists: users.filter(u => u.role === 'receptionist').length,
        admins: users.filter(u => u.role === 'admin').length
      };

      // Process appointment data
      const appointmentStats = statsResponse.data.appointments || {};
      const chartStats = appointmentStatsResponse.data || {};

      setChartData({
        userStats,
        appointmentStats,
        dailyTrends: chartStats.dailyTrends || [],
        statusCounts: chartStats.statusCounts || {}
      });
    } catch (error) {
      console.error('Error fetching chart data:', error);
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

  // Daily Trends Chart
  const dailyTrendsData = {
    labels: chartData.dailyTrends?.map(day => {
      const date = new Date(day.date);
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }) || [],
    datasets: [
      {
        label: 'Appointments',
        data: chartData.dailyTrends?.map(day => day.appointments) || [],
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'New Patients',
        data: chartData.dailyTrends?.map(day => day.newPatients) || [],
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
            <Doughnut data={userRoleData} options={doughnutOptions} />
          </div>
        </div>

        {/* Appointment Status Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointment Status</h3>
          <div className="h-64">
            <Bar data={appointmentStatusData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Daily Trends Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Trends (Last 7 Days)</h3>
        <div className="h-80">
          <Line data={dailyTrendsData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}
