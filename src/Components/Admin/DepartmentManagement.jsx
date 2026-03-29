import { useState, useEffect } from 'react';
import axios from 'axios';
import { HiPlus, HiPencil, HiTrash, HiOfficeBuilding, HiCheck, HiX } from 'react-icons/hi';
import { API_BASE_URL } from '../../config/api';

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'hospital',
    services: []
  });

  useEffect(() => {
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
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      if (editingDepartment) {
        // Update existing department
        await axios.put(`${API_BASE_URL}/api/admin/departments/${editingDepartment._id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        // Create new department
        await axios.post(`${API_BASE_URL}/api/admin/departments`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      fetchDepartments();
      setShowModal(false);
      setEditingDepartment(null);
      setFormData({ name: '', description: '', icon: 'hospital', services: [] });
    } catch (error) {
      console.error('Error saving department:', error);
      alert(error.response?.data?.message || 'Error saving department');
    }
  };

  const handleEdit = (department) => {
    setEditingDepartment(department);
    setFormData({
      name: department.name,
      description: department.description,
      icon: department.icon,
      services: department.services || []
    });
    setShowModal(true);
  };

  const handleToggleStatus = async (departmentId, currentStatus) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${action} this department?`)) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_BASE_URL}/api/admin/departments/${departmentId}/status`, {
        isActive: !currentStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDepartments();
    } catch (error) {
      console.error(`Error ${action}ing department:`, error);
      alert(error.response?.data?.message || `Error ${action}ing department`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Department Management</h2>
          <p className="text-gray-600">Manage hospital departments and services</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <HiPlus className="h-4 w-4" />
          <span>Add Department</span>
        </button>
      </div>

      {/* Departments List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          {departments.length === 0 ? (
            <div className="text-center py-8">
              <HiOfficeBuilding className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No departments found. Create your first department.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {departments.map((department) => (
                <div key={department._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium text-gray-900">{department.name}</h3>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(department)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Edit Department"
                      >
                        <HiPencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(department._id, department.isActive)}
                        className={`p-1 transition-colors ${
                          department.isActive 
                            ? 'text-gray-400 hover:text-red-600' 
                            : 'text-gray-400 hover:text-green-600'
                        }`}
                        title={department.isActive ? 'Deactivate Department' : 'Activate Department'}
                      >
                        {department.isActive ? <HiX className="h-4 w-4" /> : <HiCheck className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{department.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className={`px-2 py-1 rounded-full text-xs ${department.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {department.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span>Created: {new Date(department.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">
              {editingDepartment ? 'Edit Department' : 'Add New Department'}
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icon
                </label>
                <select
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="hospital">Hospital</option>
                  <option value="heart">Heart</option>
                  <option value="brain">Brain</option>
                  <option value="bone">Bone</option>
                  <option value="eye">Eye</option>
                  <option value="child">Child</option>
                </select>
              </div>
              
              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingDepartment(null);
                    setFormData({ name: '', description: '', icon: 'hospital', services: [] });
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  {editingDepartment ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
