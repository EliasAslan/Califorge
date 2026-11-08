import React from 'react';
import { Calendar } from 'lucide-react';

// Attendance calendar: small date cells showing which days had training in the last 30 days.
export default function AttendanceCalendarWidget({ sessions, className }) {
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - 29);
  const recent = sessions.filter((s) => new Date(s.date || s.startedAt || 0) >= start);
  const daysWithTraining = new Set(recent.map((s) => new Date(s.date || s.startedAt || 0).toDateString()));
  const trainingDays = daysWithTraining.size;

  return (
    <div
      onClick={() => {}}
      role="button"
      tabIndex={0}
      className={`rounded-2xl border border-border bg-card/50 p-3 sm:p-4 flex flex-col ${className || ''}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">Attendance</p>
          <p className="text-xl font-bold tnum leading-none">{trainingDays}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">training days, last 30 days</p>
        </div>
        <Calendar size={16} className="mt-1 text-muted-foreground shrink-0" />
      </div>

      <div className="mt-auto grid grid-cols-7 gap-1 h-[64px]">
        {Array.from({ length: 30 }, (_, i) => {
          const d = new Date(start);
          d.setDate(start.getDate() + i);
          const done = daysWithTraining.has(d.toDateString());
          const isToday = d.toDateString() === today.toDateString();
          return (
            <div
              key={i}
              className={`aspect-square rounded-md transition-all ${done ? 'bg-foreground' : 'bg-border/50'} ${isToday ? 'ring-1 ring-border' : ''}`}
            />
          );
        })}
      </div>
    </div>
  );
}
