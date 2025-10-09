import { useEffect, useState } from 'react';
import axios from 'axios';
import { HiCheck, HiX, HiClock, HiCalendar, HiUser, HiExclamation, HiEye, HiRefresh, HiFilter } from 'react-icons/hi';

export default function LeaveRequests() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [processing, setProcessing] = useState(null);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [actionType, setActionType] = useState('');
  const [adminComment, setAdminComment] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedLeaveDetails, setSelectedLeaveDetails] = useState(null);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5001/api/admin/leave-requests${filter ? `?status=${filter}` : ''}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLeaves(response.data.leaves || []);
    } catch (error) {
      console.error('Error fetching leaves:', error);
      alert('Error fetching leave requests. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeaves(); }, [filter]);

  const handleApprove = async (leave) => {
    setSelectedLeave(leave);
    setActionType('approve');
    setShowCommentModal(true);
  };

  const handleReject = async (leave) => {
    setSelectedLeave(leave);
    setActionType('reject');
    setShowCommentModal(true);
  };

  const confirmAction = async () => {
    if (!selectedLeave) return;
    
    try {
      setProcessing(selectedLeave._id);
      const token = localStorage.getItem('token');
      
      const endpoint = actionType === 'approve' 
        ? `http://localhost:5001/api/admin/leave-requests/${selectedLeave._id}/approve`
        : `http://localhost:5001/api/admin/leave-requests/${selectedLeave._id}/reject`;
      
      await axios.post(endpoint, 
        { admin_comment: adminComment }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert(`Leave request ${actionType}d successfully!`);
      fetchLeaves();
      setShowCommentModal(false);
      setAdminComment('');
      setSelectedLeave(null);
    } catch (error) {
      console.error(`Error ${actionType}ing leave:`, error);
      alert(`Error ${actionType}ing leave request. Please try again.`);
    } finally {
      setProcessing(null);
    }
  };

  const handleViewDetails = (leave) => {
    setSelectedLeaveDetails(leave);
    setShowDetailsModal(true);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Leave Requests Management</h2>
          <p className="text-gray-600 mt-1">Review and manage doctor leave requests</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={fetchLeaves}
            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <HiRefresh className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          <div className="flex items-center space-x-2">
            <HiFilter className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-600">Filter by status:</span>
          </div>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)} 
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
            <option value="">All</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <HiClock className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-800">Pending</p>
              <p className="text-2xl font-bold text-yellow-900">
                {leaves.filter(l => l.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <HiCheck className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">Approved</p>
              <p className="text-2xl font-bold text-green-900">
                {leaves.filter(l => l.status === 'approved').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <HiX className="h-8 w-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">Rejected</p>
              <p className="text-2xl font-bold text-red-900">
                {leaves.filter(l => l.status === 'rejected').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <HiX className="h-8 w-8 text-gray-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-800">Cancelled</p>
              <p className="text-2xl font-bold text-gray-900">
                {leaves.filter(l => l.status === 'cancelled').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <HiUser className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-800">Total</p>
              <p className="text-2xl font-bold text-blue-900">{leaves.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Leave Requests Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Leave Requests</h3>
        </div>
        
        {loading ? (
          <div className="px-6 py-12 text-center">
            <div className="inline-flex items-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading leave requests...</span>
            </div>
          </div>
        ) : leaves.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <HiExclamation className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No leave requests</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'pending' ? 'No pending leave requests at the moment.' :
               filter === 'approved' ? 'No approved leave requests.' :
               filter === 'rejected' ? 'No rejected leave requests.' :
               'No leave requests found.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date(s)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leave Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin Comment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leaves.map((lr) => (
                  <tr key={lr._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <HiUser className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{lr.doctor_id?.name || 'Unknown Doctor'}</div>
                          <div className="text-sm text-gray-500">{lr.doctor_id?.email || ''}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{lr.doctor_id?.doctor_info?.department?.name || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDateRange(lr.start_date, lr.end_date, lr.leave_type)}
                      </div>
                      {lr.leave_type === 'half_day' && (
                        <div className="text-sm text-gray-500 capitalize">
                          {lr.session} session
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        lr.leave_type === 'full_day' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {lr.leave_type === 'full_day' ? 'Full Day' : 'Half Day'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">{lr.reason || 'No reason provided'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(lr.status)}`}>
                        {getStatusIcon(lr.status)}
                        {lr.status.charAt(0).toUpperCase() + lr.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">{lr.admin_comment || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewDetails(lr)}
                          className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <HiEye className="h-3 w-3 mr-1" />
                          View
                        </button>
                        {lr.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleApprove(lr)}
                              disabled={processing === lr._id}
                              className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {processing === lr._id ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                              ) : (
                                <HiCheck className="h-3 w-3 mr-1" />
                              )}
                              Approve
                            </button>
                            <button 
                              onClick={() => handleReject(lr)}
                              disabled={processing === lr._id}
                              className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {processing === lr._id ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                              ) : (
                                <HiX className="h-3 w-3 mr-1" />
                              )}
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Comment Modal */}
      {showCommentModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-blue-100 rounded-full">
                {actionType === 'approve' ? (
                  <HiCheck className="h-6 w-6 text-blue-600" />
                ) : (
                  <HiX className="h-6 w-6 text-red-600" />
                )}
              </div>
              <div className="mt-2 text-center">
                <h3 className="text-lg font-medium text-gray-900">
                  {actionType === 'approve' ? 'Approve Leave Request' : 'Reject Leave Request'}
                </h3>
                <div className="mt-2 px-7 py-3">
                  <p className="text-sm text-gray-500">
                    Doctor: <span className="font-medium">{selectedLeave?.doctor_id?.name}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Date: <span className="font-medium">{selectedLeave && new Date(selectedLeave.date).toLocaleDateString()}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    Reason: <span className="font-medium">{selectedLeave?.reason || 'No reason provided'}</span>
                  </p>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Comment (Optional)
                  </label>
                  <textarea
                    value={adminComment}
                    onChange={(e) => setAdminComment(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={`Add a comment for ${actionType === 'approve' ? 'approval' : 'rejection'}...`}
                  />
                </div>
              </div>
              <div className="items-center px-4 py-3">
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowCommentModal(false);
                      setAdminComment('');
                      setSelectedLeave(null);
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmAction}
                    disabled={processing}
                    className={`px-4 py-2 text-base font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 ${
                      actionType === 'approve'
                        ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
                        : 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {processing ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </div>
                    ) : (
                      `${actionType === 'approve' ? 'Approve' : 'Reject'} Leave`
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leave Details Modal */}
      {showDetailsModal && selectedLeaveDetails && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-8 mx-auto p-6 md:p-8 w-[700px] max-w-full rounded-xl bg-white shadow-xl border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-gray-900">Leave Request Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <HiX className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Doctor Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-lg font-medium text-gray-900 mb-3">Doctor Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <p className="text-sm text-gray-900">{selectedLeaveDetails.doctor_id?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="text-sm text-gray-900">{selectedLeaveDetails.doctor_id?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Department</label>
                    <p className="text-sm text-gray-900">{selectedLeaveDetails.doctor_id?.doctor_info?.department?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="text-sm text-gray-900">{selectedLeaveDetails.doctor_id?.phone || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Leave Information */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="text-lg font-medium text-gray-900 mb-3">Leave Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Leave Type</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedLeaveDetails.leave_type === 'full_day' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {selectedLeaveDetails.leave_type === 'full_day' ? 'Full Day' : 'Half Day'}
                    </span>
                  </div>
                  {selectedLeaveDetails.leave_type === 'half_day' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Session</label>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 capitalize">
                        {selectedLeaveDetails.session} Session
                      </span>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Date</label>
                    <p className="text-sm text-gray-900">{new Date(selectedLeaveDetails.start_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">End Date</label>
                    <p className="text-sm text-gray-900">{new Date(selectedLeaveDetails.end_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedLeaveDetails.status)}`}>
                      {getStatusIcon(selectedLeaveDetails.status)}
                      {selectedLeaveDetails.status.charAt(0).toUpperCase() + selectedLeaveDetails.status.slice(1)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Requested On</label>
                    <p className="text-sm text-gray-900">{new Date(selectedLeaveDetails.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-900">{selectedLeaveDetails.reason || 'No reason provided'}</p>
                </div>
              </div>

              {/* Admin Comment */}
              {selectedLeaveDetails.admin_comment && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Admin Comment</label>
                  <div className="bg-yellow-50 rounded-lg p-3">
                    <p className="text-sm text-gray-900">{selectedLeaveDetails.admin_comment}</p>
                  </div>
                </div>
              )}

              {/* Impact Information */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <HiExclamation className="h-5 w-5 text-red-600 mt-0.5 mr-3" />
                  <div className="text-sm text-red-800">
                    <p className="font-medium mb-1">Impact of Approval:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Doctor's schedule will be automatically updated</li>
                      <li>All existing appointments will be cancelled</li>
                      <li>Patients will be notified via email/SMS</li>
                      <li>Alternative doctors will be suggested</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              {selectedLeaveDetails.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleApprove(selectedLeaveDetails);
                    }}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                  >
                    <HiCheck className="h-4 w-4" />
                    <span>Approve</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleReject(selectedLeaveDetails);
                    }}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                  >
                    <HiX className="h-4 w-4" />
                    <span>Reject</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

