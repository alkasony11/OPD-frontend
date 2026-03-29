import { useState } from 'react';
import { HiBell, HiPaperAirplane } from 'react-icons/hi';

export default function CommunicationNotifications() {
  const [template, setTemplate] = useState('reminder');
  const [channel, setChannel] = useState('sms');
  const [message, setMessage] = useState('');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <HiBell className="h-5 w-5" /> Communication & Notifications
        </h2>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Template</label>
            <select value={template} onChange={(e) => setTemplate(e.target.value)} className="w-full border rounded-lg px-3 py-2">
              <option value="reminder">Appointment Reminder</option>
              <option value="doctor_leave">Doctor Leave Notice</option>
              <option value="refund">Refund Confirmation</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Channel</label>
            <select value={channel} onChange={(e) => setChannel(e.target.value)} className="w-full border rounded-lg px-3 py-2">
              <option value="sms">SMS</option>
              <option value="email">Email</option>
              <option value="push">App Push</option>
            </select>
          </div>
          <div className="flex items-end">
            <button className="w-full px-3 py-2 bg-gray-800 text-white rounded-lg flex items-center justify-center gap-2">
              <HiPaperAirplane /> Send
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Message</label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} className="w-full border rounded-lg px-3 py-2" placeholder="Message preview or custom message..." />
        </div>
        <div className="text-xs text-gray-500">Notification history will appear here per patient.</div>
      </div>
    </div>
  );
}


