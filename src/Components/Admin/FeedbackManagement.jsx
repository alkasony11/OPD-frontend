import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  HiChat, HiEye, HiPencil, HiCheckCircle, HiClock, HiExclamation,
  HiSearch, HiFilter, HiDownload, HiRefresh, HiUser, HiCalendar,
  HiMail, HiPhone, HiDocumentText, HiTag, HiStar, HiX
} from 'react-icons/hi';

export default function FeedbackManagement() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  // Update form
  const [updateData, setUpdateData] = useState({
    status: '',
    admin_notes: ''
  });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [feedbacks, searchTerm, statusFilter, typeFilter]);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/api/admin/feedback', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFeedbacks(response.data.items || []);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...feedbacks];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(feedback => 
        feedback.patient_id?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feedback.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feedback.message?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(feedback => feedback.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(feedback => feedback.type === typeFilter);
    }

    setFilteredFeedbacks(filtered);
  };

  const handleViewDetails = (feedback) => {
    setSelectedFeedback(feedback);
    setShowDetailsModal(true);
  };

  const handleUpdateStatus = (feedback) => {
    setSelectedFeedback(feedback);
    setUpdateData({
      status: feedback.status,
      admin_notes: feedback.admin_notes || ''
    });
    setShowUpdateModal(true);
  };

  const handleSubmitUpdate = async () => {
    try {
      setUpdating(true);
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:5001/api/admin/feedback/${selectedFeedback._id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state
      setFeedbacks(feedbacks.map(f => 
        f._id === selectedFeedback._id 
          ? { ...f, status: updateData.status, admin_notes: updateData.admin_notes }
          : f
      ));
      
      setShowUpdateModal(false);
      setSelectedFeedback(null);
    } catch (error) {
      console.error('Error updating feedback:', error);
      alert('Error updating feedback');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      open: { color: 'bg-red-100 text-red-800', icon: HiExclamation, label: 'Open' },
      in_progress: { color: 'bg-yellow-100 text-yellow-800', icon: HiClock, label: 'In Progress' },
      resolved: { color: 'bg-green-100 text-green-800', icon: HiCheckCircle, label: 'Resolved' }
    };
    
    const config = statusConfig[status] || statusConfig.open;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const typeConfig = {
      feedback: { color: 'bg-blue-100 text-blue-800', icon: HiStar, label: 'Feedback' },
      complaint: { color: 'bg-red-100 text-red-800', icon: HiExclamation, label: 'Complaint' },
      query: { color: 'bg-purple-100 text-purple-800', icon: HiChat, label: 'Query' }
    };
    
    const config = typeConfig[type] || typeConfig.feedback;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const getOriginBadge = (item) => {
    const isGuest = !item.patient_id && (item.guest_email || item.guest_name);
    return isGuest ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Guest</span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Verified</span>
    );
  };

  const exportToCSV = () => {
    const csvData = filteredFeedbacks.map(feedback => ({
      'Patient Name': feedback.patient_id?.name || 'N/A',
      'Patient Email': feedback.patient_id?.email || 'N/A',
      'Patient Phone': feedback.patient_id?.phone || 'N/A',
      'Doctor': feedback.doctor_id?.name || 'N/A',
      'Type': feedback.type,
      'Subject': feedback.subject || 'N/A',
      'Message': feedback.message,
      'Status': feedback.status,
      'Admin Notes': feedback.admin_notes || 'N/A',
      'Created At': new Date(feedback.createdAt).toLocaleString(),
      'Updated At': new Date(feedback.updatedAt).toLocaleString()
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feedback-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Patient Feedback & Complaints</h1>
            <p className="text-gray-600 mt-1">Manage patient feedback, complaints, and queries</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={fetchFeedbacks}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <HiRefresh className="w-4 h-4 mr-2" />
              Refresh
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              <HiDownload className="w-4 h-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="relative">
            <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search feedback..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="feedback">Feedback</option>
            <option value="complaint">Complaint</option>
            <option value="query">Query</option>
          </select>

          <div className="text-sm text-gray-600 flex items-center">
            <HiFilter className="w-4 h-4 mr-1" />
            {filteredFeedbacks.length} of {feedbacks.length} items
          </div>
        </div>

        {/* Feedback List */}
        <div className="space-y-4">
          {filteredFeedbacks.length === 0 ? (
            <div className="text-center py-12">
              <HiChat className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No feedback found</h3>
              <p className="mt-1 text-sm text-gray-500">No feedback matches your current filters.</p>
            </div>
          ) : (
            filteredFeedbacks.map((feedback, index) => (
              <div key={feedback._id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {feedback.patient_id?.name || feedback.guest_name || 'Unknown'}
                      </h3>
                      {getTypeBadge(feedback.type)}
                      {getStatusBadge(feedback.status)}
                      {getOriginBadge(feedback)}
                    </div>
                    
                    {feedback.subject && (
                      <p className="text-sm font-medium text-gray-700 mb-1">{feedback.subject}</p>
                    )}
                    
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {feedback.message}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center">
                        <HiMail className="w-3 h-3 mr-1" />
                        {feedback.patient_id?.email || feedback.guest_email || 'N/A'}
                      </div>
                      <div className="flex items-center">
                        <HiPhone className="w-3 h-3 mr-1" />
                        {feedback.patient_id?.phone || feedback.guest_phone || 'N/A'}
                      </div>
                      <div className="flex items-center">
                        <HiCalendar className="w-3 h-3 mr-1" />
                        {new Date(feedback.createdAt).toLocaleDateString()}
                      </div>
                      {feedback.doctor_id && (
                        <div className="flex items-center">
                          <HiUser className="w-3 h-3 mr-1" />
                          Dr. {feedback.doctor_id.name}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleViewDetails(feedback)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="View Details"
                    >
                      <HiEye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(feedback)}
                      className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                      title="Update Status"
                    >
                      <HiPencil className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold text-gray-900">Feedback Details</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <HiX className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedFeedback.patient_id?.name || selectedFeedback.guest_name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedFeedback.patient_id?.email || selectedFeedback.guest_email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedFeedback.patient_id?.phone || selectedFeedback.guest_phone || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Origin</label>
                    <div className="mt-1">{getOriginBadge(selectedFeedback)}</div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Type & Status</label>
                  <div className="mt-1 flex space-x-2">
                    {getTypeBadge(selectedFeedback.type)}
                    {getStatusBadge(selectedFeedback.status)}
                  </div>
                </div>

                {selectedFeedback.subject && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Subject</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedFeedback.subject}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">Message</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedFeedback.message}</p>
                  </div>
                </div>

                {selectedFeedback.admin_notes && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Admin Notes</label>
                    <div className="mt-1 p-3 bg-blue-50 rounded-md">
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedFeedback.admin_notes}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedFeedback.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedFeedback.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleUpdateStatus(selectedFeedback);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Update Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Modal */}
      {showUpdateModal && selectedFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold text-gray-900">Update Feedback Status</h2>
                <button
                  onClick={() => setShowUpdateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <HiX className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={updateData.status}
                    onChange={(e) => setUpdateData({ ...updateData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Admin Notes</label>
                  <textarea
                    value={updateData.admin_notes}
                    onChange={(e) => setUpdateData({ ...updateData, admin_notes: e.target.value })}
                    rows={4}
                    placeholder="Add notes about this feedback..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowUpdateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={updating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitUpdate}
                  disabled={updating}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {updating ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
