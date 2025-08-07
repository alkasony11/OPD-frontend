import { useState, useEffect } from 'react';
import { HiChevronDown, HiChevronUp } from 'react-icons/hi';
import axios from 'axios';

export default function UserManagement() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState([]);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/api/admin/patients', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPatients(response.data);
    } catch (error) {
      console.error('Error fetching patients:', error);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const toggleExpand = (id) => {
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800">All Registered Patients</h3>
        <p className="text-sm text-gray-600">View all registered users and their complete details</p>
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expand</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {patients.map((patient) => (
                <>
                  <tr key={patient._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button onClick={() => toggleExpand(patient._id)} className="text-black focus:outline-none">
                        {expandedRows.includes(patient._id) ? <HiChevronUp /> : <HiChevronDown />}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center gap-2">
                      {patient.profileImage && (
                        <img src={patient.profileImage} alt={patient.name} className="w-8 h-8 rounded-full object-cover" />
                      )}
                      {patient.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(patient.createdAt)}</td>
                  </tr>
                  {expandedRows.includes(patient._id) && (
                    <tr className="bg-gray-50">
                      <td colSpan={5} className="px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                          <div>
                            <span className="font-semibold text-black">DOB:</span>
                            <span className="ml-2 text-gray-700">{formatDate(patient.dob)}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-black">Gender:</span>
                            <span className="ml-2 text-gray-700">{patient.gender || '-'}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-black">Address:</span>
                            <span className="ml-2 text-gray-700">{patient.address || '-'}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-black">Emergency Contact:</span>
                            <span className="ml-2 text-gray-700">{patient.emergencyContact || '-'}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-black">Verified:</span>
                            <span className={`ml-2 text-xs font-semibold rounded-full px-2 py-1 ${patient.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{patient.isVerified ? 'Yes' : 'No'}</span>
                          </div>
                        </div>
                        <div className="mb-2">
                          <span className="font-semibold text-black">Auth Provider:</span>
                          <span className="ml-2 text-gray-700">{patient.authProvider || 'local'}</span>
                        </div>
                        <div className="mb-2">
                          <span className="font-semibold text-black">Clerk ID:</span>
                          <span className="ml-2 text-gray-700">{patient.clerkId || 'Not applicable'}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-black">Last Updated:</span>
                          <span className="ml-2 text-gray-700">{formatDate(patient.updatedAt)}</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
