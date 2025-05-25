
const EventEmitter = require('events');

class BlinkDetector extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      blinkIntervalMinutes: 20, // Check blink rate every 20 minutes
      ...options
    };
    
    this.isRunning = false;
    this.simulationInterval = null;
    this.lastNotificationTime = Date.now();
  }
  
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('Starting blink detector in timer mode');
    this.startTimerMode();
  }
  
  startTimerMode() {
    // Convert minutes to milliseconds for interval timing
    const intervalMs = this.options.blinkIntervalMinutes * 60 * 1000;
    
    // Emit blink events every 20 minutes
    this.simulationInterval = setInterval(() => {
      const now = Date.now();
      // Only emit if enough time has passed since last notification
      if (now - this.lastNotificationTime >= intervalMs) {
        this.emit('blink');
        console.log('Blink reminder (20-minute interval)');
        this.lastNotificationTime = now;
      }
    }, 60000); // Check every minute but only emit based on the interval
  }
  
  stop() {
    this.isRunning = false;
    
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }
}

module.exports = { BlinkDetector };
