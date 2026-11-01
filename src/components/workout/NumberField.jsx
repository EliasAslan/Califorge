import React, { useEffect, useState } from 'react';
import { Minus, Plus } from 'lucide-react';

// Compact stepper with an integrated numeric input.
// Null stays empty instead of being silently recorded as zero.
export default function NumberField({
  value, onChange, step = 1, min = 0, max = 999, suffix = '', label, seed, invalid = false, size = 'md',
}) {
  const [draft, setDraft] = useState(value == null ? '' : String(value));
  useEffect(() => { setDraft(value == null ? '' : String(value)); }, [value]);

  const clamp = (n) => {
    const decimals = String(step).split('.')[1]?.length || 0;
    return Number(Math.min(max, Math.max(min, n)).toFixed(decimals));
  };
  const bump = (dir) => {
    if (value == null) { onChange(clamp(seed ?? (dir > 0 ? step : min))); return; }
    onChange(clamp(Number(value) + dir * step));
  };
  const commit = () => {
    const raw = draft.trim().replace(',', '.');
    if (raw === '') { if (value != null) onChange(null); return; }
    const n = Number(raw);
    if (Number.isFinite(n)) onChange(clamp(n));
    else setDraft(value == null ? '' : String(value));
  };

  const h = size === 'sm' ? 'h-11' : 'h-12';
  const btn = `${h} w-11 shrink-0 flex items-center justify-center text-muted-foreground hover:text-foreground active:bg-foreground/5 disabled:opacity-30 transition-colors`;

  return (
    <div className={`flex items-stretch rounded-xl border bg-background/60 overflow-hidden ${invalid ? 'border-red-400/70' : 'border-border'} focus-within:border-foreground/40`}>
      <button type="button" onClick={() => bump(-1)} disabled={value != null && Number(value) <= min}
        aria-label={`Decrease ${label}`} className={btn}>
        <Minus size={17} />
      </button>
      <label className="flex-1 min-w-0 flex items-center justify-center gap-1 border-x border-border/70 cursor-text">
        <span className="sr-only">{label}</span>
        <input
          type="text"
          inputMode={String(step).includes('.') ? 'decimal' : 'numeric'}
          value={draft}
          placeholder="—"
          aria-invalid={invalid || undefined}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onFocus={(e) => e.target.select()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); }
            if (e.key === 'ArrowUp') { e.preventDefault(); bump(1); }
            if (e.key === 'ArrowDown') { e.preventDefault(); bump(-1); }
            if (e.key === 'Escape') { setDraft(value == null ? '' : String(value)); e.currentTarget.blur(); }
          }}
          className={`w-full min-w-0 bg-transparent text-center font-bold tnum outline-none placeholder:text-muted-foreground/50 ${size === 'sm' ? 'text-lg' : 'text-xl'}`}
          style={{ maxWidth: '5ch' }}
        />
        {suffix && <span className="text-xs font-medium text-muted-foreground">{suffix}</span>}
      </label>
      <button type="button" onClick={() => bump(1)} disabled={value != null && Number(value) >= max}
        aria-label={`Increase ${label}`} className={btn}>
        <Plus size={17} />
      </button>
    </div>
  );
}
