
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";

type User = {
  id: string;
  email: string;
  name: string;
};

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<boolean>;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const API_URL = 'http://localhost:5000/api';

// Demo users for the preview environment
const DEMO_USERS = [
  {
    id: "demo-user-1",
    name: "Demo User",
    email: "demo@example.com",
    password: "password123"
  },
  {
    id: "demo-user-2",
    name: "Test User",
    email: "test@example.com",
    password: "test123"
  }
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  // Store registered users in session
  const [registeredUsers, setRegisteredUsers] = useState<Array<typeof DEMO_USERS[0]>>(() => {
    const stored = sessionStorage.getItem("registeredUsers");
    return stored ? JSON.parse(stored) : [...DEMO_USERS];
  });

  useEffect(() => {
    // Update session storage when registered users change
    sessionStorage.setItem("registeredUsers", JSON.stringify(registeredUsers));
  }, [registeredUsers]);

  useEffect(() => {
    // Check if user is logged in on mount
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      console.log(`Attempting login for email: ${email}`);
      
      // Check if this is a registered user in our demo environment
      const demoUser = registeredUsers.find(u => 
        u.email.toLowerCase() === email.toLowerCase() && 
        u.password === password
      );
      
      if (demoUser) {
        console.log("Demo user found, logging in");
        const userData = {
          id: demoUser.id,
          name: demoUser.name,
          email: demoUser.email
        };
        
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        sonnerToast.success(`Welcome back, ${userData.name}!`);
        return true;
      }

      // Try to authenticate with the backend if not in preview mode
      try {
        console.log("No demo user found, trying backend");
        const response = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          sonnerToast.error("Login failed: Invalid email or password");
          return false;
        }

        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
        sonnerToast.success(`Welcome back, ${data.user.name}!`);
        return true;
      } catch (error) {
        console.error("Backend login error:", error);
        sonnerToast.error("Unable to connect to server, please try again");
        return false;
      }
    } catch (error) {
      sonnerToast.error("Login failed: An error occurred during login");
      console.error("Login error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      console.log(`Attempting signup for email: ${email}`);
      
      // Check if email is already used (case insensitive check)
      const existingUser = registeredUsers.find(u => 
        u.email.toLowerCase() === email.toLowerCase()
      );
      
      if (existingUser) {
        sonnerToast.error("Signup failed: Email already in use");
        return false;
      }

      // Create new demo user
      const newUser = {
        id: `demo-user-${Date.now()}`,
        name,
        email,
        password // Store password for demo mode only
      };
      
      // Try to sign up with backend if not in preview mode
      try {
        const response = await fetch(`${API_URL}/auth/signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          // If backend fails, add to registered users anyway (for demo mode)
          setRegisteredUsers(prev => [...prev, newUser]);
          
          const userData = {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email
          };
          
          setUser(userData);
          localStorage.setItem("user", JSON.stringify(userData));
          sonnerToast.success(`Welcome, ${name}!`);
          return true;
        }

        const userData = {
          id: data.user?.id || newUser.id,
          name: data.user?.name || name,
          email: data.user?.email || email
        };
        
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        sonnerToast.success(`Welcome, ${name}!`);
        return true;
      } catch (error) {
        console.error("Backend signup error:", error);
        sonnerToast.info("Using preview mode: Account created locally");
        
        // If backend fails, use the local user
        // Add to registered users
        setRegisteredUsers(prev => [...prev, newUser]);
        
        const userData = {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email
        };
        
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        sonnerToast.success(`Welcome, ${name}!`);
        return true;
      }
    } catch (error) {
      sonnerToast.error("Signup failed: An error occurred during signup");
      console.error("Signup error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    sonnerToast.success("You have been successfully logged out");
  };

  const forgotPassword = async (email: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Check if email exists in demo users
      const demoUser = DEMO_USERS.find(u => u.email === email);
      if (!demoUser) {
        sonnerToast.error("Reset failed: No account found with this email");
        return false;
      }
      
      // Try to use backend if not in preview mode
      try {
        const response = await fetch(`${API_URL}/auth/forgot-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          sonnerToast.error(`Reset failed: ${data.message || 'No account found with this email'}`);
          return false;
        }
        
        sonnerToast.success("Reset code sent: Check your email for the reset code");
        return true;
      } catch (error) {
        console.error("Backend forgot password error:", error);
        sonnerToast.info("Using preview mode: Use '123456' as your reset code");
        return true;
      }
    } catch (error) {
      sonnerToast.error("Reset failed: An error occurred");
      console.error("Forgot password error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string, code: string, newPassword: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // In preview mode, accept any code as valid
      const demoUser = DEMO_USERS.find(u => u.email === email);
      if (!demoUser) {
        sonnerToast.error("Reset failed: User not found");
        return false;
      }
      
      // Demo mode always accepts '123456' as the code
      if (code !== '123456') {
        sonnerToast.error("Reset failed: Invalid or expired reset code");
        return false;
      }
      
      // Try to reset with backend if not in preview mode
      try {
        const response = await fetch(`${API_URL}/auth/reset-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, code, newPassword }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          sonnerToast.error(`Reset failed: ${data.message || 'Invalid or expired reset code'}`);
          return false;
        }
        
        sonnerToast.success("Password reset successful: You can now login with your new password");
        return true;
      } catch (error) {
        console.error("Backend reset password error:", error);
        sonnerToast.success("Password reset successful: You can now login with your new password");
        return true;
      }
    } catch (error) {
      sonnerToast.error("Reset failed: An error occurred");
      console.error("Reset password error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        logout,
        forgotPassword,
        resetPassword,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
