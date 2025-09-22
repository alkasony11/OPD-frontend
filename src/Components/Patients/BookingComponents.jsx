import { useState } from 'react';
import { 
  BuildingOffice2Icon,
  UserCircleIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import PrintBookingDetails from './PrintBookingDetails.jsx';

// Enhanced Department Selection Component
export function DepartmentSelection({ departments, onSelect, loading }) {
  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
        <p className="text-gray-600">Loading departments...</p>
      </div>
    );
  }

  if (departments.length === 0) {
    return (
      <div className="text-center py-8">
        <BuildingOffice2Icon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No departments available</h3>
        <p className="text-gray-600">Please try again later or contact support.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Select Department</h2>
      <p className="text-gray-600 mb-6">
        Not sure which department to choose? Use the "Describe Symptoms" option to get recommendations.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((dept) => (
          <div
            key={dept.id}
            onClick={() => onSelect(dept)}
            className="p-6 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-black hover:shadow-lg transition-all duration-200 group"
          >
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <BuildingOffice2Icon className="h-10 w-10 text-gray-600 group-hover:text-black transition-colors" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 group-hover:text-black transition-colors">
                  {dept.name}
                </h3>
                <p className="text-sm text-gray-600 mt-1">{dept.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Enhanced Doctor Selection Component
export function DoctorSelection({ doctors, selectedDepartment, onSelect, onAutoAssign, loading }) {
  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
        <p className="text-gray-600">Loading doctors...</p>
      </div>
    );
  }

  if (doctors.length === 0) {
    return (
      <div className="text-center py-8">
        <UserCircleIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No doctors available</h3>
        <p className="text-gray-600">No doctors found in {selectedDepartment} department.</p>
      </div>
    );
  }

  // Separate available and unavailable doctors
  const availableDoctors = doctors.filter(doctor => doctor.isAvailable);
  const unavailableDoctors = doctors.filter(doctor => !doctor.isAvailable);

  // Separate doctors with slots vs fully booked
  const doctorsWithSlots = availableDoctors.filter(doctor => doctor.hasAvailableSlots !== false);
  const fullyBookedDoctors = availableDoctors.filter(doctor => doctor.hasAvailableSlots === false);

  // Find doctor with lowest queue load (only those with available slots)
  const getBestDoctor = () => {
    if (doctorsWithSlots.length === 0) return null;
    return doctorsWithSlots.reduce((best, current) => {
      return current.patientsAhead < best.patientsAhead ? current : best;
    });
  };

  const bestDoctor = getBestDoctor();

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Select Doctor</h2>
      <p className="text-gray-600 mb-6">Department: {selectedDepartment}</p>
      
      {/* Auto-assignment option */}
      {bestDoctor && (
        <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <div className="flex items-center space-x-2">
                  <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-green-900">Auto-Assign Best Doctor</h3>
                </div>
              </div>
              <p className="text-sm text-green-700 mb-3">
                Not sure which doctor? Let us assign you the earliest available doctor in this session.
              </p>
              {bestDoctor && (
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <span className="text-green-600 font-medium">Recommended:</span>
                    <span className="text-gray-700">{bestDoctor.name}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-gray-600">Only</span>
                    <span className="text-green-600 font-medium">{bestDoctor.patientsAhead}</span>
                    <span className="text-gray-600">patients ahead</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-gray-600">~</span>
                    <span className="text-green-600 font-medium">{bestDoctor.averageWaitTime}</span>
                    <span className="text-gray-600">min wait</span>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => onAutoAssign && onAutoAssign(bestDoctor)}
              className="ml-4 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-lg"
            >
              Auto Assign
            </button>
          </div>
        </div>
      )}
      
      {/* Doctors with Available Slots */}
      {doctorsWithSlots.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
            Available Doctors ({doctorsWithSlots.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {doctorsWithSlots.map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} onSelect={onSelect} />
            ))}
          </div>
        </div>
      )}

      {/* Fully Booked Doctors */}
      {fullyBookedDoctors.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-orange-500 mr-2" />
            Fully Booked ({fullyBookedDoctors.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fullyBookedDoctors.map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} onSelect={onSelect} />
            ))}
          </div>
        </div>
      )}

      {/* Unavailable Doctors */}
      {unavailableDoctors.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
            Currently Unavailable ({unavailableDoctors.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {unavailableDoctors.map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} onSelect={onSelect} disabled />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Doctor Card Component
function DoctorCard({ doctor, onSelect, disabled = false }) {
  const isAvailable = doctor.isAvailable && !disabled;
  const hasSlots = doctor.hasAvailableSlots !== false;
  
  return (
    <div
      onClick={() => isAvailable && onSelect(doctor)}
      className={`p-6 border-2 rounded-xl transition-all duration-200 ${
        disabled || !doctor.isAvailable
          ? 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
          : 'border-gray-200 cursor-pointer hover:border-blue-500 hover:shadow-lg'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
        <div className="relative flex-shrink-0">
          {doctor.profilePhoto ? (
            <img 
              src={doctor.profilePhoto} 
              alt={doctor.name}
                className="h-14 w-14 rounded-full object-cover"
            />
          ) : (
              <UserCircleIcon className="h-14 w-14 text-gray-600" />
          )}
            {isAvailable && (
            <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 border-2 border-white rounded-full"></div>
          )}
        </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{doctor.name}</h3>
            <p className="text-sm text-gray-600">{doctor.specialization}</p>
            <p className="text-xs text-gray-500">{doctor.experience} years experience</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-lg font-bold text-gray-900">₹{doctor.fee}</div>
          <div className="text-xs text-gray-500">consultation fee</div>
        </div>
      </div>

      {/* Availability Info */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-600">Available:</div>
            <div className="font-medium text-gray-900">{doctor.sessionTime}</div>
          </div>
          <div>
            <div className="text-gray-600">Next Slot:</div>
            <div className="font-medium text-gray-900">{doctor.nextSlot}</div>
          </div>
          <div>
            <div className="text-gray-600">Patients Ahead:</div>
            <div className="font-medium text-gray-900">{doctor.patientsAhead}</div>
          </div>
          <div>
            <div className="text-gray-600">Avg Wait:</div>
            <div className="font-medium text-gray-900">{doctor.averageWaitTime} mins</div>
          </div>
              </div>
            </div>

      {/* Action Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {isAvailable ? (
            <>
              <CheckCircleIcon className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-600 font-medium">
                {hasSlots ? 'Available' : 'Fully Booked'}
              </span>
            </>
          ) : (
            <>
              <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-600 font-medium">
                {disabled ? 'Unavailable' : 'Not Scheduled'}
              </span>
            </>
          )}
        </div>
        
        {isAvailable && hasSlots && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(doctor);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Book with {doctor.name.split(' ')[0]}
          </button>
        )}
        
        {isAvailable && !hasSlots && (
          <span className="px-4 py-2 bg-gray-300 text-gray-600 rounded-lg text-sm font-medium">
            Fully Booked
          </span>
        )}
      </div>
    </div>
  );
}

// Enhanced Date Selection Component with 7-day View
export function DateSelection({ dates, selectedDoctor, onSelect, loading }) {
  const [selectedDate, setSelectedDate] = useState(null);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
        <p className="text-gray-600">Loading available dates...</p>
      </div>
    );
  }

  // Map of available dates from API
  const availableDatesMap = {};
  (dates || []).forEach(dateObj => {
    availableDatesMap[dateObj.date] = dateObj;
  });

  // Build 7-day window starting today
  const toLocalYmd = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = toLocalYmd(d);
    const fromApi = availableDatesMap[dateStr];
    days.push({
      date: d,
      dateStr,
      isToday: i === 0,
      // Treat availability based on sessions available from backend
      isAvailable: !!fromApi && ((fromApi.availableSessions || fromApi.availableSlots || 0) > 0),
      availableSessions: fromApi?.availableSessions || 0,
      totalSessions: fromApi?.totalSessions || 0,
      availableSlots: fromApi?.availableSlots || 0,
      totalSlots: fromApi?.totalSlots || 0,
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' })
    });
  }

  const handleSelect = (day) => {
    if (!day.isAvailable) return;
    setSelectedDate(day.dateStr);
    onSelect(day.dateStr);
  };

  const title = selectedDoctor
    ? `Choose a date for ${selectedDoctor}`
    : 'Choose a date';

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <p className="text-blue-800 text-sm">
          Tip: Choose the date that works best for you. You can change it later if needed.
        </p>
      </div>
      <p className="text-gray-600 mb-6">Showing availability for the next 7 days</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {days.map((day) => {
          const isSelected = selectedDate === day.dateStr;
          const base = day.isAvailable
            ? (isSelected
                ? 'border-black bg-gray-50'
                : 'border-green-300 hover:border-green-500 hover:bg-green-50')
            : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60';
          return (
            <button
              key={day.dateStr}
              onClick={() => handleSelect(day)}
              disabled={!day.isAvailable}
              className={`p-4 border-2 rounded-xl text-left transition-all ${base}`}
            >
              <div className="text-xs text-gray-600">{day.dayName}</div>
              <div className="text-lg font-semibold text-gray-900">
                {day.date.getDate().toString().padStart(2, '0')}
              </div>
              <div className="text-xs text-gray-500">
                {day.isAvailable 
                  ? `${day.availableSessions || day.availableSlots} sessions` 
                  : 'No sessions'}
              </div>
              {day.isToday && (
                <div className="mt-1 text-[10px] text-blue-700">Today</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Enhanced Session Selection Component
export function TimeSelection({ sessions, selectedDate, onSelect, loading }) {
  const formatSelectedDate = (ymd) => {
    if (!ymd) return '';
    // Expecting format YYYY-MM-DD; construct local date to avoid timezone shifts
    const parts = String(ymd).split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // zero-based
      const day = parseInt(parts[2], 10);
      if (!Number.isNaN(year) && !Number.isNaN(month) && !Number.isNaN(day)) {
        const dt = new Date(year, month, day);
        return dt.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
    }
    // Fallback if unexpected format
    const d = new Date(ymd);
    return d.toString() === 'Invalid Date'
      ? String(ymd)
      : d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };
  
  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
        <p className="text-gray-600">Loading available sessions...</p>
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="text-center py-8">
        <ClockIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No available sessions</h3>
        <p className="text-gray-600">No sessions available for the selected date. Please choose a different date.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Select Session</h2>
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <p className="text-blue-800 text-sm">
          Choose a session that works for you. Only sessions with available doctors are shown.
        </p>
      </div>
      <p className="text-gray-600 mb-6">Date: {formatSelectedDate(selectedDate)}</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sessions.map((session) => (
          <div
            key={session.id}
            onClick={() => onSelect(session)}
            className="p-8 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-blue-500 hover:shadow-lg transition-all duration-200 group text-center"
          >
            <div className="mb-4">
              <ClockIcon className="mx-auto h-12 w-12 text-blue-600 mb-4 group-hover:text-blue-700 transition-colors" />
              <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                {session.name}
              </h3>
              <p className="text-lg text-gray-600 font-medium mb-3">{session.displayTime}</p>
              
              {/* Doctor Count */}
              <div className="flex items-center justify-center">
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  {session.doctorCount} doctors available
                </div>
              </div>
            </div>
            
            <div className="text-sm text-gray-500">
              Click to select this session
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Time Slot Group Component
function TimeSlotGroup({ title, color, slots, onSelect }) {
  const colorClasses = {
    yellow: 'bg-yellow-400',
    orange: 'bg-orange-400',
    blue: 'bg-blue-400'
  };

  return (
    <div>
      <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
        <span className={`inline-block w-2 h-2 ${colorClasses[color]} rounded-full mr-2`}></span>
        {title}
      </h3>
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {slots.map((slot) => (
          <TimeSlotCard key={slot.time} slot={slot} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

// Time Slot Card Component
function TimeSlotCard({ slot, onSelect }) {
  return (
    <div
      onClick={() => onSelect(slot.time)}
      className="p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-black hover:shadow-md transition-all duration-200 text-center group"
    >
      <div className="font-semibold text-gray-900 group-hover:text-black">
        {slot.displayTime || slot.time}
      </div>
      <div className="text-xs text-green-600 mt-1">Available</div>
      {slot.estimatedWaitTime && (
        <div className="text-xs text-gray-500 mt-1">
          ~{slot.estimatedWaitTime}min wait
        </div>
      )}
    </div>
  );
}

// Booking Confirmation Component
export function BookingConfirmation({ bookingData, onNewBooking, user }) {
  return (
    <div className="text-center">
      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
        <CheckCircleIcon className="h-6 w-6 text-green-600" />
      </div>
      
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Appointment Booked Successfully!</h2>
      <p className="text-gray-600 mb-8">Your appointment has been confirmed. Here are the details:</p>
      
      <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Token Number</h3>
            <p className="text-lg font-semibold text-gray-900">{bookingData.tokenNumber}</p>
          </div>
          <div className="flex items-center space-x-3">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Patient</h3>
              <p className="text-lg font-semibold text-gray-900">{bookingData.familyMemberName}</p>
            </div>
            {(user?.profilePhoto || user?.profile_photo) ? (
              <img
                src={(user.profilePhoto || user.profile_photo).startsWith('http') 
                  ? (user.profilePhoto || user.profile_photo)
                  : `http://localhost:5001${user.profilePhoto || user.profile_photo}`
                }
                alt="Profile"
                className="h-8 w-8 rounded-full object-cover border-2 border-white shadow-sm"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
            ) : null}
            <UserCircleIcon 
              className={`h-8 w-8 text-gray-400 ${(user?.profilePhoto || user?.profile_photo) ? 'hidden' : 'block'}`} 
            />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Doctor</h3>
            <p className="text-lg font-semibold text-gray-900">{bookingData.doctorName}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Department</h3>
            <p className="text-lg font-semibold text-gray-900">{bookingData.departmentName}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Date</h3>
            <p className="text-lg font-semibold text-gray-900">
              {new Date(bookingData.appointmentDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Time</h3>
            <p className="text-lg font-semibold text-gray-900">{bookingData.appointmentTime}</p>
          </div>
        </div>
        
        {bookingData.estimatedWaitTime && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center">
              <InformationCircleIcon className="h-5 w-5 text-blue-500 mr-2" />
              <span className="text-sm text-gray-600">
                Estimated wait time: {bookingData.estimatedWaitTime} minutes
              </span>
            </div>
          </div>
        )}
      </div>
      
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Important Instructions</h3>
          <ul className="text-sm text-blue-800 space-y-1 text-left">
            <li>• Please arrive 15 minutes before your appointment time</li>
            <li>• Bring a valid ID and any relevant medical documents</li>
            <li>• You can cancel or reschedule up to 2 hours before the appointment</li>
            <li>• Contact the hospital if you need to make any changes</li>
          </ul>
        </div>
        
        <div className="flex space-x-3">
          <PrintBookingDetails 
            bookingData={bookingData} 
            user={user}
            onPrint={() => {
              console.log('Booking details printed from confirmation component');
            }}
          />
          <button
            onClick={onNewBooking}
            className="flex-1 bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
          >
            Book Another Appointment
          </button>
        </div>
      </div>
    </div>
  );
}