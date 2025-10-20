import { useState, useEffect } from 'react';
import { HiSearch, HiFilter, HiDownload, HiCalendar, HiUser, HiClock } from 'react-icons/hi';
import axios from 'axios';
import { API_CONFIG } from '../../config/urls';

export default function AdvancedSearch() {
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    searchTerm: '',
    dateFrom: '',
    dateTo: '',
    status: '',
    appointmentType: '',
    department: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'booked', label: 'Booked' },
    { value: 'in_queue', label: 'In Queue' },
    { value: 'consulted', label: 'Consulted' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'missed', label: 'Missed' }
  ];

  const appointmentTypes = [
    { value: '', label: 'All Types' },
    { value: 'consultation', label: 'Consultation' },
    { value: 'follow-up', label: 'Follow-up' },
    { value: 'emergency', label: 'Emergency' },
    { value: 'routine-checkup', label: 'Routine Checkup' }
  ];

  useEffect(() => {
    // Auto-search when filters change (with debounce)
    const timeoutId = setTimeout(() => {
      if (filters.searchTerm || filters.dateFrom || filters.dateTo || filters.status || filters.appointmentType) {
        handleSearch();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [filters]);

  const handleSearch = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await axios.get(
        `${API_CONFIG.BASE_URL}/api/doctor/search-appointments?${queryParams}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSearchResults(response.data.appointments || []);
    } catch (error) {
      console.error('Error searching appointments:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await axios.get(
        `${API_CONFIG.BASE_URL}/api/doctor/export-appointments?${queryParams}`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `appointments_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting appointments:', error);
      alert('Failed to export appointments');
    }
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      dateFrom: '',
      dateTo: '',
      status: '',
      appointmentType: '',
      department: ''
    });
    setSearchResults([]);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'booked': return 'bg-blue-100 text-blue-800';
      case 'in_queue': return 'bg-yellow-100 text-yellow-800';
      case 'consulted': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'missed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Advanced Search</h2>
            <p className="text-sm text-gray-600">Search and filter appointments</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                showFilters ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <HiFilter className="h-4 w-4" />
              <span>Filters</span>
            </button>
            {searchResults.length > 0 && (
              <button
                onClick={handleExport}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <HiDownload className="h-4 w-4" />
                <span>Export</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-6 border-b border-gray-200">
        <div className="relative">
          <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by patient name, symptoms, or token number..."
            value={filters.searchTerm}
            onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date To</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Appointment Type</label>
              <select
                value={filters.appointmentType}
                onChange={(e) => setFilters({...filters, appointmentType: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {appointmentTypes.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            
            <div className="md:col-span-2 flex items-end space-x-3">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Clear Filters
              </button>
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search Results */}
      <div className="p-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Searching...</p>
          </div>
        ) : searchResults.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Found {searchResults.length} appointment{searchResults.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            {searchResults.map((appointment) => (
              <div key={appointment._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <HiUser className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {appointment.patient_name || 'Unknown Patient'}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <HiCalendar className="h-4 w-4" />
                          <span>{formatDate(appointment.booking_date)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <HiClock className="h-4 w-4" />
                          <span>{appointment.time_slot}</span>
                        </div>
                        <div>
                          Token: #{appointment.token_number || appointment._id.slice(-6)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                      {appointment.status}
                    </span>
                  </div>
                </div>
                
                {appointment.symptoms && (
                  <div className="mt-3 text-sm text-gray-600">
                    <strong>Symptoms:</strong> {appointment.symptoms}
                  </div>
                )}
                
                {appointment.department && (
                  <div className="mt-2 text-sm text-gray-600">
                    <strong>Department:</strong> {appointment.department}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : filters.searchTerm || filters.dateFrom || filters.dateTo || filters.status || filters.appointmentType ? (
          <div className="text-center py-8">
            <HiSearch className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No appointments found matching your search criteria</p>
          </div>
        ) : (
          <div className="text-center py-8">
            <HiSearch className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Enter search terms or apply filters to find appointments</p>
          </div>
        )}
      </div>
    </div>
  );
}
