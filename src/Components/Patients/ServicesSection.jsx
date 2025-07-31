
import { 
  HiClock, 
  HiChatAlt2, 
  HiCreditCard, 
  HiCalendar, 
  HiUsers, 
  HiSparkles 
} from 'react-icons/hi';

const features = [
  {
    icon: <HiUsers className="h-8 w-8" />,
    title: "Digital Queue Management",
    description: "Skip physical queues with our smart token system. Get real-time updates on your position and estimated wait time.",
    image: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
  },
  {
    icon: <HiSparkles className="h-8 w-8" />,
    title: "Appointment Scheduling",
    description: "Book appointments with your preferred doctors instantly. View available slots and choose convenient time slots.",
    image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
  },
  {
    icon: <HiChatAlt2 className="h-8 w-8" />,
    title: "Patient Communication",
    description: "Receive appointment confirmations, reminders, and health updates directly on your mobile device.",
    image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
  },
  {
    icon: <HiCreditCard className="h-8 w-8" />,
    title: "Digital Health Records",
    description: "Access your complete medical history, prescriptions, and test reports securely from anywhere.",
    image: "https://images.unsplash.com/photo-1551601651-2a8555f1a136?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
  },
  {
    icon: <HiCalendar className="h-8 w-8" />,
    title: "Doctor Availability",
    description: "Check real-time doctor schedules, specializations, and availability across multiple departments.",
    image: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
  },
  {
    icon: <HiClock className="h-8 w-8" />,
    title: "Emergency Services",
    description: "Quick access to emergency care with priority booking and immediate medical assistance coordination.",
    image: "https://images.unsplash.com/photo-1504813184591-01572f98c85f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
  }
];

export default function ServicesSection() {
  return (
    <div className="bg-white">

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="mb-6">
              <span className="inline-block px-4 py-2 bg-gray-100 text-gray-800 text-sm font-medium rounded-full">
              Our Services
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-black mb-6">
              Essential Healthcare Services for 
              <span className="text-gray-600"> Modern Patients</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Streamline your healthcare experience with our comprehensive digital platform designed to save time and improve patient care quality.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-xl hover:border-gray-300 transition-all duration-300"
              >
                <div className="mb-6">
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className="w-full h-48 object-cover rounded-xl mb-4"
                  />
                  <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center text-white group-hover:bg-gray-800 transition-colors duration-300">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-black mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="mb-6">
              <span className="inline-block px-4 py-2 bg-white text-gray-800 text-sm font-medium rounded-full border border-gray-200">
                How It Works
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-black mb-6">
              Simple Steps to 
              <span className="text-gray-600"> Better Healthcare</span>
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-black rounded-3xl flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Sign Up & Setup</h3>
              <p className="text-gray-600 leading-relaxed">
                Create your account and set up your family health profiles in minutes with our intuitive onboarding process.
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-black rounded-3xl flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Book Appointments</h3>
              <p className="text-gray-600 leading-relaxed">
                Use our smart booking system or WhatsApp bot to schedule appointments with real-time availability.
              </p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-black rounded-3xl flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Skip the Queue</h3>
              <p className="text-gray-600 leading-relaxed">
                Arrive at your appointment time with no waiting. Track your position and receive real-time updates.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 