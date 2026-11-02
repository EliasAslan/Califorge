import React, { useEffect, useState } from 'react';
import { Check, Pause, Play } from 'lucide-react';
import SetInputs, { missingFields, EffortRow } from '@/components/workout/SetInputs';
import { getExercise, categoryColor } from '@/lib/programData';
import { formatTarget } from '@/lib/trainingLogic';
import { haptic } from '@/lib/workoutFeedback';

function resultLabel(set, type) {
  if (type === 'weighted') {
    const weight = set.weight ?? 0;
    return weight > 0
      ? `+${weight} kg × ${set.actualReps ?? 0}`
      : `${set.actualReps ?? 0} reps`;
  }
  if (type === 'reps_hold') return `${set.actualReps ?? 0} reps + ${set.actualSec ?? 0}s`;
  if (type === 'skill' || type === 'prehab') {
    return set.actualSec != null ? `${set.actualSec}s` : 'Done';
  }
  if (type === 'hold') return `${set.actualSec ?? 0}s`;
  return `${set.actualReps ?? 0} reps`;
}

export default function WorkoutListLayout({
  session,
  doneSets,
  totalSets,
  progress,
  paused,
  onSelectSet,
  openSheet,
  updateAt,
  onCompleteAt,
  onSkipAt,
  togglePause,
  renderTopBar,
  missingAt,
}) {
  const activeEi = session.cursor.exerciseIndex;
  const activeSi = session.cursor.setIndex;
  const [expandedKey, setExpandedKey] = useState(`${activeEi}-${activeSi}`);

  useEffect(() => {
    setExpandedKey(`${session.cursor.exerciseIndex}-${session.cursor.setIndex}`);
  }, [session.cursor.exerciseIndex, session.cursor.setIndex]);

  const handleRow = (exerciseIndex, setIndex) => {
    const key = `${exerciseIndex}-${setIndex}`;
    if (expandedKey === key) {
      haptic('selection');
      setExpandedKey(null);
      return;
    }
    setExpandedKey(key);
    onSelectSet(exerciseIndex, setIndex);
  };

  return (
    <>
      {renderTopBar()}

      <div className="min-h-0 overflow-y-auto">
        <div className="flex items-baseline justify-between pb-2 pt-3">
          <span className="text-[12px] font-medium text-[var(--console-steel)]">
            {doneSets} of {totalSets} sets
          </span>
          <span className="text-[12px] font-semibold tabular-nums text-[var(--console-steel)]">
            {Math.round(progress * 100)}%
          </span>
        </div>
        <div className="console-rest-track" aria-hidden="true">
          <div
            className="console-rest-fill"
            style={{ width: `${progress * 100}%`, background: 'var(--console-chalk)' }}
          />
        </div>

        {session.exercises.map((exercise, exerciseIndex) => {
          const definition = getExercise(exercise.exerciseId);
          const accent = categoryColor(exercise.category);
          const completed = exercise.sets.filter((s) => s.completed).length;
          const isSkill = exercise.type === 'skill' || exercise.type === 'prehab';
          const exerciseProgress = exercise.sets.length ? completed / exercise.sets.length : 0;
          const isExerciseCurrent = activeEi === exerciseIndex;

          return (
            <section
              key={`${exercise.exerciseId}-${exerciseIndex}`}
              className={`console-list-exercise ${isExerciseCurrent ? 'is-active' : ''}`}
            >
              <div className="console-list-exercise-head">
                <div className="min-w-0 flex-1">
                  <p className="console-list-exercise-kicker">
                    {String(exerciseIndex + 1).padStart(2, '0')} / {String(session.exercises.length).padStart(2, '0')}
                    {isExerciseCurrent && <span className="console-list-current-label">Now</span>}
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="h-3.5 w-[3px] shrink-0"
                      style={{ background: accent }}
                    />
                    <h3 className="min-w-0 truncate text-[15px] font-bold tracking-[-0.02em] text-[var(--console-chalk)]">
                      {exercise.name}
                    </h3>
                  </div>
                </div>
                <span className="console-list-exercise-count">
                  {completed}/{exercise.sets.length}
                </span>
              </div>
              <div className="console-list-exercise-track" aria-hidden="true">
                <span
                  style={{
                    transform: `scaleX(${exerciseProgress})`,
                    background: accent,
                  }}
                />
              </div>

              <div className="console-list-rows">
                {exercise.sets.map((rowSet, setIndex) => {
                  const key = `${exerciseIndex}-${setIndex}`;
                  const isCurrent = activeEi === exerciseIndex && activeSi === setIndex;
                  const isExpanded = expandedKey === key;
                  const isDone = rowSet.completed && !rowSet.skipped;
                  const isSkipped = rowSet.completed && rowSet.skipped;
                  const missing =
                    missingAt === `${exerciseIndex}:${setIndex}`
                      ? missingFields(exercise.type, rowSet)
                      : [];
                  const summary = rowSet.completed
                    ? isSkipped
                      ? 'Skipped'
                      : resultLabel(rowSet, exercise.type)
                    : definition
                      ? `Target ${formatTarget(definition)}`
                      : `Set ${setIndex + 1}`;

                  return (
                    <div key={rowSet.id || setIndex}>
                      <button
                        type="button"
                        onClick={() => handleRow(exerciseIndex, setIndex)}
                        aria-expanded={isExpanded}
                        className={`console-list-row ${isCurrent ? 'is-current' : ''}`}
                      >
                        <span
                          className={`console-list-index ${isDone ? 'is-done' : ''} ${isCurrent ? 'is-current' : ''}`}
                        >
                          {isDone ? <Check size={13} strokeWidth={2.6} /> : setIndex + 1}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13px] font-semibold leading-tight text-[var(--console-chalk)]">
                            {isSkipped ? 'Skipped' : isDone ? 'Logged' : `Set ${setIndex + 1}`}
                          </span>
                          <span className="mt-0.5 block truncate text-[11px] text-[var(--console-steel)]">
                            {summary}
                          </span>
                        </span>
                        <span className="shrink-0 text-[11px] font-medium text-[var(--console-steel)]">
                          {isExpanded ? 'Close' : isDone ? 'Edit' : 'Log'}
                        </span>
                      </button>

                      <div
                        className={'console-list-editor-wrap ' + (isExpanded ? 'is-open' : '')}
                        aria-hidden={!isExpanded}
                        inert={!isExpanded}
                      >
                        <div className="console-list-editor border-b border-[var(--console-line)] pb-3 pt-2">
                          <SetInputs
                            exercise={exercise}
                            set={rowSet}
                            variant="list"
                            onOpen={(field) => openSheet(field, exerciseIndex, setIndex)}
                          />
                          <EffortRow
                            exercise={exercise}
                            set={rowSet}
                            update={(patch) => updateAt(exerciseIndex, setIndex, patch)}
                          />

                          {missing.length > 0 && (
                            <div className="console-warning">
                              <span>No {missing.join(' or ')} entered.</span>
                              <button
                                type="button"
                                onClick={() => onCompleteAt(exerciseIndex, setIndex, true)}
                                className="shrink-0 border-b border-[#E3B56B] text-[12px] font-semibold text-[#E3B56B]"
                              >
                                Log anyway
                              </button>
                            </div>
                          )}

                          <div className="mt-2 flex items-center gap-2">
                            {!paused && !rowSet.completed && (
                              <button
                                type="button"
                                onClick={() => onCompleteAt(exerciseIndex, setIndex)}
                                className="console-primary console-primary-compact"
                              >
                                <Check size={16} strokeWidth={2.6} />
                                {isSkill ? 'Mark done' : 'Complete set'}
                              </button>
                            )}
                            {!paused && !rowSet.completed && !isSkill && (
                              <button
                                type="button"
                                onClick={() => onSkipAt(exerciseIndex, setIndex)}
                                className="console-text-action shrink-0"
                              >
                                Skip
                              </button>
                            )}
                            {rowSet.completed && (
                              <p className="text-[11px] text-[var(--console-steel)]">
                                Logged. Tap a value to edit it.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <footer className="console-action">
        {paused ? (
          <button type="button" onClick={togglePause} className="console-primary">
            <Play size={17} fill="currentColor" /> Resume workout
          </button>
        ) : (
          <button
            type="button"
            onClick={togglePause}
            className="flex h-11 w-full items-center justify-center gap-2 text-[12px] font-semibold text-[var(--console-steel)] transition-colors hover:text-[var(--console-chalk)]"
          >
            <Pause size={14} /> Pause workout
          </button>
        )}
      </footer>
    </>
  );
}
