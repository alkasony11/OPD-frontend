import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiArrowLeft, HiDocument, HiDocumentText, HiUser, HiCalendar, HiSearch, HiDownload, HiEye, HiClock } from 'react-icons/hi';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';
import DoctorSidebar from '../../Components/Doctor/Sidebar';

export default function DoctorRecordsPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showRecordModal, setShowRecordModal] = useState(false);

  useEffect(() => {
    checkDoctorAuth();
  }, []);

  useEffect(() => {
    if (loading) {
      fetchRecords();
    }
  }, []);

  const checkDoctorAuth = () => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!userData || !token) {
      navigate('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 'doctor') {
        alert('Access denied. Doctor privileges required.');
        navigate('/');
        return;
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      navigate('/login');
    }
  };

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        console.error('No token found');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/api/doctor/medical-records`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setRecords(response.data.records || []);
    } catch (error) {
      console.error('Error fetching records:', error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter(record => {
    const matchesSearch = 
      record.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.notes.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || record.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'follow_up':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const exportRecord = (record) => {
    const data = {
      patient: record.patient_name,
      date: new Date(record.appointment_date).toLocaleDateString(),
      time: record.appointment_time,
      diagnosis: record.diagnosis,
      chief_complaint: record.chief_complaint,
      history_of_present_illness: record.history_of_present_illness,
      physical_examination: record.physical_examination,
      vital_signs: record.vital_signs,
      medications: record.medications,
      notes: record.notes,
      follow_up_required: record.follow_up_required,
      follow_up_date: record.follow_up_date,
      status: record.status
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medical-record-${record.patient_name}-${record.date}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex">
      <DoctorSidebar />
      <div className="flex-1 ml-64">
        {/* Professional Header */}
        <div className="bg-white shadow-lg border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-6 sm:py-8 space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <button
                  onClick={() => navigate('/doctor/dashboard')}
                  className="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all duration-200"
                >
                  <HiArrowLeft className="h-5 w-5 text-gray-600" />
                </button>
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <HiDocument className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Medical Records</h1>
                    <p className="text-base sm:text-lg text-gray-600 mt-1">View and manage patient medical records</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-xl">
                  <HiDocument className="h-4 w-4 text-indigo-600" />
                  <span className="text-sm font-medium text-indigo-700">{records.length} Total Records</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Enhanced Search and Filter */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <HiSearch className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search records by patient name, diagnosis, or notes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200 text-lg"
                    />
                  </div>
                </div>
          <div className="sm:w-48">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="follow_up">Follow-up</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <HiDocumentText className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Records</p>
                <p className="text-3xl font-extrabold text-gray-900">{records.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <HiDocumentText className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Cases</p>
                <p className="text-3xl font-extrabold text-gray-900">
                  {records.filter(r => r.status === 'active').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <HiDocumentText className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Follow-up Required</p>
                <p className="text-3xl font-extrabold text-gray-900">
                  {records.filter(r => r.status === 'follow_up').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <HiDocumentText className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-3xl font-extrabold text-gray-900">
                  {records.filter(r => r.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Records List */}
        <div className="bg-white shadow-sm rounded-lg">
          {filteredRecords.length === 0 ? (
            <div className="text-center py-12">
              <HiDocumentText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {searchTerm || filterStatus !== 'all' ? 'No records found' : 'No medical records yet'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || filterStatus !== 'all' ? 'Try adjusting your search or filter criteria.' : 'Medical records will appear here after consultations.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredRecords.map((record, index) => (
                <div key={record._id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                      </div>
                      <div className="flex-shrink-0">
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <HiUser className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-lg font-medium text-gray-900 truncate">
                            {record.patient_name}
                          </p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                            {record.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <HiCalendar className="h-4 w-4" />
                            <span>{new Date(record.appointment_date).toLocaleDateString()}</span>
                          </div>
                          {record.appointment_time && (
                            <div className="flex items-center space-x-1">
                              <HiClock className="h-4 w-4" />
                              <span>{record.appointment_time}</span>
                            </div>
                          )}
                        </div>
                        <div className="mt-2">
                          {record.diagnosis && (
                            <p className="text-sm text-gray-600">
                              <strong>Diagnosis:</strong> {record.diagnosis}
                            </p>
                          )}
                          {record.chief_complaint && (
                            <p className="text-sm text-gray-600 mt-1">
                              <strong>Chief Complaint:</strong> {record.chief_complaint.length > 100 ? `${record.chief_complaint.substring(0, 100)}...` : record.chief_complaint}
                            </p>
                          )}
                          {record.notes && (
                            <p className="text-sm text-gray-600 mt-1">
                              <strong>Notes:</strong> {record.notes.length > 100 ? `${record.notes.substring(0, 100)}...` : record.notes}
                            </p>
                          )}
                          {record.medications && record.medications.length > 0 && (
                            <p className="text-sm text-gray-600 mt-1">
                              <strong>Medications:</strong> {record.medications.length} prescribed
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedRecord(record);
                          setShowRecordModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                        title="View Full Record"
                      >
                        <HiEye className="h-5 w-5" />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => exportRecord(record)}
                        className="text-green-600 hover:text-green-900 flex items-center space-x-1"
                        title="Export Record"
                      >
                        <HiDownload className="h-5 w-5" />
                        <span>Export</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Record Details Modal */}
      {showRecordModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Medical Record Details</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Patient Name</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRecord.patient_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <p className="mt-1 text-sm text-gray-900">{new Date(selectedRecord.appointment_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Time</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRecord.appointment_time}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedRecord.status)}`}>
                    {selectedRecord.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
              
              {selectedRecord.chief_complaint && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Chief Complaint</label>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{selectedRecord.chief_complaint}</p>
                </div>
              )}
              
              {selectedRecord.diagnosis && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Diagnosis</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRecord.diagnosis}</p>
                </div>
              )}
              
              {selectedRecord.history_of_present_illness && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">History of Present Illness</label>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{selectedRecord.history_of_present_illness}</p>
                </div>
              )}
              
              {selectedRecord.physical_examination && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Physical Examination</label>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{selectedRecord.physical_examination}</p>
                </div>
              )}
              
              {selectedRecord.medications && selectedRecord.medications.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Medications</label>
                  <div className="mt-1 space-y-2">
                    {selectedRecord.medications.map((med, index) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-gray-900">{med.medication_name || med.name}</p>
                        <p className="text-sm text-gray-600">Dosage: {med.dosage}</p>
                        <p className="text-sm text-gray-600">Frequency: {med.frequency}</p>
                        <p className="text-sm text-gray-600">Duration: {med.duration}</p>
                        {med.instructions && (
                          <p className="text-sm text-gray-600">Instructions: {med.instructions}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedRecord.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{selectedRecord.notes}</p>
                </div>
              )}
              
              {selectedRecord.follow_up_required && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Follow-up Required</label>
                  <p className="mt-1 text-sm text-gray-900">Yes</p>
                  {selectedRecord.follow_up_date && (
                    <p className="mt-1 text-sm text-gray-600">Follow-up Date: {new Date(selectedRecord.follow_up_date).toLocaleDateString()}</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowRecordModal(false);
                  setSelectedRecord(null);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Close
              </button>
              <button
                onClick={() => exportRecord(selectedRecord)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <HiDownload className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}