import React from 'react';

// Per-set progression picker for exercises with progression ladders
// (e.g. Front Lever, Planche). The chosen level is stored on the set.
export default function ProgressionSelector({ levels, value, onChange, accent = '#3FB6F8' }) {
  if (!levels || !levels.length) return null;

  return (
    <div className="py-1">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Progression level</p>
        <span className="text-[11px] font-semibold text-foreground">{value || 'Select level'}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {levels.map((lvl) => {
          const sel = value === lvl;
          return (
            <button
              key={lvl}
              type="button"
              onClick={() => onChange(sel ? null : lvl)}
              className={`h-8 px-3 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                sel
                  ? 'border-transparent shadow-sm'
                  : 'border-border/80 bg-card/40 text-muted-foreground hover:text-foreground hover:border-border'
              }`}
              style={
                sel
                  ? {
                      background: `color-mix(in srgb, ${accent} 22%, hsl(var(--card)))`,
                      borderColor: accent,
                      color: accent,
                      boxShadow: `0 0 12px ${accent}33`,
                    }
                  : undefined
              }
            >
              {lvl}
            </button>
          );
        })}
      </div>
    </div>
  );
}
