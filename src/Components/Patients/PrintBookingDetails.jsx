import React from 'react';
import { PrinterIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { API_CONFIG } from '../../config/urls';

const PrintBookingDetails = ({ bookingData, user, onPrint }) => {
  const handlePrint = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    // Get current date and time for the print
    const currentDate = new Date().toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const currentTime = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });

    // Create the print content
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Appointment Confirmation - MediQ Hospital</title>
        <style>
          @media print {
            @page {
              margin: 0.5in;
              size: A4;
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              background: white;
            }
            .no-print {
              display: none !important;
            }
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: white;
            margin: 0;
            padding: 20px;
          }
          
          .header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          
          .hospital-name {
            font-size: 28px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 5px;
          }
          
          .hospital-tagline {
            font-size: 14px;
            color: #666;
            margin-bottom: 10px;
          }
          
          .document-title {
            font-size: 20px;
            font-weight: bold;
            color: #059669;
            margin-top: 15px;
          }
          
          .appointment-details {
            background: #f8fafc;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            padding: 25px;
            margin: 20px 0;
          }
          
          .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #e2e8f0;
          }
          
          .detail-row:last-child {
            border-bottom: none;
          }
          
          .detail-label {
            font-weight: 600;
            color: #374151;
            font-size: 14px;
            min-width: 120px;
          }
          
          .detail-value {
            font-weight: 500;
            color: #111827;
            font-size: 14px;
            text-align: right;
            flex: 1;
          }
          
          .token-highlight {
            background: #dbeafe;
            color: #1e40af;
            padding: 8px 12px;
            border-radius: 6px;
            font-weight: bold;
            font-size: 16px;
          }
          
          .important-notice {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
          }
          
          .notice-title {
            font-weight: bold;
            color: #92400e;
            margin-bottom: 8px;
            font-size: 14px;
          }
          
          .notice-text {
            color: #92400e;
            font-size: 13px;
            line-height: 1.5;
          }
          
          .contact-info {
            background: #f0f9ff;
            border: 1px solid #0ea5e9;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
          }
          
          .contact-title {
            font-weight: bold;
            color: #0c4a6e;
            margin-bottom: 8px;
            font-size: 14px;
          }
          
          .contact-text {
            color: #0c4a6e;
            font-size: 13px;
            line-height: 1.5;
          }
          
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #6b7280;
            font-size: 12px;
          }
          
          .print-date {
            text-align: right;
            color: #6b7280;
            font-size: 12px;
            margin-bottom: 20px;
          }
          
          .qr-placeholder {
            width: 80px;
            height: 80px;
            background: #f3f4f6;
            border: 2px dashed #d1d5db;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 10px auto;
            border-radius: 8px;
          }
        </style>
      </head>
      <body>
        <div class="print-date">
          Printed on: ${currentDate} at ${currentTime}
        </div>
        
        <div class="header">
          <div class="hospital-name">🏥 MediQ Hospital</div>
          <div class="hospital-tagline">Your Health, Our Priority</div>
          <div class="document-title">APPOINTMENT CONFIRMATION</div>
        </div>
        
        <div class="appointment-details">
          <div class="detail-row">
            <span class="detail-label">Token Number:</span>
            <span class="detail-value">
              <span class="token-highlight">#${bookingData.tokenNumber}</span>
            </span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Patient Name:</span>
            <span class="detail-value">${bookingData.familyMemberName || user?.name || 'N/A'}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Doctor:</span>
            <span class="detail-value">Dr. ${bookingData.doctorName}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Department:</span>
            <span class="detail-value">${bookingData.departmentName}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Appointment Date:</span>
            <span class="detail-value">${new Date(bookingData.appointmentDate).toLocaleDateString('en-IN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Appointment Time:</span>
            <span class="detail-value">${bookingData.appointmentTime}</span>
          </div>
          
          ${bookingData.estimatedWaitTime ? `
          <div class="detail-row">
            <span class="detail-label">Estimated Wait:</span>
            <span class="detail-value">${bookingData.estimatedWaitTime} minutes</span>
          </div>
          ` : ''}
          
          ${bookingData.symptoms ? `
          <div class="detail-row">
            <span class="detail-label">Symptoms:</span>
            <span class="detail-value">${bookingData.symptoms}</span>
          </div>
          ` : ''}
          
          <div class="detail-row">
            <span class="detail-label">Status:</span>
            <span class="detail-value" style="color: #059669; font-weight: bold;">CONFIRMED</span>
          </div>
        </div>
        
        <div class="important-notice">
          <div class="notice-title">📋 Important Instructions:</div>
          <div class="notice-text">
            • Please arrive 15 minutes before your scheduled appointment time<br>
            • Bring a valid government-issued ID and any relevant medical documents<br>
            • If you need to reschedule or cancel, please contact us at least 2 hours in advance<br>
            • We'll send you a reminder 24 hours before your appointment<br>
            • Please wear a mask and follow all safety protocols
          </div>
        </div>
        
        <div class="contact-info">
          <div class="contact-title">📞 Contact Information:</div>
          <div class="contact-text">
            <strong>Reception:</strong> +91-9876543210<br>
            <strong>Emergency:</strong> +91-8589062432 or +91-9061493022<br>
            <strong>Website:</strong> ${FRONTEND_CONFIG.BASE_URL}<br>
            <strong>Address:</strong> 123 Medical Street, Health City, PIN - 123456
          </div>
        </div>
        
        <div class="qr-placeholder">
          <div style="text-align: center; color: #9ca3af; font-size: 10px;">
            QR Code<br>
            (Token: #${bookingData.tokenNumber})
          </div>
        </div>
        
        <div class="footer">
          <p>This is a computer-generated document. No signature required.</p>
          <p>&copy; 2024 MediQ Hospital. All rights reserved.</p>
          <p>For any queries, please contact our reception desk.</p>
        </div>
      </body>
      </html>
    `;

    // Write content to the new window
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load, then print
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    };

    // Call the onPrint callback if provided
    if (onPrint) {
      onPrint();
    }
  };

  return (
    <button
      onClick={handlePrint}
      className="inline-flex items-center px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors"
    >
      <PrinterIcon className="h-4 w-4 mr-2" />
      Print Details
    </button>
  );
};

export default PrintBookingDetails;
