import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../App';

export default function HeroSection() {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  
  // Safety check for context
  if (!authContext) {
    console.warn('AuthContext is not available in HeroSection');
    return null;
  }
  
  const { isLoggedIn, setRedirectPath } = authContext;

  const handleBookAppointment = () => {
    if (!isLoggedIn) {
      setRedirectPath('/booking');
      navigate('/login');
    } else {
      navigate('/booking');
    }
  };

  const handleLearnMore = () => {
    if (!isLoggedIn) {
      setRedirectPath('/#about');
      navigate('/login');
    } else {
      // Scroll to about section if already on home page
      const aboutSection = document.getElementById('about');
      if (aboutSection) {
        aboutSection.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate('/#about');
      }
    }
  };

  return (
    <section className="bg-white py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="mb-6">
              <span className="inline-block px-4 py-2 bg-gray-100 text-gray-800 text-sm font-medium rounded-full">
                Next-Generation Healthcare
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-black leading-tight mb-8">
              Smarter OPD Booking 
              <span className="text-gray-600"> Starts Here</span>
            </h1>
            <p className="text-xl text-gray-600 mb-10 leading-relaxed max-w-lg">
             MediQ provides a comprehensive platform enabling a digital token management system for the patient.The OPD Token Management
System aims to digitize appointment booking, reduce wait queues, and provide transparency in bookings to optimize doctors’ time.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                className="bg-black text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-800 transition-colors duration-200"
                onClick={handleBookAppointment}
              >
                Book Appointment
              </button>
              <button 
                onClick={handleLearnMore}
                className="border-2 border-gray-300 text-black px-8 py-4 rounded-lg font-semibold text-lg hover:border-black transition-colors duration-200"
              >
                Learn More
              </button>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              <div className="absolute inset-0 bg-gray-100 rounded-3xl transform rotate-6"></div>
              <img
                src="https://images.unsplash.com/photo-1638202993928-7267aad84c31?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="Doctor with tablet managing patient appointments"
                className="relative w-full max-w-lg h-auto rounded-3xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 