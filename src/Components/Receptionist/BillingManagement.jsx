import { useState, useEffect } from 'react';
import { HiCash, HiCheckCircle, HiClock, HiExclamation, HiRefresh } from 'react-icons/hi';
import { API_CONFIG } from '../../config/urls';

export default function BillingManagement() {
  const [billingData, setBillingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentStatus, setPaymentStatus] = useState('pending');

  useEffect(() => {
    fetchBillingData();
  }, [selectedDate, paymentStatus]);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        date: selectedDate,
        status: paymentStatus
      });

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/receptionist/billing/appointments?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch billing data');
      }

      const data = await response.json();
      setBillingData(data);
    } catch (error) {
      console.error('Error fetching billing data:', error);
      setError('Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentStatus = async (appointmentId, newStatus, paymentMethod, paidAmount) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/receptionist/billing/appointments/${appointmentId}/payment`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentStatus: newStatus,
          paymentMethod: paymentMethod,
          paidAmount: paidAmount
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update payment status');
      }

      // Refresh billing data
      fetchBillingData();
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Failed to update payment status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'partial':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'refunded':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <HiClock className="h-4 w-4" />;
      case 'paid':
        return <HiCheckCircle className="h-4 w-4" />;
      case 'partial':
        return <HiExclamation className="h-4 w-4" />;
      case 'refunded':
        return <HiExclamation className="h-4 w-4" />;
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

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={fetchBillingData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <HiCash className="h-6 w-6 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-900">Billing Management</h2>
          </div>
          <button
            onClick={fetchBillingData}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <HiRefresh className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="p-6 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="refunded">Refunded</option>
              <option value="all">All</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary */}
      {billingData?.summary && (
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{billingData.summary.totalPending}</div>
              <div className="text-sm text-yellow-600">Pending Payments</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{billingData.summary.totalPaid}</div>
              <div className="text-sm text-green-600">Paid</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(billingData.summary.totalRevenue)}</div>
              <div className="text-sm text-blue-600">Total Revenue</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{billingData.summary.totalAppointments}</div>
              <div className="text-sm text-gray-600">Total Appointments</div>
            </div>
          </div>
        </div>
      )}

      {/* Billing List */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointments</h3>
        {billingData?.appointments?.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No appointments found for the selected criteria
          </div>
        ) : (
          <div className="space-y-4">
            {billingData?.appointments?.map((appointment) => (
              <div
                key={appointment._id}
                className={`border rounded-lg p-4 ${getStatusColor(appointment.paymentStatus)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(appointment.paymentStatus)}
                    <div>
                      <div className="font-medium">{appointment.patientName}</div>
                      <div className="text-sm opacity-75">
                        {appointment.doctorName} • {appointment.department}
                      </div>
                      <div className="text-sm opacity-75">
                        {new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.timeSlot}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(appointment.consultationFee)}</div>
                    <div className="text-sm opacity-75">
                      Token: {appointment.tokenNumber}
                    </div>
                    {appointment.paidAmount > 0 && (
                      <div className="text-sm opacity-75">
                        Paid: {formatCurrency(appointment.paidAmount)}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium capitalize">
                      {appointment.paymentStatus}
                    </span>
                    {appointment.paymentStatus === 'pending' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            const amount = prompt('Enter paid amount:', appointment.consultationFee);
                            const method = prompt('Payment method (cash/card/upi):', 'cash');
                            if (amount && method) {
                              updatePaymentStatus(appointment._id, 'paid', method, parseFloat(amount));
                            }
                          }}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                        >
                          Mark Paid
                        </button>
                        <button
                          onClick={() => {
                            const amount = prompt('Enter partial amount:', appointment.consultationFee / 2);
                            const method = prompt('Payment method (cash/card/upi):', 'cash');
                            if (amount && method) {
                              updatePaymentStatus(appointment._id, 'partial', method, parseFloat(amount));
                            }
                          }}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                        >
                          Partial
                        </button>
                      </div>
                    )}
                    {appointment.paymentStatus === 'partial' && (
                      <button
                        onClick={() => {
                          const remaining = appointment.consultationFee - appointment.paidAmount;
                          const amount = prompt('Enter additional amount:', remaining);
                          const method = prompt('Payment method (cash/card/upi):', 'cash');
                          if (amount && method) {
                            const newTotal = appointment.paidAmount + parseFloat(amount);
                            const newStatus = newTotal >= appointment.consultationFee ? 'paid' : 'partial';
                            updatePaymentStatus(appointment._id, newStatus, method, newTotal);
                          }
                        }}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                      >
                        Add Payment
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
