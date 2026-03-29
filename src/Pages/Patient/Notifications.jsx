import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import {
  HiBell,
  HiCheck,
  HiX,
  HiClock,
  HiCalendar,
  HiInformationCircle,
  HiCheckCircle,
  HiRefresh,
  HiFilter,
  HiSearch,
  HiEye,
  HiTrash
} from 'react-icons/hi';

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, unread, read, appointment, payment, system
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [markingAsRead, setMarkingAsRead] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [notifications, filter, searchTerm]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_BASE_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNotifications(response.data.notifications || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err.response?.data?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...notifications];

    // Apply type filter
    if (filter !== 'all') {
      filtered = filtered.filter(notification => {
        switch (filter) {
          case 'unread':
            return !notification.read;
          case 'read':
            return notification.read;
          case 'appointment':
            return notification.type === 'appointment';
          case 'payment':
            return notification.type === 'payment';
          case 'system':
            return notification.type === 'system';
          default:
            return true;
        }
      });
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(notification =>
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    setFilteredNotifications(filtered);
  };

  const markAsRead = async (notificationId) => {
    try {
      setMarkingAsRead(true);
      const token = localStorage.getItem('token');
      
      await axios.put(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state
      setNotifications(notifications.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true, read_at: new Date() }
          : notification
      ));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    } finally {
      setMarkingAsRead(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      setMarkingAsRead(true);
      const token = localStorage.getItem('token');
      
      await axios.put(`${API_BASE_URL}/api/notifications/mark-all-read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state
      setNotifications(notifications.map(notification => ({
        ...notification,
        read: true,
        read_at: new Date()
      })));
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    } finally {
      setMarkingAsRead(false);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      setDeleting(true);
      const token = localStorage.getItem('token');
      
      await axios.delete(`${API_BASE_URL}/api/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state
      setNotifications(notifications.filter(notification => notification._id !== notificationId));
      setShowDetailsModal(false);
    } catch (err) {
      console.error('Error deleting notification:', err);
    } finally {
      setDeleting(false);
    }
  };

  const getNotificationIcon = (type, priority) => {
    const iconClass = "h-5 w-5";
    
    switch (type) {
      case 'appointment':
        return <HiCalendar className={`${iconClass} text-blue-600`} />;
      case 'payment':
        return <HiCheckCircle className={`${iconClass} text-green-600`} />;
      case 'system':
        return <HiInformationCircle className={`${iconClass} text-gray-600`} />;
      default:
        return <HiBell className={`${iconClass} text-gray-600`} />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-l-green-500 bg-green-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-20 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <HiBell className="h-6 w-6 mr-2" />
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-sm px-2 py-1 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </h1>
              <p className="text-gray-600 mt-1">Stay updated with your appointments and account activity</p>
            </div>
            <div className="flex space-x-3">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  disabled={markingAsRead}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  <HiCheck className="w-4 h-4 mr-2" />
                  Mark All Read
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Notifications</option>
              <option value="unread">Unread Only</option>
              <option value="read">Read Only</option>
              <option value="appointment">Appointments</option>
              <option value="payment">Payments</option>
              <option value="system">System</option>
            </select>

            <div className="flex items-center text-sm text-gray-600">
              <HiFilter className="w-4 h-4 mr-1" />
              {filteredNotifications.length} of {notifications.length} notifications
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <HiBell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
              <p className="text-gray-500">
                {searchTerm || filter !== 'all' 
                  ? 'No notifications match your current filters.'
                  : 'You have no notifications yet. We\'ll notify you about important updates here.'
                }
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-lg shadow border-l-4 ${getPriorityColor(notification.priority)} ${
                  !notification.read ? 'ring-2 ring-blue-200' : ''
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="flex-shrink-0">
                        {getNotificationIcon(notification.type, notification.priority)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span className="flex items-center">
                            <HiClock className="w-3 h-3 mr-1" />
                            {formatDate(notification.created_at)}
                          </span>
                          <span className="capitalize">{notification.type}</span>
                          {notification.priority && (
                            <span className="capitalize">{notification.priority} priority</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          disabled={markingAsRead}
                          className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                          title="Mark as read"
                        >
                          <HiCheck className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedNotification(notification);
                          setShowDetailsModal(true);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="View details"
                      >
                        <HiEye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteNotification(notification._id)}
                        disabled={deleting}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete notification"
                      >
                        <HiTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Notification Details Modal */}
      {showDetailsModal && selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center space-x-3">
                  {getNotificationIcon(selectedNotification.type, selectedNotification.priority)}
                  <h2 className="text-xl font-bold text-gray-900">{selectedNotification.title}</h2>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <HiX className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Message</h3>
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedNotification.message}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Type</h3>
                    <p className="text-gray-900 capitalize">{selectedNotification.type}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Priority</h3>
                    <p className="text-gray-900 capitalize">{selectedNotification.priority || 'Normal'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Created</h3>
                    <p className="text-gray-900">{new Date(selectedNotification.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                    <p className="text-gray-900">{selectedNotification.read ? 'Read' : 'Unread'}</p>
                  </div>
                </div>

                {selectedNotification.readAt && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Read At</h3>
                    <p className="text-gray-900">{new Date(selectedNotification.readAt).toLocaleString()}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                {!selectedNotification.read && (
                  <button
                    onClick={() => {
                      markAsRead(selectedNotification.id);
                      setShowDetailsModal(false);
                    }}
                    disabled={markingAsRead}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    Mark as Read
                  </button>
                )}
                <button
                  onClick={() => deleteNotification(selectedNotification._id)}
                  disabled={deleting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  Delete
                </button>
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
    </div>
  );
}
