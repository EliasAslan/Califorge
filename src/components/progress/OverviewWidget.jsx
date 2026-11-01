import React from 'react';
import { Check, Minus, ChevronRight, CalendarDays, Dumbbell, Clock3 } from 'lucide-react';
import { getSchedule, categoryColor } from '@/lib/programData';
import { formatDuration, getCycleConsistency, getProgramSessions } from '@/lib/trainingLogic';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function startOfCurrentWeek(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

export default function OverviewWidget({ sessions, currentWeek, programId, phase, onClick, className }) {
  const accent = categoryColor('pull');
  const schedule = getSchedule(programId);
  const consistency = getCycleConsistency(sessions, currentWeek, programId);
  const start = startOfCurrentWeek();
  const today = new Date();
  const programSessions = getProgramSessions(sessions, programId);

  let workouts = 0;
  let sets = 0;
  let durationSec = 0;
  const days = DAY_LABELS.map((label, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const daySessions = programSessions.filter((session) => {
      const sessionDate = new Date(session.date || session.finishedAt || session.startedAt || 0);
      return Number.isFinite(sessionDate.getTime()) && sameDay(sessionDate, date);
    });
    const completed = daySessions.filter((session) =>
      session.exercises?.some((exercise) => exercise.sets?.some((set) => set.completed && !set.skipped))
    );
    workouts += completed.length;
    completed.forEach((session) => {
      sets += (session.exercises || []).reduce((count, exercise) =>
        count + (exercise.sets || []).filter((set) => set.completed && !set.skipped).length, 0);
      durationSec += session.durationSec || 0;
    });
    return {
      label,
      today: sameDay(date, today),
      complete: completed.length > 0,
      rest: !!schedule[i]?.rest,
      date: date.getDate(),
    };
  });

  const stats = [
    { label: 'Workouts', value: workouts, icon: CalendarDays },
    { label: 'Working sets', value: sets, icon: Dumbbell },
    { label: 'Training time', value: formatDuration(durationSec) || '0m', icon: Clock3 },
  ];

  return (
    <section
      onClick={onClick}
      onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onClick?.(); } }}
      role="button"
      tabIndex={0}
      className={`rounded-2xl border border-border bg-gradient-to-br from-card to-card/60 p-4 sm:p-5 cursor-pointer transition-all hover:border-foreground/20 active:scale-[0.995] ${className || ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">Training overview</p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{phase.label}</h2>
            <span className="text-xs text-muted-foreground">Week {currentWeek} of 8</span>
          </div>
        </div>
        <ChevronRight size={18} className="mt-1 shrink-0 text-muted-foreground" />
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-border/70">
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, currentWeek / 8 * 100))}%`, background: accent }} />
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1.5 sm:gap-2">
        {days.map((day, i) => (
          <div key={day.label + i} className="flex min-w-0 flex-col items-center gap-1.5">
            <span className="text-[10px] font-semibold" style={{ color: day.today ? accent : 'hsl(var(--muted-foreground))' }}>{day.label}</span>
            <span
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full text-[11px] font-semibold"
              style={day.complete
                ? { background: accent, color: '#06180e', boxShadow: day.today ? `0 0 0 2px ${accent}55` : 'none' }
                : day.rest
                  ? { background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }
                  : { border: `1px solid ${day.today ? accent : 'hsl(var(--border))'}`, color: day.today ? accent : 'hsl(var(--muted-foreground))' }}
              aria-label={`${day.label} ${day.date}: ${day.complete ? 'workout completed' : day.rest ? 'rest day' : 'no workout logged'}`}
            >
              {day.complete ? <Check size={14} strokeWidth={3} /> : day.rest ? <Minus size={13} /> : day.date}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 divide-x divide-border border-t border-border pt-3.5">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="min-w-0 px-2 first:pl-0 last:pr-0">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Icon size={12} />
              <span className="truncate text-[10px] sm:text-[11px]">{label}</span>
            </div>
            <p className="mt-1 text-base sm:text-lg font-bold leading-tight tnum">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-background/60 px-3 py-2.5">
        <div className="min-w-0">
          <p className="text-xs font-semibold">Cycle consistency</p>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">Your progress through this training cycle</p>
        </div>
        <span className="shrink-0 text-lg font-bold tnum">{consistency.percent}%</span>
      </div>
    </section>
  );
}
