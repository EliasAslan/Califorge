import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, StickyNote, Dumbbell } from 'lucide-react';
import { categoryColor } from '@/lib/programData';
import { formatDuration } from '@/lib/trainingLogic';
import { useSessions } from '@/hooks/useTrainingData';

export default function History() {
  const navigate = useNavigate();
  const { data: sessions = [] } = useSessions();
  const [tab, setTab] = useState('workouts');
  const [showIncomplete, setShowIncomplete] = useState(false);

  const completedSets = (s) => s.exercises.reduce((n, e) => n + e.sets.filter((x) => x.completed && !x.skipped).length, 0);
  const sorted = [...sessions]
    .filter((s) => showIncomplete || completedSets(s) > 0)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  const incompleteCount = sessions.filter((s) => completedSets(s) === 0).length;

  // group workouts by month
  const groups = [];
  sorted.forEach((s) => {
    const d = new Date(s.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const label = d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    let g = groups.find((x) => x.key === key);
    if (!g) { g = { key, label, items: [] }; groups.push(g); }
    g.items.push(s);
  });

  // collect every note (workout-level + per-exercise) as comment entries
  const comments = [];
  sorted.forEach((s) => {
    if (s.note?.trim()) {
      comments.push({ id: `${s.id}-w`, sessionId: s.id, date: s.date, workoutName: s.workoutName, workoutCategory: s.workoutCategory, text: s.note.trim(), exerciseName: null });
    }
    s.exercises.forEach((e) => {
      if (e.note?.trim()) {
        comments.push({ id: `${s.id}-${e.exerciseId}`, sessionId: s.id, date: s.date, workoutName: s.workoutName, workoutCategory: s.workoutCategory, text: e.note.trim(), exerciseName: e.name });
      }
    });
  });

  return (
    <div className="px-5 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <header className="pt-2 pb-4">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">Training</p>
        <h1 className="text-2xl font-bold tracking-tight mt-0.5">History</h1>
      </header>

      {/* tabs */}
      <div className="flex gap-1 p-1 rounded-xl border border-border bg-card/40 mb-5">
        <TabBtn active={tab === 'workouts'} onClick={() => setTab('workouts')} icon={Dumbbell} label="Workouts" count={sorted.length} />
        <TabBtn active={tab === 'comments'} onClick={() => setTab('comments')} icon={StickyNote} label="Comments" count={comments.length} />
      </div>

      {tab === 'workouts' ? (
        sorted.length === 0 ? (
          <Empty text="No workouts logged yet. Complete a workout to start building your history." />
        ) : (
          <div className="space-y-6">
            {incompleteCount > 0 && (
              <button
                onClick={() => setShowIncomplete((v) => !v)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-border bg-card/30 text-xs"
              >
                <span className="text-muted-foreground">
                  {showIncomplete ? 'Showing' : 'Hiding'} {incompleteCount} incomplete {incompleteCount === 1 ? 'session' : 'sessions'}
                </span>
                <span className="font-semibold" style={{ color: 'var(--brand)' }}>
                  {showIncomplete ? 'Hide' : 'Show'}
                </span>
              </button>
            )}
            {groups.map((g) => (
              <div key={g.key}>
                <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-semibold mb-2">{g.label}</p>
                <div className="space-y-1.5">
                  {g.items.map((s) => (
                    <SessionRow key={s.id} session={s} onOpen={() => navigate(`/history/${s.id}`)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        comments.length === 0 ? (
          <Empty text="No notes yet. Add notes during a workout or on the summary screen to see them here." />
        ) : (
          <div className="space-y-1.5">
            {comments.map((c) => (
              <CommentRow key={c.id} comment={c} onOpen={() => navigate(`/history/${c.sessionId}`)} />
            ))}
          </div>
        )
      )}
    </div>
  );
}

function TabBtn({ active, onClick, icon: Icon, label, count }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 h-10 rounded-lg text-sm font-semibold inline-flex items-center justify-center gap-1.5 transition-colors ${active ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}
    >
      <Icon size={15} /> {label} <span className="text-xs tnum opacity-70">{count}</span>
    </button>
  );
}

function Empty({ text }) {
  return <div className="p-4 rounded-xl border border-border bg-card/40 text-sm text-muted-foreground">{text}</div>;
}

function SessionRow({ session, onOpen }) {
  const accent = categoryColor(session.workoutCategory);
  const sets = session.exercises.reduce((n, e) => n + e.sets.filter((x) => x.completed && !x.skipped).length, 0);
  const secs = session.durationSec != null ? session.durationSec : (session.finishedAt && session.startedAt ? Math.round((session.finishedAt - session.startedAt) / 1000) : null);
  const dur = secs != null ? formatDuration(secs) : null;
  const note = session.note?.trim();

  return (
    <button
      onClick={onOpen}
      className="w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-card/40 hover:bg-card/60 transition-colors text-left"
    >
      <span className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${accent}1a` }}>
        <Dumbbell size={16} style={{ color: accent }} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{session.workoutName}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatDate(session.date)} · {sets} sets{dur ? ` · ${dur}` : ''}{session.timeBudgetMin ? ` · ${session.timeBudgetMin} min planned` : (session.mode && session.mode !== 'full' ? ` · ${cap(session.mode)}` : '')}
        </p>
        {note && (
          <div className="flex items-center gap-1.5 mt-1 min-w-0">
            <StickyNote size={11} className="shrink-0 text-muted-foreground" />
            <span className="text-xs text-muted-foreground truncate">{note}</span>
          </div>
        )}
      </div>
      <ChevronRight size={15} className="text-muted-foreground shrink-0" />
    </button>
  );
}

function CommentRow({ comment, onOpen }) {
  const accent = categoryColor(comment.workoutCategory);
  return (
    <button
      onClick={onOpen}
      className="w-full flex items-start gap-3 p-3 rounded-xl border border-border bg-card/40 hover:bg-card/60 transition-colors text-left"
    >
      <span className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${accent}1a` }}>
        <StickyNote size={16} style={{ color: accent }} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground/90 line-clamp-3">{comment.text}</p>
        <p className="text-xs text-muted-foreground mt-1.5">
          {comment.exerciseName ? `${comment.exerciseName} · ` : ''}{comment.workoutName} · {formatDate(comment.date)}
        </p>
      </div>
      <ChevronRight size={15} className="text-muted-foreground shrink-0 mt-1.5" />
    </button>
  );
}

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}