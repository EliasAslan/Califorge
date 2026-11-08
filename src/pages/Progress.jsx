import React from 'react';
import { useNavigate } from 'react-router-dom';
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
import TimeTrendWidget from '@/components/progress/TimeTrendWidget';
import AttendanceWidget from '@/components/progress/AttendanceWidget';

const SIZE_CLASS = { full: 'col-span-6', lg: 'col-span-4', sm: 'col-span-2' };

// Fixed per-program dashboard layout. Rows hold one full-width tile or a pair
// of tiles. Pairs use staggered widths (2/3 + 1/3) so the dashboard reads as
// asymmetric instead of a perfect grid, while every tile keeps one shared height.
function layoutRows(programId) {
  const liftPair = programId === 'hypertrophy'
    ? [
      { id: 'muscles', size: 'lg' },
      { id: 'prs', size: 'sm' },
    ]
    : [
      { id: 'skills', size: 'lg' },
      { id: 'prs', size: 'sm' },
    ];
  const trendPair = [
    { id: 'attendance', size: 'sm' },
    { id: 'weight', size: 'lg' },
  ];
  return [
    [{ id: 'overview', size: 'full' }],
    [{ id: 'phase', size: 'full' }],
    liftPair,
    trendPair,
    [{ id: 'time', size: 'full' }],
  ];
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
  const rows = layoutRows(programId);

  const renderWidget = (id) => {
    switch (id) {
      case 'overview': return <OverviewWidget sessions={sessions} currentWeek={currentWeek} programId={programId} phase={phase} onClick={() => navigate('/progress/week')} />;
      case 'phase': return <PhaseHistoryWidget sessions={sessions} currentWeek={currentWeek} programId={programId} onWeekClick={(week) => navigate(`/progress/phase?week=${week}`)} />;
      case 'muscles': return <MuscleBalanceWidget sessions={sessions} currentWeek={currentWeek} programId={programId} onClick={() => navigate('/progress/muscle-balance')} />;
      case 'skills': return <SkillsWidget sessions={sessions} onClick={() => navigate('/progress/skills')} />;
      case 'prs': return <PRsWidget sessions={sessions} onClick={() => navigate('/progress/records')} />;
      case 'weight': return <WeightWidget entries={bodyweightEntries} unit={units} onClick={() => navigate('/progress/weight')} />;
      case 'time': return <TimeTrendWidget sessions={sessions} programId={programId} currentWeek={currentWeek} />;
      case 'attendance': return <AttendanceWidget sessions={sessions} programId={programId} />;
      default: return null;
    }
  };

  return (
    <main className="px-4 sm:px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-8">
      <header className="mb-4 sm:mb-5">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">Your training cycle</p>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Progress</h1>
          <span className="text-xs text-muted-foreground">Week {currentWeek} / 8</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{focus.focus}</p>
      </header>

      <div className="grid grid-cols-6 gap-2.5 sm:gap-4">
        {rows.map((row, rowIndex) => (
          <React.Fragment key={rowIndex}>
            {row.length > 1 ? (
              row.map((item) => (
                <div key={item.id} className={SIZE_CLASS[item.size]}>
                  {renderWidget(item.id)}
                </div>
              ))
            ) : (
              <div key={row[0].id} className={SIZE_CLASS[row[0].size]}>
                {renderWidget(row[0].id)}
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </main>
  );
}
