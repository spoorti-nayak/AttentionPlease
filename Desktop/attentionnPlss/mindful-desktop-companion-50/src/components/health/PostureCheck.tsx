
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

export function PostureCheck({ className }: { className?: string }) {
  const [isEnabled, setIsEnabled] = useState(() => {
    const saved = localStorage.getItem("postureEnabled");
    return saved ? JSON.parse(saved) : false;
  });
  
  const [timeLeft, setTimeLeft] = useState(() => {
    const saved = localStorage.getItem("postureTimeLeft");
    return saved ? parseInt(saved) : 45 * 60;
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("postureEnabled", JSON.stringify(isEnabled));
  }, [isEnabled]);

  useEffect(() => {
    localStorage.setItem("postureTimeLeft", timeLeft.toString());
  }, [timeLeft]);

  // Main timer logic
  useEffect(() => {
    if (isEnabled) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prevTime) => {
          const newTime = Math.max(0, prevTime - 1);
          
          if (newTime === 0) {
            // Timer completed - show notification
            toast.success("🧘 Posture Reminder: Time to check your posture! Sit up straight and stretch a bit.", {
              duration: 5000,
            });
            
            // Send system notification if available
            if (window.electron) {
              window.electron.send('show-native-notification', {
                title: "Posture Reminder",
                body: "Time to check your posture! Sit up straight and stretch a bit."
              });
            }
            
            // Auto-restart timer to 45 minutes
            return 45 * 60;
          }
          
          return newTime;
        });
      }, 1000);
    } else {
      // Clear interval when disabled
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isEnabled]);

  const toggleEnabled = () => {
    const newEnabled = !isEnabled;
    setIsEnabled(newEnabled);
    
    if (newEnabled) {
      // Reset timer when enabling
      setTimeLeft(45 * 60);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-green-500" />
          <span>Posture Check</span>
        </CardTitle>
        <Switch checked={isEnabled} onCheckedChange={toggleEnabled} />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div
            className={cn(
              "flex h-24 w-24 mx-auto flex-col items-center justify-center rounded-full border-4",
              isEnabled 
                ? "border-green-300 bg-green-50 dark:bg-green-900/20" 
                : "border-gray-300 bg-gray-50 dark:bg-gray-900/20"
            )}
          >
            {isEnabled ? (
              <div className="flex flex-col items-center justify-center text-center">
                <span className="text-sm font-semibold">Next reminder</span>
                <span className="text-xs font-bold bg-background/80 px-2 py-0.5 rounded-full">
                  {formatTime(timeLeft)}
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center">
                <span className="text-sm text-muted-foreground">Disabled</span>
              </div>
            )}
          </div>
          
          <div className="text-center text-sm text-muted-foreground">
            {isEnabled 
              ? "Reminders every 45 minutes to check posture" 
              : "Enable to get posture reminders"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
