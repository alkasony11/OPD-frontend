import { useState, useEffect } from 'react';
import axios from 'axios';

export default function RoleDebugger() {
  const [userInfo, setUserInfo] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newRole, setNewRole] = useState('patient');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchUserInfo();
    fetchAllUsers();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/debug/user-role', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserInfo(response.data.user);
    } catch (error) {
      console.error('Error fetching user info:', error);
      setMessage('Error fetching user info: ' + error.response?.data?.message);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/debug/all-users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching all users:', error);
    }
  };

  const updateUserRole = async () => {
    if (!newRole) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put('/api/debug/update-role', 
        { newRole }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setMessage(response.data.message);
      fetchUserInfo(); // Refresh user info
      
      // Clear localStorage to force re-authentication
      setTimeout(() => {
        localStorage.removeItem('user');
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('Error updating role:', error);
      setMessage('Error updating role: ' + error.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Role Debugger</h1>
      
      {message && (
        <div className={`p-4 rounded-lg mb-4 ${
          message.includes('Error') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
        }`}>
          {message}
        </div>
      )}

      {/* Current User Info */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Current User Information</h2>
        {userInfo ? (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong>Name:</strong> {userInfo.name}
              </div>
              <div>
                <strong>Email:</strong> {userInfo.email}
              </div>
              <div>
                <strong>Role:</strong> 
                <span className={`ml-2 px-2 py-1 rounded text-sm ${
                  userInfo.role === 'patient' ? 'bg-blue-100 text-blue-800' :
                  userInfo.role === 'doctor' ? 'bg-green-100 text-green-800' :
                  userInfo.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {userInfo.role}
                </span>
              </div>
              <div>
                <strong>Patient ID:</strong> {userInfo.patientId || 'N/A'}
              </div>
              <div>
                <strong>Auth Provider:</strong> {userInfo.authProvider}
              </div>
              <div>
                <strong>Verified:</strong> {userInfo.isVerified ? 'Yes' : 'No'}
              </div>
            </div>
          </div>
        ) : (
          <p>Loading user information...</p>
        )}
      </div>

      {/* Role Update */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Update User Role</h2>
        <div className="bg-yellow-50 p-4 rounded-lg mb-4">
          <p className="text-yellow-800">
            <strong>Warning:</strong> Changing your role will log you out and require you to log in again. 
            Make sure you select the correct role for your account.
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="patient">Patient</option>
            <option value="doctor">Doctor</option>
            <option value="admin">Admin</option>
            <option value="receptionist">Receptionist</option>
          </select>
          
          <button
            onClick={updateUserRole}
            disabled={loading || !newRole}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating...' : 'Update Role'}
          </button>
        </div>
      </div>

      {/* All Users List */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">All Users in System</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Name</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Email</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Role</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Patient ID</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Auth Provider</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Verified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {allUsers.map((user) => (
                <tr key={user.id} className={user.id === userInfo?.id ? 'bg-blue-50' : ''}>
                  <td className="px-4 py-2 text-sm text-gray-900">{user.name}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">{user.email}</td>
                  <td className="px-4 py-2 text-sm">
                    <span className={`px-2 py-1 rounded text-xs ${
                      user.role === 'patient' ? 'bg-blue-100 text-blue-800' :
                      user.role === 'doctor' ? 'bg-green-100 text-green-800' :
                      user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900">{user.patientId || 'N/A'}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">{user.authProvider}</td>
                  <td className="px-4 py-2 text-sm text-gray-900">{user.isVerified ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">How to Fix the Role Issue:</h3>
        <ol className="list-decimal list-inside text-blue-800 space-y-1">
          <li>Check your current role above</li>
          <li>If your role is not "patient", select "patient" from the dropdown</li>
          <li>Click "Update Role" to change your role to patient</li>
          <li>You will be automatically logged out and redirected to login</li>
          <li>Log in again and try booking an appointment</li>
        </ol>
      </div>
    </div>
  );
}
