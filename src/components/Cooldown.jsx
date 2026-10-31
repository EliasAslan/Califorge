import React, { useState } from 'react';
import { ChevronDown, Snowflake } from 'lucide-react';
import { COOLDOWNS } from '@/lib/programData';

// Post-workout cooldown panel. Mirrors the Warm-up UI/data structure so the
// two routines stay visually consistent and are driven by the same data shape.
export default function Cooldown({ category }) {
  const [open, setOpen] = useState(false);
  const items = COOLDOWNS[category] || COOLDOWNS.skill;

  return (
    <div className="mt-4 rounded-2xl border border-border bg-card/40 overflow-hidden">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center gap-3 p-3.5 text-left">
        <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-muted">
          <Snowflake size={16} className="text-muted-foreground" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">Cooldown</p>
          <p className="text-xs text-muted-foreground">{items.length} moves · stretch & recover</p>
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