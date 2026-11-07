import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { categoryColor, MODES } from '@/lib/programData';
import { getProgressionStatus, formatClock, getPhaseCompletion, maybeAdvanceWeek } from '@/lib/trainingLogic';
import { loadActiveSession, clearActiveSession, loadSettings, saveSettings, startNewCycle } from '@/lib/storage';
import { useSessions, useCreateSession, useBodyweightEntries, useCreateBodyweightEntry } from '@/hooks/useTrainingData';
import useConsoleChrome from '@/hooks/useConsoleChrome';
import WeightWheelSheet from '@/components/workout/WeightWheelSheet';
import { withViewTransition } from '@/lib/viewTransition';

function resultLine(sets, type) {
  const reps = sets.map((set) => set.actualReps ?? 0);
  const secs = sets.map((set) => set.actualSec ?? 0);

  if (type === 'weighted') {
    const weight = sets[0]?.weight ?? 0;
    return weight > 0 ? `+${weight} kg × ${reps.join(' / ')}` : `${reps.join(' / ')} reps`;
  }
  if (type === 'reps_hold') return `${reps.join(' / ')} reps + ${secs.join(' / ')}s`;
  if (type === 'skill' || type === 'prehab') {
    const best = Math.max(...secs);
    return best > 0 ? `${best}s best` : `${sets.length} set${sets.length === 1 ? '' : 's'} practiced`;
  }
  if (type === 'hold') {
    const best = Math.max(...secs);
    return sets.length > 1 ? `${best}s best` : `${best}s`;
  }
  return `${reps.join(' / ')} reps`;
}

export default function WorkoutSummary() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [note, setNote] = useState('');
  const [weightSheetOpen, setWeightSheetOpen] = useState(false);
  const [weightLogged, setWeightLogged] = useState(false);
  const { data: sessions = [] } = useSessions();
  const { data: bodyweightEntries = [] } = useBodyweightEntries();
  const { mutateAsync: createSession } = useCreateSession();
  const { mutateAsync: createBodyweightEntry } = useCreateBodyweightEntry();
  useConsoleChrome();

  useEffect(() => {
    const stored = loadActiveSession();
    if (!stored) {
      navigate('/');
      return;
    }
    setSession(stored);
  }, [navigate]);

  if (!session) {
    return (
      <div className="console-page flex min-h-dvh items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-[var(--console-line)] border-t-[var(--console-chalk)]" />
      </div>
    );
  }

  const completedExercises = session.exercises.filter((exercise) =>
    exercise.sets.some((set) => set.completed && !set.skipped),
  );
  const totalSets = session.exercises.reduce((total, exercise) => total + exercise.sets.length, 0);
  const doneSets = session.exercises.reduce(
    (total, exercise) => total + exercise.sets.filter((set) => set.completed && !set.skipped).length,
    0,
  );
  const activeMs =
    session.activeMs != null
      ? session.activeMs
      : (session.finishedAt || Date.now()) - (session.startedAt || Date.now());
  const settings = loadSettings();
  const weightUnit = settings.units || 'kg';
  const latestWeight = bodyweightEntries[bodyweightEntries.length - 1];
  const fallbackWeight = Number(settings.bodyweight) || (weightUnit === 'lb' ? 154 : 70);
  const currentWeight = latestWeight
    ? (weightUnit === 'lb' ? latestWeight.weightKg * 2.2046226218 : latestWeight.weightKg)
    : fallbackWeight;
  const saveBodyweight = async (value) => {
    const weightKg = weightUnit === 'lb' ? value / 2.2046226218 : value;
    await createBodyweightEntry({ weightKg, date: new Date().toISOString(), source: 'workout' });
    saveSettings({ ...loadSettings(), bodyweight: Number(value.toFixed(1)) });
    setWeightLogged(true);
  };

  const handleSave = async () => {
    if (saved) {
      navigate('/');
      return;
    }
    setSaving(true);
    setErr('');
    const payload = {
      date: new Date().toISOString(),
      workoutId: session.workoutId,
      workoutName: session.workoutName,
      workoutCategory: session.workoutCategory,
      programId: session.programId || loadSettings().activeProgram || 'skill',
      week: session.week,
      dayLabel: session.dayLabel,
      mode: session.mode || 'full',
      timeBudgetMin: session.timeBudgetMin || null,
      note: note || '',
      startedAt: session.startedAt,
      finishedAt: session.finishedAt,
      durationSec: Math.round(activeMs / 1000),
      exercises: session.exercises,
    };
    try {
      await createSession(payload);
      clearActiveSession();
      setSaved(true);
      const programId = session.programId || loadSettings().activeProgram || 'skill';
      const synthetic = { ...payload, id: `tmp_${Date.now()}` };
      const allSessions = [...sessions, synthetic];
      if (session.week === 8 && getPhaseCompletion(allSessions, 8, programId)?.complete) {
        startNewCycle(programId);
        withViewTransition(() => navigate('/phase-complete'), 'console-out');
      } else {
        maybeAdvanceWeek(allSessions, programId);
        withViewTransition(() => navigate('/'), 'console-out');
      }
    } catch (error) {
      setErr(error.message || 'Failed to save session');
      setSaving(false);
    }
  };

  return (
    <div className="console-page">
      <div className="console-doc">
        <div className="console-doc-inner">
          <header>
            <p className="text-[12px] font-semibold text-[var(--console-steel)]">Session complete</p>
            <h1 className="mt-2 text-[clamp(2rem,9vw,2.75rem)] font-extrabold leading-[0.98] tracking-[-0.045em] text-[var(--console-chalk)]">
              {session.workoutName}
            </h1>
            <p className="mt-3 text-[13px] text-[var(--console-steel)]">
              {doneSets} of {totalSets} sets, {formatClock(activeMs)}
              {session.mode && session.mode !== 'full' ? `, ${MODES[session.mode]?.label}` : ''}
            </p>
          </header>

          <div className="mt-5 border-y border-[var(--console-line)] py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-[var(--console-steel)]">Bodyweight</p>
                <p className="mt-0.5 text-[10px] text-[var(--console-steel)]">{weightLogged ? 'Logged for today' : 'Optional · helps track changes over time'}</p>
              </div>
              <button type="button" onClick={() => setWeightSheetOpen(true)} className="shrink-0 rounded-lg border border-[var(--console-line)] px-3 py-2 text-[11px] font-semibold text-[var(--console-chalk)]">
                {weightLogged ? 'Update' : '＋ Log weight'}
              </button>
            </div>
          </div>

          <div className="mt-10 border-t border-[var(--console-line)]">
            {session.exercises.map((exercise, index) => {
              const results = exercise.sets.filter((set) => set.completed && !set.skipped);
              if (!results.length) return null;
              const accent = categoryColor(exercise.category);
              const progression = getProgressionStatus(exercise.exerciseId, [
                ...sessions,
                { ...session, date: new Date().toISOString() },
              ]);

              return (
                <div
                  key={`${exercise.exerciseId}-${index}`}
                  className="flex items-start gap-3.5 border-b border-[var(--console-line)] py-5"
                >
                  <span
                    aria-hidden="true"
                    className="mt-1.5 h-10 w-[3px] shrink-0"
                    style={{ background: accent }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <h2 className="min-w-0 truncate text-[13px] font-semibold text-[var(--console-steel)]">
                        {exercise.name}
                      </h2>
                      {progression.status === 'earned' && (
                        <span
                          className="shrink-0 text-[10px] font-semibold"
                          style={{ color: accent }}
                        >
                          Progress earned
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-[20px] font-bold leading-tight tracking-[-0.03em] tabular-nums text-[var(--console-chalk)]">
                      {resultLine(results, exercise.type)}
                    </p>
                    <p className="mt-1 text-[11px] text-[var(--console-steel)]">
                      {results.length} of {exercise.sets.length} sets
                    </p>
                  </div>
                </div>
              );
            })}
            {completedExercises.length === 0 && (
              <p className="border-b border-[var(--console-line)] py-8 text-[13px] text-[var(--console-steel)]">
                No sets logged this session.
              </p>
            )}
          </div>

          <div className="mt-10">
            <label
              htmlFor="session-note"
              className="text-[11px] font-semibold text-[var(--console-steel)]"
            >
              Workout note
            </label>
            <textarea
              id="session-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="How did it feel? Anything to remember for next time…"
              rows={3}
              className="mt-2.5 w-full resize-none border border-[var(--console-line)] bg-transparent p-3.5 text-[14px] leading-relaxed text-[var(--console-chalk)] outline-none placeholder:text-[var(--console-steel)] focus:border-[var(--console-chalk)]"
            />
          </div>

          {err && (
            <p role="alert" className="mt-4 text-[12px] text-[var(--console-oxide)]">
              {err}
            </p>
          )}

          <div className="mt-8">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="console-primary"
            >
              <Check size={18} strokeWidth={2.6} />
              {saving ? 'Saving…' : saved ? 'Done' : 'Save workout'}
            </button>
          </div>
        </div>
      </div>
      <WeightWheelSheet
        open={weightSheetOpen}
        onOpenChange={setWeightSheetOpen}
        value={currentWeight}
        unit={weightUnit}
        onCommit={saveBodyweight}
      />
    </div>
  );
}
