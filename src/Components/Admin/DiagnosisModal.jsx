import { useState, useEffect } from 'react';
import { 
  HiX, 
  HiSave, 
  HiUser, 
  HiCalendar, 
  HiClock, 
  HiPhone, 
  HiMail,
  HiPlus,
  HiTrash,
  HiCheckCircle,
  HiExclamationCircle
} from 'react-icons/hi';
import axios from 'axios';

export default function DiagnosisModal({ appointment, onClose, onSave }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [endingConsultation, setEndingConsultation] = useState(false);
  const [consultationEnded, setConsultationEnded] = useState(false);
  const [formData, setFormData] = useState({
    // Patient Information
    patient_name: appointment?.patient_id?.name || '',
    patient_age: appointment?.patient_id?.patient_info?.age || '',
    patient_gender: appointment?.patient_id?.patient_info?.gender || '',
    patient_phone: appointment?.patient_id?.phone || '',
    patient_email: appointment?.patient_id?.email || '',
    
    // Medical History
    chief_complaint: '',
    history_of_present_illness: '',
    past_medical_history: '',
    family_history: '',
    social_history: '',
    
    // Vital Signs
    vital_signs: {
      blood_pressure: { systolic: '', diastolic: '' },
      heart_rate: '',
      temperature: '',
      respiratory_rate: '',
      oxygen_saturation: '',
      weight: '',
      height: ''
    },
    
    // Physical Examination
    physical_examination: {
      general_appearance: '',
      cardiovascular: '',
      respiratory: '',
      gastrointestinal: '',
      neurological: '',
      musculoskeletal: '',
      skin: '',
      other: ''
    },
    
    // Assessment
    assessment: {
      primary_diagnosis: '',
      secondary_diagnoses: [],
      differential_diagnosis: []
    },
    
    // Treatment Plan
    treatment_plan: {
      medications: [],
      procedures: [],
      lifestyle_modifications: '',
      follow_up: '',
      referrals: []
    },
    
    // Investigations
    investigations: {
      laboratory: [],
      imaging: [],
      other_tests: []
    },
    
    // Additional Information
    notes: '',
    prognosis: '',
    
    // Doctor Information
    doctor_name: appointment?.doctor_id?.name || '',
    department: appointment?.department || ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Check if diagnosis already exists
    checkExistingDiagnosis();
  }, [appointment]);

  const checkExistingDiagnosis = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/diagnosis?appointment_id=${appointment._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.diagnoses && response.data.diagnoses.length > 0) {
        const existingDiagnosis = response.data.diagnoses[0];
        setFormData(prev => ({
          ...prev,
          ...existingDiagnosis,
          vital_signs: existingDiagnosis.vital_signs || prev.vital_signs,
          physical_examination: existingDiagnosis.physical_examination || prev.physical_examination,
          assessment: existingDiagnosis.assessment || prev.assessment,
          treatment_plan: existingDiagnosis.treatment_plan || prev.treatment_plan,
          investigations: existingDiagnosis.investigations || prev.investigations
        }));
        
        if (existingDiagnosis.consultation_status === 'completed') {
          setConsultationEnded(true);
        }
      }
    } catch (error) {
      console.error('Error checking existing diagnosis:', error);
    }
  };

  const handleInputChange = (section, field, value) => {
    if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleArrayAdd = (section, field, newItem) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: [...prev[section][field], newItem]
      }
    }));
  };

  const handleArrayRemove = (section, field, index) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: prev[section][field].filter((_, i) => i !== index)
      }
    }));
  };

  const handleArrayUpdate = (section, field, index, updatedItem) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: prev[section][field].map((item, i) => i === index ? updatedItem : item)
      }
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.chief_complaint.trim()) {
      newErrors.chief_complaint = 'Chief complaint is required';
    }
    if (!formData.history_of_present_illness.trim()) {
      newErrors.history_of_present_illness = 'History of present illness is required';
    }
    if (!formData.assessment.primary_diagnosis.trim()) {
      newErrors.primary_diagnosis = 'Primary diagnosis is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const diagnosisData = {
        ...formData,
        appointment_id: appointment._id,
        patient_id: appointment.patient_id._id,
        doctor_id: appointment.doctor_id._id
      };

      const response = await axios.post('/api/diagnosis', diagnosisData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Diagnosis saved successfully:', response.data);
      onSave();
    } catch (error) {
      console.error('Error saving diagnosis:', error);
      alert('Error saving diagnosis. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleEndConsultation = async () => {
    if (!validateForm()) return;

    setEndingConsultation(true);
    try {
      const token = localStorage.getItem('token');
      
      // First save the diagnosis if not already saved
      await handleSave();
      
      // Then end the consultation
      const response = await axios.put(`/api/diagnosis/${appointment._id}/end-consultation`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setConsultationEnded(true);
      console.log('Consultation ended successfully:', response.data);
    } catch (error) {
      console.error('Error ending consultation:', error);
      alert('Error ending consultation. Please try again.');
    } finally {
      setEndingConsultation(false);
    }
  };

  const renderVitalSigns = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Vital Signs</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Blood Pressure</label>
          <div className="flex space-x-2">
            <input
              type="number"
              placeholder="Systolic"
              value={formData.vital_signs.blood_pressure.systolic}
              onChange={(e) => handleInputChange('vital_signs', 'blood_pressure', {
                ...formData.vital_signs.blood_pressure,
                systolic: e.target.value
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Diastolic"
              value={formData.vital_signs.blood_pressure.diastolic}
              onChange={(e) => handleInputChange('vital_signs', 'blood_pressure', {
                ...formData.vital_signs.blood_pressure,
                diastolic: e.target.value
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Heart Rate (bpm)</label>
          <input
            type="number"
            value={formData.vital_signs.heart_rate}
            onChange={(e) => handleInputChange('vital_signs', 'heart_rate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Temperature (°F)</label>
          <input
            type="number"
            step="0.1"
            value={formData.vital_signs.temperature}
            onChange={(e) => handleInputChange('vital_signs', 'temperature', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Respiratory Rate</label>
          <input
            type="number"
            value={formData.vital_signs.respiratory_rate}
            onChange={(e) => handleInputChange('vital_signs', 'respiratory_rate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">O2 Saturation (%)</label>
          <input
            type="number"
            value={formData.vital_signs.oxygen_saturation}
            onChange={(e) => handleInputChange('vital_signs', 'oxygen_saturation', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
          <input
            type="number"
            step="0.1"
            value={formData.vital_signs.weight}
            onChange={(e) => handleInputChange('vital_signs', 'weight', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
          <input
            type="number"
            value={formData.vital_signs.height}
            onChange={(e) => handleInputChange('vital_signs', 'height', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );

  const renderPhysicalExamination = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Physical Examination</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(formData.physical_examination).map(([key, value]) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
              {key.replace('_', ' ')}
            </label>
            <textarea
              rows={3}
              value={value}
              onChange={(e) => handleInputChange('physical_examination', key, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder={`Enter ${key.replace('_', ' ')} findings...`}
            />
          </div>
        ))}
      </div>
    </div>
  );

  const renderMedications = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Medications</h3>
        <button
          type="button"
          onClick={() => handleArrayAdd('treatment_plan', 'medications', {
            name: '',
            dosage: '',
            frequency: '',
            duration: '',
            instructions: ''
          })}
          className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <HiPlus className="h-4 w-4" />
          <span>Add Medication</span>
        </button>
      </div>
      
      {formData.treatment_plan.medications.map((med, index) => (
        <div key={index} className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">Medication {index + 1}</h4>
            <button
              type="button"
              onClick={() => handleArrayRemove('treatment_plan', 'medications', index)}
              className="text-red-600 hover:text-red-800"
            >
              <HiTrash className="h-4 w-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Medication Name</label>
              <input
                type="text"
                value={med.name}
                onChange={(e) => handleArrayUpdate('treatment_plan', 'medications', index, {
                  ...med,
                  name: e.target.value
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Paracetamol"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dosage</label>
              <input
                type="text"
                value={med.dosage}
                onChange={(e) => handleArrayUpdate('treatment_plan', 'medications', index, {
                  ...med,
                  dosage: e.target.value
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 500mg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
              <input
                type="text"
                value={med.frequency}
                onChange={(e) => handleArrayUpdate('treatment_plan', 'medications', index, {
                  ...med,
                  frequency: e.target.value
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Twice daily"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
              <input
                type="text"
                value={med.duration}
                onChange={(e) => handleArrayUpdate('treatment_plan', 'medications', index, {
                  ...med,
                  duration: e.target.value
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 7 days"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
              <textarea
                rows={2}
                value={med.instructions}
                onChange={(e) => handleArrayUpdate('treatment_plan', 'medications', index, {
                  ...med,
                  instructions: e.target.value
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Special instructions for the patient..."
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Patient Diagnosis & Consultation</h2>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <HiUser className="h-4 w-4" />
                <span>{appointment?.patient_id?.name}</span>
              </div>
              <div className="flex items-center space-x-1">
                <HiCalendar className="h-4 w-4" />
                <span>{new Date(appointment?.booking_date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-1">
                <HiClock className="h-4 w-4" />
                <span>{appointment?.time_slot}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <HiX className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-8">
            {/* Patient Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.patient_name}
                    onChange={(e) => handleInputChange(null, 'patient_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <input
                    type="number"
                    value={formData.patient_age}
                    onChange={(e) => handleInputChange(null, 'patient_age', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select
                    value={formData.patient_gender}
                    onChange={(e) => handleInputChange(null, 'patient_gender', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Chief Complaint */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chief Complaint <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={formData.chief_complaint}
                onChange={(e) => handleInputChange(null, 'chief_complaint', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.chief_complaint ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Describe the main reason for the patient's visit..."
              />
              {errors.chief_complaint && (
                <p className="mt-1 text-sm text-red-600">{errors.chief_complaint}</p>
              )}
            </div>

            {/* History of Present Illness */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                History of Present Illness <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                value={formData.history_of_present_illness}
                onChange={(e) => handleInputChange(null, 'history_of_present_illness', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.history_of_present_illness ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Detailed description of the current illness, symptoms, duration, progression..."
              />
              {errors.history_of_present_illness && (
                <p className="mt-1 text-sm text-red-600">{errors.history_of_present_illness}</p>
              )}
            </div>

            {/* Past Medical History */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Past Medical History</label>
              <textarea
                rows={3}
                value={formData.past_medical_history}
                onChange={(e) => handleInputChange(null, 'past_medical_history', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Previous medical conditions, surgeries, hospitalizations..."
              />
            </div>

            {/* Vital Signs */}
            {renderVitalSigns()}

            {/* Physical Examination */}
            {renderPhysicalExamination()}

            {/* Assessment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primary Diagnosis <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.assessment.primary_diagnosis}
                onChange={(e) => handleInputChange('assessment', 'primary_diagnosis', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.primary_diagnosis ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter the primary diagnosis..."
              />
              {errors.primary_diagnosis && (
                <p className="mt-1 text-sm text-red-600">{errors.primary_diagnosis}</p>
              )}
            </div>

            {/* Medications */}
            {renderMedications()}

            {/* Follow-up */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Follow-up Instructions</label>
              <textarea
                rows={3}
                value={formData.treatment_plan.follow_up}
                onChange={(e) => handleInputChange('treatment_plan', 'follow_up', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="When to return, what to watch for, emergency instructions..."
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => handleInputChange(null, 'notes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Any additional observations or recommendations..."
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2">
            {consultationEnded ? (
              <div className="flex items-center space-x-2 text-green-600">
                <HiCheckCircle className="h-5 w-5" />
                <span className="font-medium">Consultation Completed</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-blue-600">
                <HiExclamationCircle className="h-5 w-5" />
                <span className="font-medium">Consultation In Progress</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <HiSave className="h-4 w-4" />
              <span>{saving ? 'Saving...' : 'Save Diagnosis'}</span>
            </button>
            
            {!consultationEnded && (
              <button
                onClick={handleEndConsultation}
                disabled={endingConsultation || saving}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <HiCheckCircle className="h-4 w-4" />
                <span>{endingConsultation ? 'Ending...' : 'End Consultation'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
