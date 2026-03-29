import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    HiArrowLeft,
    HiUpload,
    HiDocumentText,
    HiTrash,
    HiDownload,
    HiEye
} from 'react-icons/hi';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api';

export default function MedicalRecords() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [records, setRecords] = useState([]);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchRecords();
    }, []);

    const fetchRecords = async () => {
        try {
            setLoading(true);
            // Try fetching from API first
            // const res = await axios.get(`${API_BASE_URL}/api/patient/documents`);
            // setRecords(res.data.documents);

            // Fallback/Demo: Load from localStorage
            const localData = JSON.parse(localStorage.getItem('patient_documents') || '[]');
            setRecords(localData);
        } catch (error) {
            console.error('Error fetching records:', error);
            // Fallback
            const localData = JSON.parse(localStorage.getItem('patient_documents') || '[]');
            setRecords(localData);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            setUploading(true);

            // Mock Upload - In real app, FormData + POST
            // const formData = new FormData();
            // formData.append('file', file);
            // await axios.post(`${API_BASE_URL}/api/patient/documents`, formData);

            // Simulation: Convert to base64 for local storage demo
            const reader = new FileReader();
            reader.onloadend = () => {
                const newDoc = {
                    id: Date.now(),
                    name: file.name,
                    type: file.type,
                    size: (file.size / 1024).toFixed(2) + ' KB',
                    date: new Date().toISOString(),
                    addedBy: 'Patient',
                    url: reader.result // Store base64 for preview
                };

                const updatedRecords = [newDoc, ...records];
                setRecords(updatedRecords);
                localStorage.setItem('patient_documents', JSON.stringify(updatedRecords));
                setUploading(false);
                alert('Document uploaded successfully!');
            };
            reader.readAsDataURL(file);

        } catch (error) {
            console.error('Upload failed:', error);
            setUploading(false);
            alert('Upload failed');
        }
    };

    const deleteRecord = (id) => {
        if (window.confirm('Are you sure you want to delete this document?')) {
            const updated = records.filter(r => r.id !== id);
            setRecords(updated);
            localStorage.setItem('patient_documents', JSON.stringify(updated));
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate('/settings')}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <HiArrowLeft className="h-6 w-6 text-gray-600" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Medical Records Vault</h1>
                                <p className="text-sm text-gray-500">Securely store and manage your health documents</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Upload Zone */}
                <div className="mb-8">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-blue-300 border-dashed rounded-lg cursor-pointer bg-blue-50 hover:bg-blue-100 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <HiUpload className="w-8 h-8 mb-2 text-blue-500" />
                            <p className="text-sm text-blue-700 font-semibold">{uploading ? 'Uploading...' : 'Click to upload or drag and drop'}</p>
                            <p className="text-xs text-blue-500">PDF, JPG, PNG (Max 10MB)</p>
                        </div>
                        <input
                            type="file"
                            className="hidden"
                            onChange={handleFileUpload}
                            accept=".pdf,.jpg,.jpeg,.png"
                            disabled={uploading}
                        />
                    </label>
                </div>

                {/* Records List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-900">My Documents ({records.length})</h3>
                        <span className="text-xs text-gray-500">Local Storage Mode</span>
                    </div>

                    {records.length === 0 ? (
                        <div className="p-12 text-center text-gray-500">
                            <HiDocumentText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                            <p>No documents uploaded yet.</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-200">
                            {records.map((doc) => (
                                <li key={doc.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                                    <div className="flex items-center space-x-4">
                                        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <HiDocumentText className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{doc.name}</p>
                                            <p className="text-xs text-gray-500">
                                                {doc.size} • {new Date(doc.date).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        {doc.url && (
                                            <a
                                                href={doc.url}
                                                download={doc.name}
                                                className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50"
                                                title="Download"
                                            >
                                                <HiDownload className="h-5 w-5" />
                                            </a>
                                        )}
                                        <button
                                            onClick={() => deleteRecord(doc.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50"
                                            title="Delete"
                                        >
                                            <HiTrash className="h-5 w-5" />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
