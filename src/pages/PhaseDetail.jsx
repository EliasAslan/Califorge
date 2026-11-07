import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronDown } from 'lucide-react';
import { getWeeks, getActiveProgramId } from '@/lib/programData';
import { useSessions } from '@/hooks/useTrainingData';
import { loadCurrentWeek } from '@/lib/storage';
import {
  getCycleWeeks, getPhaseForWeek, getWeekSessions, formatDuration, getCurrentCycleSessions,
} from '@/lib/trainingLogic';

export default function PhaseDetail() {
  const navigate = useNavigate();
  const { data: sessions = [] } = useSessions();
  const programId = getActiveProgramId();
  const currentWeek = loadCurrentWeek(programId);
  const programSessions = getCurrentCycleSessions(sessions, programId);
  const weeks = getCycleWeeks(sessions, currentWeek, programId);
  const maxSets = Math.max(1, ...weeks.map((w) => w.sets));
  const phase = getPhaseForWeek(currentWeek, programId);
  const urlParams = new URLSearchParams(window.location.search);
  const initialWeek = Number(urlParams.get('week')) || currentWeek;
  const [open, setOpen] = useState(initialWeek);

  return (
    <div className="px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-10">
      <button onClick={() => navigate('/progress')} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3">
        <ChevronLeft size={18} /> Progress
      </button>
      <h1 className="text-2xl font-bold tracking-tight">This Phase</h1>
      <p className="text-sm text-muted-foreground">{phase.label} · Week {currentWeek} / 8</p>

      <div className="rounded-2xl border border-border bg-card/50 p-4 mt-5">
        <div className="flex items-end justify-between gap-1.5 h-32">
          {weeks.map((w) => {
            const h = Math.round((w.sets / maxSets) * 100);
            return (
              <button
                key={w.week}
                onClick={() => setOpen(open === w.week ? -1 : w.week)}
                className="flex-1 flex flex-col items-center gap-2 h-full justify-end"
              >
                <span className="text-[10px] font-bold tnum" style={{ color: w.sets ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))' }}>
                  {w.sets || ''}
                </span>
                <div
                  className="w-full rounded-md transition-all"
                  style={{
                    height: `${Math.max(w.sets ? 10 : 3, h)}%`,
                    background: w.isCurrent ? 'hsl(var(--foreground))' : w.sets ? 'hsl(var(--muted-foreground) / 0.5)' : 'hsl(var(--border))',
                  }}
                />
                <span className="text-[10px] font-semibold tnum" style={{ color: w.isCurrent ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))' }}>
                  W{w.week}
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-muted-foreground text-center mt-3">Bar height = total sets · tap a week for details</p>
      </div>

      <div className="space-y-2 mt-4">
        {weeks.map((w) => {
          const meta = getWeeks(programId).find((x) => x.week === w.week);
          const isOpen = open === w.week;
          const ws = getWeekSessions(programSessions, w.week);
          return (
            <div key={w.week} className={`rounded-xl border bg-card/50 overflow-hidden ${w.isCurrent ? 'border-foreground/30' : 'border-border'}`}>
              <button onClick={() => setOpen(isOpen ? -1 : w.week)} className="w-full flex items-center justify-between p-3.5">
                <div className="flex items-center gap-3">
                  <span
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold tnum"
                    style={w.isCurrent ? { background: 'hsl(var(--muted))', color: 'hsl(var(--foreground))' } : { background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))' }}
                  >
                    W{w.week}
                  </span>
                  <div className="text-left">
                    <p className="text-sm font-semibold capitalize">{meta.phase}</p>
                    <p className="text-xs text-muted-foreground">{w.workouts} workouts · {w.sets} sets · {formatDuration(w.durationSec) || '0s'}</p>
                  </div>
                </div>
                <ChevronDown size={18} className={`text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && (
                <div className="px-3.5 pb-3.5 border-t border-border">
                  {ws.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-3">No sessions logged this week.</p>
                  ) : (
                    <div className="space-y-1.5 pt-2">
                      {ws.map((s) => {
                        const sets = s.exercises.reduce((n, e) => n + e.sets.filter((x) => x.completed && !x.skipped).length, 0);
                        return (
                          <button
                            key={s.id}
                            onClick={() => navigate(`/history/${s.id}`)}
                            className="w-full flex items-center justify-between p-2.5 rounded-lg bg-background/50 text-left"
                          >
                            <div>
                              <p className="text-sm font-medium">{s.workoutName}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(s.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · {sets} sets · {formatDuration(s.durationSec) || '0s'}
                              </p>
                            </div>
                            <ChevronLeft size={16} className="text-muted-foreground rotate-180" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}