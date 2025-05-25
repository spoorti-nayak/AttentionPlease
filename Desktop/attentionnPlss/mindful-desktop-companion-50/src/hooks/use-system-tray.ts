
import { useEffect, useState } from 'react';
import SystemTrayService from '@/services/SystemTrayService';
import { useAuth } from '@/contexts/AuthContext';
import { useFocusMode } from '@/contexts/FocusModeContext';

export function useSystemTray() {
  const [isTrayActive, setIsTrayActive] = useState(false);
  const auth = useAuth();
  const user = auth?.user;
  const { isFocusMode, whitelist } = useFocusMode();

  // Initialize system tray
  useEffect(() => {
    const systemTray = SystemTrayService.getInstance();
    
    // Initialize system tray
    systemTray.showTrayIcon();
    systemTray.setTrayTooltip("Mindful Desktop Companion");
    setIsTrayActive(systemTray.isDesktopEnvironment());
    
    // Cleanup notification handler - remove focus alerts to prevent malformed notifications
    const notificationHandler = (message: string, isFocusAlert: boolean) => {
      // Completely ignore all focus alert notifications to prevent malformed popups
      // All focus handling is now done through the RichMediaPopup component
      console.log('System tray notification ignored:', { message, isFocusAlert });
    };
    
    systemTray.addNotificationListener(notificationHandler);
    
    // Listen for notification dismissed events
    const handleNotificationDismissed = (e: Event) => {
      const notificationId = (e as CustomEvent<string>).detail;
      if (notificationId && window.electron) {
        // Sync the dismissed state back to the main process
        window.electron.send('notification-dismissed', notificationId);
      }
    };
    
    window.addEventListener('notification-dismissed', handleNotificationDismissed as EventListener);
    
    return () => {
      // Cleanup
      systemTray.removeNotificationListener(notificationHandler);
      systemTray.hideTrayIcon();
      window.removeEventListener('notification-dismissed', handleNotificationDismissed as EventListener);
    };
  }, []);
  
  // Load user preferences from MongoDB when component mounts
  useEffect(() => {
    const systemTray = SystemTrayService.getInstance();
    
    if (user) {
      // Try to load preferences from MongoDB
      systemTray.loadPreferences(user.id)
        .catch(error => {
          console.error('Failed to load preferences:', error);
        });
    }
  }, [user]);

  // Sync focus mode settings with system tray service
  useEffect(() => {
    const systemTray = SystemTrayService.getInstance();
    
    // Update focus mode settings in SystemTrayService
    systemTray.setFocusMode(isFocusMode);
    systemTray.setFocusModeWhitelist(whitelist);
    
  }, [isFocusMode, whitelist]);
  
  return { isTrayActive };
}
