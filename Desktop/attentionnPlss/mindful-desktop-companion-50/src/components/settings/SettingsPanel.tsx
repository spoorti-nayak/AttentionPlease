
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { FocusModeSettings } from "./FocusModeSettings";
import { useTimer } from "@/contexts/TimerContext";
import { useEffect } from "react";

const timerSettingsSchema = z.object({
  pomodoroDuration: z.number().min(1).max(120),
  pomodoroBreakDuration: z.number().min(1).max(60),
  eyeCareWorkDuration: z.number().min(1).max(120),
  eyeCareRestDuration: z.number().min(5).max(120),
});

type TimerSettingsValues = z.infer<typeof timerSettingsSchema>;

export function SettingsPanel() {
  const { 
    pomodoroDuration,
    pomodoroBreakDuration,
    eyeCareWorkDuration,
    eyeCareRestDuration,
    updateTimerSettings
  } = useTimer();

  const timerForm = useForm<TimerSettingsValues>({
    resolver: zodResolver(timerSettingsSchema),
    defaultValues: {
      pomodoroDuration,
      pomodoroBreakDuration,
      eyeCareWorkDuration: Math.floor(eyeCareWorkDuration / 60),
      eyeCareRestDuration,
    },
  });

  // Update form values when timer context values change
  useEffect(() => {
    timerForm.reset({
      pomodoroDuration,
      pomodoroBreakDuration,
      eyeCareWorkDuration: Math.floor(eyeCareWorkDuration / 60),
      eyeCareRestDuration,
    });
  }, [pomodoroDuration, pomodoroBreakDuration, eyeCareWorkDuration, eyeCareRestDuration, timerForm]);

  const onTimerSettingsSave = (data: TimerSettingsValues) => {
    updateTimerSettings({
      pomodoroDuration: data.pomodoroDuration,
      pomodoroBreakDuration: data.pomodoroBreakDuration,
      eyeCareWorkDuration: data.eyeCareWorkDuration * 60,
      eyeCareRestDuration: data.eyeCareRestDuration,
    });
  };

  return (
    <Tabs defaultValue="timers" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="timers">Timer Settings</TabsTrigger>
        <TabsTrigger value="focus-mode">Focus Mode</TabsTrigger>
      </TabsList>
      
      <TabsContent value="timers">
        <Card>
          <CardHeader>
            <CardTitle>Timer Settings</CardTitle>
            <CardDescription>
              Customize Eye Care timer durations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...timerForm}>
              <form onSubmit={timerForm.handleSubmit(onTimerSettingsSave)} className="space-y-6">
                
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Eye Care Timer</h3>
                  
                  <FormField
                    control={timerForm.control}
                    name="eyeCareWorkDuration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Work Duration (minutes)</FormLabel>
                        <div className="flex items-center space-x-4">
                          <FormControl>
                            <Slider
                              min={1}
                              max={120}
                              step={1}
                              value={[field.value]}
                              onValueChange={(vals) => field.onChange(vals[0])}
                            />
                          </FormControl>
                          <Input 
                            type="number" 
                            className="w-20" 
                            min={1}
                            max={120}
                            value={field.value}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </div>
                        <FormDescription>
                          How long to work before taking an eye break (1-120 minutes)
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={timerForm.control}
                    name="eyeCareRestDuration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rest Duration (seconds)</FormLabel>
                        <div className="flex items-center space-x-4">
                          <FormControl>
                            <Slider
                              min={5}
                              max={120}
                              step={5}
                              value={[field.value]}
                              onValueChange={(vals) => field.onChange(vals[0])}
                            />
                          </FormControl>
                          <Input 
                            type="number" 
                            className="w-20" 
                            min={5}
                            max={120}
                            step={5}
                            value={field.value}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </div>
                        <FormDescription>
                          How long each eye rest should last (5-120 seconds)
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </div>
                
                <Button type="submit">Save Timer Settings</Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="focus-mode">
        <FocusModeSettings />
      </TabsContent>
    </Tabs>
  );
}
