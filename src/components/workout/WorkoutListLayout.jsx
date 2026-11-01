import React, { useState } from 'react';
import { Check, Pause, Play, SkipForward, AlertCircle } from 'lucide-react';
import ExerciseVisual from '@/components/ExerciseVisual';
import SetInputs, { missingFields } from '@/components/workout/SetInputs';
import ProgressionSelector from '@/components/workout/ProgressionSelector';
import { getExercise, categoryColor } from '@/lib/programData';
import { formatTarget } from '@/lib/trainingLogic';

export default function WorkoutListLayout({
  session,
  doneSets,
  totalSets,
  progress,
  paused,
  onSelectSet,
  update,
  completeSet,
  skipSet,
  togglePause,
  renderTopBar,
  missingWarning = false,
  onForceComplete,
  onUpdateProgression,
}) {
  const [collapsedKey, setCollapsedKey] = useState(null);

  const activeEi = session.cursor.exerciseIndex;
  const activeSi = session.cursor.setIndex;
  const activeKey = `${activeEi}-${activeSi}`;

  const handleRowClick = (ei, si) => {
    const key = `${ei}-${si}`;
    if (activeKey === key && collapsedKey !== key) {
      // Toggle collapse active set
      setCollapsedKey(key);
    } else {
      setCollapsedKey(null);
      onSelectSet(ei, si);
    }
  };

  return (
    <div data-workout-layout="list" className="min-h-screen flex flex-col px-4 sm:px-5 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      {renderTopBar()}

      {/* progress */}
      <div className="mt-1 mb-3">
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground mb-1.5">
          <span className="truncate">{session.workoutName}</span>
          <span className="tnum shrink-0">{doneSets}/{totalSets} sets · {Math.round(progress * 100)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-border overflow-hidden">
          <div className="h-full transition-all duration-300" style={{ width: `${progress * 100}%`, background: 'hsl(var(--foreground))' }} />
        </div>
      </div>

      {/* exercise list */}
      <div className="space-y-3 flex-1 pb-4">
        {session.exercises.map((exercise, ei) => {
          const exDef = getExercise(exercise.exerciseId);
          const hasLevels = !!exDef?.progressionLevels?.length;
          const accent = categoryColor(exercise.category);
          const completedCount = exercise.sets.filter((s) => s.completed).length;

          return (
            <section key={`${exercise.exerciseId}-${ei}`} className="rounded-2xl border border-border overflow-hidden bg-card/30">
              {/* exercise header */}
              <div className="flex items-center gap-3 px-3.5 py-2.5 border-b border-border/70 bg-card/40">
                <div className="w-8 h-8 rounded-lg bg-background/70 flex items-center justify-center shrink-0">
                  <ExerciseVisual visualId={exercise.visualId} category={exercise.category} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold truncate leading-tight">{exercise.name}</h3>
                  <p className="text-[11px] text-muted-foreground truncate">{exercise.variation || exercise.category}</p>
                </div>
                <span className="text-[11px] text-muted-foreground font-semibold tnum px-2 py-0.5 rounded bg-muted/60">
                  {completedCount}/{exercise.sets.length}
                </span>
              </div>

              {/* sets list */}
              <div className="divide-y divide-border/60">
                {exercise.sets.map((rowSet, si) => {
                  const key = `${ei}-${si}`;
                  const isCursor = activeEi === ei && activeSi === si;
                  const isExpanded = isCursor && collapsedKey !== key;

                  const isReps = ['reps', 'weighted', 'reps_hold'].includes(exercise.type);
                  const isHold = ['hold', 'reps_hold'].includes(exercise.type);
                  const isSkill = ['skill', 'prehab'].includes(exercise.type);

                  const summary = rowSet.completed
                    ? (rowSet.skipped
                        ? 'Skipped'
                        : exercise.type === 'weighted'
                          ? `${rowSet.actualReps ?? '—'} reps · ${rowSet.weight ?? '—'} kg`
                          : isReps
                            ? `${rowSet.actualReps ?? '—'} reps${isHold ? ` · ${rowSet.actualSec ?? '—'}s` : ''}`
                            : isHold || isSkill
                              ? `${rowSet.actualSec ?? '—'}s logged`
                              : 'Completed')
                    : (exDef ? `Target: ${formatTarget(exDef)}` : `Set ${si + 1}`);

                  const missing = missingWarning && isExpanded ? missingFields(exercise.type, rowSet) : [];

                  return (
                    <div key={rowSet.id || si} className={isExpanded ? 'bg-foreground/[0.03]' : ''}>
                      <button
                        type="button"
                        onClick={() => handleRowClick(ei, si)}
                        aria-expanded={isExpanded}
                        className="w-full flex items-center gap-3 text-left px-3.5 py-2.5 min-h-[52px] hover:bg-card/40 transition-colors"
                      >
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          rowSet.completed
                            ? 'bg-emerald-500/15 text-emerald-500'
                            : isCursor
                              ? 'bg-foreground text-background'
                              : 'bg-muted text-muted-foreground'
                        }`}>
                          {rowSet.completed ? <Check size={13} strokeWidth={2.5} /> : si + 1}
                        </span>

                        <span className="flex-1 min-w-0">
                          <span className="block text-xs font-semibold leading-tight">
                            {rowSet.skipped ? 'Skipped' : rowSet.completed ? 'Completed' : `Set ${si + 1}`}
                          </span>
                          <span className="block text-[11px] text-muted-foreground truncate">{summary}</span>
                        </span>

                        <span className="text-[11px] font-medium text-muted-foreground">
                          {isExpanded ? 'Collapse' : rowSet.completed ? 'Edit' : 'Log'}
                        </span>
                      </button>

                      {/* inline logging controls */}
                      {isExpanded && (
                        <div className="px-3.5 pb-3.5 pt-1 space-y-3 border-t border-border/40 animate-fade-in">
                          {/* target indicator */}
                          {exDef && (
                            <div className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-card/50">
                              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Target</span>
                              <span className="font-bold text-foreground tnum">{formatTarget(exDef)}</span>
                            </div>
                          )}

                          {/* progression levels if applicable */}
                          {hasLevels && onUpdateProgression && (
                            <ProgressionSelector
                              levels={exDef.progressionLevels}
                              value={rowSet.progression}
                              onChange={onUpdateProgression}
                              accent={accent}
                            />
                          )}

                          {/* compact inputs */}
                          <SetInputs
                            exercise={exercise}
                            set={rowSet}
                            update={update}
                            invalid={missing}
                            size="sm"
                          />

                          {/* inline validation warning */}
                          {missingWarning && (
                            <div className="flex items-center justify-between gap-2 p-2 rounded-xl border border-amber-500/40 bg-amber-500/10 text-xs text-amber-200 animate-fade-in">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <AlertCircle size={14} className="shrink-0 text-amber-400" />
                                <span className="truncate">Enter {missing.join(' & ')} to complete</span>
                              </div>
                              <button
                                type="button"
                                onClick={onForceComplete}
                                className="px-2 py-0.5 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-semibold text-[11px] shrink-0"
                              >
                                Log anyway
                              </button>
                            </div>
                          )}

                          {/* action buttons */}
                          <div className="flex gap-2 pt-0.5">
                            {!paused && !rowSet.completed && (
                              <button
                                type="button"
                                onClick={() => completeSet()}
                                className="flex-1 h-10 rounded-xl text-xs font-semibold bg-emerald-500 text-emerald-950 flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform"
                              >
                                <Check size={14} strokeWidth={2.5} />
                                {isSkill ? 'Mark done' : 'Complete set'}
                              </button>
                            )}
                            {!paused && !rowSet.completed && !isSkill && (
                              <button
                                type="button"
                                onClick={skipSet}
                                className="h-10 px-3 rounded-xl border border-border text-xs text-muted-foreground font-medium inline-flex items-center gap-1 hover:text-foreground"
                              >
                                <SkipForward size={14} /> Skip
                              </button>
                            )}
                          </div>

                          {rowSet.completed && (
                            <p className="text-[11px] text-muted-foreground">This set is completed. Changes update automatically.</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* bottom pause/resume bar */}
      <div className="pt-2">
        {paused ? (
          <button
            type="button"
            onClick={togglePause}
            className="w-full h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
            style={{ background: 'var(--brand)', color: 'var(--brand-fg)' }}
          >
            <Play size={15} fill="currentColor" /> Resume workout
          </button>
        ) : (
          <button
            type="button"
            onClick={togglePause}
            className="w-full h-10 rounded-xl border border-border bg-card/40 text-xs font-medium inline-flex items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <Pause size={14} /> Pause workout
          </button>
        )}
      </div>
    </div>
  );
}
