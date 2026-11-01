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
    (a, b) => (DIFF_RANK[a.difficulty] ?? 1) - (DIFF_RANK[b.difficulty] ?? 1)
  );
  const curIdx = ranked.findIndex((o) => o.id === currentId);
  if (curIdx < 0) return null;

  const prev = curIdx > 0 ? ranked[curIdx - 1] : null;
  const next = curIdx < ranked.length - 1 ? ranked[curIdx + 1] : null;
  if (!prev && !next) return null;

  const labelFor = (ex) => {
    const r = DIFF_RANK[ex.difficulty] ?? 1;
    const c = DIFF_RANK[current.difficulty] ?? 1;
    if (r < c) return 'Easier';
    if (r > c) return 'Harder';
    return 'Alternative';
  };

  const btn = (ex, Icon, side) =>
    ex ? (
      <button
        type="button"
        onClick={() => onSwitch(ex.id)}
        className="flex-1 inline-flex items-center gap-1.5 px-3 h-8 rounded-xl border border-border/80 bg-card/40 text-[11px] font-bold text-muted-foreground hover:text-foreground hover:border-border hover:bg-card/70 transition-all active:scale-95 justify-center min-w-0"
      >
        {side === 'left' && <Icon size={12} className="shrink-0 text-emerald-400" />}
        <span className="truncate">{labelFor(ex)}: {ex.name}</span>
        {side === 'right' && <Icon size={12} className="shrink-0 text-amber-400" />}
      </button>
    ) : (
      <div className="flex-1" />
    );

  return (
    <div className="mt-2.5 flex items-center gap-2">
      {btn(prev, ArrowDown, 'left')}
      {btn(next, ArrowUp, 'right')}
    </div>
  );
}
