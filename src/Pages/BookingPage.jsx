import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { HiUser, HiUserGroup, HiPlus, HiChevronDown, HiHeart } from 'react-icons/hi';

export default function BookingPage() {
  const { isSignedIn, user, isLoaded } = useUser();
  const [selectedPatient, setSelectedPatient] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [familyMembers, setFamilyMembers] = useState([]);

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      // Create family members array from user data
      const members = [
        {
          id: 1,
          name: user.fullName || user.firstName || 'User',
          relation: 'Self',
          age: user.publicMetadata?.age || 'N/A',
          gender: user.publicMetadata?.gender || 'N/A'
        }
      ];
      
      setFamilyMembers(members);
      setSelectedPatient(`${user.fullName || user.firstName || 'User'} (Self)`);
    }
  }, [isLoaded, isSignedIn, user]);

  const handleGetSuggestions = () => {
    if (!symptoms.trim()) {
      alert('Please describe the symptoms first.');
      return;
    }
    // Here you would typically make an API call to get department suggestions
    alert('Department suggestions feature will be implemented here.');
  };

  const handleAddFamilyMember = () => {
    alert('Add family member feature will be implemented here.');
  };

  if (!isLoaded) {
    return (
      <div className="py-20 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-md p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading...</h2>
          <p className="text-gray-600">Please wait while we verify your authentication.</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="py-20 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-md p-8 max-w-md w-full text-center">
          <HiUser className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Login Required</h2>
          <p className="text-gray-600 mb-6">Please login to access the booking dashboard.</p>
          <a
            href="/login"
            className="inline-block bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="py-20 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            OPD Booking Dashboard
          </h1>
          <p className="text-xl text-gray-600">
            Manage appointments for your family members
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Family Health Wallet */}
          <div className="bg-white rounded-xl shadow-md p-8">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <HiUserGroup className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Family Health Wallet</h2>
            </div>

            {familyMembers.length > 0 ? (
              <div className="space-y-4 mb-6">
                {familyMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedPatient(`${member.name} (${member.relation})`)}
                  >
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-4">
                      <HiUser className="h-6 w-6 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {member.name} ({member.relation})
                      </h3>
                      <p className="text-sm text-gray-600">
                        {member.age !== 'N/A' ? `Age: ${member.age}` : 'Age: Not specified'}
                      </p>
                    </div>
                    {selectedPatient === `${member.name} (${member.relation})` && (
                      <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <HiUserGroup className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p>No family members added yet.</p>
              </div>
            )}

            <button
              onClick={handleAddFamilyMember}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors flex items-center justify-center"
            >
              <HiPlus className="h-5 w-5 mr-2" />
              Add Family Member
            </button>
          </div>

          {/* Book Appointment */}
          <div className="bg-white rounded-xl shadow-md p-8">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <HiHeart className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Book Appointment</h2>
            </div>

            <div className="space-y-6">
              {/* Select Patient */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Patient
                </label>
                <div className="relative">
                  <select
                    value={selectedPatient}
                    onChange={(e) => setSelectedPatient(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                    disabled={familyMembers.length === 0}
                  >
                    {familyMembers.length > 0 ? (
                      familyMembers.map((member) => (
                        <option key={member.id} value={`${member.name} (${member.relation})`}>
                          {member.name} ({member.relation})
                        </option>
                      ))
                    ) : (
                      <option value="">No family members available</option>
                    )}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <HiChevronDown className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Describe Symptoms */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Describe Symptoms
                </label>
                <textarea
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Please describe the symptoms or health concerns..."
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Get Department Suggestions Button */}
              <button
                onClick={handleGetSuggestions}
                disabled={familyMembers.length === 0 || !symptoms.trim()}
                className="w-full bg-black text-white py-4 rounded-lg font-semibold hover:bg-gray-800 transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <HiHeart className="h-5 w-5 mr-2" />
                Get Department Suggestions
              </button>
            </div>
          </div>
        </div>

        {/* Additional Features Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <HiUser className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Quick Booking</h3>
            <p className="text-sm text-gray-600">Book appointments in just a few clicks</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <HiUserGroup className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Family Management</h3>
            <p className="text-sm text-gray-600">Manage health records for your entire family</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <HiHeart className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Smart Suggestions</h3>
            <p className="text-sm text-gray-600">Get AI-powered department recommendations</p>
          </div>
        </div>
      </div>
    </div>
  );
} 