import { useState, useEffect } from 'react';
import { HiUsers, HiClock, HiCheckCircle, HiExclamation, HiRefresh } from 'react-icons/hi';
import { API_CONFIG } from '../../config/urls';

export default function QueueManagement() {
  const [queueData, setQueueData] = useState(null);
  const [doctorList, setDoctorList] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch list of doctors for queue viewing
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/receptionist/doctors`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) throw new Error('Failed to fetch doctors');

        const data = await response.json();
        setDoctorList(data || []);
        if (data && data.length > 0) {
          setSelectedDoctorId(data[0]._id);
        }
      } catch (err) {
        console.error('Error fetching doctors:', err);
        setError('Failed to load doctor list');
      }
    };

    fetchDoctors();
  }, []);

  useEffect(() => {
    if (selectedDoctorId) {
      fetchQueueStatus();
      // Refresh every 30 seconds
      const interval = setInterval(fetchQueueStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [selectedDoctorId]);

  const fetchQueueStatus = async () => {
    if (!selectedDoctorId) return;

    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/queue/${selectedDoctorId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
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

  const handleDoctorChange = (event) => {
    setSelectedDoctorId(event.target.value);
  };

  const callNextPatient = async () => {
    if (!selectedDoctorId) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/queue/${selectedDoctorId}/call-next`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to call next patient');
      }

      await fetchQueueStatus();
    } catch (error) {
      console.error('Error calling next patient:', error);
      alert('Failed to call next patient');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <HiUsers className="h-6 w-6 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900">Queue Management (ML)</h2>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedDoctorId || ''}
              onChange={handleDoctorChange}
              className="border border-gray-300 rounded px-3 py-2"
            >
              {doctorList.map((doc) => (
                <option key={doc._id} value={doc._id}>
                  {doc.name} ({doc.doctor_info?.specialization || 'General'})
                </option>
              ))}
            </select>

            <button
              onClick={fetchQueueStatus}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <HiRefresh className="h-4 w-4" />
              <span>Refresh</span>
            </button>

            <button
              onClick={callNextPatient}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <HiClock className="h-4 w-4" />
              <span>Call Next</span>
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      {queueData?.analytics && (
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{queueData.analytics.totalPatients}</div>
              <div className="text-sm text-blue-600">Total in queue</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{queueData.analytics.urgentCasesPrioritized}</div>
              <div className="text-sm text-yellow-600">Urgent cases</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{queueData.analytics.avgWaitTime}m</div>
              <div className="text-sm text-green-600">Avg wait time</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{queueData.analytics.peakHour ?? '-'}</div>
              <div className="text-sm text-gray-600">Peak hour</div>
            </div>
          </div>
        </div>
      )}

      {/* Patient Queue List */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Queue</h3>

        {(!queueData || !queueData.queue || queueData.queue.length === 0) ? (
          <div className="text-center py-8 text-gray-500">
            No patients currently in queue for this doctor.
          </div>
        ) : (
          <div className="space-y-4">
            {queueData.queue.map((patient) => (
              <div
                key={patient.patientId}
                className="border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
              >
                <div>
                  <div className="text-base font-semibold text-gray-900">{patient.patientName}</div>
                  <div className="text-sm text-gray-600">Token: {patient.tokenNumber || '-'}</div>
                  <div className="text-sm text-gray-600">Status: {patient.status || 'waiting'}</div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-6">
                  <div className="text-sm">
                    <span className="font-semibold">Predicted Wait:</span> {patient.predictedWaitTime ?? '-'} min
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold">Priority:</span> {patient.priorityScore ?? '-'}
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold">Symptoms:</span> {patient.symptoms || 'N/A'}
                  </div>
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

