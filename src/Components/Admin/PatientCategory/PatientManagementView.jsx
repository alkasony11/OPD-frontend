import PatientManagement from '../PatientManagement';

export default function PatientManagementView() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Patient Management</h2>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-4">
        <PatientManagement />
      </div>
    </div>
  );
}


