import { useState, useEffect } from 'react';
import { HiClock, HiUser, HiRefresh } from 'react-icons/hi';
import axios from 'axios';
import { API_CONFIG } from '../../config/urls';

export default function QueuePosition({ appointmentId, appointmentStatus }) {
  const [queueData, setQueueData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchQueuePosition = async () => {
    if (!appointmentId || !['booked', 'in_queue'].includes(appointmentStatus)) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_CONFIG.BASE_URL}/api/patient/appointments/${appointmentId}/queue-position`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setQueueData(response.data);
    } catch (err) {
      console.error('Error fetching queue position:', err);
      setError('Unable to fetch queue position');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueuePosition();
    
    // Set up polling for real-time updates every 30 seconds
    const interval = setInterval(fetchQueuePosition, 30000);
    
    return () => clearInterval(interval);
  }, [appointmentId, appointmentStatus]);

  // Don't show component if appointment is not in queue
  if (!['booked', 'in_queue'].includes(appointmentStatus)) {
    return null;
  }

  if (loading && !queueData) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-blue-800">Loading queue position...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <HiClock className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-800">{error}</span>
          </div>
          <button
            onClick={fetchQueuePosition}
            className="text-red-600 hover:text-red-800"
            disabled={loading}
          >
            <HiRefresh className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    );
  }

  if (!queueData) {
    return null;
  }

  const getQueueColor = () => {
    // If patient is referred, use purple to indicate referral
    if (queueData?.referredDoctor) return 'bg-purple-50 border-purple-200 text-purple-800';
    
    // If currently consulting (either from appointment status or queue data status), use green
    if (appointmentStatus === 'in_queue' || queueData?.status === 'in_queue') {
      return 'bg-green-50 border-green-200 text-green-800';
    }
    
    // If next in line (position 1 but not consulting), use yellow
    if (queueData?.queuePosition === 1) return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    
    // If within first 3 positions, use blue
    if (queueData?.queuePosition <= 3) return 'bg-blue-50 border-blue-200 text-blue-800';
    
    // Otherwise use gray
    return 'bg-gray-50 border-gray-200 text-gray-800';
  };

  const getStatusText = () => {
    // Check if patient is referred
    if (queueData?.referredDoctor) {
      return `Referred to Dr. ${queueData.referredDoctor}`;
    }
    
    // If patient is currently consulting, show that (this takes absolute priority)
    if (appointmentStatus === 'in_queue' || queueData?.status === 'in_queue') {
      return 'Currently consulting';
    }
    
    // Only if NOT consulting, then check queue position
    // If at position 1 and not consulting, they're next in line
    if (queueData?.queuePosition === 1) {
      return 'Your turn is next';
    }
    
    // Otherwise show their position in queue
    return `Position ${queueData?.queuePosition || 0} of ${queueData?.totalInQueue || 0}`;
  };

  const getRightSideText = () => {
    // If patient is currently consulting, show consultation time
    if (appointmentStatus === 'in_queue' || queueData?.status === 'in_queue') {
      return 'In consultation';
    }
    
    // If patient is referred, show referral info
    if (queueData?.referredDoctor) {
      return 'Referral pending';
    }
    
    // Otherwise show wait time
    return queueData?.estimatedWaitTimeFormatted || 'Calculating...';
  };

  return (
    <div className={`border rounded-lg p-4 ${getQueueColor()}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <HiUser className="h-5 w-5" />
            <div>
              <div className="font-medium text-sm">{getStatusText()}</div>
              <div className="text-xs opacity-75">
                Dr. {queueData.doctorName} • {queueData.department}
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="flex items-center space-x-2">
            <HiClock className="h-4 w-4" />
            <div>
              <div className="font-medium text-sm">
                {getRightSideText()}
              </div>
              <div className="text-xs opacity-75">
                Updated {new Date(queueData.lastUpdated).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
        
        <button
          onClick={fetchQueuePosition}
          className="p-1 hover:bg-white/50 rounded"
          disabled={loading}
          title="Refresh queue position"
        >
          <HiRefresh className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      {queueData.queuePosition > 1 && (
        <div className="mt-3 pt-3 border-t border-current/20">
          <div className="text-xs opacity-75">
            <div>Appointment time: {queueData.appointmentTime}</div>
            <div>Total patients in queue: {queueData.totalInQueue}</div>
          </div>
        </div>
      )}
    </div>
  );
}
