import { useState, useEffect } from 'react';
import { HiUsers, HiClock, HiCheckCircle, HiExclamation, HiRefresh } from 'react-icons/hi';
import { API_CONFIG } from '../../config/urls';

export default function QueueManagement() {
  const [queueData, setQueueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchQueueStatus();
    // Refresh every 30 seconds
    const interval = setInterval(fetchQueueStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchQueueStatus = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const response = await fetch('${API_CONFIG.BASE_URL}/api/receptionist/queue/status', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch queue status');
      }

      const data = await response.json();
      setQueueData(data);
    } catch (error) {
      console.error('Error fetching queue status:', error);
      setError('Failed to load queue data');
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/receptionist/appointments/${appointmentId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update appointment status');
      }

      // Refresh queue data
      fetchQueueStatus();
    } catch (error) {
      console.error('Error updating appointment status:', error);
      alert('Failed to update appointment status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'booked':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'booked':
        return <HiClock className="h-4 w-4" />;
      case 'confirmed':
        return <HiCheckCircle className="h-4 w-4" />;
      case 'in-progress':
        return <HiExclamation className="h-4 w-4" />;
      case 'completed':
        return <HiCheckCircle className="h-4 w-4" />;
      default:
        return <HiClock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={fetchQueueStatus}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <HiUsers className="h-6 w-6 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900">Queue Management</h2>
          </div>
          <button
            onClick={fetchQueueStatus}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <HiRefresh className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Statistics */}
      {queueData?.statistics && (
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{queueData.statistics.totalWaiting}</div>
              <div className="text-sm text-blue-600">Waiting</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{queueData.statistics.inProgress}</div>
              <div className="text-sm text-yellow-600">In Progress</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{queueData.statistics.completed}</div>
              <div className="text-sm text-green-600">Completed</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{queueData.statistics.totalToday}</div>
              <div className="text-sm text-gray-600">Total Today</div>
            </div>
          </div>
        </div>
      )}

      {/* Queue by Doctor */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Queue by Doctor</h3>
        {queueData?.queueByDoctor?.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No appointments scheduled for today
          </div>
        ) : (
          <div className="space-y-6">
            {queueData?.queueByDoctor?.map((doctorQueue) => (
              <div key={doctorQueue.doctor.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-900">{doctorQueue.doctor.name}</h4>
                    <p className="text-sm text-gray-600">{doctorQueue.doctor.department}</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {doctorQueue.appointments.length} appointments
                  </div>
                </div>

                <div className="space-y-2">
                  {doctorQueue.appointments.map((appointment) => (
                    <div
                      key={appointment._id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${getStatusColor(appointment.status)}`}
                    >
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(appointment.status)}
                        <div>
                          <div className="font-medium">{appointment.patientName}</div>
                          <div className="text-sm opacity-75">
                            {appointment.timeSlot} • Token: {appointment.tokenNumber}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium capitalize">
                          {appointment.status}
                        </span>
                        {appointment.status === 'booked' && (
                          <button
                            onClick={() => updateAppointmentStatus(appointment._id, 'confirmed')}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                          >
                            Confirm
                          </button>
                        )}
                        {appointment.status === 'confirmed' && (
                          <button
                            onClick={() => updateAppointmentStatus(appointment._id, 'in-progress')}
                            className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 transition-colors"
                          >
                            Start
                          </button>
                        )}
                        {appointment.status === 'in-progress' && (
                          <button
                            onClick={() => updateAppointmentStatus(appointment._id, 'completed')}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Last Updated */}
      {queueData?.lastUpdated && (
        <div className="px-6 pb-6">
          <div className="text-xs text-gray-500">
            Last updated: {new Date(queueData.lastUpdated).toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  );
}
