import React, { useEffect, useRef, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { getExercise } from '@/lib/programData';
import { formatTarget } from '@/lib/trainingLogic';
import { playRestCompleteSound, vibrate } from '@/lib/workoutFeedback';

export default function RestState({
  restEndsAt,
  totalDurationSec = 90,
  nextExercise,
  nextSetIndex = 0,
  onDone,
  onAdjust,
  accent = '#3FB6F8',
}) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.ceil(((restEndsAt || Date.now()) - Date.now()) / 1000)),
  );
  const firedRef = useRef(false);

  useEffect(() => {
    firedRef.current = false;
    const tick = () => {
      const seconds = Math.max(0, Math.ceil((restEndsAt - Date.now()) / 1000));
      setRemaining(seconds);
      if (seconds <= 0 && !firedRef.current) {
        firedRef.current = true;
        playRestCompleteSound();
        vibrate([120, 60, 120]);
        onDone();
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [restEndsAt, onDone]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const display = `${minutes}:${String(seconds).padStart(2, '0')}`;
  const pct = Math.max(
    0,
    Math.min(100, totalDurationSec > 0 ? (remaining / totalDurationSec) * 100 : 0),
  );
  const nextDefinition = nextExercise ? getExercise(nextExercise.exerciseId) || nextExercise : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col justify-between py-4">
      <div className="flex flex-1 flex-col justify-center">
        <p className="text-[12px] font-semibold text-[var(--console-steel)]">Rest</p>
        <div className="console-rest-time mt-2" aria-live="off">{display}</div>
        <div
          className="console-rest-track mt-6"
          role="progressbar"
          aria-label="Rest remaining"
          aria-valuemin={0}
          aria-valuemax={Math.max(totalDurationSec, remaining)}
          aria-valuenow={remaining}
        >
          <div
            className="console-rest-fill"
            style={{ transform: `scaleX(${pct / 100})`, background: accent }}
          />
        </div>

        {nextExercise && (
          <div className="mt-8 border-t border-[var(--console-line)] pt-5">
            <p className="text-[11px] font-medium text-[var(--console-steel)]">
              Next set {nextSetIndex + 1} of {nextExercise.sets.length}
            </p>
            <p className="mt-1 text-[24px] font-bold leading-tight tracking-[-0.03em] text-[var(--console-chalk)]">
              {nextExercise.name}
            </p>
            <p className="mt-0.5 text-[13px] text-[var(--console-steel)]">{nextExercise.variation}</p>
            {nextDefinition && (
              <p className="mt-2 text-[13px] text-[var(--console-steel)]">
                Target <span className="font-semibold text-[var(--console-chalk)]">{formatTarget(nextDefinition)}</span>
              </p>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2 pt-4">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onAdjust(-30)}
            className="flex h-11 items-center justify-center gap-1.5 border border-[var(--console-line)] text-[12px] font-semibold text-[var(--console-steel)] transition-colors hover:text-[var(--console-chalk)]"
          >
            <Minus size={14} /> 30s
          </button>
          <button
            type="button"
            onClick={() => onAdjust(30)}
            className="flex h-11 items-center justify-center gap-1.5 border border-[var(--console-line)] text-[12px] font-semibold text-[var(--console-steel)] transition-colors hover:text-[var(--console-chalk)]"
          >
            <Plus size={14} /> 30s
          </button>
        </div>
        <button type="button" onClick={onDone} className="console-primary">
          Skip rest
        </button>
      </div>
    </div>
  );
}
