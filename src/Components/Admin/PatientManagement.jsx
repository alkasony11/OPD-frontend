import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  HiUser, HiMail, HiPhone, HiCalendar, HiSearch, HiFilter, 
  HiEye, HiPencil, HiBan, HiCheckCircle, HiX, HiDownload,
  HiUserGroup, HiClock, HiExclamation, HiDocumentText
} from 'react-icons/hi';
import { UserCircleIcon } from '@heroicons/react/24/outline';

export default function PatientManagement() {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPatientDetails, setShowPatientDetails] = useState(false);
  const [patientHistory, setPatientHistory] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('all'); // all, id, name, phone
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, blocked
  const [familyFilter, setFamilyFilter] = useState('all'); // all, family, individual
  const [appointmentFilter, setAppointmentFilter] = useState('all'); // all, with_appointments, without_appointments
  
  // Action states
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [editData, setEditData] = useState({});
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [patients, searchTerm, searchType, statusFilter, familyFilter, appointmentFilter]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/api/admin/patients', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPatients(response.data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...patients];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(patient => {
        switch (searchType) {
          case 'id':
            return patient.patientId?.toLowerCase().includes(searchTerm.toLowerCase());
          case 'name':
            return patient.name?.toLowerCase().includes(searchTerm.toLowerCase());
          case 'phone':
            return patient.phone?.includes(searchTerm);
          default:
            return (
              patient.patientId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              patient.phone?.includes(searchTerm) ||
              patient.email?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(patient => {
        if (statusFilter === 'active') return !patient.isBlocked;
        if (statusFilter === 'blocked') return patient.isBlocked;
        return true;
      });
    }

    // Family filter
    if (familyFilter !== 'all') {
      filtered = filtered.filter(patient => {
        if (familyFilter === 'family') return patient.hasFamilyMembers;
        if (familyFilter === 'individual') return !patient.hasFamilyMembers;
        return true;
      });
    }

    // Appointment filter
    if (appointmentFilter !== 'all') {
      filtered = filtered.filter(patient => {
        if (appointmentFilter === 'with_appointments') return patient.hasAppointments;
        if (appointmentFilter === 'without_appointments') return !patient.hasAppointments;
        return true;
      });
    }

    setFilteredPatients(filtered);
  };

  const fetchPatientDetails = async (patientId) => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch patient details
      const patientResponse = await axios.get(`http://localhost:5001/api/admin/patients/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Fetch patient history
      const historyResponse = await axios.get(`http://localhost:5001/api/admin/patients/${patientId}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Fetch family members
      const familyResponse = await axios.get(`http://localhost:5001/api/admin/patients/${patientId}/family`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSelectedPatient(patientResponse.data);
      setPatientHistory(historyResponse.data);
      setFamilyMembers(familyResponse.data.familyMembers || []);
      setShowPatientDetails(true);
    } catch (error) {
      console.error('Error fetching patient details:', error);
    }
  };

  const handleBlockPatient = async () => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      
      await axios.put(`http://localhost:5001/api/admin/patients/${selectedPatient.patientId}/block`, {
        reason: blockReason,
        blocked: true
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local state
      setPatients(prev => prev.map(p => 
        p.patientId === selectedPatient.patientId 
          ? { ...p, isBlocked: true, blockReason }
          : p
      ));
      
      setShowBlockModal(false);
      setBlockReason('');
      alert('Patient blocked successfully');
    } catch (error) {
      console.error('Error blocking patient:', error);
      alert('Failed to block patient');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnblockPatient = async () => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      
      await axios.put(`http://localhost:5001/api/admin/patients/${selectedPatient.patientId}/block`, {
        blocked: false
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local state
      setPatients(prev => prev.map(p => 
        p.patientId === selectedPatient.patientId 
          ? { ...p, isBlocked: false, blockReason: '' }
          : p
      ));
      
      alert('Patient unblocked successfully');
    } catch (error) {
      console.error('Error unblocking patient:', error);
      alert('Failed to unblock patient');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditPatient = async () => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      
      await axios.put(`http://localhost:5001/api/admin/patients/${selectedPatient.patientId}`, editData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local state
      setPatients(prev => prev.map(p => 
        p.patientId === selectedPatient.patientId 
          ? { ...p, ...editData }
          : p
      ));
      
      setShowEditModal(false);
      alert('Patient updated successfully');
    } catch (error) {
      console.error('Error updating patient:', error);
      alert('Failed to update patient');
    } finally {
      setActionLoading(false);
    }
  };

  const exportPatientData = () => {
    const csvContent = [
      ['Patient ID', 'Name', 'Email', 'Phone', 'Status', 'Account Type', 'Relation', 'Registration Date', 'Block Reason'],
      ...filteredPatients.map(patient => [
        patient.patientId,
        patient.name,
        patient.email,
        patient.phone,
        patient.isBlocked ? 'Blocked' : 'Active',
        patient.isMainAccount ? 'Main Account' : 'Family Member',
        patient.relation || '',
        new Date(patient.createdAt).toLocaleDateString(),
        patient.blockReason || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patients_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportSinglePatient = async (patient) => {
    try {
      const token = localStorage.getItem('token');
      const url = `http://localhost:5001/api/admin/patients/${patient.patientId}/history/export?includeFamily=true`;
      const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` }, responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `patient_${patient.patientId}_history.csv`;
      link.click();
      window.URL.revokeObjectURL(link.href);
    } catch (e) {
      console.error('Export failed', e);
      alert('Failed to export history');
    }
  };

  const getStatusColor = (isBlocked) => {
    return isBlocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
  };

  const getBlockCount = (patient) => {
    return patient.blockHistory?.length || 0;
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
          <h2 className="text-2xl font-bold text-gray-900">Patient Management</h2>
          <p className="text-gray-600">Search, view, and manage patient accounts</p>
        </div>
        <button
          onClick={exportPatientData}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <HiDownload className="h-4 w-4 mr-2" />
          Export Data
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search patients..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Search Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search By</label>
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Fields</option>
              <option value="id">Patient ID</option>
              <option value="name">Name</option>
              <option value="phone">Mobile Number</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Patients</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
        </div>

        {/* Additional Filters */}
        <div className="mt-4 flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
            <select
              value={familyFilter}
              onChange={(e) => setFamilyFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Accounts</option>
              <option value="family">Family Accounts</option>
              <option value="individual">Individual Accounts</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Appointments</label>
            <select
              value={appointmentFilter}
              onChange={(e) => setAppointmentFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Patients</option>
              <option value="with_appointments">With Appointments</option>
              <option value="without_appointments">Without Appointments</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {filteredPatients.length} of {patients.length} patients
        </p>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPatients.map((patient) => (
                <tr key={patient.patientId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {patient.profilePhoto || patient.profile_photo ? (
                          <img
                            src={(patient.profilePhoto || patient.profile_photo).startsWith('http') 
                              ? (patient.profilePhoto || patient.profile_photo)
                              : `http://localhost:5001${patient.profilePhoto || patient.profile_photo}`
                            }
                            alt={patient.name}
                            className="h-10 w-10 rounded-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'block';
                            }}
                          />
                        ) : null}
                        <UserCircleIcon className={`h-10 w-10 text-gray-400 ${(patient.profilePhoto || patient.profile_photo) ? 'hidden' : 'block'}`} />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                        <div className="text-sm text-gray-500">ID: {patient.patientId}</div>
                        <div className="flex items-center gap-2 text-xs">
                          {patient.hasFamilyMembers && (
                            <span className="flex items-center text-blue-600">
                              <HiUserGroup className="h-3 w-3 mr-1" />
                              Family Account
                            </span>
                          )}
                          {!patient.isMainAccount && (
                            <span className="flex items-center text-purple-600">
                              <HiUser className="h-3 w-3 mr-1" />
                              Family Member
                            </span>
                          )}
                          {patient.relation && (
                            <span className="text-gray-500">({patient.relation})</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{patient.email}</div>
                    <div className="text-sm text-gray-500">{patient.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(patient.isBlocked)}`}>
                        {patient.isBlocked ? 'Blocked' : 'Active'}
                      </span>
                      {getBlockCount(patient) >= 3 && (
                        <HiExclamation className="h-4 w-4 text-red-500 ml-2" title="Blocked 3+ times" />
                      )}
                    </div>
                    {patient.isBlocked && patient.blockReason && (
                      <div className="text-xs text-red-600 mt-1">Reason: {patient.blockReason}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(patient.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => fetchPatientDetails(patient.isMainAccount ? patient.patientId : patient.parentPatientId)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <HiEye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPatient(patient);
                          setEditData({
                            name: patient.name,
                            email: patient.email,
                            phone: patient.phone
                          });
                          setShowEditModal(true);
                        }}
                        className="text-green-600 hover:text-green-900"
                        title="Edit Patient"
                      >
                        <HiPencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPatient(patient);
                          setShowBlockModal(true);
                        }}
                        className={patient.isBlocked ? "text-green-600 hover:text-green-900" : "text-red-600 hover:text-red-900"}
                        title={patient.isBlocked ? "Unblock Patient" : "Block Patient"}
                      >
                        {patient.isBlocked ? <HiCheckCircle className="h-4 w-4" /> : <HiBan className="h-4 w-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Patient Details Modal */}
      {showPatientDetails && selectedPatient && (
        <PatientDetailsModal
          patient={selectedPatient}
          history={patientHistory}
          familyMembers={familyMembers}
          onClose={() => setShowPatientDetails(false)}
          onBlock={() => {
            setShowPatientDetails(false);
            setShowBlockModal(true);
          }}
          onUnblock={handleUnblockPatient}
          onEdit={() => {
            setShowPatientDetails(false);
            setEditData({
              name: selectedPatient.name,
              email: selectedPatient.email,
              phone: selectedPatient.phone
            });
            setShowEditModal(true);
          }}
          onExportSingle={() => exportSinglePatient(selectedPatient)}
          onSwitchPatient={(pid) => fetchPatientDetails(pid)}
        />
      )}

      {/* Block Patient Modal */}
      {showBlockModal && selectedPatient && (
        <BlockPatientModal
          patient={selectedPatient}
          reason={blockReason}
          onReasonChange={setBlockReason}
          onConfirm={handleBlockPatient}
          onCancel={() => {
            setShowBlockModal(false);
            setBlockReason('');
          }}
          loading={actionLoading}
        />
      )}

      {/* Edit Patient Modal */}
      {showEditModal && selectedPatient && (
        <EditPatientModal
          patient={selectedPatient}
          data={editData}
          onDataChange={setEditData}
          onConfirm={handleEditPatient}
          onCancel={() => {
            setShowEditModal(false);
            setEditData({});
          }}
          loading={actionLoading}
        />
      )}
    </div>
  );
}

// Patient Details Modal Component
function PatientDetailsModal({ patient, history, familyMembers, onClose, onBlock, onUnblock, onEdit, onExportSingle, onSwitchPatient }) {
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', name: 'Profile Info', icon: HiUser },
    { id: 'bookings', name: 'Bookings & History', icon: HiCalendar },
    { id: 'family', name: 'Family Members', icon: HiUserGroup },
    { id: 'blocks', name: 'Block History', icon: HiBan }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 h-16 w-16">
              {patient.profilePhoto || patient.profile_photo ? (
                <img
                  src={(patient.profilePhoto || patient.profile_photo).startsWith('http') 
                    ? (patient.profilePhoto || patient.profile_photo)
                    : `http://localhost:5001${patient.profilePhoto || patient.profile_photo}`
                  }
                  alt={patient.name}
                  className="h-16 w-16 rounded-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
              ) : null}
              <UserCircleIcon className={`h-16 w-16 text-gray-400 ${(patient.profilePhoto || patient.profile_photo) ? 'hidden' : 'block'}`} />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{patient.name}</h3>
              <p className="text-sm text-gray-500">Patient ID: {patient.patientId}</p>
              <div className="flex items-center mt-1">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  patient.isBlocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                }`}>
                  {patient.isBlocked ? 'Blocked' : 'Active'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <HiX className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4 inline mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-96">
          {activeTab === 'profile' && (
            <ProfileTab patient={patient} />
          )}
          {activeTab === 'bookings' && (
            <BookingsTab history={history} patient={patient} />
          )}
          {activeTab === 'family' && (
            <FamilyTab familyMembers={familyMembers} patient={patient} onSwitchPatient={onSwitchPatient} />
          )}
          {activeTab === 'blocks' && (
            <BlockHistoryTab patient={patient} />
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between space-x-3">
          <button
            onClick={onExportSingle}
            className="flex items-center px-3 py-2 text-gray-700 hover:text-gray-900"
          >
            <HiDownload className="h-4 w-4 mr-2" /> Export History
          </button>
          <button
            onClick={onEdit}
            className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            Edit Patient
          </button>
          {patient.isBlocked ? (
            <button
              onClick={onUnblock}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Unblock Patient
            </button>
          ) : (
            <button
              onClick={onBlock}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Block Patient
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Profile Tab Component
function ProfileTab({ patient }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h4>
        <dl className="space-y-3">
          <div>
            <dt className="text-sm font-medium text-gray-500">Full Name</dt>
            <dd className="text-sm text-gray-900">{patient.name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Patient ID</dt>
            <dd className="text-sm text-gray-900 font-mono">{patient.patientId}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Age / Gender</dt>
            <dd className="text-sm text-gray-900 flex items-center gap-2">
              <span>{patient.age || 'N/A'} / {patient.gender || 'N/A'}</span>
              {isHighRisk(patient) && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  High Risk
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Email</dt>
            <dd className="text-sm text-gray-900">{patient.email}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Phone</dt>
            <dd className="text-sm text-gray-900">{patient.phone}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Registration Date</dt>
            <dd className="text-sm text-gray-900">{new Date(patient.createdAt).toLocaleDateString()}</dd>
          </div>
        </dl>
      </div>
      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-4">Account Status</h4>
        <dl className="space-y-3">
          <div>
            <dt className="text-sm font-medium text-gray-500">Status</dt>
            <dd className="text-sm">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                patient.isBlocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
              }`}>
                {patient.isBlocked ? 'Blocked' : 'Active'}
              </span>
            </dd>
          </div>
          {patient.isBlocked && patient.blockReason && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Block Reason</dt>
              <dd className="text-sm text-red-600">{patient.blockReason}</dd>
            </div>
          )}
          <div>
            <dt className="text-sm font-medium text-gray-500">Account Type</dt>
            <dd className="text-sm text-gray-900">
              {patient.hasFamilyMembers ? 'Family Account' : 'Individual Account'}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

// Bookings Tab Component
function BookingsTab({ history, patient }) {
  if (!history) return <div>Loading history...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-4">Upcoming Appointments</h4>
        {history.upcoming?.length > 0 ? (
          <div className="space-y-3">
            {history.upcoming.map((appointment) => (
              <div key={appointment.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{appointment.doctorName}</p>
                    <p className="text-sm text-gray-500">{appointment.departmentName}</p>
                    {appointment.familyMemberName && (
                      <p className="text-xs text-purple-600 mt-1">
                        Booked for: {appointment.familyMemberName} {appointment.familyMemberRelation ? `(${appointment.familyMemberRelation})` : ''}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{appointment.appointmentDate}</p>
                    <p className="text-sm text-gray-500">{appointment.appointmentTime}</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {appointment.status}
                    </span>
                    <div className="mt-2 flex items-center justify-end gap-2">
                      <RescheduleButton patient={patient} appointment={appointment} />
                      <CancelButton patient={patient} appointment={appointment} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No upcoming appointments</p>
        )}
      </div>

      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-4">Past Appointments</h4>
        {history.past?.length > 0 ? (
          <div className="space-y-3">
            {history.past.map((appointment) => (
              <div key={appointment.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{appointment.doctorName}</p>
                    <p className="text-sm text-gray-500">{appointment.departmentName}</p>
                    {appointment.familyMemberName && (
                      <p className="text-xs text-purple-600 mt-1">
                        Booked for: {appointment.familyMemberName} {appointment.familyMemberRelation ? `(${appointment.familyMemberRelation})` : ''}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{appointment.appointmentDate}</p>
                    <p className="text-sm text-gray-500">{appointment.outcome || 'Completed'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No past appointments</p>
        )}
      </div>

      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-4">Cancellations & Reschedules</h4>
        {history.cancellations?.length > 0 ? (
          <div className="space-y-3">
            {history.cancellations.map((cancellation) => (
              <div key={cancellation.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Cancelled Appointment</p>
                    <p className="text-sm text-gray-500">{cancellation.reason}</p>
                    {cancellation.familyMemberName && (
                      <p className="text-xs text-purple-600 mt-1">
                        Booked for: {cancellation.familyMemberName} {cancellation.familyMemberRelation ? `(${cancellation.familyMemberRelation})` : ''}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{cancellation.cancelledDate}</p>
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                      Cancelled
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No cancellations</p>
        )}
      </div>
    </div>
  );
}

function BlockHistoryTab({ patient }) {
  const history = patient.blockHistory || [];
  if (!history.length) return <p className="text-gray-500">No block history</p>;
  return (
    <div className="space-y-3">
      {history.map((item, idx) => (
        <div key={idx} className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-900">{item.reason || 'No reason provided'}</p>
              <p className="text-xs text-gray-500">By: {item.blockedBy || 'N/A'}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">{item.blockedAt ? new Date(item.blockedAt).toLocaleString() : ''}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function isHighRisk(patient) {
  const age = Number(patient.age || 0);
  const chronic = (patient.chronicConditions || '').trim().length > 0;
  return age >= 65 || chronic;
}

function RescheduleButton({ patient, appointment }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5001/api/admin/patients/${patient.patientId}/appointments/${appointment.id}/reschedule`, {
        appointmentDate: date,
        appointmentTime: time
      }, { headers: { Authorization: `Bearer ${token}` }});
      alert('Rescheduled');
      setOpen(false);
    } catch (e) {
      console.error(e);
      alert('Failed to reschedule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inline-block">
      <button onClick={() => setOpen(true)} className="px-2 py-1 text-blue-600 hover:text-blue-800 text-xs">Reschedule</button>
      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-4">
            <h4 className="font-medium mb-3">Reschedule Appointment</h4>
            <div className="space-y-3">
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2 border rounded" />
              <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full px-3 py-2 border rounded" />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="px-3 py-1 text-gray-600">Close</button>
              <button onClick={submit} disabled={loading || !date || !time} className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-50">{loading ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CancelButton({ patient, appointment }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5001/api/admin/patients/${patient.patientId}/appointments/${appointment.id}/cancel`, {
        reason
      }, { headers: { Authorization: `Bearer ${token}` }});
      alert('Cancelled');
      setOpen(false);
    } catch (e) {
      console.error(e);
      alert('Failed to cancel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inline-block">
      <button onClick={() => setOpen(true)} className="px-2 py-1 text-red-600 hover:text-red-800 text-xs">Cancel</button>
      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-4">
            <h4 className="font-medium mb-3">Cancel Appointment</h4>
            <textarea value={reason} onChange={e => setReason(e.target.value)} className="w-full px-3 py-2 border rounded" rows="3" placeholder="Reason (optional)" />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setOpen(false)} className="px-3 py-1 text-gray-600">Close</button>
              <button onClick={submit} disabled={loading} className="px-3 py-1 bg-red-600 text-white rounded disabled:opacity-50">{loading ? 'Cancelling...' : 'Confirm'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// Family Tab Component
function FamilyTab({ familyMembers, patient, onSwitchPatient }) {
  return (
    <div>
      <h4 className="text-lg font-medium text-gray-900 mb-4">Family Members</h4>
      {familyMembers.length > 0 ? (
        <div className="space-y-3">
          {familyMembers.map((member) => (
            <div key={member.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{member.name}</p>
                  <p className="text-sm text-gray-500">Patient ID: {member.patientId}</p>
                  <p className="text-sm text-gray-500">Relation: {member.relation}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">{member.phone}</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    member.isBlocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {member.isBlocked ? 'Blocked' : 'Active'}
                  </span>
                  <div className="mt-2 flex items-center justify-end gap-2">
                    <button
                      onClick={() => onSwitchPatient(member.patientId)}
                      className="px-2 py-1 text-blue-600 hover:text-blue-800 text-xs"
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No family members</p>
      )}
      <div className="mt-4">
        <button
          onClick={async () => {
            try {
              const token = localStorage.getItem('token');
              const url = `http://localhost:5001/api/admin/patients/${patient.patientId}/history/export?includeFamily=true`;
              const response = await axios.get(url, { headers: { Authorization: `Bearer ${token}` }, responseType: 'blob' });
              const blob = new Blob([response.data], { type: 'text/csv' });
              const link = document.createElement('a');
              link.href = window.URL.createObjectURL(blob);
              link.download = `family_${patient.patientId}_history.csv`;
              link.click();
              window.URL.revokeObjectURL(link.href);
            } catch (e) {
              console.error('Export failed', e);
              alert('Failed to export family history');
            }
          }}
          className="flex items-center px-3 py-2 text-gray-700 hover:text-gray-900"
        >
          <HiDownload className="h-4 w-4 mr-2" /> Export Family History
        </button>
      </div>
    </div>
  );
}

// Block Patient Modal Component
function BlockPatientModal({ patient, reason, onReasonChange, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Block Patient</h3>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-gray-600 mb-4">
            Are you sure you want to block <strong>{patient.name}</strong> (ID: {patient.patientId})?
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reason for blocking</label>
            <textarea
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder="Enter reason for blocking this patient..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              rows="3"
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-700"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading || !reason.trim()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Blocking...' : 'Block Patient'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Edit Patient Modal Component
function EditPatientModal({ patient, data, onDataChange, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Edit Patient</h3>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input
              type="text"
              value={data.name || ''}
              onChange={(e) => onDataChange({ ...data, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={data.email || ''}
              onChange={(e) => onDataChange({ ...data, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <input
              type="tel"
              value={data.phone || ''}
              onChange={(e) => onDataChange({ ...data, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-700"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}