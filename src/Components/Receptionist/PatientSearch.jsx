import { useState, useEffect } from 'react';
import { HiSearch, HiUser, HiPhone, HiMail, HiCalendar, HiEye } from 'react-icons/hi';
import { API_CONFIG } from '../../config/urls';

export default function PatientSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPatientDetails, setShowPatientDetails] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.length < 2) {
      setError('Search query must be at least 2 characters');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/receptionist/patients/search?query=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to search patients');
      }

      const data = await response.json();
      setPatients(data.patients || []);
    } catch (error) {
      console.error('Error searching patients:', error);
      setError('Failed to search patients');
    } finally {
      setLoading(false);
    }
  };

  const viewPatientDetails = async (patientId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/receptionist/patients/${patientId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch patient details');
      }

      const data = await response.json();
      setSelectedPatient(data);
      setShowPatientDetails(true);
    } catch (error) {
      console.error('Error fetching patient details:', error);
      alert('Failed to fetch patient details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getAge = (dob) => {
    if (!dob) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <HiSearch className="h-6 w-6 text-green-600" />
          <h2 className="text-xl font-semibold text-gray-900">Patient Search</h2>
        </div>
      </div>

      {/* Search Form */}
      <div className="p-6 border-b border-gray-200">
        <form onSubmit={handleSearch} className="flex space-x-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or phone number..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
        {error && (
          <div className="mt-2 text-sm text-red-600">{error}</div>
        )}
      </div>

      {/* Search Results */}
      <div className="p-6">
        {patients.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Search Results ({patients.length} found)
            </h3>
            <div className="space-y-3">
              {patients.map((patient) => (
                <div
                  key={patient._id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-green-100 p-2 rounded-full">
                        <HiUser className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{patient.name}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <HiMail className="h-4 w-4" />
                            <span>{patient.email}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <HiPhone className="h-4 w-4" />
                            <span>{patient.phone || 'N/A'}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <HiCalendar className="h-4 w-4" />
                            <span>Age: {getAge(patient.dob)}</span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {patient.familyMembersCount} family members • {patient.recentAppointments.length} recent appointments
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => viewPatientDetails(patient._id)}
                      className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <HiEye className="h-4 w-4" />
                      <span>View Details</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : searchQuery && !loading ? (
          <div className="text-center py-8 text-gray-500">
            No patients found matching your search criteria
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Enter a search query to find patients
          </div>
        )}
      </div>

      {/* Patient Details Modal */}
      {showPatientDetails && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Patient Details</h3>
                <button
                  onClick={() => setShowPatientDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Patient Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h4>
                  <div className="space-y-2">
                    <div><span className="font-medium">Name:</span> {selectedPatient.patient.name}</div>
                    <div><span className="font-medium">Email:</span> {selectedPatient.patient.email}</div>
                    <div><span className="font-medium">Phone:</span> {selectedPatient.patient.phone || 'N/A'}</div>
                    <div><span className="font-medium">Date of Birth:</span> {formatDate(selectedPatient.patient.dob)}</div>
                    <div><span className="font-medium">Age:</span> {getAge(selectedPatient.patient.dob)}</div>
                    <div><span className="font-medium">Gender:</span> {selectedPatient.patient.gender || 'N/A'}</div>
                    <div><span className="font-medium">Family Members:</span> {selectedPatient.patient.familyMembers.length}</div>
                    <div><span className="font-medium">Total Appointments:</span> {selectedPatient.patient.totalAppointments}</div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Family Members</h4>
                  {selectedPatient.patient.familyMembers.length > 0 ? (
                    <div className="space-y-2">
                      {selectedPatient.patient.familyMembers.map((member, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg">
                          <div className="font-medium">{member.name}</div>
                          <div className="text-sm text-gray-600">
                            {member.relation} • Age: {member.age} • {member.gender}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500">No family members registered</div>
                  )}
                </div>
              </div>

              {/* Appointment History */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Appointment History</h4>
                {selectedPatient.appointments.length > 0 ? (
                  <div className="space-y-3">
                    {selectedPatient.appointments.slice(0, 10).map((appointment) => (
                      <div key={appointment._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{appointment.doctorName}</div>
                            <div className="text-sm text-gray-600">
                              {formatDate(appointment.appointmentDate)} at {appointment.timeSlot}
                            </div>
                            <div className="text-sm text-gray-600">
                              Token: {appointment.tokenNumber} • Department: {appointment.department}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                              appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              appointment.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {appointment.status}
                            </span>
                            <div className="text-sm text-gray-600 mt-1">
                              {appointment.paymentStatus}
                            </div>
                          </div>
                        </div>
                        {appointment.symptoms && (
                          <div className="mt-2 text-sm text-gray-600">
                            <span className="font-medium">Symptoms:</span> {appointment.symptoms}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500">No appointment history</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
