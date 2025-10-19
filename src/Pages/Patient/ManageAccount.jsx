import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../../config/api';
import { getImageUrl, getProfileImageUrl } from '../../utils/imageUtils';
import Swal from 'sweetalert2';
import {
  UserCircleIcon,
  CameraIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  HeartIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  XMarkIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { useProfileUpdateValidation, useFamilyMemberValidation, usePasswordChangeValidation } from '../../hooks/useFormValidation';

const ManageAccount = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState('');

  // Form states with validation
  const profileValidation = useProfileUpdateValidation({
    name: '',
    age: '',
    gender: 'male',
    phone: '',
    email: '',
    address: '',
    bloodGroup: '',
    allergies: '',
    chronicConditions: '',
    emergencyContact: {
      name: '',
      phone: '',
      relation: ''
    }
  });

  const familyMemberValidation = useFamilyMemberValidation({
    name: '',
    age: '',
    gender: 'male',
    phone: '',
    relation: 'spouse',
    bloodGroup: '',
    allergies: '',
    chronicConditions: ''
  });

  const passwordValidation = usePasswordChangeValidation({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Legacy state for backward compatibility
  const [profileData, setProfileData] = useState({
    name: '',
    age: '',
    gender: 'male',
    phone: '',
    email: '',
    address: '',
    bloodGroup: '',
    allergies: '',
    chronicConditions: '',
    emergencyContact: {
      name: '',
      phone: '',
      relation: ''
    }
  });

  const [newMember, setNewMember] = useState({
    name: '',
    age: '',
    gender: 'male',
    phone: '',
    relation: 'spouse',
    bloodGroup: '',
    allergies: '',
    chronicConditions: ''
  });


  useEffect(() => {
    const loadData = async () => {
      setInitialLoading(true);
      try {
        await Promise.all([
          fetchUserData(),
          fetchFamilyMembers()
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setInitialLoading(false);
      }
    };
    
    loadData();
  }, []);


  // Check if profile is complete based on required fields
  const isProfileComplete = () => {
    if (!user) return false;
    
    // Check required fields: phone, dob, gender, age, address
    const hasPhone = user.phone && user.phone.trim() !== '';
    const hasDob = user.dob && user.dob !== '';
    const hasGender = user.gender && user.gender.trim() !== '';
    const hasAge = user.age && user.age > 0;
    const hasAddress = user.address && user.address.trim() !== '';
    
    return hasPhone && hasDob && hasGender && hasAge && hasAddress;
  };

  // Get missing fields for profile completion
  const getMissingFields = () => {
    const missingFields = [];
    if (!user?.phone || user.phone.trim() === '') missingFields.push('Phone Number');
    if (!user?.dob || user.dob === '') missingFields.push('Date of Birth');
    if (!user?.gender || user.gender.trim() === '') missingFields.push('Gender');
    if (!user?.age || user.age <= 0) missingFields.push('Age');
    if (!user?.address || user.address.trim() === '') missingFields.push('Address');
    return missingFields;
  };



  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Token exists:', !!token);
      
      if (!token) {
        // Fallback to localStorage data if no token
        const localUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (localUser.name) {
          console.log('Using localStorage data as fallback');
          console.log('Local user profile photo fields:', {
            profilePhoto: localUser.profilePhoto,
            profile_photo: localUser.profile_photo,
            profileImage: localUser.profileImage
          });
          setUser(localUser);
          
          // Update both legacy state and validation hooks
          const profileData = {
            name: localUser.name || '',
            age: localUser.age ? String(localUser.age) : '',
            gender: localUser.gender || 'male',
            phone: localUser.phone || '',
            email: localUser.email || '',
            address: localUser.address || '',
            bloodGroup: localUser.bloodGroup || '',
            allergies: localUser.allergies || '',
            chronicConditions: localUser.chronicConditions || '',
            emergencyContact: localUser.emergencyContact || {
              name: '',
              phone: '',
              relation: ''
            }
          };
          
          setProfileData(profileData);
          
          // Update validation hook values
          Object.keys(profileData).forEach(key => {
            if (key === 'emergencyContact') {
              profileValidation.setFieldValue('emergencyContact', profileData.emergencyContact);
            } else {
              profileValidation.setFieldValue(key, profileData[key]);
            }
          });
          
          return;
        }
      }
      
      console.log('Making API call to:', `${API_BASE_URL}/api/patient/profile`);
      
      const response = await axios.get(`${API_BASE_URL}/api/patient/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('API Response:', response.data);
      const userData = response.data.user;
      console.log('User data profile photo fields:', {
        profilePhoto: userData.profilePhoto,
        profile_photo: userData.profile_photo,
        profileImage: userData.profileImage
      });
      
      setUser(userData);
      
      // Update both legacy state and validation hooks
      const profileData = {
        name: userData.name || '',
        age: userData.age ? String(userData.age) : '',
        gender: userData.gender || 'male',
        phone: userData.phone || '',
        email: userData.email || '',
        address: userData.address || '',
        bloodGroup: userData.bloodGroup || '',
        allergies: userData.allergies || '',
        chronicConditions: userData.chronicConditions || '',
        emergencyContact: userData.emergencyContact || {
          name: '',
          phone: '',
          relation: ''
        }
      };
      
      setProfileData(profileData);
      
      // Update validation hook values
      Object.keys(profileData).forEach(key => {
        if (key === 'emergencyContact') {
          profileValidation.setFieldValue('emergencyContact', profileData.emergencyContact);
        } else {
          profileValidation.setFieldValue(key, profileData[key]);
        }
      });
      
    } catch (error) {
      console.error('Error fetching user data:', error);
      console.error('Error response:', error.response?.data);
      
      // Fallback to localStorage data on error
      const localUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (localUser.name) {
        console.log('Using localStorage data as fallback after API error');
        setUser(localUser);
        
        const profileData = {
          name: localUser.name || '',
          age: localUser.age ? String(localUser.age) : '',
          gender: localUser.gender || 'male',
          phone: localUser.phone || '',
          email: localUser.email || '',
          address: localUser.address || '',
          bloodGroup: localUser.bloodGroup || '',
          allergies: localUser.allergies || '',
          chronicConditions: localUser.chronicConditions || '',
          emergencyContact: localUser.emergencyContact || {
            name: '',
            phone: '',
            relation: ''
          }
        };
        
        setProfileData(profileData);
        
        // Update validation hook values
        Object.keys(profileData).forEach(key => {
          if (key === 'emergencyContact') {
            profileValidation.setFieldValue('emergencyContact', profileData.emergencyContact);
          } else {
            profileValidation.setFieldValue(key, profileData[key]);
          }
        });
      } else {
        Swal.fire('Error', 'Failed to load profile data', 'error');
      }
    }
  };

  const fetchFamilyMembers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/patient/family-members`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFamilyMembers(response.data.familyMembers || []);
    } catch (error) {
      console.error('Error fetching family members:', error);
    }
  };

  const handlePhotoUpload = (event) => {
    const file = event.target.files[0];
    setPhotoError('');
    
    if (file) {
      // Validate file size (2MB limit as per requirements)
      if (file.size > 2 * 1024 * 1024) {
        setPhotoError('File size must be less than 2MB');
        return;
      }
      
      // Validate file format (JPG, PNG only)
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setPhotoError('Only JPG and PNG files are allowed');
        return;
      }

      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const uploadPhoto = async () => {
    if (!photoFile) return;

    try {
      setUploadingPhoto(true);
      setPhotoError('');
      
      const formData = new FormData();
      formData.append('photo', photoFile);

      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/api/patient/upload-photo`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Update user state with new photo
      setUser(prev => ({ 
        ...prev, 
        profilePhoto: response.data.profilePhoto, 
        profile_photo: response.data.profilePhoto 
      }));
      
      // Update localStorage with new photo
      const updatedUser = { ...user, profilePhoto: response.data.profilePhoto, profile_photo: response.data.profilePhoto };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Dispatch event to update navbar
      window.dispatchEvent(new CustomEvent('userProfileUpdated', { 
        detail: { profilePhoto: response.data.profilePhoto } 
      }));
      
      // Clear photo upload state
      setShowPhotoUpload(false);
      setPhotoFile(null);
      setPhotoPreview(null);
      setPhotoError('');
      
      Swal.fire({
        title: 'Success!',
        text: 'Profile photo updated successfully!',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      setPhotoError(error.response?.data?.message || 'Failed to upload photo. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removePhoto = async () => {
    try {
      const result = await Swal.fire({
        title: 'Remove Profile Photo?',
        text: 'Are you sure you want to remove your profile photo?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, remove it',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280'
      });

      if (result.isConfirmed) {
        setUploadingPhoto(true);
        const token = localStorage.getItem('token');
        
        await axios.delete(`${API_BASE_URL}/api/patient/remove-photo`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Update user state to remove photo
        setUser(prev => ({ 
          ...prev, 
          profilePhoto: null, 
          profile_photo: null 
        }));
        
        // Update localStorage to remove photo
        const updatedUser = { ...user, profilePhoto: null, profile_photo: null };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Dispatch event to update navbar
        window.dispatchEvent(new CustomEvent('userProfileUpdated', { 
          detail: { profilePhoto: null } 
        }));
        
        Swal.fire({
          title: 'Photo Removed!',
          text: 'Your profile photo has been removed successfully.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (error) {
      console.error('Error removing photo:', error);
      Swal.fire('Error', 'Failed to remove photo. Please try again.', 'error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleProfileUpdate = async () => {
    // Validate form before submission
    const validation = profileValidation.validateAllFields();
    if (!validation.isValid) {
      Swal.fire('Validation Error', 'Please fix the errors before submitting', 'error');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Prepare data for API call - convert age to number
      const apiData = {
        ...profileValidation.values,
        age: profileValidation.values.age ? parseInt(profileValidation.values.age) : undefined
      };
      
      console.log('Updating profile with data:', apiData);
      console.log('API URL:', `${API_BASE_URL}/api/patient/profile`);
      console.log('Token exists:', !!token);
      
      await axios.put(`${API_BASE_URL}/api/patient/profile`, apiData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Swal.fire('Success', 'Profile updated successfully!', 'success');
      await fetchUserData();
    } catch (error) {
      console.error('Error updating profile:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update profile';
      Swal.fire('Error', errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFamilyMember = async () => {
    // Validate form before submission
    const validation = familyMemberValidation.validateAllFields();
    if (!validation.isValid) {
      Swal.fire('Validation Error', 'Please fix the errors before submitting', 'error');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(`${API_BASE_URL}/api/patient/family-members`, familyMemberValidation.values, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setFamilyMembers(prev => [...prev, response.data.familyMember]);
      familyMemberValidation.resetForm();
      setNewMember({
        name: '',
        age: '',
        gender: 'male',
        phone: '',
        relation: 'spouse',
        bloodGroup: '',
        allergies: '',
        chronicConditions: ''
      });
      setShowAddMember(false);
      
      Swal.fire('Success', 'Family member added successfully!', 'success');
    } catch (error) {
      console.error('Error adding family member:', error);
      Swal.fire('Error', 'Failed to add family member', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditFamilyMember = async (memberId) => {
    const member = familyMembers.find(m => m._id === memberId);
    if (!member) return;

    setEditingMember(member);
    setNewMember({
      name: member.name,
      age: member.age,
      gender: member.gender,
      phone: member.phone,
      relation: member.relation,
      bloodGroup: member.bloodGroup || '',
      allergies: member.allergies || '',
      chronicConditions: member.chronicConditions || ''
    });
    setShowAddMember(true);
  };

  const handleUpdateFamilyMember = async () => {
    // Validate form before submission
    const validation = familyMemberValidation.validateAllFields();
    if (!validation.isValid) {
      Swal.fire('Validation Error', 'Please fix the errors before submitting', 'error');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      await axios.put(`${API_BASE_URL}/api/patient/family-members/${editingMember._id}`, familyMemberValidation.values, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setFamilyMembers(prev => 
        prev.map(m => m._id === editingMember._id ? { ...m, ...familyMemberValidation.values } : m)
      );
      
      setEditingMember(null);
      setShowAddMember(false);
      familyMemberValidation.resetForm();
      setNewMember({
        name: '',
        age: '',
        gender: 'male',
        phone: '',
        relation: 'spouse',
        bloodGroup: '',
        allergies: '',
        chronicConditions: ''
      });
      
      Swal.fire('Success', 'Family member updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating family member:', error);
      Swal.fire('Error', 'Failed to update family member', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFamilyMember = async (memberId) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This will permanently delete the family member.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        await axios.delete(`${API_BASE_URL}/api/patient/family-members/${memberId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setFamilyMembers(prev => prev.filter(m => m._id !== memberId));
        Swal.fire('Deleted!', 'Family member has been deleted.', 'success');
      } catch (error) {
        console.error('Error deleting family member:', error);
        Swal.fire('Error', 'Failed to delete family member', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePasswordChange = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Change Password',
      html: `
        <input id="current-password" type="password" placeholder="Current Password" class="swal2-input">
        <input id="new-password" type="password" placeholder="New Password" class="swal2-input">
        <input id="confirm-password" type="password" placeholder="Confirm New Password" class="swal2-input">
        <div id="password-requirements" class="text-xs text-gray-600 mt-2">
          Password must be at least 8 characters with uppercase, lowercase, numbers, and no spaces
        </div>
      `,
      focusConfirm: false,
      preConfirm: () => {
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        // Validate using our validation function
        const validation = passwordValidation.validateForm({
          currentPassword,
          newPassword,
          confirmPassword
        });
        
        if (!validation.isValid) {
          const firstError = Object.values(validation.errors)[0];
          Swal.showValidationMessage(firstError);
          return false;
        }
        
        return { currentPassword, newPassword };
      }
    });

    if (formValues) {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        await axios.put(`${API_BASE_URL}/api/patient/change-password`, {
          currentPassword: formValues.currentPassword,
          newPassword: formValues.newPassword
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        Swal.fire('Success', 'Password changed successfully!', 'success');
      } catch (error) {
        console.error('Error changing password:', error);
        Swal.fire('Error', error.response?.data?.message || 'Failed to change password', 'error');
      } finally {
        setLoading(false);
      }
    }
  };


  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserCircleIcon },
    { id: 'family', name: 'Family Members', icon: UserGroupIcon },
    { id: 'medical', name: 'Medical Details', icon: HeartIcon }
  ];

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your account details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manage Account</h1>
          <p className="mt-2 text-gray-600">Update your personal information and account settings</p>
        </div>

        {/* Simple Profile Completion Message */}
        {user && !isProfileComplete() && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Complete Your Profile</h3>
                <p className="text-sm text-blue-700 mb-2">
                  Please fill in the following required fields to complete your profile:
                </p>
                <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
                  {getMissingFields().map((field, index) => (
                    <li key={index}>{field}</li>
                  ))}
                </ul>
                <p className="text-xs text-blue-600 mt-2">
                  This helps us provide better healthcare services.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Profile Complete Success Message */}
        {user && isProfileComplete() && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-green-800">Profile Complete!</h3>
                <p className="text-sm text-green-700">Thank you for completing your profile. This helps us provide better healthcare services.</p>
              </div>
            </div>
          </div>
        )}



        <div className="bg-white rounded-lg shadow-sm">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5 inline-block mr-2" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    {user?.profilePhoto || user?.profile_photo ? (
                      <img
                        src={getProfileImageUrl(user.profilePhoto || user.profile_photo, 'xlarge')}
                        alt="Profile"
                        className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-lg"
                        onError={(e) => {
                          console.log('Image load error:', e.target.src);
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                    ) : null}
                    <UserCircleIcon 
                      className={`h-24 w-24 text-gray-400 ${user?.profilePhoto || user?.profile_photo ? 'hidden' : 'block'}`} 
                    />
                    <button
                      onClick={() => setShowPhotoUpload(true)}
                      className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 transition-colors shadow-lg"
                      title="Change Photo"
                    >
                      <CameraIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{user?.name}</h3>
                    <p className="text-sm text-gray-500">Patient ID: {user?.patientId}</p>
                    <p className="text-sm text-gray-500">Email: {user?.email}</p>
                    <p className="text-sm text-gray-500">Phone: {user?.phone || 'Not provided'}</p>
                    <p className="text-sm text-gray-500">Role: {user?.role}</p>
                    <p className="text-sm text-gray-500">Status: {user?.isActive ? 'Active' : 'Inactive'}</p>
                    <div className="mt-2 flex space-x-3">
                      <button
                        onClick={() => setShowPhotoUpload(true)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {user?.profilePhoto || user?.profile_photo ? 'Change Photo' : 'Add Photo'}
                      </button>
                      {(user?.profilePhoto || user?.profile_photo) && (
                        <button
                          onClick={removePhoto}
                          disabled={uploadingPhoto}
                          className="text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                        >
                          {uploadingPhoto ? 'Removing...' : 'Remove Photo'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={profileValidation.values.name}
                      onChange={profileValidation.handleChange}
                      onBlur={profileValidation.handleBlur}
                      onFocus={profileValidation.handleFocus}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                        profileValidation.errors.name && profileValidation.touched.name
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                    />
                    {profileValidation.errors.name && profileValidation.touched.name && (
                      <p className="mt-1 text-sm text-red-600">{profileValidation.errors.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Age *</label>
                    <input
                      type="number"
                      name="age"
                      value={profileValidation.values.age}
                      onChange={profileValidation.handleChange}
                      onBlur={profileValidation.handleBlur}
                      onFocus={profileValidation.handleFocus}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                        profileValidation.errors.age && profileValidation.touched.age
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                    />
                    {profileValidation.errors.age && profileValidation.touched.age && (
                      <p className="mt-1 text-sm text-red-600">{profileValidation.errors.age}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      name="dob"
                      value={user?.dob ? new Date(user.dob).toISOString().split('T')[0] : ''}
                      onChange={(e) => {
                        const dob = e.target.value;
                        setUser(prev => ({ ...prev, dob }));
                        profileValidation.setFieldValue('dob', dob);
                      }}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">Date of birth from registration</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                    <select
                      name="gender"
                      value={profileValidation.values.gender}
                      onChange={profileValidation.handleChange}
                      onBlur={profileValidation.handleBlur}
                      onFocus={profileValidation.handleFocus}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                        profileValidation.errors.gender && profileValidation.touched.gender
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                    {profileValidation.errors.gender && profileValidation.touched.gender && (
                      <p className="mt-1 text-sm text-red-600">{profileValidation.errors.gender}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={profileValidation.values.phone}
                      onChange={profileValidation.handleChange}
                      onBlur={profileValidation.handleBlur}
                      onFocus={profileValidation.handleFocus}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                        profileValidation.errors.phone && profileValidation.touched.phone
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                    />
                    {profileValidation.errors.phone && profileValidation.touched.phone && (
                      <p className="mt-1 text-sm text-red-600">{profileValidation.errors.phone}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={profileValidation.values.email}
                      onChange={profileValidation.handleChange}
                      onBlur={profileValidation.handleBlur}
                      onFocus={profileValidation.handleFocus}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                        profileValidation.errors.email && profileValidation.touched.email
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                    />
                    {profileValidation.errors.email && profileValidation.touched.email && (
                      <p className="mt-1 text-sm text-red-600">{profileValidation.errors.email}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea
                      name="address"
                      value={profileValidation.values.address}
                      onChange={profileValidation.handleChange}
                      onBlur={profileValidation.handleBlur}
                      onFocus={profileValidation.handleFocus}
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                        profileValidation.errors.address && profileValidation.touched.address
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                    />
                    {profileValidation.errors.address && profileValidation.touched.address && (
                      <p className="mt-1 text-sm text-red-600">{profileValidation.errors.address}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleProfileUpdate}
                    disabled={loading || !profileValidation.isValid}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Updating...' : 'Update Profile'}
                  </button>
                </div>
              </div>
            )}

            {/* Family Members Tab */}
            {activeTab === 'family' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Family Members</h3>
                  <button
                    onClick={() => {
                      setEditingMember(null);
                      setShowAddMember(true);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Member
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {familyMembers.map((member) => (
                    <div key={member._id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{member.name}</h4>
                          <p className="text-sm text-gray-500">ID: {member.patientId}</p>
                          <p className="text-sm text-gray-500">{member.relation}</p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditFamilyMember(member._id)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteFamilyMember(member._id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>Age: {member.age}</p>
                        <p>Gender: {member.gender}</p>
                        {member.phone && <p>Phone: {member.phone}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Medical Details Tab */}
            {activeTab === 'medical' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Medical Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                    <select
                      name="bloodGroup"
                      value={profileValidation.values.bloodGroup}
                      onChange={profileValidation.handleChange}
                      onBlur={profileValidation.handleBlur}
                      onFocus={profileValidation.handleFocus}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                        profileValidation.errors.bloodGroup && profileValidation.touched.bloodGroup
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                    >
                      <option value="">Select Blood Group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                    {profileValidation.errors.bloodGroup && profileValidation.touched.bloodGroup && (
                      <p className="mt-1 text-sm text-red-600">{profileValidation.errors.bloodGroup}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
                    <input
                      type="text"
                      name="allergies"
                      value={profileValidation.values.allergies}
                      onChange={profileValidation.handleChange}
                      onBlur={profileValidation.handleBlur}
                      onFocus={profileValidation.handleFocus}
                      placeholder="List any allergies (comma separated)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Chronic Conditions</label>
                    <textarea
                      name="chronicConditions"
                      value={profileValidation.values.chronicConditions}
                      onChange={profileValidation.handleChange}
                      onBlur={profileValidation.handleBlur}
                      onFocus={profileValidation.handleFocus}
                      placeholder="List any chronic conditions (e.g., Diabetes, Hypertension)"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Emergency Contact</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        name="emergencyContact.name"
                        value={profileValidation.values.emergencyContact.name}
                        onChange={(e) => {
                          const { name, value } = e.target;
                          const [parent, child] = name.split('.');
                          profileValidation.setFieldValue('emergencyContact', {
                            ...profileValidation.values.emergencyContact,
                            [child]: value
                          });
                        }}
                        onBlur={profileValidation.handleBlur}
                        onFocus={profileValidation.handleFocus}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                          profileValidation.errors['emergencyContact.name'] && profileValidation.touched['emergencyContact.name']
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                      />
                      {profileValidation.errors['emergencyContact.name'] && profileValidation.touched['emergencyContact.name'] && (
                        <p className="mt-1 text-sm text-red-600">{profileValidation.errors['emergencyContact.name']}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        name="emergencyContact.phone"
                        value={profileValidation.values.emergencyContact.phone}
                        onChange={(e) => {
                          const { name, value } = e.target;
                          const [parent, child] = name.split('.');
                          profileValidation.setFieldValue('emergencyContact', {
                            ...profileValidation.values.emergencyContact,
                            [child]: value
                          });
                        }}
                        onBlur={profileValidation.handleBlur}
                        onFocus={profileValidation.handleFocus}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                          profileValidation.errors['emergencyContact.phone'] && profileValidation.touched['emergencyContact.phone']
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                      />
                      {profileValidation.errors['emergencyContact.phone'] && profileValidation.touched['emergencyContact.phone'] && (
                        <p className="mt-1 text-sm text-red-600">{profileValidation.errors['emergencyContact.phone']}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Relation</label>
                      <select
                        name="emergencyContact.relation"
                        value={profileValidation.values.emergencyContact.relation}
                        onChange={(e) => {
                          const { name, value } = e.target;
                          const [parent, child] = name.split('.');
                          profileValidation.setFieldValue('emergencyContact', {
                            ...profileValidation.values.emergencyContact,
                            [child]: value
                          });
                        }}
                        onBlur={profileValidation.handleBlur}
                        onFocus={profileValidation.handleFocus}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                          profileValidation.errors['emergencyContact.relation'] && profileValidation.touched['emergencyContact.relation']
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                      >
                        <option value="">Select Relation</option>
                        <option value="spouse">Spouse</option>
                        <option value="parent">Parent</option>
                        <option value="child">Child</option>
                        <option value="sibling">Sibling</option>
                        <option value="friend">Friend</option>
                        <option value="other">Other</option>
                      </select>
                      {profileValidation.errors['emergencyContact.relation'] && profileValidation.touched['emergencyContact.relation'] && (
                        <p className="mt-1 text-sm text-red-600">{profileValidation.errors['emergencyContact.relation']}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleProfileUpdate}
                    disabled={loading || !profileValidation.isValid}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Updating...' : 'Update Medical Info'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Photo Upload Modal */}
      {showPhotoUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
          <div className="bg-white rounded-lg p-4 max-w-sm w-full mx-4 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Upload Profile Photo</h3>
              <button
                onClick={() => {
                  setShowPhotoUpload(false);
                  setPhotoFile(null);
                  setPhotoPreview(null);
                  setPhotoError('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            {/* File Upload Area */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Choose Photo (JPG, PNG - Max 2MB)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <label htmlFor="photo-upload" className="cursor-pointer">
                  <CameraIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Click to browse or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    JPG, PNG files only, max 2MB
                  </p>
                </label>
              </div>
            </div>

            {/* Error Message */}
            {photoError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{photoError}</p>
              </div>
            )}
            
            {/* Photo Preview */}
            {photoPreview && (
              <div className="mb-4 text-center">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Preview</h4>
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="h-32 w-32 rounded-full object-cover mx-auto border-4 border-gray-200"
                />
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowPhotoUpload(false);
                  setPhotoFile(null);
                  setPhotoPreview(null);
                  setPhotoError('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={uploadPhoto}
                disabled={!photoFile || uploadingPhoto}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {uploadingPhoto ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  'Save Photo'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Family Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
          <div className="bg-white rounded-lg p-4 max-w-sm w-full mx-4 max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingMember ? 'Edit Family Member' : 'Add Family Member'}
              </h3>
              <button
                onClick={() => {
                  setShowAddMember(false);
                  setEditingMember(null);
                  setNewMember({
                    name: '',
                    age: '',
                    gender: 'male',
                    phone: '',
                    relation: 'spouse',
                    bloodGroup: '',
                    allergies: '',
                    chronicConditions: ''
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  name="name"
                  value={familyMemberValidation.values.name}
                  onChange={familyMemberValidation.handleChange}
                  onBlur={familyMemberValidation.handleBlur}
                  onFocus={familyMemberValidation.handleFocus}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    familyMemberValidation.errors.name && familyMemberValidation.touched.name
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {familyMemberValidation.errors.name && familyMemberValidation.touched.name && (
                  <p className="mt-1 text-sm text-red-600">{familyMemberValidation.errors.name}</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age *</label>
                  <input
                    type="number"
                    name="age"
                    value={familyMemberValidation.values.age}
                    onChange={familyMemberValidation.handleChange}
                    onBlur={familyMemberValidation.handleBlur}
                    onFocus={familyMemberValidation.handleFocus}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      familyMemberValidation.errors.age && familyMemberValidation.touched.age
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                  {familyMemberValidation.errors.age && familyMemberValidation.touched.age && (
                    <p className="mt-1 text-sm text-red-600">{familyMemberValidation.errors.age}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                  <select
                    name="gender"
                    value={familyMemberValidation.values.gender}
                    onChange={familyMemberValidation.handleChange}
                    onBlur={familyMemberValidation.handleBlur}
                    onFocus={familyMemberValidation.handleFocus}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      familyMemberValidation.errors.gender && familyMemberValidation.touched.gender
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {familyMemberValidation.errors.gender && familyMemberValidation.touched.gender && (
                    <p className="mt-1 text-sm text-red-600">{familyMemberValidation.errors.gender}</p>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={familyMemberValidation.values.phone}
                  onChange={familyMemberValidation.handleChange}
                  onBlur={familyMemberValidation.handleBlur}
                  onFocus={familyMemberValidation.handleFocus}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    familyMemberValidation.errors.phone && familyMemberValidation.touched.phone
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {familyMemberValidation.errors.phone && familyMemberValidation.touched.phone && (
                  <p className="mt-1 text-sm text-red-600">{familyMemberValidation.errors.phone}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Relation *</label>
                <select
                  name="relation"
                  value={familyMemberValidation.values.relation}
                  onChange={familyMemberValidation.handleChange}
                  onBlur={familyMemberValidation.handleBlur}
                  onFocus={familyMemberValidation.handleFocus}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    familyMemberValidation.errors.relation && familyMemberValidation.touched.relation
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                >
                  <option value="spouse">Spouse</option>
                  <option value="parent">Parent</option>
                  <option value="child">Child</option>
                  <option value="sibling">Sibling</option>
                  <option value="other">Other</option>
                </select>
                {familyMemberValidation.errors.relation && familyMemberValidation.touched.relation && (
                  <p className="mt-1 text-sm text-red-600">{familyMemberValidation.errors.relation}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                <select
                  name="bloodGroup"
                  value={familyMemberValidation.values.bloodGroup}
                  onChange={familyMemberValidation.handleChange}
                  onBlur={familyMemberValidation.handleBlur}
                  onFocus={familyMemberValidation.handleFocus}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    familyMemberValidation.errors.bloodGroup && familyMemberValidation.touched.bloodGroup
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                >
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
                {familyMemberValidation.errors.bloodGroup && familyMemberValidation.touched.bloodGroup && (
                  <p className="mt-1 text-sm text-red-600">{familyMemberValidation.errors.bloodGroup}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
                <input
                  type="text"
                  name="allergies"
                  value={familyMemberValidation.values.allergies}
                  onChange={familyMemberValidation.handleChange}
                  onBlur={familyMemberValidation.handleBlur}
                  onFocus={familyMemberValidation.handleFocus}
                  placeholder="List any allergies (comma separated)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Chronic Conditions</label>
                <textarea
                  name="chronicConditions"
                  value={familyMemberValidation.values.chronicConditions}
                  onChange={familyMemberValidation.handleChange}
                  onBlur={familyMemberValidation.handleBlur}
                  onFocus={familyMemberValidation.handleFocus}
                  placeholder="List any chronic conditions"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddMember(false);
                  setEditingMember(null);
                  setNewMember({
                    name: '',
                    age: '',
                    gender: 'male',
                    phone: '',
                    relation: 'spouse',
                    bloodGroup: '',
                    allergies: '',
                    chronicConditions: ''
                  });
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={editingMember ? handleUpdateFamilyMember : handleAddFamilyMember}
                disabled={loading || !familyMemberValidation.isValid}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : editingMember ? 'Update' : 'Add Member'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageAccount;
