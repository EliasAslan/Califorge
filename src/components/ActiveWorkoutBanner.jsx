import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Play, Dumbbell, ChevronRight } from 'lucide-react';
import { loadActiveSession } from '@/lib/storage';
import { formatClock } from '@/lib/trainingLogic';

export default function ActiveWorkoutBanner() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSession, setActiveSession] = useState(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const s = loadActiveSession();
    if (s && !s.finishedAt && s.exercises?.length) {
      setActiveSession(s);
    } else {
      setActiveSession(null);
    }
  }, [location.pathname]);

  // Keep live time updated if active and not paused
  useEffect(() => {
    if (!activeSession || activeSession.paused) return;
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  if (!activeSession) return null;

  const elapsed = (activeSession.activeMs || 0) + (activeSession.resumeAt && !activeSession.paused ? now - activeSession.resumeAt : 0);
  const doneSets = activeSession.exercises.reduce((n, e) => n + e.sets.filter((s) => s.completed).length, 0);
  const totalSets = activeSession.exercises.reduce((n, e) => n + e.sets.length, 0);

  return (
    <div className="mx-auto max-w-[620px] px-3 mb-2 animate-fade-in pointer-events-auto">
      <button
        type="button"
        onClick={() => navigate('/workout')}
        className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl border border-brand/35 bg-card/90 backdrop-blur-xl shadow-lg shadow-black/30 hover:border-brand/60 active:scale-[0.99] transition-all text-left group"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--brand)', color: 'var(--brand-fg)' }}>
            <Dumbbell size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand">Workout in progress</span>
              {activeSession.paused && (
                <span className="text-[9px] font-bold uppercase tracking-wide px-1 py-0.2 rounded bg-muted text-muted-foreground">Paused</span>
              )}
            </div>
            <p className="text-xs font-bold truncate text-foreground leading-tight mt-0.5">{activeSession.workoutName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <span className="block text-xs font-bold tnum text-foreground">{formatClock(elapsed)}</span>
            <span className="block text-[10px] text-muted-foreground tnum">{doneSets}/{totalSets} sets</span>
          </div>
          <span className="w-7 h-7 rounded-lg bg-brand/15 text-brand flex items-center justify-center group-hover:bg-brand group-hover:text-brand-fg transition-colors">
            {activeSession.paused ? <Play size={13} fill="currentColor" /> : <ChevronRight size={15} />}
          </span>
        </div>
      </button>
    </div>
  );
}
