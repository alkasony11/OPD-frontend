import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiArrowRight, HiStar, HiClock, HiCurrencyRupee } from 'react-icons/hi';
import axios from 'axios';
import { API_CONFIG } from '../../config/urls';

export default function DoctorProfilesPage() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [departments, setDepartments] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDoctors();
    fetchDepartments();
  }, []);

  const fetchDoctors = async () => {
    try {
      console.log('🔍 Fetching doctors from:', `${API_CONFIG.BASE_URL}/api/patient/doctors`);
      const response = await axios.get(`${API_CONFIG.BASE_URL}/api/patient/doctors`);
      console.log('✅ Doctors API response:', response.data);
      console.log('📊 Number of doctors:', Array.isArray(response.data) ? response.data.length : 'Not an array');
      setDoctors(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('❌ Error fetching doctors:', error);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(`${API_CONFIG.BASE_URL}/api/patient/departments`);
      setDepartments(response.data.departments || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const filteredDoctors = (doctors || []).filter(doctor => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctor.doctor_info?.specialization?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Enhanced department filtering - check multiple possible ID fields
    let matchesDepartment = true;
    if (selectedDepartment) {
      const doctorDeptId = doctor.doctor_info?.department?._id || 
                          doctor.doctor_info?.department?.id ||
                          doctor.doctor_info?.department;
      
      matchesDepartment = doctorDeptId === selectedDepartment;
    }
    
    return matchesSearch && matchesDepartment;
  });

  const handleDoctorClick = (doctorId) => {
    navigate(`/doctors/${doctorId}`);
  };

  const handleBookAppointment = (doctorId, e) => {
    e.stopPropagation();
    navigate(`/booking?doctor=${doctorId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="inline-block bg-gray-100 text-gray-600 text-sm font-medium px-4 py-2 rounded-full mb-4">
              Our Expert Doctors
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Meet Our Medical Team</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Highly qualified and experienced medical professionals dedicated to providing exceptional healthcare services.
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search Input */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search Doctors
              </label>
              <input
                type="text"
                id="search"
                placeholder="Search by name or specialization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all duration-200"
              />
            </div>

            {/* Department Filter */}
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Department
              </label>
              <select
                id="department"
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all duration-200"
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Doctors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDoctors.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <div className="text-gray-500 text-lg font-medium">No doctors found matching your criteria.</div>
              <p className="text-gray-400 mt-2">Try adjusting your search or filter options.</p>
            </div>
          ) : (
            filteredDoctors.map((doctor) => (
              <div
                key={doctor._id}
                onClick={() => handleDoctorClick(doctor._id)}
                className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group"
              >
                <div className="p-6">
                  {/* Doctor Photo */}
                  <div className="flex justify-center mb-4">
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                      {doctor.profile_photo || doctor.profileImage ? (
                        <img
                          src={doctor.profile_photo || doctor.profileImage}
                          alt={doctor.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className={`w-full h-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold ${doctor.profile_photo || doctor.profileImage ? 'hidden' : 'flex'}`}>
                        {doctor.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                  </div>

                  {/* Doctor Info */}
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-gray-700 transition-colors duration-200">{doctor.name}</h3>
                    <p className="text-sm text-gray-600 font-medium mb-1">
                      {doctor.doctor_info?.department?.name || 'General Medicine'}
                    </p>
                    <p className="text-sm text-gray-500 mb-3">
                      {doctor.doctor_info?.specialization || 'General Practitioner'}
                    </p>
                    
                    {/* Experience and Fee */}
                    <div className="flex items-center justify-center space-x-4 text-sm text-gray-500 mb-3">
                      <div className="flex items-center">
                        <HiClock className="w-4 h-4 mr-1" />
                        <span>{doctor.doctor_info?.experience_years || 0} years</span>
                      </div>
                      <div className="flex items-center">
                        <HiCurrencyRupee className="w-4 h-4 mr-1" />
                        <span>₹{doctor.doctor_info?.consultation_fee || 500}</span>
                      </div>
                    </div>
                  </div>

                  {/* Book Appointment Button */}
                  <button
                    onClick={(e) => handleBookAppointment(doctor._id, e)}
                    className="w-full bg-gray-800 text-white py-2 px-4 rounded-lg hover:bg-gray-900 transition-colors duration-200 flex items-center justify-center font-medium"
                  >
                    Book Appointment
                    <HiArrowRight className="ml-2 w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
