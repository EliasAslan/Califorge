import React from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { getExercise } from '@/lib/programData';

const DIFF_RANK = { Beginner: 0, Intermediate: 1, Advanced: 2 };

export default function VariationSwitcher({ originalId, currentId, onSwitch }) {
  const original = getExercise(originalId || currentId);
  const current = getExercise(currentId);
  if (!original) return null;
  const alts = (original.alternatives || []).map((id) => getExercise(id)).filter(Boolean);
  const options = [original, ...alts];
  if (options.length < 2 || !current) return null;

  const ranked = [...options].sort(
    (a, b) => (DIFF_RANK[a.difficulty] ?? 1) - (DIFF_RANK[b.difficulty] ?? 1),
  );
  const curIdx = ranked.findIndex((o) => o.id === currentId);
  if (curIdx < 0) return null;

  const prev = curIdx > 0 ? ranked[curIdx - 1] : null;
  const next = curIdx < ranked.length - 1 ? ranked[curIdx + 1] : null;
  if (!prev && !next) return null;

  const labelFor = (ex) => {
    const rank = DIFF_RANK[ex.difficulty] ?? 1;
    const currentRank = DIFF_RANK[current.difficulty] ?? 1;
    if (rank < currentRank) return 'Easier';
    if (rank > currentRank) return 'Harder';
    return 'Alternative';
  };

  const button = (ex, Icon, side) =>
    ex ? (
      <button
        type="button"
        onClick={() => onSwitch(ex.id)}
        className="flex min-w-0 flex-1 items-center justify-center gap-1.5 border border-[var(--console-line)] px-3 py-2.5 text-[11px] font-semibold text-[var(--console-steel)] transition-colors hover:border-[var(--console-line-strong)] hover:text-[var(--console-chalk)] active:scale-[0.98]"
      >
        {side === 'left' && <Icon size={12} className="shrink-0" />}
        <span className="truncate">
          {labelFor(ex)}: {ex.name}
        </span>
        {side === 'right' && <Icon size={12} className="shrink-0" />}
      </button>
    ) : (
      <div className="flex-1" />
    );

  return (
    <div>
      <p className="text-[10px] font-semibold text-[var(--console-steel)]">Variation</p>
      <div className="mt-1.5 flex items-center gap-2">
        {button(prev, ArrowDown, 'left')}
        {button(next, ArrowUp, 'right')}
      </div>
    </div>
  );
}
