import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, TrendingUp, Award, Heart } from 'lucide-react';
import { EXERCISES, categoryColor } from '@/lib/programData';
import { formatTarget, getPersonalRecord, getProgressionStatus, sessionsForExercise, formatSetResult, getExerciseTrend } from '@/lib/trainingLogic';
import { getEnjoymentFor, setEnjoymentFor } from '@/lib/storage';
import { useSessions } from '@/hooks/useTrainingData';
import ExerciseVisual from '@/components/ExerciseVisual';
import ProgressSparkline from '@/components/ProgressSparkline';

export default function ExerciseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: sessions = [] } = useSessions();

  const ex = EXERCISES[id];
  if (!ex) {
    return (
      <div className="px-5 pt-10">
        <button onClick={() => navigate(-1)} className="text-sm text-muted-foreground">← Back</button>
        <p className="mt-6 text-muted-foreground">Exercise not found.</p>
      </div>
    );
  }
  const accent = categoryColor(ex.category);
  const pr = getPersonalRecord(ex.id, sessions);
  const prog = getProgressionStatus(ex.id, sessions);
  const history = sessionsForExercise(ex.id, sessions).reverse();
  const trend = getExerciseTrend(ex.id, sessions);
  const trendUnit = ex.type === 'weighted' ? 'kg' : (ex.type === 'hold' || ex.type === 'reps_hold') ? 's' : 'reps';

  return (
    <div className="px-5 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ChevronLeft size={16} /> Back
      </button>

      <div className="flex items-start gap-4">
        <div className="w-20 h-20 rounded-2xl bg-background/60 flex items-center justify-center shrink-0">
          <ExerciseVisual visualId={ex.visualId} category={ex.category} />
        </div>
        <div className="flex-1 min-w-0 pt-1">
          <p className="text-[11px] uppercase tracking-[0.2em] font-semibold" style={{ color: accent }}>{ex.category}</p>
          <h1 className="text-xl font-bold tracking-tight leading-tight mt-1">{ex.name}</h1>
          <p className="text-sm text-muted-foreground">{ex.variation}</p>
        </div>
      </div>

      {/* target + PR */}
      <div className="grid grid-cols-2 gap-3 mt-5">
        <div className="p-3.5 rounded-xl border border-border bg-card/50">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Target</p>
          <p className="text-lg font-bold tnum mt-1">{formatTarget(ex)}</p>
        </div>
        <div className="p-3.5 rounded-xl border border-border bg-card/50">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Personal Record</p>
          <p className="text-lg font-bold tnum mt-1" style={pr ? { color: 'hsl(var(--foreground))' } : { color: 'hsl(var(--muted-foreground))' }}>
            {pr ? pr.label : '—'}
          </p>
        </div>
      </div>

      {/* progression */}
      <div className="mt-3 p-3.5 rounded-xl border border-border bg-card/50">
        <div className="flex items-center gap-2">
          <TrendingUp size={15} style={{ color: prog.status === 'earned' ? '#34D399' : accent }} />
          <p className="text-sm font-semibold">Progression</p>
        </div>
        <p className="text-sm text-muted-foreground mt-1.5">{prog.message}</p>
        <p className="text-xs text-muted-foreground mt-2">Path: {ex.progression}</p>
      </div>

      {/* progress over time */}
      {trend.length >= 2 && (
        <div className="mt-3 p-3.5 rounded-xl border border-border bg-card/50">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Progress over time</p>
            <p className="text-xs font-semibold tnum text-foreground">
              {trend[0].value}{trendUnit} → {trend[trend.length - 1].value}{trendUnit}
            </p>
          </div>
          <ProgressSparkline data={trend} accent={accent} />
          <div className="flex items-center justify-between mt-2 text-[11px] text-muted-foreground tnum">
            <span>{formatDate(trend[0].date)}</span>
            <span>{formatDate(trend[trend.length - 1].date)}</span>
          </div>
        </div>
      )}

      {/* enjoyment rating */}
      <EnjoymentRating exId={ex.id} accent={accent} />

      {/* details */}
      <div className="mt-3 p-4 rounded-xl border border-border bg-card/50 space-y-2.5 text-sm">
        {ex.description && <p className="text-foreground/90">{ex.description}</p>}
        {ex.notes && <p className="text-muted-foreground text-xs">{ex.notes}</p>}
        <div className="grid grid-cols-2 gap-y-2 pt-1.5 border-t border-border mt-1">
          <p className="text-xs text-muted-foreground">Muscles</p>
          <p className="text-xs text-right">{ex.muscles.join(', ')}</p>
          <p className="text-xs text-muted-foreground">Equipment</p>
          <p className="text-xs text-right">{ex.equipment.join(', ')}</p>
          <p className="text-xs text-muted-foreground">Difficulty</p>
          <p className="text-xs text-right">{ex.difficulty}</p>
        </div>
      </div>

      {/* history */}
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mt-6 mb-2">History</p>
      {history.length === 0 ? (
        <p className="text-sm text-muted-foreground p-4 rounded-xl border border-border bg-card/40">No sessions logged yet.</p>
      ) : (
        <div className="space-y-1.5">
          {history.map((s) => {
            const entry = s.exercises.find((e) => e.exerciseId === ex.id);
            const sets = entry ? entry.sets.filter((x) => x.completed && !x.skipped) : [];
            return (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card/40">
                <p className="text-xs text-muted-foreground w-16 shrink-0">{formatDate(s.date)}</p>
                <p className="text-sm font-medium tnum flex-1">{sets.map((x) => formatSetResult(x, ex.type, { hideProgression: !!entry?.progression })).join(' · ') || '—'}</p>
                {entry?.progression && (
                  <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md bg-muted text-foreground">{entry.progression}</span>
                )}
                <span className="text-[10px] text-muted-foreground">Wk {s.week}</span>
              </div>
            );
          })}
        </div>
      )}
      <div className="h-6" />
    </div>
  );
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function EnjoymentRating({ exId, accent }) {
  const [val, setVal] = React.useState(getEnjoymentFor(exId));
  const tap = (v) => {
    const next = v === val ? null : v;
    setEnjoymentFor(exId, next);
    setVal(next);
  };
  return (
    <div className="mt-3 p-3.5 rounded-xl border border-border bg-card/50">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Enjoyment</p>
        <p className="text-xs text-muted-foreground">{val ? `${val}/5` : 'Tap to rate'}</p>
      </div>
      <div className="flex gap-1.5 mt-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => tap(n)} aria-label={`Rate ${n}`} className="transition-transform active:scale-90">
            <Heart
              size={22}
              style={{ color: n <= (val || 0) ? 'var(--brand)' : 'hsl(var(--border))' }}
              fill={n <= (val || 0) ? 'var(--brand)' : 'none'}
            />
          </button>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground mt-2">Used to pick exercises for Short & Quick Hit workouts.</p>
    </div>
  );
}