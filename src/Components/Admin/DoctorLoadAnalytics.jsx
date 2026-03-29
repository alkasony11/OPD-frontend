import { useState, useEffect } from 'react';
import { HiUsers, HiClock, HiTrendingUp, HiTrendingDown } from 'react-icons/hi';
import axios from 'axios';
import { API_CONFIG } from '../../config/urls';

export default function DoctorLoadAnalytics() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [analytics, setAnalytics] = useState([]);

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchDoctorLoadAnalytics();
    }
  }, [selectedDate]);

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('${API_CONFIG.BASE_URL}/api/admin/doctors', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDoctors(response.data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const fetchDoctorLoadAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_CONFIG.BASE_URL}/api/admin/doctor-load-analytics?date=${selectedDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(response.data.analytics || []);
    } catch (error) {
      console.error('Error fetching doctor load analytics:', error);
      setAnalytics([]);
    } finally {
      setLoading(false);
    }
  };

  const getLoadColor = (load, maxLoad) => {
    const percentage = (load / maxLoad) * 100;
    if (percentage >= 80) return 'text-red-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getLoadBarColor = (load, maxLoad) => {
    const percentage = (load / maxLoad) * 100;
    if (percentage >= 80) return 'bg-red-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-green-500';
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
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Doctor Load Analytics</h2>
            <p className="text-gray-600 mt-1">Monitor doctor workload and patient distribution</p>
          </div>
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Date:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <HiUsers className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Doctors</p>
              <p className="text-2xl font-bold text-gray-900">{doctors.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <HiTrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Appointments</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.reduce((sum, doctor) => sum + doctor.totalAppointments, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full">
              <HiClock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Wait Time</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.length > 0 
                  ? Math.round(analytics.reduce((sum, doctor) => sum + doctor.avgWaitTime, 0) / analytics.length)
                  : 0} min
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <HiTrendingDown className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Load Balance</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.length > 0 
                  ? Math.round((1 - (Math.max(...analytics.map(d => d.totalAppointments)) - Math.min(...analytics.map(d => d.totalAppointments))) / Math.max(...analytics.map(d => d.totalAppointments))) * 100)
                  : 100}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Doctor Load Details */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Doctor Load Details</h3>
        </div>
        <div className="p-6">
          {analytics.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No appointment data available for the selected date.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {analytics.map((doctor) => (
                <div key={doctor.doctorId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">Dr. {doctor.doctorName}</h4>
                      <p className="text-sm text-gray-600">{doctor.department}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${getLoadColor(doctor.totalAppointments, 20)}`}>
                        {doctor.totalAppointments}
                      </p>
                      <p className="text-sm text-gray-600">appointments</p>
                    </div>
                  </div>

                  {/* Load Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Load Level</span>
                      <span>{doctor.totalAppointments}/20</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getLoadBarColor(doctor.totalAppointments, 20)}`}
                        style={{ width: `${Math.min((doctor.totalAppointments / 20) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Session Breakdown */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-900">Morning Session</p>
                          <p className="text-xs text-blue-700">9:00 AM - 1:00 PM</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-blue-600">{doctor.morningAppointments}</p>
                          <p className="text-xs text-blue-600">patients</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-orange-50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-orange-900">Afternoon Session</p>
                          <p className="text-xs text-orange-700">2:00 PM - 6:00 PM</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-orange-600">{doctor.afternoonAppointments}</p>
                          <p className="text-xs text-orange-600">patients</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Stats */}
                  <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-gray-600">Avg Wait Time</p>
                      <p className="text-lg font-semibold text-gray-900">{doctor.avgWaitTime} min</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Auto-Assigned</p>
                      <p className="text-lg font-semibold text-gray-900">{doctor.autoAssignedCount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Manual</p>
                      <p className="text-lg font-semibold text-gray-900">{doctor.manualAssignedCount}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
