import React from 'react';
import { ArrowDown, ArrowUp, ArrowLeftRight } from 'lucide-react';
import { getExercise } from '@/lib/programData';

const DIFF_RANK = { Beginner: 0, Intermediate: 1, Advanced: 2 };

export default function VariationSwitcher({ originalId, currentId, onSwitch }) {
  const original = getExercise(originalId || currentId);
  const current = getExercise(currentId);
  if (!original || !current) return null;

  const options = [original, ...(original.alternatives || []).map((id) => getExercise(id)).filter(Boolean)];
  if (options.length < 2) return null;

  const ranked = [...options].sort(
    (a, b) => (DIFF_RANK[a.difficulty] ?? 1) - (DIFF_RANK[b.difficulty] ?? 1),
  );
  const curIdx = ranked.findIndex((option) => option.id === currentId);
  if (curIdx < 0) return null;

  const previous = curIdx > 0 ? ranked[curIdx - 1] : null;
  const next = curIdx < ranked.length - 1 ? ranked[curIdx + 1] : null;

  const labelFor = (exercise) => {
    const rank = DIFF_RANK[exercise.difficulty] ?? 1;
    const currentRank = DIFF_RANK[current.difficulty] ?? 1;
    if (rank < currentRank) return 'Easier';
    if (rank > currentRank) return 'Harder';
    return 'Alternative';
  };

  const optionButton = (exercise, side) => {
    if (!exercise) return <span className="flex-1" />;
    const easier = labelFor(exercise) === 'Easier';
    const Icon = easier ? ArrowDown : labelFor(exercise) === 'Harder' ? ArrowUp : ArrowLeftRight;
    return (
      <button
        type="button"
        onClick={() => onSwitch(exercise.id)}
        aria-label={`${labelFor(exercise)} variation: ${exercise.name}`}
        className="group flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-[var(--console-line)] bg-[var(--console-surface)] px-2.5 py-2 text-left transition-colors hover:border-[var(--console-line-strong)] hover:bg-[var(--console-surface-2)]"
      >
        {side === 'left' && <Icon size={13} className="shrink-0 text-[var(--console-steel)] transition-transform group-hover:-translate-y-px" />}
        <span className="min-w-0 flex-1">
          <span className="block text-[9px] font-bold uppercase tracking-[0.08em] text-[var(--console-steel)]">{labelFor(exercise)}</span>
          <span className="mt-0.5 block truncate text-[11px] font-semibold text-[var(--console-chalk)]">{exercise.name}</span>
        </span>
        {side === 'right' && <Icon size={13} className="shrink-0 text-[var(--console-steel)] transition-transform group-hover:translate-y-px" />}
      </button>
    );
  };

  return (
    <section className="border-t border-[var(--console-line)] pt-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-semibold text-[var(--console-steel)]">Adjust difficulty</p>
        <span className="text-[9px] font-medium text-[var(--console-steel)] opacity-70">{current.difficulty || 'Variation'}</span>
      </div>
      <div className="flex items-stretch gap-2">
        {optionButton(previous, 'left')}
        {optionButton(next, 'right')}
      </div>
    </section>
  );
}
