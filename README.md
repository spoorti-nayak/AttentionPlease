Attention Please - (Not just a side project — a daily-use product with purpose)


Attention Please is a cross-platform desktop productivity and digital wellness application built using Electron, React, and TypeScript. Designed to support deep focus and healthier screen habits, it integrates seamlessly into your system tray to gently guide users toward balanced and distraction-free computing.

A desktop companion that promotes mindfulness without getting in your way.

Key Features

Productivity Timers

* Customizable Pomodoro cycles for work and breaks
* Eye care reminders using the 20-20-20 rule (every 20 minutes, look 20 feet away for 20 seconds)
* System tray integration with non-intrusive notifications
* Visual progress tracking with animated timers

Focus Mode

* App blocking with a customizable whitelist
* Detects when users switch to blocked or distracting apps
* Sends real-time alerts for focus violations

Wellness Reminders

* Hydration reminders at user-defined intervals
* Posture checks to prevent slouching and strain
* All reminders run in the background with tray alerts

User Management

* Secure JWT-based authentication
* Email-based password reset
* Multi-user support with isolated preferences
* Cross-device sync of settings

Tech Stack

Layer - Tech Used
Frontend - React 18, TypeScript, Tailwind CSS, Framer Motion, React Hook Form, Zod
Backend - Node.js, Express, MongoDB with Mongoose
Desktop - Electron, System Tray API, Native OS Notifications
State/Data - React Context, React Query, Local Storage

---

Architecture & Design

* Modular Architecture: Clean separation of UI, services, and logic
* Event-Driven Background Tasks: Timers, reminders, and focus checks run silently
* Design Patterns:

  * Singleton for tray services and background tasks
  * Observer for real-time state updates and user alerts
* Modern UI/UX: Responsive, dark/light mode, accessible and intuitive




Quick Start

1. Clone the repository from [https://github.com/yourusername/attention-please.git](https://github.com/yourusername/attention-please.git)
2. Navigate into the project folder
3. Install dependencies with npm install
4. Run in development mode with npm run dev
5. Launch the desktop app with npm run electron


Why It Stands Out

* Full-stack desktop application
* Real use-case: wellness and productivity
* Background services and system-level integration
* Elegant UI with meaningful utility
* Recruiters appreciate real-world, user-focused tools


