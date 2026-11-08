import React from 'react';
import { ChevronRight } from 'lucide-react';
import { getCycleConsistency } from '@/lib/trainingLogic';

// Warm minimal consistency widget: one big percentage number with a subtle ring.
export default function ConsistencyWidget({ sessions, currentWeek, programId, className }) {
  const c = getCycleConsistency(sessions, currentWeek, programId);

  return (
    <div
      className={`rounded-2xl border border-border bg-card/50 p-3 sm:p-4 flex flex-col items-center justify-center text-center ${className || ''}`}
    >
      <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground font-semibold mb-2">Cycle consistency</p>
      <span className="text-3xl font-extrabold tnum leading-none">{c.percent}%</span>
      <p className="mt-1 text-[10px] text-muted-foreground">
        {c.completed} of {c.planned} planned workouts done
      </p>
    </div>
  );
}
