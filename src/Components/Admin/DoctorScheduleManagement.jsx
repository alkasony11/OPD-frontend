import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { HiCalendar, HiClock, HiPlus, HiPencil, HiTrash, HiCheck, HiX, HiFilter, HiRefresh, HiEye, HiCog } from 'react-icons/hi';
import axios from 'axios';
import { API_CONFIG } from '../../config/urls';

export default function DoctorScheduleManagement() {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [selectedSchedules, setSelectedSchedules] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all'); // all, available, full, leave
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [viewMode, setViewMode] = useState('list'); // list, calendar

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
    notes: '',
    // Session-based scheduling
    morningSession: {
      available: true,
      start_time: '09:00',
      end_time: '13:00',
      maxPatients: 10
    },
    afternoonSession: {
      available: true,
      start_time: '14:00',
      end_time: '18:00',
      maxPatients: 10
    },
    // New enhanced features
    consultationTypes: {
      opd: true,
      video: false
    },
    repeatOption: 'none', // none, weekly, monthly
    repeatDays: [], // for weekly repeat
    repeatEndDate: '',
    slotDurationOptions: [10, 15, 30, 45, 60]
  });

  const [bulkForm, setBulkForm] = useState({
    startDate: '',
    endDate: '',
    skipWeekends: true,
    scheduleTemplate: {
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
      consultationTypes: {
        opd: true,
        video: false
      },
      morningSession: {
        available: true,
        start_time: '09:00',
        end_time: '13:00',
        maxPatients: 10
      },
      afternoonSession: {
        available: true,
        start_time: '14:00',
        end_time: '18:00',
        maxPatients: 10
      }
    }
  });

  const [bulkDeleteForm, setBulkDeleteForm] = useState({
    startDate: '',
    endDate: '',
    deleteType: 'range' // 'range' or 'selected'
  });

  // Today's date in YYYY-MM-DD for date input min attributes
  const todayStr = (() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  })();

  useEffect(() => {
    fetchDoctors();
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (selectedDoctor) {
      // Clear previous doctor's schedules immediately to avoid showing other doctors' data
      setSchedules([]);
      fetchSchedules(selectedDoctor.id);
    }
  }, [selectedDoctor]);

  useEffect(() => {
    // Filter doctors by department when department changes
    if (selectedDepartment) {
      fetchDoctors().then(() => {
        // Filter will be applied in the render
      });
    } else {
      fetchDoctors();
    }
  }, [selectedDepartment]);

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('${API_CONFIG.BASE_URL}/api/admin/doctors', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDoctors(response.data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get filtered doctors based on selected department
  const getFilteredDoctors = () => {
    if (selectedDepartment) {
      return doctors.filter(doctor => 
        doctor.doctor_info?.department?.name === selectedDepartment
      );
    }
    return doctors;
  };

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('${API_CONFIG.BASE_URL}/api/admin/departments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDepartments(response.data.departments || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchSchedules = async (doctorId) => {
    try {
      setLoading(true);
      const response = await api.get(`/api/admin/doctor-schedules/${doctorId}`);
      // Ensure only this doctor's schedules are shown
      setSchedules((response.data.schedules || []).filter(s => !!s.id));
    } catch (error) {
      console.error('Error fetching schedules:', error);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSchedule = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = `${API_CONFIG.BASE_URL}/api/admin/doctor-schedules/${selectedDoctor.id}`;
      
      // Handle repeat schedules
      if (scheduleForm.repeatOption !== 'none') {
        await handleRepeatScheduleCreation();
      } else {
        // Single schedule
      await axios.post(url, scheduleForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      }

      setShowAddModal(false);
      setEditingSchedule(null);
      resetScheduleForm();
      fetchSchedules(selectedDoctor.id);
      alert('Schedule saved successfully!');
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('Error saving schedule: ' + (error.response?.data?.message || 'Unknown error'));
    }
  };

  const handleRepeatScheduleCreation = async () => {
    const token = localStorage.getItem('token');
    const url = `${API_CONFIG.BASE_URL}/api/admin/doctor-schedules/${selectedDoctor.id}`;
    
    const startDate = new Date(scheduleForm.date);
    const endDate = scheduleForm.repeatEndDate ? new Date(scheduleForm.repeatEndDate) : new Date(startDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // Default 30 days
    
    const schedules = [];
    
    if (scheduleForm.repeatOption === 'weekly') {
      // Weekly repeat
      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        if (scheduleForm.repeatDays.includes(dayName)) {
          const scheduleData = {
            ...scheduleForm,
            date: date.toISOString().split('T')[0]
          };
          schedules.push(scheduleData);
        }
      }
    } else if (scheduleForm.repeatOption === 'monthly') {
      // Monthly repeat
      for (let date = new Date(startDate); date <= endDate; date.setMonth(date.getMonth() + 1)) {
        const scheduleData = {
          ...scheduleForm,
          date: date.toISOString().split('T')[0]
        };
        schedules.push(scheduleData);
      }
    }
    
    // Create all schedules
    for (const scheduleData of schedules) {
      await axios.post(url, scheduleData, {
        headers: { Authorization: `Bearer ${token}` }
      });
    }
  };

  const handleBulkCreate = async () => {
    if (!bulkForm.startDate || !bulkForm.endDate) {
      alert('Please select both start and end dates');
      return;
    }

    if (new Date(bulkForm.startDate) > new Date(bulkForm.endDate)) {
      alert('Start date must be before end date');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_CONFIG.BASE_URL}/api/admin/doctor-schedules/${selectedDoctor.id}/bulk`,
        bulkForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowBulkModal(false);
      resetBulkForm();
      fetchSchedules(selectedDoctor.id);
      alert(response.data.message);
    } catch (error) {
      console.error('Error creating bulk schedules:', error);
      alert('Error creating schedules: ' + (error.response?.data?.message || 'Unknown error'));
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_CONFIG.BASE_URL}/api/admin/doctor-schedules/${scheduleId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchSchedules(selectedDoctor.id);
        alert('Schedule deleted successfully!');
      } catch (error) {
        console.error('Error deleting schedule:', error);
        alert('Error deleting schedule');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (bulkDeleteForm.deleteType === 'range') {
      if (!bulkDeleteForm.startDate || !bulkDeleteForm.endDate) {
        alert('Please select both start and end dates');
        return;
      }

      if (new Date(bulkDeleteForm.startDate) > new Date(bulkDeleteForm.endDate)) {
        alert('Start date must be before end date');
        return;
      }
    } else if (bulkDeleteForm.deleteType === 'selected') {
      if (selectedSchedules.length === 0) {
        alert('Please select schedules to delete');
        return;
      }
    }

    const confirmMessage = bulkDeleteForm.deleteType === 'range' 
      ? `Are you sure you want to delete all schedules between ${bulkDeleteForm.startDate} and ${bulkDeleteForm.endDate}?`
      : `Are you sure you want to delete ${selectedSchedules.length} selected schedules?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const deleteData = {
        deleteType: bulkDeleteForm.deleteType,
        startDate: bulkDeleteForm.startDate,
        endDate: bulkDeleteForm.endDate,
        scheduleIds: selectedSchedules
      };

      console.log('Bulk delete request:', {
        url: `${API_CONFIG.BASE_URL}/api/admin/doctor-schedules/${selectedDoctor.id}/bulk-delete`,
        data: deleteData,
        doctorId: selectedDoctor.id
      });

      const response = await axios.post(`${API_CONFIG.BASE_URL}/api/admin/doctor-schedules/${selectedDoctor.id}/bulk-delete`, deleteData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setShowBulkDeleteModal(false);
      setSelectedSchedules([]);
      resetBulkDeleteForm();
      fetchSchedules(selectedDoctor.id);
      alert(response.data.message || 'Schedules deleted successfully!');
    } catch (error) {
      console.error('Error deleting schedules:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
      alert(`Error deleting schedules: ${errorMessage}`);
    }
  };

  const handleScheduleSelect = (scheduleId, isSelected) => {
    if (isSelected) {
      setSelectedSchedules(prev => [...prev, scheduleId]);
    } else {
      setSelectedSchedules(prev => prev.filter(id => id !== scheduleId));
    }
  };

  const handleSelectAll = () => {
    const filteredSchedules = getFilteredSchedules();
    if (selectedSchedules.length === filteredSchedules.length) {
      setSelectedSchedules([]);
    } else {
      setSelectedSchedules(filteredSchedules.map(schedule => schedule.id));
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
      notes: '',
      // Session-based scheduling
      morningSession: {
        available: true,
        start_time: '09:00',
        end_time: '13:00',
        maxPatients: 10
      },
      afternoonSession: {
        available: true,
        start_time: '14:00',
        end_time: '18:00',
        maxPatients: 10
      },
      // New enhanced features
      consultationTypes: {
        opd: true,
        video: false
      },
      repeatOption: 'none',
      repeatDays: [],
      repeatEndDate: '',
      slotDurationOptions: [10, 15, 30, 45, 60]
    });
  };

  const resetBulkForm = () => {
    setBulkForm({
      startDate: '',
      endDate: '',
      skipWeekends: true,
      scheduleTemplate: {
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
        consultationTypes: {
          opd: true,
          video: false
        },
        morningSession: {
          available: true,
          start_time: '09:00',
          end_time: '13:00',
          maxPatients: 10
        },
        afternoonSession: {
          available: true,
          start_time: '14:00',
          end_time: '18:00',
          maxPatients: 10
        }
      }
    });
  };

  const resetBulkDeleteForm = () => {
    setBulkDeleteForm({
      startDate: '',
      endDate: '',
      deleteType: 'range'
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
      notes: schedule.notes || '',
      // Session-based scheduling
      morningSession: schedule.morning_session || {
        available: true,
        start_time: '09:00',
        end_time: '13:00',
        maxPatients: 10
      },
      afternoonSession: schedule.afternoon_session || {
        available: true,
        start_time: '14:00',
        end_time: '18:00',
        maxPatients: 10
      },
      // New enhanced features
      consultationTypes: schedule.consultationTypes || {
        opd: true,
        video: false
      },
      repeatOption: schedule.repeatOption || 'none',
      repeatDays: schedule.repeatDays || [],
      repeatEndDate: schedule.repeatEndDate || '',
      slotDurationOptions: [10, 15, 30, 45, 60]
    });
    setShowAddModal(true);
  };

  // Filter schedules based on status and date range
  const getFilteredSchedules = () => {
    let filtered = schedules;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(schedule => {
        if (filterStatus === 'available') return schedule.isAvailable;
        if (filterStatus === 'full') return schedule.isAvailable && false; // TODO: Implement full logic
        if (filterStatus === 'leave') return !schedule.isAvailable;
        return true;
      });
    }

    // Filter by date range
    if (dateRange.start) {
      filtered = filtered.filter(schedule => 
        new Date(schedule.date) >= new Date(dateRange.start)
      );
    }
    if (dateRange.end) {
      filtered = filtered.filter(schedule => 
        new Date(schedule.date) <= new Date(dateRange.end)
      );
    }

    return filtered;
  };

  if (loading && !selectedDoctor) {
    return <div className="p-6">Loading doctors...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Doctor Schedule Management</h2>
      </div>

      {/* Enhanced Doctor Selection with Department Filter */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 lg:mb-0">Doctor Schedule Management</h3>
          
          {/* Department Filter */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <HiFilter className="h-5 w-5 text-gray-500" />
              <label className="text-sm font-medium text-gray-700">Filter by Department:</label>
            </div>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept.name}>
                  {dept.name}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                setSelectedDepartment('');
                setSelectedDoctor(null);
                setSchedules([]);
                setFilterStatus('all');
                setDateRange({ start: '', end: '' });
                setSelectedSchedules([]);
              }}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1"
            >
              <HiRefresh className="h-4 w-4" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Doctor Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {getFilteredDoctors().map((doctor) => (
            <div
              key={doctor._id}
              onClick={() => setSelectedDoctor({ id: doctor._id, name: doctor.name })}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                selectedDoctor?.id === doctor._id
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-gray-900 text-sm">{doctor.name}</h4>
                {selectedDoctor?.id === doctor._id && (
                  <HiCheck className="h-5 w-5 text-blue-600" />
                )}
              </div>
              <p className="text-xs text-gray-600 mb-1">
                {doctor.doctor_info?.department?.name || 'No Department'}
              </p>
              <p className="text-xs text-gray-500 mb-2">
                {doctor.doctor_info?.specialization || 'No Specialization'}
              </p>
              <div className="flex items-center justify-between text-xs">
                <span className={`px-2 py-1 rounded-full ${
                  doctor.doctor_info?.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {doctor.doctor_info?.status || 'active'}
                </span>
                <span className="text-gray-500">
                  {doctor.doctor_info?.experience_years || 0}y exp
                </span>
              </div>
            </div>
          ))}
        </div>

        {getFilteredDoctors().length === 0 && (
          <div className="text-center py-8">
            <HiCalendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No doctors found</h3>
            <p className="text-gray-500">
              {selectedDepartment 
                ? `No doctors found in ${selectedDepartment} department.`
                : 'No doctors available. Please add doctors first.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Enhanced Schedule Management */}
      {selectedDoctor && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Schedule for Dr. {selectedDoctor.name}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Manage working hours, availability, and time slots
              </p>
            </div>
            
            {/* Schedule Filters and View Options */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mt-4 lg:mt-0">
              {/* Status Filter */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Status:</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All</option>
                  <option value="available">Available</option>
                  <option value="full">Full</option>
                  <option value="leave">On Leave</option>
                </select>
              </div>
              
              {/* Date Range Filter */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">From:</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <label className="text-sm font-medium text-gray-700">To:</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {/* View Mode Toggle */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium ${
                    viewMode === 'list' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <HiEye className="h-4 w-4 inline mr-1" />
                  List
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium ${
                    viewMode === 'calendar' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <HiCalendar className="h-4 w-4 inline mr-1" />
                  Calendar
                </button>
              </div>
            </div>
          </div>
          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
              {selectedSchedules.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 flex items-center space-x-2">
                <span className="text-sm text-blue-700 font-medium">
                    {selectedSchedules.length} selected
                  </span>
                  <button
                    onClick={() => setShowBulkDeleteModal(true)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Delete Selected
                  </button>
                  <button
                    onClick={() => setSelectedSchedules([])}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <HiX className="h-4 w-4" />
                  </button>
                </div>
              )}
            
              <button
                onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
              >
                <HiPlus className="h-4 w-4" />
                <span>Add Schedule</span>
              </button>
            
              <button
                onClick={() => setShowBulkModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2 transition-colors"
              >
                <HiCalendar className="h-4 w-4" />
                <span>Bulk Create</span>
              </button>
            
              <button
                onClick={() => setShowBulkDeleteModal(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={selectedSchedules.length === 0}
              >
                <HiTrash className="h-4 w-4" />
                <span>Bulk Delete</span>
              </button>
            
              <button
                onClick={() => {
                  const today = new Date();
                  const endDate = new Date();
                  endDate.setDate(today.getDate() + 30);
                  
                  setBulkForm(prev => ({
                    ...prev,
                    startDate: today.toISOString().split('T')[0],
                    endDate: endDate.toISOString().split('T')[0],
                    skipWeekends: true
                  }));
                  setShowBulkModal(true);
                }}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2 transition-colors"
              >
                <HiClock className="h-4 w-4" />
                <span>Quick Setup (30 days)</span>
              </button>
            
            <button
              onClick={() => fetchSchedules(selectedDoctor.id)}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2 transition-colors"
            >
              <HiRefresh className="h-4 w-4" />
              <span>Refresh</span>
              </button>
          </div>

          {/* Schedules List */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading schedules...</p>
            </div>
          ) : getFilteredSchedules().length === 0 ? (
            <div className="text-center py-12">
              <HiCalendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {schedules.length === 0 ? 'No schedules found' : 'No schedules match your filters'}
              </h3>
              <p className="text-gray-500 mb-4">
                {schedules.length === 0 
                  ? 'Create a schedule to get started.' 
                  : 'Try adjusting your filters or create a new schedule.'
                }
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Add Schedule
              </button>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {/* Table Header */}
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    {getFilteredSchedules().length} of {schedules.length} schedules
                    {(filterStatus !== 'all' || dateRange.start || dateRange.end) && (
                      <span className="ml-2 text-blue-600">(filtered)</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {selectedSchedules.length > 0 && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {selectedSchedules.length} selected
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Scrollable Table */}
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedSchedules.length === getFilteredSchedules().length && getFilteredSchedules().length > 0}
                          onChange={handleSelectAll}
                          className="rounded border-gray-300"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Day
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Morning
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Afternoon
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Capacity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getFilteredSchedules().map((schedule, index) => {
                      const scheduleDate = new Date(schedule.date);
                      const dayName = scheduleDate.toLocaleDateString('en-US', { weekday: 'short' });
                      const isToday = scheduleDate.toDateString() === new Date().toDateString();
                      const isPast = scheduleDate < new Date().setHours(0, 0, 0, 0);
                      
                      return (
                        <tr key={schedule.id} className={`${isToday ? 'bg-blue-50' : isPast ? 'bg-gray-50' : 'hover:bg-gray-50'} transition-colors`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedSchedules.includes(schedule.id)}
                              onChange={(e) => handleScheduleSelect(schedule.id, e.target.checked)}
                              className="rounded border-gray-300"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex flex-col">
                              <span className={`font-medium ${isToday ? 'text-blue-600' : ''}`}>
                                {scheduleDate.toLocaleDateString()}
                              </span>
                              {isToday && <span className="text-xs text-blue-500">Today</span>}
                              {isPast && <span className="text-xs text-gray-400">Past</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {dayName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              schedule.isAvailable
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {schedule.isAvailable ? (
                                <>
                                  <HiCheck className="h-3 w-3 mr-1" />
                                  Available
                                </>
                              ) : (
                                <>
                                  <HiX className="h-3 w-3 mr-1" />
                                  On Leave
                                </>
                              )}
                            </span>
                            {schedule.leaveReason && (
                              <div className="text-xs text-gray-500 mt-1">
                                {schedule.leaveReason}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex flex-col">
                        <span className={`font-medium ${schedule.morningSession?.available !== false ? 'text-green-600' : 'text-red-600'}`}>
                          {schedule.morningSession?.available !== false ? 'Available' : 'Unavailable'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {schedule.morningSession?.start_time || '09:00'} - {schedule.morningSession?.end_time || '13:00'}
                        </span>
                      </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex flex-col">
                        <span className={`font-medium ${schedule.afternoonSession?.available !== false ? 'text-green-600' : 'text-red-600'}`}>
                          {schedule.afternoonSession?.available !== false ? 'Available' : 'Unavailable'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {schedule.afternoonSession?.start_time || '14:00'} - {schedule.afternoonSession?.end_time || '18:00'}
                        </span>
                      </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900">
                                {((schedule.morningSession?.max_patients ?? 0) + (schedule.afternoonSession?.max_patients ?? 0))} total
                            </span>
                              <div className="text-xs text-gray-500">
                                <div>Morning: {schedule.morningSession?.max_patients ?? 0}</div>
                                <div>Afternoon: {schedule.afternoonSession?.max_patients ?? 0}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => openEditModal(schedule)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-100"
                              title="Edit schedule"
                            >
                              <HiPencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSchedule(schedule.id)}
                              className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-100"
                              title="Delete schedule"
                            >
                              <HiTrash className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Enhanced Add/Edit Schedule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-8 mx-auto p-6 md:p-8 w-[800px] max-w-full rounded-xl bg-white shadow-xl border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-gray-900">
              {editingSchedule ? 'Edit Schedule' : 'Add Schedule'}
            </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingSchedule(null);
                  resetScheduleForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <HiX className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Date and Repeat Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-800">Date</label>
                <input
                  type="date"
                  value={scheduleForm.date}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, date: e.target.value }))}
                  min={todayStr}
                    className="mt-2 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-800">Repeat Option</label>
                  <select
                    value={scheduleForm.repeatOption}
                    onChange={(e) => setScheduleForm(prev => ({ ...prev, repeatOption: e.target.value }))}
                    className="mt-2 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="none">One-time</option>
                    <option value="weekly">Weekly repeat</option>
                    <option value="monthly">Monthly repeat</option>
                  </select>
                </div>
              </div>

              {/* Weekly Repeat Days */}
              {scheduleForm.repeatOption === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">Repeat on Days</label>
                  <div className="flex flex-wrap gap-2">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                      <label key={day} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={scheduleForm.repeatDays.includes(day)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setScheduleForm(prev => ({
                                ...prev,
                                repeatDays: [...prev.repeatDays, day]
                              }));
                            } else {
                              setScheduleForm(prev => ({
                                ...prev,
                                repeatDays: prev.repeatDays.filter(d => d !== day)
                              }));
                            }
                          }}
                          className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{day}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Repeat End Date */}
              {(scheduleForm.repeatOption === 'weekly' || scheduleForm.repeatOption === 'monthly') && (
                <div>
                  <label className="block text-sm font-medium text-gray-800">Repeat Until</label>
                  <input
                    type="date"
                    value={scheduleForm.repeatEndDate}
                    onChange={(e) => setScheduleForm(prev => ({ ...prev, repeatEndDate: e.target.value }))}
                    min={scheduleForm.date}
                    className="mt-2 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}

              {/* Consultation Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">Consultation Types</label>
                <div className="flex space-x-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={scheduleForm.consultationTypes.opd}
                      onChange={(e) => setScheduleForm(prev => ({
                        ...prev,
                        consultationTypes: { ...prev.consultationTypes, opd: e.target.checked }
                      }))}
                      className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">OPD Slots</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={scheduleForm.consultationTypes.video}
                      onChange={(e) => setScheduleForm(prev => ({
                        ...prev,
                        consultationTypes: { ...prev.consultationTypes, video: e.target.checked }
                      }))}
                      className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Video Consultation Slots</span>
                  </label>
                </div>
              </div>

              {/* Slot Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-800">Slot Duration (minutes)</label>
                <select
                  value={scheduleForm.slotDuration}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, slotDuration: parseInt(e.target.value) }))}
                  className="mt-2 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {scheduleForm.slotDurationOptions.map(duration => (
                    <option key={duration} value={duration}>{duration} minutes</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Auto-divides time slots based on selected duration
                </p>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={scheduleForm.isAvailable}
                    onChange={(e) => setScheduleForm(prev => ({ ...prev, isAvailable: e.target.checked }))}
                    className="mr-2 h-4 w-4 rounded border-gray-300 text-black focus:ring-black/20"
                  />
                  <span className="text-sm text-gray-800">Available</span>
                </label>
              </div>

              {scheduleForm.isAvailable && (
                <>
                  {/* Morning Session */}
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 md:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-base font-semibold text-gray-900">Morning Session</h4>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={scheduleForm.morningSession.available}
                          onChange={(e) => setScheduleForm(prev => ({
                            ...prev,
                            morningSession: { ...prev.morningSession, available: e.target.checked }
                          }))}
                          className="mr-2 h-4 w-4 rounded border-gray-300 text-black focus:ring-black/20"
                        />
                        <span className="text-sm text-gray-800">Available</span>
                      </label>
                    </div>
                    
                    {scheduleForm.morningSession.available && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-800">Start Time</label>
                          <input
                            type="time"
                            value={scheduleForm.morningSession.start_time}
                            onChange={(e) => setScheduleForm(prev => ({
                              ...prev,
                              morningSession: { ...prev.morningSession, start_time: e.target.value }
                            }))}
                            className="mt-2 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black/20"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-800">End Time</label>
                          <input
                            type="time"
                            value={scheduleForm.morningSession.end_time}
                            onChange={(e) => setScheduleForm(prev => ({
                              ...prev,
                              morningSession: { ...prev.morningSession, end_time: e.target.value }
                            }))}
                            className="mt-2 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black/20"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-800">Max Patients</label>
                          <input
                            type="number"
                            value={scheduleForm.morningSession.maxPatients}
                            onChange={(e) => setScheduleForm(prev => ({
                              ...prev,
                              morningSession: { ...prev.morningSession, maxPatients: parseInt(e.target.value) }
                            }))}
                            className="mt-2 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black/20"
                            min="1"
                            max="50"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Afternoon Session */}
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 md:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-base font-semibold text-gray-900">Afternoon Session</h4>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={scheduleForm.afternoonSession.available}
                          onChange={(e) => setScheduleForm(prev => ({
                            ...prev,
                            afternoonSession: { ...prev.afternoonSession, available: e.target.checked }
                          }))}
                          className="mr-2 h-4 w-4 rounded border-gray-300 text-black focus:ring-black/20"
                        />
                        <span className="text-sm text-gray-800">Available</span>
                      </label>
                    </div>
                    
                    {scheduleForm.afternoonSession.available && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-800">Start Time</label>
                          <input
                            type="time"
                            value={scheduleForm.afternoonSession.start_time}
                            onChange={(e) => setScheduleForm(prev => ({
                              ...prev,
                              afternoonSession: { ...prev.afternoonSession, start_time: e.target.value }
                            }))}
                            className="mt-2 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black/20"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-800">End Time</label>
                          <input
                            type="time"
                            value={scheduleForm.afternoonSession.end_time}
                            onChange={(e) => setScheduleForm(prev => ({
                              ...prev,
                              afternoonSession: { ...prev.afternoonSession, end_time: e.target.value }
                            }))}
                            className="mt-2 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black/20"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-800">Max Patients</label>
                          <input
                            type="number"
                            value={scheduleForm.afternoonSession.maxPatients}
                            onChange={(e) => setScheduleForm(prev => ({
                              ...prev,
                              afternoonSession: { ...prev.afternoonSession, maxPatients: parseInt(e.target.value) }
                            }))}
                            className="mt-2 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black/20"
                            min="1"
                            max="50"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Simplified: Legacy fields removed to keep only relevant schedule inputs */}
                </>
              )}

              {!scheduleForm.isAvailable && (
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
                <label className="block text-sm font-medium text-gray-800">Notes</label>
                <textarea
                  value={scheduleForm.notes}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="mt-2 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black/20"
                  rows={4}
                  placeholder="Additional notes (optional)"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-8">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingSchedule(null);
                  resetScheduleForm();
                }}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSchedule}
                className="px-5 py-2.5 bg-black text-white rounded-lg hover:bg-gray-900 shadow-sm"
              >
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Bulk Create Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-8 mx-auto p-6 md:p-8 w-[900px] max-w-full rounded-xl bg-white shadow-xl border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-semibold text-gray-900">Bulk Create Schedules</h3>
                <p className="text-sm text-gray-500 mt-1">Create multiple schedules for Dr. {selectedDoctor?.name}</p>
              </div>
              <button
                onClick={() => {
                  setShowBulkModal(false);
                  resetBulkForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <HiX className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Date Range Section */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <HiCalendar className="h-5 w-5 mr-2 text-blue-600" />
                  Date Range
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={bulkForm.startDate}
                    onChange={(e) => setBulkForm(prev => ({ ...prev, startDate: e.target.value }))}
                      min={todayStr}
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">End Date</label>
                  <input
                    type="date"
                    value={bulkForm.endDate}
                    onChange={(e) => setBulkForm(prev => ({ ...prev, endDate: e.target.value }))}
                      min={bulkForm.startDate || todayStr}
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

                <div className="mt-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={bulkForm.skipWeekends}
                    onChange={(e) => setBulkForm(prev => ({ ...prev, skipWeekends: e.target.checked }))}
                      className="mr-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                    <span className="text-sm font-medium text-gray-800">Skip Weekends (Saturday & Sunday)</span>
                </label>
                  <p className="text-xs text-gray-500 mt-1 ml-7">Only create schedules for weekdays</p>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="bg-blue-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <HiClock className="h-5 w-5 mr-2 text-blue-600" />
                  Quick Presets
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    onClick={() => {
                      const today = new Date();
                      const endDate = new Date();
                      endDate.setDate(today.getDate() + 7);
                      setBulkForm(prev => ({
                        ...prev,
                        startDate: today.toISOString().split('T')[0],
                        endDate: endDate.toISOString().split('T')[0]
                      }));
                    }}
                    className="p-3 text-sm font-medium text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    1 Week
                  </button>
                  <button
                    onClick={() => {
                      const today = new Date();
                      const endDate = new Date();
                      endDate.setDate(today.getDate() + 14);
                      setBulkForm(prev => ({
                        ...prev,
                        startDate: today.toISOString().split('T')[0],
                        endDate: endDate.toISOString().split('T')[0]
                      }));
                    }}
                    className="p-3 text-sm font-medium text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    2 Weeks
                  </button>
                  <button
                    onClick={() => {
                      const today = new Date();
                      const endDate = new Date();
                      endDate.setDate(today.getDate() + 30);
                      setBulkForm(prev => ({
                        ...prev,
                        startDate: today.toISOString().split('T')[0],
                        endDate: endDate.toISOString().split('T')[0]
                      }));
                    }}
                    className="p-3 text-sm font-medium text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    1 Month
                  </button>
                  <button
                    onClick={() => {
                      const today = new Date();
                      const endDate = new Date();
                      endDate.setDate(today.getDate() + 90);
                      setBulkForm(prev => ({
                        ...prev,
                        startDate: today.toISOString().split('T')[0],
                        endDate: endDate.toISOString().split('T')[0]
                      }));
                    }}
                    className="p-3 text-sm font-medium text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    3 Months
                  </button>
                </div>
              </div>

              {/* Schedule Template Configuration */}
              <div className="bg-green-50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <HiCog className="h-5 w-5 mr-2 text-green-600" />
                  Schedule Template
                </h4>
                
                {/* Consultation Types */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-800 mb-3">Consultation Types</label>
                  <div className="flex space-x-6">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={bulkForm.scheduleTemplate.consultationTypes?.opd || true}
                        onChange={(e) => setBulkForm(prev => ({
                          ...prev,
                          scheduleTemplate: {
                            ...prev.scheduleTemplate,
                            consultationTypes: { 
                              ...prev.scheduleTemplate.consultationTypes, 
                              opd: e.target.checked 
                            }
                          }
                        }))}
                        className="mr-2 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-700">OPD Slots</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={bulkForm.scheduleTemplate.consultationTypes?.video || false}
                        onChange={(e) => setBulkForm(prev => ({
                          ...prev,
                          scheduleTemplate: {
                            ...prev.scheduleTemplate,
                            consultationTypes: { 
                              ...prev.scheduleTemplate.consultationTypes, 
                              video: e.target.checked 
                            }
                          }
                        }))}
                        className="mr-2 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-700">Video Consultation</span>
                    </label>
                  </div>
                </div>

                {/* Slot Duration */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-800 mb-2">Slot Duration (minutes)</label>
                  <select
                    value={bulkForm.scheduleTemplate.slotDuration || 30}
                    onChange={(e) => setBulkForm(prev => ({
                      ...prev,
                      scheduleTemplate: {
                        ...prev.scheduleTemplate,
                        slotDuration: parseInt(e.target.value)
                      }
                    }))}
                    className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value={10}>10 minutes</option>
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                  </select>
                </div>
              </div>

              {/* Morning Session Template */}
              <div className="bg-orange-50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                    <HiClock className="h-5 w-5 mr-2 text-orange-600" />
                    Morning Session
                  </h4>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={bulkForm.scheduleTemplate.morningSession?.available || true}
                      onChange={(e) => setBulkForm(prev => ({
                        ...prev,
                        scheduleTemplate: {
                          ...prev.scheduleTemplate,
                          morningSession: { 
                            ...prev.scheduleTemplate.morningSession, 
                            available: e.target.checked 
                          }
                        }
                      }))}
                      className="mr-2 h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm font-medium text-gray-800">Available</span>
                  </label>
                </div>
                
                {bulkForm.scheduleTemplate.morningSession?.available && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">Start Time</label>
                    <input
                      type="time"
                      value={bulkForm.scheduleTemplate.morningSession?.start_time || '09:00'}
                      onChange={(e) => setBulkForm(prev => ({
                        ...prev,
                        scheduleTemplate: {
                          ...prev.scheduleTemplate,
                          morningSession: { 
                            ...prev.scheduleTemplate.morningSession, 
                            start_time: e.target.value 
                          }
                        }
                      }))}
                        className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">End Time</label>
                    <input
                      type="time"
                      value={bulkForm.scheduleTemplate.morningSession?.end_time || '13:00'}
                      onChange={(e) => setBulkForm(prev => ({
                        ...prev,
                        scheduleTemplate: {
                          ...prev.scheduleTemplate,
                          morningSession: { 
                            ...prev.scheduleTemplate.morningSession, 
                            end_time: e.target.value 
                          }
                        }
                      }))}
                        className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">Max Patients</label>
                    <input
                      type="number"
                      value={bulkForm.scheduleTemplate.morningSession?.maxPatients || 10}
                      onChange={(e) => setBulkForm(prev => ({
                        ...prev,
                        scheduleTemplate: {
                          ...prev.scheduleTemplate,
                          morningSession: { 
                            ...prev.scheduleTemplate.morningSession, 
                            maxPatients: parseInt(e.target.value) 
                          }
                        }
                      }))}
                        className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      min="1"
                      max="50"
                    />
                  </div>
                </div>
                )}
              </div>

              {/* Afternoon Session Template */}
              <div className="bg-purple-50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                    <HiClock className="h-5 w-5 mr-2 text-purple-600" />
                    Afternoon Session
                  </h4>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={bulkForm.scheduleTemplate.afternoonSession?.available || true}
                      onChange={(e) => setBulkForm(prev => ({
                        ...prev,
                        scheduleTemplate: {
                          ...prev.scheduleTemplate,
                          afternoonSession: { 
                            ...prev.scheduleTemplate.afternoonSession, 
                            available: e.target.checked 
                          }
                        }
                      }))}
                      className="mr-2 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-800">Available</span>
                  </label>
                </div>
                
                {bulkForm.scheduleTemplate.afternoonSession?.available && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">Start Time</label>
                    <input
                      type="time"
                      value={bulkForm.scheduleTemplate.afternoonSession?.start_time || '14:00'}
                      onChange={(e) => setBulkForm(prev => ({
                        ...prev,
                        scheduleTemplate: {
                          ...prev.scheduleTemplate,
                          afternoonSession: { 
                            ...prev.scheduleTemplate.afternoonSession, 
                            start_time: e.target.value 
                          }
                        }
                      }))}
                        className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">End Time</label>
                    <input
                      type="time"
                      value={bulkForm.scheduleTemplate.afternoonSession?.end_time || '18:00'}
                      onChange={(e) => setBulkForm(prev => ({
                        ...prev,
                        scheduleTemplate: {
                          ...prev.scheduleTemplate,
                          afternoonSession: { 
                            ...prev.scheduleTemplate.afternoonSession, 
                            end_time: e.target.value 
                          }
                        }
                      }))}
                        className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">Max Patients</label>
                    <input
                      type="number"
                      value={bulkForm.scheduleTemplate.afternoonSession?.maxPatients || 10}
                      onChange={(e) => setBulkForm(prev => ({
                        ...prev,
                        scheduleTemplate: {
                          ...prev.scheduleTemplate,
                          afternoonSession: { 
                            ...prev.scheduleTemplate.afternoonSession, 
                            maxPatients: parseInt(e.target.value) 
                          }
                        }
                      }))}
                        className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      min="1"
                      max="50"
                    />
                  </div>
                </div>
                )}
              </div>
              
              {/* Preview Section */}
              {bulkForm.startDate && bulkForm.endDate && (
                <div className="bg-yellow-50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <HiEye className="h-5 w-5 mr-2 text-yellow-600" />
                    Preview
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-800">Date Range:</span>
                      <p className="text-gray-600">
                        {new Date(bulkForm.startDate).toLocaleDateString()} - {new Date(bulkForm.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-800">Total Days:</span>
                      <p className="text-gray-600">
                        {(() => {
                          const start = new Date(bulkForm.startDate);
                          const end = new Date(bulkForm.endDate);
                          let count = 0;
                          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                            if (!bulkForm.skipWeekends || (d.getDay() !== 0 && d.getDay() !== 6)) {
                              count++;
                            }
                          }
                          return count;
                        })()} days
                        {bulkForm.skipWeekends && ' (weekdays only)'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-800">Sessions:</span>
                      <p className="text-gray-600">
                        {bulkForm.scheduleTemplate.morningSession?.available ? 'Morning' : ''}
                        {bulkForm.scheduleTemplate.morningSession?.available && bulkForm.scheduleTemplate.afternoonSession?.available ? ' + ' : ''}
                        {bulkForm.scheduleTemplate.afternoonSession?.available ? 'Afternoon' : ''}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                {bulkForm.startDate && bulkForm.endDate && (
                  <span>
                    This will create schedules for {(() => {
                      const start = new Date(bulkForm.startDate);
                      const end = new Date(bulkForm.endDate);
                      let count = 0;
                      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                        if (!bulkForm.skipWeekends || (d.getDay() !== 0 && d.getDay() !== 6)) {
                          count++;
                        }
                      }
                      return count;
                    })()} days
                  </span>
                )}
              </div>
              <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowBulkModal(false);
                  resetBulkForm();
                }}
                  className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkCreate}
                  disabled={!bulkForm.startDate || !bulkForm.endDate}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                  <HiCalendar className="h-4 w-4" />
                  <span>Create Schedules</span>
              </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Bulk Delete Schedules</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Delete Type</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="range"
                      checked={bulkDeleteForm.deleteType === 'range'}
                      onChange={(e) => setBulkDeleteForm(prev => ({ ...prev, deleteType: e.target.value }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Delete by Date Range</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="selected"
                      checked={bulkDeleteForm.deleteType === 'selected'}
                      onChange={(e) => setBulkDeleteForm(prev => ({ ...prev, deleteType: e.target.value }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Delete Selected Schedules ({selectedSchedules.length} selected)</span>
                  </label>
                </div>
              </div>

              {bulkDeleteForm.deleteType === 'range' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Date</label>
                    <input
                      type="date"
                      value={bulkDeleteForm.startDate}
                      onChange={(e) => setBulkDeleteForm(prev => ({ ...prev, startDate: e.target.value }))}
                      min={todayStr}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">End Date</label>
                    <input
                      type="date"
                      value={bulkDeleteForm.endDate}
                      onChange={(e) => setBulkDeleteForm(prev => ({ ...prev, endDate: e.target.value }))}
                      min={bulkDeleteForm.startDate || todayStr}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>
              )}

              {bulkDeleteForm.deleteType === 'selected' && selectedSchedules.length === 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">No schedules selected. Please select schedules from the table above.</p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowBulkDeleteModal(false);
                  resetBulkDeleteForm();
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete Schedules
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
