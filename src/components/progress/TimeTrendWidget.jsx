import React from 'react';
import { Clock3 } from 'lucide-react';
import { getCurrentCycleSessions, formatDuration } from '@/lib/trainingLogic';
import { getWeeks } from '@/lib/programData';

// Glance tile: how much time was actually spent training this week, with a
// per-week bar trend and a delta against the previous week.
export default function TimeTrendWidget({ sessions, programId, currentWeek, className }) {
  const cycleSessions = getCurrentCycleSessions(sessions, programId);
  const weeks = getWeeks(programId);
  const totals = weeks.map((w) => ({
    week: w.week,
    sec: cycleSessions.filter((s) => Number(s.week) === w.week).reduce((n, s) => n + (s.durationSec || 0), 0),
  }));
  const current = totals.find((t) => t.week === currentWeek) || totals[totals.length - 1];
  const previous = totals.find((t) => t.week === currentWeek - 1) || { sec: 0 };
  const deltaPct = previous.sec > 0 ? Math.round(((current.sec - previous.sec) / previous.sec) * 100) : null;
  const maxSec = Math.max(1, ...totals.map((t) => t.sec));
  const buckets = totals.slice(-6);
  const points = buckets.map((b, index) => {
    const x = buckets.length < 2 ? 50 : 5 + (index / (buckets.length - 1)) * 90;
    const y = 35 - ((b.sec / maxSec) * 26);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className={`h-[224px] min-h-[224px] min-w-0 overflow-hidden rounded-2xl border border-border bg-card/50 p-2.5 sm:p-4 flex flex-col ${className || ''}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground font-semibold">Training time</p>
        <Clock3 size={14} className="text-muted-foreground" />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-extrabold tnum leading-none">{formatDuration(current.sec)}</span>
        <span className="text-[10px] text-muted-foreground">this week</span>
      </div>
      <p className="mt-1 text-[10px] text-muted-foreground">
        {deltaPct == null ? 'No previous week yet' : `${deltaPct > 0 ? '+' : ''}${deltaPct}% vs last week`}
      </p>
      <div className="flex-1 relative mt-1 min-h-[56px]">
        <svg viewBox="0 0 100 40" className="absolute inset-0 h-full w-full overflow-visible" aria-label="Training time trend">
          <polyline points={points} fill="none" stroke="hsl(var(--foreground))" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}
