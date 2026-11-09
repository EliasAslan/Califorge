import React from 'react';
import { ChevronRight } from 'lucide-react';
import { missingFields, isSkillType } from '@/lib/trainingLogic';

export { missingFields, isSkillType };

function Readout({ label, value, unit = '', onOpen, compact = false }) {
  return (
    <button type="button" onClick={onOpen} className="block w-full text-left">
      <span className="console-field-label">{label}</span>
      <span className={compact ? 'console-value-compact' : 'console-value'}>
        {value == null ? (
          <span className="console-value-placeholder">—</span>
        ) : (
          <>
            {value}
            {unit && <span className="console-value-unit">{unit}</span>}
          </>
        )}
      </span>
    </button>
  );
}

function SecondaryRow({ label, value, unit = '', onOpen }) {
  return (
    <button type="button" onClick={onOpen} className="console-secondary-row">
      <span className="text-[12px] font-medium">{label}</span>
      <span className="flex items-center gap-1.5">
        <span className="console-secondary-value">
          {value == null ? <span className="console-value-placeholder">—</span> : value}
          {value != null && unit && (
            <span className="ml-1 text-[12px] font-semibold text-[var(--console-steel)]">{unit}</span>
          )}
        </span>
        <ChevronRight size={15} className="text-[var(--console-steel)]" aria-hidden="true" />
      </span>
    </button>
  );
}

export default function SetInputs({ exercise, set, onOpen, variant = 'focus' }) {
  const type = exercise.type;
  const compact = variant === 'list';
  // Weight tracking is opt-in per exercise per session: the "Set added
  // weight" menu action stores a load on the exercise's sets, and this row
  // then appears so the tracking stays visible. Weighted exercises always
  // show it; skill practice never does.
  const weightTracked = type !== 'weighted' && !isSkillType(type)
    && (exercise.sets || []).some((entry) => Number.isFinite(entry.weight));
  const weightRow = weightTracked ? (
    <SecondaryRow
      label="Added weight"
      value={set.weight}
      unit="kg"
      onOpen={() => onOpen('weight')}
    />
  ) : null;

  if (isSkillType(type)) {
    return (
      <div>
        <p className="text-[13px] leading-relaxed text-[var(--console-steel)]">
          Practice for{' '}
          <span className="font-semibold text-[var(--console-chalk)]">{exercise.durationMin} min</span>
          . Log your best hold if you want.
        </p>
        <SecondaryRow
          label="Best hold"
          value={set.actualSec}
          unit="s"
          onOpen={() => onOpen('hold')}
        />
      </div>
    );
  }

  if (type === 'weighted') {
    return (
      <div>
        <Readout
          label="Reps"
          value={set.actualReps}
          onOpen={() => onOpen('reps')}
          compact={compact}
        />
        <SecondaryRow
          label="Added weight"
          value={set.weight}
          unit="kg"
          onOpen={() => onOpen('weight')}
        />
      </div>
    );
  }

  if (type === 'reps_hold') {
    return (
      <div>
        <Readout
          label="Reps"
          value={set.actualReps}
          onOpen={() => onOpen('reps')}
          compact={compact}
        />
        <SecondaryRow
          label="Hold"
          value={set.actualSec}
          unit="s"
          onOpen={() => onOpen('hold')}
        />
        {weightRow}
      </div>
    );
  }

  if (type === 'hold') {
    return (
      <div>
        <Readout
          label="Hold"
          value={set.actualSec}
          unit="s"
          onOpen={() => onOpen('hold')}
          compact={compact}
        />
        {weightRow}
      </div>
    );
  }

  return (
    <div>
      <Readout
        label="Reps"
        value={set.actualReps}
        onOpen={() => onOpen('reps')}
        compact={compact}
      />
      {weightRow}
    </div>
  );
}

export function EffortRow({ exercise, set, update }) {
  const kind = exercise.rpe ? 'rpe' : exercise.rir ? 'rir' : null;
  if (!kind) return null;
  const options = kind === 'rpe' ? ['7', '8', '9', '10'] : ['0', '1', '2', '3'];

  return (
    <div className="console-effort" role="group" aria-label={kind.toUpperCase()}>
      <span className="console-effort-label">
        {kind === 'rpe' ? `RPE, target ${exercise.rpe}` : `RIR, target ${exercise.rir}`}
      </span>
      {options.map((option) => {
        const on = set[kind] === option;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={on}
            onClick={() => update({ [kind]: on ? null : option })}
            className={`console-effort-chip ${on ? 'is-on' : ''}`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
