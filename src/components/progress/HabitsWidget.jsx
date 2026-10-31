import React from 'react';
import { ChevronRight } from 'lucide-react';
import { getCycleConsistency } from '@/lib/trainingLogic';

export default function HabitsWidget({ sessions, currentWeek, programId, onClick, className }) {
  const c = getCycleConsistency(sessions, currentWeek, programId);
  const r = 30;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - c.percent / 100);

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      className={`rounded-2xl border border-border bg-card/50 p-5 active:scale-[0.99] transition-transform cursor-pointer flex flex-col ${className || ''}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">Habits</p>
        <ChevronRight size={18} className="text-muted-foreground" />
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="relative w-20 h-20">
          <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
            <circle cx="40" cy="40" r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="7" />
            <circle cx="40" cy="40" r={r} fill="none" stroke="hsl(var(--foreground))" strokeWidth="7" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold tnum">{c.percent}%</span>
          </div>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground text-center">consistency</p>
    </div>
  );
}