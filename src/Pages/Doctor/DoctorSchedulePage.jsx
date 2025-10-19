import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiArrowLeft, HiCalendar, HiChevronLeft, HiChevronRight, HiX, HiPencil, HiClock, HiExclamation } from 'react-icons/hi';
import axios from 'axios';
import DoctorSidebar from '../../Components/Doctor/Sidebar';

export default function DoctorSchedulePage() {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showScheduleOptions, setShowScheduleOptions] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [newScheduleData, setNewScheduleData] = useState({
    date: '',
    isAvailable: true,
    workingHours: { start_time: '09:00', end_time: '17:00' },
    breakTime: { start_time: '13:00', end_time: '14:00' },
    slotDuration: 30,
    leaveReason: '',
    notes: ''
  });
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentMonth = currentDate.getMonth();

  useEffect(() => {
    checkDoctorAuth();
    fetchSchedules(); // Fetch schedules immediately after auth check
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [currentDate]);

  // Listen for schedule updates from admin
  useEffect(() => {
    const handleScheduleUpdate = () => {
      console.log('🔄 Schedule update detected, refreshing...');
      fetchSchedules();
      setShowUpdateNotification(true);
      setTimeout(() => setShowUpdateNotification(false), 3000);
    };

    // Listen for localStorage changes (cross-tab communication)
    const handleStorageChange = (e) => {
      if (e.key === 'scheduleUpdate') {
        handleScheduleUpdate();
      }
    };

    // Listen for postMessage (if opened in popup/iframe)
    const handleMessage = (e) => {
      if (e.data && e.data.type === 'SCHEDULE_UPDATED') {
        handleScheduleUpdate();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('message', handleMessage);
    };
  }, []);

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
    } catch (error) {
      console.error('Error parsing user data:', error);
      navigate('/login');
    }
  };

  const fetchSchedules = async () => {
    try {
      const token = localStorage.getItem('token');
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const response = await axios.get(
        `${API_BASE_URL}/api/doctor/schedules?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSchedules(response.data.schedules || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const handleScheduleClick = (dayInfo) => {
    if (dayInfo.isPastDate || !dayInfo.schedule) return;
    
    console.log('Selected schedule data:', dayInfo.schedule);
    setSelectedSchedule(dayInfo.schedule);
    setShowScheduleOptions(true);
  };

  const handleCancelSchedule = async () => {
    if (!cancelReason.trim()) {
      alert('Please provide a reason for cancellation');
      return;
    }

    if (!selectedSchedule || !selectedSchedule.id) {
      alert('Schedule information is missing. Please try again.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const requestData = {
        type: 'cancel',
        scheduleId: selectedSchedule.id,
        reason: cancelReason,
        date: selectedSchedule.date
      };
      
      console.log('🚀 Sending schedule request:', requestData);
      console.log('🚀 Token exists:', !!token);
      
      const response = await axios.post('${API_BASE_URL}/api/doctor/schedule-requests', requestData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('✅ Schedule request response:', response.data);

      alert('Schedule cancellation request submitted to admin');
      setShowCancelModal(false);
      setShowScheduleOptions(false);
      setCancelReason('');
      fetchSchedules();
    } catch (error) {
      console.error('Error submitting cancellation request:', error);
      console.error('Error details:', error.response?.data);
      alert('Failed to submit cancellation request: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleReschedule = () => {
    setNewScheduleData({
      ...newScheduleData,
      date: '' // Clear the date so doctor can enter the new date
    });
    setShowRescheduleModal(true);
    setShowScheduleOptions(false);
  };

  const handleSaveReschedule = async () => {
    if (!selectedSchedule || !selectedSchedule.id) {
      alert('Schedule information is missing. Please try again.');
      return;
    }

      try {
        const token = localStorage.getItem('token');
      const requestData = {
        type: 'reschedule',
        scheduleId: selectedSchedule.id,
        date: selectedSchedule.date, // Original date being rescheduled
        newSchedule: newScheduleData,
        reason: `Reschedule request from ${selectedSchedule.date} to ${newScheduleData.date}`
      };
      
      console.log('🚀 Sending reschedule request:', requestData);
      console.log('🚀 Token exists:', !!token);
      
      const response = await axios.post('${API_BASE_URL}/api/doctor/schedule-requests', requestData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      
      console.log('✅ Reschedule request response:', response.data);

      alert('Reschedule request submitted to admin');
      setShowRescheduleModal(false);
      setNewScheduleData({
      date: '',
      isAvailable: true,
        workingHours: { start_time: '09:00', end_time: '17:00' },
        breakTime: { start_time: '13:00', end_time: '14:00' },
      slotDuration: 30,
      leaveReason: '',
      notes: ''
    });
      fetchSchedules();
    } catch (error) {
      console.error('Error submitting reschedule request:', error);
      console.error('Error details:', error.response?.data);
      alert('Failed to submit reschedule request: ' + (error.response?.data?.message || error.message));
    }
  };

  // Generate calendar days for current month
  const generateCalendarDays = () => {
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format

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
      const isPastDate = dateString < today; // Check if this date is in the past
      
      days.push({
        day,
        date: dateString,
        isToday: dateString === today,
        isSelected: dateString === selectedDate,
        schedule: isPastDate ? null : schedule, // Only show schedule for today and future dates
        isPastDate
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

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Update Notification */}
      {showUpdateNotification && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2">
          <HiClock className="h-5 w-5" />
          <span>Schedule updated successfully!</span>
        </div>
      )}
      
      <DoctorSidebar />
      <div className="flex-1 ml-64">
        {/* Professional Header */}
        <div className="bg-white shadow-lg border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-6 sm:py-8 space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <button
                  onClick={() => navigate('/doctor/dashboard')}
                  className="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200"
                >
                  <HiArrowLeft className="h-5 w-5 text-gray-600" />
                </button>
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center">
                    <HiClock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Schedule Management</h1>
                    <p className="text-base sm:text-lg text-gray-600 mt-1">Manage your working schedule and availability</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-xl">
                  <HiClock className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-700">Current Month: {months[currentMonth]}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
            {/* Calendar Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Schedule Calendar</h2>
                  <div className="flex items-center space-x-6 mt-3 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-200 rounded-full"></div>
                      <span className="text-gray-600">Available</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-200 rounded-full"></div>
                      <span className="text-gray-600">On Leave</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-200 rounded-full"></div>
                      <span className="text-gray-600">Today</span>
              </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-200 rounded-full"></div>
                      <span className="text-gray-600">Selected</span>
              </div>
            </div>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => navigateMonth(-1)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <HiChevronLeft className="h-5 w-5 text-gray-600" />
                  </button>
                  <h3 className="text-lg font-semibold min-w-[200px] text-center text-gray-900">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h3>
                <button
                    onClick={() => navigateMonth(1)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <HiChevronRight className="h-5 w-5 text-gray-600" />
                </button>
                </div>
              </div>
          </div>

              {/* Calendar Grid */}
            <div className="p-6">
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-3 text-center text-sm font-medium text-gray-500 bg-gray-50 rounded-lg">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {generateCalendarDays().map((dayInfo, index) => (
                  <div
                    key={index}
                    className={`min-h-[100px] p-3 border rounded-lg transition-all duration-200 ${
                      !dayInfo ? 'bg-gray-50' : 
                      dayInfo.isPastDate ? 'bg-gray-100 border-gray-300 opacity-60' :
                      dayInfo.isSelected ? 'bg-blue-100 border-blue-500 shadow-md' :
                      dayInfo.isToday ? 'bg-yellow-50 border-yellow-300' :
                      dayInfo.schedule?.isAvailable ? 'bg-green-50 border-green-200 hover:bg-green-100 hover:shadow-sm' :
                      dayInfo.schedule ? 'bg-red-50 border-red-200' :
                      'bg-white border-gray-200 hover:bg-gray-50 hover:shadow-sm'
                    }`}
                    onClick={() => {
                      if (dayInfo && !dayInfo.isPastDate) {
                        setSelectedDate(dayInfo.date);
                        if (dayInfo.schedule) {
                          handleScheduleClick(dayInfo);
                        }
                      }
                    }}
                  >
                    {dayInfo && (
                      <>
                        <div className={`text-sm font-medium mb-2 ${
                          dayInfo.isPastDate ? 'text-gray-500' : 'text-gray-900'
                        }`}>
                          {dayInfo.day}
                        </div>
                        {dayInfo.isPastDate ? (
                          <div className="text-xs text-gray-400 text-center">
                            Past Date
                          </div>
                        ) : dayInfo.schedule ? (
                          <div className="space-y-1">
                            <div className={`text-xs px-2 py-1 rounded-full text-center ${
                              dayInfo.schedule.isAvailable ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                            }`}>
                              {dayInfo.schedule.isAvailable ? 'Available' : 'On Leave'}
                            </div>
                            {dayInfo.schedule.isAvailable && dayInfo.schedule.workingHours && (
                              <div className="text-xs text-gray-600 text-center">
                                {dayInfo.schedule.workingHours.start_time}-{dayInfo.schedule.workingHours.end_time}
                              </div>
                            )}
                            {!dayInfo.schedule.isAvailable && dayInfo.schedule.leaveReason && (
                              <div className="text-xs text-red-600 text-center truncate" title={dayInfo.schedule.leaveReason}>
                                {dayInfo.schedule.leaveReason}
                              </div>
                            )}
                              </div>
                        ) : (
                          <div className="text-xs text-gray-400 text-center">
                            No Schedule
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
              </div>
              </div>

      {/* Schedule Options Modal */}
      {showScheduleOptions && selectedSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Schedule Options</h3>
              <button
                onClick={() => setShowScheduleOptions(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <HiX className="h-5 w-5" />
              </button>
        </div>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Date:</strong> {new Date(selectedSchedule.date).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Status:</strong> 
                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  selectedSchedule.isAvailable ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                }`}>
                  {selectedSchedule.isAvailable ? 'Available' : 'On Leave'}
                </span>
              </p>
              {selectedSchedule.workingHours && (
                <p className="text-sm text-gray-600">
                  <strong>Hours:</strong> {selectedSchedule.workingHours.start_time} - {selectedSchedule.workingHours.end_time}
                </p>
              )}
            </div>

            <div className="space-y-3">
                      <button
                onClick={() => {
                  setShowCancelModal(true);
                  setShowScheduleOptions(false);
                }}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <HiX className="h-4 w-4" />
                <span>Cancel This Date</span>
                      </button>
              
                        <button
                onClick={handleReschedule}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <HiPencil className="h-4 w-4" />
                <span>Reschedule</span>
                        </button>
              
                        <button
                onClick={() => setShowScheduleOptions(false)}
                className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                        >
                Close
                        </button>
                      </div>
                    </div>
                        </div>
      )}

      {/* Cancel Schedule Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Cancel Schedule</h3>
              <button
                onClick={() => setShowCancelModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <HiX className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-4 p-4 bg-red-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <HiExclamation className="h-5 w-5 text-red-600" />
                <span className="text-sm font-medium text-red-800">Cancel Schedule Request</span>
                        </div>
                          <p className="text-sm text-red-700">
                This will submit a cancellation request to the admin for review.
                              </p>
                            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Cancellation *
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please provide a reason for cancelling this schedule..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                rows={4}
                required
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleCancelSchedule}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Submit Request
              </button>
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
                        </div>
                      </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Reschedule Request</h3>
              <button
                onClick={() => setShowRescheduleModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <HiX className="h-5 w-5" />
              </button>
      </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                <input
                  type="date"
                    value={newScheduleData.date}
                    onChange={(e) => setNewScheduleData({...newScheduleData, date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                />
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                </label>
                  <select
                    value={newScheduleData.isAvailable ? 'available' : 'leave'}
                    onChange={(e) => setNewScheduleData({...newScheduleData, isAvailable: e.target.value === 'available'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="available">Available</option>
                    <option value="leave">On Leave</option>
                  </select>
                </div>
              </div>

              {newScheduleData.isAvailable && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={newScheduleData.workingHours.start_time}
                        onChange={(e) => setNewScheduleData({
                          ...newScheduleData,
                          workingHours: {...newScheduleData.workingHours, start_time: e.target.value}
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={newScheduleData.workingHours.end_time}
                        onChange={(e) => setNewScheduleData({
                          ...newScheduleData,
                          workingHours: {...newScheduleData.workingHours, end_time: e.target.value}
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Break Start Time
                      </label>
                      <input
                        type="time"
                        value={newScheduleData.breakTime.start_time}
                        onChange={(e) => setNewScheduleData({
                          ...newScheduleData,
                          breakTime: {...newScheduleData.breakTime, start_time: e.target.value}
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Break End Time
                      </label>
                      <input
                        type="time"
                        value={newScheduleData.breakTime.end_time}
                        onChange={(e) => setNewScheduleData({
                          ...newScheduleData,
                          breakTime: {...newScheduleData.breakTime, end_time: e.target.value}
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Slot Duration (minutes)
                    </label>
                    <select
                      value={newScheduleData.slotDuration}
                      onChange={(e) => setNewScheduleData({...newScheduleData, slotDuration: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={45}>45 minutes</option>
                      <option value={60}>60 minutes</option>
                    </select>
                  </div>
                </>
              )}

              {!newScheduleData.isAvailable && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Leave Reason
                  </label>
                  <input
                    type="text"
                    value={newScheduleData.leaveReason}
                    onChange={(e) => setNewScheduleData({...newScheduleData, leaveReason: e.target.value})}
                    placeholder="Reason for leave..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  </div>
                )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={newScheduleData.notes}
                  onChange={(e) => setNewScheduleData({...newScheduleData, notes: e.target.value})}
                  placeholder="Any additional notes for the reschedule request..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleSaveReschedule}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Submit Reschedule Request
              </button>
              <button
                onClick={() => setShowRescheduleModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}