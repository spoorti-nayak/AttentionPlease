
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, Upload, X } from "lucide-react";
import { useCustomRules } from "@/contexts/CustomRulesContext";

export function CustomRulesSettings() {
  const { rules, addRule, deleteRule } = useCustomRules();
  const [isCreating, setIsCreating] = useState(false);
  const [ruleName, setRuleName] = useState("");
  const [actionText, setActionText] = useState("");
  const [mediaType, setMediaType] = useState<"none" | "image" | "video">("none");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [autoDismiss, setAutoDismiss] = useState(true);
  const [dismissTime, setDismissTime] = useState(5);
  
  const resetForm = () => {
    setRuleName("");
    setActionText("");
    setMediaType("none");
    setMediaFile(null);
    setMediaPreview(null);
    setAutoDismiss(true);
    setDismissTime(5);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMediaFile(file);
      
      // Create a preview URL for the selected file
      const fileReader = new FileReader();
      fileReader.onload = (event) => {
        if (event.target?.result) {
          setMediaPreview(event.target.result.toString());
        }
      };
      fileReader.readAsDataURL(file);
      
      // Set media type based on file type
      if (file.type.startsWith("image/")) {
        setMediaType("image");
      } else if (file.type.startsWith("video/")) {
        setMediaType("video");
      }
    }
  };
  
  const handleRemoveMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType("none");
  };
  
  const handleSaveRule = async () => {
    // Validate form
    if (!ruleName.trim() || !actionText.trim()) {
      return;
    }
    
    let mediaContent = "";
    
    // Process media file if it exists
    if (mediaFile && mediaPreview) {
      mediaContent = mediaPreview;
    }
    
    // Create rule - using the proper structure according to our context
    addRule({
      name: ruleName,
      condition: {
        type: "app_switch", // Default condition
        threshold: 5,
        timeWindow: 60,
      },
      action: {
        type: "popup",
        text: actionText,
        media: mediaType !== "none" ? {
          type: mediaType,
          content: mediaContent
        } : undefined,
        autoDismiss,
        dismissTime: autoDismiss ? dismissTime : undefined
      },
      isActive: true
    });
    
    // Reset form and exit creation mode
    resetForm();
    setIsCreating(false);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Custom Notification Rules</CardTitle>
        <CardDescription>
          Create rules that will trigger custom notifications based on app switching
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isCreating ? (
          <div className="space-y-4 border rounded-lg p-4 bg-card">
            <h3 className="text-lg font-medium">Create New Rule</h3>
            
            <div className="space-y-2">
              <Label htmlFor="rule-name">Rule Name</Label>
              <Input 
                id="rule-name"
                placeholder="My Custom Rule"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="rule-action">Notification Message</Label>
              <Textarea
                id="rule-action"
                placeholder="Take a deep breath and refocus..."
                value={actionText}
                onChange={(e) => setActionText(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                This message will be displayed when app switching is detected
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Notification Media (Optional)</Label>
              
              {mediaPreview ? (
                <div className="relative border rounded-lg overflow-hidden h-40">
                  {mediaType === "image" && (
                    <img 
                      src={mediaPreview} 
                      alt="Preview" 
                      className="w-full h-full object-contain"
                    />
                  )}
                  
                  {mediaType === "video" && (
                    <video 
                      src={mediaPreview} 
                      controls 
                      className="w-full h-full"
                    />
                  )}
                  
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 rounded-full"
                    onClick={handleRemoveMedia}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center border-2 border-dashed rounded-lg p-6 border-muted-foreground/25">
                  <label className="flex flex-col items-center justify-center cursor-pointer">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="mt-2 text-sm text-muted-foreground">
                      Upload image or video
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              )}
            </div>
            
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-dismiss">Auto-dismiss notification</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically close the notification after a set time
                  </p>
                </div>
                <Switch 
                  id="auto-dismiss" 
                  checked={autoDismiss} 
                  onCheckedChange={setAutoDismiss}
                />
              </div>
              
              {autoDismiss && (
                <div className="space-y-2">
                  <Label htmlFor="dismiss-time">Dismiss After (seconds)</Label>
                  <Input
                    id="dismiss-time"
                    type="number"
                    min={1}
                    max={60}
                    value={dismissTime}
                    onChange={(e) => setDismissTime(Number(e.target.value))}
                  />
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-2 pt-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  resetForm();
                  setIsCreating(false);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveRule}>Save Rule</Button>
            </div>
          </div>
        ) : (
          <Button onClick={() => setIsCreating(true)} className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Create New Rule
          </Button>
        )}
        
        {rules.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Your Rules</h3>
            
            <div className="space-y-2">
              {rules.map((rule) => (
                <div 
                  key={rule.id} 
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{rule.name}</p>
                    <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                      {rule.action.text}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => deleteRule(rule.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
