
import React, { createContext, useContext, useState, useEffect } from 'react';
import SystemTrayService from '@/services/SystemTrayService';
import { toast } from "sonner";

export interface Rule {
  id: string;
  name: string;
  condition: {
    type: string;
    threshold: number;
    timeWindow: number;
  };
  action: {
    type: string;
    text: string;
    media?: {
      type: 'image' | 'video';
      content: string;
    };
    autoDismiss: boolean;
    dismissTime?: number; // in seconds
  };
  isActive: boolean;
}

interface CustomRulesContextType {
  rules: Rule[];
  addRule: (rule: Omit<Rule, 'id'>) => void;
  updateRule: (id: string, rule: Partial<Rule>) => void;
  deleteRule: (id: string) => void;
  toggleRuleEnabled: (id: string) => void;
}

const CustomRulesContext = createContext<CustomRulesContextType | undefined>(undefined);

export const useCustomRules = () => {
  const context = useContext(CustomRulesContext);
  if (context === undefined) {
    throw new Error('useCustomRules must be used within a CustomRulesProvider');
  }
  return context;
};

export const CustomRulesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rules, setRules] = useState<Rule[]>([]);
  const [lastTriggeredTime, setLastTriggeredTime] = useState<Record<string, number>>({});
  
  // Load saved rules from localStorage on component mount
  useEffect(() => {
    const savedRules = localStorage.getItem('customRules');
    if (savedRules) {
      setRules(JSON.parse(savedRules));
    }
  }, []);
  
  // Save rules whenever they change
  useEffect(() => {
    localStorage.setItem('customRules', JSON.stringify(rules));
  }, [rules]);
  
  const addRule = (rule: Omit<Rule, 'id'>) => {
    const newRule: Rule = {
      ...rule,
      id: `rule-${Date.now()}`,
    };
    
    setRules([...rules, newRule]);
    toast.success("Rule created successfully");
    console.log("New rule added:", newRule);
  };
  
  const updateRule = (id: string, updatedFields: Partial<Rule>) => {
    setRules(rules.map(rule => 
      rule.id === id ? { ...rule, ...updatedFields } : rule
    ));
    toast.success("Rule updated successfully");
  };
  
  const deleteRule = (id: string) => {
    setRules(rules.filter(rule => rule.id !== id));
    toast.info("Rule deleted");
  };
  
  const toggleRuleEnabled = (id: string) => {
    setRules(rules.map(rule => 
      rule.id === id ? { ...rule, isActive: !rule.isActive } : rule
    ));
  };
  
  // Check for active rules and trigger them if conditions are met
  useEffect(() => {
    if (rules.length === 0) return;
    
    const systemTray = SystemTrayService.getInstance();
    
    // Set up interval to check for rule triggers
    const checkRulesInterval = setInterval(() => {
      const recentSwitches = systemTray.getRecentSwitchCount();
      const now = Date.now();
      
      console.log("Checking rules - Recent switches:", recentSwitches);
      
      // Check if any rule should be triggered
      rules.forEach(rule => {
        if (!rule.isActive) return;
        
        // Only check rules that haven't been triggered in the last minute
        const lastTrigger = lastTriggeredTime[rule.id] || 0;
        if (now - lastTrigger < 60000) return;
        
        // Use appropriate check based on rule condition
        let shouldTrigger = false;
        
        if (rule.condition.type === "app_switch" && recentSwitches >= rule.condition.threshold) {
          shouldTrigger = true;
        }
        
        if (shouldTrigger) {
          console.log("Triggering rule:", rule.name);
          triggerRuleAction(rule);
          
          // Update last triggered time
          setLastTriggeredTime(prev => ({
            ...prev,
            [rule.id]: now
          }));
        }
      });
    }, 10000); // Check every 10 seconds
    
    return () => clearInterval(checkRulesInterval);
  }, [rules, lastTriggeredTime]);
  
  const triggerRuleAction = (rule: Rule) => {
    console.log("Triggering action for rule:", rule.name);
    
    if (rule.action.type === 'popup') {
      showRichMediaPopup(rule);
    }
  };
  
  const showRichMediaPopup = (rule: Rule) => {
    // Dispatch event to show the popup
    const event = new CustomEvent('show-custom-rule-popup', { 
      detail: rule 
    });
    console.log("Dispatching rule popup event:", rule.name);
    window.dispatchEvent(event);
  };
  
  const value = {
    rules,
    addRule,
    updateRule,
    deleteRule,
    toggleRuleEnabled
  };
  
  return (
    <CustomRulesContext.Provider value={value}>
      {children}
    </CustomRulesContext.Provider>
  );
};
