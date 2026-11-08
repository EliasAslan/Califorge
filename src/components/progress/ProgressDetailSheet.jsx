import React from 'react';
import { ChevronRight, ExternalLink } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import {
  getCycleWeeks,
  getCycleConsistency,
  getTrainingStats,
  getAllPersonalRecords,
  formatDuration,
} from '@/lib/trainingLogic';
import { getSkillTracksStatus } from '@/lib/skills';
import ProgressSparkline from '@/components/ProgressSparkline';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const routeLabel = (id) => {
  const labels = {
    overview: 'Week detail',
    cycle: 'Phase detail',
    muscles: 'Muscle balance',
    skills: 'Skill tree',
    prs: 'Personal records',
    weight: 'Bodyweight history',
    consistency: 'Habits',
    trainingTime: null,
    attendance: 'Session history',
  };
  return labels[id];
};

const section = (title) => (
  <div className="mb-3 flex items-center gap-1.5">
    <span className="h-1 w-3 rounded-full bg-border" />
    <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{title}</h3>
  </div>
);

const statRow = (label, value, unit = '') => (
  <div className="flex items-baseline gap-1 mb-1.5">
    <span className="text-[11px] text-muted-foreground">{label}</span>
    <span className="text-sm font-semibold tnum">{value}</span>
    <span className="text-[10px] text-muted-foreground">{unit}</span>
  </div>
);

export default function ProgressDetailSheet({
  id,
  sessions,
  bodyweightEntries,
  units,
  programId,
  currentWeek,
  phase,
  focus,
  onClose,
  onOpenFull,
}) {
  const weeks = getCycleWeeks(sessions, currentWeek, programId);
  const consistency = getCycleConsistency(sessions, currentWeek, programId);
  const stats = getTrainingStats(sessions);
  const prs = getAllPersonalRecords(sessions);
  const skillTracks = getSkillTracksStatus(sessions);
  const route = {
    overview: '/progress/week',
    cycle: '/progress/phase',
    muscles: '/progress/muscle-balance',
    skills: '/progress/skills',
    prs: '/progress/records',
    weight: '/progress/weight',
    consistency: '/progress/habits',
    trainingTime: null,
    attendance: '/history',
  }[id];

  const latestWeight = bodyweightEntries[bodyweightEntries.length - 1];
  const previousWeight = bodyweightEntries.length > 1 ? bodyweightEntries[bodyweightEntries.length - 2] : null;
  const displayWeight = (kg) => (units === 'lb' ? kg * 2.2046226218 : kg);

  const content = () => {
    switch (id) {
      case 'overview': {
        const workoutsThisWeek = weeks.find((w) => w.week === currentWeek)?.workouts || 0;
        const setsThisWeek = weeks.find((w) => w.week === currentWeek)?.sets || 0;
        const timeThisWeek = weeks.find((w) => w.week === currentWeek)?.durationSec || 0;
        return (
          <div className="space-y-4">
            <section>
              {section('This week')}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-background/50 border border-border/50">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-[0.12em]">Workouts</p>
                  <p className="text-2xl font-bold tnum">{workoutsThisWeek}</p>
                </div>
                <div className="p-3 rounded-xl bg-background/50 border border-border/50">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-[0.12em]">Working sets</p>
                  <p className="text-2xl font-bold tnum">{setsThisWeek}</p>
                </div>
                <div className="p-3 rounded-xl bg-background/50 border border-border/50">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-[0.12em]">Training time</p>
                  <p className="text-2xl font-bold tnum">{formatDuration(timeThisWeek) || '0m'}</p>
                </div>
              </div>
            </section>
            <section>
              {section('Cycle')}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-background/50 border border-border/50">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-[0.12em]">Consistency</p>
                  <p className="text-2xl font-bold tnum">{consistency.percent}%</p>
                </div>
                <div className="p-3 rounded-xl bg-background/50 border border-border/50">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-[0.12em]">Phase</p>
                  <p className="text-sm font-semibold">{phase.label}</p>
                </div>
              </div>
            </section>
          </div>
        );
      }
      case 'cycle': {
        return (
          <div className="space-y-3">
            {section('Sets logged per week')}
            <div className="grid grid-cols-4 gap-2">
              {weeks.map((w) => (
                <div key={w.week} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-background/50 border border-border/50">
                  <span className="text-[10px] text-muted-foreground">W{w.week}</span>
                  <span className="text-lg font-bold tnum">{w.sets}</span>
                  {w.isCurrent && <span className="text-[10px] font-semibold text-foreground">Current</span>}
                </div>
              ))}
            </div>
            {weeks.some((w) => w.sets > 0) && (
              <div className="mt-2 h-24 w-full overflow-hidden rounded-xl border border-border bg-background/50">
                <ProgressSparkline
                  data={weeks.map((w) => ({ date: String(w.week), value: w.sets })).filter((w) => w.value > 0)}
                  accent="hsl(var(--foreground))"
                  height={80}
                />
              </div>
            )}
          </div>
        );
      }
      case 'skills': {
        return (
          <div className="space-y-2">
            {section('Skill tracks')}
            {skillTracks.map((t) => {
              const status = t.status;
              const cur = status.current >= 0 ? t.levels[status.current].label : 'Not started';
              const next = status.next >= 0 ? t.levels[status.next].label : 'Complete';
              return (
                <div key={t.id} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-background/50 border border-border/50">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-md flex items-center justify-center bg-card/60 shrink-0">
                      <span className="text-[10px]">{t.visualId.slice(0, 1).toUpperCase()}</span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{t.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">Current: {cur}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold tnum">{status.current + 1} / {t.levels.length}</span>
                  <ChevronRight size={14} className="text-muted-foreground shrink-0" />
                </div>
              );
            })}
          </div>
        );
      }
      case 'prs': {
        return (
          <div className="space-y-2">
            {section('Personal records')}
            <p className="text-sm font-bold tnum">{prs.length}</p>
            <p className="text-[11px] text-muted-foreground mb-3">All-time bests across your logged movements.</p>
            {prs.length ? (
              <div className="space-y-1.5">
                {prs.slice(0, 8).map((r) => (
                  <div key={r.exerciseId} className="flex items-center justify-between gap-3 p-2 rounded-lg bg-background/50 border border-border/50">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{r.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{r.category}</p>
                    </div>
                    <span className="text-sm font-bold tnum">{r.record.label}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground text-center py-4">No personal records yet. Log a session to set your first.</p>
            )}
          </div>
        );
      }
      case 'weight': {
        const points = bodyweightEntries.slice(-7).map((e) => displayWeight(e.weightKg));
        const current = latestWeight ? displayWeight(latestWeight.weightKg) : null;
        const change = latestWeight && previousWeight ? displayWeight(latestWeight.weightKg - previousWeight.weightKg) : null;
        return (
          <div className="space-y-3">
            {section('Bodyweight')}
            {latestWeight ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-background/50 border border-border/50">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-[0.12em]">Current</p>
                  <p className="text-2xl font-bold tnum">{current.toFixed(1)} {units}</p>
                </div>
                <div className="p-3 rounded-xl bg-background/50 border border-border/50">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-[0.12em]">Change</p>
                  <p className="text-2xl font-bold tnum">{change == null ? '—' : `${change > 0 ? '+' : ''}${change.toFixed(1)}`}</p>
                  <span className="text-[10px] text-muted-foreground">{units} since last</span>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground text-center py-4">No bodyweight entries yet.</p>
            )}
            {points.length > 1 && (
              <div className="h-24 w-full overflow-hidden rounded-xl border border-border bg-background/50">
                <ProgressSparkline
                  data={points.map((v, i) => ({ date: String(i), value: v }))}
                  accent="hsl(var(--foreground))"
                  height={80}
                />
              </div>
            )}
          </div>
        );
      }
      case 'consistency': {
        return (
          <div className="space-y-3">
            {section('Cycle consistency by week')}
            <div className="grid grid-cols-4 gap-2">
              {weeks.map((w) => {
                const done = w.workouts > 0;
                return (
                  <div key={w.week} className="flex flex-col items-center gap-1 p-2 rounded-xl border border-border/50 bg-background/50 text-center">
                    <span className="text-[10px] text-muted-foreground">W{w.week}</span>
                    <span className={`text-lg font-bold tnum ${done ? 'text-foreground' : 'text-muted-foreground'}`}>{w.workouts}</span>
                    <span className="text-[10px] text-muted-foreground">{done ? 'done' : '—'}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 p-3 rounded-xl bg-background/50 border border-border/50">
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.12em] mb-1">Overall</p>
              <p className="text-3xl font-extrabold tnum">{consistency.percent}%</p>
              <p className="text-[11px] text-muted-foreground">{consistency.completed} of {consistency.planned} planned workouts completed</p>
            </div>
          </div>
        );
      }
      case 'trainingTime': {
        return (
          <div className="space-y-3">
            {section('Training time per week')}
            <div className="grid grid-cols-4 gap-2">
              {weeks.map((w) => {
                const minutes = Math.round((w.durationSec || 0) / 60);
                return (
                  <div key={w.week} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-background/50 border border-border/50">
                    <span className="text-[10px] text-muted-foreground">W{w.week}</span>
                    <span className="text-lg font-bold tnum">{minutes}m</span>
                    {w.isCurrent && <span className="text-[10px] font-semibold text-foreground">Current</span>}
                  </div>
                );
              })}
            </div>
            {weeks.some((w) => w.durationSec > 0) && (
              <div className="mt-2 h-24 w-full overflow-hidden rounded-xl border border-border bg-background/50">
                <ProgressSparkline
                  data={weeks.map((w) => ({ date: String(w.week), value: Math.round((w.durationSec || 0) / 60) }))}
                  accent="hsl(var(--foreground))"
                  height={80}
                />
              </div>
            )}
          </div>
        );
      }
      case 'attendance': {
        const today = new Date();
        const start = new Date(today);
        start.setDate(start.getDate() - 29);
        const recent = sessions.filter((s) => new Date(s.date || s.startedAt || 0) >= start);
        const daysWithTraining = new Set(recent.map((s) => new Date(s.date || s.startedAt || 0).toDateString()));
        return (
          <div className="space-y-3">
            {section('Last 30 days')}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 30 }, (_, i) => {
                const d = new Date(start);
                d.setDate(start.getDate() + i);
                const done = daysWithTraining.has(d.toDateString());
                const isToday = d.toDateString() === today.toDateString();
                return (
                  <div
                    key={i}
                    className={`aspect-square rounded-lg ${done ? 'bg-foreground' : 'bg-border/50'} ${isToday ? 'ring-1 ring-border' : ''}`}
                  />
                );
              })}
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mb-2">
              <span>30 days</span>
              <span>{daysWithTraining.size} training days</span>
            </div>
          </div>
        );
      }
      case 'muscles': {
        return (
          <div className="space-y-3">
            {section('Muscle volume by week')}
            <p className="text-[11px] text-muted-foreground">Stacked sets by push / pull / legs / core across the cycle.</p>
            <div className="grid grid-cols-4 gap-2">
              {weeks.map((w) => (
                <div key={w.week} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-background/50 border border-border/50">
                  <span className="text-[10px] text-muted-foreground">W{w.week}</span>
                  <span className="text-lg font-bold tnum">{w.total}</span>
                  <span className="text-[10px] text-muted-foreground">sets</span>
                </div>
              ))}
            </div>
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <Sheet open={!!id} onOpenChange={onClose}>
      <SheetContent side="bottom" className="sm:rounded-3xl p-0 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background">
          <div>
            <SheetTitle className="text-lg font-bold tracking-tight">{WIDGET_TITLES[id] || id}</SheetTitle>
            <SheetDescription>{focus.focus}</SheetDescription>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-muted">
            <span className="sr-only">Close</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">{content()}</div>
        {route && (
          <SheetFooter className="px-6 py-4 border-t border-border bg-background/50">
            <button type="button" onClick={() => { onClose(); onOpenFull(id); }} className="inline-flex items-center gap-1.5 rounded-xl bg-foreground px-4 py-2 text-xs font-semibold text-background hover:opacity-90 transition-opacity">
              View full details → <ExternalLink size={14} className="shrink-0" />
            </button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}

const WIDGET_TITLES = {
  overview: 'Training overview',
  cycle: 'Cycle volume',
  muscles: 'Muscle volume',
  skills: 'Skill tree',
  prs: 'Personal records',
  weight: 'Bodyweight',
  consistency: 'Cycle consistency',
  trainingTime: 'Training time',
  attendance: 'Attendance',
};
