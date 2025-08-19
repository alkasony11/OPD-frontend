import { useState, useEffect } from 'react';
import { HiCalendar, HiClock, HiPlus, HiPencil, HiTrash, HiCheck, HiX } from 'react-icons/hi';
import axios from 'axios';

export default function ScheduleManagement() {
  const [schedules, setSchedules] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [newSchedule, setNewSchedule] = useState({
    date: '',
    is_available: true,
    start_time: '09:00',
    end_time: '17:00',
    leave_reason: ''
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
    fetchSchedules();
    fetchAppointments();
  }, [selectedDate]);

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

  const handleAddSchedule = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5001/api/doctor/schedules', newSchedule, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setShowAddModal(false);
      setNewSchedule({
        date: '',
        is_available: true,
        start_time: '09:00',
        end_time: '17:00',
        leave_reason: ''
      });
      fetchSchedules();
      alert('Schedule added successfully!');
    } catch (error) {
      console.error('Error adding schedule:', error);
      alert('Error adding schedule: ' + (error.response?.data?.message || 'Unknown error'));
    }
  };

  const getWeekDates = () => {
    const today = new Date();
    const currentDay = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDay);
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDates.push(date);
    }
    return weekDates;
  };

  const formatTime = (time) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const weekDates = getWeekDates();

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Schedule Management</h2>
            <p className="text-sm text-gray-600">Manage your availability and working hours</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <HiPlus className="h-4 w-4" />
            <span>Add Schedule</span>
          </button>
        </div>
      </div>

      {/* Weekly Calendar View */}
      <div className="p-6">
        <div className="grid grid-cols-7 gap-4 mb-6">
          {weekDates.map((date, index) => {
            const dateStr = date.toISOString().split('T')[0];
            const daySchedule = schedules.find(s => s.date === dateStr);
            const isToday = dateStr === new Date().toISOString().split('T')[0];
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            
            return (
              <div
                key={dateStr}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedDate(dateStr)}
              >
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-600">{dayNames[index]}</div>
                  <div className={`text-lg font-bold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                    {date.getDate()}
                  </div>
                  {daySchedule && (
                    <div className="mt-2">
                      {daySchedule.is_available ? (
                        <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                          Available
                        </div>
                      ) : (
                        <div className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                          Unavailable
                        </div>
                      )}
                      {daySchedule.is_available && (
                        <div className="text-xs text-gray-600 mt-1">
                          {formatTime(daySchedule.start_time)} - {formatTime(daySchedule.end_time)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Date Details */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">
            Schedule for {new Date(selectedDate).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
          
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : (
            <div className="space-y-3">
              {schedules.filter(s => s.date === selectedDate).map((item, index) => (
                <div key={index} className="flex items-center justify-between bg-white p-4 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${
                      item.is_available ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <div>
                      <div className="font-medium">
                        {item.is_available ? 'Available' : 'Unavailable'}
                      </div>
                      {item.is_available ? (
                        <div className="text-sm text-gray-600">
                          {formatTime(item.start_time)} - {formatTime(item.end_time)}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-600">
                          Reason: {item.leave_reason || 'Not specified'}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setEditingSchedule(item)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                    >
                      <HiPencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSchedule(item._id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded"
                    >
                      <HiTrash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              
              {schedules.filter(s => s.date === selectedDate).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No schedule set for this date
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Schedule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Schedule</h3>
              <button
                onClick={() => setShowAddModal(false)}
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
                  value={newSchedule.date}
                  onChange={(e) => setNewSchedule({...newSchedule, date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
                <select
                  value={newSchedule.is_available}
                  onChange={(e) => setNewSchedule({...newSchedule, is_available: e.target.value === 'true'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="true">Available</option>
                  <option value="false">Unavailable</option>
                </select>
              </div>
              
              {newSchedule.is_available ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                    <input
                      type="time"
                      value={newSchedule.start_time}
                      onChange={(e) => setNewSchedule({...newSchedule, start_time: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                    <input
                      type="time"
                      value={newSchedule.end_time}
                      onChange={(e) => setNewSchedule({...newSchedule, end_time: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Leave Reason</label>
                  <input
                    type="text"
                    value={newSchedule.leave_reason}
                    onChange={(e) => setNewSchedule({...newSchedule, leave_reason: e.target.value})}
                    placeholder="Enter reason for unavailability"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSchedule}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
