import React from 'react';
import { ChevronRight } from 'lucide-react';
import { getCycleWeeks } from '@/lib/trainingLogic';

// Training time trend: minutes trained per week across the cycle.
export default function TrainingTimeWidget({ sessions, currentWeek, programId, className }) {
  const weeks = getCycleWeeks(sessions, currentWeek, programId);
  const totalMinutes = Math.round(
    weeks.reduce((n, w) => n + (w.durationSec || 0), 0) / 60
  );

  return (
    <div
      onClick={() => {}}
      role="button"
      tabIndex={0}
      className={`rounded-2xl border border-border bg-card/50 p-3 sm:p-4 flex flex-col ${className || ''}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">Training time</p>
          <p className="text-xl font-bold tnum leading-none">{totalMinutes}m</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">logged this cycle</p>
        </div>
        <ChevronRight size={14} className="mt-1 text-muted-foreground shrink-0" />
      </div>

      <div className="mt-auto flex items-end justify-between gap-1 h-[80px]">
        {weeks.map((w) => {
          const minutes = Math.round((w.durationSec || 0) / 60);
          const h = Math.max(6, (minutes / 120) * 100);
          return (
            <div key={w.week} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
              <div
                className="w-full rounded-t-lg transition-all group-hover:scale-y-110"
                style={{
                  height: `${h}%`,
                  background: w.isCurrent ? 'hsl(var(--foreground))' : minutes > 0 ? 'hsl(var(--muted-foreground) / 0.4)' : 'transparent',
                }}
              />
              <span className="text-[10px] font-bold tnum" style={{ color: w.isCurrent ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))' }}>
                {minutes}m
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
