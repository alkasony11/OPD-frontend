import { useState, useEffect } from 'react';
import { HiSearch, HiArrowLeft, HiArrowRight } from 'react-icons/hi';
import axios from 'axios';
import Swal from 'sweetalert2';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Minimal filter and pagination
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`http://localhost:5001/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Support both array and paginated shapes
      const list = Array.isArray(data) ? data : (data.users || []);
      setUsers(list);
      setTotal(list.length);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
      });
    } catch (_) { return '-'; }
  };

  const getStatusBadge = (u) => {
    const s = u.status || (u.isActive === false ? 'inactive' : 'active');
    return s;
  };

  const toggleStatus = async (userId, current) => {
    const next = (current === 'active') ? 'inactive' : 'active';
    const isDeactivating = next === 'inactive';

    // Confirmation dialog
    const confirm = await Swal.fire({
      icon: 'warning',
      title: isDeactivating ? 'Deactivate account' : 'Reactivate account',
      html: isDeactivating
        ? '<div style="text-align:center;color:#374151">This user will be unable to sign in until reactivated.<br/>A notification email will be sent.</div>'
        : '<div style="text-align:center;color:#374151">This user will regain access to their account.<br/>A notification email will be sent.</div>',
      showCancelButton: true,
      confirmButtonText: isDeactivating ? 'Deactivate' : 'Reactivate',
      cancelButtonText: 'Cancel',
      confirmButtonColor: isDeactivating ? '#dc2626' : '#16a34a',
      cancelButtonColor: '#6b7280',
      background: '#ffffff',
      color: '#111827',
      width: 520
    });
    if (!confirm.isConfirmed) return;

    try {
      const token = localStorage.getItem('token');
      const { data: updated } = await axios.patch(`http://localhost:5001/api/admin/users/${userId}`, { status: next }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state using API response for accuracy
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, ...updated } : u));

      // Success alert (clean layout)
      await Swal.fire({
        icon: 'success',
        title: isDeactivating ? 'Account deactivated' : 'Account reactivated',
        html: isDeactivating
          ? '<div style="text-align:center;color:#374151">The user has been deactivated and notified via email.</div>'
          : '<div style="text-align:center;color:#374151">The user has been reactivated and notified via email.</div>',
        confirmButtonText: 'Close',
        confirmButtonColor: '#111827',
        background: '#ffffff',
        color: '#111827',
        width: 480
      });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update status';
      await Swal.fire({
        icon: 'error',
        title: 'Could not complete action',
        html: `<div style="text-align:center;color:#374151">${msg}</div>`,
        confirmButtonText: 'Close',
        confirmButtonColor: '#111827',
        background: '#ffffff',
        color: '#111827',
        width: 480
      });
    }
  };

  // No reset password per requirement; using deactivate/activate button instead

  // Client-side filtering to match professional pages behavior
  const normalizedQuery = q.trim().toLowerCase();
  const queryTokens = normalizedQuery.length > 0 ? normalizedQuery.split(/\s+/).filter(Boolean) : [];

  const nonAdminUsers = users.filter(u => u.role !== 'admin');
  const filteredUsers = queryTokens.length === 0
    ? nonAdminUsers
    : nonAdminUsers.filter(u => {
        const haystack = [
          u.name || '',
          u.email || '',
          u.phone || '',
          (u.role || '')
        ].join(' ').toLowerCase();
        // Every token must be present (AND semantics)
        return queryTokens.every(tok => haystack.includes(tok));
      });

  const filteredTotal = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(filteredTotal / limit));
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const pageUsers = filteredUsers.slice(startIndex, endIndex);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Users Management</h2>
        <p className="text-gray-600 mt-1">Search, filter and manage users across roles</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 flex items-center border rounded-lg px-3 py-2">
            <HiSearch className="h-4 w-4 text-gray-500 mr-2" />
            <input
              value={q}
              onChange={(e) => { setPage(1); setQ(e.target.value); }}
              placeholder="Search name, email or role (patient/doctor/receptionist)"
              className="w-full outline-none text-sm"
            />
          </div>
          <div></div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="grid grid-cols-12 px-4 py-2 bg-gray-50 border-b text-xs font-semibold text-gray-600">
          <div className="col-span-3">Name</div>
          <div className="col-span-3">Email</div>
          <div className="col-span-2">Phone</div>
          <div className="col-span-1">Role</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-2">Created</div>
        </div>
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading...</div>
        ) : error ? (
          <div className="p-4 text-red-700 bg-red-50 border-t border-red-200">{error}</div>
        ) : filteredTotal === 0 ? (
          <div className="p-6 text-center text-gray-500">No users found</div>
        ) : (
          pageUsers.map((u) => {
            const s = getStatusBadge(u);
            return (
              <div key={u._id} className="grid grid-cols-12 px-4 py-3 border-t text-sm items-center">
                <div className="col-span-3">
                  <div className="font-medium text-gray-900">{u.name || '-'}</div>
                  <div className="text-xs text-gray-500">{u.phone || ''}</div>
                </div>
                <div className="col-span-3 break-all text-gray-700">{u.email || '-'}</div>
                <div className="col-span-2 text-gray-700">{u.phone || '-'}</div>
                <div className="col-span-1 text-gray-700 capitalize">{u.role || '-'}</div>
                <div className="col-span-1">
                  <span className={`px-2 py-0.5 rounded text-xs ${s === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{s}</span>
                </div>
                <div className="col-span-2 flex items-center justify-between">
                  <span className="text-gray-700">{formatDate(u.createdAt)}</span>
                  <button
                    onClick={() => toggleStatus(u._id, s)}
                    className={`ml-2 px-2 py-1 rounded text-xs ${s === 'active' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white`}
                    title={s === 'active' ? 'Deactivate user' : 'Activate user'}
                  >
                    {s === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            );
          })
        )}
            </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-600">Page {page} of {totalPages}</div>
        <div className="flex items-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1.5 border rounded text-sm disabled:opacity-50">
            <HiArrowLeft className="inline h-4 w-4 mr-1" /> Prev
          </button>
          <select value={limit} onChange={(e) => { setPage(1); setLimit(parseInt(e.target.value) || 10); }} className="px-2 py-1 border rounded text-sm">
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
          <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="px-3 py-1.5 border rounded text-sm disabled:opacity-50">
            Next <HiArrowRight className="inline h-4 w-4 ml-1" />
          </button>
        </div>
      </div>
      </div>
  );
}