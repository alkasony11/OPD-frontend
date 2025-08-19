import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../App';
import ScheduleCalendar from '../../Components/Doctor/ScheduleCalendar';
import {
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

export default function DoctorSchedulePage() {
  const { token } = useContext(AuthContext);
  const [stats, setStats] = useState({
    todayAppointments: 0,
    weekAppointments: 0,
    monthAppointments: 0,
    availableDays: 0
  });
  const [todaySchedule, setTodaySchedule] = useState(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch today's schedule
      const today = new Date().toISOString().split('T')[0];
      const scheduleResponse = await axios.get(
        `http://localhost:5001/api/doctor/schedules?date=${today}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (scheduleResponse.data.schedules && scheduleResponse.data.schedules.length > 0) {
        setTodaySchedule(scheduleResponse.data.schedules[0]);
      }

      // Fetch today's appointments
      const appointmentsResponse = await axios.get(
        `http://localhost:5001/api/doctor/appointments?date=${today}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setUpcomingAppointments(appointmentsResponse.data.appointments || []);

      // Fetch statistics
      const statsResponse = await axios.get(
        'http://localhost:5001/api/doctor/dashboard-stats',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setStats(statsResponse.data.stats || stats);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'booked':
        return 'bg-blue-100 text-blue-800';
      case 'in_queue':
        return 'bg-yellow-100 text-yellow-800';
      case 'consulted':
        return 'bg-green-100 text-green-800';
      case 'missed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Schedule Management</h1>
          <p className="text-gray-600 mt-2">Manage your availability and view appointments</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CalendarDaysIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Today's Appointments</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.todayAppointments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">This Week</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.weekAppointments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">This Month</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.monthAppointments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-8 w-8 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Available Days</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.availableDays}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Today's Schedule */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Today's Schedule</h2>
                <p className="text-sm text-gray-600">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              
              <div className="p-6">
                {todaySchedule ? (
                  <div className="space-y-4">
                    {todaySchedule.isAvailable ? (
                      <>
                        <div className="flex items-center">
                          <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                          <span className="text-sm font-medium text-green-800">Available Today</span>
                        </div>
                        
                        <div className="bg-green-50 rounded-lg p-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="font-medium text-gray-700">Working Hours</p>
                              <p className="text-gray-600">
                                {formatTime(todaySchedule.workingHours.start_time)} - {formatTime(todaySchedule.workingHours.end_time)}
                              </p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-700">Break Time</p>
                              <p className="text-gray-600">
                                {formatTime(todaySchedule.breakTime.start_time)} - {formatTime(todaySchedule.breakTime.end_time)}
                              </p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-700">Slot Duration</p>
                              <p className="text-gray-600">{todaySchedule.slotDuration} minutes</p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-700">Max per Slot</p>
                              <p className="text-gray-600">{todaySchedule.maxPatientsPerSlot} patient(s)</p>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center">
                          <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
                          <span className="text-sm font-medium text-red-800">Unavailable Today</span>
                        </div>
                        
                        <div className="bg-red-50 rounded-lg p-4">
                          <p className="text-sm text-red-700">
                            <span className="font-medium">Reason:</span> {todaySchedule.leaveReason || 'Not specified'}
                          </p>
                          {todaySchedule.notes && (
                            <p className="text-sm text-red-600 mt-2">
                              <span className="font-medium">Notes:</span> {todaySchedule.notes}
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <InformationCircleIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-sm font-medium text-gray-900 mb-2">No schedule set</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      You haven't set your schedule for today. Default working hours will be used.
                    </p>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Default:</span> 9:00 AM - 5:00 PM<br />
                        <span className="font-medium">Break:</span> 1:00 PM - 2:00 PM
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Today's Appointments */}
            <div className="bg-white rounded-lg shadow mt-6">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Today's Appointments</h2>
                <p className="text-sm text-gray-600">{upcomingAppointments.length} appointments scheduled</p>
              </div>
              
              <div className="p-6">
                {upcomingAppointments.length > 0 ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {upcomingAppointments.map((appointment) => (
                      <div key={appointment._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-gray-900">{appointment.patientName}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                            {appointment.status}
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><span className="font-medium">Time:</span> {appointment.appointmentTime}</p>
                          <p><span className="font-medium">Token:</span> {appointment.tokenNumber}</p>
                          {appointment.symptoms && (
                            <p><span className="font-medium">Symptoms:</span> {appointment.symptoms}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-sm font-medium text-gray-900 mb-2">No appointments today</h3>
                    <p className="text-sm text-gray-600">You have no appointments scheduled for today.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Schedule Calendar */}
          <div className="lg:col-span-2">
            <ScheduleCalendar />
          </div>
        </div>
      </div>
    </div>
  );
}