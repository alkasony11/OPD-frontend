import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiArrowLeft, HiUser, HiUsers, HiDocumentText, HiSearch, HiEye, HiCalendar, HiClock, HiMail, HiPhone, HiCheckCircle, HiArrowRight } from 'react-icons/hi';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import DoctorSidebar from '../../Components/Doctor/Sidebar';
import PatientDetailsModal from '../../Components/Doctor/PatientDetailsModal';

export default function DoctorHistoryPage() {
  const navigate = useNavigate();
  const [consultedPatients, setConsultedPatients] = useState([]);
  const [referredPatients, setReferredPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [activeTab, setActiveTab] = useState('consulted'); // 'consulted' or 'referred'

  useEffect(() => {
    checkDoctorAuth();
    fetchHistoryData();
  }, []);

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

  const fetchHistoryData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch consulted patients (completed appointments)
      const consultedResponse = await axios.get(`${API_BASE_URL}/api/doctor/appointments?filter=completed`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Fetch referred patients
      const referredResponse = await axios.get(`${API_BASE_URL}/api/doctor/appointments?filter=referred`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setConsultedPatients(consultedResponse.data.appointments || []);
      setReferredPatients(referredResponse.data.appointments || []);
    } catch (error) {
      console.error('Error fetching history data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openPatientModal = (patient) => {
    setSelectedPatient(patient);
    setShowPatientModal(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getFilteredPatients = (patients) => {
    if (!searchTerm) return patients;
    return patients.filter(patient => 
      patient.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.patient_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.symptoms?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex">
      <DoctorSidebar />
      <div className="flex-1 ml-64">
        {/* Professional Header */}
        <div className="bg-white shadow-lg border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-6 sm:py-8 space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <button
                  onClick={() => navigate('/doctor/dashboard')}
                  className="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200"
                >
                  <HiArrowLeft className="h-5 w-5 text-gray-600" />
                </button>
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 bg-gray-800 rounded-lg flex items-center justify-center">
                    <HiDocumentText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Patient History</h1>
                    <p className="text-base sm:text-lg text-gray-600 mt-1">View consultation history and medical records</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg">
                  <HiDocumentText className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {consultedPatients.length + referredPatients.length} Total Records
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Enhanced Search */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <HiSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search patients by name, email, or symptoms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200 text-lg"
                />
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-2">
              <nav className="flex space-x-2">
                <button
                  onClick={() => setActiveTab('consulted')}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                    activeTab === 'consulted'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  <HiCheckCircle className="h-4 w-4" />
                  <span>Consulted Patients ({consultedPatients.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab('referred')}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                    activeTab === 'referred'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  <HiArrowRight className="h-4 w-4" />
                  <span>Referred Patients ({referredPatients.length})</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-lg shadow border border-gray-200">
            {activeTab === 'consulted' ? (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Consulted Patients</h2>
                  <span className="text-sm text-gray-500">
                    {getFilteredPatients(consultedPatients).length} patients
                    </span>
                </div>

                {getFilteredPatients(consultedPatients).length === 0 ? (
                  <div className="text-center py-12">
                    <HiUser className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No consulted patients found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            SI No.
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Patient Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Time
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Symptoms
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                    {getFilteredPatients(consultedPatients).map((patient, index) => (
                          <tr key={patient._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {index + 1}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-8 w-8">
                                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                    <HiUser className="h-4 w-4 text-gray-600" />
                                  </div>
                            </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{patient.patient_name}</div>
                                  <div className="text-sm text-gray-500">{patient.patientEmail}</div>
                            </div>
                          </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(patient.booking_date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatTime(patient.time_slot)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {patient.symptoms || 'Not provided'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                            Completed
                          </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => openPatientModal(patient)}
                                className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                        >
                                <HiEye className="h-4 w-4" />
                                <span>View</span>
                        </button>
                            </td>
                          </tr>
                    ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Referred Patients</h2>
                  <span className="text-sm text-gray-500">
                    {getFilteredPatients(referredPatients).length} patients
                    </span>
                </div>

                {getFilteredPatients(referredPatients).length === 0 ? (
                  <div className="text-center py-12">
                    <HiArrowRight className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No referred patients found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            SI No.
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Patient Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Time
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Symptoms
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                    {getFilteredPatients(referredPatients).map((patient, index) => (
                          <tr key={patient._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {index + 1}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-8 w-8">
                                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                    <HiUser className="h-4 w-4 text-gray-600" />
                                  </div>
                            </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{patient.patient_name}</div>
                                  <div className="text-sm text-gray-500">{patient.patientEmail}</div>
                            </div>
                          </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(patient.booking_date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatTime(patient.time_slot)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {patient.symptoms || 'Not provided'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                            Referred
                          </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => openPatientModal(patient)}
                                className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                        >
                                <HiEye className="h-4 w-4" />
                                <span>View</span>
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
          </div>
        </div>
      </div>

      {/* Patient Details Modal */}
      {showPatientModal && selectedPatient && (
        <PatientDetailsModal
          patient={selectedPatient}
          onClose={() => setShowPatientModal(false)}
        />
      )}
    </div>
  );
}
