import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  HiVideoCamera, 
  HiClock, 
  HiShieldCheck, 
  HiUserGroup, 
  HiDeviceMobile,
  HiWifi,
  HiCheckCircle,
  HiArrowRight
} from 'react-icons/hi';

export default function VideoConsultationSection() {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const features = [
    {
      icon: <HiClock className="h-6 w-6" />,
      title: "24/7 Availability",
      description: "Consult with doctors anytime, anywhere with our round-the-clock video consultation service."
    },
    {
      icon: <HiShieldCheck className="h-6 w-6" />,
      title: "Secure & Private",
      description: "End-to-end encrypted video calls ensure your medical consultations remain completely confidential."
    },
    {
      icon: <HiUserGroup className="h-6 w-6" />,
      title: "Expert Doctors",
      description: "Connect with qualified specialists across various medical fields for comprehensive care."
    },
    {
      icon: <HiDeviceMobile className="h-6 w-6" />,
      title: "Easy Access",
      description: "No app downloads required. Join consultations directly from your browser on any device."
    }
  ];

  const benefits = [
    "No travel time or waiting rooms",
    "Prescriptions delivered digitally",
    "Follow-up consultations included",
    "Medical records automatically updated",
    "Insurance coverage available"
  ];

  const handleBookVideoConsultation = () => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
      // Redirect to login page if not logged in
      navigate('/login');
      return;
    }
    
    // Navigate to booking page with video consultation flag
    navigate('/booking?type=video');
  };

  return (
    <section id="video-consultation" className="py-24 bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="mb-6">
            <span className="inline-block px-4 py-2 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
              Video Consultation
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-black mb-6">
            Healthcare from the 
            <span className="text-purple-600"> Comfort of Your Home</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Experience professional medical consultations through secure video calls. Get expert medical advice, prescriptions, and follow-up care without leaving your home.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
          {/* Left Side - Features */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-8">Why Choose Video Consultation?</h3>
            <div className="space-y-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h4>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - CTA Card */}
          <div className="relative">
            <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <HiVideoCamera className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Start?</h3>
                <p className="text-gray-600 mb-6">
                  Book your video consultation now and get professional medical care from the comfort of your home.
                </p>
              </div>

              {/* Benefits List */}
              <div className="mb-8">
                <h4 className="font-semibold text-gray-900 mb-4">What's Included:</h4>
                <div className="space-y-3">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <HiCheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={handleBookVideoConsultation}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center justify-center space-x-2"
              >
                <span>Book Video Consultation</span>
                <HiArrowRight className={`h-5 w-5 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} />
              </button>

              <p className="text-center text-sm text-gray-500 mt-4">
                Starting from ₹299 • No hidden fees
              </p>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-purple-200 rounded-full opacity-20"></div>
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-blue-200 rounded-full opacity-20"></div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">How Video Consultation Works</h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Simple steps to get the medical care you need through our secure video platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-purple-600">1</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">Book Appointment</h4>
              <p className="text-gray-600">
                Select your preferred doctor and time slot. Choose video consultation as your appointment type.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">Join Video Call</h4>
              <p className="text-gray-600">
                Receive a secure link via email/SMS. Click to join the video consultation at your scheduled time.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-green-600">3</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">Get Treatment</h4>
              <p className="text-gray-600">
                Consult with your doctor, receive prescriptions, and get medical advice. Follow-up care included.
              </p>
            </div>
          </div>
        </div>

        {/* Technical Requirements */}
        <div className="mt-16 bg-gray-50 rounded-2xl p-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Technical Requirements</h3>
            <p className="text-gray-600">Ensure you have the following for the best consultation experience</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <HiWifi className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Stable Internet Connection</h4>
                <p className="text-gray-600 text-sm">Minimum 2 Mbps for HD video quality</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <HiDeviceMobile className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Device with Camera & Microphone</h4>
                <p className="text-gray-600 text-sm">Smartphone, tablet, or computer</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
