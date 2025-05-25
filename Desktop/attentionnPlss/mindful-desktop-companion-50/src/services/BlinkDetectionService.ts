
class BlinkDetectionService {
  private static instance: BlinkDetectionService;
  private isRunning: boolean = false;
  private listeners: Array<(message: string) => void> = [];
  private reminderInterval: NodeJS.Timeout | null = null;
  private lastReminderTime: number = 0;
  private reminderIntervalMinutes: number = 20;
  
  private constructor() {
    console.log('BlinkDetectionService initialized in simple reminder mode');
  }

  public static getInstance(): BlinkDetectionService {
    if (!BlinkDetectionService.instance) {
      BlinkDetectionService.instance = new BlinkDetectionService();
    }
    return BlinkDetectionService.instance;
  }

  public async startDetection(): Promise<boolean> {
    if (this.isRunning) return true;
    
    try {
      this.isRunning = true;
      this.lastReminderTime = Date.now();
      this.startReminderTimer();
      
      console.log('Blink reminder timer started');
      return true;
    } catch (error) {
      console.error('Failed to start blink detection:', error);
      return false;
    }
  }

  public stopDetection(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    
    if (this.reminderInterval) {
      clearInterval(this.reminderInterval);
      this.reminderInterval = null;
    }
    
    console.log('Blink reminder timer stopped');
  }

  public isDetectionAvailable(): boolean {
    return true; // Always available since we're just using timers
  }

  private startReminderTimer(): void {
    if (this.reminderInterval) {
      clearInterval(this.reminderInterval);
    }
    
    // Check every minute but only send reminder based on the interval
    this.reminderInterval = setInterval(() => {
      if (!this.isRunning) return;
      
      const now = Date.now();
      const intervalMs = this.reminderIntervalMinutes * 60 * 1000;
      
      // Send reminder if enough time has passed
      if (now - this.lastReminderTime >= intervalMs) {
        this.notifyBlinkReminder();
        this.lastReminderTime = now;
      }
    }, 60000); // Check every minute
  }

  private notifyBlinkReminder(): void {
    const message = "Remember to blink regularly to reduce eye strain. Take a moment to rest your eyes.";
    this.listeners.forEach(listener => listener(message));
  }

  public addBlinkRateListener(callback: (message: string) => void): void {
    this.listeners.push(callback);
  }

  public removeBlinkRateListener(callback: (message: string) => void): void {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }
}

export default BlinkDetectionService;
