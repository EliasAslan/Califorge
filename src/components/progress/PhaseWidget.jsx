import React from 'react';
import { ChevronRight } from 'lucide-react';
import { getPhaseForWeek } from '@/lib/trainingLogic';

export default function PhaseWidget({ currentWeek, programId, onClick, className }) {
  const phase = getPhaseForWeek(currentWeek, programId);
  const pct = Math.round((currentWeek / 8) * 100);

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      className={`rounded-2xl border border-border bg-card/50 p-5 active:scale-[0.99] transition-transform cursor-pointer flex flex-col ${className || ''}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">This Phase</p>
        <ChevronRight size={18} className="text-muted-foreground" />
      </div>
      <div className="flex-1 flex flex-col justify-end">
        <p className="text-2xl font-extrabold leading-tight">{phase.label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">Week {currentWeek} of 8</p>
        <div className="mt-3 h-2 rounded-full bg-border/60 overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'hsl(var(--foreground))' }} />
        </div>
      </div>
    </div>
  );
}