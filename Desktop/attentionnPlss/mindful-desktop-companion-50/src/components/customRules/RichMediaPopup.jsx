
import React, { useEffect, useState } from "react";
import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { X, Focus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function RichMediaPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [notificationData, setNotificationData] = useState(null);
  const [lastShownAppId, setLastShownAppId] = useState(null);
  
  // Listen for focus-mode popups
  useEffect(() => {
    const handleShowFocusPopup = (event) => {
      console.log("Received show-focus-popup event", event.detail);
      
      // Extract app ID to prevent duplicate popups
      const appIdMatch = event.detail.notificationId.match(/focus-mode-(.*?)-\d+/);
      const currentAppId = appIdMatch ? appIdMatch[1] : null;
      
      // If this is the same app we just showed a popup for, don't show another one
      if (currentAppId && currentAppId === lastShownAppId) {
        console.log("Skipping duplicate popup for app:", currentAppId);
        return;
      }
      
      // Update the last shown app ID
      if (currentAppId) {
        setLastShownAppId(currentAppId);
      }
      
      // Set notification data
      setNotificationData({
        title: event.detail.title,
        body: event.detail.body,
        notificationId: event.detail.notificationId,
        appName: event.detail.appName
      });
      
      setIsOpen(true);
      
      console.log("Opening focus popup for app:", event.detail.appName);
      
      // Auto-dismiss after 8 seconds
      setTimeout(() => {
        setIsOpen(false);
      }, 8000);
      
      // Send confirmation that popup was displayed
      const confirmEvent = new CustomEvent('focus-popup-displayed', {
        detail: {
          notificationId: event.detail.notificationId,
          timestamp: Date.now()
        }
      });
      window.dispatchEvent(confirmEvent);
    };
    
    // Handle notification dismissed events
    const handleNotificationDismissed = (event) => {
      console.log("Notification dismissed event received:", event.detail);
      if (notificationData && event.detail === notificationData.notificationId) {
        setIsOpen(false);
        setLastShownAppId(null);
      }
    };
    
    window.addEventListener('show-focus-popup', handleShowFocusPopup);
    window.addEventListener('notification-dismissed', handleNotificationDismissed);
    
    return () => {
      window.removeEventListener('show-focus-popup', handleShowFocusPopup);
      window.removeEventListener('notification-dismissed', handleNotificationDismissed);
    };
  }, [lastShownAppId, notificationData]);
  
  const handleDismiss = () => {
    setIsOpen(false);
    setLastShownAppId(null);
    
    // Dispatch an event that the notification was dismissed
    if (notificationData) {
      const dismissEvent = new CustomEvent('notification-dismissed', {
        detail: notificationData.notificationId
      });
      window.dispatchEvent(dismissEvent);
    }
  };
  
  if (!notificationData) return null;
  
  const bodyText = notificationData.body;
  
  return (
    <AnimatePresence>
      {isOpen && (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
          <AlertDialogContent 
            className="p-0 overflow-hidden bg-background rounded-lg border shadow-lg max-w-md w-full"
            style={{ borderRadius: '12px' }}
          >
            <div className="p-6 space-y-4 relative">
              {/* Close button */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 rounded-full bg-background/80 hover:bg-background/90"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Focus className="h-5 w-5 text-amber-400" />
                  <h3 className="text-xl font-semibold">{notificationData.title}</h3>
                </div>
                
                {/* System message about whitelist */}
                <p className="text-muted-foreground">
                  {bodyText}
                </p>
              </div>
              
              <div className="flex justify-end pt-2">
                <Button onClick={handleDismiss}>
                  Dismiss
                </Button>
              </div>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </AnimatePresence>
  );
}
