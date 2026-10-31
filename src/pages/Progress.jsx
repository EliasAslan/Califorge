import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessions } from '@/hooks/useTrainingData';
import { loadSettings, loadCurrentWeek } from '@/lib/storage';
import { getActiveProgramId } from '@/lib/programData';
import { getPhaseForWeek, getWeeklyFocus } from '@/lib/trainingLogic';
import WeekWidget from '@/components/progress/WeekWidget';
import PhaseWidget from '@/components/progress/PhaseWidget';
import PhaseHistoryWidget from '@/components/progress/PhaseHistoryWidget';
import SkillsWidget from '@/components/progress/SkillsWidget';
import MuscleBalanceWidget from '@/components/progress/MuscleBalanceWidget';
import HabitsWidget from '@/components/progress/HabitsWidget';
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
    <div className="px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-10">
      <header className="pt-2 pb-4">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">{phase.label} · Week {currentWeek} / 8</p>
        <h1 className="text-2xl font-bold tracking-tight mt-0.5">Progress</h1>
        <p className="text-xs text-muted-foreground mt-1">{focus.focus} — {focus.note}</p>
      </header>

      <div className="grid grid-cols-6 gap-3" style={{ gridAutoRows: 'minmax(140px, auto)' }}>
        <WeekWidget sessions={sessions} onClick={() => navigate('/progress/week')} className="col-span-6 row-span-2" />
        <PhaseWidget currentWeek={currentWeek} programId={programId} onClick={() => navigate('/progress/phase')} className="col-span-3" />
        <HabitsWidget sessions={sessions} currentWeek={currentWeek} programId={programId} onClick={() => navigate('/progress/habits')} className="col-span-3" />
        <PhaseHistoryWidget
          sessions={sessions}
          currentWeek={currentWeek}
          programId={programId}
          onWeekClick={(w) => navigate(`/progress/phase?week=${w}`)}
          className="col-span-6"
        />
        {isHypertrophy ? (
          <MuscleBalanceWidget
            sessions={sessions}
            currentWeek={currentWeek}
            programId={programId}
            onClick={() => navigate('/progress/muscle-balance')}
            className="col-span-4"
          />
        ) : (
          <SkillsWidget sessions={sessions} onClick={() => navigate('/progress/skills')} className="col-span-4" />
        )}
        <PRsWidget sessions={sessions} onClick={() => navigate('/progress/records')} className="col-span-2" />
      </div>
    </div>
  );
}