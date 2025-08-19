import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { HiCalendar, HiClock, HiPlus, HiPencil, HiTrash, HiCheck, HiX, HiUser, HiCog, HiExclamationTriangle } from 'react-icons/hi';

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showDefaultHoursModal, setShowDefaultHoursModal] = useState(false);
  const [showBulkLeaveModal, setShowBulkLeaveModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [defaultHours, setDefaultHours] = useState({
    workingHours: { start_time: '09:00', end_time: '17:00' },
    breakTime: { start_time: '13:00', end_time: '14:00' },
    slotDuration: 30
  });
  const [bulkLeaveForm, setBulkLeaveForm] = useState({
    startDate: '',
    endDate: '',
    leaveReason: '',
    notes: ''
  });

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
    checkDoctorAuth();
  }, []);

  useEffect(() => {
    if (doctor) {
      fetchSchedules();
      fetchAppointments();
      fetchDefaultHours();
    }
  }, [doctor, selectedDate]);

  const checkDoctorAuth = () => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!userData || !token) {
      navigate('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 'doctor') {
        alert('Access denied. Doctor privileges required.');
        navigate('/');
        return;
      }
      setDoctor(parsedUser);
    } catch (error) {
      console.error('Error parsing user data:', error);
      navigate('/login');
    }
  };

  const fetchSchedules = async () => {
    try {
      const token = localStorage.getItem('token');
      const startDate = new Date(selectedDate);
      const endDate = new Date(selectedDate);
      endDate.setDate(endDate.getDate() + 30);

      const response = await axios.get(
        `http://localhost:5001/api/doctor/schedules?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSchedules(response.data.schedules || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
  };

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5001/api/doctor/appointments?date=${selectedDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAppointments(response.data.appointments || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDefaultHours = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        'http://localhost:5001/api/doctor/default-hours',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDefaultHours(response.data);
    } catch (error) {
      console.error('Error fetching default hours:', error);
    }
  };

  const handleSaveSchedule = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = editingSchedule 
        ? `http://localhost:5001/api/doctor/schedules/${editingSchedule.id}`
        : 'http://localhost:5001/api/doctor/schedules';
      
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
        await axios.delete(`http://localhost:5001/api/doctor/schedules/${scheduleId}`, {
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

  const openAddModal = () => {
    setEditingSchedule(null);
    resetScheduleForm();
    setScheduleForm(prev => ({ ...prev, date: selectedDate }));
    setShowScheduleModal(true);
  };

  const handleSaveDefaultHours = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5001/api/doctor/default-hours',
        defaultHours,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowDefaultHoursModal(false);
      alert('Default working hours updated successfully!');
    } catch (error) {
      console.error('Error saving default hours:', error);
      alert('Error saving default hours: ' + (error.response?.data?.message || 'Unknown error'));
    }
  };

  const handleBulkLeave = async () => {
    // Validation
    if (!bulkLeaveForm.startDate || !bulkLeaveForm.endDate) {
      alert('Please select both start and end dates.');
      return;
    }

    if (new Date(bulkLeaveForm.startDate) > new Date(bulkLeaveForm.endDate)) {
      alert('Start date cannot be after end date.');
      return;
    }

    if (!bulkLeaveForm.leaveReason.trim()) {
      alert('Please provide a reason for the leave.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5001/api/doctor/schedules/bulk',
        {
          ...bulkLeaveForm,
          isAvailable: false,
          workingHours: defaultHours.workingHours,
          breakTime: defaultHours.breakTime,
          slotDuration: defaultHours.slotDuration
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowBulkLeaveModal(false);
      setBulkLeaveForm({
        startDate: '',
        endDate: '',
        leaveReason: '',
        notes: ''
      });
      fetchSchedules();
      
      const cancelledTokens = response.data.cancelledTokens.reduce((total, day) => total + day.cancelledTokens, 0);
      alert(`Leave days set successfully! ${cancelledTokens} tokens were automatically cancelled.`);
    } catch (error) {
      console.error('Error setting bulk leave:', error);
      alert('Error setting leave days: ' + (error.response?.data?.message || 'Unknown error'));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Generate calendar days for current month
  const generateCalendarDays = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateString = date.toISOString().split('T')[0];
      const schedule = schedules.find(s => s.date.split('T')[0] === dateString);
      const appointmentCount = appointments.filter(a => a.booking_date.split('T')[0] === dateString).length;
      
      days.push({
        day,
        date: dateString,
        isToday: dateString === new Date().toISOString().split('T')[0],
        isSelected: dateString === selectedDate,
        schedule,
        appointmentCount
      });
    }
    
    return days;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Doctor Dashboard</h1>
              <p className="text-gray-600">Welcome, Dr. {doctor?.name}</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDefaultHoursModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <HiCog className="h-4 w-4" />
                <span>Default Hours</span>
              </button>
              <button
                onClick={() => setShowBulkLeaveModal(true)}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center space-x-2"
              >
                <HiExclamationTriangle className="h-4 w-4" />
                <span>Set Leave</span>
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <HiCalendar className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Today's Appointments</p>
                <p className="text-2xl font-semibold text-gray-900">{appointments.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <HiClock className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Available Days</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {schedules.filter(s => s.isAvailable).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <HiExclamationTriangle className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Leave Days</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {schedules.filter(s => !s.isAvailable).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <HiUser className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Tokens</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {appointments.filter(a => a.status === 'booked' || a.status === 'in_queue').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Welcome message for new doctors */}
        {schedules.length === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <HiCalendar className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-blue-900">Welcome to your Doctor Dashboard!</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>Your account has been created successfully. Your admin has set up initial schedules for you.</p>
                  <p className="mt-1">You can view and manage your schedules using the calendar below. If you don't see any schedules, please contact your admin or create your own schedule.</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={openAddModal}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <HiPlus className="h-4 w-4" />
                    <span>Create Your First Schedule</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Schedule Calendar</h2>
                  <div className="flex items-center space-x-4 mt-2 text-xs">
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-green-200 rounded"></div>
                      <span>Available</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-red-200 rounded"></div>
                      <span>On Leave</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-yellow-200 rounded"></div>
                      <span>Today</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-blue-200 rounded"></div>
                      <span>Selected</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={openAddModal}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <HiPlus className="h-4 w-4" />
                  <span>Add Schedule</span>
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {generateCalendarDays().map((dayInfo, index) => (
                  <div
                    key={index}
                    className={`min-h-[80px] p-2 border rounded cursor-pointer transition-colors ${
                      !dayInfo ? 'bg-gray-50' : 
                      dayInfo.isSelected ? 'bg-blue-100 border-blue-500' :
                      dayInfo.isToday ? 'bg-yellow-50 border-yellow-300' :
                      dayInfo.schedule?.isAvailable ? 'bg-green-50 border-green-200 hover:bg-green-100' :
                      dayInfo.schedule ? 'bg-red-50 border-red-200' :
                      'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => dayInfo && setSelectedDate(dayInfo.date)}
                  >
                    {dayInfo && (
                      <>
                        <div className="text-sm font-medium text-gray-900">{dayInfo.day}</div>
                        {dayInfo.schedule && (
                          <div className="mt-1">
                            <div className={`text-xs px-1 py-0.5 rounded ${
                              dayInfo.schedule.isAvailable ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                            }`}>
                              {dayInfo.schedule.isAvailable ? 'Available' : 'On Leave'}
                            </div>
                            {dayInfo.schedule.isAvailable && dayInfo.schedule.workingHours && (
                              <div className="text-xs text-gray-600 mt-1">
                                {dayInfo.schedule.workingHours.start_time}-{dayInfo.schedule.workingHours.end_time}
                              </div>
                            )}
                            {!dayInfo.schedule.isAvailable && dayInfo.schedule.leaveReason && (
                              <div className="text-xs text-red-600 mt-1 truncate" title={dayInfo.schedule.leaveReason}>
                                {dayInfo.schedule.leaveReason}
                              </div>
                            )}
                            {dayInfo.appointmentCount > 0 && (
                              <div className={`text-xs mt-1 ${
                                dayInfo.schedule.isAvailable ? 'text-blue-600' : 'text-red-600'
                              }`}>
                                {dayInfo.appointmentCount} {dayInfo.schedule.isAvailable ? 'appointments' : 'cancelled'}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Schedule Details & Appointments */}
          <div className="space-y-6">
            {/* Default Hours Summary */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Default Working Hours</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Working Hours:</span>
                  <span className="text-sm font-medium">{defaultHours.workingHours.start_time} - {defaultHours.workingHours.end_time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Break Time:</span>
                  <span className="text-sm font-medium">{defaultHours.breakTime.start_time} - {defaultHours.breakTime.end_time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Slot Duration:</span>
                  <span className="text-sm font-medium">{defaultHours.slotDuration} minutes</span>
                </div>
              </div>
              <button
                onClick={() => setShowDefaultHoursModal(true)}
                className="mt-3 text-blue-600 hover:text-blue-800 text-sm"
              >
                Update Default Hours
              </button>
            </div>
            {/* Selected Date Schedule */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Schedule for {new Date(selectedDate).toLocaleDateString()}
              </h3>
              
              {(() => {
                const schedule = schedules.find(s => s.date.split('T')[0] === selectedDate);
                if (!schedule) {
                  return (
                    <div className="text-center py-4">
                      <p className="text-gray-500 mb-4">No schedule set for this date</p>
                      <button
                        onClick={openAddModal}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                      >
                        Add Schedule
                      </button>
                    </div>
                  );
                }
                
                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        schedule.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {schedule.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                      <div className="space-x-2">
                        <button
                          onClick={() => openEditModal(schedule)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <HiPencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSchedule(schedule.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <HiTrash className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    {schedule.isAvailable && (
                      <>
                        <div>
                          <p className="text-sm text-gray-600">Working Hours</p>
                          <p className="font-medium">{schedule.workingHours.start_time} - {schedule.workingHours.end_time}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Break Time</p>
                          <p className="font-medium">{schedule.breakTime.start_time} - {schedule.breakTime.end_time}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Slot Duration</p>
                          <p className="font-medium">{schedule.slotDuration} minutes</p>
                        </div>
                      </>
                    )}
                    
                    {!schedule.isAvailable && (
                      <>
                        {schedule.leaveReason && (
                          <div>
                            <p className="text-sm text-gray-600">Leave Reason</p>
                            <p className="font-medium">{schedule.leaveReason}</p>
                          </div>
                        )}
                        <div className="bg-red-50 border border-red-200 rounded-md p-3">
                          <div className="flex">
                            <HiExclamationTriangle className="h-5 w-5 text-red-400" />
                            <div className="ml-3">
                              <p className="text-sm text-red-700">
                                Doctor is on leave. All tokens for this date are automatically cancelled.
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                    
                    {schedule.notes && (
                      <div>
                        <p className="text-sm text-gray-600">Notes</p>
                        <p className="font-medium">{schedule.notes}</p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Today's Appointments */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Appointments for {new Date(selectedDate).toLocaleDateString()}
              </h3>
              
              {appointments.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No appointments for this date</p>
              ) : (
                <div className="space-y-3">
                  {appointments.map((appointment) => (
                    <div key={appointment._id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{appointment.patient_name}</p>
                          <p className="text-sm text-gray-600">{appointment.time_slot}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          appointment.status === 'booked' ? 'bg-green-100 text-green-800' :
                          appointment.status === 'in_queue' ? 'bg-blue-100 text-blue-800' :
                          appointment.status === 'consulted' ? 'bg-purple-100 text-purple-800' :
                          appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          appointment.status === 'missed' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {appointment.status}
                        </span>
                      </div>
                      {appointment.symptoms && (
                        <p className="text-sm text-gray-600 mt-2">Symptoms: {appointment.symptoms}</p>
                      )}
                      {appointment.status === 'cancelled' && appointment.cancellation_reason && (
                        <p className="text-sm text-red-600 mt-2">Cancelled: {appointment.cancellation_reason}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingSchedule ? 'Edit Schedule' : 'Add Schedule'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input
                  type="date"
                  value={scheduleForm.date}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, date: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={scheduleForm.isAvailable}
                    onChange={(e) => setScheduleForm(prev => ({ ...prev, isAvailable: e.target.checked }))}
                    className="mr-2"
                  />
                  Available
                </label>
              </div>

              {scheduleForm.isAvailable ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Start Time</label>
                      <input
                        type="time"
                        value={scheduleForm.workingHours.start_time}
                        onChange={(e) => setScheduleForm(prev => ({
                          ...prev,
                          workingHours: { ...prev.workingHours, start_time: e.target.value }
                        }))}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">End Time</label>
                      <input
                        type="time"
                        value={scheduleForm.workingHours.end_time}
                        onChange={(e) => setScheduleForm(prev => ({
                          ...prev,
                          workingHours: { ...prev.workingHours, end_time: e.target.value }
                        }))}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Break Start</label>
                      <input
                        type="time"
                        value={scheduleForm.breakTime.start_time}
                        onChange={(e) => setScheduleForm(prev => ({
                          ...prev,
                          breakTime: { ...prev.breakTime, start_time: e.target.value }
                        }))}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Break End</label>
                      <input
                        type="time"
                        value={scheduleForm.breakTime.end_time}
                        onChange={(e) => setScheduleForm(prev => ({
                          ...prev,
                          breakTime: { ...prev.breakTime, end_time: e.target.value }
                        }))}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Slot Duration (minutes)</label>
                    <select
                      value={scheduleForm.slotDuration}
                      onChange={(e) => setScheduleForm(prev => ({ ...prev, slotDuration: parseInt(e.target.value) }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
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
                  <label className="block text-sm font-medium text-gray-700">Leave Reason</label>
                  <input
                    type="text"
                    value={scheduleForm.leaveReason}
                    onChange={(e) => setScheduleForm(prev => ({ ...prev, leaveReason: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Reason for unavailability"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  value={scheduleForm.notes}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                  placeholder="Additional notes"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowScheduleModal(false);
                  setEditingSchedule(null);
                  resetScheduleForm();
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSchedule}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Default Hours Modal */}
      {showDefaultHoursModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Set Default Working Hours</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Time</label>
                  <input
                    type="time"
                    value={defaultHours.workingHours.start_time}
                    onChange={(e) => setDefaultHours(prev => ({
                      ...prev,
                      workingHours: { ...prev.workingHours, start_time: e.target.value }
                    }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Time</label>
                  <input
                    type="time"
                    value={defaultHours.workingHours.end_time}
                    onChange={(e) => setDefaultHours(prev => ({
                      ...prev,
                      workingHours: { ...prev.workingHours, end_time: e.target.value }
                    }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Break Start</label>
                  <input
                    type="time"
                    value={defaultHours.breakTime.start_time}
                    onChange={(e) => setDefaultHours(prev => ({
                      ...prev,
                      breakTime: { ...prev.breakTime, start_time: e.target.value }
                    }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Break End</label>
                  <input
                    type="time"
                    value={defaultHours.breakTime.end_time}
                    onChange={(e) => setDefaultHours(prev => ({
                      ...prev,
                      breakTime: { ...prev.breakTime, end_time: e.target.value }
                    }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Slot Duration (minutes)</label>
                <select
                  value={defaultHours.slotDuration}
                  onChange={(e) => setDefaultHours(prev => ({ ...prev, slotDuration: parseInt(e.target.value) }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowDefaultHoursModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDefaultHours}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Default Hours
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Leave Modal */}
      {showBulkLeaveModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Set Leave Days</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Date</label>
                  <input
                    type="date"
                    value={bulkLeaveForm.startDate}
                    onChange={(e) => setBulkLeaveForm(prev => ({ ...prev, startDate: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Date</label>
                  <input
                    type="date"
                    value={bulkLeaveForm.endDate}
                    onChange={(e) => setBulkLeaveForm(prev => ({ ...prev, endDate: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Leave Reason</label>
                <input
                  type="text"
                  value={bulkLeaveForm.leaveReason}
                  onChange={(e) => setBulkLeaveForm(prev => ({ ...prev, leaveReason: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="e.g., Medical leave, Vacation, Conference"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  value={bulkLeaveForm.notes}
                  onChange={(e) => setBulkLeaveForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                  placeholder="Additional notes about the leave"
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <div className="flex">
                  <HiExclamationTriangle className="h-5 w-5 text-yellow-400" />
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      <strong>Warning:</strong> Setting leave days will automatically cancel all existing tokens for the selected date range.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowBulkLeaveModal(false);
                  setBulkLeaveForm({
                    startDate: '',
                    endDate: '',
                    leaveReason: '',
                    notes: ''
                  });
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkLeave}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                Set Leave Days
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}