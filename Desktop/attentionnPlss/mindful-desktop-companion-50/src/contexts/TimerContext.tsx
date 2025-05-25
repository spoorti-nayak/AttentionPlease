import { createContext, useContext, useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface TimerSettings {
  pomodoroDuration: number;
  pomodoroBreakDuration: number;
  eyeCareWorkDuration: number;
  eyeCareRestDuration: number;
}

interface TimerContextState {
  // Pomodoro Timer state
  pomodoroMinutes: number;
  pomodoroSeconds: number;
  isPomodoroActive: boolean;
  isPomodoroBreak: boolean;
  pomodoroDuration: number;
  pomodoroBreakDuration: number;
  pomodoroProgress: number;
  
  // Eye Care Timer state
  eyeCareTimeElapsed: number;
  isEyeCareActive: boolean;
  isEyeCareResting: boolean;
  eyeCareRestProgress: number;
  eyeCareWorkDuration: number;
  eyeCareRestDuration: number;
  
  // Functions
  startPomodoroTimer: () => void;
  pausePomodoroTimer: () => void;
  resetPomodoroTimer: (isBreakTime?: boolean) => void;
  
  startEyeCareTimer: () => void;
  pauseEyeCareTimer: () => void;
  resetEyeCareTimer: () => void;
  
  // Settings functions
  updateTimerSettings: (settings: TimerSettings) => void;
}

const TimerContext = createContext<TimerContextState | undefined>(undefined);

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const userId = user?.id || 'guest';
  
  // Track if this is the initial load to prevent showing success toast
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Pomodoro Timer state with user-specific keys
  const [pomodoroMinutes, setPomodoroMinutes] = useState(() => {
    const saved = localStorage.getItem(`pomodoroMinutes-${userId}`);
    return saved ? parseInt(saved) : 25;
  });
  const [pomodoroSeconds, setPomodoroSeconds] = useState(() => {
    const saved = localStorage.getItem(`pomodoroSeconds-${userId}`);
    return saved ? parseInt(saved) : 0;
  });
  const [isPomodoroActive, setIsPomodoroActive] = useState(() => {
    const saved = localStorage.getItem(`isPomodoroActive-${userId}`);
    return saved ? saved === "true" : false;
  });
  const [isPomodoroBreak, setIsPomodoroBreak] = useState(() => {
    const saved = localStorage.getItem(`isPomodoroBreak-${userId}`);
    return saved ? saved === "true" : false;
  });
  const [pomodoroProgress, setPomodoroProgress] = useState(() => {
    const saved = localStorage.getItem(`pomodoroProgress-${userId}`);
    return saved ? parseFloat(saved) : 100;
  });
  const [pomodoroDuration, setPomodoroDuration] = useState(() => {
    const saved = localStorage.getItem(`pomodoroDuration-${userId}`);
    return saved ? parseInt(saved) : 25;
  });
  const [pomodoroBreakDuration, setPomodoroBreakDuration] = useState(() => {
    const saved = localStorage.getItem(`pomodoroBreakDuration-${userId}`);
    return saved ? parseInt(saved) : 5;
  });
  
  // Eye Care Timer state with user-specific keys
  const [eyeCareTimeElapsed, setEyeCareTimeElapsed] = useState(() => {
    const saved = localStorage.getItem(`eyeCareTimeElapsed-${userId}`);
    return saved ? parseInt(saved) : 0;
  });
  const [isEyeCareActive, setIsEyeCareActive] = useState(() => {
    const saved = localStorage.getItem(`isEyeCareActive-${userId}`);
    return saved ? saved === "true" : true; // Auto-start eye care timer for new users
  });
  const [isEyeCareResting, setIsEyeCareResting] = useState(() => {
    const saved = localStorage.getItem(`isEyeCareResting-${userId}`);
    return saved ? saved === "true" : false;
  });
  const [eyeCareRestProgress, setEyeCareRestProgress] = useState(() => {
    const saved = localStorage.getItem(`eyeCareRestProgress-${userId}`);
    return saved ? parseFloat(saved) : 0;
  });
  const [eyeCareWorkDuration, setEyeCareWorkDuration] = useState(() => {
    const saved = localStorage.getItem(`eyeCareWorkDuration-${userId}`);
    return saved ? parseInt(saved) : 20 * 60; // Default: 20 minutes
  });
  const [eyeCareRestDuration, setEyeCareRestDuration] = useState(() => {
    const saved = localStorage.getItem(`eyeCareRestDuration-${userId}`);
    return saved ? parseInt(saved) : 20; // Default: 20 seconds
  });

  // Reset timers when user changes and auto-start them
  useEffect(() => {
    if (currentUserId !== userId) {
      console.log(`User changed from ${currentUserId} to ${userId}, resetting and auto-starting timers`);
      
      // Reset all timer states to defaults for new user
      setPomodoroMinutes(25);
      setPomodoroSeconds(0);
      setIsPomodoroActive(false);
      setIsPomodoroBreak(false);
      setPomodoroProgress(100);
      setPomodoroDuration(25);
      setPomodoroBreakDuration(5);
      
      setEyeCareTimeElapsed(0);
      setIsEyeCareActive(true); // Auto-start eye care timer
      setIsEyeCareResting(false);
      setEyeCareRestProgress(0);
      setEyeCareWorkDuration(20 * 60);
      setEyeCareRestDuration(20);
      
      setCurrentUserId(userId);
      setIsInitialized(true);
    }
  }, [userId, currentUserId]);

  // Save Pomodoro state to localStorage with user-specific keys
  useEffect(() => {
    localStorage.setItem(`pomodoroMinutes-${userId}`, pomodoroMinutes.toString());
    localStorage.setItem(`pomodoroSeconds-${userId}`, pomodoroSeconds.toString());
    localStorage.setItem(`isPomodoroActive-${userId}`, isPomodoroActive.toString());
    localStorage.setItem(`isPomodoroBreak-${userId}`, isPomodoroBreak.toString());
    localStorage.setItem(`pomodoroProgress-${userId}`, pomodoroProgress.toString());
    localStorage.setItem(`pomodoroDuration-${userId}`, pomodoroDuration.toString());
    localStorage.setItem(`pomodoroBreakDuration-${userId}`, pomodoroBreakDuration.toString());
  }, [pomodoroMinutes, pomodoroSeconds, isPomodoroActive, isPomodoroBreak, pomodoroProgress, pomodoroDuration, pomodoroBreakDuration, userId]);

  // Save Eye Care state to localStorage with user-specific keys
  useEffect(() => {
    localStorage.setItem(`eyeCareTimeElapsed-${userId}`, eyeCareTimeElapsed.toString());
    localStorage.setItem(`isEyeCareActive-${userId}`, isEyeCareActive.toString());
    localStorage.setItem(`isEyeCareResting-${userId}`, isEyeCareResting.toString());
    localStorage.setItem(`eyeCareRestProgress-${userId}`, eyeCareRestProgress.toString());
    localStorage.setItem(`eyeCareWorkDuration-${userId}`, eyeCareWorkDuration.toString());
    localStorage.setItem(`eyeCareRestDuration-${userId}`, eyeCareRestDuration.toString());
  }, [eyeCareTimeElapsed, isEyeCareActive, isEyeCareResting, eyeCareRestProgress, eyeCareWorkDuration, eyeCareRestDuration, userId]);

  // Function to update timer settings - removed the unwanted toast notification
  const updateTimerSettings = (settings: TimerSettings) => {
    // Update Pomodoro settings
    setPomodoroDuration(settings.pomodoroDuration);
    setPomodoroBreakDuration(settings.pomodoroBreakDuration);
    
    // Update Eye Care settings
    setEyeCareWorkDuration(settings.eyeCareWorkDuration);
    setEyeCareRestDuration(settings.eyeCareRestDuration);
    
    // Save settings to localStorage for persistence with user-specific keys
    localStorage.setItem(`pomodoroDuration-${userId}`, settings.pomodoroDuration.toString());
    localStorage.setItem(`pomodoroBreakDuration-${userId}`, settings.pomodoroBreakDuration.toString());
    localStorage.setItem(`eyeCareWorkDuration-${userId}`, settings.eyeCareWorkDuration.toString());
    localStorage.setItem(`eyeCareRestDuration-${userId}`, settings.eyeCareRestDuration.toString());
    
    // If timers are currently inactive, reset them with new durations
    if (!isPomodoroActive) {
      setPomodoroMinutes(isPomodoroBreak ? settings.pomodoroBreakDuration : settings.pomodoroDuration);
      setPomodoroSeconds(0);
      setPomodoroProgress(100);
    }
    
    if (!isEyeCareActive) {
      setEyeCareTimeElapsed(0);
      setIsEyeCareResting(false);
      setEyeCareRestProgress(0);
    }
  };

  // Pomodoro Timer Logic
  useEffect(() => {
    const totalSeconds = isPomodoroBreak 
      ? pomodoroBreakDuration * 60 
      : pomodoroDuration * 60;
      
    let interval: NodeJS.Timeout | null = null;

    if (isPomodoroActive) {
      interval = setInterval(() => {
        if (pomodoroSeconds === 0) {
          if (pomodoroMinutes === 0) {
            clearInterval(interval as NodeJS.Timeout);
            // Timer completed
            if (isPomodoroBreak) {
              // Use centered notification for attention-related alerts
              toast({
                title: "Break time is over!",
                description: "Time to get back to work!",
              });
              resetPomodoroTimer(false);
            } else {
              // Use centered notification for attention-related alerts
              toast({
                title: "Great job! Time for a break",
                description: "Take a moment to rest your eyes and stretch.",
              });
              resetPomodoroTimer(true);
            }
            return;
          }
          setPomodoroMinutes(pomodoroMinutes - 1);
          setPomodoroSeconds(59);
        } else {
          setPomodoroSeconds(pomodoroSeconds - 1);
        }

        // Calculate progress
        const currentTotalSeconds = pomodoroMinutes * 60 + pomodoroSeconds;
        const newProgress = (currentTotalSeconds / totalSeconds) * 100;
        setPomodoroProgress(newProgress);
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPomodoroActive, pomodoroMinutes, pomodoroSeconds, isPomodoroBreak, 
      pomodoroDuration, pomodoroBreakDuration, toast]);

  // Eye Care Timer Logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isEyeCareActive) {
      interval = setInterval(() => {
        if (isEyeCareResting) {
          // During rest period
          const newRestProgress = ((eyeCareRestDuration - eyeCareTimeElapsed) / eyeCareRestDuration) * 100;
          setEyeCareRestProgress(newRestProgress);
          
          if (eyeCareTimeElapsed >= eyeCareRestDuration) {
            // Rest period ended - use centered notification for attention reminders
            toast({
              title: "Rest completed!",
              description: "Your eyes should feel refreshed now.",
            });
            resetEyeCareTimer();
          } else {
            setEyeCareTimeElapsed(eyeCareTimeElapsed + 1);
          }
        } else {
          // During work period
          if (eyeCareTimeElapsed >= eyeCareWorkDuration) {
            // Work period ended, start rest - use centered notification
            toast({
              title: "Time for an eye break!",
              description: "Look at something 20 feet away for 20 seconds.",
            });
            setEyeCareTimeElapsed(0);
            setIsEyeCareResting(true);
            setEyeCareRestProgress(100);
          } else {
            setEyeCareTimeElapsed(eyeCareTimeElapsed + 1);
          }
        }
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isEyeCareActive, eyeCareTimeElapsed, isEyeCareResting, eyeCareRestDuration, 
      eyeCareWorkDuration, toast]);

  // Pomodoro Timer functions
  const startPomodoroTimer = () => setIsPomodoroActive(true);
  const pausePomodoroTimer = () => setIsPomodoroActive(false);
  
  const resetPomodoroTimer = (isBreakTime: boolean = false) => {
    setIsPomodoroActive(false);
    if (isBreakTime) {
      setPomodoroMinutes(pomodoroBreakDuration);
      setIsPomodoroBreak(true);
    } else {
      setPomodoroMinutes(pomodoroDuration);
      setIsPomodoroBreak(false);
    }
    setPomodoroSeconds(0);
    setPomodoroProgress(100);
  };
  
  // Eye Care Timer functions
  const startEyeCareTimer = () => setIsEyeCareActive(true);
  const pauseEyeCareTimer = () => setIsEyeCareActive(false);
  
  const resetEyeCareTimer = () => {
    setEyeCareTimeElapsed(0);
    setIsEyeCareResting(false);
    setEyeCareRestProgress(0);
  };

  return (
    <TimerContext.Provider value={{
      // Pomodoro Timer state
      pomodoroMinutes,
      pomodoroSeconds,
      isPomodoroActive,
      isPomodoroBreak,
      pomodoroDuration,
      pomodoroBreakDuration,
      pomodoroProgress,
      
      // Eye Care Timer state
      eyeCareTimeElapsed,
      isEyeCareActive,
      isEyeCareResting,
      eyeCareRestProgress,
      eyeCareWorkDuration,
      eyeCareRestDuration,
      
      // Functions
      startPomodoroTimer,
      pausePomodoroTimer,
      resetPomodoroTimer,
      
      startEyeCareTimer,
      pauseEyeCareTimer,
      resetEyeCareTimer,
      
      // Settings functions
      updateTimerSettings
    }}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error("useTimer must be used within a TimerProvider");
  }
  return context;
}
