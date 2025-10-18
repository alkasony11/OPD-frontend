import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  HiArrowLeft, 
  HiDownload, 
  HiEye, 
  HiCalendar, 
  HiCash, 
  HiCheckCircle,
  HiClock,
  HiX
} from 'react-icons/hi';
import axios from 'axios';

export default function Invoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('all'); // all, paid, pending, refunded
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/api/patient/invoices', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Invoices response:', response.data);
      setInvoices(response.data.invoices || []);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError(err.response?.data?.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'refunded':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <HiCheckCircle className="h-4 w-4" />;
      case 'pending':
        return <HiClock className="h-4 w-4" />;
      case 'refunded':
        return <HiCash className="h-4 w-4" />;
      case 'cancelled':
        return <HiX className="h-4 w-4" />;
      default:
        return <HiClock className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const downloadInvoice = async (invoiceId) => {
    try {
      setError(''); // Clear any previous errors
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5001/api/patient/invoices/${invoiceId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice-${invoiceId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      // Show success message
      setSuccess('Professional PDF invoice downloaded successfully! You can open it and use Ctrl+P to print.');
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess('');
      }, 5000);
    } catch (err) {
      console.error('Error downloading invoice:', err);
      setError('Failed to download invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    if (filter === 'all') return true;
    return invoice.payment_status === filter;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4 py-6">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <HiArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Invoices & Payments</h1>
              <p className="text-sm text-gray-600">View and download your payment history</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <HiX className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <HiCheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-green-800">{success}</span>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Filter:</span>
            {['all', 'paid', 'pending', 'refunded'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${
                  filter === f 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                    : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {f[0].toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        {!loading && filteredInvoices.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <HiCash className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Total Invoices</p>
                  <p className="text-2xl font-bold text-gray-900">{filteredInvoices.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <HiCheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Paid</p>
                  <p className="text-2xl font-bold text-green-600">
                    {filteredInvoices.filter(inv => inv.payment_status === 'paid').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <HiClock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {filteredInvoices.filter(inv => inv.payment_status === 'pending').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <HiX className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Cancelled</p>
                  <p className="text-2xl font-bold text-red-600">
                    {filteredInvoices.filter(inv => inv.payment_status === 'cancelled').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Invoices List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-12">
            <HiCash className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? "You don't have any invoices yet." 
                : `No ${filter} invoices found.`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredInvoices.map((invoice) => (
              <div key={invoice.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">
                            Invoice #{invoice.invoice_number || invoice.id}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {invoice.appointment?.doctorName || 'Dr. Unknown'} • {invoice.appointment?.department || 'General'}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900 mb-1">
                            {formatCurrency(invoice.amount || 0)}
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium border flex items-center space-x-1 w-fit ml-auto ${getStatusColor(invoice.payment_status)}`}>
                            {getStatusIcon(invoice.payment_status)}
                            <span>{invoice.payment_status.charAt(0).toUpperCase() + invoice.payment_status.slice(1)}</span>
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <span className="text-gray-600 block text-xs font-medium uppercase tracking-wide">Invoice Date</span>
                          <span className="text-gray-900 font-semibold">{formatDate(invoice.created_at || invoice.appointment?.appointmentDate)}</span>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <span className="text-gray-600 block text-xs font-medium uppercase tracking-wide">Appointment Date</span>
                          <span className="text-gray-900 font-semibold">
                            {invoice.appointment?.appointmentDate ? formatDate(invoice.appointment.appointmentDate) : 'N/A'}
                          </span>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <span className="text-gray-600 block text-xs font-medium uppercase tracking-wide">Time Slot</span>
                          <span className="text-gray-900 font-semibold">{invoice.appointment?.timeSlot || 'N/A'}</span>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <span className="text-gray-600 block text-xs font-medium uppercase tracking-wide">Appointment Status</span>
                          <span className="text-gray-900 font-semibold capitalize">{invoice.appointment?.status || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-6">
                      <button
                        onClick={() => setSelectedInvoice(invoice)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <HiEye className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => downloadInvoice(invoice.id)}
                        className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Download PDF"
                      >
                        <HiDownload className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Invoice #{selectedInvoice.invoice_number || selectedInvoice.id}
              </h3>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <HiX className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Invoice Date:</span>
                  <p className="text-gray-900">{formatDate(selectedInvoice.created_at || selectedInvoice.appointment?.appointmentDate)}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Payment Status:</span>
                  <div className="flex items-center space-x-1 mt-1">
                    {getStatusIcon(selectedInvoice.payment_status)}
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedInvoice.payment_status)}`}>
                      {selectedInvoice.payment_status.charAt(0).toUpperCase() + selectedInvoice.payment_status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-2">Appointment Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Doctor:</span>
                    <p className="text-gray-900">{selectedInvoice.appointment?.doctorName || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Department:</span>
                    <p className="text-gray-900">{selectedInvoice.appointment?.department || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Date & Time:</span>
                    <p className="text-gray-900">
                      {selectedInvoice.appointment?.appointmentDate ? formatDate(selectedInvoice.appointment.appointmentDate) : 'N/A'} at {selectedInvoice.appointment?.timeSlot || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Patient:</span>
                    <p className="text-gray-900">{selectedInvoice.appointment?.patientName || 'N/A'}</p>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-4">Payment Details</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Consultation Fee:</span>
                    <span className="text-lg font-semibold text-gray-900">{formatCurrency(selectedInvoice.amount || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="text-gray-900">Online Payment</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Transaction ID:</span>
                    <span className="text-gray-900 font-mono">{selectedInvoice.id.toString().slice(-8).toUpperCase()}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-gray-900">Total Amount:</span>
                      <span className="text-2xl font-bold text-blue-600">{formatCurrency(selectedInvoice.amount || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Close
              </button>
              <button
                onClick={() => downloadInvoice(selectedInvoice.id)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center space-x-2"
              >
                <HiDownload className="h-4 w-4" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
