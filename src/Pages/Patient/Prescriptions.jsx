import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import {
  HiDocumentText,
  HiDownload,
  HiEye,
  HiCalendar,
  HiUser,
  HiClock,
  HiRefresh,
  HiFilter,
  HiSearch,
  HiPrinter,
  HiCheckCircle,
  HiX,
  HiArrowLeft,
  HiArrowRight
} from 'react-icons/hi';

export default function Prescriptions() {
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, current, completed, expired
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [prescriptionsPerPage] = useState(10);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [prescriptions, filter, searchTerm]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_BASE_URL}/api/patient/prescriptions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setPrescriptions(response.data.prescriptions || []);
    } catch (err) {
      console.error('Error fetching prescriptions:', err);
      setError(err.response?.data?.message || 'Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...prescriptions];

    // Apply type filter
    if (filter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(prescription => {
        const endDate = new Date(prescription.endDate);
        switch (filter) {
          case 'current':
            return endDate >= now && prescription.status === 'active';
          case 'completed':
            return prescription.status === 'completed';
          case 'expired':
            return endDate < now || prescription.status === 'expired';
          default:
            return true;
        }
      });
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(prescription =>
        prescription.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prescription.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prescription.medicines.some(medicine => 
          medicine.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    setFilteredPrescriptions(filtered);
  };

  const downloadPrescription = async (prescriptionId) => {
    try {
      setDownloading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_BASE_URL}/api/patient/prescriptions/${prescriptionId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prescription-${prescriptionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading prescription:', err);
      alert('Failed to download prescription. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const printPrescription = (prescription) => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Prescription - ${prescription.doctorName}</title>
        <style>
          @media print {
            @page { margin: 0.5in; size: A4; }
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .no-print { display: none !important; }
          }
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { margin: 0; color: #2563eb; }
          .header p { margin: 5px 0; color: #666; }
          .prescription-info { margin-bottom: 30px; }
          .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
          .info-label { font-weight: bold; color: #374151; }
          .medicines { margin: 30px 0; }
          .medicine-item { border: 1px solid #e5e7eb; padding: 15px; margin-bottom: 15px; border-radius: 8px; }
          .medicine-name { font-weight: bold; color: #1f2937; margin-bottom: 5px; }
          .medicine-details { color: #6b7280; font-size: 14px; }
          .instructions { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>MediQ Hospital</h1>
          <p>Digital Prescription</p>
        </div>
        
        <div class="prescription-info">
          <div class="info-row">
            <span class="info-label">Patient Name:</span>
            <span>${prescription.patientName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Doctor:</span>
            <span>Dr. ${prescription.doctorName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Date:</span>
            <span>${new Date(prescription.createdAt).toLocaleDateString()}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Valid Until:</span>
            <span>${new Date(prescription.endDate).toLocaleDateString()}</span>
          </div>
        </div>
        
        <div class="medicines">
          <h3>Medicines Prescribed:</h3>
          ${prescription.medicines.map(medicine => `
            <div class="medicine-item">
              <div class="medicine-name">${medicine.name}</div>
              <div class="medicine-details">
                <strong>Dosage:</strong> ${medicine.dosage}<br>
                <strong>Frequency:</strong> ${medicine.frequency}<br>
                <strong>Duration:</strong> ${medicine.duration}<br>
                ${medicine.instructions ? `<strong>Instructions:</strong> ${medicine.instructions}` : ''}
              </div>
            </div>
          `).join('')}
        </div>
        
        ${prescription.instructions ? `
          <div class="instructions">
            <h4>Additional Instructions:</h4>
            <p>${prescription.instructions}</p>
          </div>
        ` : ''}
        
        <div class="footer">
          <p>This is a digital prescription. Please keep this for your records.</p>
          <p>For any queries, contact the hospital at +91-9876543210</p>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const getStatusColor = (status, endDate) => {
    const now = new Date();
    const isExpired = new Date(endDate) < now;
    
    if (isExpired || status === 'expired') {
      return 'bg-red-100 text-red-800 border-red-200';
    } else if (status === 'completed') {
      return 'bg-green-100 text-green-800 border-green-200';
    } else if (status === 'active') {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    } else {
      return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status, endDate) => {
    const now = new Date();
    const isExpired = new Date(endDate) < now;
    
    if (isExpired || status === 'expired') {
      return 'Expired';
    } else if (status === 'completed') {
      return 'Completed';
    } else if (status === 'active') {
      return 'Active';
    } else {
      return 'Unknown';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Pagination
  const indexOfLastPrescription = currentPage * prescriptionsPerPage;
  const indexOfFirstPrescription = indexOfLastPrescription - prescriptionsPerPage;
  const currentPrescriptions = filteredPrescriptions.slice(indexOfFirstPrescription, indexOfLastPrescription);
  const totalPages = Math.ceil(filteredPrescriptions.length / prescriptionsPerPage);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-24 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <HiDocumentText className="h-6 w-6 mr-2" />
                My Prescriptions
              </h1>
              <p className="text-gray-600 mt-1">View and download your medical prescriptions</p>
            </div>
            <button
              onClick={fetchPrescriptions}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <HiRefresh className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search prescriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Prescriptions</option>
              <option value="current">Current</option>
              <option value="completed">Completed</option>
              <option value="expired">Expired</option>
            </select>

            <div className="flex items-center text-sm text-gray-600">
              <HiFilter className="w-4 h-4 mr-1" />
              {filteredPrescriptions.length} prescriptions found
            </div>
          </div>
        </div>

        {/* Prescriptions List */}
        <div className="space-y-4">
          {currentPrescriptions.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <HiDocumentText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No prescriptions found</h3>
              <p className="text-gray-500">
                {searchTerm || filter !== 'all' 
                  ? 'No prescriptions match your current filters.'
                  : 'You have no prescriptions yet. Prescriptions will appear here after your consultations.'
                }
              </p>
            </div>
          ) : (
            currentPrescriptions.map((prescription) => (
              <div key={prescription._id} className="bg-white rounded-lg shadow border border-gray-200">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Dr. {prescription.doctorName}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(prescription.status, prescription.endDate)}`}>
                          {getStatusText(prescription.status, prescription.endDate)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <HiCalendar className="w-4 h-4 mr-2" />
                          <span>Prescribed: {formatDate(prescription.createdAt)}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <HiClock className="w-4 h-4 mr-2" />
                          <span>Valid until: {formatDate(prescription.endDate)}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <HiUser className="w-4 h-4 mr-2" />
                          <span>{prescription.medicines.length} medicines</span>
                        </div>
                      </div>

                      {prescription.diagnosis && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Diagnosis:</h4>
                          <p className="text-sm text-gray-600">{prescription.diagnosis}</p>
                        </div>
                      )}

                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Medicines:</h4>
                        <div className="space-y-2">
                          {prescription.medicines.slice(0, 3).map((medicine, index) => (
                            <div key={index} className="text-sm text-gray-600">
                              <span className="font-medium">{medicine.name}</span>
                              <span className="text-gray-500"> - {medicine.dosage} ({medicine.frequency})</span>
                            </div>
                          ))}
                          {prescription.medicines.length > 3 && (
                            <p className="text-sm text-gray-500">
                              +{prescription.medicines.length - 3} more medicines
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => {
                          setSelectedPrescription(prescription);
                          setShowDetailsModal(true);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="View details"
                      >
                        <HiEye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => downloadPrescription(prescription._id)}
                        disabled={downloading}
                        className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                        title="Download PDF"
                      >
                        <HiDownload className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => printPrescription(prescription)}
                        className="p-2 text-gray-400 hover:text-purple-600 transition-colors"
                        title="Print prescription"
                      >
                        <HiPrinter className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {indexOfFirstPrescription + 1} to {Math.min(indexOfLastPrescription, filteredPrescriptions.length)} of {filteredPrescriptions.length} prescriptions
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <HiArrowLeft className="w-4 h-4 mr-1" />
                  Previous
                </button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        page === currentPage
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <HiArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Prescription Details Modal */}
      {showDetailsModal && selectedPrescription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center space-x-3">
                  <HiDocumentText className="h-6 w-6 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">Prescription Details</h2>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <HiX className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Prescription Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Patient Name</h3>
                    <p className="text-gray-900">{selectedPrescription.patientName}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Doctor</h3>
                    <p className="text-gray-900">Dr. {selectedPrescription.doctorName}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Prescribed Date</h3>
                    <p className="text-gray-900">{formatDate(selectedPrescription.createdAt)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Valid Until</h3>
                    <p className="text-gray-900">{formatDate(selectedPrescription.endDate)}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(selectedPrescription.status, selectedPrescription.endDate)}`}>
                      {getStatusText(selectedPrescription.status, selectedPrescription.endDate)}
                    </span>
                  </div>
                </div>

                {/* Diagnosis */}
                {selectedPrescription.diagnosis && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Diagnosis</h3>
                    <p className="text-gray-900">{selectedPrescription.diagnosis}</p>
                  </div>
                )}

                {/* Medicines */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Medicines Prescribed</h3>
                  <div className="space-y-4">
                    {selectedPrescription.medicines.map((medicine, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-2">{medicine.name}</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Dosage:</span> {medicine.dosage}
                              </div>
                              <div>
                                <span className="font-medium">Frequency:</span> {medicine.frequency}
                              </div>
                              <div>
                                <span className="font-medium">Duration:</span> {medicine.duration}
                              </div>
                              {medicine.instructions && (
                                <div className="col-span-2">
                                  <span className="font-medium">Instructions:</span> {medicine.instructions}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Additional Instructions */}
                {selectedPrescription.instructions && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Additional Instructions</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-900 whitespace-pre-wrap">{selectedPrescription.instructions}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => downloadPrescription(selectedPrescription._id)}
                  disabled={downloading}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  <HiDownload className="w-4 h-4 mr-2" />
                  Download PDF
                </button>
                <button
                  onClick={() => printPrescription(selectedPrescription)}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
                >
                  <HiPrinter className="w-4 h-4 mr-2" />
                  Print
                </button>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
