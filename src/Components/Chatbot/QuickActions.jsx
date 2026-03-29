import React from 'react';
import { HiCalendar, HiPencil, HiX, HiClock, HiInformationCircle, HiPhone } from 'react-icons/hi';

const QuickActions = ({ actions, onActionClick, disabled = false }) => {
  const getActionIcon = (actionId) => {
    switch (actionId) {
      case 'check_appointments':
        return <HiCalendar className="w-4 h-4" />;
      case 'reschedule':
        return <HiPencil className="w-4 h-4" />;
      case 'cancel':
        return <HiX className="w-4 h-4" />;
      case 'queue_status':
        return <HiClock className="w-4 h-4" />;
      case 'hospital_info':
        return <HiInformationCircle className="w-4 h-4" />;
      case 'emergency':
        return <HiPhone className="w-4 h-4" />;
      default:
        return <HiInformationCircle className="w-4 h-4" />;
    }
  };

  const getActionColor = (actionId) => {
    switch (actionId) {
      case 'emergency':
        return 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100';
      case 'check_appointments':
        return 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100';
      case 'reschedule':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100';
      case 'cancel':
        return 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100';
      case 'queue_status':
        return 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100';
      case 'hospital_info':
        return 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100';
    }
  };

  if (!actions || actions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500 font-medium">Quick Actions:</p>
      <div className="grid grid-cols-1 gap-2">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => onActionClick(action)}
            disabled={disabled}
            className={`
              flex items-center space-x-2 p-3 rounded-lg border text-left transition-colors
              ${getActionColor(action.id)}
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className="flex-shrink-0">
              {getActionIcon(action.id)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{action.label}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;

