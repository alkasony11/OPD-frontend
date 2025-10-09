import { HiPhone, HiMail, HiLocationMarker, HiClock, HiCheckCircle, HiExclamationCircle } from 'react-icons/hi';
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function ContactSection() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('feedback');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [patient, setPatient] = useState(null);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      if (userStr && token) {
        const u = JSON.parse(userStr);
        setIsLoggedIn(true);
        setPatient(u);
      } else {
        setIsLoggedIn(false);
        setPatient(null);
      }
    } catch {
      setIsLoggedIn(false);
      setPatient(null);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    const token = localStorage.getItem('token');

    if (!message || !subject) {
      setErrorMsg('Please fill in the subject and message.');
      return;
    }

    const isGuest = !isLoggedIn || !patient?._id || !token;

    if (isGuest) {
      // Guest path requires basic contact info
      if (!firstName || !lastName || !email) {
        setErrorMsg('Please provide your name and email to submit as guest.');
        return;
      }
    }

    try {
      setSubmitting(true);
      const type = subject === 'complaint' ? 'complaint' : (subject === 'feedback' ? 'feedback' : 'query');

      const payload = isGuest ? {
        type,
        subject: `${subject.toUpperCase()} - ${firstName} ${lastName}`,
        message: `${message}\n\n— From: ${firstName} ${lastName} (${email}${phone ? ', ' + phone : ''})`,
        guest_name: `${firstName} ${lastName}`,
        guest_email: email,
        guest_phone: phone
      } : {
        patient_id: patient?._id,
        type,
        subject: `${subject.toUpperCase()}`,
        message
      };

      await axios.post('http://localhost:5001/api/admin/feedback', payload, {
        headers: isGuest ? {} : { 'Authorization': `Bearer ${token}` }
      });

      setSuccessMsg('Thank you! Your message has been submitted. Our team will get back to you shortly.');
      if (isGuest) {
        setFirstName('');
        setLastName('');
        setEmail('');
        setPhone('');
      }
      setSubject('feedback');
      setMessage('');
    } catch (err) {
      console.error('Contact form submit error:', err);
      setErrorMsg(err?.response?.data?.message || 'Sorry, something went wrong while submitting. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white">
      {/* Contact Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="mb-6">
              <span className="inline-block px-4 py-2 bg-white text-gray-800 text-sm font-medium rounded-full border border-gray-200">
                Contact Us
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-black mb-6">
              Get in Touch with 
              <span className="text-gray-600"> Our Team</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Have questions about our OPD booking system? Need support or want to schedule a demo? We're here to help you streamline your healthcare experience.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Information */}
            <div>
              <h3 className="text-2xl font-bold text-black mb-8">Contact Information</h3>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
                    <HiPhone className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-black mb-1">Phone</h4>
                    <p className="text-gray-600">+91 98765 43210</p>
                    <p className="text-gray-600">+91 87654 32109</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
                    <HiMail className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-black mb-1">Email</h4>
                    <p className="text-gray-600">support@mediq.com</p>
                    <p className="text-gray-600">info@mediq.com</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
                    <HiLocationMarker className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-black mb-1">Address</h4>
                    <p className="text-gray-600">123 Healthcare Street</p>
                    <p className="text-gray-600">Medical District, City 560001</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
                    <HiClock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-black mb-1">Support Hours</h4>
                    <p className="text-gray-600">Monday - Friday: 9:00 AM - 6:00 PM</p>
                    <p className="text-gray-600">Saturday: 10:00 AM - 4:00 PM</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-black mb-6">Send us a Message</h3>

              {/* Alerts */}
              {successMsg && (
                <div className="mb-4 flex items-start p-3 rounded-md bg-green-50 text-green-800 border border-green-200">
                  <HiCheckCircle className="w-5 h-5 mr-2 mt-0.5" />
                  <span className="text-sm">{successMsg}</span>
                </div>
              )}
              {errorMsg && (
                <div className="mb-4 flex items-start p-3 rounded-md bg-red-50 text-red-800 border border-red-200">
                  <HiExclamationCircle className="w-5 h-5 mr-2 mt-0.5" />
                  <span className="text-sm">{errorMsg}</span>
                </div>
              )}

              <form className="space-y-6" onSubmit={handleSubmit}>
                {!isLoggedIn && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your first name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter your last name"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isLoggedIn ? 'Your Email' : 'Email Address *'}
                  </label>
                  <input
                    type="email"
                    required={!isLoggedIn}
                    value={isLoggedIn ? (patient?.email || '') : email}
                    onChange={(e) => isLoggedIn ? null : setEmail(e.target.value)}
                    disabled={isLoggedIn}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isLoggedIn ? 'bg-gray-100 text-gray-600' : ''}`}
                    placeholder="Enter your email"
                  />
                </div>

                {!isLoggedIn && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <select
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="demo">Request Demo</option>
                    <option value="partnership">Partnership</option>
                    <option value="feedback">Feedback</option>
                    <option value="complaint">Complaint</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder={isLoggedIn ? 'Tell us how we can help you...' : 'Tell us how we can help you... (include details for faster support)'}
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200 disabled:opacity-60"
                >
                  {submitting ? 'Sending...' : 'Send Message'}
                </button>
                {!isLoggedIn && (
                  <p className="text-xs text-gray-500 text-center">Tip: Log in for faster support. Your profile details will be attached automatically.</p>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Quick answers to common questions about our OPD booking system
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-black mb-3">
                How do I book an appointment?
              </h3>
              <p className="text-gray-600">
                Simply register on our platform, choose your preferred doctor and time slot, and confirm your booking. You'll receive instant confirmation via SMS and email.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-black mb-3">
                Can I cancel or reschedule my appointment?
              </h3>
              <p className="text-gray-600">
                Yes, you can cancel or reschedule your appointment up to 2 hours before the scheduled time through our platform or by calling our support team.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-black mb-3">
                What payment methods are accepted?
              </h3>
              <p className="text-gray-600">
                We accept cash, cards, and select digital wallets. Receipts are available in your appointment history.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 