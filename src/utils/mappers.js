export function mapAdminAppointment(row) {
  if (!row) return null;
  return {
    id: row.id || row._id,
    patientName: row.patientName || row.patient_name || 'Unknown',
    doctor: row.doctor || row.doctorName || 'Unknown',
    department: row.department || 'Unknown',
    date: row.date || row.appointmentDate || row.booking_date || null,
    time: row.time || row.appointmentTime || row.time_slot || '',
    status: row.status || 'booked',
    tokenNumber: row.tokenNumber || row.token_number || '',
    patientPhone: row.patientPhone || '',
    patientEmail: row.patientEmail || ''
  };
}


