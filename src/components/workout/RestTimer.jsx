import React, { useEffect, useRef, useState } from 'react';
import { SkipForward, Minus, Plus, Minimize2 } from 'lucide-react';
import { playRestCompleteSound, vibrate } from '@/lib/workoutFeedback';

export default function RestTimer({ restEndsAt, totalDurationSec = 90, onDone, onAdjust, onMinimize, accent = '#3FB6F8' }) {
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
    <div className="relative flex flex-col items-center text-center py-6 animate-scale-in">
      {/* Minimize button if onMinimize provided */}
      {onMinimize && (
        <button
          type="button"
          onClick={onMinimize}
          aria-label="Minimize rest timer"
          className="absolute right-0 top-0 w-9 h-9 rounded-xl border border-border bg-card/60 flex items-center justify-center text-muted-foreground hover:text-foreground active:scale-95 transition-all"
        >
          <Minimize2 size={16} />
        </button>
      )}

      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold mb-6">Rest countdown</p>

      {/* Circular Progress Ring */}
      <div className="relative w-52 h-52 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="44"
            className="text-border/60"
            strokeWidth="5"
            stroke="currentColor"
            fill="transparent"
          />
          <circle
            cx="50"
            cy="50"
            r="44"
            strokeWidth="5"
            strokeDasharray={276.46}
            strokeDashoffset={276.46 * (1 - pct / 100)}
            strokeLinecap="round"
            stroke={accent}
            fill="transparent"
            style={{
              transition: 'stroke-dashoffset 0.3s ease-out',
              filter: `drop-shadow(0 0 8px ${accent}88)`,
            }}
          />
        </svg>

        {/* Inner digital display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-5xl font-extrabold tnum tracking-tight text-foreground">{display}</span>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-1">{remaining}s remaining</span>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2.5 mt-8">
        <button
          type="button"
          onClick={() => onAdjust(-30)}
          className="h-11 px-4 rounded-xl border border-border bg-card/60 text-xs font-bold inline-flex items-center gap-1.5 active:scale-95 transition-transform"
        >
          <Minus size={15} /> 30s
        </button>
        <button
          type="button"
          onClick={() => onAdjust(30)}
          className="h-11 px-4 rounded-xl border border-border bg-card/60 text-xs font-bold inline-flex items-center gap-1.5 active:scale-95 transition-transform"
        >
          <Plus size={15} /> 30s
        </button>
        <button
          type="button"
          onClick={onDone}
          className="h-11 px-6 rounded-xl text-sm font-bold bg-emerald-500 text-emerald-950 inline-flex items-center gap-2 active:scale-95 transition-transform shadow-lg shadow-emerald-950/20"
        >
          <SkipForward size={16} strokeWidth={2.5} /> Skip rest
        </button>
      </div>
    </div>
  );
}
