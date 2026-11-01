import React from 'react';
import NumberField from '@/components/workout/NumberField';

const first = (v) => (Array.isArray(v) ? v[0] : v ?? undefined);

export function missingFields(type, set) {
  const missing = [];
  if (['reps', 'weighted', 'reps_hold'].includes(type) && set.actualReps == null) missing.push('reps');
  if (['hold', 'reps_hold'].includes(type) && set.actualSec == null) missing.push('hold');
  if (type === 'weighted' && set.weight == null) missing.push('weight');
  return missing;
}

export const isSkillType = (type) => type === 'skill' || type === 'prehab';

function Field({ label, children }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mb-1.5">{label}</p>
      {children}
    </div>
  );
}

export default function SetInputs({ exercise, set, update, invalid = [], size = 'md' }) {
  const type = exercise.type;
  const bad = (k) => invalid.includes(k);
  const reps = (
    <Field label="Reps">
      <NumberField label="Reps" value={set.actualReps} seed={first(set.targetReps)} max={300} size={size}
        invalid={bad('reps')} onChange={(v) => update({ actualReps: v })} />
    </Field>
  );
  const hold = (label = 'Hold') => (
    <Field label={label}>
      <NumberField label={label} value={set.actualSec} seed={first(set.targetSec) ?? first(set.holdSec)} max={3600} suffix="s" size={size}
        invalid={bad('hold')} onChange={(v) => update({ actualSec: v })} />
    </Field>
  );

  if (isSkillType(type)) return hold('Best hold (optional)');

  return (
    <div className="space-y-3">
      {type === 'weighted' ? (
        <div className="grid grid-cols-2 gap-2.5">
          <Field label="Weight">
            <NumberField label="Weight" value={set.weight} step={2.5} max={300} suffix="kg" size={size}
              invalid={bad('weight')} onChange={(v) => update({ weight: v })} />
          </Field>
          {reps}
        </div>
      ) : type === 'reps_hold' ? (
        <div className="grid grid-cols-2 gap-2.5">{reps}{hold()}</div>
      ) : type === 'hold' ? hold() : reps}
      {(exercise.rpe || exercise.rir) && (
        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
            {exercise.rpe ? `RPE · target ${exercise.rpe}` : `RIR · target ${exercise.rir}`}
          </span>
          <div className="flex gap-1.5 ml-auto" role="group" aria-label={exercise.rpe ? 'RPE' : 'RIR'}>
            {(exercise.rpe ? ['7', '8', '9', '10'] : ['0', '1', '2', '3']).map((n) => {
              const key = exercise.rpe ? 'rpe' : 'rir';
              const on = set[key] === n;
              return (
                <button key={n} type="button" aria-pressed={on}
                  onClick={() => update({ [key]: on ? null : n })}
                  className={`w-10 h-9 rounded-lg text-xs font-semibold border tnum transition-colors ${on ? 'border-foreground/40 bg-foreground text-background' : 'border-border text-muted-foreground'}`}>
                  {n}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
