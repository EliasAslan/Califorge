import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Check, Lock } from 'lucide-react';
import { categoryColor } from '@/lib/programData';
import { useSessions } from '@/hooks/useTrainingData';
import { getSkillTracksStatus } from '@/lib/skills';
import ExerciseVisual from '@/components/ExerciseVisual';

export default function SkillTree() {
  const navigate = useNavigate();
  const { data: sessions = [] } = useSessions();
  const accent = categoryColor('pull');
  const tracks = getSkillTracksStatus(sessions);

  return (
    <div className="px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-10">
      <button onClick={() => navigate('/progress')} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3">
        <ChevronLeft size={18} /> Progress
      </button>
      <h1 className="text-2xl font-bold tracking-tight">Skills</h1>
      <p className="text-sm text-muted-foreground">Your progression across key calisthenics skills.</p>

      <div className="space-y-4 mt-5">
        {tracks.map((t) => {
          const cur = t.status.current;
          return (
            <div key={t.id} className="rounded-2xl border border-border bg-card/50 p-4">
              <div className="flex items-center gap-3 mb-5">
                <span className="w-11 h-11 rounded-xl flex items-center justify-center bg-background/60 shrink-0">
                  <ExerciseVisual visualId={t.visualId} category={t.category} />
                </span>
                <div>
                  <p className="text-base font-bold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{cur >= 0 ? `Current: ${t.levels[cur].label}` : 'Not started'}</p>
                </div>
              </div>

              <div className="flex items-start gap-1">
                {t.levels.map((lvl, i) => {
                  const achieved = t.status.achieved[i];
                  const isCurrent = i === cur;
                  return (
                    <React.Fragment key={i}>
                      {i > 0 && (
                        <div className="flex-1 h-0.5 rounded-full mt-5" style={{ background: i <= cur ? 'hsl(var(--foreground))' : 'hsl(var(--border))' }} />
                      )}
                      <div className="flex flex-col items-center gap-1.5 shrink-0" style={{ width: 68 }}>
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={
                            achieved
                              ? { background: 'hsl(var(--foreground))', color: 'hsl(var(--primary-foreground))' }
                              : isCurrent
                              ? { border: `2px solid var(--brand)`, color: 'var(--brand)', background: 'color-mix(in srgb, var(--brand) 14%, transparent)' }
                              : { border: '1.5px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }
                          }
                        >
                          {achieved ? <Check size={16} strokeWidth={3} /> : isCurrent ? <span className="text-xs font-bold">{i + 1}</span> : <Lock size={13} />}
                        </div>
                        <span
                          className="text-[10px] font-medium text-center leading-tight"
                          style={{ color: isCurrent ? 'var(--brand)' : achieved ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))' }}
                        >
                          {lvl.label}
                        </span>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}