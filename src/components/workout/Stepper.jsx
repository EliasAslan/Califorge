import React from 'react';
import { Minus, Plus } from 'lucide-react';

// Numeric stepper with 48×48 touch targets, clear spacing, and a neutral
// visual treatment so it stays distinct from the primary CTA.
export default function Stepper({ value, onChange, step = 1, min = 0, max = 999, suffix = '', label }) {
  const dec = () => onChange(Math.max(min, Number(value) - step));
  const inc = () => onChange(Math.min(max, Number(value) + step));
  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={dec}
        aria-label={label ? `Decrease ${label}` : 'Decrease'}
        className="w-12 h-12 rounded-xl border border-border bg-card/60 flex items-center justify-center active:scale-95 transition-transform shrink-0"
      >
        <Minus size={20} />
      </button>
      <div className="flex-1 h-12 rounded-xl border border-border bg-background/60 flex items-center justify-center min-w-0">
        <span className="text-xl font-bold tnum">
          {value ?? 0}{suffix && <span className="text-sm text-muted-foreground ml-1 font-medium">{suffix}</span>}
        </span>
      </div>
      <button
        type="button"
        onClick={inc}
        aria-label={label ? `Increase ${label}` : 'Increase'}
        className="w-12 h-12 rounded-xl border border-border bg-card/60 flex items-center justify-center active:scale-95 transition-transform shrink-0"
      >
        <Plus size={20} />
      </button>
    </div>
  );
}