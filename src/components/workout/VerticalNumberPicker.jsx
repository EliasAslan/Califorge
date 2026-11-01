import React, { useRef } from 'react';
import { Minus, Plus } from 'lucide-react';
import { vibrate } from '@/lib/workoutFeedback';

// Drag vertically to change a discrete value. Buttons and keyboard remain available
// so the wheel is an enhancement, not the only way to enter a number.
export default function VerticalNumberPicker({
  value, onChange, step = 1, min = 0, max = 999, suffix = '', label,
}) {
  const drag = useRef(null);
  const current = Number.isFinite(Number(value)) ? Number(value) : min;
  const clamp = (n) => Math.min(max, Math.max(min, Math.round(n / step) * step));
  const change = (n, feedback = false) => {
    const next = clamp(n);
    if (next !== current) {
      onChange(next);
      if (feedback) vibrate([8]);
    }
  };
  const onPointerDown = (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    drag.current = { y: event.clientY, value: current, moved: false, lastStep: 0 };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const onPointerMove = (event) => {
    if (!drag.current) return;
    const distance = drag.current.y - event.clientY;
    const steps = Math.trunc(distance / 18);
    if (steps !== drag.current.lastStep) {
      drag.current.moved = true;
      drag.current.lastStep = steps;
      change(drag.current.value + steps * step, true);
    }
  };
  const onPointerUp = () => { drag.current = null; };

  return (
    <div className="flex items-center gap-2.5">
      <button type="button" onClick={() => change(current - step)} aria-label={label ? `Decrease ${label}` : 'Decrease'}
        className="w-10 h-10 rounded-xl border border-border bg-card/60 flex items-center justify-center active:scale-95 shrink-0">
        <Minus size={17} />
      </button>
      <div className="flex-1 min-w-0 select-none touch-pan-x">
        <div className="relative mx-auto w-full max-w-[190px] rounded-2xl border border-border bg-background/60 overflow-hidden"
          onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
          role="spinbutton" tabIndex={0} aria-label={label || 'Value'} aria-valuenow={current} aria-valuemin={min} aria-valuemax={max}
          onKeyDown={(event) => {
            if (event.key === 'ArrowUp' || event.key === 'ArrowRight') { event.preventDefault(); change(current + step); }
            if (event.key === 'ArrowDown' || event.key === 'ArrowLeft') { event.preventDefault(); change(current - step); }
            if (event.key === 'Home') { event.preventDefault(); change(min); }
            if (event.key === 'End') { event.preventDefault(); change(max); }
          }}>
          <div className="h-5 text-center text-[11px] text-muted-foreground/50 tnum">{current + step <= max ? current + step : ''}</div>
          <div className="flex items-center justify-center gap-1 h-10 border-y border-border/70 bg-card/70 cursor-ns-resize">
            <span className="text-2xl font-bold tracking-tight tnum">{current}</span>
            {suffix && <span className="text-xs font-medium text-muted-foreground mt-1">{suffix}</span>}
          </div>
          <div className="h-5 text-center text-[11px] text-muted-foreground/50 tnum">{current - step >= min ? current - step : ''}</div>
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-1">Drag up or down</p>
      </div>
      <button type="button" onClick={() => change(current + step)} aria-label={label ? `Increase ${label}` : 'Increase'}
        className="w-10 h-10 rounded-xl border border-border bg-card/60 flex items-center justify-center active:scale-95 shrink-0">
        <Plus size={17} />
      </button>
    </div>
  );
}
