import { useState, useEffect } from 'react';
import { HiUsers, HiUserGroup, HiClipboardList, HiTrendingUp } from 'react-icons/hi';

export default function DashboardStats() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDoctors: 0,
    totalAppointments: 0,
    recentActivity: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Patients',
      value: '2,847',
      icon: HiUsers,
      color: 'bg-gray-600',
      change: '+12%'
    },
    {
      title: 'Active Doctors',
      value: '165',
      icon: HiUserGroup,
      color: 'bg-gray-600',
      change: '+8%'
    },
    {
      title: "Today's Appointments",
      value: '89',
      icon: HiClipboardList,
      color: 'bg-gray-600',
      change: '+23%'
    },
    {
      title: 'System Alerts',
      value: '12',
      icon: HiTrendingUp,
      color: 'bg-gray-600',
      change: '+5%'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-green-600 mt-1">{stat.change} from last month</p>
              </div>
              <div className={`${stat.color} p-3 rounded-full`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
