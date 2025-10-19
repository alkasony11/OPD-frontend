import { HiPhone, HiMail, HiLocationMarker, HiClock, HiCheckCircle, HiExclamationCircle } from 'react-icons/hi';
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { sanitizeNameInput } from '../../utils/validation';

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
  
  // Validation states
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

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

  // Validation functions
  const validateName = useCallback((name, fieldName) => {
    if (!name) {
      return `${fieldName} is required`;
    }
    const normalizedName = name.replace(/\s{2,}/g, ' ').trim();
    if (normalizedName.length < 2) {
      return `${fieldName} must be at least 2 characters long`;
    }
    if (normalizedName.length > 50) {
      return `${fieldName} is too long (max 50 characters)`;
    }
    if (!/^[a-zA-Z\s'-]+$/.test(normalizedName)) {
      return `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`;
    }
    return '';
  }, []);

  const validateEmail = useCallback((email) => {
    if (!email) {
      return 'Email is required';
    }
    const emailStr = email.trim().toLowerCase();
    const hasSpace = /\s/.test(emailStr);
    const parts = emailStr.split('@');
    const validParts = parts.length === 2 && parts[0] && parts[1];
    const local = validParts ? parts[0] : '';
    const domain = validParts ? parts[1] : '';

    const tooLong = emailStr.length > 254 || local.length > 64;
    const hasConsecutiveDots = /\.\./.test(local) || /\.\./.test(domain);
    const localStartsOrEndsWithDot = local.startsWith('.') || local.endsWith('.');
    const invalidDomainLabel = domain
      .split('.')
      .some(label => !label || label.length > 63 || label.startsWith('-') || label.endsWith('-'));
    const tld = domain.includes('.') ? domain.split('.').pop() : '';
    const invalidTldShape = !tld || tld.length < 2 || tld.length > 24 || /[^a-z]/.test(tld);
    const allowedTlds = ['com','net','org','edu','gov','mil','info','io','co','in','ai','app','dev'];
    const invalidTld = invalidTldShape || !allowedTlds.includes(tld);

    const basicRegex = /^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/i;
    const localStartsWithLetter = /^[a-z][a-z0-9._%+\-]*$/i.test(local);

    if (hasSpace || !validParts || !basicRegex.test(emailStr)) {
      return 'Please enter a valid email address';
    } else if (tooLong) {
      return 'Email is too long';
    } else if (hasConsecutiveDots || localStartsOrEndsWithDot) {
      return 'Email cannot contain consecutive dots or end with dot';
    } else if (!localStartsWithLetter) {
      return 'Email must start with a letter';
    } else if (invalidDomainLabel || invalidTld) {
      return 'Please enter a valid domain (e.g. example.com)';
    }
    return '';
  }, []);

  const validatePhone = useCallback((phone) => {
    if (!phone) return ''; // Phone is optional
    let digits = phone.replace(/\D/g, '');
    if (digits.startsWith('0')) digits = digits.replace(/^0+/, '');
    if (digits.startsWith('91') && digits.length === 12) digits = digits.slice(2);
    if (digits.length !== 10) {
      return 'Enter a 10-digit Indian mobile number';
    } else if (!/^[6-9]\d{9}$/.test(digits)) {
      return 'Number must start with 6-9 and be 10 digits';
    } else if (/^(\d)\1{9}$/.test(digits)) {
      return 'Phone number cannot be all same digits';
    } else if (digits === '1234567890' || digits === '0123456789' || digits === '0987654321') {
      return 'Enter a real phone number';
    }
    return '';
  }, []);

  const validateMessage = useCallback((message) => {
    if (!message) {
      return 'Message is required';
    }
    if (message.trim().length < 10) {
      return 'Message must be at least 10 characters long';
    }
    if (message.trim().length > 1000) {
      return 'Message is too long (max 1000 characters)';
    }
    return '';
  }, []);

  const validateField = useCallback((name, value) => {
    switch (name) {
      case 'firstName':
        return validateName(value, 'First name');
      case 'lastName':
        return validateName(value, 'Last name');
      case 'email':
        return validateEmail(value);
      case 'phone':
        return validatePhone(value);
      case 'message':
        return validateMessage(value);
      default:
        return '';
    }
  }, [validateName, validateEmail, validatePhone, validateMessage]);

  const handleFieldChange = useCallback((name, value) => {
    // Sanitize name fields to remove numbers and normalize spaces
    let sanitizedValue = value;
    if (name === 'firstName' || name === 'lastName') {
      sanitizedValue = sanitizeNameInput(value);
    }

    // Update the field value
    switch (name) {
      case 'firstName':
        setFirstName(sanitizedValue);
        break;
      case 'lastName':
        setLastName(sanitizedValue);
        break;
      case 'email':
        setEmail(value);
        break;
      case 'phone':
        setPhone(value);
        break;
      case 'subject':
        setSubject(value);
        break;
      case 'message':
        setMessage(value);
        break;
      default:
        break;
    }

    // Mark field as touched
    setTouched(prev => ({ ...prev, [name]: true }));

    // Validate field immediately for critical fields
    const criticalFields = ['firstName', 'lastName', 'email', 'message'];
    if (criticalFields.includes(name)) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    } else {
      // Debounced validation for other fields
      setTimeout(() => {
        const error = validateField(name, value);
        setErrors(prev => ({ ...prev, [name]: error }));
      }, 300);
    }
  }, [validateField]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    const token = localStorage.getItem('token');
    const isGuest = !isLoggedIn || !patient?._id || !token;

    // Validate all fields
    const newErrors = {};
    let hasErrors = false;

    if (isGuest) {
      const firstNameError = validateName(firstName, 'First name');
      const lastNameError = validateName(lastName, 'Last name');
      const emailError = validateEmail(email);
      
      if (firstNameError) {
        newErrors.firstName = firstNameError;
        hasErrors = true;
      }
      if (lastNameError) {
        newErrors.lastName = lastNameError;
        hasErrors = true;
      }
      if (emailError) {
        newErrors.email = emailError;
        hasErrors = true;
      }
    }

    const phoneError = validatePhone(phone);
    const messageError = validateMessage(message);
    
    if (phoneError) {
      newErrors.phone = phoneError;
      hasErrors = true;
    }
    if (messageError) {
      newErrors.message = messageError;
      hasErrors = true;
    }

    if (!subject) {
      newErrors.subject = 'Please select a subject';
      hasErrors = true;
    }

    setErrors(newErrors);
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      subject: true,
      message: true
    });

    if (hasErrors) {
      setErrorMsg('Please fix the errors below before submitting.');
      return;
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
              <div className="space-y-4">
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

              <form className="space-y-4" onSubmit={handleSubmit}>
                {!isLoggedIn && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => handleFieldChange('firstName', e.target.value)}
                        onBlur={() => setTouched(prev => ({ ...prev, firstName: true }))}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                          errors.firstName && touched.firstName
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                        placeholder="Enter your first name"
                      />
                      {errors.firstName && touched.firstName && (
                        <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => handleFieldChange('lastName', e.target.value)}
                        onBlur={() => setTouched(prev => ({ ...prev, lastName: true }))}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                          errors.lastName && touched.lastName
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                        placeholder="Enter your last name"
                      />
                      {errors.lastName && touched.lastName && (
                        <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isLoggedIn ? 'Your Email' : 'Email Address *'}
                  </label>
                  <input
                    type="email"
                    required={!isLoggedIn}
                    value={isLoggedIn ? (patient?.email || '') : email}
                    onChange={(e) => isLoggedIn ? null : handleFieldChange('email', e.target.value)}
                    onBlur={() => !isLoggedIn && setTouched(prev => ({ ...prev, email: true }))}
                    disabled={isLoggedIn}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      errors.email && touched.email
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    } ${isLoggedIn ? 'bg-gray-100 text-gray-600' : ''}`}
                    placeholder="Enter your email"
                  />
                  {errors.email && touched.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                {!isLoggedIn && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => handleFieldChange('phone', e.target.value)}
                      onBlur={() => setTouched(prev => ({ ...prev, phone: true }))}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                        errors.phone && touched.phone
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      placeholder="+91 98765 43210"
                    />
                    {errors.phone && touched.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject *
                  </label>
                  <select
                    required
                    value={subject}
                    onChange={(e) => handleFieldChange('subject', e.target.value)}
                    onBlur={() => setTouched(prev => ({ ...prev, subject: true }))}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      errors.subject && touched.subject
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  >
                    <option value="">Select a subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="demo">Request Demo</option>
                    <option value="partnership">Partnership</option>
                    <option value="feedback">Feedback</option>
                    <option value="complaint">Complaint</option>
                  </select>
                  {errors.subject && touched.subject && (
                    <p className="mt-1 text-sm text-red-600">{errors.subject}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => handleFieldChange('message', e.target.value)}
                    onBlur={() => setTouched(prev => ({ ...prev, message: true }))}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 resize-none ${
                      errors.message && touched.message
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder={isLoggedIn ? 'Tell us how we can help you...' : 'Tell us how we can help you... (include details for faster support)'}
                  ></textarea>
                  {errors.message && touched.message && (
                    <p className="mt-1 text-sm text-red-600">{errors.message}</p>
                  )}
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

          <div className="space-y-4">
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