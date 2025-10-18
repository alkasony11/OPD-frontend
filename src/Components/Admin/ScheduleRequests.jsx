import { useState, useEffect } from 'react';
import { HiClock, HiX, HiCheck, HiExclamation, HiCalendar, HiUser, HiMail, HiPhone, HiOfficeBuilding, HiDocumentText, HiRefresh } from 'react-icons/hi';
import axios from 'axios';

export default function ScheduleRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchScheduleRequests();
  }, []);

  const fetchScheduleRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/api/admin/schedule-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(response.data.requests || []);
    } catch (error) {
      console.error('Error fetching schedule requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5001/api/admin/schedule-requests/${requestId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Schedule request approved successfully');
      fetchScheduleRequests();
      
      // Notify other tabs/windows about the schedule update
      if (window.opener || window.parent !== window) {
        window.postMessage({ type: 'SCHEDULE_UPDATED', requestId }, '*');
      }
      
      // Broadcast to other tabs
      localStorage.setItem('scheduleUpdate', Date.now().toString());
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Failed to approve request');
    }
  };

  const handleReject = async (requestId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5001/api/admin/schedule-requests/${requestId}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Schedule request rejected successfully');
      fetchScheduleRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'cancel': return 'bg-red-100 text-red-800';
      case 'reschedule': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Schedule Requests</h2>
          <p className="text-gray-600">Review and manage doctor schedule change requests</p>
        </div>
        <button
          onClick={fetchScheduleRequests}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <HiRefresh className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>


      {/* Requests List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Schedule Change Requests</h3>
          <p className="text-sm text-gray-600 mt-1">Review and manage requests from doctors</p>
        </div>

        {requests.length === 0 ? (
          <div className="p-8 text-center">
            <HiCalendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No schedule requests found</p>
            <p className="text-sm text-gray-400 mt-2">Doctors will appear here when they submit schedule changes</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {requests.map((request, index) => (
              <div key={request.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  {/* Serial Number and Basic Info */}
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                    </div>
                    <div>
                      <div className="flex items-center space-x-4">
                        <h4 className="text-lg font-semibold text-gray-900">{request.doctorName}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(request.type)}`}>
                          {request.type === 'cancel' ? 'Cancel' : 'Reschedule'}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        <span><strong>Date:</strong> {formatDate(request.date)}</span>
                        <span><strong>Email:</strong> {request.doctorEmail}</span>
                        <span><strong>Submitted:</strong> {formatDateTime(request.createdAt)}</span>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-gray-700"><strong>Reason:</strong> {request.reason}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2">
                    {request.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(request.id)}
                          className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                          <HiCheck className="h-4 w-4" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleReject(request.id)}
                          className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                        >
                          <HiX className="h-4 w-4" />
                          <span>Reject</span>
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowDetailsModal(true);
                      }}
                      className="flex items-center space-x-1 px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                    >
                      <HiDocumentText className="h-4 w-4" />
                      <span>Details</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Schedule Request Details</h3>
                <p className="text-sm text-gray-600 mt-1">Complete information about the request</p>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <HiX className="h-6 w-6" />
              </button>
            </div>

            {/* Doctor Information */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <HiUser className="h-8 w-8 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-semibold text-gray-900">{selectedRequest.doctorName}</h4>
                  <div className="flex items-center space-x-6 text-sm text-gray-600 mt-1">
                    <div className="flex items-center space-x-1">
                      <HiMail className="h-4 w-4" />
                      <span>{selectedRequest.doctorEmail}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <HiClock className="h-4 w-4" />
                      <span>Submitted {formatDateTime(selectedRequest.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(selectedRequest.type)}`}>
                    {selectedRequest.type === 'cancel' ? 'Cancel Request' : 'Reschedule Request'}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium mt-2 ${getStatusColor(selectedRequest.status)}`}>
                    {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Request Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Requested Date</h5>
                  <div className="flex items-center space-x-2 text-gray-900">
                    <HiCalendar className="h-4 w-4" />
                    <span className="font-medium">{formatDate(selectedRequest.date)}</span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Request Type</h5>
                  <div className="flex items-center space-x-2 text-gray-900">
                    <HiDocumentText className="h-4 w-4" />
                    <span className="font-medium">{selectedRequest.type === 'cancel' ? 'Schedule Cancellation' : 'Schedule Modification'}</span>
                  </div>
                </div>
              </div>

              {/* Reason */}
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-3">Reason for Request</h5>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <p className="text-gray-900 leading-relaxed">{selectedRequest.reason}</p>
                </div>
              </div>

              {selectedRequest.newSchedule && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-3">Proposed New Schedule</h5>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="bg-white rounded-lg p-3">
                        <span className="font-medium text-blue-900">Date:</span>
                        <span className="ml-2 text-blue-800">{formatDate(selectedRequest.newSchedule.date)}</span>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <span className="font-medium text-blue-900">Status:</span>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                          selectedRequest.newSchedule.isAvailable ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                        }`}>
                          {selectedRequest.newSchedule.isAvailable ? 'Available' : 'On Leave'}
                        </span>
                      </div>
                      {selectedRequest.newSchedule.workingHours && (
                        <>
                          <div className="bg-white rounded-lg p-3">
                            <span className="font-medium text-blue-900">Start Time:</span>
                            <span className="ml-2 text-blue-800">{selectedRequest.newSchedule.workingHours.start_time}</span>
                          </div>
                          <div className="bg-white rounded-lg p-3">
                            <span className="font-medium text-blue-900">End Time:</span>
                            <span className="ml-2 text-blue-800">{selectedRequest.newSchedule.workingHours.end_time}</span>
                          </div>
                        </>
                      )}
                      {selectedRequest.newSchedule.breakTime && (
                        <>
                          <div className="bg-white rounded-lg p-3">
                            <span className="font-medium text-blue-900">Break Start:</span>
                            <span className="ml-2 text-blue-800">{selectedRequest.newSchedule.breakTime.start_time}</span>
                          </div>
                          <div className="bg-white rounded-lg p-3">
                            <span className="font-medium text-blue-900">Break End:</span>
                            <span className="ml-2 text-blue-800">{selectedRequest.newSchedule.breakTime.end_time}</span>
                          </div>
                        </>
                      )}
                      <div className="bg-white rounded-lg p-3">
                        <span className="font-medium text-blue-900">Slot Duration:</span>
                        <span className="ml-2 text-blue-800">{selectedRequest.newSchedule.slotDuration} minutes</span>
                      </div>
                      {selectedRequest.newSchedule.leaveReason && (
                        <div className="col-span-2 bg-white rounded-lg p-3">
                          <span className="font-medium text-blue-900">Leave Reason:</span>
                          <span className="ml-2 text-blue-800">{selectedRequest.newSchedule.leaveReason}</span>
                        </div>
                      )}
                      {selectedRequest.newSchedule.notes && (
                        <div className="col-span-2 bg-white rounded-lg p-3">
                          <span className="font-medium text-blue-900">Additional Notes:</span>
                          <span className="ml-2 text-blue-800">{selectedRequest.newSchedule.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div className="text-xs text-gray-500">
                Request ID: {selectedRequest.id}
              </div>
              
              <div className="flex space-x-3">
                {selectedRequest.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        handleApprove(selectedRequest.id);
                        setShowDetailsModal(false);
                      }}
                      className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      <HiCheck className="h-4 w-4" />
                      <span>Approve Request</span>
                    </button>
                    <button
                      onClick={() => {
                        handleReject(selectedRequest.id);
                        setShowDetailsModal(false);
                      }}
                      className="flex items-center space-x-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                      <HiX className="h-4 w-4" />
                      <span>Reject Request</span>
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
