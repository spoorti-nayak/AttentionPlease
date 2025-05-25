
import { useState, useEffect } from "react";
import { TopNav } from "@/components/layout/TopNav";
import { StatCard } from "@/components/dashboard/StatCard";
import { PomodoroTimer } from "@/components/timers/PomodoroTimer";
import { EyeCareReminder } from "@/components/eyecare/EyeCareReminder.jsx";
import { HydrationCheck } from "@/components/health/HydrationCheck";
import { PostureCheck } from "@/components/health/PostureCheck";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { Clock, Zap, Settings, BarChart3 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import SystemTrayService from "@/services/SystemTrayService";
import { RichMediaPopup } from "@/components/customRules/RichMediaPopup.jsx";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { user } = useAuth();
  
  // Real-time tracked data
  const [screenTime, setScreenTime] = useState(null);
  const [distractionCount, setDistractionCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // Subscribe to real-time data updates
  useEffect(() => {
    const systemTray = SystemTrayService.getInstance();
    const userId = user?.id || 'guest';
    
    // Set current user to ensure proper data isolation
    systemTray.setCurrentUser(userId);
    
    // Get initial screen time
    const initialScreenTime = systemTray.getFormattedScreenTime();
    if (initialScreenTime !== "0h 0m") {
      setScreenTime(initialScreenTime);
    }
    
    // Listen for screen time updates
    const handleScreenTimeUpdate = (screenTimeMs) => {
      if (screenTimeMs > 0) {
        setScreenTime(systemTray.formatScreenTime(screenTimeMs));
      } else {
        setScreenTime(null);
      }
      setIsLoading(false);
    };
    
    // Listen for focus score updates
    const handleFocusScoreUpdate = (score, distractions) => {
      setDistractionCount(distractions);
      setIsLoading(false);
    };
    
    // Add listeners
    systemTray.addScreenTimeListener(handleScreenTimeUpdate);
    systemTray.addFocusScoreListener(handleFocusScoreUpdate);
    
    // Send request for user-specific data
    if (window.electron) {
      window.electron.send('get-user-data', { userId });
    }
    
    // Set loading state false after a delay even if no data
    const loadingTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    
    return () => {
      systemTray.removeScreenTimeListener(handleScreenTimeUpdate);
      systemTray.removeFocusScoreListener(handleFocusScoreUpdate);
      clearTimeout(loadingTimeout);
    };
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <div className="container mx-auto py-6">
        <Tabs
          defaultValue="dashboard"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="mb-6 grid w-full grid-cols-3">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="focus" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span>Focus & Eye Care</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="animate-fade-in">
            <div className="grid gap-6 md:grid-cols-2">
              <StatCard
                title="Screen Time"
                value={screenTime}
                icon={<Clock />}
                description="Total screen time today"
                loading={isLoading}
              />
              <StatCard
                title="Distractions"
                value={distractionCount}
                icon={<Zap />}
                description="Times you got distracted"
                loading={isLoading}
              />
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <HydrationCheck />
              <PostureCheck />
            </div>
          </TabsContent>

          <TabsContent value="focus" className="animate-fade-in">
            <div className="grid gap-6 md:grid-cols-2">
              <PomodoroTimer />
              <EyeCareReminder />
            </div>
          </TabsContent>

          <TabsContent value="settings" className="animate-fade-in">
            <SettingsPanel />
          </TabsContent>
        </Tabs>
      </div>
      
      <RichMediaPopup />
    </div>
  );
};

export default Index;
