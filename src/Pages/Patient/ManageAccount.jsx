import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from '../../config/api';
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

const ManageAccount = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [showMessage, setShowMessage] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isProfileIncomplete, setIsProfileIncomplete] = useState(false);

  // Form states
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
    fetchUserData();
    fetchFamilyMembers();
  }, []);

  // Handle location state for profile completion messages
  useEffect(() => {
    if (location.state?.message) {
      setMessageText(location.state.message);
      setShowMessage(true);
      setIsProfileIncomplete(location.state.isProfileIncomplete || false);
      
      // Don't auto-hide message - keep it until profile is complete
    }
  }, [location.state]);

  // Check if profile is complete based on required fields
  const isProfileComplete = () => {
    if (!user) return false;
    
    // Check required fields: phone, dob, gender
    const hasPhone = user.phone && user.phone.trim() !== '';
    const hasDob = user.dob && user.dob !== '';
    const hasGender = user.gender && user.gender.trim() !== '';
    
    return hasPhone && hasDob && hasGender;
  };

  // Update message visibility when profile data changes
  useEffect(() => {
    if (showMessage && isProfileIncomplete && isProfileComplete()) {
      // Profile is now complete, hide the message
      setShowMessage(false);
      setIsProfileIncomplete(false);
    }
  }, [user, showMessage, isProfileIncomplete]);

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
          setProfileData({
            name: localUser.name || '',
            age: localUser.age || '',
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
          });
          return;
        }
      }
      
      console.log('Making API call to:', '${API_BASE_URL}/api/patient/profile');
      
      const response = await axios.get('${API_BASE_URL}/api/patient/profile', {
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
      setProfileData({
        name: userData.name || '',
        age: userData.age || '',
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
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      console.error('Error response:', error.response?.data);
      
      // Fallback to localStorage data on error
      const localUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (localUser.name) {
        console.log('Using localStorage data as fallback after API error');
        setUser(localUser);
        setProfileData({
          name: localUser.name || '',
          age: localUser.age || '',
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
        });
      } else {
        Swal.fire('Error', 'Failed to load profile data', 'error');
      }
    }
  };

  const fetchFamilyMembers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('${API_BASE_URL}/api/patient/family-members', {
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
      const response = await axios.post('${API_BASE_URL}/api/patient/upload-photo', formData, {
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
        
        await axios.delete('${API_BASE_URL}/api/patient/remove-photo', {
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
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      await axios.put('${API_BASE_URL}/api/patient/profile', profileData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Swal.fire('Success', 'Profile updated successfully!', 'success');
      fetchUserData();
    } catch (error) {
      console.error('Error updating profile:', error);
      Swal.fire('Error', 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFamilyMember = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post('${API_BASE_URL}/api/patient/family-members', newMember, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setFamilyMembers(prev => [...prev, response.data.familyMember]);
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
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      await axios.put(`${API_BASE_URL}/api/patient/family-members/${editingMember._id}`, newMember, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setFamilyMembers(prev => 
        prev.map(m => m._id === editingMember._id ? { ...m, ...newMember } : m)
      );
      
      setEditingMember(null);
      setShowAddMember(false);
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
      `,
      focusConfirm: false,
      preConfirm: () => {
        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        
        if (!currentPassword || !newPassword || !confirmPassword) {
          Swal.showValidationMessage('Please fill in all fields');
          return false;
        }
        
        if (newPassword !== confirmPassword) {
          Swal.showValidationMessage('New passwords do not match');
          return false;
        }
        
        if (newPassword.length < 6) {
          Swal.showValidationMessage('Password must be at least 6 characters');
          return false;
        }
        
        return { currentPassword, newPassword };
      }
    });

    if (formValues) {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        await axios.put('${API_BASE_URL}/api/patient/change-password', {
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manage Account</h1>
          <p className="mt-2 text-gray-600">Update your personal information and account settings</p>
        </div>

        {/* Profile Completion Message */}
        {showMessage && (
          <div className={`mb-6 p-4 rounded-lg border-l-4 ${
            isProfileIncomplete 
              ? 'bg-blue-50 border-blue-400 text-blue-800' 
              : 'bg-green-50 border-green-400 text-green-800'
          }`}>
            <div className="flex items-start">
              <InformationCircleIcon className="h-5 w-5 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">{messageText}</p>
                {isProfileIncomplete && (
                  <div className="text-xs mt-2 opacity-90">
                    <p className="mb-1">Please complete the following required fields:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {(!user?.phone || user.phone.trim() === '') && (
                        <li>Phone Number</li>
                      )}
                      {(!user?.dob || user.dob === '') && (
                        <li>Date of Birth</li>
                      )}
                      {(!user?.gender || user.gender.trim() === '') && (
                        <li>Gender</li>
                      )}
                    </ul>
                  </div>
                )}
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
                        src={(user.profilePhoto || user.profile_photo).startsWith('http') 
                          ? (user.profilePhoto || user.profile_photo)
                          : `${API_BASE_URL}${user.profilePhoto || user.profile_photo}`
                        }
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                    <input
                      type="number"
                      value={profileData.age}
                      onChange={(e) => setProfileData(prev => ({ ...prev, age: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                    <select
                      value={profileData.gender}
                      onChange={(e) => setProfileData(prev => ({ ...prev, gender: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                    <textarea
                      value={profileData.address}
                      onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleProfileUpdate}
                    disabled={loading}
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Blood Group</label>
                    <select
                      value={profileData.bloodGroup}
                      onChange={(e) => setProfileData(prev => ({ ...prev, bloodGroup: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Allergies</label>
                    <input
                      type="text"
                      value={profileData.allergies}
                      onChange={(e) => setProfileData(prev => ({ ...prev, allergies: e.target.value }))}
                      placeholder="List any allergies (comma separated)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Chronic Conditions</label>
                    <textarea
                      value={profileData.chronicConditions}
                      onChange={(e) => setProfileData(prev => ({ ...prev, chronicConditions: e.target.value }))}
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                      <input
                        type="text"
                        value={profileData.emergencyContact.name}
                        onChange={(e) => setProfileData(prev => ({
                          ...prev,
                          emergencyContact: { ...prev.emergencyContact, name: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <input
                        type="tel"
                        value={profileData.emergencyContact.phone}
                        onChange={(e) => setProfileData(prev => ({
                          ...prev,
                          emergencyContact: { ...prev.emergencyContact, phone: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Relation</label>
                      <select
                        value={profileData.emergencyContact.relation}
                        onChange={(e) => setProfileData(prev => ({
                          ...prev,
                          emergencyContact: { ...prev.emergencyContact, relation: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Relation</option>
                        <option value="spouse">Spouse</option>
                        <option value="parent">Parent</option>
                        <option value="child">Child</option>
                        <option value="sibling">Sibling</option>
                        <option value="friend">Friend</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleProfileUpdate}
                    disabled={loading}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
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
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={newMember.name}
                  onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                  <input
                    type="number"
                    value={newMember.age}
                    onChange={(e) => setNewMember(prev => ({ ...prev, age: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                  <select
                    value={newMember.gender}
                    onChange={(e) => setNewMember(prev => ({ ...prev, gender: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={newMember.phone}
                  onChange={(e) => setNewMember(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Relation</label>
                <select
                  value={newMember.relation}
                  onChange={(e) => setNewMember(prev => ({ ...prev, relation: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="spouse">Spouse</option>
                  <option value="parent">Parent</option>
                  <option value="child">Child</option>
                  <option value="sibling">Sibling</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Blood Group</label>
                <select
                  value={newMember.bloodGroup}
                  onChange={(e) => setNewMember(prev => ({ ...prev, bloodGroup: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Allergies</label>
                <input
                  type="text"
                  value={newMember.allergies}
                  onChange={(e) => setNewMember(prev => ({ ...prev, allergies: e.target.value }))}
                  placeholder="List any allergies (comma separated)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chronic Conditions</label>
                <textarea
                  value={newMember.chronicConditions}
                  onChange={(e) => setNewMember(prev => ({ ...prev, chronicConditions: e.target.value }))}
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
                disabled={loading || !newMember.name || !newMember.age}
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
