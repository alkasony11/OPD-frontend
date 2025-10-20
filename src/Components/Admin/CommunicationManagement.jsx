import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../../config/urls';
import { 
  HiChat, HiMail, HiPhone, HiUser, HiCalendar, HiClock, 
  HiSearch, HiFilter, HiRefresh, HiDownload, HiEye, 
  HiPaperAirplane, HiCheckCircle, HiExclamation, HiX,
  HiDocumentText, HiTag, HiBell, HiArrowRight, HiArrowLeft
} from 'react-icons/hi';

export default function CommunicationManagement() {
  const [messages, setMessages] = useState([]);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  
  // Send message form
  const [messageData, setMessageData] = useState({
    recipientType: 'patient', // patient, doctor, all_patients, all_doctors
    recipientId: '',
    subject: '',
    message: '',
    priority: 'normal',
    type: 'notification'
  });
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchMessages();
    fetchRecipients();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [messages, searchTerm, typeFilter, statusFilter, priorityFilter]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('${API_CONFIG.BASE_URL}/api/admin/messages', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecipients = async () => {
    try {
      const token = localStorage.getItem('token');
      const [patientsRes, doctorsRes] = await Promise.all([
        axios.get('${API_CONFIG.BASE_URL}/api/admin/patients', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('${API_CONFIG.BASE_URL}/api/admin/doctors', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setPatients(patientsRes.data.patients || []);
      setDoctors(doctorsRes.data.doctors || []);
    } catch (error) {
      console.error('Error fetching recipients:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...messages];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(msg => 
        msg.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.recipientName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(msg => msg.type === typeFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(msg => msg.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(msg => msg.priority === priorityFilter);
    }

    setFilteredMessages(filtered);
  };

  const handleViewDetails = (message) => {
    setSelectedMessage(message);
    setShowDetailsModal(true);
  };

  const handleSendMessage = () => {
    setMessageData({
      recipientType: 'patient',
      recipientId: '',
      subject: '',
      message: '',
      priority: 'normal',
      type: 'notification'
    });
    setShowSendModal(true);
  };

  const handleSubmitMessage = async () => {
    try {
      setSending(true);
      const token = localStorage.getItem('token');
      
      await axios.post('${API_CONFIG.BASE_URL}/api/admin/messages', messageData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      fetchMessages();
      setShowSendModal(false);
      alert('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message');
    } finally {
      setSending(false);
    }
  };

  const getTypeBadge = (type) => {
    const typeConfig = {
      notification: { color: 'bg-blue-100 text-blue-800', icon: HiBell, label: 'Notification' },
      announcement: { color: 'bg-purple-100 text-purple-800', icon: HiDocumentText, label: 'Announcement' },
      reminder: { color: 'bg-yellow-100 text-yellow-800', icon: HiClock, label: 'Reminder' },
      alert: { color: 'bg-red-100 text-red-800', icon: HiExclamation, label: 'Alert' }
    };
    
    const config = typeConfig[type] || typeConfig.notification;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      low: { color: 'bg-gray-100 text-gray-800', label: 'Low' },
      normal: { color: 'bg-green-100 text-green-800', label: 'Normal' },
      high: { color: 'bg-yellow-100 text-yellow-800', label: 'High' },
      urgent: { color: 'bg-red-100 text-red-800', label: 'Urgent' }
    };
    
    const config = priorityConfig[priority] || priorityConfig.normal;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      sent: { color: 'bg-green-100 text-green-800', icon: HiCheckCircle, label: 'Sent' },
      delivered: { color: 'bg-blue-100 text-blue-800', icon: HiCheckCircle, label: 'Delivered' },
      read: { color: 'bg-purple-100 text-purple-800', icon: HiEye, label: 'Read' },
      failed: { color: 'bg-red-100 text-red-800', icon: HiX, label: 'Failed' }
    };
    
    const config = statusConfig[status] || statusConfig.sent;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const exportToCSV = () => {
    const csvData = filteredMessages.map(msg => ({
      'Message ID': msg._id || 'N/A',
      'Subject': msg.subject || 'N/A',
      'Type': msg.type || 'N/A',
      'Priority': msg.priority || 'N/A',
      'Recipient': msg.recipientName || 'N/A',
      'Recipient Email': msg.recipientEmail || 'N/A',
      'Recipient Phone': msg.recipientPhone || 'N/A',
      'Message': msg.message || 'N/A',
      'Status': msg.status || 'N/A',
      'Sent At': msg.sentAt ? new Date(msg.sentAt).toLocaleString() : 'N/A',
      'Read At': msg.readAt ? new Date(msg.readAt).toLocaleString() : 'N/A',
      'Created At': new Date(msg.createdAt).toLocaleString()
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `messages-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStats = () => {
    const stats = messages.reduce((acc, msg) => {
      acc.total += 1;
      if (msg.status === 'sent') acc.sent += 1;
      if (msg.status === 'delivered') acc.delivered += 1;
      if (msg.status === 'read') acc.read += 1;
      if (msg.status === 'failed') acc.failed += 1;
      if (msg.priority === 'urgent') acc.urgent += 1;
      return acc;
    }, { total: 0, sent: 0, delivered: 0, read: 0, failed: 0, urgent: 0 });

    return stats;
  };

  const stats = getStats();

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
            <h1 className="text-2xl font-bold text-gray-900">Communication Management</h1>
            <p className="text-gray-600 mt-1">Send messages, notifications, and announcements to patients and doctors</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleSendMessage}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              <HiPaperAirplane className="w-4 h-4 mr-2" />
              Send Message
            </button>
            <button
              onClick={fetchMessages}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <HiRefresh className="w-4 h-4 mr-2" />
              Refresh
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
            >
              <HiDownload className="w-4 h-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <HiChat className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-800">Total</p>
                <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <HiCheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">Sent</p>
                <p className="text-2xl font-bold text-green-900">{stats.sent}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <HiEye className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-800">Read</p>
                <p className="text-2xl font-bold text-purple-900">{stats.read}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center">
              <HiBell className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-800">Delivered</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.delivered}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center">
              <HiExclamation className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">Failed</p>
                <p className="text-2xl font-bold text-red-900">{stats.failed}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center">
              <HiExclamation className="h-8 w-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-orange-800">Urgent</p>
                <p className="text-2xl font-bold text-orange-900">{stats.urgent}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="relative">
            <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="notification">Notification</option>
            <option value="announcement">Announcement</option>
            <option value="reminder">Reminder</option>
            <option value="alert">Alert</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="sent">Sent</option>
            <option value="delivered">Delivered</option>
            <option value="read">Read</option>
            <option value="failed">Failed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Priority</option>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>

          <div className="text-sm text-gray-600 flex items-center">
            <HiFilter className="w-4 h-4 mr-1" />
            {filteredMessages.length} of {messages.length} messages
          </div>
        </div>

        {/* Messages List */}
        <div className="space-y-4">
          {filteredMessages.length === 0 ? (
            <div className="text-center py-12">
              <HiChat className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No messages found</h3>
              <p className="mt-1 text-sm text-gray-500">No messages match your current filters.</p>
            </div>
          ) : (
            filteredMessages.map((message) => (
              <div key={message._id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {message.subject || 'No Subject'}
                      </h3>
                      {getTypeBadge(message.type)}
                      {getPriorityBadge(message.priority)}
                      {getStatusBadge(message.status)}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {message.message}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center">
                        <HiUser className="w-3 h-3 mr-1" />
                        {message.recipientName || 'N/A'}
                      </div>
                      <div className="flex items-center">
                        <HiMail className="w-3 h-3 mr-1" />
                        {message.recipientEmail || 'N/A'}
                      </div>
                      <div className="flex items-center">
                        <HiPhone className="w-3 h-3 mr-1" />
                        {message.recipientPhone || 'N/A'}
                      </div>
                      <div className="flex items-center">
                        <HiCalendar className="w-3 h-3 mr-1" />
                        {message.sentAt ? new Date(message.sentAt).toLocaleDateString() : 'Not sent'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleViewDetails(message)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="View Details"
                    >
                      <HiEye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold text-gray-900">Message Details</h2>
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
                    <label className="block text-sm font-medium text-gray-700">Subject</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedMessage.subject || 'No Subject'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type & Priority</label>
                    <div className="mt-1 flex space-x-2">
                      {getTypeBadge(selectedMessage.type)}
                      {getPriorityBadge(selectedMessage.priority)}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Message</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedMessage.message}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Recipient Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedMessage.recipientName || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedMessage.recipientEmail || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedMessage.recipientPhone || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Recipient Type</label>
                      <p className="mt-1 text-sm text-gray-900 capitalize">{selectedMessage.recipientType || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Delivery Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <div className="mt-1">{getStatusBadge(selectedMessage.status)}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Sent At</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedMessage.sentAt ? new Date(selectedMessage.sentAt).toLocaleString() : 'Not sent'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Delivered At</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedMessage.deliveredAt ? new Date(selectedMessage.deliveredAt).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Read At</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedMessage.readAt ? new Date(selectedMessage.readAt).toLocaleString() : 'Not read'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedMessage.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedMessage.updatedAt).toLocaleString()}
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
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Message Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold text-gray-900">Send Message</h2>
                <button
                  onClick={() => setShowSendModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <HiX className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Recipient Type</label>
                  <select
                    value={messageData.recipientType}
                    onChange={(e) => setMessageData({ ...messageData, recipientType: e.target.value, recipientId: '' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="patient">Single Patient</option>
                    <option value="doctor">Single Doctor</option>
                    <option value="all_patients">All Patients</option>
                    <option value="all_doctors">All Doctors</option>
                  </select>
                </div>

                {(messageData.recipientType === 'patient' || messageData.recipientType === 'doctor') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select {messageData.recipientType === 'patient' ? 'Patient' : 'Doctor'}
                    </label>
                    <select
                      value={messageData.recipientId}
                      onChange={(e) => setMessageData({ ...messageData, recipientId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select {messageData.recipientType === 'patient' ? 'Patient' : 'Doctor'}</option>
                      {(messageData.recipientType === 'patient' ? patients : doctors).map(item => (
                        <option key={item._id} value={item._id}>
                          {item.name} ({item.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <input
                    type="text"
                    value={messageData.subject}
                    onChange={(e) => setMessageData({ ...messageData, subject: e.target.value })}
                    placeholder="Enter message subject..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message Type</label>
                  <select
                    value={messageData.type}
                    onChange={(e) => setMessageData({ ...messageData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="notification">Notification</option>
                    <option value="announcement">Announcement</option>
                    <option value="reminder">Reminder</option>
                    <option value="alert">Alert</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={messageData.priority}
                    onChange={(e) => setMessageData({ ...messageData, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <textarea
                    value={messageData.message}
                    onChange={(e) => setMessageData({ ...messageData, message: e.target.value })}
                    rows={6}
                    placeholder="Enter your message..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowSendModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={sending}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitMessage}
                  disabled={sending || !messageData.message || (messageData.recipientType !== 'all_patients' && messageData.recipientType !== 'all_doctors' && !messageData.recipientId)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {sending ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
