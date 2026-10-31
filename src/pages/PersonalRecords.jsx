import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { categoryColor } from '@/lib/programData';
import { useSessions } from '@/hooks/useTrainingData';
import { getAllPersonalRecords } from '@/lib/trainingLogic';
import ExerciseVisual from '@/components/ExerciseVisual';

const TYPE_LABEL = {
  weighted: 'Max weight',
  hold: 'Longest hold',
  reps_hold: 'Best hold + reps',
  reps: 'Max reps',
  skill: 'Best hold',
  prehab: 'Best',
};

export default function PersonalRecords() {
  const navigate = useNavigate();
  const { data: sessions = [] } = useSessions();
  const accent = categoryColor('pull');
  const records = getAllPersonalRecords(sessions);

  return (
    <div className="px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-10">
      <button onClick={() => navigate('/progress')} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3">
        <ChevronLeft size={18} /> Progress
      </button>
      <h1 className="text-2xl font-bold tracking-tight">Personal Records</h1>
      <p className="text-sm text-muted-foreground">{records.length} record{records.length === 1 ? '' : 's'} across all tracked exercises.</p>

      {records.length === 0 ? (
        <div className="p-4 rounded-xl border border-border bg-card/40 text-sm text-muted-foreground mt-5 text-center">
          No records yet. Complete a workout to start setting PRs.
        </div>
      ) : (
        <div className="space-y-2 mt-5">
          {records.map((pr) => (
            <div key={pr.exerciseId} className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-card/50">
              <span className="w-11 h-11 rounded-lg flex items-center justify-center bg-background/60 shrink-0">
                <ExerciseVisual visualId={pr.visualId} category={pr.category} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{pr.name}</p>
                <p className="text-xs text-muted-foreground">
                  {TYPE_LABEL[pr.type] || 'Best'} · {new Date(pr.record.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </p>
              </div>
              <p className="text-sm font-bold tnum shrink-0 text-foreground">{pr.record.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}