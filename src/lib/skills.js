import { sessionsForExercise } from './trainingLogic';

// Skill tracks map the app's real exercises/progressions into a visual tree.
// Each level is either a logged progression (Front Lever / Planche) or a
// distinct exercise that must have been performed at least once.
export const SKILL_TRACKS = [
  {
    id: 'front_lever',
    name: 'Front Lever',
    visualId: 'frontlever',
    category: 'pull',
    levels: [
      { label: 'Tuck', exerciseId: 'pa_fl_hold', progression: 'Tuck' },
      { label: 'Adv Tuck', exerciseId: 'pa_fl_hold', progression: 'Advanced Tuck' },
      { label: 'Straddle', exerciseId: 'pa_fl_hold', progression: 'Straddle' },
      { label: 'Half-Lay', exerciseId: 'pa_fl_hold', progression: 'Half-Lay' },
      { label: 'Full', exerciseId: 'pa_fl_hold', progression: 'Full' },
    ],
  },
  {
    id: 'planche',
    name: 'Planche',
    visualId: 'planche',
    category: 'push',
    levels: [
      { label: 'Tuck', exerciseId: 'pa_planche', progression: 'Tuck' },
      { label: 'Adv Tuck', exerciseId: 'pa_planche', progression: 'Advanced Tuck' },
      { label: 'Straddle', exerciseId: 'pa_planche', progression: 'Straddle' },
      { label: 'Full', exerciseId: 'pa_planche', progression: 'Full' },
    ],
  },
  {
    id: 'pulling',
    name: 'Pulling',
    visualId: 'muscleup',
    category: 'pull',
    levels: [
      { label: 'Explosive Pull-up', exerciseId: 'alt_explosive_pullup' },
      { label: 'Weighted Pull-up', exerciseId: 'pb_weightedpull' },
      { label: 'Muscle-up', exerciseId: 'pa_muscleup' },
    ],
  },
  {
    id: 'handstand',
    name: 'Handstand',
    visualId: 'handstand',
    category: 'skill',
    levels: [
      { label: 'Freestanding Handstand', exerciseId: 'pa_handstand' },
      { label: 'Handstand Push-up', exerciseId: 'pa_hspu' },
    ],
  },
];

const hasLoggedExercise = (exerciseId, sessions) => {
  const list = sessionsForExercise(exerciseId, sessions);
  return list.some((s) => {
    const entry = s.exercises.find((e) => e.exerciseId === exerciseId);
    return entry && entry.sets.some((set) => set.completed && !set.skipped);
  });
};

const hasLoggedProgression = (exerciseId, progression, sessions) => {
  const list = sessionsForExercise(exerciseId, sessions);
  return list.some((s) => {
    const entry = s.exercises.find((e) => e.exerciseId === exerciseId);
    return entry && entry.sets.some((set) => set.completed && !set.skipped && set.progression === progression);
  });
};

export const getSkillStatus = (track, sessions) => {
  const achieved = track.levels.map((lvl) =>
    lvl.progression ? hasLoggedProgression(lvl.exerciseId, lvl.progression, sessions) : hasLoggedExercise(lvl.exerciseId, sessions)
  );
  let current = -1;
  for (let i = 0; i < achieved.length; i++) if (achieved[i]) current = i;
  return { achieved, current, next: current + 1 < track.levels.length ? current + 1 : -1 };
};

export const getSkillTracksStatus = (sessions) =>
  SKILL_TRACKS.map((t) => ({ ...t, status: getSkillStatus(t, sessions) }));