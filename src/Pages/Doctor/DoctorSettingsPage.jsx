import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiArrowLeft, HiUser, HiMail, HiPhone, HiCog, HiSave, HiCalendar, HiClock, HiX, HiCamera, HiTrash, HiAcademicCap, HiBadgeCheck, HiPlus, HiMinus, HiDocumentText } from 'react-icons/hi';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import DoctorSidebar from '../../Components/Doctor/Sidebar';
import Swal from 'sweetalert2';

export default function DoctorSettingsPage() {
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');
  
  // Data for appointments sections
  const [appointments, setAppointments] = useState([]);
  const [consultedAppointments, setConsultedAppointments] = useState([]);
  const [cancelledAppointments, setCancelledAppointments] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: '',
    experience: '',
    qualifications: '',
    certifications: '',
    license_number: '',
    languages: '',
    bio: ''
  });

  // Structured qualifications and certifications
  const [qualifications, setQualifications] = useState([]);
  const [certifications, setCertifications] = useState([]);
  
  // Profile image states
  const [profileImage, setProfileImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  // Functions to manage qualifications and certifications
  const addQualification = () => {
    setQualifications([...qualifications, { degree: '', institution: '', year: '', field: '' }]);
  };

  const removeQualification = (index) => {
    setQualifications(qualifications.filter((_, i) => i !== index));
  };

  const updateQualification = (index, field, value) => {
    const updated = [...qualifications];
    updated[index][field] = value;
    setQualifications(updated);
  };

  const addCertification = () => {
    setCertifications([...certifications, { name: '', issuing_organization: '', issue_date: '', expiry_date: '', credential_id: '' }]);
  };

  const removeCertification = (index) => {
    setCertifications(certifications.filter((_, i) => i !== index));
  };

  const updateCertification = (index, field, value) => {
    const updated = [...certifications];
    updated[index][field] = value;
    setCertifications(updated);
  };


  useEffect(() => {
    checkDoctorAuth();
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
      setDoctor(parsedUser);
      setProfileForm({
        name: parsedUser.name || '',
        email: parsedUser.email || '',
        phone: parsedUser.phone || '',
        specialization: parsedUser.doctor_info?.specialization || '',
        experience: parsedUser.doctor_info?.experience_years || '',
        qualifications: parsedUser.doctor_info?.qualifications || '',
        certifications: parsedUser.doctor_info?.certifications || '',
        license_number: parsedUser.doctor_info?.license_number || '',
        languages: (parsedUser.doctor_info?.languages || []).join(', '),
        bio: parsedUser.doctor_info?.bio || ''
      });

      // Initialize structured qualifications and certifications
      setQualifications(parsedUser.doctor_info?.structured_qualifications || []);
      setCertifications(parsedUser.doctor_info?.structured_certifications || []);
      
      // Set profile image
      setProfileImage(parsedUser.profile_photo || parsedUser.profileImage || null);

      // Fetch latest profile from backend
      fetchDoctorProfile();
    } catch (error) {
      console.error('Error parsing user data:', error);
      navigate('/login');
    }
  };

  const fetchDoctorProfile = async () => {
        try {
          const token = localStorage.getItem('token');
      const { data } = await axios.get(`${API_BASE_URL}/api/doctor/profile`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
          const d = data?.doctor || {};
          setProfileForm(prev => ({
            ...prev,
            name: d.name || prev.name,
            email: d.email || prev.email,
            phone: d.phone || prev.phone,
            specialization: d.doctor_info?.specialization || prev.specialization,
            experience: d.doctor_info?.experience_years || prev.experience,
            qualifications: d.doctor_info?.qualifications || prev.qualifications,
            certifications: d.doctor_info?.certifications || prev.certifications,
            license_number: d.doctor_info?.license_number || prev.license_number,
            languages: (d.doctor_info?.languages || []).join(', ') || prev.languages,
            bio: d.doctor_info?.bio || prev.bio
          }));

          // Update structured data
          setQualifications(d.doctor_info?.structured_qualifications || []);
          setCertifications(d.doctor_info?.structured_certifications || []);
          
          // Update profile image
          setProfileImage(d.profile_photo || d.profileImage || null);
    } catch (error) {
      console.error('Error fetching doctor profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE_URL}/api/doctor/profile`,
        {
          specialization: profileForm.specialization,
          experience_years: parseInt(profileForm.experience) || 0,
          phone: profileForm.phone,
          qualifications: profileForm.qualifications,
          certifications: profileForm.certifications,
          license_number: profileForm.license_number,
          languages: profileForm.languages.split(',').map(lang => lang.trim()).filter(lang => lang),
          bio: profileForm.bio,
          structured_qualifications: qualifications,
          structured_certifications: certifications
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update localStorage
      const updatedUser = { ...doctor, ...profileForm };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setDoctor(updatedUser);

      Swal.fire({
        icon: 'success',
        title: 'Profile Updated',
        text: 'Your profile has been updated successfully!',
        timer: 2000
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: error.response?.data?.message || 'Failed to update profile. Please try again.'
      });
    } finally {
      setSaving(false);
    }
  };

  // Profile image upload handler
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid File',
        text: 'Please select a valid image file (JPG, PNG)'
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        icon: 'error',
        title: 'File Too Large',
        text: 'Please select an image smaller than 5MB'
      });
      return;
    }

    setUploadingImage(true);
    setImagePreview(URL.createObjectURL(file));

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('profilePhoto', file);

      const response = await axios.post(
        `${API_BASE_URL}/api/doctor/upload-photo`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.photoUrl) {
        setProfileImage(response.data.photoUrl);
        
        // Update localStorage
        const updatedUser = { ...doctor, profile_photo: response.data.photoUrl, profileImage: response.data.photoUrl };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setDoctor(updatedUser);

        Swal.fire({
          icon: 'success',
          title: 'Photo Updated',
          text: 'Your profile photo has been updated successfully!',
          timer: 2000
        });
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      Swal.fire({
        icon: 'error',
        title: 'Upload Failed',
        text: error.response?.data?.message || 'Failed to upload photo. Please try again.'
      });
      setImagePreview(null);
    } finally {
      setUploadingImage(false);
    }
  };

  // Remove profile image
  const handleRemoveImage = async () => {
    const result = await Swal.fire({
      title: 'Remove Profile Photo?',
      text: 'Are you sure you want to remove your profile photo?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, remove it!'
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_BASE_URL}/api/doctor/remove-photo`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setProfileImage(null);
        setImagePreview(null);
        
        // Update localStorage
        const updatedUser = { ...doctor };
        delete updatedUser.profile_photo;
        delete updatedUser.profileImage;
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setDoctor(updatedUser);

        Swal.fire({
          icon: 'success',
          title: 'Photo Removed',
          text: 'Your profile photo has been removed successfully!',
          timer: 2000
        });
      } catch (error) {
        console.error('Error removing photo:', error);
        Swal.fire({
          icon: 'error',
          title: 'Remove Failed',
          text: error.response?.data?.message || 'Failed to remove photo. Please try again.'
        });
      }
    }
  };

  const handleSectionClick = async (section) => {
    setActiveSection(section);
    
    if (section !== 'profile' && !loadingData) {
      setLoadingData(true);
      try {
        await fetchAppointmentsData(section);
      } catch (error) {
        console.error('Error fetching appointments data:', error);
      } finally {
        setLoadingData(false);
      }
    }
  };

  const fetchAppointmentsData = async (section) => {
    const token = localStorage.getItem('token');
    
    try {
      let response;
      switch (section) {
        case 'appointments':
          response = await axios.get(`${API_BASE_URL}/api/doctor/appointments?filter=all&limit=50`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setAppointments(response.data.appointments || []);
          break;
        case 'consulted':
          response = await axios.get(`${API_BASE_URL}/api/doctor/appointments?filter=completed&limit=50`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setConsultedAppointments(response.data.appointments || []);
          break;
        case 'cancelled':
          response = await axios.get(`${API_BASE_URL}/api/doctor/appointments?filter=cancelled&limit=50`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setCancelledAppointments(response.data.appointments || []);
          break;
      }
    } catch (error) {
      console.error(`Error fetching ${section} appointments:`, error);
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
                  <div className="h-12 w-12 bg-gradient-to-r from-gray-600 to-gray-700 rounded-xl flex items-center justify-center">
                    <HiCog className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
                    <p className="text-base sm:text-lg text-gray-600 mt-1">Manage your account and preferences</p>
                </div>
              </div>
            </div>
          </div>
            </div>
          </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          
          {/* Navigation Tabs */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 mb-6">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => handleSectionClick('profile')}
                className={`flex-1 px-6 py-4 text-sm font-medium text-center border-b-2 transition-colors ${
                  activeSection === 'profile'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <HiUser className="h-5 w-5 mx-auto mb-2" />
                Profile
              </button>
              <button
                onClick={() => handleSectionClick('appointments')}
                className={`flex-1 px-6 py-4 text-sm font-medium text-center border-b-2 transition-colors ${
                  activeSection === 'appointments'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <HiCalendar className="h-5 w-5 mx-auto mb-2" />
                My Appointments
              </button>
              <button
                onClick={() => handleSectionClick('consulted')}
                className={`flex-1 px-6 py-4 text-sm font-medium text-center border-b-2 transition-colors ${
                  activeSection === 'consulted'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <HiClock className="h-5 w-5 mx-auto mb-2" />
                Consultation History
              </button>
              <button
                onClick={() => handleSectionClick('cancelled')}
                className={`flex-1 px-6 py-4 text-sm font-medium text-center border-b-2 transition-colors ${
                  activeSection === 'cancelled'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <HiX className="h-5 w-5 mx-auto mb-2" />
                Cancelled Appointments
              </button>
            </div>
          </div>

          {/* Content Area */}
          {activeSection === 'profile' && (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Information</h2>
                
                {/* Profile Image Section */}
                <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Photo</h3>
                  <div className="flex items-center space-x-6">
                    {/* Current Profile Image */}
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg">
                        {profileImage || imagePreview ? (
                          <img
                            src={imagePreview || profileImage}
                            alt="Profile"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className={`w-full h-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold ${profileImage || imagePreview ? 'hidden' : 'flex'}`}>
                          {doctor?.name?.charAt(0)?.toUpperCase() || 'D'}
                        </div>
                      </div>
                      {uploadingImage && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        </div>
                      )}
                    </div>

                    {/* Upload Controls */}
                    <div className="flex-1">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                              disabled={uploadingImage}
                            />
                            <div className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50">
                              <HiCamera className="h-4 w-4" />
                              <span>{uploadingImage ? 'Uploading...' : 'Upload Photo'}</span>
                            </div>
                          </label>
                          
                          {profileImage && (
                            <button
                              onClick={handleRemoveImage}
                              disabled={uploadingImage}
                              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50"
                            >
                              <HiTrash className="h-4 w-4" />
                              <span>Remove</span>
                            </button>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600">
                          Upload a professional photo (JPG, PNG, max 5MB). This will be displayed to patients.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleProfileUpdate} className="space-y-8">
                  {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
                  <input
                    type="text"
                    value={profileForm.specialization}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, specialization: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Cardiology, Neurology"
                  />
                </div>
              </div>

                  {/* Professional Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience</label>
                  <input
                    type="number"
                    value={profileForm.experience}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, experience: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                        max="50"
                  />
                </div>
                <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">License Number</label>
                  <input
                    type="text"
                        value={profileForm.license_number}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, license_number: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., TNMC12345"
                      />
                    </div>
                  </div>

                  {/* Professional Qualifications Section */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <HiAcademicCap className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Professional Qualifications</h3>
                          <p className="text-sm text-gray-600">Add your educational qualifications and degrees</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={addQualification}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                      >
                        <HiPlus className="h-4 w-4" />
                        <span>Add Qualification</span>
                      </button>
                    </div>

                    {qualifications.length === 0 ? (
                      <div className="text-center py-8">
                        <HiDocumentText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 mb-2">No qualifications added yet</p>
                        <p className="text-sm text-gray-400">Click "Add Qualification" to get started</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {qualifications.map((qual, index) => (
                          <div key={index} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-sm font-medium text-gray-700">Qualification #{index + 1}</h4>
                              <button
                                type="button"
                                onClick={() => removeQualification(index)}
                                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                              >
                                <HiMinus className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Degree/Qualification</label>
                                <input
                                  type="text"
                                  value={qual.degree}
                                  onChange={(e) => updateQualification(index, 'degree', e.target.value)}
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="e.g., MBBS, MD, PhD"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Institution</label>
                                <input
                                  type="text"
                                  value={qual.institution}
                                  onChange={(e) => updateQualification(index, 'institution', e.target.value)}
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="e.g., AIIMS Delhi"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Field of Study</label>
                                <input
                                  type="text"
                                  value={qual.field}
                                  onChange={(e) => updateQualification(index, 'field', e.target.value)}
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="e.g., Medicine, Cardiology"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                                <input
                                  type="number"
                                  value={qual.year}
                                  onChange={(e) => updateQualification(index, 'year', e.target.value)}
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  placeholder="e.g., 2015"
                                  min="1950"
                                  max="2030"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Professional Certifications Section */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <HiBadgeCheck className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Professional Certifications</h3>
                          <p className="text-sm text-gray-600">Add your professional certifications and licenses</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={addCertification}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                      >
                        <HiPlus className="h-4 w-4" />
                        <span>Add Certification</span>
                      </button>
                    </div>

                    {certifications.length === 0 ? (
                      <div className="text-center py-8">
                        <HiBadgeCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 mb-2">No certifications added yet</p>
                        <p className="text-sm text-gray-400">Click "Add Certification" to get started</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {certifications.map((cert, index) => (
                          <div key={index} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-sm font-medium text-gray-700">Certification #{index + 1}</h4>
                              <button
                                type="button"
                                onClick={() => removeCertification(index)}
                                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                              >
                                <HiMinus className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Certification Name</label>
                                <input
                                  type="text"
                                  value={cert.name}
                                  onChange={(e) => updateCertification(index, 'name', e.target.value)}
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                  placeholder="e.g., Board Certified in Cardiology"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Issuing Organization</label>
                                <input
                                  type="text"
                                  value={cert.issuing_organization}
                                  onChange={(e) => updateCertification(index, 'issuing_organization', e.target.value)}
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                  placeholder="e.g., American Board of Internal Medicine"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Issue Date</label>
                                <input
                                  type="date"
                                  value={cert.issue_date}
                                  onChange={(e) => updateCertification(index, 'issue_date', e.target.value)}
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date (if applicable)</label>
                                <input
                                  type="date"
                                  value={cert.expiry_date}
                                  onChange={(e) => updateCertification(index, 'expiry_date', e.target.value)}
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Credential ID</label>
                                <input
                                  type="text"
                                  value={cert.credential_id}
                                  onChange={(e) => updateCertification(index, 'credential_id', e.target.value)}
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                  placeholder="e.g., ABC123456"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Languages and Bio */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Languages</label>
                  <input
                    type="text"
                    value={profileForm.languages}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, languages: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., English, Hindi, Tamil"
                  />
                </div>
              </div>

              <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                <textarea
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows="4"
                      placeholder="Tell patients about your experience and approach..."
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                      className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                      <HiSave className="h-5 w-5" />
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
          )}

          {/* Appointments Section */}
          {activeSection === 'appointments' && (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">My Appointments</h2>
              {loadingData ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading appointments...</span>
                </div>
              ) : (
                <AppointmentsContent appointments={appointments} />
              )}
            </div>
          )}

          {/* Consultation History Section */}
          {activeSection === 'consulted' && (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Consultation History</h2>
              {loadingData ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading history...</span>
                </div>
              ) : (
                <ConsultedAppointmentsContent appointments={consultedAppointments} />
              )}
            </div>
          )}

          {/* Cancelled Appointments Section */}
          {activeSection === 'cancelled' && (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Cancelled Appointments</h2>
              {loadingData ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading cancelled appointments...</span>
                </div>
              ) : (
                <CancelledAppointmentsContent appointments={cancelledAppointments} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Appointment Content Components
const AppointmentsContent = ({ appointments }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (appointments.length === 0) {
    return (
      <div className="text-center py-8">
        <HiCalendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No appointments found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {appointments.map((appointment, index) => (
        <div key={appointment._id || index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium text-gray-900">{appointment.patientName || 'Unknown Patient'}</h3>
              <p className="text-sm text-gray-500">Token: {appointment.tokenNumber || 'N/A'}</p>
              <p className="text-sm text-gray-500">Date: {formatDate(appointment.booking_date)} at {appointment.time_slot}</p>
              {appointment.symptoms && (
                <p className="text-sm text-gray-600 mt-2">Symptoms: {appointment.symptoms}</p>
              )}
            </div>
            <div className="text-right">
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                appointment.status === 'booked' ? 'bg-blue-100 text-blue-800' :
                appointment.status === 'consulted' ? 'bg-green-100 text-green-800' :
                appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {appointment.status}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const ConsultedAppointmentsContent = ({ appointments }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (appointments.length === 0) {
    return (
      <div className="text-center py-8">
        <HiClock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No consultation history found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {appointments.map((appointment, index) => (
        <div key={appointment._id || index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium text-gray-900">{appointment.patientName || 'Unknown Patient'}</h3>
              <p className="text-sm text-gray-500">Token: {appointment.tokenNumber || 'N/A'}</p>
              <p className="text-sm text-gray-500">Date: {formatDate(appointment.booking_date)} at {appointment.time_slot}</p>
              {appointment.consultationData?.diagnosis && (
                <p className="text-sm text-gray-600 mt-2">Diagnosis: {appointment.consultationData.diagnosis}</p>
              )}
            </div>
            <div className="text-right">
              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                Consulted
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const CancelledAppointmentsContent = ({ appointments }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (appointments.length === 0) {
    return (
      <div className="text-center py-8">
        <HiX className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No cancelled appointments found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {appointments.map((appointment, index) => (
        <div key={appointment._id || index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium text-gray-900">{appointment.patientName || 'Unknown Patient'}</h3>
              <p className="text-sm text-gray-500">Token: {appointment.tokenNumber || 'N/A'}</p>
              <p className="text-sm text-gray-500">Date: {formatDate(appointment.booking_date)} at {appointment.time_slot}</p>
              {appointment.cancellation_reason && (
                <p className="text-sm text-gray-600 mt-2">Reason: {appointment.cancellation_reason}</p>
              )}
            </div>
            <div className="text-right">
              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                Cancelled
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};