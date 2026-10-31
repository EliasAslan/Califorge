# APEX UI iteration 01

## Visual direction

The Home and Settings screens use a shared visual language:

- Minimal foundation with restrained surfaces and whitespace.
- Athletic hierarchy through stronger workout titles, compact metric groups, and a prominent session action.
- Technical details through cycle labels, phase indicators, exercise order, and tabular numeric values.
- Accent color is inherited from the user's selected APEX accent and remains theme-aware.

## Home changes

- Replaced the stacked generic-card layout with a clearer sequence: identity/header, current cycle, today's training state, long-term skill priorities, and recent activity.
- The current program and week are more visible.
- Active, completed, rest-day, and scheduled-workout states have distinct presentations.
- Workout preview shows the selected priority movements and an estimate.
- Time controls remain available, but are described as shortening today's planned session rather than changing the overall program.
- Alternative workouts require an explicit user action and do not modify the underlying program schedule.
- Added handstand and HSPU focus cards without inventing mastery percentages or milestones.

## Program behavior

- Home now uses `getPlanLedWorkoutRecommendation`.
- The weekday workout from the selected program remains the default recommendation.
- A missed session is not carried forward as debt and does not reorder later weekdays.
- Planned rest days remain recovery by default, with an explicit optional training action.
- The existing time-budget selector still selects higher-priority movements first for shorter sessions.
- The weekly program and cycle remain the source of truth; a user-selected alternative changes only that individual session.

## Settings changes

- Renamed the navigation label and page heading from Profile to Settings; the existing `/profile` route remains compatible.
- Grouped controls into Athlete, Training Plan, Equipment, Training Preferences, Appearance, Tools, and Data & Backups.
- Removed the duplicate current-week selector from Settings; cycle/week management remains in the Plan area.
- Reworked program selection, equipment chips, preference switches, theme choices, accent choices, and backup actions.
- Preserved full backup fields, including per-program weeks, cycle start dates, and an in-progress session.
- Switching kg/lb now converts the displayed bodyweight value instead of only changing its label.

## Validation

- `npm test` passes: build preflight, training logic, local storage, IndexedDB failure handling, and standalone dependency checks.
- TypeScript's JSX parser successfully parsed all 102 `.js` / `.jsx` files.
- A full Vite production build was not run because dependency installation timed out in this environment. Run `npm run build` after Vercel installs dependencies.
