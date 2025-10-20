import { useEffect, useMemo, useState } from 'react';
import { HiBell, HiExclamation, HiClock, HiUser, HiRefresh, HiBan } from 'react-icons/hi';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';

export default function RealTimeAlerts() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState([]);
  const [approvedLeaves, setApprovedLeaves] = useState([]);
  const [recentCancellations, setRecentCancellations] = useState([]);

  const todayYMD = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  const fetchAll = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('token');

      const [loadRes, leavesRes, cancelsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/admin/doctor-load-analytics?date=${todayYMD}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/api/admin/leave-requests?status=approved`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/api/admin/appointments?status=cancelled&startDate=${todayYMD}&endDate=${todayYMD}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setAnalytics(Array.isArray(loadRes.data?.analytics) ? loadRes.data.analytics : []);
      setApprovedLeaves(Array.isArray(leavesRes.data?.leaves) ? leavesRes.data.leaves : []);
      setRecentCancellations(Array.isArray(cancelsRes.data?.appointments) ? cancelsRes.data.appointments.slice(0, 5) : []);
    } catch (e) {
      console.error('RealTimeAlerts fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAll(); }, [todayYMD]);

  const activeLeaveAlerts = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return approvedLeaves.filter(lr => {
      const s = new Date(lr.start_date);
      const e = new Date(lr.end_date);
      s.setHours(0,0,0,0); e.setHours(23,59,59,999);
      return now >= s && now <= e;
    });
  }, [approvedLeaves]);

  const queueDelayAlerts = useMemo(() => {
    // Simple heuristic: alert when avg wait time is high or total appts heavy
    return analytics.filter(a => (a.avgWaitTime || 0) >= 25 || (a.totalAppointments || 0) >= 18);
  }, [analytics]);

  const hasAnyAlerts = (activeLeaveAlerts.length + queueDelayAlerts.length + recentCancellations.length) > 0;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center text-gray-600">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
          Loading alerts...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <HiBell className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Real-time Alerts</h3>
        </div>
        <button onClick={fetchAll} className="text-gray-600 hover:text-gray-800 flex items-center space-x-1 text-sm" disabled={refreshing}>
          <HiRefresh className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {!hasAnyAlerts ? (
        <div className="px-6 py-6 text-sm text-gray-600">No alerts at the moment.</div>
      ) : (
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Doctor Absent Alerts */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center mb-3">
              <HiBan className="h-5 w-5 text-red-600" />
              <h4 className="ml-2 text-sm font-semibold text-gray-900">Doctor Absent Today</h4>
            </div>
            {activeLeaveAlerts.length === 0 ? (
              <div className="text-xs text-gray-500">No approved leaves affecting today.</div>
            ) : (
              <div className="space-y-2">
                {activeLeaveAlerts.slice(0, 6).map(lr => (
                  <div key={lr._id} className="text-sm flex items-start justify-between">
                    <div className="flex items-start">
                      <HiUser className="h-4 w-4 text-gray-500 mt-0.5 mr-2" />
                      <div>
                        <div className="font-medium">{lr.doctor_id?.name || 'Doctor'}</div>
                        <div className="text-xs text-gray-500">{lr.leave_type === 'half_day' ? `${lr.session} session` : 'Full day'} • {lr.reason || 'Approved leave'}</div>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded bg-red-50 text-red-700">absent</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Queue Delay Alerts */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center mb-3">
              <HiClock className="h-5 w-5 text-orange-600" />
              <h4 className="ml-2 text-sm font-semibold text-gray-900">Queue Delays</h4>
            </div>
            {queueDelayAlerts.length === 0 ? (
              <div className="text-xs text-gray-500">No significant delays detected.</div>
            ) : (
              <div className="space-y-2">
                {queueDelayAlerts.slice(0, 6).map(a => (
                  <div key={a.doctorId} className="text-sm flex items-start justify-between">
                    <div>
                      <div className="font-medium">{a.doctorName || 'Doctor'}</div>
                      <div className="text-xs text-gray-500">Avg wait ~ {a.avgWaitTime} mins • Today: {a.totalAppointments}</div>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded bg-orange-50 text-orange-700">delay</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cancellations */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center mb-3">
              <HiExclamation className="h-5 w-5 text-purple-600" />
              <h4 className="ml-2 text-sm font-semibold text-gray-900">Today’s Cancellations</h4>
            </div>
            {recentCancellations.length === 0 ? (
              <div className="text-xs text-gray-500">No cancellations today.</div>
            ) : (
              <div className="space-y-2">
                {recentCancellations.map(rc => (
                  <div key={rc.id} className="text-sm flex items-start justify-between">
                    <div>
                      <div className="font-medium">{rc.patientName}</div>
                      <div className="text-xs text-gray-500">Dr. {rc.doctor} • {new Date(rc.date).toLocaleDateString()} {rc.time || ''}</div>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded bg-purple-50 text-purple-700">cancelled</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


