import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { loadActiveSession } from '@/lib/storage';
import { formatClock } from '@/lib/trainingLogic';
import { withViewTransition } from '@/lib/viewTransition';

export default function ActiveWorkoutBanner() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSession, setActiveSession] = useState(null);
  const [now, setNow] = useState(Date.now());

  const refresh = useCallback(() => {
    const session = loadActiveSession();
    setActiveSession(session && !session.finishedAt && session.exercises?.length ? session : null);
  }, []);

  useEffect(() => {
    refresh();
  }, [location.pathname, refresh]);

  // storage.js emits this when a session starts, pauses, resumes or is discarded.
  useEffect(() => {
    const onChange = () => refresh();
    window.addEventListener('califorge:session-changed', onChange);
    return () => window.removeEventListener('califorge:session-changed', onChange);
  }, [refresh]);

  useEffect(() => {
    if (!activeSession || activeSession.paused) return undefined;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  // Home already has a full session card; the strip is for everywhere else.
  if (!activeSession || location.pathname === '/') return null;

  const elapsed =
    (activeSession.activeMs || 0) +
    (activeSession.resumeAt && !activeSession.paused ? now - activeSession.resumeAt : 0);
  const doneSets = activeSession.exercises.reduce(
    (total, exercise) => total + exercise.sets.filter((set) => set.completed).length,
    0,
  );
  const totalSets = activeSession.exercises.reduce((total, exercise) => total + exercise.sets.length, 0);

  return (
    <button
      type="button"
      onClick={() => withViewTransition(() => navigate('/workout'), 'workout-start')}
      className="flex h-12 w-full items-center gap-3.5 border-b border-border px-5 text-left transition-colors hover:bg-card/60"
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand)]" />
      <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-foreground">
        {activeSession.workoutName}
      </span>
      <span className="shrink-0 text-[11px] font-medium tabular-nums text-muted-foreground">
        {activeSession.paused ? 'Paused' : `${doneSets}/${totalSets}`}
      </span>
      <span className="shrink-0 text-[13px] font-semibold tabular-nums text-foreground">
        {formatClock(elapsed)}
      </span>
      <ChevronRight size={14} className="shrink-0 text-muted-foreground" aria-hidden="true" />
    </button>
  );
}
