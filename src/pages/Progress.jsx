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

export default function Progress() {
  const navigate = useNavigate();
  const { data: sessions = [] } = useSessions();
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

      <div className="grid grid-cols-1 sm:grid-cols-6 gap-3 sm:gap-4">
        <OverviewWidget
          sessions={sessions}
          currentWeek={currentWeek}
          programId={programId}
          phase={phase}
          onClick={() => navigate('/progress/week')}
          className="sm:col-span-6"
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
            className="sm:col-span-4"
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
          className="sm:col-span-2"
        />
      </div>
    </main>
  );
}
