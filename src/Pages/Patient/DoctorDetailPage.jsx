import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HiArrowLeft, HiStar, HiClock, HiCurrencyRupee, HiAcademicCap, HiBriefcase, HiMail, HiPhone, HiLocationMarker, HiCalendar } from 'react-icons/hi';
import axios from 'axios';
import { API_CONFIG } from '../../config/urls';

export default function DoctorDetailPage() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDoctorDetails();
  }, [doctorId]);

  const fetchDoctorDetails = async () => {
    try {
      const response = await axios.get(`${API_CONFIG.BASE_URL}/api/patient/doctors`);
      const doctorData = response.data.find(doc => doc._id === doctorId);
      
      if (doctorData) {
        setDoctor(doctorData);
      } else {
        setError('Doctor not found');
      }
    } catch (error) {
      console.error('Error fetching doctor details:', error);
      setError('Failed to load doctor details');
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = () => {
    navigate(`/booking?doctor=${doctorId}`);
  };

  const handleBackToDoctors = () => {
    navigate('/doctors');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Doctor Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The requested doctor could not be found.'}</p>
          <button
            onClick={handleBackToDoctors}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Doctors
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={handleBackToDoctors}
            className="flex items-center text-blue-100 hover:text-white mb-6 transition-colors group"
          >
            <HiArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Doctors
          </button>
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2">Doctor Profile</h1>
            <p className="text-blue-100">Detailed information about our medical professional</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Doctor Profile */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-8 sticky top-8 border border-gray-100">
              {/* Doctor Photo */}
              <div className="flex justify-center mb-8">
                <div className="w-36 h-36 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden ring-4 ring-blue-50 shadow-lg">
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
                  <div className={`w-full h-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-5xl font-bold ${doctor.profile_photo || doctor.profileImage ? 'hidden' : 'flex'}`}>
                    {doctor.name.charAt(0).toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Doctor Basic Info */}
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{doctor.name}</h1>
                <p className="text-lg text-blue-600 font-medium mb-1">
                  {doctor.doctor_info?.department?.name || 'General Medicine'}
                </p>
                <p className="text-gray-600 mb-4">
                  {doctor.doctor_info?.specialization || 'General Practitioner'}
                </p>

                {/* Quick Stats */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-center text-sm text-gray-600">
                    <HiClock className="w-4 h-4 mr-2" />
                    {doctor.doctor_info?.experience_years || 0} years of experience
                  </div>
                  <div className="flex items-center justify-center text-sm text-gray-600">
                    <HiCurrencyRupee className="w-4 h-4 mr-2" />
                    Consultation Fee: ₹{doctor.doctor_info?.consultation_fee || 500}
                  </div>
                  <div className="flex items-center justify-center text-sm text-gray-600">
                    <HiStar className="w-4 h-4 mr-2 text-yellow-400" />
                    4.8/5 (Based on 150+ reviews)
                  </div>
                </div>
              </div>

              {/* Book Appointment Button */}
              <button
                onClick={handleBookAppointment}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <HiCalendar className="w-6 h-6 mr-2" />
                Book Appointment
              </button>
            </div>
          </div>

          {/* Right Column - Detailed Information */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-1 h-8 bg-blue-600 rounded-full mr-4"></div>
                About Dr. {doctor.name.split(' ')[0]}
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {doctor.doctor_info?.bio || 
                  `Dr. ${doctor.name} is a highly experienced medical professional specializing in ${doctor.doctor_info?.specialization || 'general medicine'}. With over ${doctor.doctor_info?.experience_years || 0} years of experience in the field, Dr. ${doctor.name.split(' ')[0]} is committed to providing exceptional patient care and staying up-to-date with the latest medical advancements.`
                }
              </p>
            </div>

            {/* Qualifications */}
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-1 h-8 bg-blue-600 rounded-full mr-4"></div>
                <HiAcademicCap className="w-6 h-6 mr-3 text-blue-600" />
                Qualifications & Education
              </h2>
              <div className="text-gray-700">
                {doctor.doctor_info?.qualifications ? (
                  <div className="whitespace-pre-line">{doctor.doctor_info.qualifications}</div>
                ) : (
                  <p>Qualifications information will be updated soon.</p>
                )}
              </div>
            </div>

            {/* Specializations */}
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-1 h-8 bg-blue-600 rounded-full mr-4"></div>
                <HiBriefcase className="w-6 h-6 mr-3 text-blue-600" />
                Specializations & Expertise
              </h2>
              <div className="flex flex-wrap gap-2">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {doctor.doctor_info?.specialization || 'General Medicine'}
                </span>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {doctor.doctor_info?.department?.name || 'Internal Medicine'}
                </span>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  Patient Consultation
                </span>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  Preventive Care
                </span>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-1 h-8 bg-blue-600 rounded-full mr-4"></div>
                Contact Information
              </h2>
              <div className="space-y-3">
                <div className="flex items-center text-gray-700">
                  <HiMail className="w-5 h-5 mr-3 text-blue-600" />
                  <span>{doctor.email}</span>
                </div>
                {doctor.phone && (
                  <div className="flex items-center text-gray-700">
                    <HiPhone className="w-5 h-5 mr-3 text-blue-600" />
                    <span>{doctor.phone}</span>
                  </div>
                )}
                <div className="flex items-center text-gray-700">
                  <HiLocationMarker className="w-5 h-5 mr-3 text-blue-600" />
                  <span>Available at our main hospital location</span>
                </div>
              </div>
            </div>

            {/* Availability */}
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-1 h-8 bg-blue-600 rounded-full mr-4"></div>
                Availability
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Regular Hours</h3>
                  <p className="text-gray-600">
                    Monday - Friday: {doctor.doctor_info?.default_working_hours?.start_time || '09:00'} - {doctor.doctor_info?.default_working_hours?.end_time || '17:00'}
                  </p>
                  <p className="text-gray-600">
                    Saturday: {doctor.doctor_info?.default_working_hours?.start_time || '09:00'} - 13:00
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Break Time</h3>
                  <p className="text-gray-600">
                    Lunch: {doctor.doctor_info?.default_break_time?.start_time || '13:00'} - {doctor.doctor_info?.default_break_time?.end_time || '14:00'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
