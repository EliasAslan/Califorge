import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, StickyNote, Dumbbell } from 'lucide-react';
import { categoryColor, MODES } from '@/lib/programData';
import { formatSetResult, formatDuration } from '@/lib/trainingLogic';
import { useSessions } from '@/hooks/useTrainingData';
import ExerciseVisual from '@/components/ExerciseVisual';

export default function SessionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: sessions = [] } = useSessions();
  const session = sessions.find((s) => s.id === id);

  if (!session) {
    return (
      <div className="px-5 pt-10">
        <button onClick={() => navigate('/history')} className="text-sm text-muted-foreground">← Back</button>
        <p className="mt-6 text-muted-foreground">Session not found.</p>
      </div>
    );
  }

  const accent = categoryColor(session.workoutCategory);
  const secs = session.durationSec != null ? session.durationSec : (session.finishedAt && session.startedAt ? Math.round((session.finishedAt - session.startedAt) / 1000) : null);
  const dur = secs != null ? formatDuration(secs) : null;
  const note = session.note?.trim();

  return (
    <div className="px-5 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <button onClick={() => navigate('/history')} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ChevronLeft size={16} /> History
      </button>

      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `${accent}1a` }}>
          <Dumbbell size={26} style={{ color: accent }} />
        </div>
        <div className="flex-1 min-w-0 pt-1">
          <p className="text-[11px] uppercase tracking-[0.2em] font-semibold" style={{ color: accent }}>
            {formatDate(session.date)} · Week {session.week}
          </p>
          <h1 className="text-xl font-bold tracking-tight leading-tight mt-1">{session.workoutName}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {session.timeBudgetMin ? `${session.timeBudgetMin} min planned` : (MODES[session.mode]?.label || 'Full')}{dur ? ` · ${dur}` : ''}
          </p>
        </div>
      </div>

      {/* workout note */}
      {note && (
        <div className="mt-4 p-3.5 rounded-xl border border-border bg-card/50">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mb-1 inline-flex items-center gap-1.5">
            <StickyNote size={12} /> Note
          </p>
          <p className="text-sm text-foreground/90 whitespace-pre-wrap">{note}</p>
        </div>
      )}

      {/* exercises */}
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mt-6 mb-2">Exercises</p>
      <div className="space-y-2">
        {session.exercises.map((e) => {
          const results = e.sets.filter((s) => s.completed && !s.skipped);
          const exNote = e.note?.trim();
          return (
            <div key={e.exerciseId} className="p-3 rounded-xl border border-border bg-card/40">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-lg flex items-center justify-center bg-background/60 shrink-0">
                  <ExerciseVisual visualId={e.visualId} category={e.category} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate">{e.name}</p>
                    {e.progression && (
                      <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-muted text-foreground">{e.progression}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground tnum mt-0.5">
                    {results.length ? results.map((s) => formatSetResult(s, e.type, { hideProgression: !!e.progression })).join(' · ') : 'No completed sets'}
                  </p>
                </div>
              </div>
              {exNote && (
                <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border inline-flex items-start gap-1.5">
                  <StickyNote size={11} className="mt-0.5 shrink-0" />
                  <span className="whitespace-pre-wrap">{exNote}</span>
                </p>
              )}
            </div>
          );
        })}
      </div>
      <div className="h-6" />
    </div>
  );
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}