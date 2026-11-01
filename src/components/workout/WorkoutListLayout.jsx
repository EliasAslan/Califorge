import React from 'react';
import { Check, Pause, Play, SkipForward } from 'lucide-react';
import ExerciseVisual from '@/components/ExerciseVisual';
import VerticalNumberPicker from '@/components/workout/VerticalNumberPicker';

export default function WorkoutListLayout({
  session, doneSets, totalSets, progress, paused, onSelectSet, update,
  completeSet, skipSet, togglePause, renderTopBar, setLayout, layout,
}) {
  return (
    <div className="min-h-screen flex flex-col px-4 sm:px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))]">
      {renderTopBar()}
      <div className="mt-2 mb-4">
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground mb-2">
          <span className="truncate">{session.workoutName}</span>
          <span className="tnum shrink-0">{doneSets}/{totalSets} sets</span>
        </div>
        <div className="h-1.5 rounded-full bg-border overflow-hidden">
          <div className="h-full transition-all" style={{ width: (progress * 100) + '%', background: 'hsl(var(--foreground))' }} />
        </div>
      </div>
      <div className="flex items-center gap-1 p-1 rounded-xl border border-border bg-card/40 mb-4" aria-label="Workout layout">
        {['focus', 'minimal', 'list'].map((mode) => (
          <button key={mode} onClick={() => setLayout(mode)} aria-pressed={layout === mode}
            className={'flex-1 h-9 rounded-lg text-xs font-semibold capitalize transition-colors ' + (layout === mode ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground')}>{mode}</button>
        ))}
      </div>
      <div className="space-y-3 flex-1">
        {session.exercises.map((exercise, ei) => (
          <section key={exercise.exerciseId + '-' + ei} className="rounded-2xl border border-border overflow-hidden bg-card/30">
            <div className="flex items-center gap-3 px-3.5 py-3 border-b border-border/70">
              <div className="w-9 h-9 rounded-lg bg-background/70 flex items-center justify-center shrink-0"><ExerciseVisual visualId={exercise.visualId} category={exercise.category} /></div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold truncate">{exercise.name}</h3>
                <p className="text-xs text-muted-foreground truncate">{exercise.variation || exercise.category}</p>
              </div>
              <span className="text-[11px] text-muted-foreground tnum">{exercise.sets.filter((s) => s.completed).length}/{exercise.sets.length}</span>
            </div>
            <div className="divide-y divide-border/70">
              {exercise.sets.map((rowSet, si) => {
                const active = session.cursor.exerciseIndex === ei && session.cursor.setIndex === si;
                const isReps = ['reps', 'weighted', 'reps_hold'].includes(exercise.type);
                const isHold = ['hold', 'reps_hold'].includes(exercise.type);
                const isSkill = ['skill', 'prehab'].includes(exercise.type);
                const summary = exercise.type === 'weighted'
                  ? (rowSet.actualReps ?? '—') + ' reps · ' + (rowSet.weight ?? '—') + ' kg'
                  : isReps ? (rowSet.actualReps ?? '—') + ' reps' + (isHold ? ' · ' + (rowSet.actualSec ?? '—') + ' s' : '')
                  : isHold || isSkill ? (rowSet.actualSec ?? '—') + ' sec logged' : 'Tap to log this set';
                return (
                  <div key={rowSet.id || si} className={active ? 'bg-foreground/[0.035]' : ''}>
                    <button type="button" onClick={() => onSelectSet(ei, si)} aria-expanded={active} className="w-full flex items-center gap-3 text-left px-3.5 py-3 min-h-[58px]">
                      <span className={'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ' + (rowSet.completed ? 'bg-emerald-500/15 text-emerald-500' : active ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground')}>{rowSet.completed ? <Check size={14} /> : si + 1}</span>
                      <span className="flex-1 min-w-0"><span className="block text-sm font-semibold">{rowSet.skipped ? 'Skipped' : rowSet.completed ? 'Completed' : 'Set ' + (si + 1)}</span><span className="block text-xs text-muted-foreground truncate">{summary}</span></span>
                      <span className="text-xs text-muted-foreground">{active ? 'Open' : 'Edit'}</span>
                    </button>
                    {active && (
                      <div className="px-3.5 pb-4 pt-1 space-y-3">
                        {isSkill ? (
                          <div><p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mb-2">Best hold</p><VerticalNumberPicker label="Best hold" value={rowSet.actualSec ?? 0} onChange={(v) => update({ actualSec: v })} suffix="s" max={3600} /></div>
                        ) : (
                          <>
                            {exercise.type === 'weighted' && <div><p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mb-2">Weight</p><VerticalNumberPicker label="Weight" value={rowSet.weight ?? 0} onChange={(v) => update({ weight: v })} step={2.5} suffix="kg" max={300} /></div>}
                            {isReps && <div><p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mb-2">Reps</p><VerticalNumberPicker label="Reps" value={rowSet.actualReps ?? 0} onChange={(v) => update({ actualReps: v })} max={300} /></div>}
                            {isHold && <div><p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mb-2">Hold</p><VerticalNumberPicker label="Hold duration" value={rowSet.actualSec ?? 0} onChange={(v) => update({ actualSec: v })} suffix="s" max={3600} /></div>}
                          </>
                        )}
                        <div className="flex gap-2">
                          {!paused && !rowSet.completed && <button onClick={completeSet} className="flex-1 h-11 rounded-xl text-sm font-semibold bg-emerald-500 text-emerald-950"><Check size={15} className="inline mr-1.5" />Complete set</button>}
                          {!paused && !rowSet.completed && !isSkill && <button onClick={skipSet} className="h-11 px-3 rounded-xl border border-border text-sm text-muted-foreground"><SkipForward size={15} className="inline mr-1" />Skip</button>}
                        </div>
                        {rowSet.completed && <p className="text-xs text-muted-foreground">This set is logged. You can still edit its values.</p>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
      {paused
        ? <button onClick={togglePause} className="mt-4 w-full h-12 rounded-xl font-semibold" style={{ background: 'var(--brand)', color: 'var(--brand-fg)' }}><Play size={16} className="inline mr-2" />Resume workout</button>
        : <button onClick={togglePause} className="mt-4 w-full h-11 rounded-xl border border-border text-sm font-medium"><Pause size={15} className="inline mr-2" />Pause workout</button>}
    </div>
  );
}
