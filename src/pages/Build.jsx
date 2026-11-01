import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, X, Play, Trash2, ChevronRight, ChevronUp, ChevronDown,
  Check, Dumbbell, ListOrdered, SearchX,
} from 'lucide-react';
import { LIBRARY_EXERCISES, LIBRARY_CATEGORIES, CATEGORIES, categoryColor } from '@/lib/programData';
import { buildCustomSession } from '@/lib/trainingLogic';
import { loadCurrentWeek, saveActiveSession } from '@/lib/storage';
import { useCustomWorkouts, useCreateCustomWorkout, useDeleteCustomWorkout } from '@/hooks/useTrainingData';
import ExerciseVisual from '@/components/ExerciseVisual';
import { toast } from '@/components/ui/use-toast';

export default function Build() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('all');
  const [building, setBuilding] = useState(false);
  const { data: custom = [] } = useCustomWorkouts();
  const { mutate: deleteWorkout } = useDeleteCustomWorkout();

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return LIBRARY_EXERCISES.filter((exercise) => {
      if (cat !== 'all' && exercise.category !== cat) return false;
      return !needle || `${exercise.name} ${exercise.variation} ${exercise.difficulty}`.toLowerCase().includes(needle);
    });
  }, [cat, query]);

  const startCustom = (workout) => {
    if (!workout.exercises?.length) {
      toast({ title: 'This workout is empty', description: 'Create a new workout with at least one exercise.' });
      return;
    }
    const session = buildCustomSession(workout.name, workout.exercises, loadCurrentWeek());
    saveActiveSession(session);
    navigate('/workout');
  };

  return (
    <div className="px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-6">
      <header className="pt-2 pb-5 flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">Library</p>
          <h1 className="text-2xl font-bold tracking-tight mt-0.5">Workout builder</h1>
          <p className="text-sm text-muted-foreground mt-1">Make a session that fits your training today.</p>
        </div>
        <button
          type="button"
          onClick={() => setBuilding(true)}
          className="h-11 px-4 rounded-xl text-sm font-semibold inline-flex items-center gap-2 shrink-0"
          style={{ background: 'var(--brand)', color: 'var(--brand-fg)' }}
        >
          <Plus size={16} /> New workout
        </button>
      </header>

      {custom.length > 0 && (
        <section className="mb-6" aria-labelledby="saved-workouts-heading">
          <div className="flex items-center justify-between mb-2">
            <p id="saved-workouts-heading" className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">Saved workouts</p>
            <span className="text-xs text-muted-foreground tabular-nums">{custom.length}</span>
          </div>
          <div className="space-y-2">
            {custom.map((workout) => (
              <article key={workout.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card/50">
                <span className="w-10 h-10 rounded-lg flex items-center justify-center bg-background/70 shrink-0 text-muted-foreground">
                  <Dumbbell size={17} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{workout.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {workout.exercises?.length || 0} {workout.exercises?.length === 1 ? 'exercise' : 'exercises'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => startCustom(workout)}
                  className="h-11 px-4 rounded-xl text-sm font-semibold inline-flex items-center gap-2"
                  style={{ background: 'var(--brand)', color: 'var(--brand-fg)' }}
                  aria-label={`Start ${workout.name}`}
                >
                  <Play size={13} fill="currentColor" /> Start
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Delete “${workout.name}”?`)) deleteWorkout(workout.id);
                  }}
                  className="w-11 h-11 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0"
                  aria-label={`Delete ${workout.name}`}
                  title="Delete workout"
                >
                  <Trash2 size={14} />
                </button>
              </article>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="exercise-library-heading">
        <div className="flex items-center justify-between mb-2">
          <p id="exercise-library-heading" className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">Exercise library</p>
          <span className="text-xs text-muted-foreground tabular-nums">{filtered.length} movements</span>
        </div>
        <div className="relative mb-3">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, variation, or level"
            aria-label="Search exercise library"
            className="w-full h-11 pl-9 pr-3 rounded-xl bg-card/60 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:border-foreground/30"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-xl flex items-center justify-center text-muted-foreground" aria-label="Clear search">
              <X size={17} />
            </button>
          )}
        </div>

        <div className="-mx-5 px-5 overflow-x-auto no-scrollbar mb-3">
          <div className="flex gap-2">
            <Chip active={cat === 'all'} onClick={() => setCat('all')} label="All" color="#9AA7B8" />
            {LIBRARY_CATEGORIES.map((category) => (
              <Chip key={category} active={cat === category} onClick={() => setCat(category)} label={CATEGORIES[category].label} color={categoryColor(category)} />
            ))}
          </div>
        </div>

        {filtered.length ? (
          <div className="space-y-1.5">
            {filtered.map((exercise) => (
              <button
                key={exercise.id}
                type="button"
                onClick={() => navigate(`/build/exercise/${exercise.id}`)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-card/40 hover:bg-card/60 transition-colors text-left"
              >
                <span className="w-10 h-10 rounded-lg flex items-center justify-center bg-background/60 shrink-0">
                  <ExerciseVisual visualId={exercise.visualId} category={exercise.category} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{exercise.name}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{exercise.variation} · {exercise.difficulty}</p>
                </div>
                <ChevronRight size={15} className="text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border px-5 py-10 text-center">
            <SearchX size={22} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-sm font-semibold">No exercises found</p>
            <p className="text-xs text-muted-foreground mt-1">Try another search or category.</p>
            <button type="button" onClick={() => { setQuery(''); setCat('all'); }} className="mt-3 min-h-11 px-3 rounded-lg text-xs font-semibold underline underline-offset-4">Reset filters</button>
          </div>
        )}
      </section>

      {building && <Builder onClose={() => setBuilding(false)} onSaved={() => setBuilding(false)} />}
    </div>
  );
}

function Chip({ active, onClick, label, color }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 min-h-11 px-4 rounded-xl text-xs font-semibold border transition-colors ${active ? '' : 'border-border bg-card/40 text-muted-foreground'}`}
      style={active ? { background: `${color}1a`, color, borderColor: `${color}55` } : {}}
    >
      {label}
    </button>
  );
}

function Builder({ onClose, onSaved }) {
  const [name, setName] = useState('');
  const [selected, setSelected] = useState([]);
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('all');
  const { mutateAsync: createCustomWorkout, isPending } = useCreateCustomWorkout();

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !isPending) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, isPending]);

  const selectedExercises = useMemo(
    () => selected.map((id) => LIBRARY_EXERCISES.find((exercise) => exercise.id === id)).filter(Boolean),
    [selected],
  );
  const needle = query.trim().toLowerCase();
  const list = useMemo(() => LIBRARY_EXERCISES.filter((exercise) => {
    if (cat !== 'all' && exercise.category !== cat) return false;
    return !needle || `${exercise.name} ${exercise.variation} ${exercise.difficulty}`.toLowerCase().includes(needle);
  }), [cat, needle]);
  const toggle = (id) => setSelected((current) => current.includes(id)
    ? current.filter((selectedId) => selectedId !== id)
    : [...current, id]);
  const move = (index, direction) => setSelected((current) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= current.length) return current;
    const next = [...current];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    return next;
  });
  const save = async (event) => {
    event.preventDefault();
    if (!name.trim() || selected.length === 0 || isPending) return;
    try {
      await createCustomWorkout({ name: name.trim(), exercises: selected });
      toast({ title: 'Workout saved', description: `${name.trim()} is ready in your saved workouts.` });
      onSaved();
    } catch (error) {
      toast({ title: 'Could not save workout', description: error.message || 'Please try again.', variant: 'destructive' });
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in" onClick={() => !isPending && onClose()}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="builder-title"
        className="w-full max-w-[620px] sm:rounded-2xl rounded-t-2xl border border-border bg-card max-h-[92dvh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-3 px-4 sm:px-5 py-4 border-b border-border shrink-0">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">Custom session</p>
            <h2 id="builder-title" className="text-lg font-bold tracking-tight mt-0.5">Build your workout</h2>
          </div>
          <button type="button" onClick={onClose} disabled={isPending} className="w-11 h-11 rounded-xl border border-border flex items-center justify-center shrink-0 disabled:opacity-40" aria-label="Close builder">
            <X size={16} />
          </button>
        </header>

        <form onSubmit={save} className="flex flex-col min-h-0 flex-1">
          <div className="p-4 sm:px-5 space-y-4 overflow-y-auto min-h-0">
            <label className="block">
              <span className="block text-xs font-semibold mb-1.5">Workout name</span>
              <input
                autoFocus
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={48}
                placeholder="e.g. Handstand + push"
                required
                className="w-full h-11 px-3 rounded-xl bg-background/60 border border-border text-sm focus:outline-none focus:border-foreground/40"
              />
            </label>

            <section aria-labelledby="sequence-heading" className="rounded-xl border border-border bg-background/30 overflow-hidden">
              <div className="px-3 py-2.5 flex items-center justify-between gap-3 border-b border-border">
                <div className="flex items-center gap-2 min-w-0">
                  <ListOrdered size={15} className="text-muted-foreground shrink-0" />
                  <h3 id="sequence-heading" className="text-xs font-bold">Workout sequence</h3>
                </div>
                <span className="text-xs text-muted-foreground tabular-nums">{selected.length} selected</span>
              </div>
              {selectedExercises.length ? (
                <ol className="divide-y divide-border max-h-44 overflow-y-auto">
                  {selectedExercises.map((exercise, index) => (
                    <li key={exercise.id} className="flex items-center gap-2.5 px-3 py-2">
                      <span className="w-5 text-center text-[11px] font-bold tabular-nums text-muted-foreground">{String(index + 1).padStart(2, '0')}</span>
                      <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-card shrink-0">
                        <ExerciseVisual visualId={exercise.visualId} category={exercise.category} />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-xs font-semibold truncate">{exercise.name}</span>
                        <span className="block text-[10px] text-muted-foreground truncate">{exercise.variation}</span>
                      </span>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Move ${exercise.name} up`} className="w-11 h-11 rounded-xl border border-border flex items-center justify-center disabled:opacity-25 shrink-0">
                          <ChevronUp size={18} />
                        </button>
                        <button type="button" onClick={() => move(index, 1)} disabled={index === selectedExercises.length - 1} aria-label={`Move ${exercise.name} down`} className="w-8 h-8 rounded-md border border-border flex items-center justify-center disabled:opacity-25">
                          <ChevronDown size={18} />
                        </button>
                        <button type="button" onClick={() => toggle(exercise.id)} aria-label={`Remove ${exercise.name}`} className="w-11 h-11 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0">
                          <X size={14} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="px-4 py-5 text-center">
                  <p className="text-xs font-medium">Your session is empty</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Add movements below, then arrange their order here.</p>
                </div>
              )}
            </section>

            <section aria-labelledby="add-exercises-heading">
              <div className="flex items-end justify-between gap-3 mb-2">
                <div>
                  <h3 id="add-exercises-heading" className="text-xs font-bold">Add exercises</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Tap a movement to add or remove it.</p>
                </div>
                <span className="text-[11px] text-muted-foreground tabular-nums">{list.length} results</span>
              </div>
              <div className="relative mb-2.5">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search movements"
                  aria-label="Search movements to add"
                  className="w-full h-11 pl-9 pr-3 rounded-xl bg-background/60 border border-border text-sm focus:outline-none focus:border-foreground/30"
                />
              </div>
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-2">
                <Chip active={cat === 'all'} onClick={() => setCat('all')} label="All" color="#9AA7B8" />
                {LIBRARY_CATEGORIES.map((category) => (
                  <Chip key={category} active={cat === category} onClick={() => setCat(category)} label={CATEGORIES[category].label} color={categoryColor(category)} />
                ))}
              </div>
              {list.length ? (
                <div className="space-y-1">
                  {list.map((exercise) => {
                    const isSelected = selected.includes(exercise.id);
                    const color = categoryColor(exercise.category);
                    return (
                      <button
                        key={exercise.id}
                        type="button"
                        onClick={() => toggle(exercise.id)}
                        aria-pressed={isSelected}
                        className={`w-full flex items-center gap-2.5 p-3 rounded-xl border text-left transition-colors ${isSelected ? 'bg-foreground/[0.04]' : 'border-border bg-background/30 hover:bg-background/70'}`}
                        style={isSelected ? { borderColor: `${color}88` } : {}}
                      >
                        <span className="w-9 h-9 rounded-lg flex items-center justify-center bg-background/70 shrink-0">
                          <ExerciseVisual visualId={exercise.visualId} category={exercise.category} />
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-xs font-semibold truncate">{exercise.name}</span>
                          <span className="block text-[10px] text-muted-foreground truncate mt-0.5">{exercise.variation} · {exercise.difficulty}</span>
                        </span>
                        <span className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'border-foreground bg-foreground text-background' : 'border-border text-muted-foreground'}`}>
                          {isSelected ? <Check size={13} strokeWidth={2.5} /> : <Plus size={13} />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="py-6 text-center text-xs text-muted-foreground">No movements match. Try another search or category.</p>
              )}
            </section>
          </div>

          <footer className="p-4 sm:px-5 border-t border-border bg-card shrink-0" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
            <div className="flex items-center justify-between gap-3 mb-2.5">
              <span className="text-[11px] text-muted-foreground truncate">
                {selected.length === 0 ? 'Add at least one exercise to continue.' : `${selected.length} ${selected.length === 1 ? 'exercise' : 'exercises'} · order is saved`}
              </span>
              {selected.length > 0 && <button type="button" onClick={() => setSelected([])} className="min-h-11 px-3 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground">Clear all</button>}
            </div>
            <button
              type="submit"
              disabled={!name.trim() || selected.length === 0 || isPending}
              className="w-full h-12 rounded-xl font-semibold text-sm disabled:opacity-40 inline-flex items-center justify-center gap-2"
              style={{ background: 'var(--brand)', color: 'var(--brand-fg)' }}
            >
              {isPending ? 'Saving workout…' : <><Check size={16} /> Save workout</>}
            </button>
          </footer>
        </form>
      </section>
    </div>,
    document.body,
  );
}
