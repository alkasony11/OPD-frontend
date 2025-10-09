import { useState } from 'react';
import { HiCash } from 'react-icons/hi';

export default function PaymentRefunds() {
  const [refunds] = useState([]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <HiCash className="h-5 w-5" /> Payments & Refunds
        </h2>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="text-sm text-gray-600">View payment records linked to a patient. Process refunds with reasons and status tracking.</div>
        {/* Future: payments table, refund modal */}
        <div className="mt-3 text-xs text-gray-500">No records loaded. Select a patient to begin.</div>
      </div>
    </div>
  );
}


