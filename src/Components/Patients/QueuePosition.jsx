import { useState, useEffect } from 'react';
import { HiClock, HiUser, HiRefresh, HiCalendar } from 'react-icons/hi';
import axios from 'axios';
import { API_CONFIG } from '../../config/urls';

export default function QueuePosition({ appointmentId, appointmentStatus, appointmentDate, tokenNumber }) {
  const [queueData, setQueueData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if appointment is for a future date (not today)
  const isFutureAppointment = () => {
    if (!appointmentDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const aptDate = new Date(appointmentDate);
    aptDate.setHours(0, 0, 0, 0);
    return aptDate >= tomorrow;
  };

  const fetchQueuePosition = async () => {
    if (!appointmentId || !['booked', 'confirmed', 'in_queue'].includes(appointmentStatus)) {
      return;
    }

    // Don't poll for future-date appointments
    if (isFutureAppointment()) {
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
    // Don't set up polling for future appointments
    if (isFutureAppointment()) {
      return;
    }

    fetchQueuePosition();

    // Set up polling for real-time updates every 30 seconds (only for today's appointments)
    const interval = setInterval(fetchQueuePosition, 30000);

    return () => clearInterval(interval);
  }, [appointmentId, appointmentStatus, appointmentDate]);

// Don't show component if appointment is not in queue
  if (!['booked', 'in_queue', 'in_progress'].includes(appointmentStatus)) {
    return null;
  }

  // For future-date appointments, show a clean scheduled message
  if (isFutureAppointment()) {
    const aptDate = new Date(appointmentDate);
    const formattedDate = aptDate.toLocaleDateString(undefined, {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
    });
    
    const position = tokenNumber ? parseInt(tokenNumber.replace(/\D/g, ''), 10) : null;
    
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <HiCalendar className="h-5 w-5 text-blue-600" />
            <div>
              <div className="font-medium text-sm text-blue-800 flex items-center gap-2">
                <span>Scheduled for {formattedDate}</span>
                {position && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-semibold whitespace-nowrap">
                    Queue Position: {position}
                  </span>
                )}
              </div>
              <div className="text-xs text-blue-600 mt-1">
                Live queue tracking will be available on the day of your appointment
              </div>
            </div>
          </div>
        </div>
      </div>
    );
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

  // If backend says it's a future date (fallback)
  if (queueData.queuePosition === null && queueData.message) {
    if (queueData.message === 'Appointment is scheduled for a future date') {
      const aptDate = new Date(queueData.appointmentDate);
      const formattedDate = aptDate.toLocaleDateString(undefined, {
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
      });
      
      const position = tokenNumber ? parseInt(tokenNumber.replace(/\D/g, ''), 10) : null;
      
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <HiCalendar className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-medium text-sm text-blue-800 flex items-center gap-2">
                  <span>Scheduled for {formattedDate}</span>
                  {position && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-semibold whitespace-nowrap">
                      Queue Position: {position}
                    </span>
                  )}
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  Live queue tracking will be available on the day of your appointment
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    // For other messages (like "Appointment is not in queue"), don't show anything
    return null;
  }

  const getQueueColor = () => {
    if (queueData?.referredDoctor) return 'bg-purple-50 border-purple-200 text-purple-800';

    if (appointmentStatus === 'in_progress' || queueData?.status === 'in_progress') {
      return 'bg-green-50 border-green-200 text-green-800';
    }

    if (queueData?.queuePosition === 1 && (appointmentStatus === 'in_queue' || appointmentStatus === 'booked')) return 'bg-yellow-50 border-yellow-200 text-yellow-800';

    if (queueData?.queuePosition <= 3) return 'bg-blue-50 border-blue-200 text-blue-800';

    return 'bg-gray-50 border-gray-200 text-gray-800';
  };

  const isBeforeSession = () => {
    if (!queueData?.appointmentTime) return false;
    const now = new Date();
    // Assuming appointmentTime is HH:mm string
    if (typeof queueData.appointmentTime !== 'string') return false;
    const parts = queueData.appointmentTime.split(':');
    if (parts.length !== 2) return false;
    const [hrs, mins] = parts.map(Number);
    
    const sessionTime = new Date();
    sessionTime.setHours(hrs, mins, 0, 0);
    
    // Treat as "before session" if there's more than 15 minutes until their slot
    return now.getTime() < (sessionTime.getTime() - 15 * 60000);
  };

  const getStatusText = () => {
    if (queueData?.referredDoctor) {
      return `Referred to Dr. ${queueData.referredDoctor}`;
    }

    if (appointmentStatus === 'in_progress' || queueData?.status === 'in_progress') {
      return 'Currently consulting';
    }

    const beforeSession = isBeforeSession();
    const isFirst = queueData?.queuePosition === 1 || queueData?.queuePosition === 0 || queueData?.tokensAhead === 0;

    if (beforeSession) {
      if (isFirst) {
        return 'You are the first patient for this session';
      } else {
        return `Session begins later • ${queueData?.tokensAhead !== undefined ? queueData.tokensAhead : (queueData?.queuePosition - 1)} patient(s) ahead`;
      }
    }

    if (appointmentStatus === 'in_queue' && !isFirst) {
       return `Arrived at clinic • ${queueData?.tokensAhead !== undefined ? queueData.tokensAhead : (queueData?.queuePosition - 1)} ahead`;
    }

    if (isFirst) {
      return 'Your turn is next';
    }

    return `People ahead: ${queueData?.tokensAhead !== undefined ? queueData.tokensAhead : (queueData?.queuePosition - 1)}`;
  };

  const getRightSideText = () => {
    if (appointmentStatus === 'in_progress' || queueData?.status === 'in_progress') {
      return 'In consultation';
    }

    if (queueData?.referredDoctor) {
      return 'Referral pending';
    }

    const beforeSession = isBeforeSession();
    
    if (beforeSession) {
      const parts = queueData.appointmentTime.split(':');
      let slotStr = '';
      if (parts.length === 2) {
        const [hrs, mins] = [parseInt(parts[0]), parseInt(parts[1])];
        const ampm = hrs >= 12 ? 'PM' : 'AM';
        const displayHrs = hrs % 12 || 12;
        slotStr = `${displayHrs}:${mins.toString().padStart(2, '0')} ${ampm}`;
      }
      
      if (queueData?.estimatedWaitTimeFormatted) {
        return `Slot: ${slotStr} • Wait: ${queueData.estimatedWaitTimeFormatted}`;
      }
      return `Slot: ${slotStr}`;
    }

    if (queueData?.estimatedWaitTimeFormatted) {
      return `Wait: ${queueData.estimatedWaitTimeFormatted}`;
    }
    return 'Calculating...';
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
          <div className="text-xs opacity-75 flex flex-col gap-1">
            <div>Doctor's Live Speed: ~{Math.round(queueData.avgConsultationTime || 10)} mins/patient</div>
            <div>Total patients today: {queueData.totalInQueue}</div>
            <div>Appointment time: {queueData.appointmentTime}</div>
          </div>
        </div>
      )}
    </div>
  );
}
