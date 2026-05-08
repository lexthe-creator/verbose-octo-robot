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

**State** is split across 8 domain contexts, each with its own versioned localStorage key. There is no server, no external API, no build-time env vars.

**Screen values:** `'ignition'` · `'home'` · `'fitness'` · `'focus'` · `'inbox'` · `'finance'` · `'projects'` · `'settings'`

Nav is hidden for: `ignition`, `focus`, `projects`, `settings`. The bottom nav is fixed, 72px, rendered in `App.jsx`.

**Context map (localStorage key → hook → shape):**
- `aiml_user` → `useUser()` → `{ name }`
- `aiml_settings` → `useSettings()` → `{ gymAccess, theme, plaidConnected, calendarConnected }`
- `aiml_day` → `useDay()` → `{ tasks[], meals, workout, workoutConfirmed, dayLockedAt, energyLevel }`
- `aiml_fitness` → `useFitness()` → `{ programStartDate, programEndDate, todayComplete, workoutLog[], focusSessions }`
- `aiml_inbox` → `useInbox()` → `{ inboxItems[] }`
- `aiml_projects` → `useProjects()` → `{ projects[] }` — selectors: `getFocusProject`, `getProjectStats`
- `aiml_finance` → `useFinance()` → `{ transactions[] }` — selectors: `getTodaySpend`, `getWeeklySpend`, `getWeekTotal`, `getFourWeekAvg`, `getOddTransaction`, `getTodayTransactions`
- `aiml_planning` → `usePlanning()` → `{ reflectionLog[], weeklyPriorities[], groceryList[] }`

**Day context highlights:**
- `dayState.tasks[]` — the "3 things"; each `{ id, text, done, dueTime, scheduledTime, scheduledFor? }`
- `dayState.meals` — keyed object (`breakfast`, `lunch`, `snack`, `dinner`); `lateAfter` mirrors `endTime`
- Tasks with `scheduledFor: 'tomorrow'` carry forward on day reset (others reset to initial tasks)

**Day reset logic** (`loadDayState`): if `dayLockedAt` is from a prior calendar day, day state resets to initial values but `scheduledFor: 'tomorrow'` tasks carry forward. All other context state (projects, finance, planning, fitness, inbox) survives day resets independently.

**Legacy migration:** The old `'sheStitches'` localStorage key is migrated into `projects[0]` on first load via `loadLegacyProjects()` in `ProjectsContext`. The old `'aiml_state'` key is read once for one-time migration into the new domain keys and never written to. Do not write to either legacy key.

## Design system

All tokens are CSS custom properties in `src/styles/tokens.css`. Dark/light themes are applied by setting `data-theme` attribute on `<html>` (done in `App.jsx` effect). **Never use raw hex values in component styles** — always reference tokens. Key tokens: `--color-accent` (terracotta `#C17B56`), `--color-card`, `--color-border`, `--color-muted`, `--color-success`, `--color-danger`. All spacing via `--space-*`, radius via `--radius-card` / `--radius-sm` / `--radius-pill`.

All component styles are inline JS objects co-located at the bottom of each file (no CSS modules, no Tailwind). Pattern: `const styles = { wrap: {...}, ... }` then `<div style={styles.wrap}>`.

Fonts: DM Sans (body) and DM Serif Display (headings/numbers) loaded from Google Fonts in `tokens.css`.

## Fitness utilities (`src/utils/fitness.js`)

`generateWorkout(type, gymAccess, weekNum)` → `{ type, title, subtitle, durationEst, segments[] }`. Phase is computed via `getPhase(programStartDate, programEndDate)` — **never stored in state**. `getWeekNumber(programStartDate)` returns weeks since start (min 1). Day schedule: Sun=rest, Mon=easy\_run, Tue=strength\_a, Wed=stretch, Thu=tempo\_run, Fri=strength\_b, Sat=long\_run.

## Project pace (`src/utils/projectUtils.js`)

`getProjectPace(project)` → `{ status: 'on_track' | 'buffer' | 'behind', projectedFinish, daysOver }`. Used in `Home.jsx` to drive the `SsGoalCard` border/badge colour.

## Known issues (do not fix without a dedicated step)

- **`WeeklyPlanning` `ssThisWeek`** — counts all-time done tasks on the focus project, not tasks completed this calendar week. Flagged in the refactor; fix requires scoping by `lastActivityDate` or a per-task completion timestamp that doesn't exist yet.

- **Pre-existing lint errors (not introduced in step 14b-i):**
  - `WorkoutPlayer.jsx` lines 22, 28, 67, 138, 251 — `Date.now` called inside `useRef`/`useState`, `setState` called synchronously inside effects, `ref.current` accessed during render.
  - `FitnessContext.jsx` — `react-refresh/only-export-components` warnings on `fitnessReducer` and `useFitness` exports.
  - Fix in a dedicated cleanup step before App Store submission.

## SPEC.md

`SPEC.md` is the living specification — update it at the end of every build step. It is the source of truth for intended behaviour. When in doubt, read SPEC before code.
