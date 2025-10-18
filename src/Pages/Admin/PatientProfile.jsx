import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import React from 'react';
import { 
  HiCalendar, 
  HiClock, 
  HiUserGroup, 
  HiDocumentText, 
  HiReceiptRefund, 
  HiChatAlt2, 
  HiUser, 
  HiPhone, 
  HiMail, 
  HiLocationMarker, 
  HiHeart, 
  HiDownload, 
  HiBan,
  HiTrash,
  HiX
} from 'react-icons/hi';
import api from '../../utils/api';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('PatientProfile Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Something went wrong</h2>
            <p className="text-red-600 mb-4">There was an error displaying the patient profile.</p>
            <button 
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function PatientProfile({ patientId, onClose }) {
  // If patientId is passed as prop, use it; otherwise get from URL params
  const urlPatientId = useParams().patientId;
  const currentPatientId = patientId || urlPatientId;
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [history, setHistory] = useState(null);
  const [family, setFamily] = useState([]);
  const [activeTab, setActiveTab] = useState('personal');
  const [payments, setPayments] = useState({ items: [], page: 1, totalPages: 1 });
  const [feedback, setFeedback] = useState({ items: [], page: 1, totalPages: 1 });
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        console.log('🔍 Fetching patient data for ID:', currentPatientId);
        const [p, h, f] = await Promise.all([
          api.get(`/api/admin/patients/${currentPatientId}`),
          api.get(`/api/admin/patients/${currentPatientId}/history`),
          api.get(`/api/admin/patients/${currentPatientId}/family`)
        ]);
        console.log('📊 Patient data response:', p.data);
        console.log('📊 History data response:', h.data);
        console.log('📊 Family data response:', f.data);
        console.log('📊 Emergency Contact structure:', p.data?.emergencyContact);
        console.log('📊 Patient name type:', typeof p.data?.name);
        console.log('📊 Patient name value:', p.data?.name);
        setPatient(p.data);
        setHistory(h.data);
        // Process family members data to include more details
        const familyMembers = (f.data?.familyMembers || []).map(member => ({
          id: member.patientId || member._id,
          name: member.name,
          relation: member.relation,
          age: member.age,
          gender: member.gender,
          phone: member.phone,
          email: member.email,
          status: member.status || 'active'
        }));
        setFamily(familyMembers);
        
        // Load payments and feedback
        try {
          const [paymentsRes, feedbackRes] = await Promise.all([
            api.get(`/api/admin/payments?patientId=${patientId}`),
            api.get(`/api/admin/feedback?patientId=${patientId}`)
          ]);
          
          const paymentItems = (paymentsRes.data?.payments || []).map(payment => ({
            id: payment._id,
            date: payment.createdAt,
            appointmentId: payment.appointmentId || 'N/A',
            amount: payment.amount,
            method: payment.method,
            status: payment.status,
            txn: payment.transactionId || payment._id
          }));
          
          setPayments(prev => ({ ...prev, items: paymentItems, totalPages: paymentsRes.data?.totalPages || 1 }));
          
          const feedbackItems = (feedbackRes.data?.feedback || []).map(item => ({
            id: item._id,
            subject: item.subject || item.type || 'Patient Feedback',
            type: item.type || 'general',
            message: item.message,
            date: item.createdAt,
            status: item.status || 'pending'
          }));
          
          setFeedback(prev => ({ ...prev, items: feedbackItems, totalPages: feedbackRes.data?.totalPages || 1 }));
        } catch (error) {
          console.log('Could not load payments/feedback:', error);
        }
      } catch (error) {
        console.error('Error fetching patient data:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [currentPatientId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-600">Patient not found.</p>
        {onClose ? (
          <button onClick={onClose} className="text-blue-600 hover:underline text-sm">Back to Patients</button>
        ) : (
          <Link to="/admin/patients" className="text-blue-600 hover:underline text-sm">Back to Patients</Link>
        )}
      </div>
    );
  }

  // Helper function to safely render patient data
  const safeRender = (value, fallback = 'N/A') => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  };

  return (
    <ErrorBoundary>
      {/* Modal Overlay */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 pl-64">
        <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
          {/* Modal Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Patient Avatar */}
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                  <span className="text-2xl font-bold text-white">
                    {patient.name ? patient.name.charAt(0).toUpperCase() : 'P'}
                  </span>
                </div>
                
                {/* Patient Basic Info */}
                <div>
                  <div className="flex items-center space-x-3 mb-1">
                    <h2 className="text-2xl font-bold text-gray-900">{safeRender(patient.name, 'Unknown Patient')}</h2>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      patient.status === 'active' || patient.isActive !== false
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      {patient.status === 'active' || patient.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span><span className="font-medium">ID:</span> {patient.patientId}</span>
                    <span><span className="font-medium">Gender:</span> {patient.gender || 'N/A'}</span>
                    <span><span className="font-medium">Age:</span> {patient.age || 'N/A'}</span>
                    <span><span className="font-medium">Phone:</span> {patient.phone || 'N/A'}</span>
                  </div>
                </div>
              </div>
              
              {/* Close Button */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowContactModal(true)}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <HiPhone className="h-4 w-4" />
                  <span>Contact</span>
                </button>
                <button
                  onClick={() => {
                    // Export patient summary
                    alert('Export feature coming soon!');
                  }}
                  className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  <HiDownload className="h-4 w-4" />
                  <span>Export</span>
                </button>
                <button
                  onClick={() => setShowDeactivateModal(true)}
                  className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  <HiBan className="h-4 w-4" />
                  <span>Deactivate</span>
                </button>
                {onClose ? (
                  <button
                    onClick={onClose}
                    className="flex items-center space-x-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                  >
                    <HiX className="h-4 w-4" />
                    <span>Close</span>
                  </button>
                ) : (
                  <Link 
                    to="/admin/patients" 
                    className="flex items-center space-x-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                  >
                    <HiX className="h-4 w-4" />
                    <span>Close</span>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Modal Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className="bg-white">
              {/* Tab Navigation */}
              <nav className="flex gap-4 border-b border-gray-200 px-6">
                <button 
                  className={`py-3 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'personal' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`} 
                  onClick={() => setActiveTab('personal')}
                >
                  <HiUser className="inline h-4 w-4 mr-1" />
                  Personal
                </button>
                <button 
                  className={`py-3 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'family' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`} 
                  onClick={() => setActiveTab('family')}
                >
                  <HiUserGroup className="inline h-4 w-4 mr-1" />
                  Family
                </button>
                <button 
                  className={`py-3 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'appointments' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`} 
                  onClick={() => setActiveTab('appointments')}
                >
                  <HiCalendar className="inline h-4 w-4 mr-1" />
                  Appointments
                </button>
                <button 
                  className={`py-3 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'payments' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`} 
                  onClick={() => setActiveTab('payments')}
                >
                  <HiReceiptRefund className="inline h-4 w-4 mr-1" />
                  Payments
                </button>
                <button 
                  className={`py-3 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'feedback' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`} 
                  onClick={() => setActiveTab('feedback')}
                >
                  <HiChatAlt2 className="inline h-4 w-4 mr-1" />
                  Feedback
                </button>
              </nav>

              {/* Tab Content */}
              <div className="p-4">
                {activeTab === 'personal' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <HiUser className="h-5 w-5 mr-2 text-blue-600" />
                        Personal Information
                      </h3>
                  
                      {/* Basic Information */}
                      <div className="mb-6">
                        <h4 className="text-md font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">Basic Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                            <div className="flex items-center space-x-2 mb-2">
                              <HiUser className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-semibold text-blue-800">Full Name</span>
                            </div>
                            <p className="text-md font-bold text-gray-900">{patient.name}</p>
                          </div>
                      
                          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-sm font-semibold text-green-800">Patient ID</span>
                            </div>
                            <p className="text-md font-mono font-bold text-gray-900">{patient.patientId}</p>
                          </div>
                          
                          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-sm font-semibold text-purple-800">Gender</span>
                            </div>
                            <p className="text-md font-bold text-gray-900 capitalize">{patient.gender || 'Not specified'}</p>
                          </div>
                          
                          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-sm font-semibold text-orange-800">Age</span>
                            </div>
                            <p className="text-md font-bold text-gray-900">{patient.age || 'Not specified'}</p>
                          </div>
                          
                          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
                            <div className="flex items-center space-x-2 mb-2">
                              <HiHeart className="h-4 w-4 text-red-600" />
                              <span className="text-sm font-semibold text-red-800">Blood Group</span>
                            </div>
                            <p className="text-md font-bold text-gray-900">{patient.bloodGroup || 'Not specified'}</p>
                          </div>
                          
                          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-sm font-semibold text-gray-800">Registration Date</span>
                            </div>
                            <p className="text-md font-bold text-gray-900">
                              {patient.createdAt ? new Date(patient.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              }) : 'Not available'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Contact Information */}
                      <div className="mb-6">
                        <h4 className="text-md font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">Contact Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                            <div className="flex items-center space-x-2 mb-2">
                              <HiPhone className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-semibold text-blue-800">Phone Number</span>
                            </div>
                            <p className="text-md font-bold text-gray-900">{patient.phone || 'Not provided'}</p>
                          </div>
                          
                          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                            <div className="flex items-center space-x-2 mb-2">
                              <HiMail className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-semibold text-green-800">Email Address</span>
                            </div>
                            <p className="text-md font-bold text-gray-900">{patient.email || 'Not provided'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Address */}
                      <div className="mb-6">
                        <h4 className="text-md font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">Address</h4>
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center space-x-2 mb-2">
                            <HiLocationMarker className="h-4 w-4 text-gray-600" />
                            <span className="text-sm font-semibold text-gray-800">Full Address</span>
                          </div>
                          <p className="text-gray-900 whitespace-pre-wrap font-medium">
                            {patient.address || 'No address provided'}
                          </p>
                        </div>
                      </div>

                      {/* Medical Information */}
                      <div className="mb-6">
                        <h4 className="text-md font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">Medical Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-sm font-semibold text-yellow-800">Allergies</span>
                            </div>
                            <p className="text-gray-900 font-medium">{patient.allergies || 'None reported'}</p>
                          </div>
                          
                          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-sm font-semibold text-red-800">Medical Conditions</span>
                            </div>
                            <p className="text-gray-900 font-medium">{patient.medicalConditions || 'None reported'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Emergency Contact */}
                      <div className="mb-6">
                        <h4 className="text-md font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">Emergency Contact</h4>
                        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
                          {patient.emergencyContact && typeof patient.emergencyContact === 'object' ? (
                            <div className="space-y-2">
                              <p className="text-gray-900 font-medium">
                                <span className="font-semibold">Name:</span> {patient.emergencyContact.name || 'N/A'}
                              </p>
                              <p className="text-gray-900 font-medium">
                                <span className="font-semibold">Phone:</span> {patient.emergencyContact.phone || 'N/A'}
                              </p>
                              <p className="text-gray-900 font-medium">
                                <span className="font-semibold">Relation:</span> {patient.emergencyContact.relation || 'N/A'}
                              </p>
                            </div>
                          ) : (
                            <p className="text-gray-900 font-medium">
                              {patient.emergencyContact || 'No emergency contact provided'}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'family' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <HiUserGroup className="h-5 w-5 mr-2 text-blue-600" />
                        Family Members
                      </h3>
                      
                      {family.length > 0 ? (
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Family Member</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Relationship</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {family.map((member, index) => (
                                  <tr key={member.id || index} className="hover:bg-blue-50 transition-colors">
                                    <td className="px-6 py-5 whitespace-nowrap">
                                      <div className="flex items-center">
                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                          <span className="text-sm font-bold text-white">
                                            {member.name ? member.name.charAt(0).toUpperCase() : 'F'}
                                          </span>
                                        </div>
                                        <div className="ml-4">
                                          <div className="text-sm font-semibold text-gray-900">{member.name || 'Unknown'}</div>
                                          <div className="text-xs text-gray-500">ID: {member.id}</div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                      <span className="inline-flex px-3 py-1 text-xs font-semibold bg-purple-100 text-purple-800 rounded-full border border-purple-200">
                                        {member.relation || 'Family Member'}
                                      </span>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                      <div className="text-sm font-semibold text-gray-900">{member.age || 'N/A'}</div>
                                      <div className="text-xs text-gray-500 capitalize">{member.gender || 'N/A'}</div>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                      <div className="text-sm font-semibold text-gray-900">{member.phone || 'N/A'}</div>
                                      <div className="text-xs text-gray-500">{member.email || 'N/A'}</div>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${
                                        member.status === 'active' 
                                          ? 'bg-green-100 text-green-800 border-green-200' 
                                          : 'bg-red-100 text-red-800 border-red-200'
                                      }`}>
                                        {member.status === 'active' ? 'Active' : 'Inactive'}
                                      </span>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap text-sm font-medium">
                                      <div className="flex space-x-2">
                                        <button className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md text-xs font-medium transition-colors">
                                          View Profile
                                        </button>
                                        <button className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-md text-xs font-medium transition-colors">
                                          View Appointments
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <HiUserGroup className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No Family Members</h3>
                          <p className="text-gray-500">This patient has no linked family members.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'appointments' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <HiCalendar className="h-5 w-5 mr-2 text-blue-600" />
                        Appointment History
                      </h3>
                      
                      {/* Upcoming Appointments */}
                      {history?.upcoming && history.upcoming.length > 0 && (
                        <div className="mb-8">
                          <h4 className="text-md font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">Upcoming Appointments</h4>
                          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-blue-50">
                                  <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Token</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {history.upcoming.map((appointment, index) => (
                                    <tr key={appointment._id || index} className="hover:bg-blue-50 transition-colors">
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-bold text-gray-900">
                                          {appointment.token || `AP${String(index + 1).padStart(3, '0')}`}
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-semibold text-gray-900">
                                          {appointment.date ? new Date(appointment.date).toLocaleDateString() : 'N/A'}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {appointment.time || 'Time not specified'}
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-semibold text-gray-900">{appointment.doctorName || 'Dr. Unknown'}</div>
                                        <div className="text-xs text-gray-500">{appointment.doctorSpecialization || 'General'}</div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-semibold text-gray-900">{appointment.department || 'General'}</div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full border border-blue-200">
                                          {appointment.type || 'OPD'}
                                        </span>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex px-3 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded-full border border-yellow-200">
                                          {appointment.status || 'Scheduled'}
                                        </span>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex space-x-2">
                                          <button className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md text-xs font-medium transition-colors">
                                            View Details
                                          </button>
                                          <button className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-md text-xs font-medium transition-colors">
                                            Reschedule
                                          </button>
                                          <button className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md text-xs font-medium transition-colors">
                                            Cancel
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Completed Appointments */}
                      {history?.past && history.past.length > 0 && (
                        <div className="mb-8">
                          <h4 className="text-md font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">Completed Appointments</h4>
                          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-green-50">
                                  <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Token</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {history.past.map((appointment, index) => (
                                    <tr key={appointment._id || index} className="hover:bg-green-50 transition-colors">
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-bold text-gray-900">
                                          {appointment.token || `AP${String(index + 1).padStart(3, '0')}`}
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-semibold text-gray-900">
                                          {appointment.date ? new Date(appointment.date).toLocaleDateString() : 'N/A'}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {appointment.time || 'Time not specified'}
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-semibold text-gray-900">{appointment.doctorName || 'Dr. Unknown'}</div>
                                        <div className="text-xs text-gray-500">{appointment.doctorSpecialization || 'General'}</div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-semibold text-gray-900">{appointment.department || 'General'}</div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full border border-blue-200">
                                          {appointment.type || 'OPD'}
                                        </span>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex px-3 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full border border-green-200">
                                          {appointment.status || 'Completed'}
                                        </span>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md text-xs font-medium transition-colors">
                                          View Details
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* No Appointments */}
                      {(!history?.upcoming || history.upcoming.length === 0) && (!history?.past || history.past.length === 0) && (
                        <div className="text-center py-12">
                          <HiCalendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No Appointments</h3>
                          <p className="text-gray-500">This patient has no appointment history.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'payments' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <HiReceiptRefund className="h-5 w-5 mr-2 text-blue-600" />
                        Payment History
                      </h3>
                      
                      {/* Payment Summary */}
                      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6 border border-blue-200 mb-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-6">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-600">{payments.items.length}</div>
                              <div className="text-sm text-gray-600">Total Payments</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-green-600">
                                ₹{payments.items.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)}
                              </div>
                              <div className="text-sm text-gray-600">Total Amount</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {payments.items.length > 0 ? (
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Appointment ID</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Method</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {payments.items.map((payment, index) => (
                                  <tr key={payment.id || index} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm font-semibold text-gray-900">
                                        {payment.date ? new Date(payment.date).toLocaleDateString() : 'N/A'}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {payment.date ? new Date(payment.date).toLocaleTimeString() : 'N/A'}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm font-mono font-bold text-gray-900">
                                        {payment.txn || `TXN${String(index + 1).padStart(3, '0')}`}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-lg font-bold text-gray-900">
                                        {payment.appointmentId}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-lg font-bold text-gray-900">
                                        ₹{payment.amount || '0'}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className="inline-flex px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full border border-blue-200 capitalize">
                                        {payment.method || 'UPI'}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${
                                        payment.status === 'completed' || payment.status === 'success'
                                          ? 'bg-green-100 text-green-800 border-green-200'
                                          : payment.status === 'pending'
                                          ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                          : 'bg-red-100 text-red-800 border-red-200'
                                      }`}>
                                        {payment.status === 'completed' || payment.status === 'success' ? 'Paid' : 
                                         payment.status === 'pending' ? 'Pending' : 'Failed'}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                      <button className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md text-xs font-medium transition-colors">
                                        View Receipt
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <HiReceiptRefund className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No Payment History</h3>
                          <p className="text-gray-500">This patient has no payment records.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'feedback' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <HiChatAlt2 className="h-5 w-5 mr-2 text-blue-600" />
                        Feedback & Complaints
                      </h3>
                      
                      {feedback.items.length > 0 ? (
                        <div className="space-y-4">
                          {feedback.items.map((feedbackItem, index) => (
                            <div key={feedbackItem.id || index} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                  <h4 className="text-lg font-bold text-gray-900 mb-2">
                                    {feedbackItem.subject || feedbackItem.type || 'Patient Feedback'}
                                  </h4>
                                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                                    <span className="inline-flex px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full border border-blue-200 capitalize">
                                      {feedbackItem.type || 'General'}
                                    </span>
                                    <span className="flex items-center">
                                      <HiClock className="h-4 w-4 mr-1" />
                                      {feedbackItem.date ? new Date(feedbackItem.date).toLocaleDateString() : 'N/A'}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${
                                    feedbackItem.status === 'resolved'
                                      ? 'bg-green-100 text-green-800 border-green-200'
                                      : feedbackItem.status === 'in_progress'
                                      ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                      : 'bg-red-100 text-red-800 border-red-200'
                                  }`}>
                                    {feedbackItem.status === 'resolved' ? 'Resolved' : 
                                     feedbackItem.status === 'in_progress' ? 'In Progress' : 'Pending'}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="mb-4">
                                <p className="text-gray-700 leading-relaxed">
                                  {feedbackItem.message || 'No message provided'}
                                </p>
                              </div>
                              
                              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                <div className="text-xs text-gray-500">
                                  Submitted on {feedbackItem.date ? new Date(feedbackItem.date).toLocaleString() : 'Unknown date'}
                                </div>
                                <div className="flex space-x-2">
                                  <button className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md text-xs font-medium transition-colors">
                                    View Details
                                  </button>
                                  {feedbackItem.status !== 'resolved' && (
                                    <button className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-md text-xs font-medium transition-colors">
                                      Mark Resolved
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <HiChatAlt2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No Feedback</h3>
                          <p className="text-gray-500">This patient has not submitted any feedback or complaints.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Patient Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20" onClick={() => setShowContactModal(false)}></div>
          <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Contact Patient</h3>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Method</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="phone">Phone Call</option>
                    <option value="sms">SMS</option>
                    <option value="email">Email</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <textarea 
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your message..."
                  ></textarea>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowContactModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Contact feature coming soon!');
                  setShowContactModal(false);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Account Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20" onClick={() => setShowDeactivateModal(false)}></div>
          <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Deactivate Account</h3>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <HiBan className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h4 className="text-md font-semibold text-gray-900">Are you sure?</h4>
                    <p className="text-sm text-gray-600">This will deactivate {patient.name}'s account</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reason for deactivation</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500">
                    <option value="">Select a reason</option>
                    <option value="violation">Policy violation</option>
                    <option value="request">Patient request</option>
                    <option value="inactive">Account inactive</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Additional notes</label>
                  <textarea 
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Optional notes..."
                  ></textarea>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowDeactivateModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert('Deactivate feature coming soon!');
                  setShowDeactivateModal(false);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Deactivate Account
              </button>
            </div>
          </div>
        </div>
      )}
    </ErrorBoundary>
  );
}