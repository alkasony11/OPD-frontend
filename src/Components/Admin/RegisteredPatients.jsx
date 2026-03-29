import { useEffect, useState } from 'react';
import axios from 'axios';
import { HiSearch, HiDownload, HiX, HiPencil, HiPlus, HiTrash, HiBan, HiCheckCircle, HiEye } from 'react-icons/hi';
import { API_CONFIG } from '../../config/urls';

export default function RegisteredPatients() {
  const [patients, setPatients] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState(null);
  const [details, setDetails] = useState(null);
  const [family, setFamily] = useState([]);
  const [viewLoading, setViewLoading] = useState(false);
  const [expanded, setExpanded] = useState({}); // patientId -> boolean
  const [familyMap, setFamilyMap] = useState({}); // patientId -> family array
  const [history, setHistory] = useState({ upcoming: [], past: [], cancellations: [] });

  const [search, setSearch] = useState('');
  const [searchBy, setSearchBy] = useState('all'); // all|id|name|mobile|email
  const [status, setStatus] = useState('all'); // all|active|blocked
  const [activeTab, setActiveTab] = useState('profile'); // profile|family|history
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Edit profile state
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [editProfile, setEditProfile] = useState({ name: '', phone: '', email: '', gender: 'male', age: '' });

  // Family actions state
  const [familyModalOpen, setFamilyModalOpen] = useState(false);
  const [familyForm, setFamilyForm] = useState({ name: '', gender: 'male', age: '' });
  const [familyActionLoading, setFamilyActionLoading] = useState(false);

  useEffect(() => { fetchPatients(); }, []);

  useEffect(() => { applyFilters(); }, [patients, search, searchBy, status]);
  useEffect(() => { setCurrentPage(1); }, [search, searchBy, status]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('${API_CONFIG.BASE_URL}/api/admin/registered-patients', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Primary API response:', res.data);
      let list = res.data?.patients || res.data || [];
      if (list.length > 0) {
        console.log('Primary API - First patient:', list[0]);
        console.log('Primary API - Available fields:', Object.keys(list[0]));
      }
      // Normalize identifiers: prefer backend patientId for display, and keep regId for lookups
      list = list.map(p => ({
        ...p,
        patientId: p.patientId || '',
        regId: p.regId || p.patientId || p._id
      }));
      // Fallback: if empty, try generic users endpoint (role=patient)
      if (Array.isArray(list) && list.length === 0) {
        try {
          const usersRes = await axios.get('${API_CONFIG.BASE_URL}/api/admin/users', {
            params: { role: 'patient', page: 1, limit: 500 },
            headers: { Authorization: `Bearer ${token}` }
          });
          const users = usersRes.data?.users || [];
          list = users.map(u => ({
            _id: u._id,
            regId: u.patientId || u._id,
            patientId: u.patientId || `P${u._id.slice(-6).toUpperCase()}`, // Use patientId if exists, otherwise create from _id
            name: u.name,
            email: u.email || '',
            phone: u.phone || '',
            createdAt: u.createdAt,
            familyCount: 0
          }));
        } catch (fallbackErr) {
          console.warn('Fallback fetch (users) failed:', fallbackErr?.message || fallbackErr);
        }
      }
        // Debug: print fetched patient IDs
        try {
          if (list.length > 0) {
            console.log('First patient object:', list[0]);
            console.log('All available fields:', Object.keys(list[0]));
            console.log('PatientId field:', list[0].patientId);
            console.log('RegId field:', list[0].regId);
            console.log('MongoDB _id field:', list[0]._id);
            // Check for other possible ID fields
            console.log('patient_id field:', list[0].patient_id);
            console.log('user_id field:', list[0].user_id);
            console.log('id field:', list[0].id);
          }
          const ids = (list || []).map(p => p.patientId || p.regId || p._id).filter(Boolean);
          console.log('Registered patient IDs:', ids);
        } catch {}
      setPatients(list);
    } catch (e) {
      console.error('Fetch registered patients failed:', e);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let rows = [...patients];
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(p => {
        const id = (p.patientId || '').toLowerCase();
        const name = (p.name || '').toLowerCase();
        const phone = (p.phone || '');
        const email = (p.email || '').toLowerCase();
        if (searchBy === 'id') return id.includes(q);
        if (searchBy === 'name') return name.includes(q);
        if (searchBy === 'mobile') return phone.includes(search.trim());
        if (searchBy === 'email') return email.includes(q);
        return id.includes(q) || name.includes(q) || phone.includes(search.trim()) || email.includes(q);
      });
    }
    if (status !== 'all') {
      rows = rows.filter(p => status === 'active' ? !p.isBlocked : p.isBlocked);
    }
    setFiltered(rows);
  };

  const exportCsv = () => {
    const csv = [
      ['SI No','Patient ID','Name','Mobile','FamilyCount','Status'],
      ...filtered.map((p, index) => [
        index + 1,
        (p.patientId || ''),
        p.name,
        p.phone || '',
        p.familyCount ?? 0,
        p.isBlocked ? 'Blocked' : 'Active'
      ])
    ].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'registered_patients.csv'; a.click();
    window.URL.revokeObjectURL(url);
  };

  const openView = async (row, defaultTab = 'overview') => {
    setViewing(row);
    setViewLoading(true);
    setActiveTab(defaultTab);
    setDetails(null);
    setFamily([]);
    try {
      const token = localStorage.getItem('token');
      const id = row.patientId || row.regId || row._id;
      console.log('Viewing patient ID:', id);
      console.log('Row object:', row);
      const [dRes, fRes, hRes] = await Promise.all([
        axios.get(`${API_CONFIG.BASE_URL}/api/admin/patients/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_CONFIG.BASE_URL}/api/admin/patients/${id}/family`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_CONFIG.BASE_URL}/api/admin/patients/${id}/history`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setDetails(dRes.data);
      setEditProfile({
        name: dRes.data?.name || row.name || '',
        phone: dRes.data?.phone || row.phone || '',
        email: dRes.data?.email || row.email || '',
        gender: dRes.data?.gender || 'male',
        age: dRes.data?.age || ''
      });
      setFamily((fRes.data?.familyMembers || []).map(m => ({
        id: m.patientId || m._id,
        name: m.name,
        age: m.age || '-',
        gender: m.gender || '-'
      })));
      setHistory({
        upcoming: hRes.data?.upcoming || [],
        past: hRes.data?.past || [],
        cancellations: hRes.data?.cancellations || []
      });
    } catch (e) {
      setDetails(null);
      setFamily([]);
      setHistory({ upcoming: [], past: [], cancellations: [] });
    } finally {
      setViewLoading(false);
    }
  };

  const toggleExpandFamily = async (row) => {
    const key = row._id || row.regId || row.patientId;
    const currently = !!expanded[key];
    if (currently) {
      setExpanded(prev => ({ ...prev, [key]: false }));
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const id = row.patientId || row.regId || row._id;
      const fRes = await axios.get(`${API_CONFIG.BASE_URL}/api/admin/patients/${id}/family`, { headers: { Authorization: `Bearer ${token}` } });
      const fam = (fRes.data?.familyMembers || []).map(m => ({
        id: m.patientId || m._id,
        name: m.name,
        age: m.age || '-',
        gender: m.gender || '-',
        relation: m.relation || '-'
      }));
      setFamilyMap(prev => ({ ...prev, [key]: fam }));
      setExpanded(prev => ({ ...prev, [key]: true }));
    } catch (e) {
      setExpanded(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleToggleBlock = async (row) => {
    const target = row || viewing;
    if (!target) return;
    const token = localStorage.getItem('token');
    const id = target.patientId || target.regId || target._id;
    try {
      const isBlocked = !!target.isBlocked;
      const url = `${API_CONFIG.BASE_URL}/api/admin/patients/${id}/block`;
      await axios.put(url, { blocked: !isBlocked }, { headers: { Authorization: `Bearer ${token}` } });
      if (!row) {
        const updatedViewing = { ...target, isBlocked: !isBlocked };
        setViewing(updatedViewing);
      }
      setPatients(prev => prev.map(p => {
        const pid = p.patientId || p.regId || p._id;
        return pid === id ? { ...p, isBlocked: !isBlocked } : p;
      }));
      applyFilters();
    } catch (e) {
      console.error('Toggle block failed', e);
      alert('Failed to update block status');
    }
  };

  const saveProfile = async () => {
    if (!viewing) return;
    setIsSavingProfile(true);
    try {
      const token = localStorage.getItem('token');
      const id = viewing.patientId || viewing.regId || viewing._id;
      await axios.put(`${API_CONFIG.BASE_URL}/api/admin/patients/${id}`, editProfile, { headers: { Authorization: `Bearer ${token}` } });
      setDetails(prev => ({ ...(prev || {}), ...editProfile }));
      setViewing(prev => ({ ...(prev || {}), name: editProfile.name, phone: editProfile.phone, email: editProfile.email }));
      setPatients(prev => prev.map(p => {
        const pid = p.patientId || p.regId || p._id;
        return pid === id ? { ...p, name: editProfile.name, phone: editProfile.phone, email: editProfile.email } : p;
      }));
      applyFilters();
    } catch (e) {
      console.error('Save profile failed', e);
      alert('Failed to save profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const addFamilyMember = async () => {
    if (!viewing) return;
    setFamilyActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Admin cannot add family members; keep disabled
    } catch (e) {
      console.error('Add family failed', e);
      alert('Admins cannot add family members');
    } finally {
      setFamilyActionLoading(false);
    }
  };

  const removeFamilyMember = async (member) => {
    if (!viewing) return;
    if (!window.confirm('This will deactivate the family member. Continue?')) return;
    setFamilyActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const id = viewing.patientId || viewing.regId || viewing._id;
      const mid = member.id;
      await axios.put(`${API_CONFIG.BASE_URL}/api/admin/patients/${id}/family/${mid}/block`, { active: false }, { headers: { Authorization: `Bearer ${token}` } });
      setFamily(prev => prev.map(m => m.id === mid ? { ...m, isActive: false } : m));
    } catch (e) {
      console.error('Remove family failed', e);
      alert('Failed to deactivate family member');
    } finally {
      setFamilyActionLoading(false);
    }
  };

  const toggleFamilyMemberActive = async (member) => {
    if (!viewing) return;
    setFamilyActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const id = viewing.patientId || viewing.regId || viewing._id;
      const mid = member.id;
      const willActivate = member.isActive === false;
      await axios.put(`${API_CONFIG.BASE_URL}/api/admin/patients/${id}/family/${mid}/block`, { active: willActivate }, { headers: { Authorization: `Bearer ${token}` } });
      setFamily(prev => prev.map(m => m.id === mid ? { ...m, isActive: willActivate } : m));
    } catch (e) {
      console.error('Toggle family member active failed', e);
      alert('Failed to update family member status');
    } finally {
      setFamilyActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const kpis = {
    total: patients.length,
    active: patients.filter(p => !p.isBlocked).length,
    blocked: patients.filter(p => p.isBlocked).length,
    family: patients.reduce((sum, p) => sum + (p.familyCount ?? 0), 0)
  };

  // Pagination derived data
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(totalItems, startIndex + pageSize);
  const pageRows = filtered.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="md:col-span-1">
            <h2 className="text-2xl font-bold text-gray-900">Patient Directory</h2>
          </div>
          <div className="md:col-span-1">
            <div className="relative">
              <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by Patient ID, Name, Mobile"
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none border border-gray-200"
              />
            </div>
          </div>
          <div className="md:col-span-1 flex items-center justify-end gap-2">
            <button onClick={exportCsv} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2">
              <HiDownload className="h-4 w-4" /> Export
            </button>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-end gap-2">
          <select value={searchBy} onChange={e=>setSearchBy(e.target.value)} className="px-3 py-2 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 border border-gray-200">
            <option value="all">All</option>
            <option value="id">ID</option>
            <option value="name">Name</option>
            <option value="mobile">Mobile</option>
            <option value="email">Email</option>
          </select>
          <select value={status} onChange={e=>setStatus(e.target.value)} className="px-3 py-2 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 border border-gray-200">
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </div>

    {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SI No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Age / Gender</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mobile</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Family Members</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">
                    No registered patients found.
                  </td>
                </tr>
              )}
              {pageRows.map((p, idx) => (
                <>
                <tr key={(p._id || p.regId || p.patientId) + '-row'} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">{startIndex + idx + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">{p.patientId || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-3">
                      <Avatar person={p} size="md" />
                      <div className="font-medium text-gray-900">{p.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{(p.age ? `${p.age}` : '-')}{p.gender ? ` / ${String(p.gender).charAt(0).toUpperCase()}` : ''}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{p.phone || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button onClick={() => toggleExpandFamily(p)} className="text-blue-600 hover:text-blue-800 underline">
                      {(p.familyCount ?? 0)} linked
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${p.isBlocked ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {p.isBlocked ? 'Blocked' : 'Active'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-3">
                      <button onClick={() => openView(p, 'overview')} title="View" className="text-gray-700 hover:text-gray-900"><HiEye className="h-5 w-5" /></button>
                      <button onClick={() => openView(p, 'settings')} title="Edit" className="text-gray-700 hover:text-gray-900"><HiPencil className="h-5 w-5" /></button>
                      <button onClick={() => handleToggleBlock(p)} title={p.isBlocked ? 'Unblock' : 'Block'} className={`${p.isBlocked ? 'text-emerald-600 hover:text-emerald-800' : 'text-rose-600 hover:text-rose-800'}`}>
                        {p.isBlocked ? <HiCheckCircle className="h-5 w-5" /> : <HiBan className="h-5 w-5" />}
                      </button>
                    </div>
                  </td>
                </tr>
                {(expanded[p._id || p.regId || p.patientId]) && (
                  <tr key={(p._id || p.regId || p.patientId) + '-family'}>
                    <td colSpan={8} className="px-6 py-3 bg-gray-50">
                      <div className="space-y-2">
                        {(familyMap[p._id || p.regId || p.patientId] || []).map((m, i2) => (
                          <div key={(m.id || `${i2}`)} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-3">
                              <Avatar person={{ name: m.name }} size="sm" />
                              <div className="text-gray-900">{m.name}</div>
                              <span className="text-gray-500">ID: {m.id}</span>
                              <span className="text-gray-500">{m.relation}</span>
                              <span className="text-gray-500">{m.age} yrs</span>
                            </div>
                            <button onClick={() => openView(p, 'overview')} className="text-blue-600 hover:text-blue-800 text-xs">Open Profile</button>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    {/* Pagination */}
    <div className="flex items-center justify-between mt-4">
      <div className="text-sm text-gray-600">Showing {startIndex + 1}-{endIndex} of {totalItems}</div>
      <div className="flex items-center gap-2">
        <select value={pageSize} onChange={e=>{ setPageSize(parseInt(e.target.value)||10); setCurrentPage(1); }} className="px-2 py-1 border rounded-lg text-sm">
          {[10,20,50,100].map(s => <option key={s} value={s}>{s} / page</option>)}
        </select>
        <button disabled={currentPage === 1} onClick={()=>setCurrentPage(p=>Math.max(1, p-1))} className="px-3 py-1 rounded-lg bg-gray-100 text-gray-800 disabled:opacity-50">Prev</button>
        <span className="text-sm">Page {currentPage} of {totalPages}</span>
        <button disabled={currentPage >= totalPages} onClick={()=>setCurrentPage(p=>Math.min(totalPages, p+1))} className="px-3 py-1 rounded-lg bg-gray-100 text-gray-800 disabled:opacity-50">Next</button>
      </div>
    </div>

      {/* View Modal */}
      {viewing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-auto">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <Avatar person={details || viewing} size="lg" />
                <div>
                  <h3 className="text-lg font-semibold">{details?.name || viewing.name}</h3>
                  <p className="text-gray-500 text-sm">Registered Patient ID: {viewing.patientId || viewing.regId || viewing._id}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleToggleBlock} className={`${viewing.isBlocked ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'} text-white px-3 py-2 rounded-lg flex items-center gap-2`}>
                  {viewing.isBlocked ? <HiCheckCircle className="h-4 w-4" /> : <HiBan className="h-4 w-4" />}
                  {viewing.isBlocked ? 'Unblock' : 'Block'}
                </button>
                <button onClick={() => { setViewing(null); setDetails(null); setFamily([]); }} className="text-gray-500 hover:text-gray-700">
                  <HiX className="h-5 w-5" />
                </button>
              </div>
            </div>

            {viewLoading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                <p className="text-gray-600">Loading profile...</p>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {/* Tabs */}
                <div className="flex items-center gap-2 border-b">
                  {['overview','family','bookings','documents','settings'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-3 py-2 text-sm ${activeTab === tab ? 'border-b-2 border-gray-900 text-gray-900' : 'text-gray-500'}`}>
                      {tab === 'overview' ? 'Overview' : tab === 'family' ? 'Family Members' : tab === 'bookings' ? 'Bookings' : tab === 'documents' ? 'Medical Docs' : 'Account Settings'}
                    </button>
                  ))}
                </div>

                {activeTab === 'overview' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Name</label>
                        <input className="w-full px-3 py-2 rounded-lg border bg-gray-50" value={details?.name || viewing?.name || ''} readOnly />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Gender</label>
                        <input className="w-full px-3 py-2 rounded-lg border bg-gray-50" value={details?.gender || viewing?.gender || ''} readOnly />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Age</label>
                        <input className="w-full px-3 py-2 rounded-lg border bg-gray-50" value={details?.age || viewing?.age || ''} readOnly />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Mobile</label>
                        <input className="w-full px-3 py-2 rounded-lg border bg-gray-50" value={details?.phone || viewing?.phone || ''} readOnly />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm text-gray-600 mb-1">Email</label>
                        <input className="w-full px-3 py-2 rounded-lg border bg-gray-50" value={details?.email || viewing?.email || ''} readOnly />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${viewing.isBlocked ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {viewing.isBlocked ? 'Blocked' : 'Active'}
                      </span>
                    </div>
                  </div>
                )}

                {activeTab === 'family' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-gray-900">Linked Family Members</h4>
                      {/* Admin cannot add members */}
                    </div>
                    {family.length === 0 ? (
                      <div className="text-sm text-gray-600">No family members added.</div>
                    ) : (
                      <div className="space-y-2">
                        <div className="grid grid-cols-4 gap-4 text-xs uppercase text-gray-500 px-2">
                          <div>Member</div>
                          <div>Age</div>
                          <div>Gender</div>
                          <div>Action</div>
                        </div>
                        {family.map((fm, i) => (
                          <div key={i} className="grid grid-cols-4 gap-4 items-center px-2 py-3 rounded-lg hover:bg-gray-50">
                            <div className="flex items-center gap-3 min-w-0">
                              <Avatar person={{ name: fm.name }} size="sm" />
                              <div className="text-sm truncate">{fm.name}</div>
                            </div>
                            <div className="text-sm">{fm.age}</div>
                            <div className="text-sm capitalize">{fm.gender}</div>
                            <div className="text-sm">
                              <button disabled={familyActionLoading} onClick={() => toggleFamilyMemberActive(fm)} className={`${fm.isActive === false ? 'text-emerald-600 hover:text-emerald-800' : 'text-rose-600 hover:text-rose-800'} flex items-center gap-1`}>
                                {fm.isActive === false ? <HiCheckCircle className="h-4 w-4" /> : <HiBan className="h-4 w-4" />}
                                {fm.isActive === false ? 'Activate' : 'Deactivate'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Family Modal */}
                    {false && familyModalOpen && (
                      <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl w-full max-w-md p-5">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-base font-semibold">Add Family Member</h4>
                            <button onClick={() => setFamilyModalOpen(false)} className="text-gray-500 hover:text-gray-700"><HiX className="h-5 w-5" /></button>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm text-gray-600 mb-1">Name</label>
                              <input className="w-full px-3 py-2 rounded-lg border" value={familyForm.name} onChange={e=>setFamilyForm(prev=>({ ...prev, name: e.target.value }))} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-sm text-gray-600 mb-1">Gender</label>
                                <select className="w-full px-3 py-2 rounded-lg border" value={familyForm.gender} onChange={e=>setFamilyForm(prev=>({ ...prev, gender: e.target.value }))}>
                                  <option value="male">Male</option>
                                  <option value="female">Female</option>
                                  <option value="other">Other</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm text-gray-600 mb-1">Age</label>
                                <input className="w-full px-3 py-2 rounded-lg border" value={familyForm.age} onChange={e=>setFamilyForm(prev=>({ ...prev, age: e.target.value }))} />
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 flex items-center justify-end gap-2">
                            <button onClick={() => setFamilyModalOpen(false)} className="px-3 py-2 rounded-lg bg-gray-100 text-gray-800">Cancel</button>
                            <button disabled={familyActionLoading} onClick={addFamilyMember} className="px-3 py-2 rounded-lg bg-gray-900 text-white">Add</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'bookings' && (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Upcoming</h4>
                      {(history.upcoming || []).length === 0 ? (
                        <div className="text-sm text-gray-500">No upcoming appointments.</div>
                      ) : (
                        <div className="space-y-2">
                          {history.upcoming.map((apt, i) => (
                            <div key={i} className="border rounded-lg p-3 flex items-center justify-between">
                              <div>
                                <div className="font-medium text-gray-900">{apt.doctorName}</div>
                                <div className="text-sm text-gray-500">{apt.departmentName}</div>
                              </div>
                              <div className="text-right text-sm text-gray-700">{apt.appointmentDate ? new Date(apt.appointmentDate).toLocaleDateString() : ''}{apt.appointmentTime ? `, ${apt.appointmentTime}` : ''}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Past</h4>
                      {(history.past || []).length === 0 ? (
                        <div className="text-sm text-gray-500">No past appointments.</div>
                      ) : (
                        <div className="space-y-2">
                          {history.past.map((apt, i) => (
                            <div key={i} className="border rounded-lg p-3 flex items-center justify-between">
                              <div>
                                <div className="font-medium text-gray-900">{apt.doctorName}</div>
                                <div className="text-sm text-gray-500">{apt.departmentName}</div>
                              </div>
                              <div className="text-right text-sm text-gray-700">{apt.appointmentDate ? new Date(apt.appointmentDate).toLocaleDateString() : ''}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'documents' && (
                  <div className="text-sm text-gray-600">No documents uploaded yet.</div>
                )}

                {activeTab === 'settings' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Name</label>
                        <input className="w-full px-3 py-2 rounded-lg border" value={editProfile.name} onChange={e=>setEditProfile(prev=>({ ...prev, name: e.target.value }))} />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Gender</label>
                        <select className="w-full px-3 py-2 rounded-lg border" value={editProfile.gender} onChange={e=>setEditProfile(prev=>({ ...prev, gender: e.target.value }))}>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Age</label>
                        <input className="w-full px-3 py-2 rounded-lg border" value={editProfile.age} onChange={e=>setEditProfile(prev=>({ ...prev, age: e.target.value }))} />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Mobile</label>
                        <input className="w-full px-3 py-2 rounded-lg border" value={editProfile.phone} onChange={e=>setEditProfile(prev=>({ ...prev, phone: e.target.value }))} />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm text-gray-600 mb-1">Email</label>
                        <input className="w-full px-3 py-2 rounded-lg border" value={editProfile.email} onChange={e=>setEditProfile(prev=>({ ...prev, email: e.target.value }))} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button disabled={isSavingProfile} onClick={saveProfile} className="px-3 py-2 bg-gray-900 text-white rounded-lg flex items-center gap-2 disabled:opacity-60">
                        <HiPencil className="h-4 w-4" /> Save Changes
                      </button>
                      <button onClick={handleToggleBlock} className={`${viewing.isBlocked ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'} text-white px-3 py-2 rounded-lg flex items-center gap-2`}>
                        {viewing.isBlocked ? <HiCheckCircle className="h-4 w-4" /> : <HiBan className="h-4 w-4" />}
                        {viewing.isBlocked ? 'Unblock' : 'Block'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Avatar({ person, size = 'md' }) {
  const dimension = size === 'lg' ? 'h-14 w-14' : size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  const url = (person?.profilePhoto || person?.profile_photo || person?.avatar || '').trim();
  const resolved = url ? (url.startsWith('http') ? url : `${API_CONFIG.BASE_URL}${url}`) : '';
  const initials = (person?.name || '')
    .split(' ')
    .map(part => part[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={`relative ${dimension} rounded-full bg-gray-100 text-gray-600 flex items-center justify-center overflow-hidden`}>      
      {resolved ? (
        // eslint-disable-next-line jsx-a11y/img-redundant-alt
        <img
          src={resolved}
          alt={person?.name || 'Profile photo'}
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      ) : null}
      <span className="font-medium">{initials || 'PT'}</span>
    </div>
  );
}

function KpiCard({ label, value, color }) {
  const palette = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-200' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-200' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', ring: 'ring-indigo-200' },
  }[color] || { bg: 'bg-gray-50', text: 'text-gray-700', ring: 'ring-gray-200' };

  return (
    <div className={`rounded-xl border ${palette.ring} p-4 bg-white`}>
      <div className="text-sm text-gray-500">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${palette.text}`}>{value}</div>
    </div>
  );
}
