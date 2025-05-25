
import { Bell, Moon, Sun, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

export function TopNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Only render theme toggle after component has mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    // Explicitly check for the current theme and set the opposite
    if (theme === "dark") {
      setTheme("light");
      toast.success("Theme changed to light mode");
    } else {
      setTheme("dark");
      toast.success("Theme changed to dark mode");
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("Successfully logged out");
    navigate("/login");
  };

  // Demo notifications for preview
  const notifications = [
    { id: 1, title: "Welcome back!", message: "Great to see you again!" },
    { id: 2, title: "Tip", message: "Remember to take regular breaks" },
    { id: 3, title: "Focus Time", message: "You've been productive today!" },
  ];

  return (
    <div className="flex h-16 items-center justify-between border-b px-6">
      <div className="flex items-center gap-2">
        <div className="flex items-center space-x-1">
          <span className="h-3 w-3 rounded-full bg-attention-blue-400"></span>
          <span className="h-3 w-3 rounded-full bg-attention-green-400"></span>
        </div>
        <h1 className="text-xl font-semibold">Attention Please!</h1>
      </div>
      <div className="flex items-center space-x-4">
        <Sheet open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Notifications</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="rounded-lg border p-4 hover:bg-accent"
                >
                  <h3 className="font-medium">{notification.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {notification.message}
                  </p>
                </div>
              ))}
            </div>
          </SheetContent>
        </Sheet>

        {mounted && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full border">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{user?.name || "User"}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
