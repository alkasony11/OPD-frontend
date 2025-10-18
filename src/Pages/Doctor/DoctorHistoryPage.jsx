import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiArrowLeft, HiUser, HiUsers, HiDocumentText, HiSearch, HiEye, HiCalendar, HiClock, HiMail, HiPhone, HiCheckCircle, HiArrowRight } from 'react-icons/hi';
import axios from 'axios';
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
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    
    if (!token || userRole !== 'doctor') {
      navigate('/login');
      return;
    }
  };

  const fetchHistoryData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch consulted patients (completed appointments)
      const consultedResponse = await axios.get('/api/doctor/appointments?status=completed', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Fetch referred patients
      const referredResponse = await axios.get('/api/doctor/appointments?status=referred', {
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
                  <div className="h-12 w-12 bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl flex items-center justify-center">
                    <HiDocumentText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Patient History</h1>
                    <p className="text-base sm:text-lg text-gray-600 mt-1">View consultation history and medical records</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl">
                  <HiDocumentText className="h-4 w-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-700">
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
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    activeTab === 'consulted'
                      ? 'bg-green-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <HiCheckCircle className="h-4 w-4" />
                  <span>Consulted Patients ({consultedPatients.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab('referred')}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    activeTab === 'referred'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <HiArrowRight className="h-4 w-4" />
                  <span>Referred Patients ({referredPatients.length})</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
            {activeTab === 'consulted' ? (
              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Consulted Patients</h2>
                  <div className="flex items-center space-x-2 px-4 py-2 bg-green-50 border border-green-200 rounded-xl">
                    <HiCheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">
                      {getFilteredPatients(consultedPatients).length} Patients
                    </span>
                  </div>
                </div>

                {getFilteredPatients(consultedPatients).length === 0 ? (
                  <div className="text-center py-12">
                    <HiUser className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No consulted patients found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {getFilteredPatients(consultedPatients).map((patient, index) => (
                      <div key={patient._id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                              <HiUser className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{patient.patient_name}</h3>
                              <p className="text-sm text-gray-500">Consultation completed</p>
                            </div>
                          </div>
                          <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                            Completed
                          </span>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <HiCalendar className="h-4 w-4" />
                            <span>{formatDate(patient.booking_date)}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <HiClock className="h-4 w-4" />
                            <span>{formatTime(patient.time_slot)}</span>
                          </div>
                          {patient.symptoms && (
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Symptoms:</span> {patient.symptoms}
                            </div>
                          )}
                          {patient.diagnosis && (
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Diagnosis:</span> {patient.diagnosis}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => openPatientModal(patient)}
                          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                        >
                          <HiDocumentText className="h-4 w-4" />
                          <span>View Medical Records</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Referred Patients</h2>
                  <div className="flex items-center space-x-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-xl">
                    <HiArrowRight className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-700">
                      {getFilteredPatients(referredPatients).length} Patients
                    </span>
                  </div>
                </div>

                {getFilteredPatients(referredPatients).length === 0 ? (
                  <div className="text-center py-12">
                    <HiArrowRight className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No referred patients found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {getFilteredPatients(referredPatients).map((patient, index) => (
                      <div key={patient._id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                              <HiUser className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{patient.patient_name}</h3>
                              <p className="text-sm text-gray-500">Referred to specialist</p>
                            </div>
                          </div>
                          <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                            Referred
                          </span>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <HiCalendar className="h-4 w-4" />
                            <span>{formatDate(patient.booking_date)}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <HiClock className="h-4 w-4" />
                            <span>{formatTime(patient.time_slot)}</span>
                          </div>
                          {patient.referredDoctor && (
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Referred to:</span> {patient.referredDoctor}
                            </div>
                          )}
                          {patient.symptoms && (
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Symptoms:</span> {patient.symptoms}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => openPatientModal(patient)}
                          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
                        >
                          <HiDocumentText className="h-4 w-4" />
                          <span>View Medical Records</span>
                        </button>
                      </div>
                    ))}
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
