
import { useEffect } from 'react';
import SystemTrayService from '@/services/SystemTrayService';
import { useTimer } from '@/contexts/TimerContext';
import { useAuth } from '@/contexts/AuthContext';

export function useEyeCareTray() {
  const { 
    isEyeCareActive, 
    isEyeCareResting,
    eyeCareTimeElapsed,
    eyeCareWorkDuration,
    eyeCareRestDuration,
    updateTimerSettings
  } = useTimer();
  const { user } = useAuth();
  
  // Load user preferences from MongoDB when component mounts
  useEffect(() => {
    const systemTray = SystemTrayService.getInstance();
    
    if (user) {
      // Try to load preferences from MongoDB
      systemTray.loadPreferences(user.id)
        .then(preferences => {
          if (preferences?.eyeCareSettings) {
            console.log("Loaded eye care settings from preferences:", preferences.eyeCareSettings);
            // Update eye care settings from preferences using the correct method
            updateTimerSettings({
              eyeCareWorkDuration: preferences.eyeCareSettings.workDuration || 1200, // 20 minutes default
              eyeCareRestDuration: preferences.eyeCareSettings.restDuration || 20, // 20 seconds default
              pomodoroDuration: 25, // Keep existing pomodoro duration
              pomodoroBreakDuration: 5 // Keep existing pomodoro break duration
            });
          }
        })
        .catch(error => {
          console.error('Failed to load preferences:', error);
        });
    }
  }, [user, updateTimerSettings]);
  
  // Save preferences to MongoDB when they change
  useEffect(() => {
    const systemTray = SystemTrayService.getInstance();
    
    if (user) {
      const preferences = {
        eyeCareSettings: {
          isActive: isEyeCareActive,
          workDuration: eyeCareWorkDuration,
          restDuration: eyeCareRestDuration
        }
      };
      
      systemTray.savePreferences(user.id, preferences)
        .catch(error => {
          console.error('Failed to save preferences:', error);
        });
    }
  }, [user, isEyeCareActive, eyeCareWorkDuration, eyeCareRestDuration]);
  
  // Update tray tooltip and icon with current timer status
  useEffect(() => {
    const systemTray = SystemTrayService.getInstance();
    
    if (isEyeCareActive) {
      if (isEyeCareResting) {
        systemTray.setTrayTooltip(`Eye Rest: ${eyeCareRestDuration - eyeCareTimeElapsed}s remaining`);
        systemTray.setTrayIcon('rest');
      } else {
        const minutesRemaining = Math.floor((eyeCareWorkDuration - eyeCareTimeElapsed) / 60);
        const secondsRemaining = (eyeCareWorkDuration - eyeCareTimeElapsed) % 60;
        systemTray.setTrayTooltip(`Next Break: ${minutesRemaining}:${String(secondsRemaining).padStart(2, '0')}`);
        systemTray.setTrayIcon('active');
        
        // Send reminder when close to break time
        if (eyeCareWorkDuration - eyeCareTimeElapsed === 60) { // 1 minute before break
          if (typeof window !== 'undefined' && window.electron) {
            console.log("Sending 1-minute warning notification");
            window.electron.send('show-native-notification', {
              title: "Eye Break Soon",
              body: "You will have an eye break in 1 minute. Prepare to look away from the screen."
            });
          }
        }
      }
    } else {
      systemTray.setTrayTooltip('Mindful Desktop Companion');
      systemTray.setTrayIcon('default');
    }
  }, [isEyeCareActive, isEyeCareResting, eyeCareTimeElapsed, eyeCareWorkDuration, eyeCareRestDuration]);

  // Add a function to manually trigger a notification for testing
  const triggerTestNotification = () => {
    const systemTray = SystemTrayService.getInstance();
    systemTray.setTrayTooltip('Test notification triggered');
    
    if (typeof window !== 'undefined' && window.electron) {
      window.electron.send('show-native-notification', {
        title: "Test Notification",
        body: "This is a test notification triggered manually."
      });
    }
  };
  
  return { triggerTestNotification };
}
