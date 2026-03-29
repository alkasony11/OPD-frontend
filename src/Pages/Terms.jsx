import { Link } from 'react-router-dom';
import { HiArrowLeft } from 'react-icons/hi';

export default function Terms() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-lg text-gray-600">OPD Management System</p>
        </div>

        {/* Back Button */}
        <div className="mb-6">
          <Link
            to="/register"
            className="inline-flex items-center px-4 py-2 bg-white text-gray-700 rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors duration-200"
          >
            <HiArrowLeft className="h-4 w-4 mr-2" />
            Back to Registration
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Legal Agreement</h2>
                <p className="text-blue-100 mt-1">Please read these terms carefully</p>
              </div>
              <div className="text-right">
                <p className="text-blue-100 text-sm">Last updated</p>
                <p className="text-white font-semibold">{new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
          
            <div className="space-y-8">
              {/* Introduction */}
              <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-r-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-blue-800">Important Notice</h3>
                    <p className="mt-1 text-blue-700">
                      By using our OPD Management System, you agree to be bound by these terms. Please read them carefully before proceeding.
                    </p>
                  </div>
                </div>
              </div>

              {/* Terms Sections */}
              <div className="space-y-8">
                <section className="border-b border-gray-200 pb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="bg-blue-100 text-blue-800 text-sm font-semibold mr-3 px-2.5 py-0.5 rounded-full">1</span>
                    Acceptance of Terms
                  </h2>
                  <p className="text-gray-700 leading-relaxed">
                    By accessing and using this OPD Management System, you accept and agree to be bound by the terms and provisions of this agreement. 
                    If you do not agree to abide by the above, please do not use this service.
                  </p>
                </section>

                <section className="border-b border-gray-200 pb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="bg-blue-100 text-blue-800 text-sm font-semibold mr-3 px-2.5 py-0.5 rounded-full">2</span>
                    Use License
                  </h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Permission is granted to temporarily use the OPD Management System for personal, non-commercial healthcare management purposes. 
                    This is the grant of a license, not a transfer of title.
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">What you can do:</h4>
                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                      <li>Schedule and manage medical appointments</li>
                      <li>Access your medical records and history</li>
                      <li>Communicate with healthcare providers</li>
                      <li>View and download medical documents</li>
                    </ul>
                  </div>
                </section>

                <section className="border-b border-gray-200 pb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="bg-red-100 text-red-800 text-sm font-semibold mr-3 px-2.5 py-0.5 rounded-full">3</span>
                    Medical Disclaimer
                  </h2>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800 font-medium mb-2">⚠️ Important Medical Notice</p>
                    <p className="text-gray-700 leading-relaxed">
                      The information provided through this system is for general informational purposes only and is not intended as medical advice. 
                      Always consult with qualified healthcare professionals for medical decisions. This system does not replace professional medical consultation.
                    </p>
                  </div>
                </section>

                <section className="border-b border-gray-200 pb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="bg-green-100 text-green-800 text-sm font-semibold mr-3 px-2.5 py-0.5 rounded-full">4</span>
                    User Responsibilities
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900">Account Security</h4>
                      <ul className="list-disc list-inside text-gray-700 space-y-1">
                        <li>Provide accurate and complete information</li>
                        <li>Maintain the confidentiality of your account</li>
                        <li>Use strong, unique passwords</li>
                        <li>Report any security concerns immediately</li>
                      </ul>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-semibold text-gray-900">Proper Usage</h4>
                      <ul className="list-disc list-inside text-gray-700 space-y-1">
                        <li>Use the system in compliance with applicable laws</li>
                        <li>Respect other users and healthcare providers</li>
                        <li>Keep your contact information updated</li>
                        <li>Follow appointment cancellation policies</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section className="border-b border-gray-200 pb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="bg-purple-100 text-purple-800 text-sm font-semibold mr-3 px-2.5 py-0.5 rounded-full">5</span>
                    Privacy and Data Protection
                  </h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    We are committed to protecting your privacy and personal information. Your medical data is encrypted and stored securely 
                    in compliance with healthcare data protection standards.
                  </p>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-purple-800 font-medium mb-2">🔒 Your Data is Protected</p>
                    <p className="text-gray-700">
                      Please review our <Link to="/privacy" className="text-purple-600 hover:text-purple-800 underline">Privacy Policy</Link> for detailed information 
                      about how we collect, use, and protect your data.
                    </p>
                  </div>
                </section>

                <section className="border-b border-gray-200 pb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="bg-yellow-100 text-yellow-800 text-sm font-semibold mr-3 px-2.5 py-0.5 rounded-full">6</span>
                    Limitation of Liability
                  </h2>
                  <p className="text-gray-700 leading-relaxed">
                    In no event shall the OPD Management System or its suppliers be liable for any damages arising out of the use or inability to use the materials on this system. 
                    This includes but is not limited to direct, indirect, incidental, or consequential damages.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                    <span className="bg-gray-100 text-gray-800 text-sm font-semibold mr-3 px-2.5 py-0.5 rounded-full">7</span>
                    Contact Information
                  </h2>
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <p className="text-gray-700 mb-4">
                      If you have any questions about these Terms of Service, please contact us:
                    </p>
                    <div className="space-y-2">
                      <p className="text-gray-700"><strong>Email:</strong> support@mediq.com</p>
                      <p className="text-gray-700"><strong>Phone:</strong> +1 (555) 123-4567</p>
                      <p className="text-gray-700"><strong>Address:</strong> 123 Healthcare St, Medical City, MC 12345</p>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
