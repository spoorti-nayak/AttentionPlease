import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import SystemTrayService from "@/services/SystemTrayService";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFocusMode } from "@/contexts/FocusModeContext";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";

interface AppUsageItem {
  name: string;
  time: number;
  type: "productive" | "distraction" | "communication";
  lastActiveTime?: number;
}

interface AppUsageListProps {
  className?: string;
}

export function AppUsageList({ className }: AppUsageListProps) {
  const [appUsageData, setAppUsageData] = useState<AppUsageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { isFocusMode, whitelist } = useFocusMode();
  
  useEffect(() => {
    const systemTray = SystemTrayService.getInstance();
    const userId = user?.id || 'guest';
    
    // Set current user to ensure proper data isolation
    systemTray.setCurrentUser(userId);
    
    // Subscribe to app usage updates
    const handleAppUsageUpdate = (appUsage: Array<{name: string, time: number, type: string, lastActiveTime?: number}>) => {
      // Ensure we're only using this user's data
      console.log(`Received app usage update for user: ${userId}`);
      
      // Convert to formatted app usage items
      const formattedAppUsage: AppUsageItem[] = appUsage.map(app => ({
        name: app.name,
        time: app.time,
        type: app.type as "productive" | "distraction" | "communication",
        lastActiveTime: app.lastActiveTime
      }));
      
      // Sort by most recent activity (lastActiveTime) first, then by time spent
      const sortedAppUsage = formattedAppUsage.sort((a, b) => {
        // First sort by lastActiveTime if available
        if (a.lastActiveTime && b.lastActiveTime) {
          return b.lastActiveTime - a.lastActiveTime;
        } else if (a.lastActiveTime) {
          return -1; // a has lastActiveTime, b doesn't
        } else if (b.lastActiveTime) {
          return 1; // b has lastActiveTime, a doesn't
        }
        
        // Fall back to sorting by time spent
        return b.time - a.time;
      });
      
      setAppUsageData(sortedAppUsage);
      setIsLoading(false);
    };
    
    // Request user-specific app usage data
    if (window.electron) {
      window.electron.send('get-user-app-usage', { userId });
    }
    
    systemTray.addAppUsageListener(handleAppUsageUpdate);
    
    // Set loading state to false after a delay if no data arrives
    const timeout = setTimeout(() => {
      if (isLoading && appUsageData.length === 0) {
        console.log("No app usage data received, showing empty state");
        setIsLoading(false);
      }
    }, 2000);
    
    // Clean up listener
    return () => {
      systemTray.removeAppUsageListener(handleAppUsageUpdate);
      clearTimeout(timeout);
    };
  }, [user]);
  
  // Fix time formatting - handle both milliseconds and seconds properly
  const formatTime = (timeValue: number): string => {
    if (timeValue < 1) return "1s"; // Show at least 1 second
    
    // If the value is very large, it's likely in milliseconds
    // If it's a reasonable number, it's likely in seconds
    let totalSeconds: number;
    if (timeValue > 3600000) {
      // Likely milliseconds (more than 1 hour in ms)
      totalSeconds = Math.floor(timeValue / 1000);
    } else if (timeValue > 3600) {
      // Likely seconds (more than 1 hour in seconds)
      totalSeconds = Math.floor(timeValue);
    } else {
      // Small value, treat as seconds but ensure minimum display
      totalSeconds = Math.max(1, Math.floor(timeValue));
    }
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const isAppWhitelisted = (appName: string): boolean => {
    return whitelist.some(item => 
      appName.toLowerCase().includes(item.toLowerCase()) || 
      item.toLowerCase().includes(appName.toLowerCase())
    );
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>App Usage Today</CardTitle>
        {isFocusMode && (
          <Badge className="bg-attention-blue-400 text-white">
            <Shield className="h-3 w-3 mr-1" />
            Focus Mode
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex animate-pulse items-center justify-between rounded-lg border p-3">
                <div className="h-4 w-32 rounded bg-muted"></div>
                <div className="h-4 w-10 rounded bg-muted"></div>
              </div>
            ))}
          </div>
        ) : appUsageData.length > 0 ? (
          <ScrollArea className="h-[250px] pr-4">
            <div className="space-y-3">
              {appUsageData.map((app, index) => {
                // Determine if app is whitelisted - cache the result to prevent flickering
                const isWhitelisted = isAppWhitelisted(app.name);
                
                return (
                  <div
                    key={`${app.name}-${index}`}
                    className={cn(
                      "flex items-center justify-between rounded-lg border p-3 transition-colors duration-200",
                      isFocusMode && !isWhitelisted && "bg-red-50/30 border-red-200/50",
                      isFocusMode && isWhitelisted && "bg-green-50/30 border-green-200/50",
                      !isFocusMode && "bg-background"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={cn(
                          "h-3 w-3 rounded-full",
                          app.type === "productive" && "bg-attention-green-400",
                          app.type === "distraction" && "bg-attention-warm-400",
                          app.type === "communication" && "bg-attention-blue-400"
                        )}
                      ></div>
                      <div className="flex items-center">
                        <span className="font-medium">{app.name}</span>
                        {isFocusMode && (
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "ml-2 text-xs",
                              isWhitelisted ? "border-green-500 text-green-700 bg-green-50" : "border-red-500 text-red-700 bg-red-50"
                            )}
                          >
                            {isWhitelisted ? "Allowed" : "Blocked"}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-sm font-medium">{formatTime(app.time)}</div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-muted-foreground">No app usage data available</p>
            <p className="text-xs text-muted-foreground mt-2">
              Data will appear when you switch between applications
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              (Note: This requires desktop app mode to track real applications)
            </p>
          </div>
        )}
        
        <div className="mt-4 flex items-center justify-center space-x-6">
          <div className="flex items-center">
            <div className="mr-2 h-3 w-3 rounded-full bg-attention-green-400"></div>
            <span className="text-sm text-muted-foreground">Productive</span>
          </div>
          <div className="flex items-center">
            <div className="mr-2 h-3 w-3 rounded-full bg-attention-warm-400"></div>
            <span className="text-sm text-muted-foreground">Distraction</span>
          </div>
          <div className="flex items-center">
            <div className="mr-2 h-3 w-3 rounded-full bg-attention-blue-400"></div>
            <span className="text-sm text-muted-foreground">Communication</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
