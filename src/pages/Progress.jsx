import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Check, Plus, X, Layers, Ungroup, ChevronLeft, ChevronRight, Minus, Maximize2 } from 'lucide-react';
import { useSessions, useBodyweightEntries } from '@/hooks/useTrainingData';
import { loadCurrentWeek, loadSettings } from '@/lib/storage';
import { getActiveProgramId } from '@/lib/programData';
import { getPhaseForWeek, getWeeklyFocus } from '@/lib/trainingLogic';
import OverviewWidget from '@/components/progress/OverviewWidget';
import PhaseHistoryWidget from '@/components/progress/PhaseHistoryWidget';
import SkillsWidget from '@/components/progress/SkillsWidget';
import MuscleBalanceWidget from '@/components/progress/MuscleBalanceWidget';
import PRsWidget from '@/components/progress/PRsWidget';
import WeightWidget from '@/components/progress/WeightWidget';

const WIDGETS = [
  { id: 'overview', label: 'Training overview', defaultSize: 'full' },
  { id: 'phase', label: 'Cycle volume', defaultSize: 'full' },
  { id: 'muscles', label: 'Muscle volume', defaultSize: 'half', program: 'hypertrophy' },
  { id: 'skills', label: 'Skill tree', defaultSize: 'third' },
  { id: 'prs', label: 'Personal records', defaultSize: 'third' },
  { id: 'weight', label: 'Bodyweight', defaultSize: 'third' },
];
const SIZE_ORDER = ['third', 'half', 'full'];
const SIZE_CLASS = { third: 'col-span-2', half: 'col-span-3', full: 'col-span-6' };
const STORAGE_KEY = 'cali.v1.progressLayout';

function defaultLayout(isHypertrophy) {
  return [
    { type: 'widget', id: 'overview', size: 'full' },
    { type: 'widget', id: 'phase', size: 'full' },
    ...(isHypertrophy ? [{ type: 'widget', id: 'muscles', size: 'half' }, { type: 'widget', id: 'skills', size: 'half' }, { type: 'widget', id: 'prs', size: 'half' }, { type: 'widget', id: 'weight', size: 'half' }] : [
      { type: 'widget', id: 'skills', size: 'third' },
      { type: 'widget', id: 'prs', size: 'third' },
      { type: 'widget', id: 'weight', size: 'third' },
    ]),
  ];
}

function readLayout(programId, isHypertrophy) {
  try {
    const saved = JSON.parse(localStorage.getItem(`${STORAGE_KEY}.${programId}`));
    if (Array.isArray(saved) && saved.length) return saved;
  } catch { /* use defaults */ }
  return defaultLayout(isHypertrophy);
}

export default function Progress() {
  const navigate = useNavigate();
  const { data: sessions = [] } = useSessions();
  const { data: bodyweightEntries = [] } = useBodyweightEntries();
  const units = loadSettings().units || 'kg';
  const programId = getActiveProgramId();
  const currentWeek = loadCurrentWeek(programId);
  const phase = getPhaseForWeek(currentWeek, programId);
  const focus = getWeeklyFocus(currentWeek, programId);
  const isHypertrophy = programId === 'hypertrophy';

  const [layout, setLayout] = useState(() => readLayout(programId, isHypertrophy));
  const [editing, setEditing] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    setLayout(readLayout(programId, isHypertrophy));
    setSelected([]);
    setEditing(false);
    setAddOpen(false);
  }, [programId, isHypertrophy]);

  useEffect(() => {
    try { localStorage.setItem(`${STORAGE_KEY}.${programId}`, JSON.stringify(layout)); } catch { /* storage unavailable */ }
  }, [layout, programId]);

  const presentIds = useMemo(() => new Set(layout.flatMap(item => item.type === 'stack' ? item.items.map(child => child.id) : [item.id])), [layout]);
  const available = WIDGETS.filter(widget => (!widget.program || widget.program === programId) && !presentIds.has(widget.id));

  const updateWidget = (id, updater) => setLayout(current => current.map(item => {
    if (item.type === 'widget' && item.id === id) return updater(item);
    if (item.type === 'stack') return { ...item, items: item.items.map(child => child.id === id ? updater(child) : child) };
    return item;
  }));

  const removeWidget = (id) => {
    setLayout(current => current.flatMap(item => {
      if (item.type === 'widget' && item.id === id) return [];
      if (item.type === 'stack') {
        const items = item.items.filter(child => child.id !== id);
        if (items.length > 1) return [{ ...item, items }];
        if (items.length === 1) return [{ type: 'widget', ...items[0] }];
        return [];
      }
      return [item];
    }));
    setSelected(current => current.filter(value => value !== id));
  };

  const addWidget = (widget) => {
    setLayout(current => [...current, { type: 'widget', id: widget.id, size: widget.defaultSize }]);
    setAddOpen(false);
  };

  const resizeWidget = (id, direction) => updateWidget(id, item => {
    const index = SIZE_ORDER.indexOf(item.size);
    return { ...item, size: SIZE_ORDER[Math.max(0, Math.min(SIZE_ORDER.length - 1, index + direction))] };
  });

  const layerSelected = () => {
    if (selected.length < 2) return;
    setLayout(current => {
      const chosen = new Set(selected);
      const items = current.flatMap(item => item.type === 'stack' ? item.items : [{ id: item.id, size: item.size }]);
      const layered = items.filter(item => chosen.has(item.id));
      const remaining = items.filter(item => !chosen.has(item.id));
      const stack = { type: 'stack', id: `stack-${Date.now()}`, items: layered };
      return [...remaining.map(item => ({ type: 'widget', ...item })), stack];
    });
    setSelected([]);
  };

  const unlayer = (stackId) => setLayout(current => current.flatMap(item => {
    if (item.type !== 'stack' || item.id !== stackId) return [item];
    return item.items.map(child => ({ type: 'widget', ...child }));
  }));

  const renderWidget = (id) => {
    const common = { sessions, onClick: () => {} };
    switch (id) {
      case 'overview': return <OverviewWidget {...common} currentWeek={currentWeek} programId={programId} phase={phase} onClick={() => navigate('/progress/week')} />;
      case 'phase': return <PhaseHistoryWidget {...common} currentWeek={currentWeek} programId={programId} onWeekClick={(week) => navigate(`/progress/phase?week=${week}`)} />;
      case 'muscles': return <MuscleBalanceWidget {...common} currentWeek={currentWeek} programId={programId} onClick={() => navigate('/progress/muscle-balance')} />;
      case 'skills': return <SkillsWidget {...common} onClick={() => navigate('/progress/skills')} />;
      case 'prs': return <PRsWidget {...common} onClick={() => navigate('/progress/records')} />;
      case 'weight': return <WeightWidget entries={bodyweightEntries} unit={units} onClick={() => navigate('/progress/weight')} />;
      default: return null;
    }
  };

  const renderCard = (item, stacked = false) => {
    const widget = WIDGETS.find(entry => entry.id === item.id);
    if (!widget) return null;
    const isSelected = selected.includes(item.id);
    return (
      <div key={item.id} className={`${stacked ? 'w-full min-w-full snap-center' : SIZE_CLASS[item.size] || 'col-span-2'} min-w-0 relative`}>
        <div className={editing ? 'pointer-events-none select-none' : ''}>
          {renderWidget(item.id)}
        </div>
        {editing && (
          <div className="absolute inset-0 z-10 rounded-2xl border-2 border-dashed border-foreground/35 bg-background/10">
            <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full border border-border bg-background/95 p-1 shadow-sm">
              <button type="button" onClick={() => setSelected(current => isSelected ? current.filter(value => value !== item.id) : [...current, item.id])} className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${isSelected ? 'bg-foreground text-background' : 'bg-muted text-foreground'}`}>
                {isSelected ? 'Selected' : 'Select'}
              </button>
              <button type="button" aria-label="Make smaller" onClick={() => resizeWidget(item.id, -1)} className="rounded-full p-1.5 hover:bg-muted"><Minus size={13} /></button>
              <button type="button" aria-label="Make larger" onClick={() => resizeWidget(item.id, 1)} className="rounded-full p-1.5 hover:bg-muted"><Maximize2 size={13} /></button>
            </div>
            <button type="button" aria-label={`Remove ${widget.label}`} onClick={() => removeWidget(item.id)} className="absolute right-2 top-2 rounded-full border border-border bg-background p-2 shadow-sm"><X size={14} /></button>
            <span className="absolute bottom-2 left-2 rounded-full bg-background/95 px-2.5 py-1 text-[10px] font-semibold shadow-sm">{widget.label}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <main className="px-4 sm:px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-8">
      <header className="mb-4 sm:mb-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">Your training cycle</p>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1 className="text-2xl font-bold tracking-tight">Progress</h1>
              <span className="text-xs text-muted-foreground">Week {currentWeek} / 8</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{focus.focus}</p>
          </div>
          <button type="button" onClick={() => { setEditing(value => !value); setSelected([]); setAddOpen(false); }} className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors ${editing ? 'border-foreground bg-foreground text-background' : 'border-border bg-card text-foreground hover:bg-muted'}`} aria-label={editing ? 'Finish editing progress layout' : 'Edit progress layout'}>
            {editing ? <Check size={18} /> : <Pencil size={17} />}
          </button>
        </div>
      </header>

      {editing && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card/70 p-2.5">
          <button type="button" onClick={() => setAddOpen(value => !value)} className="inline-flex items-center gap-1.5 rounded-xl bg-foreground px-3 py-2 text-xs font-semibold text-background"><Plus size={14} /> Add widget</button>
          <button type="button" onClick={layerSelected} disabled={selected.length < 2} className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold disabled:opacity-40"><Layers size={14} /> Layer selected {selected.length > 0 ? `(${selected.length})` : ''}</button>
          <span className="ml-auto text-[10px] text-muted-foreground">Select 2+ widgets to stack them</span>
          {addOpen && (
            <div className="grid w-full grid-cols-2 gap-2 border-t border-border pt-2">
              {available.length ? available.map(widget => (
                <button key={widget.id} type="button" onClick={() => addWidget(widget)} className="rounded-xl border border-border bg-background px-3 py-2.5 text-left text-xs font-medium hover:bg-muted">{widget.label}<Plus size={13} className="float-right" /></button>
              )) : <p className="col-span-2 py-2 text-xs text-muted-foreground">All available widgets are already on this page.</p>}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-6 gap-2.5 sm:gap-4">
        {layout.map(item => item.type === 'stack' ? (
          <section key={item.id} className="col-span-6 min-w-0 overflow-hidden rounded-2xl border border-border bg-card/40 p-2">
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"><Layers size={12} /> Layered widgets</span>
              {editing && <button type="button" onClick={() => unlayer(item.id)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold text-muted-foreground hover:bg-muted"><Ungroup size={12} /> Unstack</button>}
            </div>
            <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain pb-1" style={{ touchAction: 'pan-x', scrollbarWidth: 'none' }}>
              {item.items.map(child => renderCard(child, true))}
            </div>
            <div className="mt-1.5 flex justify-center gap-1.5">
              {item.items.map((child, index) => <span key={child.id} className="h-1 rounded-full bg-foreground/35" style={{ width: index === 0 ? 16 : 5 }} />)}
            </div>
          </section>
        ) : renderCard(item))}
      </div>
      {editing && <p className="mt-4 text-center text-[11px] text-muted-foreground">Your layout is saved automatically. Tap the checkmark when you’re done.</p>}
    </main>
  );
}
