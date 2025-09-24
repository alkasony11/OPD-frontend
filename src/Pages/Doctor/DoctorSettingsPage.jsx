import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiArrowLeft, HiUser, HiMail, HiPhone, HiCog, HiKey, HiSave, HiEye, HiEyeOff } from 'react-icons/hi';
import axios from 'axios';
import DoctorSidebar from '../../Components/Doctor/Sidebar';
import Swal from 'sweetalert2';

export default function DoctorSettingsPage() {
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  
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
  const [qualificationProofs, setQualificationProofs] = useState([]);
  const [certificationProofs, setCertificationProofs] = useState([]);
  const qualFileInputRef = useRef(null);
  const certFileInputRef = useRef(null);
  const [qualPendingName, setQualPendingName] = useState('');
  const [certPendingName, setCertPendingName] = useState('');

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [preferences, setPreferences] = useState({
    notifications: {
      email: true,
      sms: false,
      appointmentReminders: true,
      leaveRequests: true
    },
    workingHours: {
      start_time: '09:00',
      end_time: '17:00'
    },
    slotDuration: 30,
    maxPatientsPerDay: 20
  });

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
        specialization: parsedUser.specialization || parsedUser.doctor_info?.specialization || '',
        experience: parsedUser.experience || parsedUser.doctor_info?.experience_years || '',
        qualifications: parsedUser.qualifications || parsedUser.doctor_info?.qualifications || '',
        certifications: parsedUser.doctor_info?.certifications || '',
        license_number: parsedUser.doctor_info?.license_number || '',
        languages: (parsedUser.doctor_info?.languages || []).join(', '),
        bio: parsedUser.bio || parsedUser.doctor_info?.bio || ''
      });
      setQualificationProofs(parsedUser.doctor_info?.qualification_proofs || []);
      setCertificationProofs(parsedUser.doctor_info?.certification_proofs || []);

      // Fetch latest profile from backend to ensure admin-entered data is reflected
      (async () => {
        try {
          const token = localStorage.getItem('token');
          const { data } = await axios.get('http://localhost:5001/api/doctor/profile', { headers: { Authorization: `Bearer ${token}` } });
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
          setQualificationProofs(d.doctor_info?.qualification_proofs || []);
          setCertificationProofs(d.doctor_info?.certification_proofs || []);
        } catch {}
      })();
      setLoading(false);
    } catch (error) {
      console.error('Error parsing user data:', error);
      navigate('/login');
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        'http://localhost:5001/api/doctor/profile',
        {
          specialization: profileForm.specialization,
          experience_years: profileForm.experience,
          phone: profileForm.phone,
          qualifications: profileForm.qualifications,
          certifications: profileForm.certifications,
          license_number: profileForm.license_number,
          languages: profileForm.languages,
          bio: profileForm.bio
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update localStorage with new data
      const updatedUser = { ...doctor, ...profileForm };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setDoctor(updatedUser);

      if (response.data?.profileCompleted) {
        await Swal.fire({ icon: 'success', title: 'Profile Completed', text: 'Your account is now active.' });
      } else {
        await Swal.fire({ icon: 'success', title: 'Profile updated' });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      await Swal.fire({ icon: 'error', title: 'Update failed', text: (error.response?.data?.message || 'Unknown error') });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        'http://localhost:5001/api/doctor/password',
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      alert('Password changed successfully!');
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Error changing password: ' + (error.response?.data?.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handlePreferencesUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        'http://localhost:5001/api/doctor/preferences',
        preferences,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('Preferences updated successfully!');
    } catch (error) {
      console.error('Error updating preferences:', error);
      alert('Error updating preferences: ' + (error.response?.data?.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: HiUser },
    { id: 'password', name: 'Password', icon: HiKey },
    { id: 'preferences', name: 'Preferences', icon: HiCog }
  ];

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
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/doctor/dashboard')}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                >
                  <HiArrowLeft className="h-5 w-5" />
                  <span>Back to Dashboard</span>
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                  <p className="text-gray-600">Manage your account settings and preferences</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Profile Information</h2>
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Specialization</label>
                  <input
                    type="text"
                    value={profileForm.specialization}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, specialization: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Years of Experience</label>
                  <input
                    type="number"
                    value={profileForm.experience}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, experience: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Qualifications</label>
                  <input
                    type="text"
                    value={profileForm.qualifications}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, qualifications: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., MBBS, MD, etc."
                  />
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700">Qualification Proof</label>
                    <div className="mt-1 flex items-center gap-3">
                      <input ref={qualFileInputRef} type="file" accept=".pdf,image/*" className="hidden" onChange={async (e)=>{
                        const file = e.target.files && e.target.files[0];
                        if (!file) return;
                        try {
                          const token = localStorage.getItem('token');
                          const form = new FormData();
                          form.append('file', file);
                          const { data } = await axios.post('http://localhost:5001/api/doctor/upload-proof', form, { headers: { Authorization: `Bearer ${token}` } });
                          setQualificationProofs(prev => [...prev, data.fileUrl]);
                          setQualPendingName(file.name);
                          await Swal.fire({ icon: 'success', title: 'Document uploaded' });
                        } catch (err) {
                          await Swal.fire({ icon: 'error', title: 'Upload failed', text: err.response?.data?.message || 'Unknown error' });
                        }
                      }} />
                      <button type="button" onClick={() => qualFileInputRef.current?.click()} className="inline-flex items-center px-3 py-2 rounded-md bg-black text-white text-sm hover:bg-gray-800">
                        Upload Proof
                      </button>
                      <span className="text-sm text-gray-500 truncate max-w-[50%]">{qualPendingName || 'PDF, JPG or PNG (max 5MB)'}</span>
                    </div>
                    {qualificationProofs.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {qualificationProofs.map((url, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <a href={url} target="_blank" rel="noreferrer" className="text-blue-600 underline break-all">{url}</a>
                            <button type="button" onClick={()=>setQualificationProofs(prev=>prev.filter((_,i)=>i!==idx))} className="text-red-600">Remove</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Certifications</label>
                  <input
                    type="text"
                    value={profileForm.certifications}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, certifications: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., FACC, MRCP"
                  />
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700">Certification Proof</label>
                    <div className="mt-1 flex items-center gap-3">
                      <input ref={certFileInputRef} type="file" accept=".pdf,image/*" className="hidden" onChange={async (e)=>{
                        const file = e.target.files && e.target.files[0];
                        if (!file) return;
                        try {
                          const token = localStorage.getItem('token');
                          const form = new FormData();
                          form.append('file', file);
                          const { data } = await axios.post('http://localhost:5001/api/doctor/upload-proof', form, { headers: { Authorization: `Bearer ${token}` } });
                          setCertificationProofs(prev => [...prev, data.fileUrl]);
                          setCertPendingName(file.name);
                          await Swal.fire({ icon: 'success', title: 'Document uploaded' });
                        } catch (err) {
                          await Swal.fire({ icon: 'error', title: 'Upload failed', text: err.response?.data?.message || 'Unknown error' });
                        }
                      }} />
                      <button type="button" onClick={() => certFileInputRef.current?.click()} className="inline-flex items-center px-3 py-2 rounded-md bg-black text-white text-sm hover:bg-gray-800">
                        Upload Proof
                      </button>
                      <span className="text-sm text-gray-500 truncate max-w-[50%]">{certPendingName || 'PDF, JPG or PNG (max 5MB)'}</span>
                    </div>
                    {certificationProofs.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {certificationProofs.map((url, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <a href={url} target="_blank" rel="noreferrer" className="text-blue-600 underline break-all">{url}</a>
                            <button type="button" onClick={()=>setCertificationProofs(prev=>prev.filter((_,i)=>i!==idx))} className="text-red-600">Remove</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">License / Registration Number</label>
                  <input
                    type="text"
                    value={profileForm.license_number}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, license_number: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., TNMC 123456"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Languages</label>
                  <input
                    type="text"
                    value={profileForm.languages}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, languages: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., English, Hindi, Tamil"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Bio</label>
                <textarea
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                  rows={4}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Tell patients about yourself..."
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  <HiSave className="h-4 w-4" />
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
            <div className="mt-6 p-4 border rounded bg-blue-50 text-blue-800 text-sm">
              Note: Please provide your Qualifications, Certifications and License number, and a short Bio. Once these are filled, your account will be activated automatically.
            </div>
          </div>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Change Password</h2>
            <form onSubmit={handlePasswordChange} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Current Password</label>
                <div className="mt-1 relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <HiEyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <HiEye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">New Password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                  minLength={6}
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  <HiSave className="h-4 w-4" />
                  <span>{saving ? 'Changing...' : 'Change Password'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="bg-white shadow-sm rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Preferences</h2>
            <form onSubmit={handlePreferencesUpdate} className="space-y-6">
              {/* Notification Preferences */}
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-4">Notification Preferences</h3>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={preferences.notifications.email}
                      onChange={(e) => setPreferences(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, email: e.target.checked }
                      }))}
                      className="mr-3"
                    />
                    <span className="text-sm text-gray-700">Email notifications</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={preferences.notifications.sms}
                      onChange={(e) => setPreferences(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, sms: e.target.checked }
                      }))}
                      className="mr-3"
                    />
                    <span className="text-sm text-gray-700">SMS notifications</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={preferences.notifications.appointmentReminders}
                      onChange={(e) => setPreferences(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, appointmentReminders: e.target.checked }
                      }))}
                      className="mr-3"
                    />
                    <span className="text-sm text-gray-700">Appointment reminders</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={preferences.notifications.leaveRequests}
                      onChange={(e) => setPreferences(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, leaveRequests: e.target.checked }
                      }))}
                      className="mr-3"
                    />
                    <span className="text-sm text-gray-700">Leave request notifications</span>
                  </label>
                </div>
              </div>

              {/* Working Hours */}
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-4">Default Working Hours</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Time</label>
                    <input
                      type="time"
                      value={preferences.workingHours.start_time}
                      onChange={(e) => setPreferences(prev => ({
                        ...prev,
                        workingHours: { ...prev.workingHours, start_time: e.target.value }
                      }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">End Time</label>
                    <input
                      type="time"
                      value={preferences.workingHours.end_time}
                      onChange={(e) => setPreferences(prev => ({
                        ...prev,
                        workingHours: { ...prev.workingHours, end_time: e.target.value }
                      }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Appointment Settings */}
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-4">Appointment Settings</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Slot Duration (minutes)</label>
                    <select
                      value={preferences.slotDuration}
                      onChange={(e) => setPreferences(prev => ({ ...prev, slotDuration: parseInt(e.target.value) }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={45}>45 minutes</option>
                      <option value={60}>60 minutes</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max Patients Per Day</label>
                    <input
                      type="number"
                      value={preferences.maxPatientsPerDay}
                      onChange={(e) => setPreferences(prev => ({ ...prev, maxPatientsPerDay: parseInt(e.target.value) }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      min="1"
                      max="50"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  <HiSave className="h-4 w-4" />
                  <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}