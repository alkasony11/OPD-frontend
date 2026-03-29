import { useState, useEffect } from 'react';
import { HiPlus, HiPencil, HiTrash, HiEye, HiX } from 'react-icons/hi';
import Swal from 'sweetalert2';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';

export default function DoctorManagement() {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filters, setFilters] = useState({ department: '', specialization: '', status: '' });
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingDoctor, setViewingDoctor] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [doctorForm, setDoctorForm] = useState({
    name: '',
    email: '',
    phone: '',
    gender: '',
    role: 'doctor',
    department: '',
    specialization: '', // comma-separated tags
    experience_years: '',
    consultation_fee: '',
    video_fee: '',
    followup_fee: '',
    consultation_type: 'physical', // physical | video | both (optional)
    employment_type: 'full-time', // full-time | part-time | visiting
    status: 'pending'
  });

  useEffect(() => {
    fetchDoctors();
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/admin/departments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDepartments(response.data.departments || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/admin/doctors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDoctors(response.data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDoctor = async () => {
    try {
      setIsSubmitting(true);
      
      // Validate required fields
      if (!doctorForm.name || !doctorForm.email) {
        alert('Name and email are required');
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(doctorForm.email)) {
        alert('Please enter a valid email address');
        return;
      }

      const token = localStorage.getItem('token');
      
      // Structure the data properly for the backend
      const userData = {
        name: doctorForm.name.trim(),
        email: doctorForm.email.trim().toLowerCase(),
        phone: doctorForm.phone.trim(),
        role: doctorForm.role,
        department: doctorForm.department,
        specialization: doctorForm.specialization.trim(),
        experience_years: parseInt(doctorForm.experience_years) || 0,
        consultation_fee: parseInt(doctorForm.consultation_fee) || 500,
        video_fee: parseInt(doctorForm.video_fee) || 0,
        followup_fee: parseInt(doctorForm.followup_fee) || 0,
        consultation_type: doctorForm.consultation_type,
        employment_type: doctorForm.employment_type,
        status: doctorForm.status // default 'pending' to allow login and complete profile
      };

      const response = await axios.post(`${API_BASE_URL}/api/admin/users`, userData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh the doctors list to get the updated data with populated fields
      await fetchDoctors();
      setShowAddModal(false);
      resetForm();
      
      // Show success message
      const roleText = doctorForm.role === 'doctor' ? 'Doctor' : 'Receptionist';
      const profileText = doctorForm.role === 'doctor' ? ' The doctor has been marked as Pending Profile Completion and should finish their profile under Settings.' : '';
      setSuccessMessage(`${roleText} ${doctorForm.name} added successfully! Credentials sent to ${doctorForm.email}.${profileText}`);
      setTimeout(() => setSuccessMessage(''), 10000); // Clear message after 10 seconds
      
    } catch (error) {
      console.error('Error adding doctor:', error);
      alert('Error adding doctor: ' + (error.response?.data?.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditDoctor = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_BASE_URL}/api/admin/doctors/${editingDoctor._id}`, {
        name: doctorForm.name,
        email: doctorForm.email,
        phone: doctorForm.phone,
        doctor_info: {
          department: doctorForm.department,
          specialization: doctorForm.specialization,
          experience_years: parseInt(doctorForm.experience_years) || 0,
          consultation_fee: parseInt(doctorForm.consultation_fee) || 500,
          video_fee: parseInt(doctorForm.video_fee) || 0,
          followup_fee: parseInt(doctorForm.followup_fee) || 0,
          qualifications: doctorForm.qualifications,
          certifications: doctorForm.certifications,
          license_number: doctorForm.license_number,
          bio: doctorForm.bio,
          consultation_type: doctorForm.consultation_type,
          default_slot_duration: parseInt(doctorForm.slot_duration) || 30,
          employment_type: doctorForm.employment_type,
          active_days: doctorForm.active_days,
          status: doctorForm.status
        }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setDoctors(doctors.map(doc => 
        doc._id === editingDoctor._id ? response.data.doctor : doc
      ));
      setShowEditModal(false);
      setEditingDoctor(null);
      resetForm();
      alert('Doctor updated successfully!');
    } catch (error) {
      console.error('Error updating doctor:', error);
      alert('Error updating doctor: ' + (error.response?.data?.message || 'Unknown error'));
    }
  };

  const filteredDoctors = doctors.filter((d) => {
    const deptOk = !filters.department || d.doctor_info?.department?._id === filters.department;
    const specOk = !filters.specialization || (d.doctor_info?.specialization || '').toLowerCase().includes(filters.specialization.toLowerCase());
    const statusVal = (d.status || (d.isActive === false ? 'inactive' : 'active'));
    const statusOk = !filters.status || statusVal === filters.status;
    return deptOk && specOk && statusOk;
  });

  const handleDeactivate = async (doctor) => {
    const current = doctor.status || (doctor.isActive === false ? 'inactive' : 'active');
    const next = current === 'active' ? 'inactive' : 'active';
    const isDeactivating = next === 'inactive';

    const confirm = await Swal.fire({
      icon: 'warning',
      title: isDeactivating ? 'Deactivate doctor?' : 'Reactivate doctor?',
      html: isDeactivating
        ? '<div style="text-align:center;color:#374151">This doctor will not be able to sign in until reactivated.</div>'
        : '<div style="text-align:center;color:#374151">This doctor will regain access on reactivation.</div>',
      showCancelButton: true,
      confirmButtonText: isDeactivating ? 'Deactivate' : 'Reactivate',
      cancelButtonText: 'Cancel',
      confirmButtonColor: isDeactivating ? '#dc2626' : '#16a34a',
      cancelButtonColor: '#6b7280'
    });
    if (!confirm.isConfirmed) return;

    try {
      const token = localStorage.getItem('token');
      const { data: updated } = await axios.patch(`${API_BASE_URL}/api/admin/users/${doctor._id}`, { status: next }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDoctors(prev => prev.map(d => d._id === doctor._id ? { ...d, ...updated } : d));
      await Swal.fire({
        icon: 'success',
        title: isDeactivating ? 'Doctor deactivated' : 'Doctor reactivated',
        html: isDeactivating
          ? '<div style="text-align:center;color:#374151">Email notification sent to the doctor.</div>'
          : '<div style="text-align:center;color:#374151">Doctor can log in again. Notification sent.</div>'
      });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update status';
      await Swal.fire({ icon: 'error', title: 'Action failed', html: `<div style=\"text-align:center;color:#374151\">${msg}</div>` });
    }
  };

  const handleDelete = async (doctorId) => {
    const confirm = await Swal.fire({
      icon: 'warning',
      title: 'Delete doctor?',
      html: '<div style="text-align:center;color:#374151">This action cannot be undone.</div>',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel'
    });
    if (!confirm.isConfirmed) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/api/admin/doctors/${doctorId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDoctors(doctors.filter(doc => doc._id !== doctorId));
      await Swal.fire({ icon: 'success', title: 'Doctor deleted', html: '<div style="text-align:center;color:#374151">The doctor was removed successfully.</div>' });
    } catch (error) {
      await Swal.fire({ icon: 'error', title: 'Delete failed', html: `<div style=\"text-align:center;color:#374151\">${error.response?.data?.message || 'Unknown error'}\</div>` });
    }
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (doctor) => {
    setEditingDoctor(doctor);
    setDoctorForm({
      name: doctor.name || '',
      email: doctor.email || '',
      phone: doctor.phone || '',
      gender: doctor.gender || '',
      department: doctor.doctor_info?.department?._id || '',
      specialization: doctor.doctor_info?.specialization || '',
      experience_years: doctor.doctor_info?.experience_years || '',
      consultation_fee: doctor.doctor_info?.consultation_fee || '',
      video_fee: doctor.doctor_info?.video_fee || '',
      followup_fee: doctor.doctor_info?.followup_fee || '',
      qualifications: doctor.doctor_info?.qualifications || '',
      certifications: doctor.doctor_info?.certifications || '',
      license_number: doctor.doctor_info?.license_number || '',
      bio: doctor.doctor_info?.bio || ''
    });
    setShowEditModal(true);
  };

  const openViewModal = (doctor) => {
    setViewingDoctor(doctor);
    setShowViewModal(true);
  };

  const resetForm = () => {
    setDoctorForm({
      name: '',
      email: '',
      phone: '',
      gender: '',
      role: 'doctor',
      department: '',
      specialization: '',
      experience_years: '',
      consultation_fee: '',
      video_fee: '',
      followup_fee: '',
      consultation_type: 'physical',
      employment_type: 'full-time',
      status: 'pending'
    });
  };

  if (loading) {
    return <div className="flex justify-center p-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-black">Doctor Management</h3>
          <p className="text-sm text-gray-600">Manage doctor profiles, departments, and credentials</p>
        </div>
        {/* Single Add Doctor button retained below in Filters */}
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setSuccessMessage('')}
                className="text-green-400 hover:text-green-600"
              >
                <HiX className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select value={filters.department} onChange={(e)=>setFilters(f=>({...f, department:e.target.value}))} className="px-3 py-2 border rounded">
            <option value="">All Departments</option>
            {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
          <input value={filters.specialization} onChange={(e)=>setFilters(f=>({...f, specialization:e.target.value}))} placeholder="Filter by specialization" className="px-3 py-2 border rounded" />
          <select value={filters.status} onChange={(e)=>setFilters(f=>({...f, status:e.target.value}))} className="px-3 py-2 border rounded">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button onClick={openAddModal} className="bg-black text-white px-4 py-2 rounded-lg flex items-center justify-center hover:bg-gray-800"><HiPlus className="h-4 w-4 mr-2"/>Add Doctor</button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">S.No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Specialization</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Experience</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fees</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDoctors.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                    No doctors found. Click "Add Doctor" to create the first doctor.
                  </td>
                </tr>
              ) : (
                filteredDoctors.map((doctor, index) => (
                  <tr key={doctor._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {doctor.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doctor.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doctor.phone || 'Not provided'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doctor.doctor_info?.department?.name || 'Not assigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doctor.doctor_info?.specialization || 'Not specified'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {doctor.doctor_info?.experience_years ? `${doctor.doctor_info.experience_years} years` : 'Not specified'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>Consult: ₹{doctor.doctor_info?.consultation_fee || 500}</div>
                      {doctor.doctor_info?.video_fee !== undefined && (
                        <div>Video: ₹{doctor.doctor_info?.video_fee}</div>
                      )}
                      {doctor.doctor_info?.followup_fee !== undefined && (
                        <div>Follow-up: ₹{doctor.doctor_info?.followup_fee}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {(() => {
                        const s = doctor.status || (doctor.isActive===false ? 'inactive' : 'active');
                        const cls = s === 'active'
                          ? 'bg-green-100 text-green-700'
                          : (s === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700');
                        return (
                          <span className={`px-2 py-0.5 rounded text-xs ${cls}`}>{s}</span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openViewModal(doctor)}
                          className="text-green-600 hover:text-green-900 p-1 rounded"
                          title="View Details"
                        >
                          <HiEye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(doctor)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="Edit Doctor"
                        >
                          <HiPencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeactivate(doctor)}
                          className="text-yellow-600 hover:text-yellow-800 p-1 rounded"
                          title="Activate/Deactivate"
                        >
                          { (doctor.status || (doctor.isActive === false ? 'inactive' : 'active')) === 'active' ? 'Deactivate' : 'Activate' }
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Doctor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Add New User</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <HiX className="h-6 w-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name *</label>
                <input
                  type="text"
                  value={doctorForm.name}
                  onChange={(e) => setDoctorForm(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email *</label>
                <input
                  type="email"
                  value={doctorForm.email}
                  onChange={(e) => setDoctorForm(prev => ({ ...prev, email: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  value={doctorForm.phone}
                  onChange={(e) => setDoctorForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Gender</label>
                <select
                  value={doctorForm.gender}
                  onChange={(e) => setDoctorForm(prev => ({ ...prev, gender: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Department</label>
                <select
                  value={doctorForm.department}
                  onChange={(e) => setDoctorForm(prev => ({ ...prev, department: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept._id} value={dept._id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Specialization</label>
                <input
                  type="text"
                  value={doctorForm.specialization}
                  onChange={(e) => setDoctorForm(prev => ({ ...prev, specialization: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Cardiology, Neurology"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Experience (Years)</label>
                <input
                  type="number"
                  value={doctorForm.experience_years}
                  onChange={(e) => setDoctorForm(prev => ({ ...prev, experience_years: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Consultation Fee (₹)</label>
                <input
                  type="number"
                  value={doctorForm.consultation_fee}
                  onChange={(e) => setDoctorForm(prev => ({ ...prev, consultation_fee: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  placeholder="500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Video Fee (₹)</label>
                <input
                  type="number"
                  value={doctorForm.video_fee}
                  onChange={(e) => setDoctorForm(prev => ({ ...prev, video_fee: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Follow-up Fee (₹)</label>
                <input
                  type="number"
                  value={doctorForm.followup_fee}
                  onChange={(e) => setDoctorForm(prev => ({ ...prev, followup_fee: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>

              {/* Doctor will complete: qualifications, certifications, license, bio during onboarding */}
            </div>

            {/* Consultation Settings (admin policy) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Consultation Type</label>
                <select
                  value={doctorForm.consultation_type}
                  onChange={(e)=>setDoctorForm(prev=>({...prev, consultation_type: e.target.value}))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="physical">Physical</option>
                  <option value="video">Video</option>
                  <option value="both">Both</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Slot Duration</label>
                <select
                  value={doctorForm.slot_duration}
                  onChange={(e)=>setDoctorForm(prev=>({...prev, slot_duration: parseInt(e.target.value)||30}))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[10,15,20,30].map(m => <option key={m} value={m}>{m} min</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Employment Type</label>
                <select
                  value={doctorForm.employment_type}
                  onChange={(e)=>setDoctorForm(prev=>({...prev, employment_type: e.target.value}))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="visiting">Visiting</option>
                </select>
              </div>
            </div>

            {/* Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={doctorForm.status}
                  onChange={(e)=>setDoctorForm(prev=>({...prev, status: e.target.value}))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pending Profile Completion</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAddDoctor}
                disabled={isSubmitting}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Adding...
                  </>
                ) : (
                  'Add Doctor'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Doctor Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Edit Doctor</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <HiX className="h-6 w-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name *</label>
                <input
                  type="text"
                  value={doctorForm.name}
                  onChange={(e) => setDoctorForm(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email *</label>
                <input
                  type="email"
                  value={doctorForm.email}
                  onChange={(e) => setDoctorForm(prev => ({ ...prev, email: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  value={doctorForm.phone}
                  onChange={(e) => setDoctorForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Department</label>
                <select
                  value={doctorForm.department}
                  onChange={(e) => setDoctorForm(prev => ({ ...prev, department: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept._id} value={dept._id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Specialization</label>
                <input
                  type="text"
                  value={doctorForm.specialization}
                  onChange={(e) => setDoctorForm(prev => ({ ...prev, specialization: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Cardiology, Neurology"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Experience (Years)</label>
                <input
                  type="number"
                  value={doctorForm.experience_years}
                  onChange={(e) => setDoctorForm(prev => ({ ...prev, experience_years: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Consultation Fee (₹)</label>
                <input
                  type="number"
                  value={doctorForm.consultation_fee}
                  onChange={(e) => setDoctorForm(prev => ({ ...prev, consultation_fee: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Qualifications</label>
                <input
                  type="text"
                  value={doctorForm.qualifications}
                  onChange={(e) => setDoctorForm(prev => ({ ...prev, qualifications: e.target.value }))}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., MBBS, MD"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Bio</label>
              <textarea
                value={doctorForm.bio}
                onChange={(e) => setDoctorForm(prev => ({ ...prev, bio: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Brief description about the doctor"
              />
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleEditDoctor}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
              >
                Update Doctor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Doctor Modal */}
      {showViewModal && viewingDoctor && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Doctor Details</h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <HiX className="h-6 w-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 uppercase">Personal Information</h4>
                <div className="mt-2 space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Name:</span>
                    <span className="ml-2 text-sm text-gray-900">{viewingDoctor.name}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Email:</span>
                    <span className="ml-2 text-sm text-gray-900">{viewingDoctor.email}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Phone:</span>
                    <span className="ml-2 text-sm text-gray-900">{viewingDoctor.phone || 'Not provided'}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 uppercase">Professional Information</h4>
                <div className="mt-2 space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Department:</span>
                    <span className="ml-2 text-sm text-gray-900">{viewingDoctor.doctor_info?.department?.name || 'Not assigned'}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Specialization:</span>
                    <span className="ml-2 text-sm text-gray-900">{viewingDoctor.doctor_info?.specialization || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Experience:</span>
                    <span className="ml-2 text-sm text-gray-900">
                      {viewingDoctor.doctor_info?.experience_years ? `${viewingDoctor.doctor_info.experience_years} years` : 'Not specified'}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Consultation Fee:</span>
                    <span className="ml-2 text-sm text-gray-900">₹{viewingDoctor.doctor_info?.consultation_fee || 500}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Qualifications:</span>
                    <span className="ml-2 text-sm text-gray-900">{viewingDoctor.doctor_info?.qualifications || 'Not specified'}</span>
                  </div>
                </div>
              </div>
            </div>

            {viewingDoctor.doctor_info?.bio && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-500 uppercase">Bio</h4>
                <p className="mt-2 text-sm text-gray-900">{viewingDoctor.doctor_info.bio}</p>
              </div>
            )}

            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-500 uppercase">Account Information</h4>
              <div className="mt-2 space-y-2">
                <div>
                  <span className="text-sm font-medium text-gray-700">Account Created:</span>
                  <span className="ml-2 text-sm text-gray-900">
                    {new Date(viewingDoctor.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Verification Status:</span>
                  <span className={`ml-2 text-sm ${viewingDoctor.isVerified ? 'text-green-600' : 'text-red-600'}`}>
                    {viewingDoctor.isVerified ? 'Verified' : 'Not Verified'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  openEditModal(viewingDoctor);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Edit Doctor
              </button>
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}