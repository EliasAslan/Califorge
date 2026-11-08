# Biomechanically Accurate Exercise Figures & Enhanced Watermark Integration

Redesigning all 26 calisthenics exercise stick figures with biomechanically accurate anatomy and apparatus lines (bars, rings, floor, benches), rendered as an enhanced, clearly visible watermark behind the title during active workouts, with ready support to switch to a hero badge if preferred.

## User Review & Critical Decisions

> [!IMPORTANT]
> Revised per user feedback:

- **Confirmed: Watermark Position with Boosted Legibility**: Keep the exercise visual placed behind the title in `console-hero` as requested, but increase opacity and scale (from the previous barely visible $0.10$ to a legible, crisp $\approx 0.28$–$0.35$ with sharp strokes) so athletes can actually recognize the exercise from standing distance without washing out the text.
- **Prepared Hero Badge Architecture**: Implement clean layout options in the workout console so switching between the background watermark mode and the standalone hero badge mode is seamless and modular.
- **Biomechanical Stick Figures with Apparatus Lines**: Overhaul all 26 exercises in `ExerciseVisual.jsx` to reflect true body mechanics, correct gravity orientations (e.g. handstand hands on floor, legs up; front lever hanging below bar; L-sit at true 90°), and contextual equipment lines (overhead bars, suspension rings, floor lines, elevation blocks).

---

## 1. Overview & Core Concept

- **What It Delivers**: Transforms ambiguous, anatomically incorrect stick figures into instantly recognizable calisthenics illustrations across the entire application, while fixing the active workout console so the illustration is actually visible behind the title during training.
- **Key Problem Solved**:
  1. *Previous Watermark Invisibility*: Opacity of $0.10$ made the graphic virtually imperceptible during sweaty training sessions.
  2. *Anatomical Inaccuracies*: Handstands were rendered right-side up with head at the top; push-ups and planches lacked floor anchors; front levers lacked pull-up bars; ring exercises lacked ring straps.
- **Target Experience**: An athlete glances down at their phone during a set or rest period and immediately grasps the exercise movement and apparatus at a glance.

---

## 2. User Experience & Visual Design

### Active Workout Console Integration
- **Positioning Behind Title**: Position the exercise figure directly within `.console-hero` behind the exercise name and category, scaled to a generous size ($180\text{px}$–$220\text{px}$).
- **Legibility Tuning**:
  - Boost opacity to an athletic, readable $0.28$–$0.35$ with balanced stroke weight.
  - Apply `color: var(--console-chalk)` or category accent (`var(--c-push)`, `--c-pull`, `--c-legs`, etc.).
  - Text in the foreground (`h1.console-title`, `.console-category`) maintains strong contrast with crisp z-indexing (`z-10 relative`).
- **Flexible Switch Ready**: Maintain an inline toggle/class pattern in `WorkoutSession.jsx` allowing quick switching to the hero badge beside the title if visual testing suggests it.

### Biomechanical Accuracy & Apparatus Catalog (26 Exercises)

1. **`handstand`**: Correct inverted orientation. Straight arms pressing into the bottom floor line (y ≈ 165), neutral head, locked core, straight legs extending vertically upward to the top (y ≈ 30).
2. **`planche`**: Straight horizontal body hovering parallel to the floor line, hands on floor or parallettes, shoulders protracted and leaned significantly forward past wrists, straight legs suspended horizontally.
3. **`hspu` (Handstand Push-Up)**: Inverted handstand with elbows bent 90° in athletic pressing angle, head dipping near the ground line, legs vertical.
4. **`pushup`**: Prone plank at 15° incline from toes on floor line to head, hands flat on floor beneath chest, rigid spine.
5. **`ringpushup`**: Prone plank with hands gripping circular gymnastic rings hanging from vertical straps, rings floating slightly above floor line.
6. **`pppu` (Pseudo Planche Push-Up)**: Prone pushup with hands placed back near hips/lower ribs, aggressive forward shoulder lean over hands, toes on floor.
7. **`dip`**: Upright torso supported on twin parallel bars (or ring handles), elbows bent at 90° deep dip position, knees bent behind.
8. **`frontlever`**: Top horizontal pull-up bar line; body hanging completely horizontal face-up with straight arms pulling down into the bar.
9. **`flrow` (Front Lever Row)**: Same horizontal supine body as front lever, but elbows driven backward past the ribs with chest pulling up to the bar.
10. **`muscleup`**: Dynamic transition above the bar: torso popping over the horizontal bar line, elbows transitioned on top, body in powerful hollow position.
11. **`ringrow` (Inverted Ring Row)**: Body at 45° angle with heels on floor line, gripping rings suspended by diagonal straps, chest pulled to ring height.
12. **`pullup`**: Overhead horizontal bar; hands pronated on bar, chin clearing the bar, elbows flared down and back.
13. **`lsit`**: Hands on floor or mini parallettes, vertical torso, straight legs held forward at a crisp 90° angle parallel to the ground.
14. **`pistol` (Pistol Squat)**: Deep single-leg squat on floor line, non-working leg extended straight forward horizontally, arms reaching forward.
15. **`splitsquat` (Bulgarian Split Squat)**: Rear foot elevated on a bench block, front foot forward with knee bent at 90° deep lunge.
16. **`squat`**: Symmetrical deep bilateral squat: hips back below parallel, upright torso, arms forward.
17. **`calf` (Calf Raise)**: Step edge block; balls of feet on step edge, heels pushed high into plantarflexion.
18. **`hollow`**: Banana-curved hollow body on floor: lower back pinned, shoulders and straight legs elevated in tension.
19. **`legraise`**: Hanging from overhead bar, straight legs hoisted up horizontally (L-hang) or upward.
20. **`rdl` (Romanian Deadlift)**: Standing hip hinge with flat back angled forward, soft knee bend, hands holding dumbbells along shins.
21. **`curl`**: Arms flexing at elbows bringing ring handles or dumbbells up toward chest/shoulders.
22. **`facepull`**: High elbows pulling suspension straps/rings directly back toward temples/ears.
23. **`reardeltfly`**: Torso hinged forward, arms extended wide laterally in reverse fly squeeze.
24. **`scap` (Scapular Pulls)**: Hanging from bar with locked elbows, depicting scapular depression/elevation.
25. **`prehab`**: Mobility circles and joint warm-up cues around wrists and shoulders.
26. **`rest`**: Calm seated or standing figure in neutral posture with a breathing/recovery wave.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Watermark Visibility Elevation**
  - *Chosen Approach*: Maintain watermark placement behind title, but increase opacity from $0.10$ to $0.28$–$0.35$ and sharpen stroke rendering from $3.2\text{px}$ to crisp, high-visibility geometry.
  - *Why*: Directly honors user preference to keep the watermark behind the title while solving the issue of not being able to see it during workouts.

- **Decision 2: Prepared Hero Badge Fallback**
  - *Chosen Approach*: Architect `WorkoutSession.jsx` with clean class composition and styling so switching from the watermark position to the hero badge takes zero architectural refactoring.

- **Decision 3: Global Component Consistency**
  - *Chosen Approach*: The updated `ExerciseVisual` will seamlessly enhance all views (WorkoutSession, PersonalRecords, ExerciseDetail, SessionDetail, Build, PhaseComplete, SkillTree, WeekDetail, SkillsWidget) without breaking any existing layout or props.

---

## 4. Technical Architecture & Data Strategy

```
┌──────────────────────────────────────────────────────────────┐
│                    Workout Session Screen                     │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ console-hero (relative, overflow-hidden)               │  │
│  │                                                        │  │
│  │   ┌────────────────────────────────────────────────┐   │  │
│  │   │ console-watermark (high-visibility, opacity ~0.3)│  │
│  │   │ <ExerciseVisual visualId={cur.visualId} />     │   │  │
│  │   └────────────────────────────────────────────────┘   │  │
│  │                                                        │  │
│  │   ┌────────────────────────────────────────────────┐   │  │
│  │   │ Foreground Info (z-10 relative)                 │   │  │
│  │   │ • Category (console-category)                  │   │  │
│  │   │ • Exercise Title (h1.console-title)            │   │  │
│  │   │ • Variation & Set Progress                     │   │  │
│  │   └────────────────────────────────────────────────┘   │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                     ExerciseVisual.jsx                        │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ 26 Biomechanically Correct Keyframe Poses              │  │
│  │ • Reusable Apparatus: <Bar />, <Rings />, <Floor />    │  │
│  │ • Reusable Anatomy: <Head />, <Torso />, <Limb />      │  │
│  │ • Adaptive Semantic Tinting (push/pull/legs/core/etc.) │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Verification & Testing Plan
1. **Visual Accuracy Verification**: Verify each figure renders cleanly with correct gravity orientation, articulated limbs, and apparatus context.
2. **Apparatus Precision Overhaul**: Added 11 specialized apparatus figures (`ringdip` on suspended rings, `chairdip` on bench/chair, `ringsupport` lockout, `deficitpushup` on parallettes, `declinepushup` on box, `feet_elev_row` on rings and box, `stepup` on plyo box, `chinup` supinated grip, `hanging_knee` 90° tuck, `bent_knee_calf` seated with dumbbell, `pikepushup` inverted V).
3. **Settings Integration**: Removed the in-workout toggle button and relocated the display preference to Settings/Profile under "Workout illustration style" (`Hero Badge` vs `Watermark`).
4. **Theme Color Alignment**: Stick figures follow their category theme colors (`push`: warm amber, `pull`: sky blue, `legs`: emerald green, `core`: purple, `skill`: slate, `prehab`: rose) while apparatus stays in clean neutral steel.
5. **Compilation & Linting**: All 7 automated test suites (`npm test`) pass, and `compile_applet` & `lint_applet` execute with zero errors.

