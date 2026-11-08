import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Maximize } from 'lucide-react';
import { useSessions, useBodyweightEntries } from '@/hooks/useTrainingData';
import { loadSettings, loadCurrentWeek } from '@/lib/storage';
import { getActiveProgramId } from '@/lib/programData';
import {
  getPhaseForWeek,
  getWeeklyFocus,
  getCycleWeeks,
  getCycleConsistency,
  getTrainingStats,
} from '@/lib/trainingLogic';
import OverviewWidget from '@/components/progress/OverviewWidget';
import PhaseHistoryWidget from '@/components/progress/PhaseHistoryWidget';
import SkillsWidget from '@/components/progress/SkillsWidget';
import PRsWidget from '@/components/progress/PRsWidget';
import WeightWidget from '@/components/progress/WeightWidget';
import MuscleBalanceWidget from '@/components/progress/MuscleBalanceWidget';
import ConsistencyWidget from '@/components/progress/ConsistencyWidget';
import TrainingTimeWidget from '@/components/progress/TrainingTimeWidget';
import AttendanceCalendarWidget from '@/components/progress/AttendanceCalendarWidget';
import ProgressDetailSheet from '@/components/progress/ProgressDetailSheet';

// Fixed asymmetric bento layouts per program. Every widget is the same height;
// only widths differ, so the dashboard never settles into a perfect grid.
const LAYOUTS = {
  skill_focus: [
    { id: 'overview', colStart: 1, colSpan: 4, rowStart: 1 },
    { id: 'cycle', colStart: 5, colSpan: 2, rowStart: 1 },
    { id: 'skills', colStart: 1, colSpan: 3, rowStart: 2 },
    { id: 'weight', colStart: 4, colSpan: 3, rowStart: 2 },
    { id: 'prs', colStart: 1, colSpan: 2, rowStart: 3 },
    { id: 'consistency', colStart: 3, colSpan: 2, rowStart: 3 },
    { id: 'trainingTime', colStart: 5, colSpan: 2, rowStart: 3 },
    { id: 'attendance', colStart: 1, colSpan: 6, rowStart: 4 },
  ],
  hypertrophy: [
    { id: 'overview', colStart: 1, colSpan: 4, rowStart: 1 },
    { id: 'cycle', colStart: 5, colSpan: 2, rowStart: 1 },
    { id: 'muscles', colStart: 1, colSpan: 3, rowStart: 2 },
    { id: 'skills', colStart: 4, colSpan: 3, rowStart: 2 },
    { id: 'weight', colStart: 1, colSpan: 3, rowStart: 3 },
    { id: 'trainingTime', colStart: 4, colSpan: 3, rowStart: 3 },
    { id: 'prs', colStart: 1, colSpan: 2, rowStart: 4 },
    { id: 'consistency', colStart: 3, colSpan: 2, rowStart: 4 },
    { id: 'attendance', colStart: 5, colSpan: 2, rowStart: 4 },
  ],
};

const WIDGET_LABELS = {
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

// Where the "View full details" button inside a widget's expanded sheet goes.
const WIDGET_ROUTES = {
  overview: '/progress/week',
  cycle: '/progress/phase',
  muscles: '/progress/muscle-balance',
  skills: '/progress/skills',
  prs: '/progress/records',
  weight: '/progress/weight',
  consistency: '/progress/habits',
  trainingTime: null,
  attendance: '/history',
};

const renderWidget = (id, props) => {
  switch (id) {
    case 'overview':
      return <OverviewWidget {...props} />;
    case 'cycle':
      return <PhaseHistoryWidget {...props} />;
    case 'muscles':
      return <MuscleBalanceWidget {...props} />;
    case 'skills':
      return <SkillsWidget {...props} />;
    case 'prs':
      return <PRsWidget {...props} />;
    case 'weight':
      return <WeightWidget {...props} />;
    case 'consistency':
      return <ConsistencyWidget {...props} />;
    case 'trainingTime':
      return <TrainingTimeWidget {...props} />;
    case 'attendance':
      return <AttendanceCalendarWidget {...props} />;
    default:
      return null;
  }
};

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

  const [sheetId, setSheetId] = useState(null);

  const layout = useMemo(() => LAYOUTS[isHypertrophy ? 'hypertrophy' : 'skill_focus'], [isHypertrophy]);

  const commonProps = {
    sessions,
    currentWeek,
    programId,
    phase,
    bodyweightEntries,
    unit: units,
    onWeekClick: (week) => navigate(`/progress/phase?week=${week}`),
  };

  const openSheet = (id) => setSheetId(id);
  const closeSheet = () => setSheetId(null);

  const openWidget = (id) => {
    const route = WIDGET_ROUTES[id];
    if (route) navigate(route);
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
          <button type="button" onClick={() => navigate('/plan')} className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-muted">
            <Maximize size={17} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-6 gap-2.5 sm:gap-4" style={{ gridAutoRows: '184px' }}>
        {layout.map((slot) => {
          const Widget = renderWidget(slot.id, commonProps);
          if (!Widget) return null;
          return (
            <div
              key={slot.id}
              className={`col-start-${slot.colStart} col-span-${slot.colSpan} row-start-${slot.rowStart} min-w-0 overflow-hidden rounded-2xl border border-border bg-card/50 p-3 sm:p-4 cursor-pointer transition-colors hover:bg-card/70`}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  openSheet(slot.id);
                }
              }}
              onClick={() => openSheet(slot.id)}
            >
              <div className="flex items-start justify-between">
                <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">{WIDGET_LABELS[slot.id]}</p>
                <ChevronRight size={14} className="text-muted-foreground shrink-0" />
              </div>
              <div className="mt-auto flex items-end justify-between gap-2">
                {Widget}
                <button type="button" aria-label="Open details" className="rounded-full border border-border bg-background/80 p-1.5 hover:bg-muted" onClick={(e) => { e.stopPropagation(); openSheet(slot.id); }}>
                  <Maximize size={12} className="text-[10px]" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {sheetId && (
        <ProgressDetailSheet
          id={sheetId}
          sessions={sessions}
          bodyweightEntries={bodyweightEntries}
          units={units}
          programId={programId}
          currentWeek={currentWeek}
          phase={phase}
          focus={focus}
          onClose={closeSheet}
          onOpenFull={openWidget}
        />
      )}
    </main>
  );
}
