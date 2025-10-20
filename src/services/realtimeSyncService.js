import { io } from 'socket.io-client';

class RealtimeSyncService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
  }

  // Initialize connection
  connect(userRole) {
    if (this.socket) {
      this.disconnect();
    }

    this.socket = io(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001', {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      console.log('🔌 Connected to real-time sync server');
      this.isConnected = true;
      
      // Join appropriate room based on user role
      if (userRole === 'admin') {
        this.socket.emit('join-admin');
        console.log('👤 Joined admin room');
      } else if (userRole === 'doctor') {
        this.socket.emit('join-doctor');
        console.log('👤 Joined doctor room');
      } else if (userRole === 'patient') {
        this.socket.emit('join-patient');
        console.log('👤 Joined patient room');
      }
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Disconnected from real-time sync server');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔌 Connection error:', error);
      this.isConnected = false;
    });

    // Set up default event listeners
    this.setupDefaultListeners();
  }

  // Disconnect from server
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Setup default event listeners
  setupDefaultListeners() {
    if (!this.socket) return;

    // Schedule changes
    this.socket.on('schedule-changed', (data) => {
      console.log('📅 Schedule changed:', data);
      this.notifyListeners('schedule-changed', data);
    });

    // Availability changes
    this.socket.on('availability-changed', (data) => {
      console.log('📅 Availability changed:', data);
      this.notifyListeners('availability-changed', data);
    });

    // Department status changes
    this.socket.on('department-status-changed', (data) => {
      console.log('🏥 Department status changed:', data);
      this.notifyListeners('department-status-changed', data);
    });

    // Department availability changes
    this.socket.on('department-availability-changed', (data) => {
      console.log('🏥 Department availability changed:', data);
      this.notifyListeners('department-availability-changed', data);
    });

    // Leave approvals
    this.socket.on('leave-approved', (data) => {
      console.log('🏖️ Leave approved:', data);
      this.notifyListeners('leave-approved', data);
    });

    // Appointment cancellations
    this.socket.on('appointments-cancelled', (data) => {
      console.log('❌ Appointments cancelled:', data);
      this.notifyListeners('appointments-cancelled', data);
    });

    // Appointment status changes
    this.socket.on('appointment-status-changed', (data) => {
      console.log('📋 Appointment status changed:', data);
      this.notifyListeners('appointment-status-changed', data);
    });

    // Your appointment updated
    this.socket.on('your-appointment-updated', (data) => {
      console.log('📋 Your appointment updated:', data);
      this.notifyListeners('your-appointment-updated', data);
    });

    // Queue updates
    this.socket.on('queue-updated', (data) => {
      console.log('👥 Queue updated:', data);
      this.notifyListeners('queue-updated', data);
    });

    // Your queue updated
    this.socket.on('your-queue-updated', (data) => {
      console.log('👥 Your queue updated:', data);
      this.notifyListeners('your-queue-updated', data);
    });

    // System alerts
    this.socket.on('system-alert', (data) => {
      console.log('🚨 System alert:', data);
      this.notifyListeners('system-alert', data);
    });
  }

  // Add event listener
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  // Remove event listener
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // Notify all listeners for an event
  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  // Emit event to server
  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit:', event);
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      socket: this.socket
    };
  }
}

// Create singleton instance
const realtimeSyncService = new RealtimeSyncService();

export default realtimeSyncService;
