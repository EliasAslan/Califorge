import React, { useEffect, useRef, useState } from 'react';
import { SkipForward, Minus, Plus } from 'lucide-react';
import { playRestCompleteSound, vibrate } from '@/lib/workoutFeedback';

export default function RestTimer({ restEndsAt, onDone, onAdjust, accent = '#3FB6F8' }) {
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
        clearInterval(id);
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [restEndsAt]);

  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;
  const display = `${mm}:${String(ss).padStart(2, '0')}`;

  return (
    <div className="flex flex-col items-center text-center py-6 animate-scale-in">
      <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground font-semibold mb-4">Rest</p>
      <div className="relative w-44 h-44 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-border" />
        <div
          className="absolute inset-0 rounded-full animate-pulse-ring"
          style={{ boxShadow: '0 0 40px hsl(var(--foreground) / 0.25)', border: '1px solid hsl(var(--border))' }}
        />
        <span className="text-5xl font-bold tnum tracking-tight">{display}</span>
      </div>
      <div className="flex items-center gap-2 mt-7">
        <button
          onClick={() => onAdjust(-30)}
          className="h-11 px-3.5 rounded-xl border border-border bg-background/60 text-sm font-medium inline-flex items-center gap-1.5 active:scale-95 transition-transform"
        >
          <Minus size={15} /> 30s
        </button>
        <button
          onClick={() => onAdjust(30)}
          className="h-11 px-3.5 rounded-xl border border-border bg-background/60 text-sm font-medium inline-flex items-center gap-1.5 active:scale-95 transition-transform"
        >
          <Plus size={15} /> 30s
        </button>
        <button
          onClick={onDone}
          className="h-11 px-5 rounded-xl text-sm font-semibold inline-flex items-center gap-2 active:scale-95 transition-transform"
          style={{ background: 'var(--brand)', color: 'var(--brand-fg)' }}
        >
          <SkipForward size={16} /> Skip
        </button>
      </div>
    </div>
  );
}