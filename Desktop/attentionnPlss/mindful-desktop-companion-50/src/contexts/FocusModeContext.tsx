import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import SystemTrayService from '@/services/SystemTrayService';
import { toast } from "sonner";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';

interface FocusModeContextType {
  isFocusMode: boolean;
  toggleFocusMode: () => void;
  whitelist: string[];
  addToWhitelist: (app: string) => void;
  removeFromWhitelist: (app: string) => void;
  dimInsteadOfBlock: boolean;
  toggleDimOption: () => void;
  currentActiveApp: string | null;
  isCurrentAppWhitelisted: boolean;
  customImage: string | null;
  customText: string | null;
  updateCustomText: (text: string) => void;
  updateCustomImage: (imageUrl: string | null) => void;
  testFocusModePopup: () => void;
}

const FocusModeContext = createContext<FocusModeContextType | undefined>(undefined);

// Define the hook here - removed the duplicate definition at the end of the file
export const useFocusMode = () => {
  const context = useContext(FocusModeContext);
  if (context === undefined) {
    throw new Error('useFocusMode must be used within a FocusModeProvider');
  }
  return context;
};

// Constants for improved notification management
const NOTIFICATION_COOLDOWN = 2000; // Reduced cooldown for more responsive notifications
const DEFAULT_WHITELIST_APPS = ['Mindful Desktop Companion', 'Electron', 'electron', 'chrome-devtools']; 
// Idle timeout - trigger notification after this amount of time in a different app
const IDLE_RESET_TIMEOUT = 10000; // Reduced to 10 seconds for more responsive detection
// App switch memory - don't show duplicate notifications until this time passes
const APP_SWITCH_MEMORY = 30000; // Reduced to 30 seconds

export const FocusModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  // Use user?.id as userId, defaulting to 'guest' if not available
  const userId = user?.id || 'guest';
  
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [dimInsteadOfBlock, setDimInsteadOfBlock] = useState(true);
  const [lastActiveWindow, setLastActiveWindow] = useState<string | null>(null);
  const [previousActiveWindow, setPreviousActiveWindow] = useState<string | null>(null);
  const [lastNotificationDismissed, setLastNotificationDismissed] = useState<string | null>(null);
  const [showingAlert, setShowingAlert] = useState(false);
  const [currentAlertApp, setCurrentAlertApp] = useState<string | null>(null);
  
  // Add tracking variables for real-time monitoring
  const [checkInterval, setCheckInterval] = useState<NodeJS.Timeout | null>(null);
  const [notificationShown, setNotificationShown] = useState<Record<string, boolean>>({});
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [customText, setCustomText] = useState<string | null>(null); // For custom notification text
  const [wasInWhitelistedApp, setWasInWhitelistedApp] = useState(false);
  
  // Track when we switched from whitelisted app to non-whitelisted
  const [lastNotifiedApp, setLastNotifiedApp] = useState<string | null>(null);
  
  // New state for the Live Whitelist Match Preview feature
  const [currentActiveApp, setCurrentActiveApp] = useState<string | null>(null);
  const [isCurrentAppWhitelisted, setIsCurrentAppWhitelisted] = useState(false);
  
  // Enhanced window info from active-win
  const [activeWindowInfo, setActiveWindowInfo] = useState<any>(null);
  
  // Track the last time a notification was shown for each app
  const appNotificationTimestamps = useRef<Record<string, number>>({});
  const [processedAppSwitches, setProcessedAppSwitches] = useState<Map<string, number>>(new Map());
  
  // Track if we already processed a switch to avoid duplicate popups
  const [processedSwitches, setProcessedSwitches] = useState<Set<string>>(new Set());
  
  // Store the timestamp of the last popup shown to implement cooldown
  const lastPopupShownTime = useRef<number>(0);
  
  // Track the last time each app was active to implement idle reset
  const appLastActiveTime = useRef<Record<string, number>>({});
  
  // Debounce for handling non-whitelisted app notifications
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isHandlingNotificationRef = useRef<boolean>(false);

  // Track current user to reset focus mode state on user change
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Enhanced handler for non-whitelisted apps to use rich media popup
  const handleNonWhitelistedApp = useCallback((appName: string) => {
    // Skip notification for system apps
    if (DEFAULT_WHITELIST_APPS.some(defaultApp => 
        appName.toLowerCase().includes(defaultApp.toLowerCase()) ||
        defaultApp.toLowerCase().includes(appName.toLowerCase()))) {
      return;
    }
    
    console.log("Handling non-whitelisted app:", appName);
    console.log("Using custom image:", customImage);
    console.log("Using custom text:", customText);
    
    // Update tracking to remember we've shown notification for this app
    setLastNotifiedApp(appName);
    
    // Get the custom image and text from state
    const imageUrl = customImage;
    const alertText = customText || `You're outside your focus zone. {app} is not in your whitelist.`;
    
    // Set current alert app name and show the alert
    setCurrentAlertApp(appName);
    setShowingAlert(true);
    
    // Create a unique notification ID with timestamp and app name
    const notificationId = `focus-mode-${appName}-${Date.now()}`;
    
    // Use rich media popup for focus mode alerts
    const focusRuleEvent = new CustomEvent('show-focus-popup', { 
      detail: {
        title: "Focus Mode Alert",
        body: alertText.replace('{app}', appName),
        notificationId: notificationId,
        mediaType: imageUrl ? 'image' : 'none',
        mediaContent: imageUrl,
        appName: appName
      }
    });
    
    console.log("Dispatching focus popup event with image:", imageUrl);
    window.dispatchEvent(focusRuleEvent);
    
    // If we're in dim mode, apply dimming effect to the screen
    if (dimInsteadOfBlock) {
      applyDimEffect();
    }
    
    // Update the timestamp for this app's notification
    appNotificationTimestamps.current[appName] = Date.now();
    lastPopupShownTime.current = Date.now();
  }, [customImage, customText, dimInsteadOfBlock]);

  // Reset focus mode state when user changes
  useEffect(() => {
    if (currentUserId !== userId) {
      console.log(`User changed from ${currentUserId} to ${userId}, resetting focus mode state`);
      
      // Reset focus mode to default (off) for new user
      setIsFocusMode(false);
      
      // Reset other tracking state
      setNotificationShown({});
      setWasInWhitelistedApp(false);
      setLastNotifiedApp(null);
      setProcessedSwitches(new Set());
      appNotificationTimestamps.current = {};
      lastPopupShownTime.current = 0;
      isHandlingNotificationRef.current = false;
      
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      
      setCurrentUserId(userId);
    }
  }, [userId, currentUserId]);

  // Load custom text and image on initial mount
  useEffect(() => {
    console.log("Loading focus mode preferences for user:", userId);
    
    const savedCustomText = localStorage.getItem(`focusModeCustomText-${userId}`);
    if (savedCustomText) {
      console.log("Found saved custom text:", savedCustomText);
      setCustomText(savedCustomText);
    } else {
      // Default text
      const defaultText = "You're outside your focus zone. {app} is not in your whitelist.";
      console.log("Setting default custom text:", defaultText);
      setCustomText(defaultText);
      localStorage.setItem(`focusModeCustomText-${userId}`, defaultText);
    }

    const savedCustomImage = localStorage.getItem(`focusModeCustomImage-${userId}`);
    if (savedCustomImage) {
      console.log("Found saved custom image URL:", savedCustomImage);
      setCustomImage(savedCustomImage);
    } else {
      // Default image
      const defaultImage = 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b';
      console.log("Setting default custom image:", defaultImage);
      setCustomImage(defaultImage);
      localStorage.setItem(`focusModeCustomImage-${userId}`, defaultImage);
    }
  }, [userId]);

  // Add this new effect to prevent window glitching when focus mode is toggled
  useEffect(() => {
    // Send stabilize message to main process when focus mode changes
    if (window.electron) {
      // Small delay to avoid race conditions
      const stabilizeTimer = setTimeout(() => {
        window.electron.send('stabilize-window', { 
          isFocusMode,
          timestamp: Date.now()
        });
      }, 100);
      
      return () => clearTimeout(stabilizeTimer);
    }
  }, [isFocusMode]);

  // Load saved whitelist from localStorage on initial mount
  useEffect(() => {
    const savedWhitelist = localStorage.getItem(`focusModeWhitelist-${userId}`);
    if (savedWhitelist) {
      try {
        // Merge with default whitelist apps to ensure Electron app is always whitelisted
        const savedApps = JSON.parse(savedWhitelist);
        setWhitelist([...new Set([...savedApps, ...DEFAULT_WHITELIST_APPS])]);
      } catch (e) {
        console.error("Failed to parse whitelist:", e);
        setWhitelist([...DEFAULT_WHITELIST_APPS]);
      }
    } else {
      // Set default whitelist if none exists
      setWhitelist([...DEFAULT_WHITELIST_APPS]);
    }
    
    const savedDimOption = localStorage.getItem(`focusModeDimOption-${userId}`);
    if (savedDimOption) {
      try {
        setDimInsteadOfBlock(JSON.parse(savedDimOption) === true);
      } catch (e) {
        console.error("Failed to parse dim option:", e);
      }
    }
    
    // Load saved focus mode state - but only set it if it was explicitly saved as true
    const savedFocusMode = localStorage.getItem(`focusModeEnabled-${userId}`);
    if (savedFocusMode === 'true') {
      setIsFocusMode(true);
    } else {
      // Ensure it's explicitly set to false for new users
      setIsFocusMode(false);
    }
    
    // Register for active window change events using custom event listener
    const handleActiveWindowChanged = (event: CustomEvent<any>) => {
      const windowInfo = event.detail;
      
      // Extract the complete window info
      const newWindow = typeof windowInfo === 'string' ? windowInfo : windowInfo.title;
      
      // Store the complete window info
      setActiveWindowInfo(windowInfo);
      
      // Extract app name from window info for better matching
      let appName;
      if (typeof windowInfo === 'object') {
        // Get the most reliable identifier for the app
        appName = windowInfo.owner?.name || windowInfo.appName || extractAppName(windowInfo.title);
        setCurrentActiveApp(appName);
      } else {
        appName = extractAppName(windowInfo);
        setCurrentActiveApp(appName);
      }
      
      console.log("Window changed to:", newWindow);
      console.log("App name detected:", appName);
      
      // Update previous window info and current window info
      setPreviousActiveWindow(lastActiveWindow);
      setLastActiveWindow(newWindow);
      
      // Record the time this app was last active
      if (appName) {
        appLastActiveTime.current[appName] = Date.now();
      }
      
      // Check if this app is whitelisted and update the state
      const isWhitelisted = isAppInWhitelist(appName, whitelist);
      setIsCurrentAppWhitelisted(isWhitelisted);
    };
    
    // Track dismissed notifications
    const handleNotificationDismissed = (event: CustomEvent<string>) => {
      console.log("Notification dismissed:", event.detail);
      setLastNotificationDismissed(event.detail);
      
      // Only clear alert if it matches the one being dismissed
      if (currentAlertApp && event.detail.includes(currentAlertApp)) {
        setShowingAlert(false);
      }
    };
    
    window.addEventListener('active-window-changed', handleActiveWindowChanged as EventListener);
    window.addEventListener('notification-dismissed', handleNotificationDismissed as EventListener);
    
    // Request the current active window
    if (window.electron) {
      window.electron.send('get-active-window');
    }
    
    return () => {
      window.removeEventListener('active-window-changed', handleActiveWindowChanged as EventListener);
      window.removeEventListener('notification-dismissed', handleNotificationDismissed as EventListener);
      
      // Clear interval when unmounting
      if (checkInterval) {
        clearInterval(checkInterval);
      }
      
      // Clear any existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [lastActiveWindow, currentAlertApp, checkInterval, userId]);
  
  // Save whitelist whenever it changes
  useEffect(() => {
    try {
      // Always ensure the Electron app is whitelisted
      const updatedWhitelist = [...new Set([...whitelist, ...DEFAULT_WHITELIST_APPS])];
      localStorage.setItem(`focusModeWhitelist-${userId}`, JSON.stringify(updatedWhitelist));
      
      // Update the state if we added any new default apps
      if (updatedWhitelist.length !== whitelist.length) {
        setWhitelist(updatedWhitelist);
      }
    } catch (e) {
      console.error("Failed to save whitelist:", e);
    }
  }, [whitelist, userId]);
  
  // Save dim option whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(`focusModeDimOption-${userId}`, JSON.stringify(dimInsteadOfBlock));
    } catch (e) {
      console.error("Failed to save dim option:", e);
    }
  }, [dimInsteadOfBlock, userId]);
  
  // Save focus mode state
  useEffect(() => {
    try {
      localStorage.setItem(`focusModeEnabled-${userId}`, isFocusMode ? 'true' : 'false');
    } catch (e) {
      console.error("Failed to save focus mode state:", e);
    }
  }, [isFocusMode, userId]);

  // Save custom text whenever it changes
  useEffect(() => {
    if (customText) {
      try {
        localStorage.setItem(`focusModeCustomText-${userId}`, customText);
      } catch (e) {
        console.error("Failed to save custom text:", e);
      }
    }
  }, [customText, userId]);
  
  // Start or stop real-time active window monitoring based on focus mode state
  useEffect(() => {
    // Clear any existing interval
    if (checkInterval) {
      clearInterval(checkInterval);
      setCheckInterval(null);
    }
    
    // Reset tracking state when focus mode changes
    setNotificationShown({});
    setWasInWhitelistedApp(false);
    setLastNotifiedApp(null);
    setProcessedSwitches(new Set());
    appNotificationTimestamps.current = {}; // Clear all app notification timestamps
    
    // Only start real-time monitoring if focus mode is active
    if (isFocusMode) {
      console.log("Starting real-time active window monitoring");
      
      // Check every 1 second for more responsive detection
      const interval = setInterval(() => {
        // Request current active window from electron main process
        if (window.electron) {
          window.electron.send('get-active-window');
        }
        
        // Check current window against whitelist if we have a lastActiveWindow value
        if (lastActiveWindow) {
          checkActiveWindowAgainstWhitelist(lastActiveWindow);
        }
      }, 1000);
      
      setCheckInterval(interval);
      
      // Initial check right away when focus mode is enabled
      if (lastActiveWindow) {
        checkActiveWindowAgainstWhitelist(lastActiveWindow);
      }
    } else {
      // Clear any alerts when focus mode is disabled
      setShowingAlert(false);
    }
    
    return () => {
      if (checkInterval) {
        clearInterval(checkInterval);
      }
    };
  }, [isFocusMode]);
  
  // Simplified effect to handle app switches - trigger on every switch from whitelisted to non-whitelisted
  useEffect(() => {
    if (!isFocusMode || !lastActiveWindow) return;
    
    // Get app name from active window info if available, otherwise extract from title
    let currentAppName;
    if (activeWindowInfo && typeof activeWindowInfo === 'object') {
      currentAppName = activeWindowInfo.owner?.name || 
                       activeWindowInfo.appName || 
                       extractAppName(activeWindowInfo.title);
    } else {
      currentAppName = extractAppName(lastActiveWindow);
    }
    
    // Always check against updated whitelist that includes default apps
    const mergedWhitelist = [...new Set([...whitelist, ...DEFAULT_WHITELIST_APPS])];
    const isCurrentAppWhitelisted = isAppInWhitelist(currentAppName, mergedWhitelist);
    
    console.log(`App switch detected: ${currentAppName}, whitelisted: ${isCurrentAppWhitelisted}, wasInWhitelisted: ${wasInWhitelistedApp}`);
    
    // Show notification when switching from whitelisted to non-whitelisted app
    if (wasInWhitelistedApp && !isCurrentAppWhitelisted && currentAppName) {
      const now = Date.now();
      const lastNotificationTime = appNotificationTimestamps.current[currentAppName] || 0;
      
      // Only show if enough time has passed since last notification for this app
      if (now - lastNotificationTime > NOTIFICATION_COOLDOWN) {
        console.log(`Showing focus notification for app switch: ${currentAppName}`);
        handleNonWhitelistedApp(currentAppName);
        appNotificationTimestamps.current[currentAppName] = now;
      }
    }
    
    // Update tracking state for next comparison
    setWasInWhitelistedApp(isCurrentAppWhitelisted);
    
  }, [lastActiveWindow, isFocusMode, whitelist, activeWindowInfo, wasInWhitelistedApp]);
  
  // Function to check if active window is whitelisted and handle notifications
  const checkActiveWindowAgainstWhitelist = useCallback((windowTitle: string) => {
    if (!isFocusMode) return;
    
    // Get app name from active window info if available, otherwise extract from title
    let currentAppName;
    if (activeWindowInfo && typeof activeWindowInfo === 'object') {
      currentAppName = activeWindowInfo.owner?.name || 
                       activeWindowInfo.appName || 
                       extractAppName(activeWindowInfo.title);
    } else {
      currentAppName = extractAppName(windowTitle);
    }
    
    // Also grab executable/process name if available
    let executableName = '';
    if (activeWindowInfo && typeof activeWindowInfo === 'object') {
      if (activeWindowInfo.owner?.path) {
        const pathParts = activeWindowInfo.owner.path.split(/[/\\]/);
        executableName = pathParts[pathParts.length - 1]; // Get the last part of the path
      }
    }
    
    // Always include default whitelist apps
    const mergedWhitelist = [...new Set([...whitelist, ...DEFAULT_WHITELIST_APPS])];
    
    // Check if the current app is in the whitelist using improved matching
    const isCurrentAppWhitelisted = isAppInWhitelist(currentAppName, mergedWhitelist) || 
                                   (executableName && isAppInWhitelist(executableName, mergedWhitelist));
    
    // Update the state for the Live Whitelist Match Preview feature
    setCurrentActiveApp(currentAppName);
    setIsCurrentAppWhitelisted(isCurrentAppWhitelisted);
    
    // If app is now whitelisted but we were showing an alert for it, clear the alert
    if (showingAlert && currentAlertApp && isAppInWhitelist(currentAlertApp, mergedWhitelist)) {
      console.log("App is now whitelisted, clearing alert");
      setShowingAlert(false);
    }
    
  }, [isFocusMode, whitelist, showingAlert, currentAlertApp, activeWindowInfo]);
  
  // Extract the core app name from window title for more reliable matching
  const extractAppName = (windowTitle: string): string => {
    if (!windowTitle) return '';
    
    // Common patterns in window titles
    const appNameMatches = windowTitle.match(/^(.*?)(?:\s[-–—]\s|\s\|\s|\s:|\s\d|$)/);
    return appNameMatches?.[1]?.trim() || windowTitle.trim();
  };
  
  // Significantly improved app matching against whitelist with enhanced fuzzy matching
  const isAppInWhitelist = (appName: string, whitelist: string[]): boolean => {
    if (!appName) return false;
    
    // Normalize the app name for better matching - lowercase and remove special characters
    const normalizedAppName = appName.toLowerCase().replace(/[^\w\s.-]/g, '');
    
    // Try to extract filename or process name if it's an exe
    const processMatch = normalizedAppName.match(/([^\\\/]+)(?:\.exe)?$/i);
    const processName = processMatch ? processMatch[1].toLowerCase() : '';
    
    // Special case for Electron app - always consider it whitelisted
    if (normalizedAppName.includes('electron') || 
        normalizedAppName.includes('mindful desktop companion') ||
        (processName && (processName.includes('electron') || processName.includes('mindful')))) {
      return true;
    }
    
    console.log(`Checking app: "${normalizedAppName}" against whitelist:`, whitelist);
    
    return whitelist.some(whitelistedApp => {
      // Normalize whitelist entry
      const normalizedWhitelistedApp = whitelistedApp.toLowerCase().replace(/[^\w\s.-]/g, '');
      
      console.log(`  Comparing "${normalizedAppName}" with "${normalizedWhitelistedApp}"`);
      
      // Direct match
      if (normalizedAppName === normalizedWhitelistedApp) {
        console.log(`  ✓ Direct match`);
        return true;
      }
      
      // Partial matches in either direction - more lenient matching
      if (normalizedAppName.includes(normalizedWhitelistedApp) || 
          normalizedWhitelistedApp.includes(normalizedAppName)) {
        console.log(`  ✓ Partial match`);
        return true;
      }
      
      // Process name matches (for .exe files)
      if (processName && (
          normalizedWhitelistedApp.includes(processName) || 
          processName.includes(normalizedWhitelistedApp))) {
        console.log(`  ✓ Process name match`);
        return true;
      }
      
      // Match with bundle ID components (e.g., com.microsoft.vscode)
      if (activeWindowInfo && 
          activeWindowInfo.owner && 
          activeWindowInfo.owner.bundleId) {
        
        const bundleId = activeWindowInfo.owner.bundleId.toLowerCase();
        const bundleParts = bundleId.split('.');
        
        // Check all parts of the bundle ID (e.g., "microsoft", "vscode")
        const bundleMatch = bundleParts.some(part => 
          part.includes(normalizedWhitelistedApp) || 
          normalizedWhitelistedApp.includes(part));
          
        if (bundleMatch) {
          console.log(`  ✓ Bundle ID match`);
          return true;
        }
      }
      
      // Match executable name parts
      if (activeWindowInfo && activeWindowInfo.owner && activeWindowInfo.owner.path) {
        const pathParts = activeWindowInfo.owner.path.toLowerCase().split(/[/\\]/);
        const exeName = pathParts[pathParts.length - 1]; // Last part is the exe name
        
        if (exeName && (
            exeName.includes(normalizedWhitelistedApp) || 
            normalizedWhitelistedApp.includes(exeName))) {
          console.log(`  ✓ Executable name match`);
          return true;
        }
        
        // Also match against executable name without extension
        const exeNameNoExt = exeName.replace(/\.exe$/i, '');
        if (exeNameNoExt && (
            exeNameNoExt.includes(normalizedWhitelistedApp) || 
            normalizedWhitelistedApp.includes(exeNameNoExt))) {
          console.log(`  ✓ Executable name (no ext) match`);
          return true;
        }
      }
      
      // Match window title components (split by spaces, dashes, etc) - more flexible
      const titleParts = normalizedAppName.split(/[\s-_\.]+/).filter(part => part.length > 2); // Filter out very short parts
      const whitelistParts = normalizedWhitelistedApp.split(/[\s-_\.]+/).filter(part => part.length > 2);
      
      // Check if any significant part of the whitelist app name appears in the title
      const titlePartsMatch = whitelistParts.some(whitelistPart => 
        titleParts.some(titlePart => 
          titlePart.includes(whitelistPart) || 
          whitelistPart.includes(titlePart)
        )
      );
      
      if (titlePartsMatch) {
        console.log(`  ✓ Title parts match`);
        return true;
      }
      
      // Special handling for common browser names
      const browserNames = ['chrome', 'firefox', 'safari', 'edge', 'opera', 'brave'];
      const isBrowser = browserNames.some(browser => 
        normalizedAppName.includes(browser) || normalizedWhitelistedApp.includes(browser));
      
      if (isBrowser) {
        // For browsers, be more lenient with matching
        const browserMatch = browserNames.some(browser => 
          (normalizedAppName.includes(browser) && normalizedWhitelistedApp.includes(browser)) ||
          (normalizedAppName.includes('microsoft') && normalizedWhitelistedApp.includes('edge')) ||
          (normalizedAppName.includes('edge') && normalizedWhitelistedApp.includes('microsoft'))
        );
        
        if (browserMatch) {
          console.log(`  ✓ Browser match`);
          return true;
        }
      }
      
      console.log(`  ✗ No match`);
      return false;
    });
  };
  
  // Focus mode toggle without notifications
  const toggleFocusMode = useCallback(() => {
    const newState = !isFocusMode;
    
    // Send stabilize message first to prevent UI glitches
    if (window.electron) {
      window.electron.send('stabilize-window', { 
        operation: 'pre-focus-toggle',
        timestamp: Date.now()
      });
    }
    
    // Update state immediately
    setIsFocusMode(newState);
    
    // Reset tracking state when toggling focus mode
    setNotificationShown({});
    setWasInWhitelistedApp(false);
    setLastNotifiedApp(null);
    setProcessedSwitches(new Set());
    
    // Reset notification timestamps and flags
    appNotificationTimestamps.current = {};
    lastPopupShownTime.current = 0;
    isHandlingNotificationRef.current = false;
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    
    // Send to electron main process to update tray icon
    if (window.electron) {
      window.electron.send('toggle-focus-mode', newState);
      
      // Add a stabilization message to prevent UI glitches
      window.electron.send('stabilize-window', { 
        isFocusMode: newState,
        timestamp: Date.now()
      });
    }
    
    if (newState) {
      // Immediately check current window against whitelist
      if (lastActiveWindow) {
        const currentAppName = extractAppName(lastActiveWindow);
        const mergedWhitelist = [...new Set([...whitelist, ...DEFAULT_WHITELIST_APPS])];
        const isCurrentAppWhitelisted = isAppInWhitelist(currentAppName, mergedWhitelist);
        
        // Update tracking state based on current app
        setWasInWhitelistedApp(isCurrentAppWhitelisted);
        
        if (!isCurrentAppWhitelisted && currentAppName) {
          // Small delay to allow toggle to complete first
          setTimeout(() => {
            handleNonWhitelistedApp(currentAppName);
          }, 500);
        }
      }
    } else {
      // Clear any alert when disabling focus mode
      setShowingAlert(false);
      setCurrentAlertApp(null);
    }
  }, [isFocusMode, lastActiveWindow, whitelist, handleNonWhitelistedApp]);

  // Add missing function implementations
  const addToWhitelist = useCallback((app: string) => {
    if (app && !whitelist.includes(app)) {
      const newWhitelist = [...whitelist, app];
      setWhitelist(newWhitelist);
    }
  }, [whitelist]);

  const removeFromWhitelist = useCallback((app: string) => {
    const newWhitelist = whitelist.filter(item => item !== app);
    setWhitelist(newWhitelist);
  }, [whitelist]);

  const toggleDimOption = useCallback(() => {
    setDimInsteadOfBlock(!dimInsteadOfBlock);
  }, [dimInsteadOfBlock]);

  const updateCustomText = useCallback((text: string) => {
    setCustomText(text);
  }, []);

  const updateCustomImage = useCallback((imageUrl: string | null) => {
    setCustomImage(imageUrl);
    if (imageUrl) {
      localStorage.setItem(`focusModeCustomImage-${userId}`, imageUrl);
    } else {
      localStorage.removeItem(`focusModeCustomImage-${userId}`);
    }
  }, [userId]);

  const testFocusModePopup = useCallback(() => {
    handleNonWhitelistedApp("Test Application");
  }, [handleNonWhitelistedApp]);

  // Helper functions
  const applyDimEffect = () => {
    // In a real implementation, we would dim the screen via Electron
    console.log("Applying dimming effect to screen");
    if (window.electron) {
      window.electron.send('apply-screen-dim', { 
        opacity: 0.7 
      });
    }
  };

  // Create the context value object
  const contextValue: FocusModeContextType = {
    isFocusMode,
    toggleFocusMode,
    whitelist,
    addToWhitelist,
    removeFromWhitelist,
    dimInsteadOfBlock,
    toggleDimOption,
    currentActiveApp,
    isCurrentAppWhitelisted,
    customImage,
    customText,
    updateCustomText,
    updateCustomImage,
    testFocusModePopup
  };

  return (
    <FocusModeContext.Provider value={contextValue}>
      {children}
    </FocusModeContext.Provider>
  );
};
