import { loadSettings } from './storage';
import { ACCENTS } from './appearance';
import { ADDITIONAL_EXERCISES, getExerciseAlternativeIds } from './exerciseAdaptations';

// ── Phases ──────────────────────────────────────────────────────────────────
export const PHASES = {
  accumulation: {
    key: 'accumulation',
    label: 'Accumulation',
    blurb: 'Learn movements and establish baselines.',
  },
  deload: {
    key: 'deload',
    label: 'Deload',
    blurb: 'Cut sets by 1. Keep loads similar. Do not advance progressions.',
  },
  intensification: {
    key: 'intensification',
    label: 'Intensification',
    blurb: 'Advance progressions and loading where earned.',
  },
  consolidation: {
    key: 'consolidation',
    label: 'Consolidation',
    blurb: 'Hold volume and intensity. Prepare for the comparison week.',
  },
  comparison: {
    key: 'comparison',
    label: 'Comparison',
    blurb: 'Re-test key lifts and skills. Compare to week 1.',
  },
  test: {
    key: 'test',
    label: 'Test Week',
    blurb: 'Moderate volume. Test key skills and strength movements.',
  },
};

// ── Skill program weeks (existing) ───────────────────────────────────────────
export const WEEKS = [
  { week: 1, phase: 'accumulation', note: 'Learn movements and establish baselines.' },
  { week: 2, phase: 'accumulation', note: 'Build consistency, prioritize technique.' },
  { week: 3, phase: 'accumulation', note: 'Push slightly harder, carefully log performance.' },
  { week: 4, phase: 'deload', note: 'Cut all sets by 1. Keep weights/holds. No new progressions.' },
  { week: 5, phase: 'intensification', note: 'Advance progressions where earned.' },
  { week: 6, phase: 'intensification', note: 'Increase loading where appropriate.' },
  { week: 7, phase: 'intensification', note: 'Highest training volume and intensity.' },
  { week: 8, phase: 'test', note: 'Moderate volume. Test key skills and strength.' },
];

// ── Hypertrophy program weeks ────────────────────────────────────────────────
export const HYP_WEEKS = [
  { week: 1, phase: 'accumulation', note: 'Establish working loads. Focus on clean reps and control.' },
  { week: 2, phase: 'accumulation', note: 'Add a set or a little load where reps are clean.' },
  { week: 3, phase: 'accumulation', note: 'Push volume. Log every set honestly.' },
  { week: 4, phase: 'deload', note: 'Cut 1 set per exercise. Keep loads. No new maxes.' },
  { week: 5, phase: 'intensification', note: 'Add load or harder variation where the top range was hit.' },
  { week: 6, phase: 'intensification', note: 'Highest load week. Keep quality high.' },
  { week: 7, phase: 'consolidation', note: 'Hold volume and intensity. Prepare for comparison.' },
  { week: 8, phase: 'comparison', note: 'Re-test key lifts. Compare to week 1 numbers.' },
];

// ── Categories ──────────────────────────────────────────────────────────────
export const CATEGORIES = {
  push:   { key: 'push',   label: 'Push',   color: '#F5A623', cssVar: '--c-push' },
  pull:   { key: 'pull',   label: 'Pull',   color: '#3FB6F8', cssVar: '--c-pull' },
  legs:   { key: 'legs',   label: 'Legs',   color: '#34D399', cssVar: '--c-legs' },
  core:   { key: 'core',   label: 'Core',   color: '#A78BFA', cssVar: '--c-core' },
  skill:  { key: 'skill',  label: 'Skill',  color: '#9AA7B8', cssVar: '--c-skill' },
  prehab: { key: 'prehab', label: 'Prehab', color: '#FB7BA0', cssVar: '--c-prehab' },
};

// The user-selected accent color applies globally across the app.
export const accentColor = () => {
  const a = ACCENTS[loadSettings().accent];
  return a ? a.color : '#3FB6F8';
};
export const categoryColor = (key) => {
  const c = CATEGORIES[key];
  return c ? c.color : accentColor();
};

// ── Skill weekly schedule (Monday-first) ──────────────────────────────────────
export const WEEKLY_SCHEDULE = [
  { day: 'Monday',    short: 'MON', workoutId: 'push_a' },
  { day: 'Tuesday',   short: 'TUE', workoutId: 'pull_a' },
  { day: 'Wednesday', short: 'WED', workoutId: null, rest: true },
  { day: 'Thursday',  short: 'THU', workoutId: 'legs_core' },
  { day: 'Friday',    short: 'FRI', workoutId: 'push_b' },
  { day: 'Saturday',  short: 'SAT', workoutId: 'pull_b' },
  { day: 'Sunday',    short: 'SUN', workoutId: null, rest: true },
];

// ── Hypertrophy weekly schedule (4-day Upper/Lower) ───────────────────────────
export const HYP_SCHEDULE = [
  { day: 'Monday',    short: 'MON', workoutId: null, rest: true },
  { day: 'Tuesday',   short: 'TUE', workoutId: 'upper_a' },
  { day: 'Wednesday', short: 'WED', workoutId: 'lower_a' },
  { day: 'Thursday',  short: 'THU', workoutId: null, rest: true },
  { day: 'Friday',    short: 'FRI', workoutId: null, rest: true },
  { day: 'Saturday',  short: 'SAT', workoutId: 'upper_b' },
  { day: 'Sunday',    short: 'SUN', workoutId: 'lower_b' },
];

// ── Exercises ──────────────────────────────────────────────────────────────
// type: 'skill' | 'hold' | 'reps' | 'weighted' | 'reps_hold' | 'prehab'
const E = (e) => e;

export const EXERCISES = {
  // ── Push A ──
  pa_handstand: E({
    id: 'pa_handstand', name: 'Freestanding Handstand', variation: 'Skill practice',
    visualId: 'handstand', category: 'skill', type: 'skill',
    durationMin: '12–15', sets: 1,
    equipment: ['Floor', 'Wall (optional)'], muscles: ['Shoulders', 'Core', 'Wrist stabilizers'],
    difficulty: 'Advanced', progression: 'Wall → Freestanding',
    notes: 'Focus on balance, alignment and time under control. Log best hold.',
    description: 'Freestanding balance work. The goal is control, not max time. Use the wall only to kick up.',
  }),
  pa_planche: E({
    id: 'pa_planche', name: 'Planche Lean / Tuck Planche', variation: 'Lean',
    visualId: 'planche', category: 'push', type: 'hold',
    sets: 3, targetSec: [6, 8], restSec: 180, rpe: '8',
    progressionLevels: ['Tuck', 'Advanced Tuck', 'Straddle', 'Full'],
    equipment: ['Floor', 'Parallettes'], muscles: ['Shoulders', 'Triceps', 'Core', 'Biceps'],
    difficulty: 'Advanced', progression: 'Lean → Tuck → Adv Tuck → Straddle',
    notes: 'Lean forward over the hands. Hips level with shoulders.',
  }),
  pa_hspu: E({
    id: 'pa_hspu', name: 'Freestanding / Wall HSPU', variation: 'Handstand push-up',
    visualId: 'hspu', category: 'push', type: 'reps',
    sets: 4, targetReps: [2, 5], restSec: 180, rir: '1–2',
    equipment: ['Floor', 'Wall', 'Parallettes'], muscles: ['Shoulders', 'Triceps', 'Upper chest'],
    difficulty: 'Advanced', progression: 'Pike → Wall → Deficit',
    notes: 'Control the descent. Full ROM if using parallettes.',
    alternatives: ['alt_pike_pushup'],
  }),
  pa_deficitpu: E({
    id: 'pa_deficitpu', name: 'Deficit Push-ups', variation: 'On Parallettes',
    visualId: 'pushup', category: 'push', type: 'reps',
    sets: 3, targetReps: [8, 12], restSec: 120, rir: '2–3',
    equipment: ['Parallettes'], muscles: ['Chest', 'Shoulders', 'Triceps'],
    difficulty: 'Intermediate', progression: 'Increase deficit depth',
    notes: 'Deep range of motion. Pause briefly at the bottom.',
  }),
  pa_ringdips: E({
    id: 'pa_ringdips', name: 'Ring Dips', variation: 'Rings',
    visualId: 'dip', category: 'push', type: 'reps',
    sets: 3, targetReps: [8, 10], restSec: 120, rir: '2',
    equipment: ['Rings'], muscles: ['Triceps', 'Chest', 'Shoulders'],
    difficulty: 'Advanced', progression: 'Add weight / RTO',
    notes: 'Keep rings turned out at the top. Control the turn-out.',
  }),

  // ── Pull A ──
  pa_fl_hold: E({
    id: 'pa_fl_hold', name: 'Front Lever Hold', variation: 'Half-Lay / Straddle',
    visualId: 'frontlever', category: 'pull', type: 'hold',
    sets: 4, targetSec: [4, 6], restSec: 180, rpe: '8',
    progressionLevels: ['Tuck', 'Advanced Tuck', 'Straddle', 'Half-Lay', 'Full'],
    equipment: ['Pull-up bar', 'Rings'], muscles: ['Lats', 'Core', 'Rhomboids', 'Biceps'],
    difficulty: 'Advanced', progression: 'Tuck → Adv Tuck → Straddle → Half-Lay → Full',
    notes: 'Body fully straight, hips level. No sagging.',
    alternatives: ['alt_tuck_fl'],
  }),
  pa_muscleup: E({
    id: 'pa_muscleup', name: 'Muscle-up', variation: 'Bar / Ring',
    visualId: 'muscleup', category: 'pull', type: 'reps',
    sets: 4, targetReps: [1, 3], restSec: 180, rpe: '8–9',
    equipment: ['Rings', 'Pull-up bar'], muscles: ['Lats', 'Biceps', 'Triceps', 'Shoulders'],
    difficulty: 'Advanced', progression: 'Strict reps → Weighted',
    notes: 'Pull high and fast. Smooth transition. Strict form preferred.',
    alternatives: ['alt_explosive_pullup'],
  }),
  pa_fl_rows: E({
    id: 'pa_fl_rows', name: 'Front Lever Rows', variation: 'Tuck / Advanced Tuck',
    visualId: 'flrow', category: 'pull', type: 'reps',
    sets: 3, targetReps: [5, 7], restSec: 150, rir: '2',
    equipment: ['Rings', 'Bar'], muscles: ['Lats', 'Rhomboids', 'Rear delts', 'Biceps'],
    difficulty: 'Advanced', progression: 'Tuck → Adv Tuck → Straddle',
    notes: 'Keep body horizontal. Pull to the lower chest.',
  }),
  pa_ringrows: E({
    id: 'pa_ringrows', name: 'Ring Rows', variation: 'Feet Elevated',
    visualId: 'ringrow', category: 'pull', type: 'reps',
    sets: 3, targetReps: [10, 12], restSec: 90, rir: '2–3',
    equipment: ['Rings'], muscles: ['Lats', 'Rhomboids', 'Biceps', 'Rear delts'],
    difficulty: 'Intermediate', progression: 'Elevate feet → Add weight',
    notes: 'Body straight from heels to head. Full scapular retraction.',
  }),
  pa_reardeltfly: E({
    id: 'pa_reardeltfly', name: 'Ring Rear Delt Flyes', variation: 'Rings',
    visualId: 'reardeltfly', category: 'pull', type: 'reps',
    sets: 3, targetReps: [12, 15], restSec: 75, rir: '3',
    equipment: ['Rings'], muscles: ['Rear delts', 'Rhomboids'],
    difficulty: 'Beginner', progression: 'More horizontal → Pause',
    notes: 'Lead with the elbows. Squeeze rear delts at end ROM.',
  }),

  // ── Legs + Core ──
  lc_handstand: E({
    id: 'lc_handstand', name: 'Freestanding Handstand', variation: 'Easy maintenance',
    visualId: 'handstand', category: 'skill', type: 'skill',
    durationMin: '5–10', sets: 1,
    equipment: ['Floor'], muscles: ['Shoulders', 'Core'],
    difficulty: 'Advanced', progression: 'Maintain current level',
    notes: 'Light skill work. Do not accumulate fatigue.',
  }),
  lc_lsit: E({
    id: 'lc_lsit', name: 'L-sit Holds', variation: 'On Parallettes',
    visualId: 'lsit', category: 'core', type: 'hold',
    sets: 4, targetSec: [8, 15], restSec: 120, rpe: '7–8',
    equipment: ['Parallettes', 'Floor'], muscles: ['Hip flexors', 'Core', 'Triceps', 'Quads'],
    difficulty: 'Advanced', progression: 'Tuck → Adv Tuck → L-sit → V-sit',
    notes: 'Push the floor away. Legs fully locked, hips open.',
  }),
  lc_scap: E({
    id: 'lc_scap', name: 'Scapular Push-up + Hold', variation: 'Bodyweight',
    visualId: 'scap', category: 'core', type: 'reps_hold',
    sets: 3, targetReps: [10, 10], holdSec: 3, restSec: 90, rpe: '6–7',
    equipment: ['Floor'], muscles: ['Serratus', 'Shoulders', 'Triceps'],
    difficulty: 'Beginner', progression: 'Add reps / longer hold',
    notes: 'Protract fully at top, then hold. No elbow bend.',
  }),
  lc_bulgarian: E({
    id: 'lc_bulgarian', name: 'Bulgarian Split Squat', variation: 'Bodyweight',
    visualId: 'splitsquat', category: 'legs', type: 'reps',
    sets: 3, targetReps: [6, 8], perSide: true, restSec: 120, rir: '2',
    equipment: ['Bench', 'Chair'], muscles: ['Quads', 'Glutes', 'Hamstrings'],
    difficulty: 'Intermediate', progression: 'Add weight / deficit',
    notes: 'Front shin vertical. Drive through the front heel.',
  }),
  lc_pistol: E({
    id: 'lc_pistol', name: 'Pistol Squat', variation: 'Bodyweight',
    visualId: 'pistol', category: 'legs', type: 'reps',
    sets: 3, targetReps: [5, 8], perSide: true, restSec: 120, rir: '2',
    equipment: ['Floor'], muscles: ['Quads', 'Glutes', 'Hamstrings', 'Core'],
    difficulty: 'Advanced', progression: 'Add weight / heel lift removed',
    notes: 'Control the descent. Extended leg locked and aligned.',
  }),
  lc_hollow: E({
    id: 'lc_hollow', name: 'Hollow Body Hold', variation: 'Bodyweight',
    visualId: 'hollow', category: 'core', type: 'hold',
    sets: 3, targetSec: [20, 40], restSec: 90, rpe: '7',
    equipment: ['Floor'], muscles: ['Core', 'Hip flexors'],
    difficulty: 'Intermediate', progression: 'Longer hold / stricter form',
    notes: 'Lower back pressed into the floor. Arms and legs off the ground.',
  }),

  // ── Push B ──
  pb_handstand: E({
    id: 'pb_handstand', name: 'Freestanding Handstand', variation: 'Skill practice',
    visualId: 'handstand', category: 'skill', type: 'skill',
    durationMin: '10', sets: 1,
    equipment: ['Floor'], muscles: ['Shoulders', 'Core'],
    difficulty: 'Advanced', progression: 'Maintain current level',
    notes: 'Short focused balance session before planche work.',
  }),
  pb_planche: E({
    id: 'pb_planche', name: 'Planche Progression', variation: 'Focus',
    visualId: 'planche', category: 'push', type: 'hold',
    sets: 5, targetSec: [6, 10], restSec: 180, rpe: '8–9',
    progressionLevels: ['Tuck', 'Advanced Tuck', 'Straddle', 'Full'],
    equipment: ['Parallettes', 'Floor'], muscles: ['Shoulders', 'Triceps', 'Core', 'Biceps'],
    difficulty: 'Advanced', progression: 'Tuck → Adv Tuck → Straddle → Full',
    notes: 'Primary planche focus of the week. Hips high, lean controlled.',
  }),
  pb_pppu: E({
    id: 'pb_pppu', name: 'Pseudo Planche Push-ups', variation: 'PPP',
    visualId: 'pppu', category: 'push', type: 'reps',
    sets: 3, targetReps: [6, 10], restSec: 150, rir: '2',
    equipment: ['Floor'], muscles: ['Shoulders', 'Triceps', 'Core'],
    difficulty: 'Intermediate', progression: 'Increase lean angle',
    notes: 'Hands near hips, lean forward over the planche position.',
  }),
  pb_ringpu: E({
    id: 'pb_ringpu', name: 'Ring Push-ups', variation: 'Feet Elevated',
    visualId: 'ringpushup', category: 'push', type: 'reps',
    sets: 3, targetReps: [10, 12], restSec: 90, rir: '3',
    equipment: ['Rings'], muscles: ['Chest', 'Shoulders', 'Triceps', 'Core'],
    difficulty: 'Intermediate', progression: 'Deeper ROM / RTO',
    notes: 'Turn rings out at the top. Descend below the rings.',
  }),
  pb_prehab: E({
    id: 'pb_prehab', name: 'Wrist / Elbow Prehab', variation: 'Mobility',
    visualId: 'prehab', category: 'prehab', type: 'prehab',
    durationMin: '5–8', sets: 1,
    equipment: ['Light bands'], muscles: ['Wrist extensors', 'Forearms', 'Elbow'],
    difficulty: 'Beginner', progression: 'Consistency',
    notes: 'Wrist curls, extensions, circles, light ring holds. Keep joints healthy.',
  }),

  // ── Pull B ──
  pb_fl_hold: E({
    id: 'pb_fl_hold', name: 'Front Lever Hold', variation: 'One progression easier',
    visualId: 'frontlever', category: 'pull', type: 'hold',
    sets: 4, targetSec: [5, 8], restSec: 180, rpe: '7–8',
    progressionLevels: ['Tuck', 'Advanced Tuck', 'Straddle', 'Half-Lay', 'Full'],
    equipment: ['Pull-up bar', 'Rings'], muscles: ['Lats', 'Core', 'Rhomboids'],
    difficulty: 'Advanced', progression: 'Match Pull A progression eventually',
    notes: 'Easier variation than Pull A. Focus on clean, controlled hold.',
    alternatives: ['alt_tuck_fl'],
  }),
  pb_weightedpull: E({
    id: 'pb_weightedpull', name: 'Weighted Pull-ups', variation: 'Added weight',
    visualId: 'pullup', category: 'pull', type: 'weighted',
    sets: 4, targetReps: [4, 6], restSec: 180, rir: '1–2',
    equipment: ['Pull-up bar', 'Weight belt / Backpack'], muscles: ['Lats', 'Biceps', 'Forearms'],
    difficulty: 'Advanced', progression: 'Add 1.25–2.5 kg when top reps hit with RIR 1',
    notes: 'Full hang start. Pull chest to bar. Log weight used.',
  }),
  pb_ringrow: E({
    id: 'pb_ringrow', name: 'Ring Row', variation: 'Rear Delt Angle',
    visualId: 'ringrow', category: 'pull', type: 'reps',
    sets: 3, targetReps: [10, 12], restSec: 90, rir: '2–3',
    equipment: ['Rings'], muscles: ['Rear delts', 'Rhomboids', 'Lats'],
    difficulty: 'Intermediate', progression: 'More horizontal / add weight',
    notes: 'High elbow angle to bias rear delts. Body stays straight.',
  }),
  pb_curl: E({
    id: 'pb_curl', name: 'Bicep Curls', variation: 'Ring / Dumbbell',
    visualId: 'curl', category: 'pull', type: 'reps',
    sets: 3, targetReps: [10, 12], restSec: 90, rir: '2–3',
    equipment: ['Rings', 'Dumbbells'], muscles: ['Biceps', 'Brachialis'],
    difficulty: 'Beginner', progression: 'Add weight / slower tempo',
    notes: 'Strict, no swing. Full stretch at the bottom.',
  }),
  pb_facepull: E({
    id: 'pb_facepull', name: 'Band Pull-aparts / Face Pulls', variation: 'Band',
    visualId: 'facepull', category: 'pull', type: 'reps',
    sets: 3, targetReps: [15, 15], restSec: 60, rir: '3',
    equipment: ['Resistance band', 'Cable (optional)'], muscles: ['Rear delts', 'Rotator cuff', 'Rhomboids'],
    difficulty: 'Beginner', progression: 'Heavier band / pause',
    notes: 'Pull to the face, elbows lead. Posture and shoulder health.',
  }),

  // ── Alternatives ──
  alt_explosive_pullup: E({
    id: 'alt_explosive_pullup', name: 'Explosive Pull-up', variation: 'Bar',
    visualId: 'pullup', category: 'pull', type: 'reps',
    sets: 4, targetReps: [3, 5], restSec: 180, rpe: '8',
    equipment: ['Pull-up bar'], muscles: ['Lats', 'Biceps', 'Shoulders'],
    difficulty: 'Advanced', progression: 'Add weight / chest-to-bar height',
    notes: 'Pull explosively to chest height. Alternative to the muscle-up transition.',
  }),
  alt_pike_pushup: E({
    id: 'alt_pike_pushup', name: 'Pike Push-up', variation: 'Elevated feet',
    visualId: 'hspu', category: 'push', type: 'reps',
    sets: 4, targetReps: [6, 10], restSec: 120, rir: '2',
    equipment: ['Floor'], muscles: ['Shoulders', 'Triceps', 'Upper chest'],
    difficulty: 'Intermediate', progression: 'Elevate feet → deficit',
    notes: 'Hips high, head toward the floor. HSPU alternative.',
  }),
  alt_tuck_fl: E({
    id: 'alt_tuck_fl', name: 'Tuck Front Lever Hold', variation: 'Tuck',
    visualId: 'frontlever', category: 'pull', type: 'hold',
    sets: 4, targetSec: [8, 12], restSec: 150, rpe: '7',
    progressionLevels: ['Tuck', 'Advanced Tuck', 'Straddle', 'Half-Lay', 'Full'],
    equipment: ['Pull-up bar', 'Rings'], muscles: ['Lats', 'Core', 'Rhomboids'],
    difficulty: 'Intermediate', progression: 'Tuck → Adv Tuck → Straddle',
    notes: 'Knees tucked, back flat. Easier front lever progression.',
  }),

  // ════════════════════════════════════════════════════════════════════════════
  // ── HYPERTROPHY PROGRAM ──────────────────────────────────────────────────────
  // Calisthenics-first Upper/Lower split. Rings, bar, parallettes and backpack
  // loading prioritized. Dumbbells only for legs/calves and bicep curls.
  // ════════════════════════════════════════════════════════════════════════════

  // ── Upper A ──
  h_weighted_pushup: E({
    id: 'h_weighted_pushup', name: 'Weighted Push-ups', variation: 'Backpack loaded',
    visualId: 'pushup', category: 'push', type: 'weighted',
    sets: 3, targetReps: [8, 12], restSec: 120, rir: '2',
    equipment: ['Backpack', 'Floor'], muscles: ['Chest', 'Shoulders', 'Triceps'],
    difficulty: 'Intermediate', progression: 'Add load / slow tempo / deficit',
    notes: 'Pack weight high on the upper back. Controlled tempo, full ROM.',
  }),
  h_weighted_pullup: E({
    id: 'h_weighted_pullup', name: 'Weighted Pull-ups', variation: 'Added weight',
    visualId: 'pullup', category: 'pull', type: 'weighted',
    sets: 4, targetReps: [5, 8], restSec: 180, rir: '1–2',
    equipment: ['Pull-up bar', 'Weight belt / Backpack'], muscles: ['Lats', 'Biceps', 'Forearms'],
    difficulty: 'Advanced', progression: 'Add 1.25–2.5 kg when top reps hit with RIR 1',
    notes: 'Full hang, chest to bar. Log weight used.',
  }),
  h_hspu: E({
    id: 'h_hspu', name: 'HSPU Progression', variation: 'Pike → Wall → Deficit',
    visualId: 'hspu', category: 'push', type: 'reps',
    sets: 3, targetReps: [6, 10], restSec: 150, rir: '2',
    equipment: ['Wall', 'Parallettes'], muscles: ['Shoulders', 'Triceps', 'Upper chest'],
    difficulty: 'Advanced', progression: 'Pike → Wall → Deficit → Freestanding',
    notes: 'Skill work kept moderate. Choose the variation that lands in the rep range.',
  }),
  h_ring_row: E({
    id: 'h_ring_row', name: 'Ring Rows', variation: 'Body straight',
    visualId: 'ringrow', category: 'pull', type: 'reps',
    sets: 3, targetReps: [8, 12], restSec: 90, rir: '2',
    equipment: ['Rings'], muscles: ['Lats', 'Rhomboids', 'Biceps', 'Rear delts'],
    difficulty: 'Intermediate', progression: 'More horizontal / add weight',
    notes: 'Body straight, full scapular retraction. Pause at the top.',
  }),
  h_db_curl: E({
    id: 'h_db_curl', name: 'Dumbbell Curls', variation: 'Optional isolation',
    visualId: 'curl', category: 'pull', type: 'weighted',
    sets: 3, targetReps: [10, 12], restSec: 75, rir: '2',
    equipment: ['Dumbbells'], muscles: ['Biceps', 'Brachialis'],
    difficulty: 'Beginner', progression: 'Add weight / slower tempo',
    notes: 'Optional. Strict, no swing. Only upper-body dumbbell lift in the program.',
  }),

  // ── Lower A ──
  h_weighted_bulgarian: E({
    id: 'h_weighted_bulgarian', name: 'Weighted Bulgarian Split Squat', variation: 'Backpack / DB',
    visualId: 'splitsquat', category: 'legs', type: 'weighted',
    sets: 3, targetReps: [8, 10], perSide: true, restSec: 120, rir: '2',
    equipment: ['Bench', 'Backpack', 'Dumbbells'], muscles: ['Quads', 'Glutes', 'Hamstrings'],
    difficulty: 'Intermediate', progression: 'Add load / deficit',
    notes: 'Front shin vertical. Drive through the front heel.',
  }),
  h_backpack_squat: E({
    id: 'h_backpack_squat', name: 'Backpack Squats', variation: 'Loaded',
    visualId: 'squat', category: 'legs', type: 'weighted',
    sets: 3, targetReps: [8, 12], restSec: 120, rir: '2',
    equipment: ['Backpack'], muscles: ['Quads', 'Glutes', 'Hamstrings', 'Core'],
    difficulty: 'Intermediate', progression: 'Add load / pause at bottom',
    notes: 'Pack high on the upper back. Descend to full depth, control the descent.',
  }),
  h_single_calf: E({
    id: 'h_single_calf', name: 'Single-leg Calf Raises', variation: 'Bodyweight',
    visualId: 'calf', category: 'legs', type: 'reps',
    sets: 3, targetReps: [10, 15], perSide: true, restSec: 60, rir: '2',
    equipment: ['Step', 'Floor'], muscles: ['Calves', 'Achilles'],
    difficulty: 'Beginner', progression: 'Add load / full stretch pause',
    notes: 'Full stretch at the bottom, strong concentric. Pause at the top.',
  }),
  h_hanging_knee: E({
    id: 'h_hanging_knee', name: 'Hanging Knee Raises', variation: 'Bar',
    visualId: 'legraise', category: 'core', type: 'reps',
    sets: 3, targetReps: [12, 15], restSec: 75, rir: '2',
    equipment: ['Pull-up bar'], muscles: ['Core', 'Hip flexors'],
    difficulty: 'Beginner', progression: 'Straighten legs → toes-to-bar',
    notes: 'Control the swing. Curl pelvis up, no kipping.',
  }),

  // ── Upper B ──
  h_ring_dip: E({
    id: 'h_ring_dip', name: 'Ring Dips', variation: 'RTO',
    visualId: 'dip', category: 'push', type: 'reps',
    sets: 3, targetReps: [6, 10], restSec: 120, rir: '2',
    equipment: ['Rings'], muscles: ['Triceps', 'Chest', 'Shoulders'],
    difficulty: 'Advanced', progression: 'Add weight / RTO hold',
    alternatives: ['h_chair_dip'],
    notes: 'Turn rings out at the top. Full dip depth.',
  }),
  h_chair_dip: E({
    id: 'h_chair_dip', name: 'Chair Dips', variation: 'Feet supported',
    visualId: 'dip', category: 'push', type: 'reps',
    sets: 3, targetReps: [8, 15], restSec: 90, rir: '2',
    equipment: ['Stable chair', 'Floor'], muscles: ['Triceps', 'Chest', 'Shoulders'],
    difficulty: 'Beginner', progression: 'Straighter legs / slower tempo',
    notes: 'Keep the chair stable, shoulders controlled, and use a pain-free range of motion.',
  }),
  h_chinup: E({
    id: 'h_chinup', name: 'Chin-ups', variation: 'Shoulder-width, supinated',
    visualId: 'pullup', category: 'pull', type: 'weighted',
    sets: 3, targetReps: [6, 10], restSec: 120, rir: '2',
    equipment: ['Pull-up bar', 'Backpack (optional)'], muscles: ['Lats', 'Biceps', 'Forearms'],
    difficulty: 'Intermediate', progression: 'Add load when top reps hit',
    notes: 'Supinated grip biases biceps. Full hang, chest to bar.',
  }),
  h_feet_elev_row: E({
    id: 'h_feet_elev_row', name: 'Feet-elevated Ring Rows', variation: 'Horizontal',
    visualId: 'ringrow', category: 'pull', type: 'reps',
    sets: 3, targetReps: [8, 12], restSec: 90, rir: '2',
    equipment: ['Rings'], muscles: ['Lats', 'Rear delts', 'Rhomboids', 'Biceps'],
    difficulty: 'Intermediate', progression: 'Add weight / pause',
    notes: 'Body fully horizontal. Pull sternum to the rings.',
  }),
  h_deep_pp_pushup: E({
    id: 'h_deep_pp_pushup', name: 'Deep Parallette Push-ups', variation: 'Full ROM',
    visualId: 'pushup', category: 'push', type: 'reps',
    sets: 3, targetReps: [8, 12], restSec: 90, rir: '2',
    equipment: ['Parallettes'], muscles: ['Chest', 'Shoulders', 'Triceps'],
    difficulty: 'Intermediate', progression: 'Add load / RTO / deficit',
    notes: 'Descend below the hands. Pause at the bottom for tension.',
  }),
  h_support_hold: E({
    id: 'h_support_hold', name: 'Ring Support Hold', variation: 'RTO',
    visualId: 'dip', category: 'push', type: 'hold',
    sets: 3, targetSec: [20, 40], restSec: 90, rpe: '7',
    equipment: ['Rings'], muscles: ['Shoulders', 'Triceps', 'Chest'],
    difficulty: 'Intermediate', progression: 'Longer hold / RTO / support to dip',
    notes: 'Light skill work. Rings turned out, shoulders locked down.',
  }),

  // ── Lower B ──
  h_weighted_stepup: E({
    id: 'h_weighted_stepup', name: 'Weighted Step-ups', variation: 'Backpack / DB',
    visualId: 'splitsquat', category: 'legs', type: 'weighted',
    sets: 3, targetReps: [8, 10], perSide: true, restSec: 120, rir: '2',
    equipment: ['Box / Bench', 'Backpack', 'Dumbbells'], muscles: ['Quads', 'Glutes', 'Hamstrings'],
    difficulty: 'Intermediate', progression: 'Higher step / add load',
    notes: 'Drive through the top foot, lower under control. No pushing off the bottom.',
  }),
  h_db_rdl: E({
    id: 'h_db_rdl', name: 'Dumbbell Romanian Deadlifts', variation: 'DB',
    visualId: 'rdl', category: 'legs', type: 'weighted',
    sets: 3, targetReps: [8, 12], restSec: 120, rir: '2',
    equipment: ['Dumbbells'], muscles: ['Hamstrings', 'Glutes', 'Lower back'],
    difficulty: 'Intermediate', progression: 'Add load / longer eccentric',
    notes: 'Hinge at the hips, soft knees. Feel the hamstring stretch. Flat back.',
  }),
  h_bent_knee_calf: E({
    id: 'h_bent_knee_calf', name: 'Bent-knee Calf Raises', variation: 'Seated / DB',
    visualId: 'calf', category: 'legs', type: 'reps',
    sets: 3, targetReps: [12, 15], restSec: 60, rir: '2',
    equipment: ['Dumbbells', 'Step'], muscles: ['Soleus', 'Calves'],
    difficulty: 'Beginner', progression: 'Add load / pause',
    notes: 'Bent knee biases the soleus. Slow tempo, full range.',
  }),
  h_lsit: E({
    id: 'h_lsit', name: 'L-sit Progression', variation: 'Tuck → L-sit',
    visualId: 'lsit', category: 'core', type: 'hold',
    sets: 3, targetSec: [10, 20], restSec: 90, rpe: '7',
    equipment: ['Parallettes', 'Floor'], muscles: ['Core', 'Hip flexors', 'Triceps'],
    difficulty: 'Advanced', progression: 'Tuck → Adv Tuck → L-sit → V-sit',
    notes: 'Light skill work. Push the floor away, hips open.',
  }),
};

// ── Skill workouts (existing) ───────────────────────────────────────────────
export const WORKOUTS = {
  push_a: {
    id: 'push_a', name: 'Push A', subtitle: 'Handstand · HSPU · Planche · Chest',
    category: 'push',
    exercises: ['pa_handstand', 'pa_planche', 'pa_hspu', 'pa_deficitpu', 'pa_ringdips'],
    priority: { pa_handstand: 1, pa_hspu: 2, pa_planche: 3, pa_ringdips: 4, pa_deficitpu: 5 },
  },
  pull_a: {
    id: 'pull_a', name: 'Pull A', subtitle: 'Front Lever · Muscle-up · Back',
    category: 'pull',
    exercises: ['pa_fl_hold', 'pa_muscleup', 'pa_fl_rows', 'pa_ringrows', 'pa_reardeltfly'],
    priority: { pa_fl_hold: 1, pa_muscleup: 2, pa_fl_rows: 3, pa_ringrows: 4, pa_reardeltfly: 5 },
  },
  legs_core: {
    id: 'legs_core', name: 'Legs + Core', subtitle: 'Strength · Stability · Compression',
    category: 'legs',
    exercises: ['lc_handstand', 'lc_lsit', 'lc_scap', 'lc_bulgarian', 'lc_pistol', 'lc_hollow'],
    priority: { lc_handstand: 1, lc_lsit: 2, lc_pistol: 3, lc_bulgarian: 4, lc_hollow: 5, lc_scap: 6 },
  },
  push_b: {
    id: 'push_b', name: 'Push B', subtitle: 'Planche Focus · Ring Strength',
    category: 'push',
    exercises: ['pb_handstand', 'pb_planche', 'pb_pppu', 'pb_ringpu', 'pb_prehab'],
    priority: { pb_handstand: 1, pb_planche: 2, pb_pppu: 3, pb_ringpu: 4, pb_prehab: 5 },
  },
  pull_b: {
    id: 'pull_b', name: 'Pull B', subtitle: 'Front Lever · Weighted Pulling',
    category: 'pull',
    exercises: ['pb_fl_hold', 'pb_weightedpull', 'pb_ringrow', 'pb_curl', 'pb_facepull'],
    priority: { pb_weightedpull: 1, pb_fl_hold: 2, pb_ringrow: 3, pb_curl: 4, pb_facepull: 5 },
  },
};

// ── Hypertrophy workouts ────────────────────────────────────────────────────
export const HYP_WORKOUTS = {
  upper_a: {
    id: 'upper_a', name: 'Upper A', subtitle: 'Weighted push · Pull · HSPU · Rows',
    category: 'push', program: 'hypertrophy',
    exercises: ['h_weighted_pushup', 'h_weighted_pullup', 'h_hspu', 'h_ring_row', 'h_db_curl'],
    priority: { h_weighted_pushup: 1, h_weighted_pullup: 2, h_hspu: 3, h_ring_row: 4, h_db_curl: 5 },
  },
  lower_a: {
    id: 'lower_a', name: 'Lower A', subtitle: 'Quads · Calves · Core',
    category: 'legs', program: 'hypertrophy',
    exercises: ['h_weighted_bulgarian', 'h_backpack_squat', 'h_single_calf', 'h_hanging_knee'],
    priority: { h_backpack_squat: 1, h_weighted_bulgarian: 2, h_hanging_knee: 3, h_single_calf: 4 },
  },
  upper_b: {
    id: 'upper_b', name: 'Upper B', subtitle: 'Dips · Chin-ups · Rows · Push-ups',
    category: 'push', program: 'hypertrophy',
    exercises: ['h_ring_dip', 'h_chinup', 'h_feet_elev_row', 'h_deep_pp_pushup', 'h_support_hold'],
    priority: { h_ring_dip: 1, h_chinup: 2, h_feet_elev_row: 3, h_deep_pp_pushup: 4, h_support_hold: 5 },
  },
  lower_b: {
    id: 'lower_b', name: 'Lower B', subtitle: 'Step-ups · RDL · Calves · L-sit',
    category: 'legs', program: 'hypertrophy',
    exercises: ['h_weighted_stepup', 'h_db_rdl', 'h_bent_knee_calf', 'h_lsit'],
    priority: { h_db_rdl: 1, h_weighted_stepup: 2, h_lsit: 3, h_bent_knee_calf: 4 },
  },
};

// ── Programs (switchable training phases) ────────────────────────────────────
export const PROGRAMS = {
  skill: {
    id: 'skill',
    name: 'Skill Focus',
    blurb: 'Calisthenics skill & strength — handstand, planche, front lever.',
    schedule: WEEKLY_SCHEDULE,
    weeks: WEEKS,
    workouts: WORKOUTS,
  },
  hypertrophy: {
    id: 'hypertrophy',
    name: 'Hypertrophy',
    blurb: 'Upper/Lower split. Calisthenics-first muscle building.',
    schedule: HYP_SCHEDULE,
    weeks: HYP_WEEKS,
    workouts: HYP_WORKOUTS,
  },
};

export const PROGRAM_LIST = Object.values(PROGRAMS);

export const getActiveProgramId = () => {
  const id = loadSettings().activeProgram;
  return PROGRAMS[id] ? id : 'skill';
};
export const getActiveProgram = () => PROGRAMS[getActiveProgramId()];
export const getSchedule = (programId) => PROGRAMS[programId || getActiveProgramId()].schedule;
export const getWeeks = (programId) => PROGRAMS[programId || getActiveProgramId()].weeks;
export const getProgramWorkouts = (programId) => PROGRAMS[programId || getActiveProgramId()].workouts;

// Combined lookup across all programs so history/detail still resolves old
// workouts after switching programs.
const ALL_WORKOUTS = { ...WORKOUTS, ...HYP_WORKOUTS };

// ── Workout volume modes ────────────────────────────────────────────────────
export const MODES = {
  full:            { key: 'full',            label: 'Full',      desc: 'Complete planned workout', min: 50, max: 70 },
  quick:           { key: 'quick',           label: 'Short',     desc: '~3–4 useful exercises',     min: 20, max: 30 },
  extremely_short: { key: 'extremely_short', label: 'Quick Hit', desc: '1–2 high-value exercises',  min: 8,  max: 15 },
};

export const getWorkout = (id) => ALL_WORKOUTS[id] || null;

// ── Intelligent exercise selection for Short / Quick Hit ─────────────────────
// Scores by training priority, enjoyment, muscle-group balance, previous
// performance (skipped recently?) and available time. Full mode returns all.
const lastSessionWithExercise = (id, sessions) => {
  if (!sessions || !sessions.length) return null;
  for (let i = sessions.length - 1; i >= 0; i--) {
    if (sessions[i].exercises.some((e) => e.exerciseId === id)) return sessions[i];
  }
  return null;
};
const wasSkippedLast = (id, sessions) => {
  const s = lastSessionWithExercise(id, sessions);
  if (!s) return false;
  const entry = s.exercises.find((e) => e.exerciseId === id);
  if (!entry) return false;
  return !entry.sets.some((x) => x.completed && !x.skipped);
};

export const getModeExercises = (workout, mode, context = {}) => {
  if (!workout) return [];
  const all = workout.exercises;
  if (mode === 'full' || !workout.priority) return all;

  const { sessions = [], enjoyment = {} } = context;
  const isQuick = mode === 'quick';
  let target = isQuick ? (all.length >= 6 ? 4 : 3) : 2;

  const scored = all.map((id) => {
    const ex = getExercise(id);
    const prio = workout.priority[id] ?? 99;
    const enjoy = enjoyment[id] ?? 3; // 1–5
    const skipped = wasSkippedLast(id, sessions);
    return { id, ex, prio, enjoy, skipped };
  });

  const picked = [];
  const usedCategories = new Set();
  const usedMuscleGroups = new Set();
  while (picked.length < target && scored.length) {
    scored.forEach((s) => {
      let score = 0;
      // training priority (1 = most important)
      score += (10 - s.prio) * 2.2;
      // personal enjoyment
      score += (s.enjoy - 3) * 1.6;
      // muscle-group balance: penalize repeating the same category / primary muscle
      if (usedCategories.has(s.ex.category)) score -= 3.2;
      if (s.ex.muscles && usedMuscleGroups.has(s.ex.muscles[0])) score -= 1.4;
      // previous performance: skipped last time → small penalty
      if (s.skipped) score -= 2.5;
      // available time: for Quick Hit, prefer shorter / less taxing moves
      if (!isQuick) {
        const rest = s.ex.restSec || 0;
        const sets = s.ex.sets || 3;
        score -= (rest / 180) * 1.2 + (sets / 5) * 0.8;
        // keep skill/hold work present but not dominant in Quick Hit
        if (s.ex.type === 'hold' || s.ex.type === 'skill') score -= 0.6;
      }
      s.score = score;
    });
    scored.sort((a, b) => b.score - a.score);
    const best = scored.shift();
    picked.push(best.id);
    usedCategories.add(best.ex.category);
    if (best.ex.muscles) usedMuscleGroups.add(best.ex.muscles[0]);
  }

  // Quick Hit: occasionally add a 3rd if it's a quick exercise (short hold/skill or ≤2 sets)
  if (!isQuick && scored.length && picked.length === 2) {
    scored.sort((a, b) => b.score - a.score);
    const third = scored[0];
    const quick = third.ex.type === 'hold' || third.ex.type === 'skill' || (third.ex.sets || 3) <= 2;
    if (quick) picked.push(third.id);
  }

  // Order the picked exercises by priority for a sensible workout flow.
  return picked.sort((a, b) => (workout.priority[a] ?? 99) - (workout.priority[b] ?? 99));
};

// ── Warm-up routines ────────────────────────────────────────────────────────
export const WARMUPS = {
  push: [
    { name: 'Wrist prep', detail: '2 min' },
    { name: 'Shoulder circles', detail: '10 each way' },
    { name: 'Band dislocates', detail: '15 reps' },
    { name: 'Scapular push-ups', detail: '10 reps' },
    { name: 'Pike hold', detail: '30s' },
  ],
  pull: [
    { name: 'Wrist prep', detail: '2 min' },
    { name: 'Shoulder circles', detail: '10 each way' },
    { name: 'Scapular pull-ups', detail: '10 reps' },
    { name: 'Band pull-aparts', detail: '15 reps' },
    { name: 'Cat-cow', detail: '5 each' },
  ],
  legs: [
    { name: 'Hip mobility', detail: '2 min' },
    { name: 'Ankle circles', detail: '10 each way' },
    { name: 'Bodyweight squats', detail: '15 reps' },
    { name: 'Lunge stretch', detail: '30s / side' },
    { name: 'Cat-cow', detail: '5 each' },
  ],
  core: [
    { name: 'Cat-cow', detail: '5 each' },
    { name: 'Dead bug', detail: '8 reps / side' },
    { name: 'Hollow body rocks', detail: '15 reps' },
    { name: 'Plank hold', detail: '30s' },
  ],
  skill: [
    { name: 'Wrist prep', detail: '2 min' },
    { name: 'Shoulder circles', detail: '10 each way' },
    { name: 'Band dislocates', detail: '15 reps' },
  ],
  prehab: [
    { name: 'Wrist prep', detail: '2 min' },
    { name: 'Light band pull-aparts', detail: '15 reps' },
  ],
};

// ── Cooldown routines (post-workout, category-specific) ─────────────────────
export const COOLDOWNS = {
  push: [
    { name: 'Shoulder stretch', detail: '30s / side' },
    { name: 'Triceps stretch', detail: '30s / side' },
    { name: 'Doorway chest stretch', detail: '30s / side' },
    { name: 'Wrist flexor stretch', detail: '30s / side' },
    { name: "Child's pose", detail: '45s' },
  ],
  pull: [
    { name: 'Lat stretch (hang)', detail: '30s / side' },
    { name: 'Bicep stretch', detail: '30s / side' },
    { name: 'Hang shake-out', detail: '30s' },
    { name: 'Rear delt stretch', detail: '30s / side' },
    { name: "Child's pose", detail: '45s' },
  ],
  legs: [
    { name: 'Quad stretch', detail: '30s / side' },
    { name: 'Hamstring stretch', detail: '30s / side' },
    { name: 'Hip flexor stretch', detail: '30s / side' },
    { name: 'Calf stretch', detail: '30s / side' },
    { name: 'Pigeon pose', detail: '45s / side' },
  ],
  core: [
    { name: 'Cobra / upward dog', detail: '30s' },
    { name: 'Cat-cow', detail: '5 each' },
    { name: 'Seated spinal twist', detail: '30s / side' },
    { name: "Child's pose", detail: '45s' },
  ],
  skill: [
    { name: 'Band shoulder dislocates', detail: '15 reps' },
    { name: 'Wrist flexor stretch', detail: '30s / side' },
    { name: 'Overhead reach', detail: '30s / side' },
    { name: "Child's pose", detail: '45s' },
  ],
  prehab: [
    { name: 'Wrist extensor stretch', detail: '30s / side' },
    { name: 'Forearm stretch', detail: '30s / side' },
    { name: 'Hand shake-out', detail: '30s' },
  ],
};

// ── Recovery routine (rest days) ─────────────────────────────────────────────
export const RECOVERY = [
  { name: 'Full-body mobility flow', detail: '5 min' },
  { name: 'Hip 90/90 switches', detail: '1 min / side' },
  { name: 'Thoracic rotations', detail: '10 / side' },
  { name: 'Band shoulder dislocates', detail: '15 reps' },
  { name: 'Hamstring & calf stretch', detail: '1 min / side' },
  { name: 'Box breathing (parasympathetic)', detail: '3 min' },
];

export const getExercise = (id) => EXERCISES[id] || ADDITIONAL_EXERCISES[id] || null;

export const getExerciseAlternatives = (id) =>
  getExerciseAlternativeIds(id).map((alternativeId) => getExercise(alternativeId)).filter(Boolean);

// Library: original program movements plus the low-equipment exercise pool.
export const LIBRARY_CATEGORIES = ['push', 'pull', 'legs', 'core', 'skill', 'prehab'];
export const LIBRARY_EXERCISES = [...Object.values(EXERCISES), ...Object.values(ADDITIONAL_EXERCISES)];