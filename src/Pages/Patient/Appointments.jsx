import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { HiArrowLeft, HiCalendar, HiClock, HiTag, HiX, HiPencil, HiUser, HiDocumentText, HiClipboardList, HiCash, HiCheckCircle, HiExclamationCircle, HiVideoCamera, HiExternalLink } from 'react-icons/hi';

export default function Appointments() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('upcoming'); // upcoming | past | all
  const [selectedFamilyMember, setSelectedFamilyMember] = useState('all'); // all | family member id
  const [rescheduling, setRescheduling] = useState(null); // appointment being rescheduled
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlots, setRescheduleSlots] = useState([]);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [refundMethod, setRefundMethod] = useState('wallet');
  const [cancelling, setCancelling] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchAppointments();
    fetchFamilyMembers();
    fetchUserData();
  }, []);

  useEffect(() => {
    applyFilter(filter);
  }, [appointments, filter, selectedFamilyMember]);

  const fetchAppointments = async (overrideFamilyMemberId) => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      const memberId = overrideFamilyMemberId ?? selectedFamilyMember;
      if (memberId && memberId !== 'all') {
        params.append('familyMemberId', memberId);
      }
      
      const response = await axios.get(`http://localhost:5001/api/patient/appointments?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAppointments(response.data.appointments || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/api/patient/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data.user);
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Fallback to localStorage data
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      setUser(userData);
    }
  };

  const fetchFamilyMembers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/api/patient/family-members', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const members = (response.data.familyMembers || []).map(m => ({
        id: m.id || m._id || m.id,
        name: m.name,
        relation: m.relation,
        patientId: m.patientId
      }));
      
      // Add self as first option if not already present
      // Use logged-in user's name for self
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const selfMember = {
        id: 'self',
        name: user?.name || 'Me',
        relation: 'self',
        patientId: user?.patientId || 'P001'
      };
      
      // Filter out any existing 'self' members to avoid duplicates
      const filteredMembers = members.filter(member => member.relation !== 'self');
      setFamilyMembers([selfMember, ...filteredMembers]);
    } catch (err) {
      console.error('Failed to load family members:', err);
      // Set fallback self member
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      setFamilyMembers([{ id: 'self', name: user?.name || 'Me', relation: 'self', patientId: user?.patientId || 'P001' }]);
    }
  };

  const applyFilter = (type) => {
    if (!appointments || appointments.length === 0) {
      setFiltered([]);
      return;
    }

    const now = new Date();
    let list = appointments; // already filtered by family member via API

    // Then filter by time
    list = list.filter((apt) => {
      const aptDate = new Date(apt.appointmentDate);
      const isUpcoming = aptDate >= new Date(now.toDateString());
      if (type === 'upcoming') return isUpcoming;
      if (type === 'past') return !isUpcoming;
      return true;
    });

    setFiltered(list);
  };

  const openCancelModal = (apt) => {
    setShowCancelModal(apt);
    setCancelReason('');
    setRefundMethod('wallet');
  };

  const cancelAppointment = async () => {
    if (!showCancelModal) return;
    
    setCancelling(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5001/api/patient/appointments/${showCancelModal.id}/cancel`, 
        { 
          reason: cancelReason || 'Cancelled by patient',
          refundMethod: refundMethod
        }, 
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      await fetchAppointments();
      
      // Show success message with refund details
      let message = 'Appointment cancelled successfully!';
      if (response.data.refund?.eligible) {
        message += `\n\nRefund: ${response.data.refund.message}`;
      } else if (response.data.refund?.reason) {
        message += `\n\nNote: ${response.data.refund.reason}`;
      }
      
      alert(message);
      setShowCancelModal(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel appointment');
    } finally {
      setCancelling(false);
    }
  };

  const openReschedule = async (apt) => {
    navigate(`/booking?reschedule=${apt.id}`);
  };

  const loadSlots = async () => {
    if (!rescheduling || !rescheduleDate) return;
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`http://localhost:5001/api/patient/doctors/${rescheduling.doctorId}/availability/${rescheduleDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRescheduleSlots(data.slots || []);
    } catch (err) {
      setRescheduleSlots([]);
    }
  };

  const submitReschedule = async (slotTime) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5001/api/patient/appointments/${rescheduling.id}/reschedule`, {
        doctorId: rescheduling.doctorId,
        newDate: rescheduleDate,
        newTime: slotTime
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRescheduling(null);
      setRescheduleDate('');
      setRescheduleSlots([]);
      await fetchAppointments();
      alert('Appointment rescheduled');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reschedule');
    }
  };

  const handleFamilyMemberChange = (memberId) => {
    setSelectedFamilyMember(memberId);
    fetchAppointments(memberId);
  };

  const formatDate = (date) => new Date(date).toLocaleDateString(undefined, {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'booked': return 'bg-blue-100 text-blue-800';
      case 'in_queue': return 'bg-yellow-100 text-yellow-800';
      case 'consulted': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'missed': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'refunded': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
              <p className="text-gray-600 mt-1">View and track your bookings</p>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <HiArrowLeft className="h-5 w-5" />
              <span>Back</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Time Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Time:</span>
            {['upcoming', 'past', 'all'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-lg border text-sm font-medium transition-colors ${
                    filter === f ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {f[0].toUpperCase() + f.slice(1)}
              </button>
            ))}
            </div>

            {/* Family Member Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Patient:</span>
              <select
                value={selectedFamilyMember}
                onChange={(e) => handleFamilyMemberChange(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Family Members</option>
                {familyMembers.map((member, index) => (
                  <option key={member.id || `member-${index}`} value={member.id || 'self'}>
                    {member.name} ({member.relation})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading appointments...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <HiCalendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No appointments found</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filtered.map((apt) => (
                <div key={apt.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 bg-white">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{apt.doctorName}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(apt.status)}`}>
                          {apt.status.charAt(0).toUpperCase() + apt.status.slice(1).replace('_', ' ')}
                        </span>
                        {apt.appointmentType === 'video' && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Video Consultation</span>
                        )}
                      </div>
                      <p className="text-gray-600 font-medium">{apt.departmentName}</p>
                      {apt.isFamilyMember && (
                        <div className="flex items-center gap-2 mt-1">
                          {(user?.profilePhoto || user?.profile_photo) ? (
                            <img
                              src={(user.profilePhoto || user.profile_photo).startsWith('http') 
                                ? (user.profilePhoto || user.profile_photo)
                                : `http://localhost:5001${user.profilePhoto || user.profile_photo}`
                              }
                              alt="Profile"
                              className="h-4 w-4 rounded-full object-cover border border-white shadow-sm"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'block';
                              }}
                            />
                          ) : null}
                          <HiUser className={`h-4 w-4 text-blue-500 ${(user?.profilePhoto || user?.profile_photo) ? 'hidden' : 'block'}`} />
                          <span className="text-sm text-blue-600">
                            For: {apt.patientName} ({apt.familyMemberRelation})
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Payment Status */}
                    <div className="text-right">
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(apt.paymentStatus)}`}>
                        <HiCash className="h-3 w-3 inline mr-1" />
                        {apt.paymentStatus.charAt(0).toUpperCase() + apt.paymentStatus.slice(1)}
                      </div>
                    </div>
                  </div>

                  {/* Appointment Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <HiCalendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="font-medium text-gray-900">{formatDate(apt.appointmentDate)}</div>
                        <div className="text-gray-600">{apt.appointmentTime}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <HiClock className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="font-medium text-gray-900">{apt.sessionType.charAt(0).toUpperCase() + apt.sessionType.slice(1)} Session</div>
                        <div className="text-gray-600">{apt.sessionTimeRange}</div>
                    </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <HiTag className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="font-medium text-gray-900">Token #{apt.tokenNumber}</div>
                        <div className="text-gray-600">Wait: {apt.estimatedWaitTime} mins</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <HiDocumentText className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="font-medium text-gray-900">Patient ID</div>
                        <div className="text-gray-600">{apt.patientCode || 'N/A'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Video Consultation Join Button */}
                  {(apt.meetingLink) && (
                    <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <HiVideoCamera className="h-4 w-4 text-purple-600" />
                          <span className="text-sm font-medium text-purple-900">Video Consultation</span>
                        </div>
                        <button
                          onClick={() => window.open(apt.meetingLink.meetingUrl, '_blank', 'noopener,noreferrer')}
                          className="px-3 py-1.5 bg-purple-600 text-white text-xs rounded-md hover:bg-purple-700 flex items-center gap-1"
                        >
                          <HiExternalLink className="h-3 w-3" />
                          Join Meeting
                        </button>
                      </div>
                      <div className="mt-2 text-xs text-purple-700">
                        ID: <span className="font-mono">{apt.meetingLink.meetingId}</span>
                        {apt.meetingLink.meetingPassword && (
                          <>
                            <span className="mx-2">•</span>
                            Password: <span className="font-mono">{apt.meetingLink.meetingPassword}</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Symptoms */}
                  {apt.symptoms && apt.symptoms !== 'Not provided' && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <HiDocumentText className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Symptoms</span>
                      </div>
                      <p className="text-sm text-gray-600">{apt.symptoms}</p>
                    </div>
                  )}

                  {/* Cancellation Details for Cancelled Appointments */}
                  {apt.status === 'cancelled' && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <HiX className="h-5 w-5 text-red-600" />
                        <span className="font-medium text-red-800">Appointment Cancelled</span>
                      </div>
                      
                      <div className="text-sm text-red-700 space-y-2">
                        <p><span className="font-medium">Cancelled on:</span> {new Date(apt.cancelled_at).toLocaleDateString()}</p>
                        <p><span className="font-medium">Reason:</span> {apt.cancellationReason || 'No reason provided'}</p>
                        
                        {apt.refund_status && apt.refund_status !== 'none' && (
                          <div className="mt-3 p-3 bg-white rounded border border-red-200">
                            <div className="flex items-center gap-2 mb-2">
                              <HiCash className="h-4 w-4 text-green-600" />
                              <span className="font-medium text-green-700">Refund Information</span>
                            </div>
                            <div className="text-sm text-green-600 space-y-1">
                              <p><span className="font-medium">Amount:</span> ₹{apt.refund_amount}</p>
                              <p><span className="font-medium">Method:</span> {apt.refund_method}</p>
                              <p><span className="font-medium">Status:</span> 
                                <span className={`ml-1 px-2 py-1 rounded text-xs ${
                                  apt.refund_status === 'processed' ? 'bg-green-100 text-green-800' :
                                  apt.refund_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  apt.refund_status === 'failed' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {apt.refund_status}
                                </span>
                              </p>
                              {apt.refund_reference && (
                                <p><span className="font-medium">Reference:</span> {apt.refund_reference}</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Consultation Details for Completed Appointments */}
                  {apt.status === 'consulted' && (apt.consultationNotes || apt.diagnosis || apt.prescriptions?.length > 0) && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <HiCheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-800">Consultation Details</span>
                      </div>
                      
                      {apt.diagnosis && (
                        <div className="mb-3">
                          <span className="text-sm font-medium text-green-700">Diagnosis: </span>
                          <span className="text-sm text-green-600">{apt.diagnosis}</span>
                        </div>
                      )}
                      
                      {apt.consultationNotes && (
                        <div className="mb-3">
                          <span className="text-sm font-medium text-green-700">Notes: </span>
                          <span className="text-sm text-green-600">{apt.consultationNotes}</span>
                        </div>
                      )}
                      
                      {apt.prescriptions?.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <HiClipboardList className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-700">Prescriptions</span>
                          </div>
                          <div className="space-y-2">
                            {apt.prescriptions.map((prescription, index) => (
                              <div key={index} className="text-sm text-green-600 bg-white p-2 rounded border">
                                <div className="font-medium">{prescription.medication_name}</div>
                                <div>{prescription.dosage} - {prescription.frequency} for {prescription.duration}</div>
                                {prescription.instructions && (
                                  <div className="text-xs text-gray-500 mt-1">{prescription.instructions}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
                    {apt.status === 'booked' && (
                      <>
                        <button 
                          onClick={() => openCancelModal(apt)} 
                          className="px-4 py-2 text-sm rounded-lg border border-red-300 text-red-700 hover:bg-red-50 flex items-center gap-2 transition-colors"
                        >
                          <HiX className="h-4 w-4" /> Cancel
                        </button>
                        <button 
                          onClick={() => openReschedule(apt)} 
                          className="px-4 py-2 text-sm rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-50 flex items-center gap-2 transition-colors"
                        >
                          <HiPencil className="h-4 w-4" /> Reschedule
                        </button>
                      </>
                    )}
                    
                    {apt.status === 'consulted' && apt.prescriptions?.length > 0 && (
                      <button 
                        onClick={() => setShowPrescriptionModal(apt)} 
                        className="px-4 py-2 text-sm rounded-lg border border-green-300 text-green-700 hover:bg-green-50 flex items-center gap-2 transition-colors"
                      >
                        <HiClipboardList className="h-4 w-4" /> View Prescription
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reschedule Modal */}
      {rescheduling && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Reschedule Appointment</h3>
              <button onClick={() => { setRescheduling(null); setRescheduleDate(''); setRescheduleSlots([]); }} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Date</label>
                <input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                <button onClick={loadSlots} disabled={!rescheduleDate} className="mt-2 px-3 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">Load Slots</button>
              </div>
              <div>
                {rescheduleSlots.length === 0 ? (
                  <p className="text-sm text-gray-600">Select a date and click Load Slots.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 max-h-56 overflow-auto">
                    {rescheduleSlots.map((s) => (
                      <button key={s.time} onClick={() => submitReschedule(s.time)} className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">
                        {s.displayTime || s.time}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prescription Modal */}
      {showPrescriptionModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Prescription Details</h3>
              <button 
                onClick={() => setShowPrescriptionModal(null)} 
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Doctor: {showPrescriptionModal.doctorName}</h4>
                <p className="text-sm text-gray-600">Department: {showPrescriptionModal.departmentName}</p>
                <p className="text-sm text-gray-600">Date: {formatDate(showPrescriptionModal.appointmentDate)}</p>
              </div>
              
              {showPrescriptionModal.diagnosis && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Diagnosis</h4>
                  <p className="text-blue-800">{showPrescriptionModal.diagnosis}</p>
                </div>
              )}
              
              {showPrescriptionModal.consultationNotes && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">Doctor's Notes</h4>
                  <p className="text-yellow-800">{showPrescriptionModal.consultationNotes}</p>
                </div>
              )}
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-4">Prescribed Medications</h4>
                <div className="space-y-3">
                  {showPrescriptionModal.prescriptions.map((prescription, index) => (
                    <div key={index} className="bg-white p-4 rounded border border-green-200">
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-medium text-gray-900">{prescription.medication_name}</h5>
                        <span className="text-xs text-gray-500">
                          {new Date(prescription.prescribed_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Dosage:</span>
                          <span className="ml-1 font-medium">{prescription.dosage}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Frequency:</span>
                          <span className="ml-1 font-medium">{prescription.frequency}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Duration:</span>
                          <span className="ml-1 font-medium">{prescription.duration}</span>
                        </div>
                      </div>
                      {prescription.instructions && (
                        <div className="mt-2 text-sm">
                          <span className="text-gray-600">Instructions:</span>
                          <p className="text-gray-800 mt-1">{prescription.instructions}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Cancel Appointment</h3>
              <button 
                onClick={() => setShowCancelModal(null)} 
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Appointment Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Appointment Details</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><span className="font-medium">Doctor:</span> {showCancelModal.doctorName}</p>
                  <p><span className="font-medium">Department:</span> {showCancelModal.departmentName}</p>
                  <p><span className="font-medium">Date:</span> {formatDate(showCancelModal.appointmentDate)}</p>
                  <p><span className="font-medium">Time:</span> {showCancelModal.appointmentTime}</p>
                  <p><span className="font-medium">Patient:</span> {showCancelModal.patientName}</p>
                </div>
              </div>

              {/* Cancellation Policy */}
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <HiExclamationCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800 mb-2">Cancellation Policy</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• <strong>Before consultation starts:</strong> Full refund available</li>
                      <li>• <strong>During or after consultation:</strong> No refund</li>
                      <li>• Refunds are processed within 3-5 business days</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Cancellation Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Cancellation (Optional)
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please let us know why you're cancelling..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  rows={3}
                />
              </div>

              {/* Refund Method (if payment was made) */}
              {showCancelModal.paymentStatus === 'paid' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Refund Method
                  </label>
                  <select
                    value={refundMethod}
                    onChange={(e) => setRefundMethod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="wallet">Wallet Balance</option>
                    <option value="upi">UPI</option>
                    <option value="card">Credit/Debit Card</option>
                    <option value="cash">Cash (Manual Processing)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Refund will be processed based on your original payment method
                  </p>
                </div>
              )}

              {/* Confirmation Message */}
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <HiExclamationCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-800 mb-1">Are you sure?</h4>
                    <p className="text-sm text-red-700">
                      This action cannot be undone. Your appointment will be cancelled and the slot will be made available for other patients.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowCancelModal(null)}
                  className="flex-1 px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={cancelling}
                >
                  Keep Appointment
                </button>
                <button
                  onClick={cancelAppointment}
                  disabled={cancelling}
                  className="flex-1 px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {cancelling ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <HiX className="h-4 w-4" />
                      Cancel Appointment
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

