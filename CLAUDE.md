# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # start Vite dev server (localhost:5173)
npm run build      # production build → dist/
npm run preview    # serve the dist/ build locally
npm run lint       # ESLint across all .js/.jsx files
```

No test suite exists. Verify changes visually via `npm run dev`.

## Dev-only overlay access

EOD Reflection and Weekly Planning are time-triggered overlays — they appear automatically based on clock and localStorage guards. There are no UI buttons to trigger them manually. For dev/testing access, use URL params:

- `?eod=1` — forces EodReflection to open regardless of time or last-logged date
- `?weekly=1` — forces WeeklyPlanning to open regardless of day/time

Both params are read once in `App.jsx` `useState` initialisers and have no other entry point. Do not add trigger buttons to any screen component.

## Deployment

GitHub Pages via `.github/workflows/pages.yml` — triggers on push to `main`. Vite `base` is `/verbose-octo-robot/`. Live URL: `https://lexthe-creator.github.io/verbose-octo-robot/`

## Architecture

**Single-page PWA.** No router — `App.jsx` manages a `screen` string with `useState`. Screens are rendered conditionally. Two full-screen overlays (`EodReflection`, `WeeklyPlanning`) layer above the screen stack; `WorkoutPlayer` layers above those.

**State** lives entirely in `src/context/AppContext.jsx` via `useReducer`. All components call `useApp()` to access `{ state, dispatch, updateTaskTime, updateMealWindow, ssDoneCount, ssTotalCount, ssListingsCount, ssNextTask, ssDayOf90 }`. State is persisted to `localStorage` under key `aiml_state` and rehydrated on load with a day-reset check (`dayLockedAt`). There is no server, no external API, no build-time env vars.

**Screen values:** `'ignition'` · `'home'` · `'fitness'` · `'focus'` · `'inbox'` · `'finance'` · `'shestitches'` · `'settings'`

Nav is hidden for: `ignition`, `focus`, `shestitches`, `settings`. The bottom nav is fixed, 72px, rendered in `App.jsx`.

**State shape highlights:**
- `state.tasks[]` — the "3 things"; each `{ id, text, done, dueTime, scheduledTime, scheduledFor? }`
- `state.projects[]` — generic project array; `projects[0]` is always She Stitches. Each project has `{ id, name, emoji, startDate, endDate, bufferDays, tasks[], lastActivityDate, status? }`
- `state.meals` — keyed object (`breakfast`, `lunch`, `snack`, `dinner`); `lateAfter` mirrors `endTime`
- `state.fitness` — `programStartDate/End` are ISO strings (null until set); phase is **derived** via `getPhase()`, never stored
- `state.reflectionLog[]` and `state.weeklyPriorities[]` persist across day resets
- Tasks with `scheduledFor: 'tomorrow'` carry forward on day reset (others reset to `initialState.tasks`)

**Day reset logic** (`loadState` + `RESET_DAY`): if `dayLockedAt` is from a prior calendar day, state resets to `initialState` but preserves `profile`, `settings`, `fitness` (minus `todayComplete`), `inboxItems`, `transactions`, `projects`, `reflectionLog`, `weeklyPriorities`, `groceryList`, and any `scheduledFor: 'tomorrow'` tasks.

**Legacy migration:** The old `'sheStitches'` localStorage key is migrated into `projects[0]` on first load via `loadLegacyProjects()`. Do not write to `'sheStitches'` key.

## Design system

All tokens are CSS custom properties in `src/styles/tokens.css`. Dark/light themes are applied by setting `data-theme` attribute on `<html>` (done in `App.jsx` effect). **Never use raw hex values in component styles** — always reference tokens. Key tokens: `--color-accent` (terracotta `#C17B56`), `--color-card`, `--color-border`, `--color-muted`, `--color-success`, `--color-danger`. All spacing via `--space-*`, radius via `--radius-card` / `--radius-sm` / `--radius-pill`.

All component styles are inline JS objects co-located at the bottom of each file (no CSS modules, no Tailwind). Pattern: `const styles = { wrap: {...}, ... }` then `<div style={styles.wrap}>`.

Fonts: DM Sans (body) and DM Serif Display (headings/numbers) loaded from Google Fonts in `tokens.css`.

## Fitness utilities (`src/utils/fitness.js`)

`generateWorkout(type, gymAccess, weekNum)` → `{ type, title, subtitle, durationEst, segments[] }`. Phase is computed via `getPhase(programStartDate, programEndDate)` — **never stored in state**. `getWeekNumber(programStartDate)` returns weeks since start (min 1). Day schedule: Sun=rest, Mon=easy\_run, Tue=strength\_a, Wed=stretch, Thu=tempo\_run, Fri=strength\_b, Sat=long\_run.

## Project pace (`src/utils/projectUtils.js`)

`getProjectPace(project)` → `{ status: 'on_track' | 'buffer' | 'behind', projectedFinish, daysOver }`. Used in `Home.jsx` to drive the `SsGoalCard` border/badge colour.

## SPEC.md

`SPEC.md` is the living specification — update it at the end of every build step. It is the source of truth for intended behaviour. When in doubt, read SPEC before code.
