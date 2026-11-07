import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Scale } from 'lucide-react';
import { loadSettings } from '@/lib/storage';
import { useBodyweightEntries, useCreateBodyweightEntry } from '@/hooks/useTrainingData';
import WeightWheelSheet from '@/components/workout/WeightWheelSheet';

const toDisplay = (kg, unit) => unit === 'lb' ? kg * 2.2046226218 : kg;
const toKg = (value, unit) => unit === 'lb' ? value / 2.2046226218 : value;

export default function WeightProgress() {
  const navigate = useNavigate();
  const unit = loadSettings().units || 'kg';
  const { data: entries = [] } = useBodyweightEntries();
  const { mutateAsync: createEntry, isPending } = useCreateBodyweightEntry();
  const [sheetOpen, setSheetOpen] = useState(false);
  const latest = entries[entries.length - 1];
  const fallback = Number(loadSettings().bodyweight) || (unit === 'lb' ? 154 : 70);
  const currentValue = latest ? toDisplay(latest.weightKg, unit) : fallback;

  const values = useMemo(() => entries.slice().reverse().slice(0, 12), [entries]);
  const max = Math.max(1, ...values.map((entry) => toDisplay(entry.weightKg, unit)));
  const min = Math.min(...values.map((entry) => toDisplay(entry.weightKg, unit)), max);
  const range = Math.max(0.5, max - min);

  const save = async (value) => {
    await createEntry({
      weightKg: toKg(value, unit),
      date: new Date().toISOString(),
      source: 'manual',
    });
  };

  return (
    <main className="px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-8">
      <button type="button" onClick={() => navigate('/progress')} className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft size={18} /> Progress
      </button>
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Tracking</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Bodyweight</h1>
          <p className="mt-1 text-xs text-muted-foreground">One entry per day. Your history stays private on this device.</p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-card text-muted-foreground"><Scale size={19} /></span>
      </header>

      <section className="mt-5 rounded-2xl border border-border bg-card/55 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Latest entry</p>
        <div className="mt-2 flex items-end justify-between gap-3">
          <p className="text-[2.7rem] font-extrabold leading-none tracking-tight tabular-nums">{latest ? currentValue.toFixed(1) : '—'}<span className="ml-1 text-base font-semibold text-muted-foreground">{unit}</span></p>
          <button type="button" onClick={() => setSheetOpen(true)} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-foreground px-3 text-xs font-bold text-background">
            <Plus size={15} /> Log weight
          </button>
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground">{latest ? new Date(latest.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : 'No entries yet'}</p>
      </section>

      <section className="mt-4 rounded-2xl border border-border bg-card/40 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Recent trend</p>
            <p className="mt-1 text-sm font-semibold">Last {values.length} entries</p>
          </div>
          <span className="text-[10px] text-muted-foreground">{entries.length} total</span>
        </div>
        {values.length > 1 ? (
          <div className="mt-4 flex h-28 items-end gap-2">
            {values.slice().reverse().map((entry, index) => {
              const value = toDisplay(entry.weightKg, unit);
              const height = 18 + ((value - min) / range) * 72;
              return (
                <div key={entry.id} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
                  <span className="text-[9px] font-semibold tabular-nums text-muted-foreground">{value.toFixed(1)}</span>
                  <span className={`w-full rounded-t-md ${index === values.length - 1 ? 'bg-foreground' : 'bg-muted-foreground/45'}`} style={{ height: `${height}%` }} />
                  <span className="text-[8px] text-muted-foreground">{new Date(entry.date).toLocaleDateString(undefined, { day: 'numeric', month: 'numeric' })}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-3 rounded-xl bg-background/50 px-3 py-5 text-center text-xs text-muted-foreground">Log a few days to see your trend here.</p>
        )}
      </section>

      <section className="mt-4">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">History</p>
        {entries.length ? (
          <div className="divide-y divide-border/60 rounded-xl border border-border/70 bg-card/30 px-3">
            {entries.slice().reverse().slice(0, 20).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between py-3">
                <span className="text-xs text-muted-foreground">{new Date(entry.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                <span className="text-sm font-bold tabular-nums">{toDisplay(entry.weightKg, unit).toFixed(1)} {unit}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-border px-3 py-5 text-center text-xs text-muted-foreground">Your weigh-ins will appear here.</p>
        )}
      </section>
      <WeightWheelSheet open={sheetOpen} onOpenChange={setSheetOpen} value={currentValue} unit={unit} onCommit={save} />
    </main>
  );
}
