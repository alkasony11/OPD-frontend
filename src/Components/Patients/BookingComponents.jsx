import { 
  BuildingOffice2Icon,
  UserCircleIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

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
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Select Department</h2>
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
export function DoctorSelection({ doctors, selectedDepartment, onSelect, loading }) {
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

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Select Doctor</h2>
      <p className="text-gray-600 mb-6">Department: {selectedDepartment}</p>
      
      {/* Available Doctors */}
      {availableDoctors.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
            Available Doctors ({availableDoctors.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableDoctors.map((doctor) => (
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
  return (
    <div
      onClick={() => !disabled && onSelect(doctor)}
      className={`p-4 border-2 rounded-xl transition-all duration-200 ${
        disabled
          ? 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
          : 'border-gray-200 cursor-pointer hover:border-black hover:shadow-lg'
      }`}
    >
      <div className="flex items-start space-x-3">
        <div className="relative flex-shrink-0">
          {doctor.profilePhoto ? (
            <img 
              src={doctor.profilePhoto} 
              alt={doctor.name}
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <UserCircleIcon className="h-12 w-12 text-gray-600" />
          )}
          {!disabled && (
            <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 border-2 border-white rounded-full"></div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-gray-900 truncate">{doctor.name}</h3>
            {!disabled ? (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Available
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Unavailable
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-1">{doctor.specialization}</p>
          <p className="text-sm text-gray-500 mb-2">{doctor.experience} years experience</p>
          
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900">₹{doctor.fee}</p>
            {!disabled && doctor.availableDays > 0 && (
              <p className="text-xs text-green-600">{doctor.availableDays} days available</p>
            )}
          </div>
          
          {doctor.rating && (
            <div className="flex items-center mt-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`h-3 w-3 ${
                      i < Math.floor(doctor.rating) ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="ml-1 text-xs text-gray-600">({doctor.reviews} reviews)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Enhanced Date Selection Component
export function DateSelection({ dates, selectedDoctor, onSelect, loading }) {
  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
        <p className="text-gray-600">Loading available dates...</p>
      </div>
    );
  }

  if (dates.length === 0) {
    return (
      <div className="text-center py-8">
        <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No available dates</h3>
        <p className="text-gray-600">The selected doctor has no available dates in the next 30 days.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Select Date</h2>
      <p className="text-gray-600 mb-6">Doctor: {selectedDoctor}</p>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {dates.map((dateObj) => {
          const date = new Date(dateObj.date);
          const isToday = dateObj.isToday;
          const isTomorrow = !isToday && new Date(dateObj.date).getDate() === new Date().getDate() + 1;
          
          return (
            <div
              key={dateObj.date}
              onClick={() => onSelect(dateObj.date)}
              className="p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-black hover:shadow-md transition-all duration-200 text-center group"
            >
              <div className="font-semibold text-gray-900 group-hover:text-black">
                {date.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </div>
              <div className="text-sm text-gray-600 mt-1">{dateObj.dayName}</div>
              {isToday && (
                <div className="text-xs text-blue-600 font-medium mt-1">Today</div>
              )}
              {isTomorrow && (
                <div className="text-xs text-green-600 font-medium mt-1">Tomorrow</div>
              )}
              {dateObj.availableSlots && (
                <div className="text-xs text-gray-500 mt-1">
                  {dateObj.availableSlots} slots available
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Enhanced Time Selection Component
export function TimeSelection({ slots, selectedDate, onSelect, loading }) {
  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
        <p className="text-gray-600">Loading available time slots...</p>
      </div>
    );
  }

  if (!slots || slots.length === 0) {
    return (
      <div className="text-center py-8">
        <ClockIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No available slots</h3>
        <p className="text-gray-600">No time slots available for the selected date. Please choose a different date.</p>
      </div>
    );
  }

  // Group slots by time periods
  const morningSlots = slots.filter(slot => {
    const hour = parseInt(slot.time.split(':')[0]);
    return hour >= 6 && hour < 12;
  });

  const afternoonSlots = slots.filter(slot => {
    const hour = parseInt(slot.time.split(':')[0]);
    return hour >= 12 && hour < 17;
  });

  const eveningSlots = slots.filter(slot => {
    const hour = parseInt(slot.time.split(':')[0]);
    return hour >= 17;
  });

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Select Time</h2>
      <p className="text-gray-600 mb-6">
        Date: {new Date(selectedDate).toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}
      </p>
      
      <div className="space-y-6">
        {/* Morning slots */}
        {morningSlots.length > 0 && (
          <TimeSlotGroup 
            title="Morning (6 AM - 12 PM)" 
            color="yellow" 
            slots={morningSlots} 
            onSelect={onSelect} 
          />
        )}

        {/* Afternoon slots */}
        {afternoonSlots.length > 0 && (
          <TimeSlotGroup 
            title="Afternoon (12 PM - 5 PM)" 
            color="orange" 
            slots={afternoonSlots} 
            onSelect={onSelect} 
          />
        )}

        {/* Evening slots */}
        {eveningSlots.length > 0 && (
          <TimeSlotGroup 
            title="Evening (5 PM onwards)" 
            color="blue" 
            slots={eveningSlots} 
            onSelect={onSelect} 
          />
        )}
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
export function BookingConfirmation({ bookingData, onNewBooking }) {
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
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Patient</h3>
            <p className="text-lg font-semibold text-gray-900">{bookingData.familyMemberName}</p>
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
        
        <button
          onClick={onNewBooking}
          className="w-full bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
        >
          Book Another Appointment
        </button>
      </div>
    </div>
  );
}