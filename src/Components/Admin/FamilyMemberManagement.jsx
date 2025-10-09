import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  HiUsers, HiEye, HiBan, HiCheckCircle,
  HiSearch, HiFilter, HiDownload, HiRefresh, HiUser, HiCalendar,
  HiMail, HiPhone, HiHeart, HiExclamation, HiX,
  HiUserGroup, HiDocumentText, HiArrowLeft, HiArrowRight
} from 'react-icons/hi';

export default function FamilyMemberManagement() {
  const [familyMembers, setFamilyMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [relationFilter, setRelationFilter] = useState('all');
  const [parentPatientFilter, setParentPatientFilter] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMembers, setTotalMembers] = useState(0);

  useEffect(() => {
    fetchFamilyMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [familyMembers, searchTerm, statusFilter, relationFilter, parentPatientFilter]);

  const fetchFamilyMembers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      params.append('page', String(currentPage));
      params.append('limit', String(pageSize));
      if (searchTerm) params.append('search', searchTerm);

      const response = await axios.get(`http://localhost:5001/api/admin/family-members?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const { familyMembers: items, total, totalPages: tPages } = response.data || {};
      setFamilyMembers(items || []);
      setTotalMembers(total || 0);
      setTotalPages(tPages || 1);
    } catch (error) {
      console.error('Error fetching family members:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...familyMembers];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(member => 
        statusFilter === 'active' ? member.isActive : !member.isActive
      );
    }

    // Relation filter
    if (relationFilter !== 'all') {
      filtered = filtered.filter(member => member.relation === relationFilter);
    }

    // Parent patient filter
    if (parentPatientFilter) {
      filtered = filtered.filter(member => member.parentPatient?._id === parentPatientFilter);
    }

    setFilteredMembers(filtered);
  };

  const handleViewDetails = (member) => {
    setSelectedMember(member);
    setShowDetailsModal(true);
  };

  const handleToggleStatus = async (memberId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5001/api/admin/family-members/${memberId}/status`, {
        isActive: !currentStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setFamilyMembers(familyMembers.map(member => 
        member._id === memberId 
          ? { ...member, isActive: !currentStatus }
          : member
      ));
    } catch (error) {
      console.error('Error updating member status:', error);
      alert('Error updating member status');
    }
  };

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <HiCheckCircle className="w-3 h-3 mr-1" />
        Active
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <HiBan className="w-3 h-3 mr-1" />
        Inactive
      </span>
    );
  };

  const getRelationBadge = (relation) => {
    const relationConfig = {
      spouse: { color: 'bg-pink-100 text-pink-800', label: 'Spouse' },
      child: { color: 'bg-blue-100 text-blue-800', label: 'Child' },
      parent: { color: 'bg-purple-100 text-purple-800', label: 'Parent' },
      sibling: { color: 'bg-green-100 text-green-800', label: 'Sibling' },
      grandparent: { color: 'bg-yellow-100 text-yellow-800', label: 'Grandparent' },
      grandchild: { color: 'bg-indigo-100 text-indigo-800', label: 'Grandchild' },
      other: { color: 'bg-gray-100 text-gray-800', label: 'Other' }
    };
    
    const config = relationConfig[relation] || relationConfig.other;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const exportToCSV = () => {
    const csvData = filteredMembers.map(member => ({
      'Patient ID': member.patientId || 'N/A',
      'Name': member.name || 'N/A',
      'Age': member.age || 'N/A',
      'Gender': member.gender || 'N/A',
      'Relation': member.relation || 'N/A',
      'Phone': member.phone || 'N/A',
      'Blood Group': member.bloodGroup || 'N/A',
      'Allergies': member.allergies || 'N/A',
      'Chronic Conditions': member.chronicConditions || 'N/A',
      'Parent Patient': member.parentPatient?.name || 'N/A',
      'Parent Email': member.parentPatient?.email || 'N/A',
      'Status': member.isActive ? 'Active' : 'Inactive',
      'Created At': new Date(member.createdAt).toLocaleString(),
      'Updated At': new Date(member.updatedAt).toLocaleString()
    }));

    if (csvData.length === 0) return;

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `family-members-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setCurrentPage(1);
    await fetchFamilyMembers();
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
            <h1 className="text-2xl font-bold text-gray-900">Family Member Management</h1>
            <p className="text-gray-600 mt-1">View and manage status of patient-linked family members</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={fetchFamilyMembers}
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

        {/* Filters */}
        <form className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6" onSubmit={handleSearch}>
          <div className="relative md:col-span-2">
            <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, patient code, relation..."
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
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={relationFilter}
            onChange={(e) => setRelationFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Relations</option>
            <option value="spouse">Spouse</option>
            <option value="child">Child</option>
            <option value="parent">Parent</option>
            <option value="sibling">Sibling</option>
            <option value="grandparent">Grandparent</option>
            <option value="grandchild">Grandchild</option>
            <option value="other">Other</option>
          </select>

          <div className="text-sm text-gray-600 flex items-center">
            <HiFilter className="w-4 h-4 mr-1" />
            {filteredMembers.length} of {totalMembers} members
          </div>
        </form>

        {/* Family Members List */}
        <div className="space-y-4">
          {filteredMembers.length === 0 ? (
            <div className="text-center py-12">
              <HiUserGroup className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No family members found</h3>
              <p className="mt-1 text-sm text-gray-500">Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            filteredMembers.map((member) => (
              <div key={member._id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {member.name}
                      </h3>
                      <span className="text-sm text-gray-500">({member.patientId})</span>
                      {getRelationBadge(member.relation)}
                      {getStatusBadge(member.isActive)}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <HiUser className="w-4 h-4 mr-2" />
                        {member.age} years, {member.gender}
                      </div>
                      {member.phone && (
                        <div className="flex items-center">
                          <HiPhone className="w-4 h-4 mr-2" />
                          {member.phone}
                        </div>
                      )}
                      {member.bloodGroup && (
                        <div className="flex items-center">
                          <HiHeart className="w-4 h-4 mr-2" />
                          {member.bloodGroup}
                        </div>
                      )}
                      {member.parentPatient?.name && (
                        <div className="flex items-center">
                          <HiUsers className="w-4 h-4 mr-2" />
                          Parent: {member.parentPatient.name}
                        </div>
                      )}
                    </div>
                    
                    {(member.allergies || member.chronicConditions) && (
                      <div className="mt-2 text-xs text-gray-500">
                        {member.allergies && (
                          <span className="mr-4">
                            <HiExclamation className="inline w-3 h-3 mr-1" />
                            Allergies: {member.allergies}
                          </span>
                        )}
                        {member.chronicConditions && (
                          <span>
                            <HiDocumentText className="inline w-3 h-3 mr-1" />
                            Conditions: {member.chronicConditions}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleViewDetails(member)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="View Details"
                    >
                      <HiEye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(member._id, member.isActive)}
                      className={`p-2 transition-colors ${
                        member.isActive
                          ? 'text-gray-400 hover:text-red-600'
                          : 'text-gray-400 hover:text-green-600'
                      }`}
                      title={member.isActive ? 'Deactivate Member' : 'Activate Member'}
                    >
                      {member.isActive ? <HiBan className="w-4 h-4" /> : <HiCheckCircle className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-6">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <HiArrowLeft className="w-4 h-4" />
            </button>
            
            <span className="px-3 py-2 text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <HiArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold text-gray-900">Family Member Details</h2>
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
                    <p className="mt-1 text-sm text-gray-900">{selectedMember.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Patient ID</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedMember.patientId}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Age</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedMember.age} years</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Gender</label>
                    <p className="mt-1 text-sm text-gray-900 capitalize">{selectedMember.gender}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Relation</label>
                    <p className="mt-1 text-sm text-gray-900 capitalize">{selectedMember.relation}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedMember.phone || 'N/A'}</p>
                  </div>
                </div>

                {selectedMember.allergies && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Allergies</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedMember.allergies}</p>
                  </div>
                )}

                {selectedMember.chronicConditions && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Chronic Conditions</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedMember.chronicConditions}</p>
                  </div>
                )}

                {selectedMember.emergency_contact && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Emergency Contact</label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-900">
                        <strong>Name:</strong> {selectedMember.emergency_contact.name || 'N/A'}<br/>
                        <strong>Phone:</strong> {selectedMember.emergency_contact.phone || 'N/A'}<br/>
                        <strong>Relation:</strong> {selectedMember.emergency_contact.relation || 'N/A'}
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">Parent Patient</label>
                  <div className="mt-1 p-3 bg-blue-50 rounded-md">
                    <p className="text-sm text-gray-900">
                      <strong>Name:</strong> {selectedMember.parentPatient?.name || 'N/A'}<br/>
                      <strong>Email:</strong> {selectedMember.parentPatient?.email || 'N/A'}<br/>
                      <strong>Phone:</strong> {selectedMember.parentPatient?.phone || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedMember.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedMember.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
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
