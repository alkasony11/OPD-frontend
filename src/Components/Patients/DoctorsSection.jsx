import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiArrowRight, HiClock, HiCurrencyRupee } from 'react-icons/hi';
import axios from 'axios';

export default function DoctorsSection() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/patient/doctors');
      setDoctors(response.data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  // Show all doctors on landing page (no filtering)
  const filteredDoctors = doctors;

  const handleDoctorClick = (doctorId) => {
    navigate(`/doctors/${doctorId}`);
  };

  const handleBookAppointment = (doctorId, e) => {
    e.stopPropagation();
    
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
      // Redirect to login page if not logged in
      navigate('/login');
      return;
    }
    
    navigate(`/booking?doctor=${doctorId}`);
  };

  return (
    <div className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-block bg-gray-100 text-gray-600 text-sm font-medium px-4 py-2 rounded-full mb-4">
            Our Expert Doctors
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Meet Our Medical Team</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Highly qualified and experienced medical professionals dedicated to providing exceptional healthcare services.
          </p>
        </div>


        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
          </div>
        ) : (
          <>
            {/* Doctors Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredDoctors.length === 0 ? (
                <div className="col-span-full text-center py-16">
                  <div className="text-gray-500 text-lg font-medium">No doctors available at the moment.</div>
                  <p className="text-gray-400 mt-2">Please check back later or contact us for more information.</p>
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
                        <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                          {doctor.profile_photo ? (
                            <img
                              src={doctor.profile_photo}
                              alt={doctor.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-600 flex items-center justify-center text-white text-2xl font-bold">
                              {doctor.name.charAt(0).toUpperCase()}
                            </div>
                          )}
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

            {/* View All Doctors Button */}
            {filteredDoctors.length > 0 && (
              <div className="text-center mt-12">
                <button
                  onClick={() => navigate('/doctors')}
                  className="inline-flex items-center px-8 py-3 bg-white border-2 border-gray-800 text-gray-800 font-semibold rounded-lg hover:bg-gray-800 hover:text-white transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  View All Doctors
                  <HiArrowRight className="ml-2 w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
