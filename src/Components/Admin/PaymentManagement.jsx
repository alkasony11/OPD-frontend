import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  HiCreditCard, HiCash, HiShieldCheck, HiRefresh, HiDownload, 
  HiSearch, HiFilter, HiEye, HiCheckCircle, HiX, HiExclamation,
  HiClock, HiUser, HiCalendar, HiTag, HiCurrencyDollar,
  HiDocumentText, HiMail, HiPhone, HiArrowLeft, HiArrowRight
} from 'react-icons/hi';

export default function PaymentManagement() {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  
  // Refund form
  const [refundData, setRefundData] = useState({
    reason: '',
    amount: 0,
    method: 'original'
  });
  const [processingRefund, setProcessingRefund] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [paymentsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPayments, setTotalPayments] = useState(0);

  useEffect(() => {
    fetchPayments();
  }, [currentPage, statusFilter, methodFilter, dateFilter]);

  useEffect(() => {
    applyFilters();
  }, [payments, searchTerm]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const query = new URLSearchParams();
      if (statusFilter !== 'all') query.append('status', statusFilter);
      if (methodFilter !== 'all') query.append('method', methodFilter);
      if (dateFilter) query.append('date', dateFilter);
      query.append('page', currentPage);
      query.append('limit', paymentsPerPage);

      const response = await axios.get(`http://localhost:5001/api/admin/payments?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setPayments(response.data.payments || []);
      setTotalPages(response.data.totalPages || 1);
      setTotalPayments(response.data.total || 0);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...payments];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(payment => 
        payment.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.appointmentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.transactionId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredPayments(filtered);
  };

  const handleViewDetails = (payment) => {
    setSelectedPayment(payment);
    setShowDetailsModal(true);
  };

  const handleRefund = (payment) => {
    setSelectedPayment(payment);
    setRefundData({
      reason: '',
      amount: payment.amount,
      method: 'original'
    });
    setShowRefundModal(true);
  };

  const handleProcessRefund = async () => {
    try {
      setProcessingRefund(true);
      const token = localStorage.getItem('token');
      
      await axios.post(`http://localhost:5001/api/admin/payments/${selectedPayment._id}/refund`, refundData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state
      setPayments(payments.map(p => 
        p._id === selectedPayment._id 
          ? { ...p, status: 'refunded', refundedAt: new Date(), refundReason: refundData.reason }
          : p
      ));
      
      setShowRefundModal(false);
      setSelectedPayment(null);
      alert('Refund processed successfully');
    } catch (error) {
      console.error('Error processing refund:', error);
      alert('Error processing refund');
    } finally {
      setProcessingRefund(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: HiClock, label: 'Pending' },
      paid: { color: 'bg-green-100 text-green-800', icon: HiCheckCircle, label: 'Paid' },
      refunded: { color: 'bg-red-100 text-red-800', icon: HiArrowLeft, label: 'Refunded' },
      failed: { color: 'bg-gray-100 text-gray-800', icon: HiX, label: 'Failed' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const getMethodBadge = (method) => {
    const methodConfig = {
      card: { color: 'bg-blue-100 text-blue-800', icon: HiCreditCard, label: 'Card' },
      cash: { color: 'bg-green-100 text-green-800', icon: HiCash, label: 'Cash' },
      insurance: { color: 'bg-purple-100 text-purple-800', icon: HiShieldCheck, label: 'Insurance' },
      wallet: { color: 'bg-orange-100 text-orange-800', icon: HiCurrencyDollar, label: 'Wallet' }
    };
    
    const config = methodConfig[method] || methodConfig.cash;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const exportToCSV = () => {
    const csvData = filteredPayments.map(payment => ({
      'Transaction ID': payment.transactionId || 'N/A',
      'Patient Name': payment.patientName || 'N/A',
      'Patient Email': payment.patientEmail || 'N/A',
      'Patient Phone': payment.patientPhone || 'N/A',
      'Appointment ID': payment.appointmentId || 'N/A',
      'Doctor': payment.doctorName || 'N/A',
      'Department': payment.department || 'N/A',
      'Amount': payment.amount || 'N/A',
      'Payment Method': payment.method || 'N/A',
      'Status': payment.status || 'N/A',
      'Payment Date': payment.paidAt ? new Date(payment.paidAt).toLocaleString() : 'N/A',
      'Refund Date': payment.refundedAt ? new Date(payment.refundedAt).toLocaleString() : 'N/A',
      'Refund Reason': payment.refundReason || 'N/A',
      'Created At': new Date(payment.createdAt).toLocaleString()
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getTotalStats = () => {
    const stats = payments.reduce((acc, payment) => {
      if (payment.status === 'paid') {
        acc.totalPaid += payment.amount || 0;
        acc.paidCount += 1;
      } else if (payment.status === 'refunded') {
        acc.totalRefunded += payment.amount || 0;
        acc.refundedCount += 1;
      } else if (payment.status === 'pending') {
        acc.pendingCount += 1;
      }
      return acc;
    }, { totalPaid: 0, totalRefunded: 0, paidCount: 0, refundedCount: 0, pendingCount: 0 });

    return stats;
  };

  const stats = getTotalStats();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
            <p className="text-gray-600 mt-1">Manage payments, refunds, and financial transactions</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={fetchPayments}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <HiRefresh className="w-4 h-4 mr-2" />
              Refresh
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
            >
              <HiDownload className="w-4 h-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <HiCheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">Total Paid</p>
                <p className="text-2xl font-bold text-green-900">₹{stats.totalPaid.toLocaleString()}</p>
                <p className="text-xs text-green-700">{stats.paidCount} transactions</p>
              </div>
            </div>
          </div>
          
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center">
              <HiArrowLeft className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">Total Refunded</p>
                <p className="text-2xl font-bold text-red-900">₹{stats.totalRefunded.toLocaleString()}</p>
                <p className="text-xs text-red-700">{stats.refundedCount} transactions</p>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center">
              <HiClock className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-800">Pending</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.pendingCount}</p>
                <p className="text-xs text-yellow-700">transactions</p>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <HiCurrencyDollar className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-800">Net Revenue</p>
                <p className="text-2xl font-bold text-blue-900">₹{(stats.totalPaid - stats.totalRefunded).toLocaleString()}</p>
                <p className="text-xs text-blue-700">after refunds</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="relative">
            <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="refunded">Refunded</option>
            <option value="failed">Failed</option>
          </select>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Methods</option>
            <option value="card">Card</option>
            <option value="cash">Cash</option>
            <option value="insurance">Insurance</option>
            <option value="wallet">Wallet</option>
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="text-sm text-gray-600 flex items-center">
            <HiFilter className="w-4 h-4 mr-1" />
            {filteredPayments.length} of {totalPayments} payments
          </div>
        </div>

        {/* Payments List */}
        <div className="space-y-2">
          {filteredPayments.length > 0 && (
            <div className="hidden md:grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold text-gray-500 px-4">
              <div className="flex items-center">Amount</div>
              <div className="flex items-center">Doctor</div>
              <div className="flex items-center">Appointment Date</div>
              <div className="flex items-center">Department</div>
            </div>
          )}
          {filteredPayments.length === 0 ? (
            <div className="text-center py-12">
              <HiCreditCard className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No payments found</h3>
              <p className="mt-1 text-sm text-gray-500">No payments match your current filters.</p>
            </div>
          ) : (
            filteredPayments.map((payment, index) => (
              <div key={payment._id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {payment.patientName || 'Unknown Patient'}
                      </h3>
                      <span className="text-sm text-gray-500">({payment.transactionId || payment._id})</span>
                      {getStatusBadge(payment.status)}
                      {getMethodBadge(payment.method)}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <HiCurrencyDollar className="w-4 h-4 mr-2" />
                        ₹{payment.amount || 'N/A'}
                      </div>
                      <div className="flex items-center">
                        <HiUser className="w-4 h-4 mr-2" />
                        Dr. {payment.doctorName || 'N/A'}
                      </div>
                      <div className="flex items-center">
                        <HiCalendar className="w-4 h-4 mr-2" />
                        {payment.appointmentDate ? new Date(payment.appointmentDate).toLocaleDateString() : 'N/A'}
                      </div>
                      <div className="flex items-center">
                        <HiTag className="w-4 h-4 mr-2" />
                        {payment.department || 'N/A'}
                      </div>
                    </div>
                    
                    <div className="mt-2 text-xs text-gray-500">
                      <div className="flex items-center space-x-4">
                        <span>
                          <HiMail className="inline w-3 h-3 mr-1" />
                          {payment.patientEmail || 'N/A'}
                        </span>
                        <span>
                          <HiPhone className="inline w-3 h-3 mr-1" />
                          {payment.patientPhone || 'N/A'}
                        </span>
                        {payment.paidAt && (
                          <span>
                            Paid: {new Date(payment.paidAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleViewDetails(payment)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="View Details"
                    >
                      <HiEye className="w-4 h-4" />
                    </button>
                    {payment.status === 'paid' && (
                      <button
                        onClick={() => handleRefund(payment)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Process Refund"
                      >
                        <HiArrowLeft className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-6">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <HiArrowLeft className="w-4 h-4" />
            </button>
            
            <span className="px-3 py-2 text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <HiArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold text-gray-900">Payment Details</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <HiX className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Transaction ID</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedPayment.transactionId || selectedPayment._id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Amount</label>
                    <p className="mt-1 text-sm text-gray-900">₹{selectedPayment.amount || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedPayment.status)}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                    <div className="mt-1">{getMethodBadge(selectedPayment.method)}</div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Patient Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedPayment.patientName || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedPayment.patientEmail || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedPayment.patientPhone || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Patient ID</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedPayment.patientId || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Appointment Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Doctor</label>
                      <p className="mt-1 text-sm text-gray-900">Dr. {selectedPayment.doctorName || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Department</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedPayment.department || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Appointment Date</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedPayment.appointmentDate ? new Date(selectedPayment.appointmentDate).toLocaleString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {selectedPayment.refundReason && (
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Refund Information</h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Refund Reason</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedPayment.refundReason}</p>
                    </div>
                    {selectedPayment.refundedAt && (
                      <div className="mt-2">
                        <label className="block text-sm font-medium text-gray-700">Refunded At</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {new Date(selectedPayment.refundedAt).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedPayment.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedPayment.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
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

      {/* Refund Modal */}
      {showRefundModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold text-gray-900">Process Refund</h2>
                <button
                  onClick={() => setShowRefundModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <HiX className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Payment Details</h3>
                  <p className="text-sm text-gray-900">
                    <strong>Patient:</strong> {selectedPayment.patientName}<br/>
                    <strong>Amount:</strong> ₹{selectedPayment.amount}<br/>
                    <strong>Method:</strong> {selectedPayment.method}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Refund Amount</label>
                  <input
                    type="number"
                    value={refundData.amount}
                    onChange={(e) => setRefundData({ ...refundData, amount: parseFloat(e.target.value) })}
                    max={selectedPayment.amount}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Refund Method</label>
                  <select
                    value={refundData.method}
                    onChange={(e) => setRefundData({ ...refundData, method: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="original">Original Payment Method</option>
                    <option value="wallet">Patient Wallet</option>
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Refund Reason *</label>
                  <textarea
                    value={refundData.reason}
                    onChange={(e) => setRefundData({ ...refundData, reason: e.target.value })}
                    rows={3}
                    placeholder="Enter reason for refund..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowRefundModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={processingRefund}
                >
                  Cancel
                </button>
                <button
                  onClick={handleProcessRefund}
                  disabled={processingRefund || !refundData.reason || refundData.amount <= 0}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {processingRefund ? 'Processing...' : 'Process Refund'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
