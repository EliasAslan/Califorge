import React, { useState } from 'react';
import { ChevronDown, Flame } from 'lucide-react';
import { WARMUPS, categoryColor } from '@/lib/programData';

export default function WarmUp({ category }) {
  const [open, setOpen] = useState(false);
  const items = WARMUPS[category] || WARMUPS.skill;
  const accent = categoryColor(category);

  return (
    <div className="mt-4 rounded-2xl border border-border bg-card/40 overflow-hidden">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center gap-3 p-3.5 text-left">
        <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-muted">
          <Flame size={16} className="text-muted-foreground" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Warm-up</p>
          <p className="text-xs text-muted-foreground">{items.length} moves · quick prep, no tracking</p>
        </div>
        <ChevronDown size={18} className={`text-muted-foreground transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-3.5 pb-3.5 animate-fade-in">
          {items.map((it, i) => (
            <div key={i} className="flex items-center justify-between py-2.5 border-t border-border">
              <span className="text-sm">{it.name}</span>
              <span className="text-xs text-muted-foreground tnum">{it.detail}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}