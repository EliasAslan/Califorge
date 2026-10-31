import React from 'react';
import { Check, Minus, ChevronRight } from 'lucide-react';
import { getSchedule, categoryColor } from '@/lib/programData';
import { startOfWeek, isSameDay, formatDuration } from '@/lib/trainingLogic';

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function WeekWidget({ sessions, onClick, className }) {
  const accent = categoryColor('pull');
  const start = startOfWeek();
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });

  let workouts = 0, sets = 0, durationSec = 0;
  const states = days.map((d, i) => {
    const sched = getSchedule()[i];
    const daySessions = sessions.filter((s) => isSameDay(new Date(s.date), d));
    const loggedSessions = daySessions.filter((s) =>
      s.exercises?.some((e) => e.sets?.some((set) => set.completed && !set.skipped))
    );
    workouts += loggedSessions.length;
    loggedSessions.forEach((sess) => {
      sets += sess.exercises.reduce((n, e) => n + e.sets.filter((x) => x.completed && !x.skipped).length, 0);
      durationSec += sess.durationSec || 0;
    });
    return {
      isRest: !!sched.rest,
      completed: loggedSessions.length > 0,
      isToday: isSameDay(d, today),
    };
  });

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      className={`rounded-2xl border border-border bg-card/50 p-5 active:scale-[0.99] transition-transform cursor-pointer flex flex-col ${className || ''}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">This Week</p>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-4xl font-extrabold tnum leading-none">{workouts}</span>
            <span className="text-sm text-muted-foreground">workouts logged</span>
          </div>
        </div>
        <ChevronRight size={18} className="text-muted-foreground" />
      </div>

      <div className="flex-1 flex items-center">
        <div className="flex justify-between w-full">
          {states.map((st, i) => {
            return (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] font-semibold" style={st.isToday ? { color: accent } : { color: 'hsl(var(--muted-foreground))' }}>
                  {DAY_LETTERS[i]}
                </span>
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={
                    st.completed
                      ? { background: accent, color: '#06180e', boxShadow: st.isToday ? `0 0 0 2px ${accent}55` : 'none' }
                      : st.isRest
                      ? { background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }
                      : { border: `1.5px solid ${st.isToday ? accent : 'hsl(var(--border))'}` }
                  }
                >
                  {st.completed ? <Check size={16} strokeWidth={3} /> : st.isRest ? <Minus size={14} /> : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-5 pt-3.5 border-t border-border text-xs">
        <span className="text-muted-foreground">Sets <span className="text-foreground font-semibold tnum ml-1">{sets}</span></span>
        <span className="text-muted-foreground">Time <span className="text-foreground font-semibold tnum ml-1">{formatDuration(durationSec) || '0s'}</span></span>
      </div>
    </div>
  );
}