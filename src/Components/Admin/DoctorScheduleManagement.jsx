import { useState, useEffect } from 'react';
import { HiCalendar, HiClock, HiPlus, HiPencil, HiTrash, HiCheck, HiX } from 'react-icons/hi';
import axios from 'axios';

export default function DoctorScheduleManagement() {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
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
      maxPatientsPerSlot: 1
    }
  });

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (selectedDoctor) {
      fetchSchedules(selectedDoctor._id);
    }
  }, [selectedDoctor]);

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/api/admin/doctors', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDoctors(response.data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedules = async (doctorId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5001/api/admin/doctor-schedules/${doctorId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSchedules(response.data.schedules || []);
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
      const url = `http://localhost:5001/api/admin/doctor-schedules/${selectedDoctor._id}`;
      
      await axios.post(url, scheduleForm, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setShowAddModal(false);
      setEditingSchedule(null);
      resetScheduleForm();
      fetchSchedules(selectedDoctor._id);
      alert('Schedule saved successfully!');
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('Error saving schedule: ' + (error.response?.data?.message || 'Unknown error'));
    }
  };

  const handleBulkCreate = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5001/api/admin/doctor-schedules/${selectedDoctor._id}/bulk`,
        bulkForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowBulkModal(false);
      resetBulkForm();
      fetchSchedules(selectedDoctor._id);
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
        await axios.delete(`http://localhost:5001/api/admin/doctor-schedules/${scheduleId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchSchedules(selectedDoctor._id);
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
        maxPatientsPerSlot: 1
      }
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
    setShowAddModal(true);
  };

  if (loading && !selectedDoctor) {
    return <div className="p-6">Loading doctors...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Doctor Schedule Management</h2>
      </div>

      {/* Doctor Selection */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Doctor</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctors.map((doctor) => (
            <div
              key={doctor._id}
              onClick={() => setSelectedDoctor({ id: doctor._id, name: doctor.name })}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedDoctor?.id === doctor._id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <h4 className="font-semibold text-gray-900">{doctor.name}</h4>
              <p className="text-sm text-gray-600">
                {doctor.doctor_info?.department?.name || 'No Department'}
              </p>
              <p className="text-sm text-gray-500">
                {doctor.doctor_info?.specialization || 'No Specialization'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Schedule Management */}
      {selectedDoctor && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Schedule for Dr. {selectedDoctor.name}
            </h3>
            <div className="space-x-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <HiPlus className="h-4 w-4" />
                <span>Add Schedule</span>
              </button>
              <button
                onClick={() => setShowBulkModal(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
              >
                <HiCalendar className="h-4 w-4" />
                <span>Bulk Create</span>
              </button>
            </div>
          </div>

          {/* Schedules List */}
          {loading ? (
            <div className="text-center py-8">Loading schedules...</div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No schedules found. Create a schedule to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Working Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Break Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Slot Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {schedules.map((schedule) => (
                    <tr key={schedule.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(schedule.date).toLocaleDateString()}
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
                              Unavailable
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {schedule.workingHours.start_time} - {schedule.workingHours.end_time}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {schedule.breakTime.start_time} - {schedule.breakTime.end_time}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {schedule.slotDuration} min
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Schedule Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
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

              {scheduleForm.isAvailable && (
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
                    <input
                      type="number"
                      value={scheduleForm.slotDuration}
                      onChange={(e) => setScheduleForm(prev => ({ ...prev, slotDuration: parseInt(e.target.value) }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
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
                  setShowAddModal(false);
                  setEditingSchedule(null);
                  resetScheduleForm();
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
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

      {/* Bulk Create Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Bulk Create Schedules</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Date</label>
                  <input
                    type="date"
                    value={bulkForm.startDate}
                    onChange={(e) => setBulkForm(prev => ({ ...prev, startDate: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Date</label>
                  <input
                    type="date"
                    value={bulkForm.endDate}
                    onChange={(e) => setBulkForm(prev => ({ ...prev, endDate: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={bulkForm.skipWeekends}
                    onChange={(e) => setBulkForm(prev => ({ ...prev, skipWeekends: e.target.checked }))}
                    className="mr-2"
                  />
                  Skip Weekends
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Time</label>
                  <input
                    type="time"
                    value={bulkForm.scheduleTemplate.workingHours.start_time}
                    onChange={(e) => setBulkForm(prev => ({
                      ...prev,
                      scheduleTemplate: {
                        ...prev.scheduleTemplate,
                        workingHours: { ...prev.scheduleTemplate.workingHours, start_time: e.target.value }
                      }
                    }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Time</label>
                  <input
                    type="time"
                    value={bulkForm.scheduleTemplate.workingHours.end_time}
                    onChange={(e) => setBulkForm(prev => ({
                      ...prev,
                      scheduleTemplate: {
                        ...prev.scheduleTemplate,
                        workingHours: { ...prev.scheduleTemplate.workingHours, end_time: e.target.value }
                      }
                    }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowBulkModal(false);
                  resetBulkForm();
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkCreate}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Create Schedules
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}