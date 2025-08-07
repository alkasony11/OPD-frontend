import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AdminSidebar from '../../Components/Admin/Sidebar';
import {
  HiPlus,
  HiPencil,
  HiTrash,
  HiEye,
  HiSearch,
  HiX,
  HiCheckCircle,
  HiClipboardCopy,
  HiMail
} from 'react-icons/hi';

export default function DoctorManagement() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    specialization: '',
    experience_years: ''
  });
  const [verificationData, setVerificationData] = useState({
    email: '',
    name: '',
    otp: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdDoctor, setCreatedDoctor] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    // Check admin access
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!userData || !token) {
      navigate('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 'admin' && parsedUser.email !== process.env.REACT_APP_ADMIN_EMAIL) {
        navigate('/');
        return;
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      navigate('/login');
      return;
    }

    fetchDoctors();
  }, [navigate]);

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Filter only doctors
      const doctorUsers = response.data.filter(user => user.role === 'doctor');
      setDoctors(doctorUsers);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setError('Failed to fetch doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');

    // Validate required fields
    if (!formData.name || !formData.email) {
      setError('Name and email are required');
      setFormLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');

      const response = await axios.post('http://localhost:5001/api/admin/users', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || '',
        role: 'doctor',
        department: formData.department || '',
        specialization: formData.specialization || '',
        experience_years: parseInt(formData.experience_years) || 0
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Store the created doctor data
      setCreatedDoctor({
        ...response.data.user,
        tempPassword: response.data.tempPassword || 'Sent via email'
      });

      // Add to doctors list immediately
      setDoctors(prevDoctors => [...prevDoctors, response.data.user]);

      // Close add modal and show success modal
      setShowAddModal(false);
      setShowSuccessModal(true);
      resetForm();

      showToast('Doctor added successfully! Credentials sent via email.', 'success');

    } catch (error) {
      console.error('Error adding doctor:', error);
      const errorMessage = error.response?.data?.message || 'Failed to add doctor. Please try again.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditDoctor = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`http://localhost:5001/api/admin/users/${selectedDoctor._id}`, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setDoctors(doctors.map(doc => 
        doc._id === selectedDoctor._id ? response.data : doc
      ));
      setShowEditModal(false);
      resetForm();
      alert('Doctor updated successfully!');
    } catch (error) {
      console.error('Error updating doctor:', error);
      setError(error.response?.data?.message || 'Failed to update doctor');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteDoctor = async (doctorId) => {
    if (!window.confirm('Are you sure you want to delete this doctor?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5001/api/admin/users/${doctorId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setDoctors(doctors.filter(doc => doc._id !== doctorId));
      alert('Doctor deleted successfully!');
    } catch (error) {
      console.error('Error deleting doctor:', error);
      setError(error.response?.data?.message || 'Failed to delete doctor');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      department: '',
      specialization: '',
      experience_years: ''
    });
    setSelectedDoctor(null);
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 3000);
  };





  const copyCredentials = () => {
    if (createdDoctor) {
      const credentials = `Doctor Login Credentials:
Email: ${createdDoctor.email}
Temporary Password: ${createdDoctor.tempPassword}
Role: Doctor
Department: ${createdDoctor.doctor_info?.department || 'Not specified'}

Please change your password after first login.`;

      navigator.clipboard.writeText(credentials).then(() => {
        showToast('Credentials copied to clipboard!', 'success');
      }).catch(() => {
        showToast('Failed to copy credentials', 'error');
      });
    }
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    setCreatedDoctor(null);
    // Refresh the doctors list to ensure it's up to date
    fetchDoctors();
  };

  const openEditModal = (doctor) => {
    setSelectedDoctor(doctor);
    setFormData({
      name: doctor.name,
      email: doctor.email,
      phone: doctor.phone || '',
      department: doctor.doctor_info?.department || '',
      specialization: doctor.doctor_info?.specialization || '',
      experience_years: doctor.doctor_info?.experience_years || ''
    });
    setShowEditModal(true);
  };

  const filteredDoctors = doctors.filter(doctor =>
    doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doctor.doctor_info?.department || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doctor.doctor_info?.specialization || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <AdminSidebar />
        <div className="flex-1 ml-64 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading doctors...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      
      <div className="flex-1 ml-64 overflow-hidden">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Doctor Management</h1>
              <p className="text-gray-600">Add, edit, and manage doctor profiles and availability</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <HiPlus className="h-5 w-5 mr-2" />
              Add Doctor
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search doctors by name, email, department, or specialization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Doctors Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Doctor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Specialization
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Experience
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDoctors.map((doctor) => (
                    <tr key={doctor._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{doctor.name}</div>
                          <div className="text-sm text-gray-500">{doctor.email}</div>
                          <div className="text-sm text-gray-500">{doctor.phone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {doctor.doctor_info?.department || 'Not specified'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {doctor.doctor_info?.specialization || 'Not specified'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {doctor.doctor_info?.experience_years || 0} years
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          doctor.doctor_info?.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {doctor.doctor_info?.status || 'active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openEditModal(doctor)}
                            className="text-gray-600 hover:text-gray-900"
                            title="Edit Doctor"
                          >
                            <HiPencil className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteDoctor(doctor._id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Doctor"
                          >
                            <HiTrash className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredDoctors.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No doctors found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Doctor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Add New Doctor</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <HiX className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleAddDoctor} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  placeholder="Dr. John Smith"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  placeholder="doctor@hospital.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                >
                  <option value="">Select Department</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="General Medicine">General Medicine</option>
                  <option value="Surgery">Surgery</option>
                  <option value="Dermatology">Dermatology</option>
                  <option value="Psychiatry">Psychiatry</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Specialization
                </label>
                <input
                  type="text"
                  value={formData.specialization}
                  onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  placeholder="Heart Surgery, Brain Surgery, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Years of Experience
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={formData.experience_years}
                  onChange={(e) => setFormData({...formData, experience_years: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  placeholder="5"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  {formLoading ? 'Adding...' : 'Add Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Doctor Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Edit Doctor</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <HiX className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleEditDoctor} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Department & Specialization:</p>
                <p className="text-sm font-medium text-gray-900">
                  {formData.department || 'Not specified'} - {formData.specialization || 'Not specified'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Contact support to update department and specialization
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  {formLoading ? 'Updating...' : 'Update Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && createdDoctor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <HiCheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Doctor Account Created Successfully</h2>
              <p className="text-gray-600">
                Dr. {createdDoctor.name} has been added to the system. Login credentials have been sent to their email address.
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <HiMail className="h-5 w-5 text-green-600 mr-2" />
                <div>
                  <p className="text-sm font-semibold text-green-800">Email Sent Successfully</p>
                  <p className="text-xs text-green-600">Login credentials sent to {createdDoctor.email}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Login Credentials (Reference Copy)</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-medium text-gray-900">{createdDoctor.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Temporary Password:</span>
                  <span className="font-mono font-medium text-gray-900 bg-white px-2 py-1 rounded border">
                    {createdDoctor.tempPassword}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Department:</span>
                  <span className="font-medium text-gray-900">
                    {createdDoctor.doctor_info?.department || 'Not specified'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Specialization:</span>
                  <span className="font-medium text-gray-900">
                    {createdDoctor.doctor_info?.specialization || 'Not specified'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
              <p className="text-sm text-blue-800">
                <strong>📋 Admin Reference:</strong> The credentials above are for your reference.
                The doctor has already received them via email and can login immediately.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={copyCredentials}
                className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <HiClipboardCopy className="h-4 w-4 mr-2" />
                Copy Credentials
              </button>
              <button
                onClick={closeSuccessModal}
                className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transition-all duration-300 ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center">
            {toast.type === 'success' ? (
              <HiCheckCircle className="h-5 w-5 mr-2" />
            ) : (
              <HiX className="h-5 w-5 mr-2" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transition-all duration-300 ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center">
            {toast.type === 'success' ? (
              <HiCheckCircle className="h-5 w-5 mr-2" />
            ) : (
              <HiX className="h-5 w-5 mr-2" />
            )}
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
