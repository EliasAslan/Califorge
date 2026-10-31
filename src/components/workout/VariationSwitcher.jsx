import React from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { getExercise } from '@/lib/programData';

// Easier / harder variation switcher. Works for any exercise that has
// alternatives, even without predefined progression levels. Options are
// ranked by difficulty (Beginner → Intermediate → Advanced); the adjacent
// option in that ranking becomes the "Easier" or "Harder" target. Same-
// difficulty neighbours are offered as a plain "Switch".
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
    return 'Switch';
  };

  const btn = (ex, Icon, side) =>
    ex ? (
      <button
        onClick={() => onSwitch(ex.id)}
        className="flex-1 inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border border-border bg-card/40 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors justify-center min-w-0"
      >
        {side === 'left' && <Icon size={13} className="shrink-0" />}
        <span className="truncate">{labelFor(ex)}: {ex.name}</span>
        {side === 'right' && <Icon size={13} className="shrink-0" />}
      </button>
    ) : (
      <div className="flex-1" />
    );

  return (
    <div className="mt-3 flex gap-2">
      {btn(prev, ArrowDown, 'left')}
      {btn(next, ArrowUp, 'right')}
    </div>
  );
}