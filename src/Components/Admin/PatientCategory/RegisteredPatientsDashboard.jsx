import RegisteredPatients from '../RegisteredPatients';

export default function RegisteredPatientsDashboard() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Registered Patients</h2>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-4">
        <RegisteredPatients />
      </div>
    </div>
  );
}


