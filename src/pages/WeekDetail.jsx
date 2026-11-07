import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Check, Minus, Dumbbell, Clock } from 'lucide-react';
import { getSchedule, getWorkout, categoryColor, getActiveProgramId } from '@/lib/programData';
import { useSessions } from '@/hooks/useTrainingData';
import { startOfWeek, isSameDay, formatDuration, getProgramSessions } from '@/lib/trainingLogic';
import ExerciseVisual from '@/components/ExerciseVisual';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function WeekDetail() {
  const navigate = useNavigate();
  const { data: sessions = [] } = useSessions();
  const programId = getActiveProgramId();
  const accent = categoryColor('pull');
  const programSessions = getProgramSessions(sessions, programId);
  const start = startOfWeek();
  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });

  let totalWorkouts = 0, totalSets = 0, totalSec = 0;
  days.forEach((d) => {
    const sess = programSessions.find((s) => isSameDay(new Date(s.date), d));
    if (sess) {
      totalWorkouts++;
      totalSets += sess.exercises.reduce((n, e) => n + e.sets.filter((x) => x.completed && !x.skipped).length, 0);
      totalSec += sess.durationSec || 0;
    }
  });

  return (
    <div className="px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-10">
      <button onClick={() => navigate('/progress')} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3">
        <ChevronLeft size={18} /> Progress
      </button>
      <h1 className="text-2xl font-bold tracking-tight">This Week</h1>
      <p className="text-sm text-muted-foreground">Week of {start.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</p>

      <div className="grid grid-cols-3 gap-3 mt-5">
        <Stat icon={Dumbbell} label="Workouts" value={totalWorkouts} accent={accent} />
        <Stat icon={Check} label="Sets" value={totalSets} accent={accent} />
        <Stat icon={Clock} label="Time" value={formatDuration(totalSec) || '0s'} accent={accent} />
      </div>

      <div className="space-y-2 mt-5">
        {days.map((d, i) => {
          const sched = getSchedule(programId)[i];
          const sess = sessions.find((s) => isSameDay(new Date(s.date), d));
          const workout = sched.workoutId ? getWorkout(sched.workoutId) : null;
          const isToday = isSameDay(d, today);
          const sets = sess ? sess.exercises.reduce((n, e) => n + e.sets.filter((x) => x.completed && !x.skipped).length, 0) : 0;
          return (
            <div key={i} className={`rounded-xl border p-3.5 bg-card/50 ${isToday ? 'border-foreground/30' : 'border-border'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{DAY_NAMES[i]}{isToday && <span className="text-[10px] font-bold uppercase ml-2 text-foreground">Today</span>}</p>
                  <p className="text-xs text-muted-foreground">{workout ? workout.name : 'Rest day'}</p>
                </div>
                {sess ? (
                  <button onClick={() => navigate(`/history/${sess.id}`)} className="text-xs font-semibold inline-flex items-center gap-1 text-foreground">
                    {sets} sets <ChevronLeft size={14} className="rotate-180" />
                  </button>
                ) : (
                  <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                    {sched.rest ? <><Minus size={13} /> Rest</> : 'Not trained'}
                  </span>
                )}
              </div>
              {sess && (
                <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-2">
                  {sess.exercises.map((e) => (
                    <span key={e.exerciseId} className="inline-flex items-center gap-1.5 text-xs bg-background/60 rounded-md px-2 py-1">
                      <span className="w-5 h-5"><ExerciseVisual visualId={e.visualId} category={e.category} /></span>
                      {e.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, accent }) {
  return (
    <div className="p-3 rounded-xl border border-border bg-card/50 text-center">
      <Icon size={15} className="mx-auto text-muted-foreground" />
      <p className="text-lg font-bold tnum mt-1">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mt-0.5">{label}</p>
    </div>
  );
}