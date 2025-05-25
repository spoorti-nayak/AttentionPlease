
import { useEffect, useState } from 'react';
import BlinkDetectionService from '@/services/BlinkDetectionService';
import { useToast } from '@/hooks/use-toast';
import { useSystemTray } from '@/hooks/use-system-tray';

export function useBlinkDetection() {
  const [isDetecting, setIsDetecting] = useState(false);
  const [isSupported] = useState(true); // Always supported now since we use timers
  const [isInitializing, setIsInitializing] = useState(false);
  const { toast } = useToast();
  const { isTrayActive } = useSystemTray();
  
  useEffect(() => {
    setIsInitializing(false); // No initialization needed
    
    // Start detection if we're in tray mode
    if (isTrayActive && !isDetecting) {
      startDetection();
    }
  }, [isTrayActive, isDetecting]);
  
  useEffect(() => {
    const blinkService = BlinkDetectionService.getInstance();
    
    // Handler for blink reminders
    const handleBlinkReminder = (message: string) => {
      toast({
        title: "Blink Reminder",
        description: message,
        duration: 8000,
      });
    };
    
    // Add listener when component mounts
    blinkService.addBlinkRateListener(handleBlinkReminder);
    
    // Clean up when component unmounts
    return () => {
      blinkService.removeBlinkRateListener(handleBlinkReminder);
      stopDetection();
    };
  }, [toast]);
  
  // Start blink detection
  const startDetection = async () => {
    const blinkService = BlinkDetectionService.getInstance();
    const started = await blinkService.startDetection();
    
    if (started) {
      setIsDetecting(true);
      return true;
    }
    
    return false;
  };
  
  // Stop blink detection
  const stopDetection = () => {
    const blinkService = BlinkDetectionService.getInstance();
    blinkService.stopDetection();
    setIsDetecting(false);
  };
  
  // Toggle blink detection
  const toggleDetection = async () => {
    if (isDetecting) {
      stopDetection();
      return false;
    } else {
      return await startDetection();
    }
  };
  
  return {
    isDetecting,
    isSupported,
    isInitializing,
    startDetection,
    stopDetection,
    toggleDetection
  };
}
