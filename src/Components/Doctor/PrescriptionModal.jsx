import { useState, useEffect } from 'react';
import { HiX, HiPlus, HiTrash, HiPrinter } from 'react-icons/hi';
import axios from 'axios';

export default function PrescriptionModal({ appointment, isOpen, onClose, onPrescriptionAdded }) {
  const [prescriptions, setPrescriptions] = useState([]);
  const [newPrescription, setNewPrescription] = useState({
    medicationName: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: ''
  });
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (isOpen && appointment) {
      setPrescriptions(appointment.prescriptions || []);
    }
  }, [isOpen, appointment]);

  const handleInputChange = (field, value) => {
    setNewPrescription(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addPrescription = async () => {
    if (!newPrescription.medicationName || !newPrescription.dosage || 
        !newPrescription.frequency || !newPrescription.duration) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setAdding(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `http://localhost:5001/api/doctor/appointments/${appointment._id}/prescriptions`,
        newPrescription,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local prescriptions list
      setPrescriptions(response.data.appointment.prescriptions);
      
      // Reset form
      setNewPrescription({
        medicationName: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: ''
      });

      // Notify parent component
      if (onPrescriptionAdded) {
        onPrescriptionAdded(response.data.appointment);
      }

    } catch (error) {
      console.error('Error adding prescription:', error);
      alert('Failed to add prescription');
    } finally {
      setAdding(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const printPrescription = () => {
    const printWindow = window.open('', '_blank');
    const prescriptionHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Prescription - ${appointment?.patientName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .patient-info { margin-bottom: 20px; }
            .prescription-item { margin-bottom: 15px; padding: 10px; border: 1px solid #ddd; }
            .medication-name { font-weight: bold; font-size: 16px; }
            .details { margin-top: 5px; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Medical Prescription</h1>
            <p>OPD Management System</p>
          </div>
          
          <div class="patient-info">
            <h3>Patient Information:</h3>
            <p><strong>Name:</strong> ${appointment?.patientName}</p>
            <p><strong>Date:</strong> ${formatDate(appointment?.appointmentDate)}</p>
            <p><strong>Time:</strong> ${appointment?.appointmentTime}</p>
          </div>
          
          <div class="prescriptions">
            <h3>Prescribed Medications:</h3>
            ${prescriptions.map((prescription, index) => `
              <div class="prescription-item">
                <div class="medication-name">${index + 1}. ${prescription.medicationName}</div>
                <div class="details">
                  <p><strong>Dosage:</strong> ${prescription.dosage}</p>
                  <p><strong>Frequency:</strong> ${prescription.frequency}</p>
                  <p><strong>Duration:</strong> ${prescription.duration}</p>
                  ${prescription.instructions ? `<p><strong>Instructions:</strong> ${prescription.instructions}</p>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
          
          <div class="footer">
            <p>Generated on ${new Date().toLocaleDateString()}</p>
            <p>This prescription is valid for the specified duration only.</p>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(prescriptionHTML);
    printWindow.document.close();
    printWindow.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Prescription Management
            </h2>
            <p className="text-sm text-gray-500">
              Patient: {appointment?.patientName} | Date: {formatDate(appointment?.appointmentDate)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <HiX className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Existing Prescriptions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Current Prescriptions</h3>
              {prescriptions.length > 0 && (
                <button
                  onClick={printPrescription}
                  className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  <HiPrinter className="h-4 w-4" />
                  <span>Print</span>
                </button>
              )}
            </div>
            
            {prescriptions.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No prescriptions added yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {prescriptions.map((prescription, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-2">
                          {index + 1}. {prescription.medicationName}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Dosage:</span>
                            <span className="text-gray-600 ml-2">{prescription.dosage}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Frequency:</span>
                            <span className="text-gray-600 ml-2">{prescription.frequency}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Duration:</span>
                            <span className="text-gray-600 ml-2">{prescription.duration}</span>
                          </div>
                        </div>
                        {prescription.instructions && (
                          <div className="mt-2 text-sm">
                            <span className="font-medium text-gray-700">Instructions:</span>
                            <span className="text-gray-600 ml-2">{prescription.instructions}</span>
                          </div>
                        )}
                        <div className="mt-2 text-xs text-gray-500">
                          Prescribed on: {formatDate(prescription.prescribedAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add New Prescription */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Prescription</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medication Name *
                </label>
                <input
                  type="text"
                  value={newPrescription.medicationName}
                  onChange={(e) => handleInputChange('medicationName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter medication name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dosage *
                </label>
                <input
                  type="text"
                  value={newPrescription.dosage}
                  onChange={(e) => handleInputChange('dosage', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 500mg, 1 tablet"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frequency *
                </label>
                <select
                  value={newPrescription.frequency}
                  onChange={(e) => handleInputChange('frequency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select frequency</option>
                  <option value="Once daily">Once daily</option>
                  <option value="Twice daily">Twice daily</option>
                  <option value="Three times daily">Three times daily</option>
                  <option value="Four times daily">Four times daily</option>
                  <option value="Every 4 hours">Every 4 hours</option>
                  <option value="Every 6 hours">Every 6 hours</option>
                  <option value="Every 8 hours">Every 8 hours</option>
                  <option value="As needed">As needed</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration *
                </label>
                <select
                  value={newPrescription.duration}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select duration</option>
                  <option value="3 days">3 days</option>
                  <option value="5 days">5 days</option>
                  <option value="7 days">7 days</option>
                  <option value="10 days">10 days</option>
                  <option value="14 days">14 days</option>
                  <option value="21 days">21 days</option>
                  <option value="1 month">1 month</option>
                  <option value="2 months">2 months</option>
                  <option value="3 months">3 months</option>
                </select>
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Instructions
              </label>
              <textarea
                value={newPrescription.instructions}
                onChange={(e) => handleInputChange('instructions', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Take with food, Avoid alcohol, etc."
              />
            </div>
            
            <div className="mt-4">
              <button
                onClick={addPrescription}
                disabled={adding}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                <HiPlus className="h-4 w-4" />
                <span>{adding ? 'Adding...' : 'Add Prescription'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
