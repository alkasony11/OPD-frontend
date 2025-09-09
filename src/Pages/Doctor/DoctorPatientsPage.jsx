import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiArrowLeft, HiUser, HiPhone, HiMail, HiEye, HiDocumentText, HiSearch } from 'react-icons/hi';
import axios from 'axios';
import PatientDetailsModal from '../../Components/Doctor/PatientDetailsModal';
import DoctorSidebar from '../../Components/Doctor/Sidebar';

export default function DoctorPatientsPage() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPatientModal, setShowPatientModal] = useState(false);

  useEffect(() => {
    checkDoctorAuth();
  }, []);

  useEffect(() => {
    if (loading) {
      fetchPatients();
    }
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

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        console.error('No token found');
        return;
      }

      const response = await axios.get('http://localhost:5001/api/doctor/patients', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPatients(response.data.patients || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (patient.condition && patient.condition.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Follow-up Required':
        return 'bg-yellow-100 text-yellow-800';
      case 'Inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DoctorSidebar />
      <div className="flex-1 ml-64">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/doctor/dashboard')}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                >
                  <HiArrowLeft className="h-5 w-5" />
                  <span>Back to Dashboard</span>
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
                  <p className="text-gray-600">Manage your patient records</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <HiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search patients by name, email, or condition..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <HiUser className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Patients</p>
                <p className="text-3xl font-extrabold text-gray-900">{patients.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <HiUser className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Patients</p>
                <p className="text-3xl font-extrabold text-gray-900">
                  {patients.filter(p => p.status === 'Active').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <HiUser className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Follow-up Required</p>
                <p className="text-3xl font-extrabold text-gray-900">
                  {patients.filter(p => p.status === 'Follow-up Required').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Patients List */}
        <div className="bg-white shadow-sm rounded-lg">
          {filteredPatients.length === 0 ? (
            <div className="text-center py-12">
              <HiUser className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {searchTerm ? 'No patients found' : 'No patients yet'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'Try adjusting your search terms.' : 'Patients will appear here once they book appointments with you.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredPatients.map((patient) => (
                <div key={patient._id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <HiUser className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-lg font-medium text-gray-900 truncate">
                            {patient.name}
                          </p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(patient.status)}`}>
                            {patient.status}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <HiMail className="h-4 w-4" />
                            <span>{patient.email}</span>
                          </div>
                          {patient.phone && (
                            <div className="flex items-center space-x-1">
                              <HiPhone className="h-4 w-4" />
                              <span>{patient.phone}</span>
                            </div>
                          )}
                        </div>
                        {patient.condition && (
                          <p className="mt-1 text-sm text-gray-600">
                            <strong>Condition:</strong> {patient.condition}
                          </p>
                        )}
                        {patient.lastVisit && (
                          <p className="mt-1 text-sm text-gray-600">
                            <strong>Last Visit:</strong> {new Date(patient.lastVisit).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedPatient(patient);
                          setShowPatientModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                        title="View Patient Details"
                      >
                        <HiEye className="h-5 w-5" />
                        <span>View Details</span>
                      </button>
                      <button
                        className="text-green-600 hover:text-green-900 flex items-center space-x-1"
                        title="View Medical Records"
                      >
                        <HiDocumentText className="h-5 w-5" />
                        <span>Records</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Patient Details Modal */}
      {showPatientModal && selectedPatient && (
        <PatientDetailsModal
          patient={selectedPatient}
          onClose={() => {
            setShowPatientModal(false);
            setSelectedPatient(null);
          }}
        />
      )}
      </div>
    </div>
  );
}