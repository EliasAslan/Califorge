import React from 'react';

// A progression is a sequence, so it is drawn as a segmented track rather than
// a row of chips. Tapping the active segment clears it.
export default function ProgressionSelector({ levels, value, onChange, accent = '#3FB6F8', compact = false }) {
  if (!levels || !levels.length) return null;

  const current = levels.indexOf(value);

  return (
    <div
      className={`console-ladder ${compact ? 'is-compact' : ''}`}
      role="group"
      aria-label="Progression level"
      style={{ '--console-signal': accent }}
    >
      {levels.map((level, index) => {
        const isCurrent = value === level;
        const isPast = current > -1 && index < current;
        return (
          <button
            key={level}
            type="button"
            onClick={() => onChange(isCurrent ? null : level)}
            aria-pressed={isCurrent}
            title={level}
            className={`console-ladder-step ${isPast ? 'is-past' : ''} ${isCurrent ? 'is-current' : ''}`}
          >
            <span className="console-ladder-bar" />
            <span className="console-ladder-label">{level}</span>
          </button>
        );
      })}
    </div>
  );
}
