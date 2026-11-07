import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessions } from '@/hooks/useTrainingData';
import { loadCurrentWeek } from '@/lib/storage';
import { getActiveProgramId } from '@/lib/programData';
import { getPhaseForWeek, getWeeklyFocus } from '@/lib/trainingLogic';
import OverviewWidget from '@/components/progress/OverviewWidget';
import PhaseHistoryWidget from '@/components/progress/PhaseHistoryWidget';
import SkillsWidget from '@/components/progress/SkillsWidget';
import MuscleBalanceWidget from '@/components/progress/MuscleBalanceWidget';
import PRsWidget from '@/components/progress/PRsWidget';
import WeightWidget from '@/components/progress/WeightWidget';
import { useBodyweightEntries } from '@/hooks/useTrainingData';
import { loadSettings } from '@/lib/storage';

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

  return (
    <main className="px-4 sm:px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-8">
      <header className="mb-4 sm:mb-5">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">Your training cycle</p>
        <div className="mt-1 flex items-baseline justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Progress</h1>
          <span className="shrink-0 text-xs text-muted-foreground">Week {currentWeek} / 8</span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{focus.focus}</p>
      </header>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-6 sm:gap-4">
        <OverviewWidget
          sessions={sessions}
          currentWeek={currentWeek}
          programId={programId}
          phase={phase}
          onClick={() => navigate('/progress/week')}
          className="col-span-2 sm:col-span-6"
        />
        <PhaseHistoryWidget
          sessions={sessions}
          currentWeek={currentWeek}
          programId={programId}
          onWeekClick={(week) => navigate(`/progress/phase?week=${week}`)}
          className="sm:col-span-6"
        />
        {isHypertrophy ? (
          <MuscleBalanceWidget
            sessions={sessions}
            currentWeek={currentWeek}
            programId={programId}
            onClick={() => navigate('/progress/muscle-balance')}
            className="col-span-1 sm:col-span-3"
          />
        ) : (
          <SkillsWidget
            sessions={sessions}
            onClick={() => navigate('/progress/skills')}
            className="sm:col-span-4"
          />
        )}
        <PRsWidget
          sessions={sessions}
          onClick={() => navigate('/progress/records')}
          className="col-span-1 sm:col-span-3"
        />
        <WeightWidget
          entries={bodyweightEntries}
          unit={units}
          onClick={() => navigate('/progress/weight')}
          className="col-span-1 sm:col-span-3"
        />
      </div>
    </main>
  );
}
