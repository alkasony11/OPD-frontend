import { useState, useEffect } from 'react';
import { 
  HiCalendar, 
  HiClock, 
  HiPlus, 
  HiPencil, 
  HiTrash, 
  HiCheck, 
  HiX,
  HiChevronLeft,
  HiChevronRight,
  HiEye
} from 'react-icons/hi';
import axios from 'axios';
import { API_CONFIG } from '../../config/urls';

export default function ScheduleCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showAppointmentsModal, setShowAppointmentsModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);

  const [scheduleForm, setScheduleForm] = useState({
    date: '',
    isAvailable: true,
    workingHours: {
      start_time: '09:00',
      end_time: '17:00'
    },
    breakTime: {
      start_time: '13:00',
      end_time: '14:00'
    },
    slotDuration: 30,
    maxPatientsPerSlot: 1,
    leaveReason: '',
    notes: ''
  });

  useEffect(() => {
    fetchSchedules();
  }, [currentDate]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const response = await axios.get(
        `${API_CONFIG.BASE_URL}/api/doctor/schedules?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSchedules(response.data.schedules || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDayAppointments = async (date) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_CONFIG.BASE_URL}/api/doctor/appointments?date=${date}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAppointments(response.data.appointments || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const handleSaveSchedule = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = editingSchedule 
        ? `${API_CONFIG.BASE_URL}/api/doctor/schedules/${editingSchedule.id}`
        : '${API_CONFIG.BASE_URL}/api/doctor/schedules';
      
      const method = editingSchedule ? 'PUT' : 'POST';
      
      await axios({
        method,
        url,
        data: scheduleForm,
        headers: { Authorization: `Bearer ${token}` }
      });

      setShowScheduleModal(false);
      setEditingSchedule(null);
      resetScheduleForm();
      fetchSchedules();
      alert('Schedule saved successfully!');
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('Error saving schedule: ' + (error.response?.data?.message || 'Unknown error'));
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_CONFIG.BASE_URL}/api/doctor/schedules/${scheduleId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchSchedules();
        alert('Schedule deleted successfully!');
      } catch (error) {
        console.error('Error deleting schedule:', error);
        alert('Error deleting schedule');
      }
    }
  };

  const resetScheduleForm = () => {
    setScheduleForm({
      date: '',
      isAvailable: true,
      workingHours: {
        start_time: '09:00',
        end_time: '17:00'
      },
      breakTime: {
        start_time: '13:00',
        end_time: '14:00'
      },
      slotDuration: 30,
      maxPatientsPerSlot: 1,
      leaveReason: '',
      notes: ''
    });
  };

  const openEditModal = (schedule) => {
    setEditingSchedule(schedule);
    setScheduleForm({
      date: schedule.date.split('T')[0],
      isAvailable: schedule.isAvailable,
      workingHours: schedule.workingHours,
      breakTime: schedule.breakTime,
      slotDuration: schedule.slotDuration,
      maxPatientsPerSlot: schedule.maxPatientsPerSlot,
      leaveReason: schedule.leaveReason || '',
      notes: schedule.notes || ''
    });
    setShowScheduleModal(true);
  };

  const openAddModal = (date) => {
    setEditingSchedule(null);
    resetScheduleForm();
    setScheduleForm(prev => ({ ...prev, date: date.toISOString().split('T')[0] }));
    setShowScheduleModal(true);
  };

  const openAppointmentsModal = (date) => {
    setSelectedDate(date);
    fetchDayAppointments(date.toISOString().split('T')[0]);
    setShowAppointmentsModal(true);
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getScheduleForDate = (date) => {
    if (!date) return null;
    const dateStr = date.toISOString().split('T')[0];
    return schedules.find(s => s.date.split('T')[0] === dateStr);
  };

  const formatTime = (time) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const days = getDaysInMonth();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Schedule Calendar</h2>
            <p className="text-sm text-gray-600">Manage your availability and view appointments</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                <HiChevronLeft className="h-5 w-5" />
              </button>
              <h3 className="text-lg font-semibold min-w-[200px] text-center">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h3>
              <button
                onClick={() => navigateMonth(1)}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                <HiChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="p-6">
        {loading ? (
          <div className="text-center py-8">Loading calendar...</div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {dayNames.map(day => (
              <div key={day} className="p-3 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {days.map((date, index) => {
              if (!date) {
                return <div key={index} className="p-3 h-24"></div>;
              }

              const schedule = getScheduleForDate(date);
              const isToday = date.toDateString() === new Date().toDateString();
              const isPast = date < new Date().setHours(0, 0, 0, 0);

              return (
                <div
                  key={date.toISOString()}
                  className={`p-2 h-24 border border-gray-200 relative group hover:bg-gray-50 ${
                    isToday ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  {/* Date number */}
                  <div className={`text-sm font-medium ${
                    isToday ? 'text-blue-600' : isPast ? 'text-gray-400' : 'text-gray-900'
                  }`}>
                    {date.getDate()}
                  </div>

                  {/* Schedule indicator */}
                  {schedule ? (
                    <div className="mt-1">
                      {schedule.isAvailable ? (
                        <div className="text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded">
                          Available
                        </div>
                      ) : (
                        <div className="text-xs bg-red-100 text-red-800 px-1 py-0.5 rounded">
                          Leave
                        </div>
                      )}
                      {schedule.isAvailable && (
                        <div className="text-xs text-gray-600 mt-1">
                          {formatTime(schedule.workingHours.start_time)} - {formatTime(schedule.workingHours.end_time)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-1">
                      <div className="text-xs text-gray-400 px-1 py-0.5">
                        No schedule
                      </div>
                    </div>
                  )}

                  {/* Action buttons (show on hover) */}
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex space-x-1">
                      {schedule ? (
                        <>
                          <button
                            onClick={() => openEditModal(schedule)}
                            className="p-1 text-blue-600 hover:bg-blue-100 rounded text-xs"
                            title="Edit schedule"
                          >
                            <HiPencil className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => openAppointmentsModal(date)}
                            className="p-1 text-green-600 hover:bg-green-100 rounded text-xs"
                            title="View appointments"
                          >
                            <HiEye className="h-3 w-3" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => openAddModal(date)}
                          className="p-1 text-gray-600 hover:bg-gray-100 rounded text-xs"
                          title="Add schedule"
                        >
                          <HiPlus className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editingSchedule ? 'Edit Schedule' : 'Add Schedule'}
              </h3>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <HiX className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={scheduleForm.date}
                  onChange={(e) => setScheduleForm({...scheduleForm, date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
                <select
                  value={scheduleForm.isAvailable}
                  onChange={(e) => setScheduleForm({...scheduleForm, isAvailable: e.target.value === 'true'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="true">Available</option>
                  <option value="false">Unavailable (Leave)</option>
                </select>
              </div>
              
              {scheduleForm.isAvailable ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                      <input
                        type="time"
                        value={scheduleForm.workingHours.start_time}
                        onChange={(e) => setScheduleForm({
                          ...scheduleForm, 
                          workingHours: {...scheduleForm.workingHours, start_time: e.target.value}
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                      <input
                        type="time"
                        value={scheduleForm.workingHours.end_time}
                        onChange={(e) => setScheduleForm({
                          ...scheduleForm, 
                          workingHours: {...scheduleForm.workingHours, end_time: e.target.value}
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Break Start</label>
                      <input
                        type="time"
                        value={scheduleForm.breakTime.start_time}
                        onChange={(e) => setScheduleForm({
                          ...scheduleForm, 
                          breakTime: {...scheduleForm.breakTime, start_time: e.target.value}
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Break End</label>
                      <input
                        type="time"
                        value={scheduleForm.breakTime.end_time}
                        onChange={(e) => setScheduleForm({
                          ...scheduleForm, 
                          breakTime: {...scheduleForm.breakTime, end_time: e.target.value}
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Slot Duration (minutes)</label>
                    <select
                      value={scheduleForm.slotDuration}
                      onChange={(e) => setScheduleForm({...scheduleForm, slotDuration: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={45}>45 minutes</option>
                      <option value={60}>60 minutes</option>
                    </select>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Leave Reason</label>
                  <input
                    type="text"
                    value={scheduleForm.leaveReason}
                    onChange={(e) => setScheduleForm({...scheduleForm, leaveReason: e.target.value})}
                    placeholder="Enter reason for unavailability"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={scheduleForm.notes}
                  onChange={(e) => setScheduleForm({...scheduleForm, notes: e.target.value})}
                  placeholder="Additional notes..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSchedule}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {editingSchedule ? 'Update' : 'Save'} Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Appointments Modal */}
      {showAppointmentsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Appointments for {selectedDate?.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h3>
              <button
                onClick={() => setShowAppointmentsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <HiX className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-3">
              {appointments.length > 0 ? (
                appointments.map((appointment) => (
                  <div key={appointment._id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{appointment.patientName}</h4>
                        <p className="text-sm text-gray-600">{appointment.symptoms}</p>
                        <p className="text-sm text-gray-500">Token: {appointment.tokenNumber}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">{appointment.appointmentTime}</div>
                        <div className={`text-sm px-2 py-1 rounded-full ${
                          appointment.status === 'booked' ? 'bg-blue-100 text-blue-800' :
                          appointment.status === 'in_queue' ? 'bg-yellow-100 text-yellow-800' :
                          appointment.status === 'consulted' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {appointment.status}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No appointments scheduled for this date
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
