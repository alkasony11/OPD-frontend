import { useState, useEffect } from 'react';
import axios from 'axios';
import { HiUserGroup, HiPlus, HiPencil, HiTrash } from 'react-icons/hi';

export default function FamilyAccountManagement() {
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // placeholder: load some default patient or via query param later
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <HiUserGroup className="h-5 w-5" /> Family Account Management
        </h2>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="text-sm text-gray-600">Select a registered patient to view and manage linked family members.</div>
        {/* Future: search/select patient, list family, add/edit/remove */}
        <div className="mt-4 flex gap-2">
          <button className="px-3 py-2 bg-gray-800 text-white rounded-lg flex items-center gap-2"><HiPlus /> Add Family Member</button>
          <button className="px-3 py-2 bg-gray-100 text-gray-800 rounded-lg flex items-center gap-2"><HiPencil /> Edit Selected</button>
          <button className="px-3 py-2 bg-red-50 text-red-700 rounded-lg flex items-center gap-2"><HiTrash /> Remove Selected</button>
        </div>
      </div>
    </div>
  );
}


