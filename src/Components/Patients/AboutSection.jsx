export default function AboutSection() {
  return (
    <div className="bg-white">
      {/* About Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="mb-6">
                <span className="inline-block px-4 py-2 bg-white text-gray-800 text-sm font-medium rounded-full border border-gray-200">
                  About MediQ
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-black mb-6">
                Revolutionizing Healthcare 
                <span className="text-gray-600"> Management</span>
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                MediQ transforms the traditional healthcare experience through intelligent technology, 
                real-time queue management, and AI-powered scheduling solutions, making healthcare 
                more accessible and efficient for everyone.
              </p>
            </div>
            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                <div className="absolute inset-0 bg-white rounded-3xl transform rotate-3"></div>
                <img
                  src="https://images.unsplash.com/photo-1666214280557-f1b5022eb634?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                  alt="Patient using digital healthcare app for appointments"
                  className="relative w-full max-w-lg h-auto rounded-3xl shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="relative">
                <div className="absolute inset-0 bg-white rounded-3xl transform -rotate-3"></div>
                <img
                  src="https://images.unsplash.com/photo-1584515933487-779824d29309?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                  alt="Patient checking in at hospital reception desk"
                  className="relative w-full max-w-lg h-auto rounded-3xl shadow-2xl"
                />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h3 className="text-3xl md:text-4xl font-bold text-black mb-6">
                Our Mission
              </h3>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                To eliminate waiting times and streamline healthcare delivery through innovative 
                technology solutions that benefit both patients and healthcare providers.
              </p>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center mt-1">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <p className="text-gray-600">Reduce patient waiting times by up to 80%</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center mt-1">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <p className="text-gray-600">Improve healthcare provider efficiency</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center mt-1">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <p className="text-gray-600">Enhance patient satisfaction and experience</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 