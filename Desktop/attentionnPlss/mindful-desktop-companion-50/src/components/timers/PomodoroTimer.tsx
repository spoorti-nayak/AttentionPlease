
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Play, Pause, RotateCcw, Settings } from 'lucide-react';
import { useTimer } from '@/contexts/TimerContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export function PomodoroTimer() {
  const {
    pomodoroMinutes,
    pomodoroSeconds,
    isPomodoroActive,
    isPomodoroBreak,
    pomodoroDuration,
    pomodoroBreakDuration,
    pomodoroProgress,
    startPomodoroTimer,
    pausePomodoroTimer,
    resetPomodoroTimer,
    updateTimerSettings
  } = useTimer();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tempSettings, setTempSettings] = useState({
    workTime: pomodoroDuration * 60,
    shortBreakTime: pomodoroBreakDuration * 60,
    longBreakTime: 15 * 60,
    sessionsUntilLongBreak: 4
  });

  const formatTime = (minutes: number, seconds: number) => {
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getSessionName = () => {
    return isPomodoroBreak ? 'Break Time' : 'Work Session';
  };

  const getSessionColor = () => {
    return isPomodoroBreak ? 'text-green-500' : 'text-red-500';
  };

  const handleSaveSettings = () => {
    // Update timer settings in context
    updateTimerSettings({
      pomodoroDuration: tempSettings.workTime / 60,
      pomodoroBreakDuration: tempSettings.shortBreakTime / 60,
      eyeCareWorkDuration: 20 * 60,
      eyeCareRestDuration: 20,
    });
    
    // Reset the timer to apply new settings immediately
    resetPomodoroTimer(isPomodoroBreak);
    
    setSettingsOpen(false);
  };

  // Update temp settings when actual settings change from the main timer settings
  useEffect(() => {
    setTempSettings({
      workTime: pomodoroDuration * 60,
      shortBreakTime: pomodoroBreakDuration * 60,
      longBreakTime: 15 * 60,
      sessionsUntilLongBreak: 4
    });
  }, [pomodoroDuration, pomodoroBreakDuration]);

  // Reset timer when settings change from outside this component
  useEffect(() => {
    if (!isPomodoroActive) {
      resetPomodoroTimer(isPomodoroBreak);
    }
  }, [pomodoroDuration, pomodoroBreakDuration, isPomodoroActive, isPomodoroBreak, resetPomodoroTimer]);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-between">
          <span className={getSessionName()}>{getSessionName()}</span>
          <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <h4 className="font-medium">Timer Settings</h4>
                
                <div className="space-y-2">
                  <Label htmlFor="work-time">Work Time (minutes)</Label>
                  <Input
                    id="work-time"
                    type="number"
                    value={tempSettings.workTime / 60}
                    onChange={(e) => setTempSettings(prev => ({
                      ...prev,
                      workTime: parseInt(e.target.value) * 60 || 1500
                    }))}
                    min="1"
                    max="60"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="short-break">Break Time (minutes)</Label>
                  <Input
                    id="short-break"
                    type="number"
                    value={tempSettings.shortBreakTime / 60}
                    onChange={(e) => setTempSettings(prev => ({
                      ...prev,
                      shortBreakTime: parseInt(e.target.value) * 60 || 300
                    }))}
                    min="1"
                    max="30"
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSaveSettings} className="flex-1">
                    Save
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setTempSettings({
                        workTime: pomodoroDuration * 60,
                        shortBreakTime: pomodoroBreakDuration * 60,
                        longBreakTime: 15 * 60,
                        sessionsUntilLongBreak: 4
                      });
                      setSettingsOpen(false);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </CardTitle>
        <CardDescription>
          Pomodoro Timer • {isPomodoroBreak ? 'Take a break!' : 'Stay focused!'}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Progress Ring */}
        <div className="relative flex items-center justify-center">
          <div className="relative w-48 h-48">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                strokeWidth="8"
                fill="none"
                className="stroke-muted"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                strokeWidth="8"
                fill="none"
                className={`transition-all duration-1000 ease-in-out ${
                  isPomodoroBreak ? 'stroke-green-500' : 'stroke-red-500'
                }`}
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - pomodoroProgress / 100)}`}
              />
            </svg>
            
            {/* Timer display */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl font-mono font-bold">
                  {formatTime(pomodoroMinutes, pomodoroSeconds)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-2 justify-center">
          <Button
            onClick={isPomodoroActive ? pausePomodoroTimer : startPomodoroTimer}
            size="lg"
            className="flex items-center gap-2"
          >
            {isPomodoroActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isPomodoroActive ? 'Pause' : 'Start'}
          </Button>
          
          <Button
            onClick={() => resetPomodoroTimer(isPomodoroBreak)}
            variant="outline"
            size="lg"
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
