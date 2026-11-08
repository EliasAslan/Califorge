import React from 'react';
import { CalendarCheck } from 'lucide-react';
import { getCurrentCycleSessions } from '@/lib/trainingLogic';

// Glance tile: current streak of consecutive trained days inside the active cycle.
export default function AttendanceWidget({ sessions, programId, className }) {
  const cycleSessions = getCurrentCycleSessions(sessions, programId);
  const trainedDays = new Set();
  cycleSessions.forEach((session) => {
    const day = new Date(session.startedAt || session.date || session.finishedAt || 0);
    if (Number.isFinite(day.getTime())) trainedDays.add(day.toDateString());
  });

  let streak = 0;
  const cursor = new Date();
  if (!trainedDays.has(cursor.toDateString())) cursor.setDate(cursor.getDate() - 1);
  while (trainedDays.has(cursor.toDateString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return (
    <div className={`h-[224px] min-h-[224px] rounded-2xl border border-border bg-card/50 p-4 sm:p-5 flex flex-col ${className || ''}`}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">Attendance</p>
        <CalendarCheck size={16} className="text-muted-foreground" />
      </div>
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <p className="text-5xl font-extrabold tnum leading-none">{streak}</p>
        <p className="mt-1.5 text-xs font-semibold text-foreground">day streak</p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">{cycleSessions.length} workouts this cycle</p>
      </div>
    </div>
  );
}
