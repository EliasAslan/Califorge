import React from 'react';
import { ChevronRight } from 'lucide-react';
import { categoryColor } from '@/lib/programData';
import { getSkillTracksStatus } from '@/lib/skills';
import ExerciseVisual from '@/components/ExerciseVisual';

export default function SkillsWidget({ sessions, onClick, className }) {
  const accent = categoryColor('pull');
  const tracks = getSkillTracksStatus(sessions);

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      className={`rounded-2xl border border-border bg-card/50 p-5 active:scale-[0.99] transition-transform cursor-pointer flex flex-col ${className || ''}`}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">Skills</p>
        <ChevronRight size={18} className="text-muted-foreground" />
      </div>
      <div className="flex-1 grid grid-cols-2 gap-2.5">
        {tracks.map((t) => {
          const cur = t.status.current >= 0 ? t.levels[t.status.current].label : 'Not started';
          return (
            <div key={t.id} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-background/50">
              <span className="w-9 h-9 rounded-lg flex items-center justify-center bg-card/60 shrink-0">
                <ExerciseVisual visualId={t.visualId} category={t.category} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold truncate">{t.name}</p>
                <p className="text-[11px] text-muted-foreground truncate">{cur}</p>
                <div className="flex gap-1 mt-1">
                  {t.levels.map((_, i) => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: i <= t.status.current ? 'hsl(var(--foreground))' : 'hsl(var(--border))' }} />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}