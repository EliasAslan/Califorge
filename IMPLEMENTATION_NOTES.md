# APEX implementation notes

## Implemented in this iteration

### Adaptive training home
- Home recommends the next workout in the active program's rotation based on the most recent completed program workout, rather than blindly selecting today's weekday workout.
- Missed weekdays do not create a queue of overdue sessions. The next workout remains the next workout until a different session is actually completed.
- Programmed recovery days remain recovery days by default. The user can choose **Train anyway** to start the next session.
- The user can select another workout from the active program before starting.

### Flexible session duration
- Home supports a custom time budget from 10 to 120 minutes, with 15 / 25 / 40 / 60 minute shortcuts.
- Plan also supports 15 / 25 / 40 / 60 minute choices when starting a session from the schedule.
- Exercise selection prioritizes skill and prehab work, then follows workout priorities and enjoyment where available.
- Skill practice duration is shortened when the selected time budget is smaller than its normal target.
- Short and Quick Hit sessions now reduce working sets by one (minimum two), while skill and prehab practice remain unchanged.
- The chosen time budget is saved with the session and shown in its summary and history.
- Time estimates are heuristic approximations, not a guarantee of workout duration.

### Cycle progression without perfect attendance
- A cycle week advances after at least 60% of its distinct planned workout types have been completed with at least two non-skipped working sets per session, and every major movement pattern in the program has been represented. Short skill practice still appears as activity but does not alone count as program exposure.
  - Skill Focus: 3 of 5 workout types.
  - Hypertrophy: 3 of 4 workout types.
- Repeating the same workout does not count as additional variety. A week also cannot advance while an entire movement pattern (for example, pulling) has been omitted.
- Week 8 completion uses the same rule.
- Cycle start timestamps prevent sessions from a previous cycle being counted toward the same-numbered week or next-workout recommendation in a new cycle.
- Manually resetting the active week to Week 1 starts a new cycle.

### Less punitive progress display and skill emphasis
- The weekly activity widget no longer marks past untrained days in red as missed workouts.
- Handstand practice is prioritized in the existing Skill Focus push and legs/core workouts, and HSPU remains high priority in Push A.

## Deliberately deferred
- Objective handstand / HSPU mastery criteria and milestone thresholds. These should be based on the athlete's chosen standards rather than inventing what counts as mastery.
- Readiness / fatigue scoring. The app does not yet collect enough user-reported recovery information to make that recommendation trustworthy.
- A deeper redesign of the active exercise logging screen and skill-specific performance tracking.

## Verification
- `node scripts/verify-training-logic.mjs` passes. It checks rotation recommendations, recovery-day behavior, time-budget exercise selection, shortened skill practice, short-mode set counts, distinct-workout week progression, and cycle isolation.
- Changed JavaScript / JSX files passed syntax parsing and the Session entity / package JSON parsed successfully.
- A full Vite build was not run: dependency installation could not reach the npm registry in this environment (`EAI_AGAIN`). Run `npm install`, then `npm run build` and `npm run test:logic` in the project environment before deploying.


## Standalone / Base44 removal

- Removed the Base44 Vite plugin and SDK dependencies from `package.json` and `vite.config.js`.
- Removed Base44 auth, registration, OAuth consent, platform route guards, entities, MCP configuration, API placeholders, and platform setup files. The app opens directly without an account.
- Replaced the no-op entity client with `src/lib/localDatabase.js`, which stores sessions and custom routines in IndexedDB, with a localStorage fallback.
- Kept preferences and the active workout in localStorage.
- Added complete JSON export/import, including sessions, custom routines, preferences, cycle metadata, and the active session.
- Added a PWA manifest and service worker for cached app-shell/offline repeat use.
- Removed Base44 image-editor DOM hooks and platform image transforms; the generic image component uses direct URLs with a local fallback.
- Added Vercel SPA rewrites. Vercel is only a static host; the app does not call a Vercel API.
- There is no automatic cross-device sync. Use Profile → Data & backups to move the data file between browsers/devices.
- Existing hosted Base44 records are not automatically copied. Export from the previous live app and import the resulting JSON backup in APEX.

### Standalone verification

- `npm run test:logic` — passed.
- `npm run test:storage` — passed using the localStorage fallback path.
- Full production build was not run here because npm dependency installation timed out. Run `npm install && npm run build` in the deployment environment.

## Deployment hardening after the first standalone Vercel build

- Fixed the missing Vite `@` alias. The TypeScript/jsconfig alias alone does not configure Vite's production bundler; `vite.config.js` now maps `@` to the absolute `src` directory.
- Converted `tailwind.config.js` from CommonJS (`module.exports` / `require`) to ESM to match the repository's `"type": "module"` setting.
- Restricted the build runtime to Node 22.12+ and below Node 23, avoiding Vercel's open-ended-engine upgrade warning for this Vite 8 project.
- Made Vercel's SPA fallback explicit to `/index.html`; added no-cache headers for the app shell, service worker, and manifest, plus immutable caching for hashed `/assets/` files.
- Prevented a failed IndexedDB open from silently switching to a separate localStorage data store. If IndexedDB is present but inaccessible, APEX now surfaces a storage error instead of showing an unrelated/empty history. localStorage fallback remains for browsers without IndexedDB.
- Added visible query errors for local training-data reads.
- Changed backup export to read both data stores directly, so an immediate click while React Query is still loading cannot create an empty backup.
- Added error feedback when saving a custom routine fails, and reapplies the default appearance after clearing local data.
- Added `.gitignore`, a build preflight test for the Vite alias, all local imports, the ESM Tailwind config, Vercel routes, PWA assets, and Node runtime; added an IndexedDB failure-path test.

### Deployment-hardening verification

- `npm test` — passed (build preflight, training logic, local-storage fallback, IndexedDB open-failure behavior, and Base44 independence).
- TypeScript parser syntax pass — 103 source/script files, zero syntax diagnostics.
- Internal source import/export check — passed; all local imports resolve and all imported local named/default exports exist.
- `node --check` — Vite, Tailwind, PostCSS, and test-script configuration files passed.
- Full `npm run build` — not run in this environment. `npm install` could not reach `registry.npmjs.org` (`EAI_AGAIN`), so a real Vite production bundle still needs to be confirmed by the next Vercel deployment.
- No `package-lock.json` was generated because package registry access was unavailable. Create and commit one from a normal `npm install` when convenient to make future transitive dependency resolution reproducible.
- Reworked `jsconfig.json` to cover the complete `src` tree and use non-invasive JS checking, and added `src/vite-env.d.ts`. The previous config omitted the app entry/lib/hooks and had a narrow include list, so its `typecheck` command did not represent the full project.
