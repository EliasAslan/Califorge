import React from 'react';
import { ChevronRight } from 'lucide-react';
import { getCycleWeeks } from '@/lib/trainingLogic';

// Cycle volume: sets logged per week across the 8-week cycle.
export default function PhaseHistoryWidget({ sessions, currentWeek, programId, onWeekClick, className }) {
  const weeks = getCycleWeeks(sessions, currentWeek, programId);
  const max = Math.max(...weeks.map((w) => w.sets));
  const maxSets = Math.max(1, max);
  const peak = max > 0 ? weeks.find((w) => w.sets === max) : null;

  return (
    <div className={`h-[184px] min-h-[184px] rounded-2xl border border-border bg-card/50 p-3 sm:p-4 flex flex-col ${className || ''}`}>
      <div className="flex items-start justify-between mb-2.5">
        <div>
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">Cycle volume</p>
          <p className="text-sm font-semibold mt-0.5">Sets logged each week</p>
        </div>
        {peak && (
          <span className="text-xs text-muted-foreground">
            Peak <span className="font-bold tnum ml-1 text-foreground">W{peak.week}</span>
          </span>
        )}
      </div>
      <div className="flex-1 flex items-end justify-between gap-1.5 min-h-[72px]">
        {weeks.map((w) => {
          const h = Math.round((w.sets / maxSets) * 100);
          const empty = !w.sets;
          return (
            <button
              key={w.week}
              onClick={(e) => { e.stopPropagation(); onWeekClick(w.week); }}
              className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group"
            >
              <span className="text-[10px] font-bold tnum" style={{ color: w.sets ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground) / 0.5)' }}>
                {w.sets || ''}
              </span>
              <div
                className="w-full transition-all group-active:scale-95"
                style={{
                  height: `${empty ? 8 : Math.max(10, h)}%`,
                  borderRadius: '4px',
                  background: w.isCurrent
                    ? 'hsl(var(--foreground))'
                    : w.sets
                      ? 'hsl(var(--muted-foreground) / 0.4)'
                      : 'transparent',
                  border: empty && !w.isCurrent ? '1px dashed hsl(var(--border))' : 'none',
                  opacity: empty && !w.isCurrent ? 0.7 : 1,
                }}
              />
              <span className="text-[10px] font-semibold tnum" style={{ color: w.isCurrent ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))' }}>
                {w.week}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
