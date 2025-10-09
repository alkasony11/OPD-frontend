import { useEffect, useRef } from 'react';
import realtimeSyncService from '../services/realtimeSyncService';

export const useRealtimeSync = (userRole, onScheduleChange, onAvailabilityChange, onDepartmentChange, onLeaveApproval, onAppointmentUpdate, onQueueUpdate, onSystemAlert) => {
  const listenersRef = useRef([]);

  useEffect(() => {
    if (!userRole) return;

    // Connect to real-time sync
    realtimeSyncService.connect(userRole);

    // Set up listeners
    const listeners = [];

    if (onScheduleChange) {
      const scheduleListener = (data) => onScheduleChange(data);
      realtimeSyncService.on('schedule-changed', scheduleListener);
      listeners.push(['schedule-changed', scheduleListener]);
    }

    if (onAvailabilityChange) {
      const availabilityListener = (data) => onAvailabilityChange(data);
      realtimeSyncService.on('availability-changed', availabilityListener);
      listeners.push(['availability-changed', availabilityListener]);
    }

    if (onDepartmentChange) {
      const departmentListener = (data) => onDepartmentChange(data);
      realtimeSyncService.on('department-status-changed', departmentListener);
      realtimeSyncService.on('department-availability-changed', departmentListener);
      listeners.push(['department-status-changed', departmentListener]);
      listeners.push(['department-availability-changed', departmentListener]);
    }

    if (onLeaveApproval) {
      const leaveListener = (data) => onLeaveApproval(data);
      realtimeSyncService.on('leave-approved', leaveListener);
      realtimeSyncService.on('appointments-cancelled', leaveListener);
      listeners.push(['leave-approved', leaveListener]);
      listeners.push(['appointments-cancelled', leaveListener]);
    }

    if (onAppointmentUpdate) {
      const appointmentListener = (data) => onAppointmentUpdate(data);
      realtimeSyncService.on('appointment-status-changed', appointmentListener);
      realtimeSyncService.on('your-appointment-updated', appointmentListener);
      listeners.push(['appointment-status-changed', appointmentListener]);
      listeners.push(['your-appointment-updated', appointmentListener]);
    }

    if (onQueueUpdate) {
      const queueListener = (data) => onQueueUpdate(data);
      realtimeSyncService.on('queue-updated', queueListener);
      realtimeSyncService.on('your-queue-updated', queueListener);
      listeners.push(['queue-updated', queueListener]);
      listeners.push(['your-queue-updated', queueListener]);
    }

    if (onSystemAlert) {
      const alertListener = (data) => onSystemAlert(data);
      realtimeSyncService.on('system-alert', alertListener);
      listeners.push(['system-alert', alertListener]);
    }

    listenersRef.current = listeners;

    // Cleanup on unmount
    return () => {
      listenersRef.current.forEach(([event, listener]) => {
        realtimeSyncService.off(event, listener);
      });
      realtimeSyncService.disconnect();
    };
  }, [userRole, onScheduleChange, onAvailabilityChange, onDepartmentChange, onLeaveApproval, onAppointmentUpdate, onQueueUpdate, onSystemAlert]);

  return {
    isConnected: realtimeSyncService.getConnectionStatus().connected,
    emit: realtimeSyncService.emit.bind(realtimeSyncService)
  };
};

export default useRealtimeSync;
