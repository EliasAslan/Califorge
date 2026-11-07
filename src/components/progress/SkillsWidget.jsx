import React from 'react';
import { ChevronRight } from 'lucide-react';
import { getSkillTracksStatus } from '@/lib/skills';
import ExerciseVisual from '@/components/ExerciseVisual';

export default function SkillsWidget({ sessions, onClick, className }) {
  const tracks = getSkillTracksStatus(sessions);

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      className={`rounded-2xl border border-border bg-card/50 p-2.5 sm:p-4 active:scale-[0.99] transition-transform cursor-pointer flex flex-col ${className || ''}`}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground font-semibold">Skill tree</p>
        <ChevronRight size={18} className="text-muted-foreground" />
      </div>
      <div className="flex-1 grid grid-cols-1 gap-1.5">
        {tracks.slice(0, 2).map((t) => {
          const cur = t.status.current >= 0 ? t.levels[t.status.current].label : 'Not started';
          return (
            <div key={t.id} className="flex items-center gap-1.5 p-1.5 rounded-lg bg-background/50">
              <span className="w-7 h-7 rounded-md flex items-center justify-center bg-card/60 shrink-0">
                <ExerciseVisual visualId={t.visualId} category={t.category} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold truncate">{t.name}</p>
                <p className="text-[9px] text-muted-foreground truncate">{cur}</p>
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