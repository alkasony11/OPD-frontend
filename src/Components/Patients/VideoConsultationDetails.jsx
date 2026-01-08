import { useState } from 'react';
import { 
  HiVideoCamera, 
  HiClock, 
  HiShieldCheck, 
  HiDeviceMobile,
  HiWifi,
  HiCheckCircle,
  HiExclamation,
  HiInformationCircle,
  HiExternalLink
} from 'react-icons/hi';

export default function VideoConsultationDetails({ meetingLink, appointmentDate, appointmentTime, doctorName, patientName }) {
  const [showInstructions, setShowInstructions] = useState(false);

  if (!meetingLink) {
    return null;
  }

  const formatDateTime = (date, time) => {
    const appointmentDateTime = new Date(`${date}T${time}`);
    return {
      date: appointmentDateTime.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: appointmentDateTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    };
  };

  const { date, time } = formatDateTime(appointmentDate, appointmentTime);

  const handleJoinMeeting = () => {
    window.open(meetingLink.meetingUrl, '_blank', 'noopener,noreferrer');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // You could add a toast notification here
      console.log('Copied to clipboard:', text);
    });
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
            <HiVideoCamera className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-purple-900">Video Consultation</h3>
            <p className="text-sm text-purple-700">with Dr. {doctorName}</p>
          </div>
        </div>
        {meetingLink.doctorJoined ? (
          <button
            onClick={handleJoinMeeting}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            <HiExternalLink className="h-4 w-4" />
            <span>Join Meeting</span>
          </button>
        ) : (
          <div className="bg-gray-300 text-gray-600 px-4 py-2 rounded-lg font-medium flex items-center space-x-2">
            <HiClock className="h-4 w-4" />
            <span>Waiting for Doctor</span>
          </div>
        )}
      </div>

      {/* Doctor Join Status */}
      {!meetingLink.doctorJoined && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-start space-x-2">
            <HiInformationCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800 mb-1">Waiting for Doctor</h4>
              <p className="text-sm text-yellow-700">
                Your doctor has not joined the meeting yet. You will be able to join the video consultation once your doctor is ready. 
                You will receive a notification when the doctor joins the meeting.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Meeting Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-lg p-4 border border-purple-100">
          <div className="flex items-center space-x-2 mb-2">
            <HiClock className="h-4 w-4 text-purple-600" />
            <span className="font-medium text-gray-900">Scheduled Time</span>
          </div>
          <p className="text-sm text-gray-600">{date}</p>
          <p className="text-sm text-gray-600">{time}</p>
        </div>

        <div className="bg-white rounded-lg p-4 border border-purple-100">
          <div className="flex items-center space-x-2 mb-2">
            <HiShieldCheck className="h-4 w-4 text-purple-600" />
            <span className="font-medium text-gray-900">Meeting Security</span>
          </div>
          <p className="text-sm text-gray-600">End-to-end encrypted</p>
          <p className="text-sm text-gray-600">Password protected</p>
        </div>
      </div>

      {/* Meeting Information */}
      <div className="bg-white rounded-lg p-4 border border-purple-100 mb-4">
        <h4 className="font-medium text-gray-900 mb-3">Meeting Information</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Meeting ID:</span>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{meetingLink.meetingId}</span>
              <button
                onClick={() => copyToClipboard(meetingLink.meetingId)}
                className="text-purple-600 hover:text-purple-800 text-xs"
              >
                Copy
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Password:</span>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{meetingLink.meetingPassword}</span>
              <button
                onClick={() => copyToClipboard(meetingLink.meetingPassword)}
                className="text-purple-600 hover:text-purple-800 text-xs"
              >
                Copy
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Provider:</span>
            <span className="text-sm font-medium text-gray-900 capitalize">{meetingLink.provider}</span>
          </div>
        </div>
      </div>

      {/* Instructions Toggle */}
      <button
        onClick={() => setShowInstructions(!showInstructions)}
        className="w-full bg-white border border-purple-200 rounded-lg p-3 text-left hover:bg-purple-50 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <HiInformationCircle className="h-4 w-4 text-purple-600" />
            <span className="font-medium text-gray-900">Meeting Instructions</span>
          </div>
          <span className="text-purple-600 text-sm">
            {showInstructions ? 'Hide' : 'Show'} Details
          </span>
        </div>
      </button>

      {/* Detailed Instructions */}
      {showInstructions && (
        <div className="mt-4 space-y-4">
          {/* Pre-meeting Checklist */}
          <div className="bg-white rounded-lg p-4 border border-purple-100">
            <h5 className="font-medium text-gray-900 mb-3">Pre-Meeting Checklist</h5>
            <div className="space-y-2">
              {[
                'Test your camera and microphone',
                'Ensure stable internet connection (min 2 Mbps)',
                'Find a quiet, well-lit space',
                'Have your ID ready for verification',
                'Keep medical records and test results handy',
                'Close unnecessary applications for better performance'
              ].map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <HiCheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Technical Requirements */}
          <div className="bg-white rounded-lg p-4 border border-purple-100">
            <h5 className="font-medium text-gray-900 mb-3">Technical Requirements</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <HiWifi className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-gray-700">Stable internet (2+ Mbps)</span>
              </div>
              <div className="flex items-center space-x-2">
                <HiDeviceMobile className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-gray-700">Camera & microphone</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Compatible browsers: Chrome, Firefox, Safari, Edge
            </div>
          </div>

          {/* Important Notes */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <HiExclamation className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="font-medium text-yellow-800 mb-1">Important Notes</h5>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Join the meeting 5 minutes before your scheduled time</li>
                  <li>• The meeting link will be active 15 minutes before your appointment</li>
                  <li>• If you experience technical issues, contact support immediately</li>
                  <li>• The consultation will be recorded for medical records (with your consent)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Support Contact */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="font-medium text-gray-900 mb-2">Need Help?</h5>
            <div className="text-sm text-gray-600">
              <p>Contact our technical support team:</p>
              <p>Phone: +1-800-MEDIQ-01</p>
              <p>Email: support@mediq.com</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
