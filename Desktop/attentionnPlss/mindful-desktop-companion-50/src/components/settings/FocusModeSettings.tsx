
import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFocusMode } from "@/contexts/FocusModeContext";
import { useAuth } from "@/contexts/AuthContext";
import { X, Plus, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export function FocusModeSettings() {
  const { 
    isFocusMode, 
    toggleFocusMode, 
    whitelist, 
    addToWhitelist, 
    removeFromWhitelist,
    currentActiveApp,
    isCurrentAppWhitelisted
  } = useFocusMode();
  
  const { user } = useAuth();
  
  const [newApp, setNewApp] = useState("");
  
  const handleAddToWhitelist = () => {
    if (newApp.trim()) {
      addToWhitelist(newApp.trim());
      setNewApp("");
    } else if (currentActiveApp) {
      addToWhitelist(currentActiveApp);
    }
  };
  
  const handleAddCurrentApp = () => {
    if (currentActiveApp) {
      addToWhitelist(currentActiveApp);
      toast.success(`Added ${currentActiveApp} to whitelist`);
    }
  };

  const handleToggleFocusMode = () => {
    console.log("Toggle focus mode called, current state:", isFocusMode);
    toggleFocusMode();
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Focus Mode</CardTitle>
        <CardDescription>
          Control which applications and websites you can access during focus sessions
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Main Controls */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="focus-mode">Enable Focus Mode</Label>
              <p className="text-sm text-muted-foreground">
                Block non-whitelisted apps and websites
              </p>
            </div>
            <Switch 
              id="focus-mode" 
              checked={isFocusMode} 
              onCheckedChange={handleToggleFocusMode}
            />
          </div>
        </div>
        
        <Separator />
        
        {/* Live Whitelist Match Preview */}
        <div className="space-y-2">
          <Label>Current App Status</Label>
          <div className={cn(
            "p-3 rounded-lg border flex items-center justify-between",
            currentActiveApp ? 
              isCurrentAppWhitelisted ? 
                "bg-green-100/10 border-green-500/30" : 
                "bg-red-100/10 border-red-500/30" :
              "bg-gray-100/10 border-gray-500/30"
          )}>
            <div>
              <p className="text-sm font-medium">
                {currentActiveApp || "No active window detected"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {currentActiveApp ? 
                  isCurrentAppWhitelisted ? 
                    "This app is allowed in Focus Mode" : 
                    "This app is blocked in Focus Mode" :
                  "Waiting for app detection"}
              </p>
            </div>
            <div>
              {currentActiveApp ? (
                isCurrentAppWhitelisted ? (
                  <Badge className="bg-green-500 text-white">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Allowed
                  </Badge>
                ) : (
                  <div className="flex flex-col items-end space-y-2">
                    <Badge className="bg-red-500 text-white">
                      <XCircle className="h-3 w-3 mr-1" />
                      Blocked
                    </Badge>
                    {!isCurrentAppWhitelisted && (
                      <Button 
                        onClick={handleAddCurrentApp}
                        variant="outline"
                        size="sm"
                        className="border-green-500 text-green-500 hover:bg-green-500/10"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Whitelist
                      </Button>
                    )}
                  </div>
                )
              ) : (
                <Badge variant="outline">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Not detected
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        {/* Whitelist Management */}
        <div className="space-y-4">
          <Label>Manage Whitelist</Label>
          
          <div className="flex space-x-2">
            <Input 
              placeholder="Add application or website name" 
              value={newApp}
              onChange={(e) => setNewApp(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddToWhitelist();
                }
              }}
            />
            <Button onClick={handleAddToWhitelist}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
          
          <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2">
            {whitelist.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2 text-center">
                No apps in whitelist. Add apps that you want to allow during Focus Mode.
              </p>
            ) : (
              whitelist.map((app) => (
                <div 
                  key={app} 
                  className={cn(
                    "flex items-center justify-between rounded p-2",
                    currentActiveApp && currentActiveApp.toLowerCase().includes(app.toLowerCase()) ? 
                      "bg-green-100/10 border border-green-500/30" : 
                      "bg-secondary/50"
                  )}
                >
                  <span className="text-sm">{app}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removeFromWhitelist(app)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
