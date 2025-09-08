import { useState, useEffect } from 'react';
import { HiPlus, HiPencil, HiTrash, HiEye, HiX } from 'react-icons/hi';
import axios from 'axios';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingUser, setViewingUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'doctor',
    department: '',
    specialization: '',
    experience_years: '',
    consultation_fee: '',
    qualifications: '',
    bio: ''
  });

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/api/admin/departments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDepartments(response.data.departments || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!userForm.name || !userForm.email) {
        alert('Name and email are required');
        return;
      }

      const token = localStorage.getItem('token');
      
      const userData = {
        name: userForm.name.trim(),
        email: userForm.email.trim().toLowerCase(),
        phone: userForm.phone.trim(),
        role: userForm.role,
        department: userForm.department,
        specialization: userForm.specialization.trim(),
        experience_years: parseInt(userForm.experience_years) || 0,
        consultation_fee: parseInt(userForm.consultation_fee) || 500,
        qualifications: userForm.qualifications.trim(),
        bio: userForm.bio.trim()
      };

      const response = await axios.post('http://localhost:5001/api/admin/users', userData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      await fetchUsers();
      setShowAddModal(false);
      resetForm();
      
      const roleText = userForm.role === 'doctor' ? 'Doctor' : 'Receptionist';
      const scheduleText = userForm.role === 'doctor' ? ' Initial schedules have been created for the next 30 days.' : '';
      setSuccessMessage(`${roleText} ${userForm.name} added successfully! Login credentials have been sent to ${userForm.email}.${scheduleText}`);
      setTimeout(() => setSuccessMessage(''), 10000);
      
    } catch (error) {
      console.error('Error adding user:', error);
      alert('Error adding user: ' + (error.response?.data?.message || 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setUserForm({
      name: '',
      email: '',
      phone: '',
      role: 'doctor',
      department: '',
      specialization: '',
      experience_years: '',
      consultation_fee: '',
      qualifications: '',
      bio: ''
    });
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setUserForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || 'doctor',
      department: user.doctor_info?.department?._id || user.receptionist_info?.department?._id || '',
      specialization: user.doctor_info?.specialization || '',
      experience_years: user.doctor_info?.experience_years || '',
      consultation_fee: user.doctor_info?.consultation_fee || '',
      qualifications: user.doctor_info?.qualifications || '',
      bio: user.doctor_info?.bio || ''
    });
    setShowEditModal(true);
  };

  const openViewModal = (user) => {
    setViewingUser(user);
    setShowViewModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="flex justify-center p-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
    </div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        <button
          onClick={openAddModal}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <HiPlus className="h-5 w-5" />
          <span>Add User</span>
        </button>
      </div>

      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {successMessage}
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {users.length === 0 ? (
            <li className="px-6 py-4 text-center text-gray-500">
              No users found. Click "Add User" to create the first user.
            </li>
          ) : (
            users.map((user, index) => (
              <li key={user._id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 text-sm text-gray-500">
                      {index + 1}.
                    </div>
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {user.name?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      <div className="text-sm text-gray-500">
                        {user.role} • {user.doctor_info?.department?.name || user.receptionist_info?.department?.name || 'No Department'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.role === 'doctor' 
                        ? 'bg-blue-100 text-blue-800' 
                        : user.role === 'receptionist'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role}
                    </span>
                    <button
                      onClick={() => openViewModal(user)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <HiEye className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => openEditModal(user)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <HiPencil className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Add User Modal */}
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
            
            <form onSubmit={handleAddUser}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name *</label>
                  <input
                    type="text"
                    value={userForm.name}
                    onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email *</label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    value={userForm.phone}
                    onChange={(e) => setUserForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Role *</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="doctor">Doctor</option>
                    <option value="receptionist">Receptionist</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Department</label>
                  <select
                    value={userForm.department}
                    onChange={(e) => setUserForm(prev => ({ ...prev, department: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept._id} value={dept._id}>{dept.name}</option>
                    ))}
                  </select>
                </div>

                {userForm.role === 'doctor' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Specialization</label>
                      <input
                        type="text"
                        value={userForm.specialization}
                        onChange={(e) => setUserForm(prev => ({ ...prev, specialization: e.target.value }))}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Cardiology, Neurology"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Experience (Years)</label>
                      <input
                        type="number"
                        value={userForm.experience_years}
                        onChange={(e) => setUserForm(prev => ({ ...prev, experience_years: e.target.value }))}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Consultation Fee (₹)</label>
                      <input
                        type="number"
                        value={userForm.consultation_fee}
                        onChange={(e) => setUserForm(prev => ({ ...prev, consultation_fee: e.target.value }))}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Qualifications</label>
                      <input
                        type="text"
                        value={userForm.qualifications}
                        onChange={(e) => setUserForm(prev => ({ ...prev, qualifications: e.target.value }))}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., MBBS, MD"
                      />
                    </div>
                  </>
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Bio</label>
                  <textarea
                    value={userForm.bio}
                    onChange={(e) => setUserForm(prev => ({ ...prev, bio: e.target.value }))}
                    rows="3"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Brief description..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Adding...' : 'Add User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View User Modal */}
      {showViewModal && viewingUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">View User</h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <HiX className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-3 text-sm text-gray-700">
              <div>
                <span className="font-medium">Name: </span>{viewingUser.name || '-'}
              </div>
              <div>
                <span className="font-medium">Email: </span>{viewingUser.email || '-'}
              </div>
              <div>
                <span className="font-medium">Phone: </span>{viewingUser.phone || '-'}
              </div>
              <div>
                <span className="font-medium">Role: </span>{viewingUser.role || '-'}
              </div>
              <div>
                <span className="font-medium">Verified: </span>{viewingUser.isVerified ? 'Yes' : 'No'}
              </div>
              <div>
                <span className="font-medium">Created: </span>{formatDate(viewingUser.createdAt)}
              </div>
              <div>
                <span className="font-medium">Updated: </span>{formatDate(viewingUser.updatedAt)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Edit User</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <HiX className="h-6 w-6" />
              </button>
            </div>

            <EditUserForm
              user={editingUser}
              onCancel={() => setShowEditModal(false)}
              onSave={async (payload) => {
                try {
                  const token = localStorage.getItem('token');
                  const response = await axios.put(`http://localhost:5001/api/admin/users/${editingUser._id}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                  });
                  const updated = response.data;
                  setUsers(prev => prev.map(u => u._id === updated._id ? updated : u));
                  setShowEditModal(false);
                } catch (error) {
                  console.error('Error updating user:', error);
                  alert('Error updating user: ' + (error.response?.data?.message || 'Unknown error'));
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function EditUserForm({ user, onCancel, onSave }) {
  const [form, setForm] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    isVerified: !!user.isVerified
  });
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSave({
        name: form.name,
        email: form.email,
        phone: form.phone,
        isVerified: form.isVerified
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Phone</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center">
          <input
            id="isVerified"
            type="checkbox"
            checked={form.isVerified}
            onChange={(e) => setForm(prev => ({ ...prev, isVerified: e.target.checked }))}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
          />
          <label htmlFor="isVerified" className="ml-2 block text-sm text-gray-700">Verified</label>
        </div>
      </div>

      <div className="flex justify-end space-x-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}