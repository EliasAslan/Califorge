import React from 'react';
import { ChevronRight, Scale } from 'lucide-react';

const displayWeight = (kg, unit) => unit === 'lb' ? kg * 2.2046226218 : kg;

export default function WeightWidget({ entries = [], unit = 'kg', onClick, className = '' }) {
  const latest = entries[entries.length - 1];
  const previous = entries.length > 1 ? entries[entries.length - 2] : null;
  const currentValue = latest ? displayWeight(latest.weightKg, unit) : null;
  const change = latest && previous ? displayWeight(latest.weightKg - previous.weightKg, unit) : null;
  const points = entries.slice(-7).map((entry) => displayWeight(entry.weightKg, unit));
  const min = points.length ? Math.min(...points) : 0;
  const max = points.length ? Math.max(...points) : 1;
  const range = Math.max(0.5, max - min);
  const coords = points.map((point, index) => {
    const x = points.length < 2 ? 50 : 5 + (index / (points.length - 1)) * 90;
    const y = 35 - ((point - min) / range) * 26;
    return `${x},${y}`;
  }).join(' ');

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-[224px] min-h-[224px] w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/45 p-2.5 text-left transition-colors hover:bg-card/75 active:scale-[0.99] ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"><Scale size={13} /> Bodyweight</span>
        <ChevronRight size={15} className="text-muted-foreground" />
      </div>
      {latest ? (
        <div className="mt-auto flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[28px] font-extrabold leading-none tracking-tight tabular-nums">{currentValue.toFixed(1)} <span className="text-[12px] font-bold text-muted-foreground">{unit}</span></p>
            <p className="mt-1.5 text-[9px] text-muted-foreground">
              {change == null ? 'First entry' : `${change > 0 ? '+' : ''}${change.toFixed(1)} ${unit} since last`}
            </p>
          </div>
          {points.length > 1 && (
            <svg viewBox="0 0 100 40" className="hidden h-8 w-[60px] shrink-0 overflow-visible sm:block" aria-label="Recent bodyweight trend">
              <polyline points={coords} fill="none" stroke="hsl(var(--foreground))" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      ) : (
        <div className="mt-auto">
          <p className="text-lg font-bold">Add your weight</p>
          <p className="mt-1 text-[10px] text-muted-foreground">Track changes over time</p>
        </div>
      )}
    </button>
  );
}
