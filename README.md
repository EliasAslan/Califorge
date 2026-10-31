# APEX — Personal Calisthenics

APEX is a standalone, local-first training app for calisthenics skills, strength work, workout planning, and progress tracking. It does not require Base44, a hosted API, an account, or environment variables.

## Run locally

Requirements: Node.js 22.12+ (22.x) and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Production build

```bash
npm run build
npm run preview
```

The production output is the static `dist/` directory. It can be deployed to Vercel, Netlify, or any static host that supports SPA fallback routing. The app itself does not depend on the hosting provider. Vite resolves the `@/` source alias directly in `vite.config.js`, and Vercel rewrites browser routes to `index.html`.

For Vercel, the included `vercel.json` sends application routes to `index.html` while static assets remain static.

## Data and privacy

- Workout sessions and custom routines are stored in IndexedDB in the current browser profile.
- Preferences and an in-progress workout are stored in localStorage.
- Data stays on this device/browser. There is no account, remote database, automatic cloud sync, or remote analytics.
- Clearing browser/site data can permanently remove local training history. Export a backup regularly from **Settings → Data & backups**.
- Use **Import backup** to restore a JSON backup or move your data to another browser/device. Import replaces the current local training data after confirmation.

### Moving away from an older hosted version

If your previous live app contains workout history in a hosted Base44 database, export those records from that live app before switching. This repository does not contain Base44 credentials or a working hosted-data connection, so it cannot fetch remote records automatically. A compatible APEX JSON backup can be imported from **Settings → Data & backups**.

## Offline use / installation

APEX includes a web app manifest and a small service worker. Once the app has been opened successfully over HTTPS (or localhost), the application shell and built assets can be reused offline. Workout records are kept in IndexedDB.

The first visit still needs a network connection to download the app. Browser storage is not a substitute for backups.

## Training behavior

- Home follows the selected program's weekday schedule as its default. Missing a session does not create catch-up debt or silently reorder the week.
- On a planned recovery day, APEX recommends recovery and shows the next scheduled session. Training anyway is an explicit choice.
- Time-based options shorten the current planned workout by keeping higher-priority movements first. Choosing another workout affects that session only; it does not rewrite the weekly program.

## Architecture

- React + Vite frontend.
- React Router for navigation.
- TanStack Query for client-side data loading and mutations.
- Native IndexedDB persistence via `src/lib/localDatabase.js`.
- localStorage for preferences and active-session recovery via `src/lib/storage.js`.
- No application backend.

## Checks

```bash
npm test
npm run build
```

`npm test` runs the import/configuration preflight, training-logic checks, local-storage checks, IndexedDB failure handling, and standalone-dependency audit. The production build is a separate check.
