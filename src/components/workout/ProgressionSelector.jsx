import React from 'react';

// Per-set progression picker for exercises that have a progression ladder
// (e.g. Front Lever, Planche). The chosen level is stored on the set.
export default function ProgressionSelector({ levels, value, onChange, accent }) {
  if (!levels || !levels.length) return null;
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mb-2">Progression</p>
      <div className="flex flex-wrap gap-1.5">
        {levels.map((lvl) => {
          const sel = value === lvl;
          return (
            <button
              key={lvl}
              onClick={() => onChange(sel ? null : lvl)}
              className="h-8 px-3 rounded-lg text-xs font-medium border transition-colors"
              style={
                sel
                  ? { background: `${accent}1f`, color: accent, borderColor: `${accent}66` }
                  : { color: 'hsl(var(--muted-foreground))' }
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