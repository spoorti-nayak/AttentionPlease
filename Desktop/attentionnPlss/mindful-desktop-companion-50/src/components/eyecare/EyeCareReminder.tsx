
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Eye, EyeOff, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTimer } from "@/contexts/TimerContext";
import { useSystemTray } from "@/hooks/use-system-tray";
import { useEyeCareTray } from "@/hooks/use-eye-care-tray"; 
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";

interface EyeCareReminderProps {
  className?: string;
}

export function EyeCareReminder({ className }: EyeCareReminderProps) {
  const {
    eyeCareTimeElapsed,
    isEyeCareActive,
    isEyeCareResting,
    eyeCareRestProgress,
    eyeCareWorkDuration,
    eyeCareRestDuration,
    startEyeCareTimer,
    pauseEyeCareTimer,
    resetEyeCareTimer
  } = useTimer();
  
  // Initialize system tray
  const { isTrayActive } = useSystemTray();
  
  // Initialize eye care tray functionality
  useEyeCareTray();
  
  // Set up notifications for eye care events - no timer update toasts
  useEffect(() => {
    if (isEyeCareResting && eyeCareTimeElapsed === 0) {
      // First frame of rest period - notify user
      toast({
        title: "Eye Care Reminder",
        description: "Time to rest your eyes! Look 20ft away for 20 seconds.",
        duration: 8000,
      });
      
      // Send a notification via system tray as well
      if (typeof window !== 'undefined' && window.electron) {
        try {
          console.log("Sending eye care break notification");
          window.electron.send('show-native-notification', {
            title: "Eye Care Break",
            body: "Time to rest your eyes! Look 20ft away for 20 seconds."
          });
        } catch (error) {
          console.error("Failed to send eye care break notification:", error);
        }
      }
    } 
    else if (!isEyeCareResting && eyeCareTimeElapsed === 0 && isEyeCareActive) {
      // Rest period just ended - notify user
      toast({
        title: "Eye Care Break Complete",
        description: "You can resume your work now. Next break in 20 minutes.",
        duration: 5000,
      });
      
      // Send a notification via system tray as well
      if (typeof window !== 'undefined' && window.electron) {
        try {
          console.log("Sending eye care completed notification");
          window.electron.send('show-native-notification', {
            title: "Eye Care Break Complete",
            body: "You can resume your work now. Next break in 20 minutes."
          });
        } catch (error) {
          console.error("Failed to send eye care complete notification:", error);
        }
      }
    }
  }, [isEyeCareResting, eyeCareTimeElapsed, isEyeCareActive]);

  const toggleActive = () => {
    if (isEyeCareActive) {
      pauseEyeCareTimer();
    } else {
      startEyeCareTimer();
    }
    // No "timer settings updated" notification for eye care actions
  };
  
  const workProgress = ((eyeCareWorkDuration - eyeCareTimeElapsed) / eyeCareWorkDuration) * 100;
  const workDurationMinutes = Math.floor(eyeCareWorkDuration / 60);

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-center space-x-2">
          <Eye className="h-5 w-5" />
          <span>Eye Care{isTrayActive ? ' (System Tray Active)' : ''}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        <div
          className={cn(
            "flex h-32 w-32 flex-col items-center justify-center rounded-full border-4",
            isEyeCareResting 
              ? "border-attention-warm-300 animate-breathe bg-attention-warm-50 dark:bg-attention-warm-900/20" 
              : "border-attention-blue-300 bg-attention-blue-50 dark:bg-attention-blue-900/20"
          )}
        >
          {isEyeCareResting ? (
            <div className="flex flex-col items-center justify-center text-center">
              <span className="text-lg font-semibold">Rest Eyes</span>
              <span className="text-sm font-bold bg-background/80 dark:bg-background/30 text-foreground px-2 py-0.5 rounded-full shadow-sm">
                {eyeCareRestDuration - eyeCareTimeElapsed}s
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center">
              <span className="text-lg font-semibold">Next Break</span>
              <span className="text-sm font-bold bg-background/80 dark:bg-background/30 text-foreground px-2 py-0.5 rounded-full shadow-sm">
                {Math.floor((eyeCareWorkDuration - eyeCareTimeElapsed) / 60)}:
                {String((eyeCareWorkDuration - eyeCareTimeElapsed) % 60).padStart(2, "0")}
              </span>
            </div>
          )}
        </div>

        <Progress 
          value={isEyeCareResting ? eyeCareRestProgress : workProgress} 
          className={cn(
            "h-2 w-full", 
            isEyeCareResting ? "bg-attention-warm-100" : "bg-attention-blue-100"
          )} 
        />

        <div className="flex space-x-2">
          <Button
            variant={isEyeCareActive ? "secondary" : "outline"}
            size="sm"
            onClick={toggleActive}
            className="rounded-full"
          >
            {isEyeCareActive ? (
              <>
                <EyeOff className="mr-2 h-4 w-4" /> Pause
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" /> Resume
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={resetEyeCareTimer}
            className="rounded-full"
          >
            <Clock className="mr-2 h-4 w-4" /> Reset
          </Button>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          {isEyeCareResting 
            ? `Rest your eyes for ${eyeCareRestDuration} seconds` 
            : `Work for ${workDurationMinutes} minutes before taking an eye break`}
        </div>
        
        <div className="text-xs text-muted-foreground mt-2">
          {isTrayActive 
            ? "Eye care reminders will show even when minimized" 
            : "Running in browser mode - minimize to tray disabled"}
        </div>
      </CardContent>
    </Card>
  );
}
