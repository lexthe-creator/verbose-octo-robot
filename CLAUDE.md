# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

───────────────────────────────────────────
ENGINEERING STANDARD
───────────────────────────────────────────
Every decision in this codebase is held to senior
production engineer standards. Before writing or
suggesting any code, apply this checklist:

NAMING
- Does this name communicate intent without comments?
- No abbreviations unless universally understood
- Components: PascalCase nouns (FocusProjectCard)
- Utils: camelCase verbs (formatMealTime)
- Constants: SCREAMING_SNAKE (WORKOUT_LABEL)
- No legacy prefixes (no Ss*, no sheStitches*)

ARCHITECTURE
- Is state living in the right layer?
- Is this duplicated somewhere it shouldn't be?
- Will this pattern hold at 10x current complexity?
- Single source of truth — no derived values stored
- No business logic in components — utils only
- No raw values in components — tokens and constants only

DATA FLOW
- Is every action the minimum change needed?
- Are reducer cases pure with no side effects?
- Is localStorage access isolated to one place?
- Are derived values computed not stored?

ERROR HANDLING
- What happens when this receives null/undefined?
- What happens on first launch with no state?
- What happens after a failed migration?
- Every optional chain needs a documented fallback

EDGE CASES
- Empty state: no data, first launch, cleared storage
- Bad data: corrupted localStorage, missing fields
- Stale data: day change mid-session, week rollover
- Concurrent: multiple tabs, background/foreground switch

REUSABILITY
- If this pattern appears twice, extract it
- Utilities live in utils/, never in components
- Constants live in constants/, never inline
- Types and shapes documented in SPEC.md

CODE REVIEW BAR
Before any commit ask:
1. Would this pass a PR review at a production company?
2. Could a new engineer understand this without asking?
3. Is there a simpler way to do this?
4. What breaks if this receives unexpected input?
5. Does this introduce any tech debt?

If the answer to #1 is no or unsure — flag it before
implementing. Do not proceed without acknowledgment.

This standard applies to every file, every function,
every variable name, every data shape. No exceptions.
───────────────────────────────────────────

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

**Screen values:** `'ignition'` · `'home'` · `'fitness'` · `'focus'` · `'inbox'` · `'finance'` · `'projects'` · `'settings'`

Nav is hidden for: `ignition`, `focus`, `projects`, `settings`. The bottom nav is fixed, 72px, rendered in `App.jsx`.

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
