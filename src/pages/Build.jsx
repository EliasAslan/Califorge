import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, X, Play, Trash2, ChevronRight } from 'lucide-react';
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

  const filtered = LIBRARY_EXERCISES.filter((e) => {
    if (cat !== 'all' && e.category !== cat) return false;
    if (query && !(`${e.name} ${e.variation}`.toLowerCase().includes(query.toLowerCase()))) return false;
    return true;
  });

  const startCustom = (w) => {
    const session = buildCustomSession(w.name, w.exercises, loadCurrentWeek());
    saveActiveSession(session);
    navigate('/workout');
  };

  return (
    <div className="px-5 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <header className="pt-2 pb-5 flex items-end justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">Library</p>
          <h1 className="text-2xl font-bold tracking-tight mt-0.5">Build</h1>
        </div>
        <button
          onClick={() => setBuilding(true)}
          className="h-10 px-3.5 rounded-xl text-sm font-semibold inline-flex items-center gap-1.5"
          style={{ background: 'var(--brand)', color: 'var(--brand-fg)' }}
        >
          <Plus size={16} /> Create
        </button>
      </header>

      {/* custom workouts */}
      {custom.length > 0 && (
        <>
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-2">Your Workouts</p>
          <div className="space-y-1.5 mb-5">
            {custom.map((w) => (
              <div key={w.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card/50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{w.name}</p>
                  <p className="text-xs text-muted-foreground">{w.exercises.length} exercises</p>
                </div>
                <button onClick={() => startCustom(w)} className="h-9 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5" style={{ background: 'var(--brand)', color: 'var(--brand-fg)' }}>
                  <Play size={13} fill="#0b0c10" /> Start
                </button>
                <button onClick={() => deleteWorkout(w.id)} className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* search */}
      <div className="relative mb-3">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search exercises"
          className="w-full h-11 pl-9 pr-3 rounded-xl bg-card/60 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:border-foreground/30"
        />
      </div>

      {/* category chips */}
      <div className="-mx-5 px-5 overflow-x-auto no-scrollbar mb-3">
        <div className="flex gap-2">
          <Chip active={cat === 'all'} onClick={() => setCat('all')} label="All" color="#9AA7B8" />
          {LIBRARY_CATEGORIES.map((c) => (
            <Chip key={c} active={cat === c} onClick={() => setCat(c)} label={CATEGORIES[c].label} color={categoryColor(c)} />
          ))}
        </div>
      </div>

      {/* list */}
      <div className="space-y-1.5">
        {filtered.map((ex) => (
          <button
            key={ex.id}
            onClick={() => navigate(`/build/exercise/${ex.id}`)}
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-card/40 hover:bg-card/60 transition-colors text-left"
          >
            <span className="w-10 h-10 rounded-lg flex items-center justify-center bg-background/60 shrink-0">
              <ExerciseVisual visualId={ex.visualId} category={ex.category} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{ex.name}</p>
              <p className="text-xs text-muted-foreground truncate">{ex.variation} · {ex.difficulty}</p>
            </div>
            <ChevronRight size={15} className="text-muted-foreground shrink-0" />
          </button>
        ))}
      </div>
      <div className="h-2" />

      {building && <Builder onClose={() => setBuilding(false)} onSaved={() => setBuilding(false)} />}
    </div>
  );
}

function Chip({ active, onClick, label, color }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 h-9 px-3.5 rounded-lg text-xs font-semibold border transition-colors ${active ? '' : 'border-border bg-card/40 text-muted-foreground'}`}
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

  const list = LIBRARY_EXERCISES.filter((e) => !query || e.name.toLowerCase().includes(query.toLowerCase()));
  const toggle = (id) => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);

  const { mutateAsync: createCustomWorkout, isPending } = useCreateCustomWorkout();
  const save = async () => {
    if (!name.trim() || selected.length === 0) return;
    try {
      await createCustomWorkout({ name: name.trim(), exercises: selected });
      onSaved();
    } catch (error) {
      toast({ title: 'Could not save workout', description: error.message || 'Please try again.', variant: 'destructive' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-[460px] sm:rounded-2xl rounded-t-2xl border border-border bg-card max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-base font-bold">New Workout</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg border border-border flex items-center justify-center"><X size={15} /></button>
        </div>
        <div className="p-4 space-y-3 overflow-y-auto">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Workout name"
            className="w-full h-11 px-3 rounded-xl bg-background/60 border border-border text-sm focus:outline-none focus:border-foreground/30"
          />
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Add exercises"
              className="w-full h-11 pl-9 pr-3 rounded-xl bg-background/60 border border-border text-sm focus:outline-none focus:border-foreground/30"
            />
          </div>
          <div className="space-y-1">
            {list.map((ex) => {
              const on = selected.includes(ex.id);
              return (
                <button
                  key={ex.id}
                  onClick={() => toggle(ex.id)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-lg border text-left ${on ? 'border-foreground/30 bg-foreground/5' : 'border-border bg-background/40'}`}
                >
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-background/60">
                    <ExerciseVisual visualId={ex.visualId} category={ex.category} />
                  </span>
                  <span className="flex-1 text-sm font-medium truncate">{ex.name}</span>
                  <span className={`w-5 h-5 rounded-md border flex items-center justify-center ${on ? 'bg-foreground border-foreground' : 'border-border'}`}>
                    {on && <Check />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="p-4 border-t border-border">
          <button
            onClick={save}
            disabled={!name.trim() || selected.length === 0 || isPending}
            className="w-full h-12 rounded-xl font-semibold disabled:opacity-40"
            style={{ background: 'var(--brand)', color: 'var(--brand-fg)' }}
          >
            Save Workout ({selected.length})
          </button>
        </div>
      </div>
    </div>
  );
}

function Check() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0b0c10" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
  );
}