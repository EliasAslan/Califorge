import React, { useEffect, useRef, useState } from 'react';
import { SkipForward, Minus, Plus, Maximize2 } from 'lucide-react';
import { playRestCompleteSound, vibrate } from '@/lib/workoutFeedback';

export default function FloatingRestPill({ restEndsAt, totalDurationSec = 90, onDone, onAdjust, onMaximize, accent = '#3FB6F8' }) {
  const [remaining, setRemaining] = useState(0);
  const firedRef = useRef(false);

  useEffect(() => {
    firedRef.current = false;
    const tick = () => {
      const r = Math.max(0, Math.ceil((restEndsAt - Date.now()) / 1000));
      setRemaining(r);
      if (r <= 0) {
        if (!firedRef.current) {
          firedRef.current = true;
          playRestCompleteSound();
          vibrate([120, 60, 120]);
          onDone();
        }
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [restEndsAt, onDone]);

  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;
  const display = `${mm}:${String(ss).padStart(2, '0')}`;

  const pct = Math.max(0, Math.min(100, totalDurationSec > 0 ? (remaining / totalDurationSec) * 100 : 0));

  return (
    <div className="fixed bottom-4 inset-x-0 z-50 pointer-events-none px-4 animate-fade-in-up">
      <div className="mx-auto max-w-[500px] w-full pointer-events-auto rounded-2xl border border-border/80 bg-card/90 backdrop-blur-2xl shadow-2xl shadow-black/60 p-2.5 flex items-center justify-between gap-2.5">
        {/* Countdown & Mini circular indicator */}
        <div className="flex items-center gap-2.5 pl-1 min-w-0">
          <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-border"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                strokeWidth="3.5"
                strokeDasharray="100, 100"
                strokeDashoffset={100 - pct}
                strokeLinecap="round"
                stroke={accent}
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-[10px] font-bold tnum text-muted-foreground">{remaining}s</span>
          </div>

          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Resting</span>
            <span className="text-base font-extrabold tnum text-foreground tracking-tight leading-none">{display}</span>
          </div>
        </div>

        {/* Adjust & Skip controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onAdjust(-30)}
            aria-label="Subtract 30 seconds"
            className="h-8 px-2 rounded-lg border border-border bg-background/60 text-xs font-semibold inline-flex items-center gap-0.5 text-muted-foreground hover:text-foreground active:scale-95 transition-all"
          >
            <Minus size={12} />30s
          </button>
          <button
            type="button"
            onClick={() => onAdjust(30)}
            aria-label="Add 30 seconds"
            className="h-8 px-2 rounded-lg border border-border bg-background/60 text-xs font-semibold inline-flex items-center gap-0.5 text-muted-foreground hover:text-foreground active:scale-95 transition-all"
          >
            <Plus size={12} />30s
          </button>
          <button
            type="button"
            onClick={onDone}
            className="h-8 px-3 rounded-lg text-xs font-bold bg-emerald-500 text-emerald-950 inline-flex items-center gap-1 active:scale-95 transition-all shadow-sm"
          >
            <SkipForward size={13} strokeWidth={2.5} /> Skip
          </button>
          <button
            type="button"
            onClick={onMaximize}
            aria-label="Expand fullscreen rest timer"
            className="w-8 h-8 rounded-lg border border-border bg-background/40 text-muted-foreground hover:text-foreground inline-flex items-center justify-center active:scale-95 transition-all ml-0.5"
          >
            <Maximize2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
