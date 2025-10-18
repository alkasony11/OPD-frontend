import { useState, useEffect } from 'react';
import { 
  HiX, HiSave, HiPrinter, HiDocumentText, HiUser, HiCalendar, 
  HiClock, HiClipboardList, HiPencil, HiCheckCircle 
} from 'react-icons/hi';
import axios from 'axios';

export default function PatientConsultationModal({ 
  appointment, 
  isOpen, 
  onClose, 
  onSave 
}) {
  const [consultationData, setConsultationData] = useState({
    chiefComplaint: '',
    historyOfPresentIllness: '',
    physicalExamination: '',
    vitalSigns: {
      bloodPressure: '',
      heartRate: '',
      temperature: '',
      respiratoryRate: '',
      oxygenSaturation: ''
    },
    diagnosis: '',
    treatmentPlan: '',
    medications: '',
    followUpInstructions: '',
    additionalNotes: ''
  });
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  useEffect(() => {
    if (appointment && isOpen) {
      // Load existing consultation data if available
      if (appointment.consultationData) {
        setConsultationData(appointment.consultationData);
      }
    }
  }, [appointment, isOpen]);

  const handleInputChange = (field, value) => {
    setConsultationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleVitalSignsChange = (field, value) => {
    setConsultationData(prev => ({
      ...prev,
      vitalSigns: {
        ...prev.vitalSigns,
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');

      await axios.patch(
        `http://localhost:5001/api/doctor/appointments/${appointment._id}/consultation`,
        {
          consultationData,
          status: 'consulted'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setLastSaved(new Date());
      if (onSave) onSave();
    } catch (error) {
      console.error('Error saving consultation:', error);
      alert('Failed to save consultation data');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen || !appointment) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <HiDocumentText className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Patient Consultation Record
              </h2>
              <p className="text-sm text-gray-600">
                {appointment.patient_name} - Token #{appointment.token_number}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {lastSaved && (
              <span className="text-xs text-gray-500">
                Last saved: {lastSaved.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:text-gray-800"
              title="Print consultation"
            >
              <HiPrinter className="h-4 w-4" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <HiX className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Patient Info Header */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <HiUser className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-700">Patient</p>
                <p className="text-sm text-gray-900">{appointment.patient_name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <HiCalendar className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-700">Date</p>
                <p className="text-sm text-gray-900">
                  {new Date(appointment.booking_date).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <HiClock className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-700">Time</p>
                <p className="text-sm text-gray-900">{appointment.time_slot}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <HiClipboardList className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-700">Token</p>
                <p className="text-sm text-gray-900">#{appointment.token_number}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Consultation Form */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Chief Complaint */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Chief Complaint
              </label>
              <textarea
                value={consultationData.chiefComplaint}
                onChange={(e) => handleInputChange('chiefComplaint', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Primary reason for visit..."
              />
            </div>

            {/* History of Present Illness */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                History of Present Illness
              </label>
              <textarea
                value={consultationData.historyOfPresentIllness}
                onChange={(e) => handleInputChange('historyOfPresentIllness', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Detailed history of the current condition..."
              />
            </div>

            {/* Physical Examination */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Physical Examination
              </label>
              <textarea
                value={consultationData.physicalExamination}
                onChange={(e) => handleInputChange('physicalExamination', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Findings from physical examination..."
              />
            </div>

            {/* Vital Signs */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Vital Signs
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Blood Pressure</label>
                  <input
                    type="text"
                    value={consultationData.vitalSigns.bloodPressure}
                    onChange={(e) => handleVitalSignsChange('bloodPressure', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 120/80"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Heart Rate</label>
                  <input
                    type="text"
                    value={consultationData.vitalSigns.heartRate}
                    onChange={(e) => handleVitalSignsChange('heartRate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 72 bpm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Temperature</label>
                  <input
                    type="text"
                    value={consultationData.vitalSigns.temperature}
                    onChange={(e) => handleVitalSignsChange('temperature', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 98.6°F"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Respiratory Rate</label>
                  <input
                    type="text"
                    value={consultationData.vitalSigns.respiratoryRate}
                    onChange={(e) => handleVitalSignsChange('respiratoryRate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 16/min"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Oxygen Saturation</label>
                  <input
                    type="text"
                    value={consultationData.vitalSigns.oxygenSaturation}
                    onChange={(e) => handleVitalSignsChange('oxygenSaturation', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 98%"
                  />
                </div>
              </div>
            </div>

            {/* Diagnosis */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Diagnosis
              </label>
              <textarea
                value={consultationData.diagnosis}
                onChange={(e) => handleInputChange('diagnosis', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Medical diagnosis and assessment..."
              />
            </div>

            {/* Treatment Plan */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Treatment Plan
              </label>
              <textarea
                value={consultationData.treatmentPlan}
                onChange={(e) => handleInputChange('treatmentPlan', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Recommended treatment and management plan..."
              />
            </div>

            {/* Medications */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Medications Prescribed
              </label>
              <textarea
                value={consultationData.medications}
                onChange={(e) => handleInputChange('medications', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="List of prescribed medications with dosages..."
              />
            </div>

            {/* Follow-up Instructions */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Follow-up Instructions
              </label>
              <textarea
                value={consultationData.followUpInstructions}
                onChange={(e) => handleInputChange('followUpInstructions', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Instructions for follow-up care..."
              />
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                value={consultationData.additionalNotes}
                onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Any additional observations or notes..."
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <HiPencil className="h-4 w-4" />
            <span>Consultation Record</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <HiSave className="h-4 w-4" />
              <span>{saving ? 'Saving...' : 'Save & Complete'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
