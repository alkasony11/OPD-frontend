import { useState } from 'react';
import { HiBan } from 'react-icons/hi';

export default function PatientBlocking() {
  const [blocked, setBlocked] = useState(false);
  const [reason, setReason] = useState('no_show');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <HiBan className="h-5 w-5" /> Patient Blocking / Restrictions
        </h2>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Reason</label>
            <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full border rounded-lg px-3 py-2">
              <option value="no_show">Multiple No-Shows</option>
              <option value="misuse">Misuse of System</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button className="px-3 py-2 bg-red-600 text-white rounded-lg" onClick={() => setBlocked(true)}>Block</button>
            <button className="px-3 py-2 bg-gray-100 text-gray-800 rounded-lg" onClick={() => setBlocked(false)}>Unblock</button>
          </div>
        </div>
        <div className="text-xs text-gray-500">Blocked patients cannot book new appointments until unblocked by admin.</div>
        <div className="text-sm">
          Current status: <span className={blocked ? 'text-red-600 font-medium' : 'text-green-700 font-medium'}>{blocked ? 'Blocked' : 'Active'}</span>
        </div>
      </div>
    </div>
  );
}


