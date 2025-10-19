import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import Swal from 'sweetalert2';
import {
  CogIcon,
  BellIcon,
  ShieldCheckIcon,
  EyeIcon,
  EyeSlashIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  DocumentTextIcon,
  ClockIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import { usePasswordChangeValidation } from '../../hooks/useFormValidation';

const Settings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [activeQuickAccess, setActiveQuickAccess] = useState(null);
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: true,
    appointmentReminders: true,
    prescriptionReady: true,
    paymentReminders: true
  });
  const [privacy, setPrivacy] = useState({
    profileVisibility: 'private',
    shareMedicalData: false,
    allowDataCollection: true
  });
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  // Data for quick access sections
  const [invoices, setInvoices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [consultedAppointments, setConsultedAppointments] = useState([]);
  const [cancelledAppointments, setCancelledAppointments] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // Password change validation
  const passwordValidation = usePasswordChangeValidation({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchUserData();
    fetchSettings();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/patient/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data.user);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/patient/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success && response.data.settings) {
        setNotifications(response.data.settings.notifications || notifications);
        setPrivacy(response.data.settings.privacy || privacy);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      // Use default settings if API fails
    }
  };

  const fetchInvoices = async () => {
    try {
      setLoadingData(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/patient/settings/invoices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setInvoices(response.data.invoices || []);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      setInvoices([]);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoadingData(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/patient/settings/appointments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setAppointments(response.data.appointments || []);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setAppointments([]);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchConsultedAppointments = async () => {
    try {
      setLoadingData(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/patient/settings/consulted-appointments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setConsultedAppointments(response.data.appointments || []);
      }
    } catch (error) {
      console.error('Error fetching consulted appointments:', error);
      setConsultedAppointments([]);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchCancelledAppointments = async () => {
    try {
      setLoadingData(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/patient/settings/cancelled-appointments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setCancelledAppointments(response.data.appointments || []);
      }
    } catch (error) {
      console.error('Error fetching cancelled appointments:', error);
      setCancelledAppointments([]);
    } finally {
      setLoadingData(false);
    }
  };

  const handleQuickAccessClick = (section) => {
    setActiveQuickAccess(section);
    
    // Fetch data based on the selected section
    switch (section) {
      case 'invoices':
        fetchInvoices();
        break;
      case 'appointments':
        fetchAppointments();
        break;
      case 'consulted':
        fetchConsultedAppointments();
        break;
      case 'cancelled':
        fetchCancelledAppointments();
        break;
      default:
        break;
    }
  };

  // No default tab - let users click to view sections

  const handleNotificationChange = (key, value) => {
    setNotifications(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handlePrivacyChange = (key, value) => {
    setPrivacy(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_BASE_URL}/api/patient/settings`, {
        notifications,
        privacy
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        Swal.fire('Success', 'Settings saved successfully!', 'success');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      Swal.fire('Error', 'Failed to save settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Change Password',
      html: `
        <input id="current-password" type="password" placeholder="Current Password" class="swal2-input">
        <input id="new-password" type="password" placeholder="New Password" class="swal2-input">
        <input id="confirm-password" type="password" placeholder="Confirm New Password" class="swal2-input">
        <div class="text-xs text-gray-600 mt-2">
          Password must be at least 8 characters with uppercase, lowercase, numbers, and no spaces
        </div>
      `,
      focusConfirm: false,
      preConfirm: () => {
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        // Validate using our validation function
        const validation = passwordValidation.validateForm({
          currentPassword,
          newPassword,
          confirmPassword
        });
        
        if (!validation.isValid) {
          const firstError = Object.values(validation.errors)[0];
          Swal.showValidationMessage(firstError);
          return false;
        }
        
        return { currentPassword, newPassword };
      }
    });

    if (formValues) {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        await axios.put(`${API_BASE_URL}/api/patient/change-password`, {
          currentPassword: formValues.currentPassword,
          newPassword: formValues.newPassword
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        Swal.fire('Success', 'Password changed successfully!', 'success');
      } catch (error) {
        console.error('Error changing password:', error);
        Swal.fire('Error', error.response?.data?.message || 'Failed to change password', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      Swal.fire('Error', 'Please type DELETE to confirm account deletion', 'error');
      return;
    }

    // Ask for password
    const { value: password } = await Swal.fire({
      title: 'Confirm Account Deletion',
      text: 'Enter your password to confirm account deletion',
      input: 'password',
      inputPlaceholder: 'Enter your password',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Delete Account',
      cancelButtonText: 'Cancel',
      inputValidator: (value) => {
        if (!value) {
          return 'Password is required!';
        }
        return null;
      }
    });

    if (password) {
      const result = await Swal.fire({
        title: 'Are you absolutely sure?',
        text: 'This action cannot be undone. All your data will be permanently deleted.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, delete my account',
        cancelButtonText: 'Cancel'
      });

      if (result.isConfirmed) {
        try {
          setLoading(true);
          const token = localStorage.getItem('token');
          
          const response = await axios.delete(`${API_BASE_URL}/api/patient/account`, {
            headers: { Authorization: `Bearer ${token}` },
            data: { password: password }
          });

          if (response.data.success) {
            // Clear local storage and redirect
            localStorage.clear();
            Swal.fire('Account Deleted', 'Your account has been permanently deleted.', 'success');
            navigate('/');
          }
        } catch (error) {
          console.error('Error deleting account:', error);
          const errorMessage = error.response?.data?.message || 'Failed to delete account';
          Swal.fire('Error', errorMessage, 'error');
        } finally {
          setLoading(false);
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-gray-600">Manage your account preferences and privacy settings</p>
        </div>

        <div className="space-y-6">
          {/* Invoices Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div 
              className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => handleQuickAccessClick('invoices')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <DocumentTextIcon className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Invoices</h3>
                    <p className="text-sm text-gray-500">View your payment history and receipts</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">{invoices.length} invoices</span>
                  <div className={`w-2 h-2 rounded-full ${activeQuickAccess === 'invoices' ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
                </div>
              </div>
            </div>
            
            {activeQuickAccess === 'invoices' && (
              <div className="border-t border-gray-200 p-6">
                {loadingData ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                    <span className="ml-3 text-gray-600">Loading invoices...</span>
                  </div>
                ) : (
                  <InvoicesContent invoices={invoices} />
                )}
              </div>
            )}
          </div>

          {/* My Appointments Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div 
              className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => handleQuickAccessClick('appointments')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <CalendarDaysIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">My Appointments</h3>
                    <p className="text-sm text-gray-500">View your upcoming appointments</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">{appointments.length} appointments</span>
                  <div className={`w-2 h-2 rounded-full ${activeQuickAccess === 'appointments' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                </div>
              </div>
            </div>
            
            {activeQuickAccess === 'appointments' && (
              <div className="border-t border-gray-200 p-6">
                {loadingData ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    <span className="ml-3 text-gray-600">Loading appointments...</span>
                  </div>
                ) : (
                  <AppointmentsContent appointments={appointments} />
                )}
              </div>
            )}
          </div>

          {/* Appointment History Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div 
              className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => handleQuickAccessClick('consulted')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <ClockIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Appointment History</h3>
                    <p className="text-sm text-gray-500">View your past consultations and medical records</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">{consultedAppointments.length} consultations</span>
                  <div className={`w-2 h-2 rounded-full ${activeQuickAccess === 'consulted' ? 'bg-purple-500' : 'bg-gray-300'}`}></div>
                </div>
              </div>
            </div>
            
            {activeQuickAccess === 'consulted' && (
              <div className="border-t border-gray-200 p-6">
                {loadingData ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    <span className="ml-3 text-gray-600">Loading history...</span>
                  </div>
                ) : (
                  <ConsultedAppointmentsContent appointments={consultedAppointments} />
                )}
              </div>
            )}
          </div>

          {/* Cancelled Appointments Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div 
              className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => handleQuickAccessClick('cancelled')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <XMarkIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Cancelled Appointments</h3>
                    <p className="text-sm text-gray-500">View your cancelled or rescheduled appointments</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">{cancelledAppointments.length} cancelled</span>
                  <div className={`w-2 h-2 rounded-full ${activeQuickAccess === 'cancelled' ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                </div>
              </div>
            </div>
            
            {activeQuickAccess === 'cancelled' && (
              <div className="border-t border-gray-200 p-6">
                {loadingData ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                    <span className="ml-3 text-gray-600">Loading cancelled appointments...</span>
                  </div>
                ) : (
                  <CancelledAppointmentsContent appointments={cancelledAppointments} />
                )}
              </div>
            )}
          </div>


          {/* Danger Zone */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-red-200">
            <div className="flex items-center mb-6">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-3" />
              <h2 className="text-xl font-semibold text-red-900">Danger Zone</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Delete Account</h3>
                  <p className="text-sm text-gray-500">Permanently delete your account and all data</p>
                </div>
                <button
                  onClick={() => setShowDeleteAccount(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Delete Account Modal */}
        {showDeleteAccount && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center mb-4">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Delete Account</h3>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                This action cannot be undone. All your data will be permanently deleted.
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type <span className="font-mono bg-gray-100 px-2 py-1 rounded">DELETE</span> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Type DELETE here"
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteAccount(false);
                    setDeleteConfirmation('');
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmation !== 'DELETE' || loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Deleting...' : 'Delete Account'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Content Components
const InvoicesContent = ({ invoices }) => {
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (invoices.length === 0) {
    return (
      <div className="text-center py-8">
        <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No invoices found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {invoices.map((invoice) => (
        <div 
          key={invoice.id} 
          className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
          onClick={() => setSelectedInvoice(selectedInvoice === invoice.id ? null : invoice.id)}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">Invoice #{invoice.invoice_number || invoice.id}</h3>
              <p className="text-sm text-gray-500">Date: {formatDate(invoice.created_at || invoice.appointment?.appointmentDate)}</p>
              {invoice.appointment && (
                <p className="text-sm text-gray-500">Doctor: {invoice.appointment.doctorName}</p>
              )}
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900">{formatCurrency(invoice.amount || 0)}</p>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                invoice.payment_status === 'paid' 
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {invoice.payment_status?.charAt(0).toUpperCase() + invoice.payment_status?.slice(1)}
              </span>
            </div>
          </div>
          
          {/* Expanded Details */}
          {selectedInvoice === invoice.id && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Payment Method:</span>
                  <p className="font-medium">{invoice.payment_method || 'Card'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Transaction ID:</span>
                  <p className="font-medium">{invoice.transaction_id || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Service:</span>
                  <p className="font-medium">{invoice.appointment?.departmentName || 'General Consultation'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Duration:</span>
                  <p className="font-medium">{invoice.appointment?.duration || '30 minutes'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const AppointmentsContent = ({ appointments }) => {
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (appointments.length === 0) {
    return (
      <div className="text-center py-8">
        <CalendarDaysIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No appointments found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {appointments.map((appointment) => (
        <div 
          key={appointment.id} 
          className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
          onClick={() => setSelectedAppointment(selectedAppointment === appointment.id ? null : appointment.id)}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{appointment.doctorName}</h3>
              <p className="text-sm text-gray-500">{appointment.departmentName}</p>
              <p className="text-sm text-gray-500">Date: {formatDate(appointment.appointmentDate)} at {appointment.appointmentTime}</p>
            </div>
            <div className="text-right">
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                appointment.status === 'confirmed' 
                  ? 'bg-green-100 text-green-800'
                  : appointment.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {appointment.status?.charAt(0).toUpperCase() + appointment.status?.slice(1)}
              </span>
            </div>
          </div>
          
          {/* Expanded Details */}
          {selectedAppointment === appointment.id && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Token Number:</span>
                  <p className="font-medium">{appointment.tokenNumber || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Appointment Type:</span>
                  <p className="font-medium">{appointment.appointmentType || 'In-Person'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Estimated Wait:</span>
                  <p className="font-medium">{appointment.estimatedWaitTime || '30 minutes'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Fee:</span>
                  <p className="font-medium">₹{appointment.fee || '500'}</p>
                </div>
                {appointment.meetingLink && (
                  <div className="col-span-2">
                    <span className="text-gray-500">Meeting Link:</span>
                    <p className="font-medium text-blue-600">{appointment.meetingLink}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const ConsultedAppointmentsContent = ({ appointments }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (appointments.length === 0) {
    return (
      <div className="text-center py-8">
        <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No consultation history found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {appointments.map((appointment) => (
        <div key={appointment.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium text-gray-900">{appointment.doctorName}</h3>
              <p className="text-sm text-gray-500">{appointment.departmentName}</p>
              <p className="text-sm text-gray-500">Date: {formatDate(appointment.appointmentDate)} at {appointment.appointmentTime}</p>
              {appointment.diagnosis && (
                <p className="text-sm text-gray-600 mt-2">Diagnosis: {appointment.diagnosis}</p>
              )}
            </div>
            <div className="text-right">
              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                Consulted
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const CancelledAppointmentsContent = ({ appointments }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (appointments.length === 0) {
    return (
      <div className="text-center py-8">
        <XMarkIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No cancelled appointments found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {appointments.map((appointment) => (
        <div key={appointment.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium text-gray-900">{appointment.doctorName}</h3>
              <p className="text-sm text-gray-500">{appointment.departmentName}</p>
              <p className="text-sm text-gray-500">Date: {formatDate(appointment.appointmentDate)} at {appointment.appointmentTime}</p>
              {appointment.cancellationReason && (
                <p className="text-sm text-gray-600 mt-2">Reason: {appointment.cancellationReason}</p>
              )}
            </div>
            <div className="text-right">
              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                Cancelled
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Settings;
