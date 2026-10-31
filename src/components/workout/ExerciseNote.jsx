import React, { useState } from 'react';
import { StickyNote, X } from 'lucide-react';

// Quick, unobtrusive per-exercise note. Collapses to a single link when empty.
export default function ExerciseNote({ value, onChange, accent }) {
  const [open, setOpen] = useState(!!value);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <StickyNote size={13} style={{ color: accent }} /> {value ? 'Edit note' : 'Add note'}
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card/50 p-2.5 animate-fade-in">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold inline-flex items-center gap-1.5">
          <StickyNote size={12} /> Note
        </span>
        <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
          <X size={13} />
        </button>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="How did this feel? Anything to remember…"
        rows={2}
        className="w-full bg-transparent text-sm resize-none focus:outline-none placeholder:text-muted-foreground/60"
      />
    </div>
  );
}