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
  HiDocumentText
} from 'react-icons/hi';
import DoctorSidebar from '../../Components/Doctor/Sidebar';

export default function DoctorLeaveRequestsPage() {
  const navigate = useNavigate();
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ date: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    checkDoctorAuth();
  }, []);

  useEffect(() => {
    if (loading) {
      fetchLeaveRequests();
    }
  }, [loading]);

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

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        'http://localhost:5001/api/doctor/leave-requests',
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLeaveRequests(response.data.leaves || []);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      alert('Error fetching leave requests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitLeaveRequest = async () => {
    if (!leaveForm.date) {
      alert('Please select a date');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5001/api/doctor/leave-requests',
        { date: leaveForm.date, reason: leaveForm.reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setShowRequestModal(false);
      setLeaveForm({ date: '', reason: '' });
      fetchLeaveRequests();
      alert('Leave request submitted successfully!');
    } catch (error) {
      console.error('Error submitting leave request:', error);
      alert('Error submitting leave request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <HiCheck className="h-4 w-4" />;
      case 'rejected':
        return <HiX className="h-4 w-4" />;
      case 'pending':
      default:
        return <HiClock className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <DoctorSidebar />
      
      <div className="flex-1 ml-64 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Leave Requests</h1>
                <p className="text-gray-600 mt-2">Manage your leave requests and view their status</p>
              </div>
              <button
                onClick={() => setShowRequestModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <HiPlus className="h-5 w-5 mr-2" />
                Request Leave
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex items-center">
                <HiClock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-yellow-800">Pending</p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {leaveRequests.filter(lr => lr.status === 'pending').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center">
                <HiCheck className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-green-800">Approved</p>
                  <p className="text-2xl font-bold text-green-900">
                    {leaveRequests.filter(lr => lr.status === 'approved').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center">
                <HiX className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-red-800">Rejected</p>
                  <p className="text-2xl font-bold text-red-900">
                    {leaveRequests.filter(lr => lr.status === 'rejected').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Leave Requests Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Your Leave Requests</h3>
            </div>
            
            {loading ? (
              <div className="px-6 py-12 text-center">
                <div className="inline-flex items-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading leave requests...</span>
                </div>
              </div>
            ) : leaveRequests.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <HiCalendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No leave requests</h3>
                <p className="mt-1 text-sm text-gray-500">
                  You haven't submitted any leave requests yet.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => setShowRequestModal(true)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <HiPlus className="h-5 w-5 mr-2" />
                    Submit Your First Request
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin Comment</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {leaveRequests.map((lr) => (
                      <tr key={lr._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {new Date(lr.date).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(lr.date).toLocaleDateString('en-US', { weekday: 'long' })}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs">
                            {lr.reason || 'No reason provided'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(lr.status)}`}>
                            {getStatusIcon(lr.status)}
                            <span className="ml-1">{lr.status.charAt(0).toUpperCase() + lr.status.slice(1)}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs">
                            {lr.admin_comment || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(lr.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Leave Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-blue-100 rounded-full">
                <HiCalendar className="h-6 w-6 text-blue-600" />
              </div>
              <div className="mt-2 text-center">
                <h3 className="text-lg font-medium text-gray-900">Request Leave</h3>
                <div className="mt-4">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Leave Date *
                    </label>
                    <input
                      type="date"
                      value={leaveForm.date}
                      onChange={(e) => setLeaveForm(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason
                    </label>
                    <textarea
                      value={leaveForm.reason}
                      onChange={(e) => setLeaveForm(prev => ({ ...prev, reason: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Medical leave, Vacation, Personal reasons..."
                    />
                  </div>
                  <div className="text-xs text-gray-500 mb-4">
                    Your request will be reviewed by the admin. If approved, bookings for that date will be disabled and existing appointments cancelled.
                  </div>
                </div>
              </div>
              <div className="items-center px-4 py-3">
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowRequestModal(false);
                      setLeaveForm({ date: '', reason: '' });
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitLeaveRequest}
                    disabled={submitting}
                    className="px-4 py-2 bg-blue-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </div>
                    ) : (
                      'Submit Request'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}