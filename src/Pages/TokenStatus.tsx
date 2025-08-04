import React from 'react';

const TokenStatus = () => {
  return (
    <div className="min-h-screen bg-[#E8FFD7] flex flex-col items-center py-10">
      <h2 className="text-2xl font-bold mb-6">Your Token Status</h2>
      <div className="bg-white rounded shadow p-8 w-full max-w-md">
        <div className="text-center mb-4">
          <div className="text-lg font-semibold">Your Position in Queue</div>
          <div className="text-5xl font-bold text-blue-600">5</div>
          <div className="text-gray-500">out of 19 patients</div>
        </div>
        <div className="text-center mb-6">
          <div className="font-semibold">Estimated Wait Time</div>
          <div className="text-xl font-bold">Approximately 60 minutes</div>
        </div>
        <div className="mb-4">
          <div className="font-semibold">Doctor: Dr. Hanna Wilson</div>
          <div className="text-gray-600">General Medicine</div>
          <div className="mt-2">Patient: Alex Ray (Myself)</div>
          <div>Date: 2025-07-15</div>
          <div>Time: 09:00</div>
          <div className="mt-2 text-xs text-gray-400">Token: TOKEN-1753077198751</div>
        </div>
        <div className="flex flex-col gap-2 mt-6">
          <button className="bg-blue-500 text-white py-2 rounded font-bold hover:bg-blue-600">Book Another Appointment</button>
          <button className="bg-red-100 text-red-700 py-2 rounded font-bold hover:bg-red-200">Cancel Booking</button>
        </div>
      </div>
    </div>
  );
};

export default TokenStatus; 