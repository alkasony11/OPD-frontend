import { useState } from 'react';
import { HiClock, HiDocumentText, HiDownload } from 'react-icons/hi';

export default function PatientHistoryRecords() {
  const [timelineItems] = useState([]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <HiClock className="h-5 w-5" /> Patient History & Records
        </h2>
        <div className="flex gap-2">
          <button className="px-3 py-2 bg-gray-100 text-gray-800 rounded-lg flex items-center gap-2"><HiDownload /> Export PDF</button>
          <button className="px-3 py-2 bg-gray-100 text-gray-800 rounded-lg flex items-center gap-2"><HiDownload /> Export Excel</button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4">
        {timelineItems.length === 0 ? (
          <div className="text-sm text-gray-500">Select a patient to view timeline of registrations, bookings, cancellations, reschedules, and payments.</div>
        ) : (
          <ul className="divide-y">
            {timelineItems.map((item) => (
              <li key={item.id} className="py-3 flex items-start gap-3">
                <HiDocumentText className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <div className="text-sm text-gray-900">{item.title}</div>
                  <div className="text-xs text-gray-500">{item.timestamp}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}


