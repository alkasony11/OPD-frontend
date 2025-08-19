import { useState, useEffect } from 'react';
import { HiX, HiUser, HiPhone, HiMail, HiCalendar, HiClock, HiHeart, HiExclamation } from 'react-icons/hi';
import axios from 'axios';

export default function PatientDetailsModal({ appointment, isOpen, onClose }) {
  const [patientDetails, setPatientDetails] = useState(null);
  const [previousAppointments, setPreviousAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && appointment) {
      fetchPatientDetails();
    }
  }, [isOpen, appointment]);

  const fetchPatientDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch detailed appointment info (includes patient details)
      const response = await axios.get(
        `http://localhost:5001/api/doctor/appointments/${appointment._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setPatientDetails(response.data);
      
      // Mock previous appointments for now - you can implement this API later
      const mockPreviousAppointments = [
        {
          _id: 'prev1',
          appointmentDate: '2024-01-10',
          appointmentTime: '2:00 PM',
          diagnosis: 'Common cold',
          doctorNotes: 'Patient recovered well from previous symptoms',
          status: 'completed'
        },
        {
          _id: 'prev2',
          appointmentDate: '2024-01-05',
          appointmentTime: '10:30 AM',
          diagnosis: 'Routine checkup',
          doctorNotes: 'All vitals normal, recommended regular exercise',
          status: 'completed'
        }
      ];
      setPreviousAppointments(mockPreviousAppointments);
      
    } catch (error) {
      console.error('Error fetching patient details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <HiUser className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {appointment?.patientName || 'Patient Details'}
              </h2>
              <p className="text-sm text-gray-500">Patient Information & History</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <HiX className="h-6 w-6" />
          </button>
        </div>

        {loading ? (
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Current Appointment Info */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Current Appointment</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <HiCalendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">
                    {formatDate(appointment?.appointmentDate)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <HiClock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">
                    {appointment?.appointmentTime}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <HiExclamation className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">
                    Type: {appointment?.appointmentType}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    appointment?.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    appointment?.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    appointment?.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {appointment?.status}
                  </span>
                </div>
              </div>
              
              {appointment?.symptoms && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Current Symptoms:</h4>
                  <p className="text-sm text-gray-700 bg-white p-3 rounded border">
                    {appointment.symptoms}
                  </p>
                </div>
              )}
            </div>

            {/* Patient Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Basic Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <HiUser className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700">
                      {patientDetails?.patientId?.name || appointment?.patientName}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <HiMail className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700">
                      {patientDetails?.patientId?.email || appointment?.patientEmail}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <HiPhone className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700">
                      {patientDetails?.patientId?.phone || appointment?.patientPhone}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <HiCalendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700">
                      Age: {calculateAge(patientDetails?.patientId?.dob)} years
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <HiUser className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700">
                      Gender: {patientDetails?.patientId?.gender || 'Not specified'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Medical Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Medical Information</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Blood Group:</span>
                    <span className="text-sm text-gray-600 ml-2">
                      {patientDetails?.patientId?.patient_info?.bloodGroup || 'Not specified'}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Allergies:</span>
                    <span className="text-sm text-gray-600 ml-2">
                      {patientDetails?.patientId?.patient_info?.allergies || 'None reported'}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Medical History:</span>
                    <p className="text-sm text-gray-600 mt-1">
                      {patientDetails?.patientId?.patient_info?.medicalHistory || 'No significant medical history'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Previous Appointments */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Previous Appointments</h3>
              {previousAppointments.length === 0 ? (
                <p className="text-sm text-gray-500">No previous appointments found</p>
              ) : (
                <div className="space-y-3">
                  {previousAppointments.map((prevAppt) => (
                    <div key={prevAppt._id} className="bg-white p-3 rounded border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-4">
                          <span className="text-sm font-medium text-gray-900">
                            {formatDate(prevAppt.appointmentDate)}
                          </span>
                          <span className="text-sm text-gray-500">
                            {prevAppt.appointmentTime}
                          </span>
                        </div>
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          {prevAppt.status}
                        </span>
                      </div>
                      {prevAppt.diagnosis && (
                        <div className="mb-2">
                          <span className="text-sm font-medium text-gray-700">Diagnosis: </span>
                          <span className="text-sm text-gray-600">{prevAppt.diagnosis}</span>
                        </div>
                      )}
                      {prevAppt.doctorNotes && (
                        <div>
                          <span className="text-sm font-medium text-gray-700">Notes: </span>
                          <span className="text-sm text-gray-600">{prevAppt.doctorNotes}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Current Diagnosis and Notes */}
            {(appointment?.diagnosis || appointment?.doctorNotes) && (
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Current Visit Notes</h3>
                {appointment.diagnosis && (
                  <div className="mb-3">
                    <span className="text-sm font-medium text-gray-700">Diagnosis: </span>
                    <span className="text-sm text-gray-600">{appointment.diagnosis}</span>
                  </div>
                )}
                {appointment.doctorNotes && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Doctor Notes: </span>
                    <p className="text-sm text-gray-600 mt-1">{appointment.doctorNotes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
