import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  HiUser, HiMail, HiPhone, HiCalendar, HiSearch, HiFilter, 
  HiEye, HiPencil, HiBan, HiCheckCircle, HiX, HiDownload,
  HiUserGroup, HiClock, HiExclamation, HiDocumentText
} from 'react-icons/hi';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import PatientProfile from '../../Pages/Admin/PatientProfile';

export default function PatientManagement() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPatientDetails, setShowPatientDetails] = useState(false);
  const [patientHistory, setPatientHistory] = useState(null);
  const [showPatientProfile, setShowPatientProfile] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('all'); // all, id, name, phone
  const [statusFilter, setStatusFilter] = useState('all'); // legacy (patients)
  // simplified UI: hide extra filters by default
  const [departmentId, setDepartmentId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  // Appointments filters
  const [apptStatus, setApptStatus] = useState(''); // '', booked, confirmed, in_queue, consulted, cancelled
  const [apptDoctorId, setApptDoctorId] = useState('');
  
  // Directory extra filters
  const [ageRange, setAgeRange] = useState('all'); // all|0-12|13-17|18-39|40-59|60+
  const [registeredDate, setRegisteredDate] = useState('');
  
  // Action states
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [editData, setEditData] = useState({});
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchPatients();
    fetchFilters();
    fetchAppointments();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [patients, searchTerm, searchType, statusFilter, departmentId, doctorId, ageRange, registeredDate]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('${API_BASE_URL}/api/admin/patients', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = Array.isArray(response.data) ? response.data : (response.data?.patients || []);
      const onlyPatients = (data || []).filter((user) => {
        const role = typeof user.role === 'string' ? user.role.toLowerCase() : '';
        return role === 'patient' || user.isPatient === true;
      });
      setPatients(onlyPatients);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      const token = localStorage.getItem('token');
      const [deptRes, docRes] = await Promise.all([
        axios.get('${API_BASE_URL}/api/admin/departments', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('${API_BASE_URL}/api/admin/doctors', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setDepartments(deptRes.data?.departments || []);
      setDoctors((docRes.data || []).filter(d => d.role === 'doctor'));
    } catch (e) {
      console.error('Error loading filters', e);
    }
  };

  const fetchAppointments = async () => {
    try {
      setAppointmentsLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('${API_BASE_URL}/api/admin/appointments', {
        params: { limit: 200, status: apptStatus || undefined, doctorId: apptDoctorId || undefined },
        headers: { Authorization: `Bearer ${token}` }
      });
      const rows = res.data?.appointments || [];
      setAppointments(rows);
    } catch (e) {
      console.error('Error loading appointments', e);
      setAppointments([]);
    } finally {
      setAppointmentsLoading(false);
    }
  };

  useEffect(() => {
    // refetch on filter changes
    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apptStatus, apptDoctorId]);

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

    // Age filter
    if (ageRange !== 'all') {
      filtered = filtered.filter(p => {
        const a = Number(p.age || 0);
        if (ageRange === '0-12') return a >= 0 && a <= 12;
        if (ageRange === '13-17') return a >= 13 && a <= 17;
        if (ageRange === '18-39') return a >= 18 && a <= 39;
        if (ageRange === '40-59') return a >= 40 && a <= 59;
        if (ageRange === '60+') return a >= 60;
        return true;
      });
    }

    // Registered date filter
    if (registeredDate) {
      const start = new Date(registeredDate);
      start.setHours(0,0,0,0);
      const end = new Date(registeredDate);
      end.setHours(23,59,59,999);
      filtered = filtered.filter(p => {
        const created = new Date(p.createdAt);
        return created >= start && created <= end;
      });
    }

    // Department / Doctor filters for booked patients table (if these fields exist on rows)
    if (departmentId) {
      filtered = filtered.filter(p => (p.departmentId || p.department?._id) === departmentId);
    }
    if (doctorId) {
      filtered = filtered.filter(p => (p.doctorId || p.doctor?._id) === doctorId);
    }

    setFilteredPatients(filtered);
  };

  const fetchPatientDetails = async (patientId) => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch patient details
      const patientResponse = await axios.get(`${API_BASE_URL}/api/admin/patients/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Fetch patient history
      const historyResponse = await axios.get(`${API_BASE_URL}/api/admin/patients/${patientId}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Fetch family members
      const familyResponse = await axios.get(`${API_BASE_URL}/api/admin/patients/${patientId}/family`, {
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
      
      await axios.put(`${API_BASE_URL}/api/admin/patients/${selectedPatient.patientId}/block`, {
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
      
      await axios.put(`${API_BASE_URL}/api/admin/patients/${selectedPatient.patientId}/block`, {
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
      
      await axios.put(`${API_BASE_URL}/api/admin/patients/${selectedPatient.patientId}`, editData, {
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
      ['SI No', 'Name', 'Email', 'Phone', 'Status', 'Account Type', 'Relation', 'Registration Date', 'Block Reason'],
      ...filteredPatients.map((patient, index) => [
        index + 1,
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
      const url = `${API_BASE_URL}/api/admin/patients/${patient.patientId}/history/export?includeFamily=true`;
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

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by ID, name, phone, email"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="all">All Accounts</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
          <div className="flex gap-2">
            <select value={ageRange} onChange={e=>setAgeRange(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option value="all">All Ages</option>
              <option value="0-12">0-12</option>
              <option value="13-17">13-17</option>
              <option value="18-39">18-39</option>
              <option value="40-59">40-59</option>
              <option value="60+">60+</option>
            </select>
          </div>
          <div>
            <input type="date" value={registeredDate} onChange={e=>setRegisteredDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sl. No.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500">No patients</td>
                </tr>
              )}
              {filteredPatients.map((p, index) => (
                <tr key={p._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">{p.patientId || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{p.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{p.email || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{p.phone || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${p.isBlocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>{p.isBlocked ? 'Blocked' : 'Active'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="inline-flex gap-2">
                      <button
                        onClick={() => {
                          const id = p.patientId || p.regId || p._id;
                          console.log('🔍 Patient Management - Patient data:', p);
                          console.log('🔍 Patient Management - Using ID:', id);
                          if (!id) return;
                          setSelectedPatientId(id);
                          setShowPatientProfile(true);
                        }}
                        className="px-3 py-1.5 bg-gray-900 text-white rounded hover:bg-gray-800 disabled:opacity-50"
                        disabled={!p.patientId && !p.regId && !p._id}
                      >
                        View Profile
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

      {/* Patient Profile Modal */}
      {showPatientProfile && selectedPatientId && (
        <PatientProfile 
          patientId={selectedPatientId}
          onClose={() => {
            setShowPatientProfile(false);
            setSelectedPatientId(null);
          }}
        />
      )}
    </div>
  );
}

// Patient Details Modal Component
function PatientDetailsModal({ patient, history, familyMembers, onClose, onBlock, onUnblock, onEdit, onExportSingle, onSwitchPatient }) {
  const [activeTab, setActiveTab] = useState('upcoming');

  const tabs = [
    { id: 'upcoming', name: 'Upcoming', icon: HiCalendar },
    { id: 'past', name: 'Past', icon: HiClock }
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
                    : `${API_BASE_URL}${patient.profilePhoto || patient.profile_photo}`
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

        {/* Profile Card + Quick Actions */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className="mr-4">Age: {patient.age || 'N/A'}</span>
            <span className="mr-4">Gender: {patient.gender || 'N/A'}</span>
            <span>Mobile: {patient.phone || '-'}</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {familyMembers?.map(m => (
                <span key={m.patientId} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-800">
                  {m.relation || 'Member'}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onEdit} className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700">Edit</button>
            {patient.isBlocked ? (
              <button onClick={onUnblock} className="px-3 py-1 text-sm bg-green-600 text-white rounded">Unblock</button>
            ) : (
              <button onClick={onBlock} className="px-3 py-1 text-sm bg-red-600 text-white rounded">Block</button>
            )}
            <button onClick={onExportSingle} className="px-3 py-1 text-sm text-gray-700 hover:text-gray-900">Export</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
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
          {activeTab === 'upcoming' && (
            <BookingsTab history={{ upcoming: history?.upcoming || [], past: [] }} patient={patient} />
          )}
          {activeTab === 'past' && (
            <BookingsTab history={{ upcoming: [], past: history?.past || [], cancellations: history?.cancellations || [] }} patient={patient} />
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

function RescheduleButton({ patient, appointment, onSuccess }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notify, setNotify] = useState(true);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/api/admin/patients/${patient.patientId}/appointments/${appointment.id}/reschedule`, {
        appointmentDate: date,
        appointmentTime: time,
        notify
      }, { headers: { Authorization: `Bearer ${token}` }});
      alert('Rescheduled');
      setOpen(false);
      onSuccess && onSuccess();
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100">
            <div className="px-5 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HiCalendar className="h-5 w-5" />
                <h4 className="font-semibold">Reschedule Appointment</h4>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white"><HiX className="h-5 w-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div className="p-3 rounded-lg bg-gray-50">
                  <div className="font-medium text-gray-900">{patient.name}</div>
                  <div className="text-gray-600">Doctor: {appointment.doctor} • Dept: {appointment.department}</div>
                  <div className="text-gray-600">Current: {appointment.date ? new Date(appointment.date).toLocaleDateString() : ''}{appointment.time ? `, ${appointment.time}` : ''}</div>
                </div>
                <div className="p-4 rounded-lg bg-gray-50 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Select New Date</label>
                      <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Select New Time</label>
                      <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={notify} onChange={e=>setNotify(e.target.checked)} className="rounded" />
                    Notify patient automatically
                  </label>
                </div>
              </div>
            </div>
            <div className="px-5 py-4 bg-gray-50 flex justify-end gap-2 border-t">
              <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100">Cancel</button>
              <button onClick={submit} disabled={loading || !date || !time} className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">{loading ? 'Saving...' : 'Save & Reschedule'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CancelButton({ patient, appointment, onSuccess }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [notify, setNotify] = useState(true);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/api/admin/patients/${patient.patientId}/appointments/${appointment.id}/cancel`, {
        reason,
        notify
      }, { headers: { Authorization: `Bearer ${token}` }});
      alert('Cancelled');
      setOpen(false);
      onSuccess && onSuccess();
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100">
            <div className="px-5 py-4 bg-gradient-to-r from-rose-600 to-red-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HiBan className="h-5 w-5" />
                <h4 className="font-semibold">Cancel Booking</h4>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white"><HiX className="h-5 w-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-3 rounded-lg bg-gray-50 text-sm text-gray-700">
                <div className="font-medium text-gray-900">{patient.name}</div>
                <div>ID: {appointment.id} • {appointment.date ? new Date(appointment.date).toLocaleDateString() : ''}{appointment.time ? `, ${appointment.time}` : ''}</div>
                <div>Doctor: {appointment.doctor} • Dept: {appointment.department}</div>
              </div>
              <div className="p-4 rounded-lg bg-rose-50/50 space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Reason for Cancellation</label>
                  <textarea value={reason} onChange={e => setReason(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500" rows="3" placeholder="Type your reason here..." />
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={notify} onChange={e=>setNotify(e.target.checked)} className="rounded" />
                  Notify patient automatically
                </label>
              </div>
            </div>
            <div className="px-5 py-4 bg-gray-50 flex justify-end gap-2 border-t">
              <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100">Close</button>
              <button onClick={submit} disabled={loading || !reason.trim()} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">{loading ? 'Cancelling...' : 'Confirm Cancel'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AssignDoctorButton({ patient, current, appointmentId, departments, onSuccess }) {
  const [open, setOpen] = useState(false);
  const [doctorId, setDoctorId] = useState('');
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [dept, setDept] = useState('');
  const [slot, setSlot] = useState('');
  const [date, setDate] = useState('');
  const [notify, setNotify] = useState(true);
  const [availableSlots, setAvailableSlots] = useState([]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('${API_BASE_URL}/api/admin/doctors', { headers: { Authorization: `Bearer ${token}` } });
        setDoctors(res.data || []);
        setDept(() => {
          const match = (departments || []).find(d => d.name === current.department);
          return match?._id || '';
        });
        // Prefill date with current appointment date if present
        if (current?.date) {
          const d = new Date(current.date);
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth()+1).padStart(2,'0');
          const dd = String(d.getDate()).padStart(2,'0');
          setDate(`${yyyy}-${mm}-${dd}`);
        }
      } catch (e) {
        setDoctors([]);
      }
    })();
  }, [open]);

  // Fetch available slots whenever doctor or date changes
  useEffect(() => {
    const fetchSlots = async () => {
      try {
        setAvailableSlots([]);
        if (!doctorId || !date) return;
        const token = localStorage.getItem('token');
        const startDate = date;
        const endDate = date;
        const res = await axios.get(`${API_BASE_URL}/api/admin/doctor-schedules/${doctorId}`, {
          params: { startDate, endDate },
          headers: { Authorization: `Bearer ${token}` }
        });
        const schedules = res.data?.schedules || [];
        if (!schedules.length) { setAvailableSlots([]); return; }
        const s = schedules[0];
        const slots = [];
        const pushRange = (start, end, stepMinutes) => {
          // Build times between start and end inclusive by step minutes
          const [sh, sm] = start.split(':').map(Number);
          const [eh, em] = end.split(':').map(Number);
          const startMinutes = sh*60 + sm;
          const endMinutes = eh*60 + em;
          for (let m = startMinutes; m < endMinutes; m += stepMinutes) {
            const hh = String(Math.floor(m/60)).padStart(2,'0');
            const mm2 = String(m%60).padStart(2,'0');
            slots.push(`${hh}:${mm2}`);
          }
        };
        const step = Number(s.slotDuration || 30);
        if (s.morningSession?.available !== false) {
          pushRange(s.morningSession?.start_time || '09:00', s.morningSession?.end_time || '13:00', step);
        }
        if (s.afternoonSession?.available !== false) {
          pushRange(s.afternoonSession?.start_time || '14:00', s.afternoonSession?.end_time || '18:00', step);
        }
        setAvailableSlots(slots);
        // Prefill slot from current appointment if matching
        if (current?.time && slots.includes(current.time)) {
          setSlot(current.time);
        } else {
          setSlot(slots[0] || '');
        }
      } catch (e) {
        setAvailableSlots([]);
      }
    };
    fetchSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId, date]);

  const submit = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/api/admin/patients/${patient.patientId || 'dummy'}/appointments/${appointmentId}/assign-doctor`, {
        doctorId,
        notify,
        appointmentDate: date,
        appointmentTime: slot
      }, { headers: { Authorization: `Bearer ${token}` } });
      // Note: backend validates ownership by appointment.patient_id, patientId segment isn't used; keep placeholder
      alert('Doctor assigned');
      setOpen(false);
      onSuccess && onSuccess();
    } catch (e) {
      console.error(e);
      alert('Failed to assign doctor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inline-block">
      <button onClick={() => setOpen(true)} className="px-2 py-1 text-indigo-600 hover:text-indigo-800 text-xs">Assign Doctor</button>
      {open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100">
            <div className="px-5 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HiPencil className="h-5 w-5" />
                <h4 className="font-semibold">Assign Another Doctor</h4>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white"><HiX className="h-5 w-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-3 rounded-lg bg-gray-50 text-sm text-gray-700">
                <div className="font-medium text-gray-900">{patient.name}</div>
                <div>Current Doctor: {current.doctor}</div>
              </div>
              <div className="p-4 rounded-lg bg-gray-50 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Department</label>
                    <select value={dept} onChange={e=>setDept(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500">
                      <option value="">Select department</option>
                      {(departments||[]).map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Select New Doctor</label>
                    <select value={doctorId} onChange={e=>setDoctorId(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500">
                      <option value="">Select doctor</option>
                      {doctors.filter(d => !dept || d.doctor_info?.department?._id === dept).map(d => (
                        <option key={d._id} value={d._id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Select Date</label>
                    <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Available Time Slot</label>
                    <select value={slot} onChange={e=>setSlot(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500">
                      <option value="">Select time slot</option>
                      {availableSlots.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={notify} onChange={e=>setNotify(e.target.checked)} className="rounded" />
                  Notify patient automatically
                </label>
              </div>
            </div>
            <div className="px-5 py-4 bg-gray-50 flex justify-end gap-2 border-t">
              <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100">Cancel</button>
              <button onClick={submit} disabled={loading || !doctorId} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">{loading ? 'Assigning...' : 'Assign Doctor'}</button>
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
                      onClick={() => {
                        setSelectedPatientId(member.patientId);
                        setShowPatientProfile(true);
                      }}
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
              const url = `${API_BASE_URL}/api/admin/patients/${patient.patientId}/history/export?includeFamily=true`;
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