import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  HiCalendar, 
  HiClock, 
  HiCheck, 
  HiX, 
  HiPlus, 
  HiExclamation,
  HiUser,
  HiDocumentText,
  HiRefresh,
  HiEye,
  HiTrash
} from 'react-icons/hi';
import DoctorSidebar from '../../Components/Doctor/Sidebar';
import { API_BASE_URL } from '../../config/api';

export default function DoctorLeaveRequestsPage() {
  const navigate = useNavigate();
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ 
    leave_type: 'full_day',
    start_date: '', 
    end_date: '',
    session: 'morning',
    reason: '' 
  });
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected

  useEffect(() => {
    checkDoctorAuth();
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchLeaveRequests();
    }
  }, [loading, filter]);

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
    setLoading(false);
  };

  const fetchLeaveRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = filter === 'all' 
        ? `${API_BASE_URL}/api/doctor/leave-requests`
        : `${API_BASE_URL}/api/doctor/leave-requests?status=${filter}`;
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeaveRequests(response.data.leaveRequests || []);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      alert('Error fetching leave requests. Please try again.');
    }
  };

  const handleSubmitLeaveRequest = async () => {
    if (!leaveForm.start_date) {
      alert('Please select a start date');
      return;
    }

    if (leaveForm.leave_type === 'full_day' && !leaveForm.end_date) {
      alert('Please select an end date for full day leave');
      return;
    }

    if (leaveForm.leave_type === 'full_day' && new Date(leaveForm.start_date) > new Date(leaveForm.end_date)) {
      alert('End date must be after start date');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      const requestData = {
        leave_type: leaveForm.leave_type,
        start_date: leaveForm.start_date,
        end_date: leaveForm.leave_type === 'full_day' ? leaveForm.end_date : leaveForm.start_date,
        session: leaveForm.leave_type === 'half_day' ? leaveForm.session : 'morning',
        reason: leaveForm.reason
      };

      await axios.post(
        `${API_BASE_URL}/api/doctor/leave-requests`,
        requestData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setShowRequestModal(false);
      setLeaveForm({ 
        leave_type: 'full_day',
        start_date: '', 
        end_date: '',
        session: 'morning',
        reason: '' 
      });
      fetchLeaveRequests();
      alert('Leave request submitted successfully!');
    } catch (error) {
      console.error('Submit leave request error:', error);
      alert('Error submitting leave request: ' + (error.response?.data?.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelLeaveRequest = async (leaveId) => {
    if (!window.confirm('Are you sure you want to cancel this leave request?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_BASE_URL}/api/doctor/leave-requests/${leaveId}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchLeaveRequests();
      alert('Leave request cancelled successfully!');
    } catch (error) {
      console.error('Cancel leave request error:', error);
      alert('Error cancelling leave request');
    }
  };

  const getFilteredRequests = () => {
    if (filter === 'all') return leaveRequests;
    return leaveRequests.filter(request => request.status === filter);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <HiClock className="h-3 w-3 mr-1" />;
      case 'approved': return <HiCheck className="h-3 w-3 mr-1" />;
      case 'rejected': return <HiX className="h-3 w-3 mr-1" />;
      case 'cancelled': return <HiX className="h-3 w-3 mr-1" />;
      default: return null;
    }
  };

  const formatDateRange = (startDate, endDate, leaveType) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (leaveType === 'half_day') {
      return start.toLocaleDateString();
    }
    
    if (start.toDateString() === end.toDateString()) {
      return start.toLocaleDateString();
    }
    
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <DoctorSidebar />
        <div className="flex-1 ml-64 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DoctorSidebar />
      
      <div className="flex-1 ml-64">
          {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Leave Requests</h1>
                <p className="text-gray-600 mt-1">Manage your leave requests and view status</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setLeaveForm({ 
                      leave_type: 'full_day',
                      start_date: '', 
                      end_date: '',
                      session: 'morning',
                      reason: '' 
                    });
                    setShowRequestModal(true);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <HiPlus className="h-4 w-4" />
                  <span>Request Leave</span>
                </button>
              <button
                  onClick={fetchLeaveRequests}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2"
              >
                  <HiRefresh className="h-4 w-4" />
                  <span>Refresh</span>
              </button>
            </div>
          </div>
                </div>
              </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filter Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {[
                  { key: 'all', label: 'All Requests', count: leaveRequests.length },
                  { key: 'pending', label: 'Pending', count: leaveRequests.filter(r => r.status === 'pending').length },
                  { key: 'approved', label: 'Approved', count: leaveRequests.filter(r => r.status === 'approved').length },
                  { key: 'rejected', label: 'Rejected', count: leaveRequests.filter(r => r.status === 'rejected').length }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      filter === tab.key
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                    <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                      filter === tab.key
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Leave Requests List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {getFilteredRequests().length === 0 ? (
              <div className="text-center py-12">
                <HiCalendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No leave requests</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {filter === 'all' 
                    ? 'You haven\'t submitted any leave requests yet.'
                    : `No ${filter} leave requests found.`
                  }
                </p>
                {filter === 'all' && (
                <div className="mt-6">
                  <button
                    onClick={() => setShowRequestModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                      <HiPlus className="h-4 w-4 mr-2" />
                      Request Leave
                  </button>
                </div>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date(s)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reason
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Admin Comment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getFilteredRequests().map((request) => (
                      <tr key={request._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatDateRange(request.start_date, request.end_date, request.leave_type)}
                          </div>
                          {request.leave_type === 'half_day' && (
                            <div className="text-sm text-gray-500 capitalize">
                              {request.session} session
                          </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            request.leave_type === 'full_day' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {request.leave_type === 'full_day' ? 'Full Day' : 'Half Day'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {request.reason || 'No reason provided'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                            {getStatusIcon(request.status)}
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {request.admin_comment || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {request.status === 'pending' ? (
                            <button
                              onClick={() => handleCancelLeaveRequest(request._id)}
                              className="text-red-600 hover:text-red-900 flex items-center"
                            >
                              <HiTrash className="h-4 w-4 mr-1" />
                              Cancel
                            </button>
                          ) : (
                            <span className="text-gray-400">No actions</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Leave Request Modal */}
        {showRequestModal && (
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
            <div className="relative top-8 mx-auto p-6 md:p-8 w-[600px] max-w-full rounded-xl bg-white shadow-xl border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-semibold text-gray-900">Request Leave</h3>
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <HiX className="h-6 w-6" />
                </button>
      </div>

              <div className="space-y-6">
                {/* Leave Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-3">Leave Type</label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      leaveForm.leave_type === 'full_day' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        name="leave_type"
                        value="full_day"
                        checked={leaveForm.leave_type === 'full_day'}
                        onChange={(e) => setLeaveForm(prev => ({ ...prev, leave_type: e.target.value }))}
                        className="sr-only"
                      />
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                          leaveForm.leave_type === 'full_day' 
                            ? 'border-blue-500 bg-blue-500' 
                            : 'border-gray-300'
                        }`}>
                          {leaveForm.leave_type === 'full_day' && (
                            <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">Full Day</div>
                          <div className="text-sm text-gray-500">Entire day off</div>
                        </div>
                      </div>
                    </label>
                    
                    <label className={`relative flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      leaveForm.leave_type === 'half_day' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        name="leave_type"
                        value="half_day"
                        checked={leaveForm.leave_type === 'half_day'}
                        onChange={(e) => setLeaveForm(prev => ({ ...prev, leave_type: e.target.value }))}
                        className="sr-only"
                      />
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                          leaveForm.leave_type === 'half_day' 
                            ? 'border-blue-500 bg-blue-500' 
                            : 'border-gray-300'
                        }`}>
                          {leaveForm.leave_type === 'half_day' && (
                            <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">Half Day</div>
                          <div className="text-sm text-gray-500">Morning or afternoon only</div>
                        </div>
              </div>
                    </label>
                  </div>
                </div>

                {/* Date Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={leaveForm.start_date}
                      onChange={(e) => setLeaveForm(prev => ({ ...prev, start_date: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  {leaveForm.leave_type === 'full_day' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">End Date</label>
                      <input
                        type="date"
                        value={leaveForm.end_date}
                        onChange={(e) => setLeaveForm(prev => ({ ...prev, end_date: e.target.value }))}
                        min={leaveForm.start_date || new Date().toISOString().split('T')[0]}
                        className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  )}
                </div>

                {/* Session Selection (for half day) */}
                {leaveForm.leave_type === 'half_day' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-3">Session</label>
                    <div className="grid grid-cols-2 gap-4">
                      <label className={`relative flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        leaveForm.session === 'morning' 
                          ? 'border-orange-500 bg-orange-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <input
                          type="radio"
                          name="session"
                          value="morning"
                          checked={leaveForm.session === 'morning'}
                          onChange={(e) => setLeaveForm(prev => ({ ...prev, session: e.target.value }))}
                          className="sr-only"
                        />
                        <div className="flex items-center">
                          <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                            leaveForm.session === 'morning' 
                              ? 'border-orange-500 bg-orange-500' 
                              : 'border-gray-300'
                          }`}>
                            {leaveForm.session === 'morning' && (
                              <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">Morning</div>
                            <div className="text-sm text-gray-500">9:00 AM - 1:00 PM</div>
                          </div>
                        </div>
                      </label>
                      
                      <label className={`relative flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        leaveForm.session === 'afternoon' 
                          ? 'border-orange-500 bg-orange-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <input
                          type="radio"
                          name="session"
                          value="afternoon"
                          checked={leaveForm.session === 'afternoon'}
                          onChange={(e) => setLeaveForm(prev => ({ ...prev, session: e.target.value }))}
                          className="sr-only"
                        />
                        <div className="flex items-center">
                          <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                            leaveForm.session === 'afternoon' 
                              ? 'border-orange-500 bg-orange-500' 
                              : 'border-gray-300'
                          }`}>
                            {leaveForm.session === 'afternoon' && (
                              <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">Afternoon</div>
                            <div className="text-sm text-gray-500">2:00 PM - 6:00 PM</div>
                          </div>
                        </div>
                    </label>
                    </div>
                  </div>
                )}

                {/* Reason */}
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-2">Reason (Optional)</label>
                    <textarea
                      value={leaveForm.reason}
                      onChange={(e) => setLeaveForm(prev => ({ ...prev, reason: e.target.value }))}
                      rows={3}
                    className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Medical leave, Personal emergency, Vacation..."
                    />
                  </div>

                {/* Information Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex">
                    <HiExclamation className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Important Information:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Your request will be reviewed by the admin</li>
                        <li>If approved, your schedule will be automatically updated</li>
                        <li>Existing appointments will be cancelled and patients will be notified</li>
                        <li>You can cancel pending requests before admin approval</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
                  <button
                  onClick={() => setShowRequestModal(false)}
                  className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                  onClick={handleSubmitLeaveRequest}
                    disabled={submitting}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <HiCheck className="h-4 w-4" />
                      <span>Submit Request</span>
                    </>
                    )}
                  </button>
                </div>
              </div>
            </div>
        )}
          </div>
    </div>
  );
}
