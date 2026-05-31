# App in My Life — Living Spec

> Updated at the end of every build step. Pull from code, not memory.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Product Roadmap: 3-Phase Evolution](#product-roadmap-3-phase-evolution)
3. [Behavioral Design Principles](#behavioral-design-principles)
4. [Architecture Guardrail](#architecture-guardrail)
5. [Phase 1 Product Behavior Rules](#phase-1-product-behavior-rules)
6. [Home + Timeline Interaction Model](#home--timeline-interaction-model)
7. [Design System](#2-design-system)
8. [App Structure](#3-app-structure)
9. [Context State Shapes](#4-context-state-shapes)
10. [Screens](#5-screens)
11. [Interaction Patterns](#6-interaction-patterns)
12. [Navigation & Routing](#7-navigation--routing)
13. [PWA Configuration](#8-pwa-configuration)
14. [V1 Scope vs Deferred](#9-v1-scope-vs-deferred)
15. [Build Order & Progress](#10-build-order--progress)

---

## 1. Project Overview

**Name:** App in My Life
**Purpose:** Theme-switchable personal PWA for ADHD daily execution — morning planning, task tracking, focus timer, capture inbox, and read-only finance snapshot. The product launches in a light default theme with dark mode available.
**Stack:** Vite + React 19, deployed to GitHub Pages. No external UI libraries — custom components only.
**Target device:** Mobile-first, 393px wide, iPhone 16 Pro safe areas.

---

## Product Roadmap: 3-Phase Evolution

App in My Life is evolving away from a traditional task manager or productivity dashboard and toward a calm lifestyle operating system for structured, intentional living. The product direction should be timeline-first, emotionally aware, supportive, and centered on the rhythm of a real day.

### Phase 1 — Core Life Operating System

**Goal:** Make AIML feel calm, emotionally cohesive, and useful every day.

Finalized priorities:
- Timeline-first Home experience
- Mood + mode system
- Day templates / saved rhythms
- Routine engine refinement
- Lightweight journaling + reflection
- Frictionless quick capture
- Visual identity + theming foundation

Product direction:
- The timeline is the center of the product and should anchor the Home experience.
- Avoid redundant "Next Action" patterns and task-manager framing when the timeline already expresses what matters next.
- Support cards should sit below the primary day flow, reinforcing the day rather than competing with it.
- Language should feel soft and supportive, not corporate, productivity-heavy, or optimization-obsessed.

### Phase 2 — Execution + Adaptive Performance

**Goal:** Turn AIML from a planner into an intelligent execution system.

Finalized priorities:
- Complete HYROX/workout execution architecture
- Nutrition simplification layer
- Recovery + wellness system
- Focus ecosystem
- Weekly reset + planning system
- Calendar refinement
- Life domains system

Product direction:
- Do not build a complex calorie tracker.
- Nutrition should remain lightweight, low-friction, and easy to maintain during normal life.
- Avoid macro obsession, calorie-tracker complexity, and MyFitnessPal-style workflows.
- Favor meal logging, simple food capture, and low-friction tracking.
- Recovery, fitness, mood, and scheduling should begin connecting so the product can understand daily capacity and rhythm.

### Phase 3 — Intelligence + Ecosystem

**Goal:** Make AIML feel adaptive, predictive, and personally useful.

Finalized priorities:
- AI guidance layer
- Adaptive scheduling
- Data intelligence + trends
- Deeper integrations
- Advanced emotional theming

Product direction:
- AI should feel calm, observant, and supportive.
- Avoid aggressive productivity coaching or pressure-based optimization.
- Insights should help the user understand their rhythm, not optimize every minute.

### Do Not Build Yet

- Social features
- Public feeds
- Heavy gamification
- Enterprise collaboration
- Complicated analytics dashboards
- Excessive notifications
- Productivity KPI obsession
- Heavy backend dependency

### Positioning Note

AIML should be positioned as:

> "a lifestyle operating system for structured, intentional living."

Not:
- a task manager
- a habit tracker
- a productivity dashboard

## Behavioral Design Principles

### 1. Adaptive structure over rigid planning

AIML should assume real life is fluid. Blocks may overlap, schedules may shift, routines may change, and users may not complete everything. The app should help the user return to flow instead of treating deviations as failures.

### 2. The user should always feel recoverable

No matter how disrupted the day becomes, AIML should help the user re-enter structure quickly. Use reset, reflow, continue later, and rebuild-the-day patterns instead of failure states.

### 3. Momentum matters more than completion

The app should reward engagement, consistency, returning, and intention. It should avoid overemphasizing perfect completion, streak pressure, or productivity KPIs.

### 4. Language must stay soft and supportive

Avoid harsh language such as:
- failed
- overdue
- missed
- behind
- incomplete
- streak lost

Prefer language such as:
- continue
- move
- reset
- still available
- pick back up
- reflow
- shift this
- today changed

### 5. Timeline is soft guidance, not strict enforcement

The timeline is the primary day-flow layer, but it should support overlapping blocks, hidden unscheduled tasks, customizable density, and future AI-assisted scheduling. It should guide the user through the day without making the schedule feel brittle.

### 6. Routines anchor the day

Routines may behave as checklist sequences, timeline blocks, or guided players. Morning routines, evening routines, work startup routines, workout routines, and recovery routines should all be treated as rhythm anchors rather than generic tasks.

### 7. Workouts can behave like routines

Workouts should follow the same guided-execution philosophy as routines: steps, timers, progress, completion, modification, and recovery options.

### 8. Capture should be instant

Quick capture should always be low-friction. Categorization can happen later. The inbox is mandatory as the holding area. Capture should eventually support typed entry, natural language parsing, voice capture, and immediate or later scheduling.

### 9. Modes shape the experience

Modes may be emotional, functional, energy-based, schedule-based, daily, user-selected, or automatic. Start with a small set of modes and allow the user to expand later.

Initial recommended modes:
- Build
- Recovery
- Focus
- Reset

Modes may influence:
- visible widgets
- timeline density
- support prompts
- accent colors
- workout emphasis
- recovery suggestions
- wording tone

### 10. Support layer should be user-configurable

The user should be able to choose three compact planner actions visible on Home. Examples:
- Journal
- Nutrition
- Plan
- Quick Add
- Hydration
- Routine
- Mood
- Workout

### 11. Home is planner-first, not a widget board

Home should feel like the user's all-in-one life planner. It should show the planner/day flow first, while supporting a compact row of planner actions for quick access to journal, nutrition, and plan workflows. The planner should guide daily execution, while these actions support context and adjustment without competing with the timeline.

### 12. Morning Check-In is the first action

The Morning Check-In should be the first recommended action of the day. It should gather mood, energy, mode, and relevant daily context before the app guides the rest of the day.

## Architecture Guardrail

App in My Life is a planner-first application.

When evaluating UI decisions, use this priority order:
1. Planner experience
2. Daily execution
3. Data visibility
4. Analytics

Avoid introducing dashboard patterns, KPI-heavy layouts, productivity-software conventions, or duplicated information.

If two components communicate the same information, prefer the simpler planner-oriented presentation and remove the duplicate.

SPEC-first development is mandatory:
- Review `SPEC.md` before implementation.
- Treat `SPEC.md` as the source of truth.
- Compare requested behavior against the current spec.
- If the request conflicts with the spec, do not implement it.
- Explain the conflict, propose the required `SPEC.md` updates, and wait for approval.
- If the request represents a durable design, architecture, navigation, workflow, planner philosophy, or interaction decision, update `SPEC.md` before implementing code.
- Never implement behavior that is not reflected in `SPEC.md`.

## Phase 1 Product Behavior Rules

- Home must prioritize daily execution and planner flow.
- The dashboard should include both the planner/timeline and compact planner action controls.
- Morning Check-In should be the first recommended action.
- Timeline density should be customizable.
- Timeline blocks may overlap.
- Unscheduled tasks should show by default but be hideable.
- Routines may be checklist-based, timeline-based, or guided.
- Routines may generate tasks.
- Tasks may be independent or dependent.
- Events are passive schedule items unless converted into actions.
- Workouts should behave like routines.
- Capture should be instant and routed through the inbox if not immediately categorized.
- The app should gently guide, not manage or punish.

## Home Typography Rules

Home should maintain a consistent visual language.

Rules:
- Avoid inconsistent Title Case.
- Use uppercase for structural labels and section headings.
- Use lowercase sentence-style text for timeline items, guidance, actions, and planner content.
- Do not randomly capitalize planner labels.

Correct:
- DAILY FLOW
- CURRENT FOCUS
- QUICK TOOLS
- breakfast window
- pick back up
- today can still reflow
- you are here

Incorrect:
- Morning
- Day Flow
- Evening
- Breakfast Window
- Pick Back Up

User-created content should preserve its original casing.

## Home Planner Philosophy

Home is not a dashboard.

Home is:
- a planner surface
- a daily execution system
- a timeline-first experience
- a life operating system

The primary purpose of Home is helping the user understand:
- where they are
- what is happening now
- what comes next
- how to re-enter flow

Anything that visually competes with Daily Flow should be simplified, reduced, or removed.

## Calendar Planner Philosophy

Calendar is a capacity planning surface, not an event management surface.

Calendar exists to help the user answer:
- Where can this go?

The primary purpose of Calendar is helping the user understand:
- where time and energy are already committed
- what capacity remains
- where the day or week may need soft adjustment
- how planned commitments fit together without overwhelming the planner

When Calendar must choose between showing more information and preserving planner readability, preserve planner readability.

Calendar should avoid event-management density, calendar-admin workflows, KPI-style summaries, and overloaded scheduling controls unless a future spec section explicitly introduces them.

Calendar should prioritize:
- finding free time
- moving commitments
- reviewing routines
- planning the week

Calendar should not prioritize:
- event administration
- dense scheduling
- hourly timelines
- Google Calendar-style event management

Relationship to other planner surfaces:
- Home = the day organized by time.
- Plan = the day organized by commitments.
- Calendar = the week organized by capacity.

Future Calendar and Plan relationship:
- Plan identifies what should move.
- Calendar identifies where it should go.

This relationship is architectural only. Do not define Calendar implementation details, drag-and-drop behavior, data model requirements, or event-management workflows until a future SPEC pass explicitly approves them.

## Daily Flow Rules

Daily Flow is the primary planner surface.

Timeline rendering should prioritize:
1. time
2. flow
3. execution

over:
1. categories
2. widgets
3. dashboard summaries

Morning, Day Flow, and Evening are contextual markers only.

They are not separate planner sections.

### Timeline Phase Visualization

Daily Flow may visually communicate day progression through three subtle phases without adding large section headers, cards, or extra timeline height.

Phase windows:
- Morning: 6:00 AM - 12:00 PM
- Day: 12:00 PM - 5:00 PM
- Evening: 5:00 PM+

Visual behavior:
- Morning may use a slightly warmer rail tint or extremely subtle background tone.
- Day should remain neutral.
- Evening may use a slightly deeper, more grounded rail tint or background tone.
- Phase styling must remain restrained and secondary to timeline content.
- Do not convert phases into large sections, cards, headers, or dashboard blocks.
- Optional small vertical phase labels may be integrated into the left timeline rail if they remain understated and do not increase timeline height.
- Timeline items, meal window behavior, task/event calculations, Home header layout, and bottom navigation must remain unchanged.

## Default Planner Window

Default planner hours:
- 6:00 AM - 10:00 PM

Future user settings may include:
- planner start time
- planner end time
- time interval
  - 60 minute
  - 30 minute
  - 15 minute
- density
  - minimal
  - balanced
  - detailed

The planner should eventually render only the active configured window.

## Timeline Architecture Direction

Daily Flow should evolve toward a continuous hourly planner.

Future support:
- drag/drop scheduling
- overlapping blocks
- calendar overlays
- time-grid rendering
- planner-style rescheduling

Current implementation should not block these future capabilities.

## Behavioral Inputs

Mode, Energy, Mood, and Recovery are behavioral inputs.

They should primarily influence:
- recommendations
- density
- recovery guidance
- adaptive planner behavior
- future AI assistance

They should not permanently occupy prime Home screen space after check-in completion.

## Implementation Discipline

When durable product decisions are made:
- update SPEC.md first
- then implement

Codex should:
- stay within prompt scope
- avoid unrelated changes
- avoid opportunistic refactors
- avoid modifying unrelated modules

Each PR should remain tightly scoped.

## Home + Timeline Interaction Model

This section defines the Phase 1 Home behavior in dependency order. Each layer should support the one before it: the screen hierarchy establishes what matters, the interaction hierarchy defines what the user is guided toward, and the timeline behaviors adapt around the user's real day.

### 1. Screen hierarchy

Home should have three layers.

**Primary layer: Daily Execution Planner**

This is the planner/timeline. It answers: "What is happening today, and what should I move through next?"

Required elements:
- Morning Check-In first, until completed
- Today header with date and planner status
- Timeline/day flow with the active block expressed inline
- Unscheduled tasks, hideable
- Active workout or routine if applicable

**Secondary layer: Planner action row**

This gives quick access to planner-related actions without taking over the screen.

Required elements:
- 3 planner action tabs: Journal, Nutrition, Plan
- Task-level status for journal, nutrition, and plan completion
- Optional contextual support actions may surface on other screens or via overlays
- Focus is not a permanent Home support widget; it is accessed through the separate Focus workflow

**Utility layer: Capture + Recovery**

This is always available.

Required elements:
- Quick Add
- Inbox
- Reflow day / reset rhythm
- Continue later

### 2. Interaction hierarchy

Morning Check-In always comes first if incomplete. After check-in, the app should prioritize the timeline and planner action row. After the timeline, planner actions should help the user log, reflect, or adjust.

The interaction order is:
1. "Check in"
2. "Here's your day flow"
3. "Here are your planner actions"
4. "Capture anything else"

### 3. Morning Check-In flow

Morning Check-In should stay short and take under 60 seconds. It should gather enough context to guide the day without becoming a long planning session.

V1 fields:
- Mood
- Energy
- Mode
- Today's intention
- Optional body/recovery note

Recommended V1 modes:
- Build
- Focus
- Recovery
- Reset

### 4. Timeline rendering logic

The timeline should use soft guidance. It should show the shape of the day without enforcing the day as brittle or failure-prone.

Timeline should show:
- scheduled blocks
- routines
- workouts
- meals
- events
- unscheduled tasks section
- current-time marker

Timeline should allow:
- overlapping blocks
- hidden unscheduled tasks
- compact / balanced / detailed density
- passive events
- active routines/workouts

### 5. Current Focus behavior

Current Focus is a conceptual summary expressed through the timeline itself, not a separate Home hero card. The timeline should show the active or next meaningful block and help the user pick back up without duplicating information.

Priority order:
1. active routine
2. active workout
3. active focus session
4. current scheduled block
5. next scheduled block
6. suggested reset/check-in if the day is off track

Suggested language:
- Right now
- Current focus
- Pick back up
- Continue your flow

Avoid:
- Next Action
- Overdue
- Incomplete

### 6. Collapse behavior

Default state:
- Morning Check-In expanded until complete when needed
- Timeline visible
- Planner action tabs compact
- Unscheduled tasks visible but hideable

Collapsed state should preserve the timeline and task visibility while showing only essential labels and actions.

Expanded state should show:
- details
- task time controls
- contextual planner actions and guidance

### 7. Planner action behavior

Home uses a compact planner action row for fast journaling, nutrition logging, and planning. These are quick actions, not full dashboard widgets.

Recommended default:
- Journal
- Nutrition
- Plan

Alternative for fitness-heavy setup:
- Nutrition
- Workout
- Journal

Planner actions should open the relevant workspace or status flow without creating a second dashboard layer. Focus remains a separate workflow, not a Home planner tab.

### 8. Routine insertion rules

Routines can appear as:
- timeline blocks
- checklist sequences
- guided players
- task generators

Example: a morning routine may appear from 7:00-7:30 and contain steps such as brush teeth, skincare, vitamins, fill water, and feed dog. If the user notes "ran out of moisturizer," the routine can generate an inbox task: "Order moisturizer."

Workouts should follow the same pattern:
- warmup
- main work
- cooldown
- log/complete

### 9. Contextual card logic

Cards should appear only when relevant.

Examples:
- If Morning Check-In is incomplete: show it first.
- If workout today: show workout card.
- If meal window is near: show nutrition prompt.
- If evening: show reflection.
- If low energy mode: show recovery card.
- If inbox has unprocessed items: show light inbox reminder.
- If timeline is empty: show day template prompt.

### 10. Adaptive density behavior

Density options:
- Minimal: current timeline + next 2 blocks + planner actions
- Balanced: current timeline + section markers + compact actions
- Detailed: full timeline + tasks + routines + cards

Mode can influence density:
- Recovery -> Minimal
- Reset -> Balanced
- Focus -> Minimal with focus tools
- Build -> Balanced/Detailed

V1 should default to Balanced. Minimal and Detailed should be available later unless a specific Phase 1 implementation requires them sooner.

---

## 2. Design System

All tokens live in `src/styles/tokens.css` as CSS custom properties. Imported globally via `src/index.css`.

### Colors

Tokens are defined under both `[data-theme="light"]` and `[data-theme="dark"]` in `src/styles/tokens.css`. The app launches in the light theme by default.

| Token | Value | Usage |
|---|---|---|
| `--color-bg` | `#F5F2ED` | App background |
| `--color-card` | `#FFFFFF` | Card surfaces |
| `--color-nav-bg` | `#F0EDE8` | Bottom nav background |
| `--color-chart-bar` | `#E8E4DE` | Inactive chart bars |
| `--color-border` | `#D8D2CA` | All borders |
| `--color-text` | `#1A1A14` | Primary text |
| `--color-muted` | `#706A60` | Secondary / label text |
| `--color-faint` | `#B8B2A8` | Placeholder, track backgrounds |
| `--color-accent` | `#C17B56` | Terracotta — active states, CTAs, nav pip |
| `--color-accent-light` | `#E8A87C` | Accent highlights |
| `--color-accent-bg` | `#FDF0E8` | Accent surface / selected card bg |
| `--color-success` | `#1D9E75` | Completed states |
| `--color-success-bg` | `#E8F6F1` | Completed card surface |
| `--color-danger` | `#E05555` | Alerts and warnings |

### Typography

| Token | Value |
|---|---|
| `--font-body` | `'Poppins', system-ui, sans-serif` |
| `--font-display` | `'Lexend', system-ui, sans-serif` |

- Body: Poppins 400/500/600
- Headings / large numbers: Lexend 400/500/600/700
- Loaded from Google Fonts in `tokens.css`

### Border

| Token | Value |
|---|---|
| `--border` | `0.5px solid var(--color-border)` |

### Border Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-card` | `12px` | Cards, modals, CTAs |
| `--radius-sm` | `10px` | Small components, rows |
| `--radius-pill` | `999px` | Pills, tags, progress tracks |

### Spacing Scale

| Token | Value |
|---|---|
| `--space-1` | `4px` |
| `--space-2` | `8px` |
| `--space-3` | `12px` |
| `--space-4` | `16px` |
| `--space-5` | `20px` |
| `--space-6` | `24px` |
| `--space-8` | `32px` |
| `--space-10` | `40px` |
| `--space-12` | `48px` |

### Layout

| Token | Value |
|---|---|
| `--nav-height` | `60px` |
| `--max-width` | `393px` |

### Safe Areas (iPhone 16 Pro)

```css
--safe-top:    env(safe-area-inset-top,    0px)
--safe-bottom: env(safe-area-inset-bottom, 0px)
--safe-left:   env(safe-area-inset-left,   0px)
--safe-right:  env(safe-area-inset-right,  0px)
```

### Motion

| Token | Value |
|---|---|
| `--ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` |
| `--duration` | `220ms` |

---

## 3. App Structure

```
src/
  main.jsx                — entry, provider tree (see below)
  App.jsx                 — screen switcher + fixed bottom nav
  index.css               — single @import of tokens.css
  styles/
    tokens.css            — all design tokens + reset
  context/
    index.js              — barrel re-exports for all contexts
    UserContext.jsx        — profile identity and wake/sleep defaults
    SettingsContext.jsx    — theme, equipment, connection flags, module preferences
    DayContext.jsx         — tasks, meals, workout, energyLevel, dayLockedAt
    FitnessContext.jsx     — programStartDate/End, workoutLog, todayComplete, focusSessions, program, programConfig
    InboxContext.jsx       — inboxItems, taskPool, calendarItems, notes
    ProjectsContext.jsx    — generic projects array + focus-project selectors
    FinanceContext.jsx     — transactions + read-only finance selectors
    PlanningContext.jsx    — reflectionLog, weeklyPriorities, groceryList
  screens/
    MorningIgnition.jsx   — 3-step ignition flow
    Home.jsx              — main daily screen (clock, training card, timeline, tasks, fuel)
    FocusTimer.jsx        — full-screen overlay timer
    Inbox.jsx             — capture + triage
    Finance.jsx           — read-only finance panel
    Settings.jsx          — profile name, equipment toggle, connection stubs
    Fitness.jsx           — training tab (today card, weekly strip, log)
  components/
    FuelEditSheet.jsx     — bottom-sheet meal time editor
    WorkoutPlayer.jsx     — full-screen workout overlay (segments + post-log)
  utils/
    fitness.js            — generateWorkout, getPhase, week/day helpers
public/
  manifest.json           — PWA manifest
  icons/
    icon-192.png
    icon-512.png
index.html                — PWA meta tags, viewport-fit=cover
vite.config.js            — base set to repo name for GitHub Pages
.github/
  workflows/
    pages.yml             — deploy on push to main
```

**Provider tree** (outermost → innermost):
```
SettingsProvider > UserProvider > FitnessProvider > DayProvider > InboxProvider > ProjectsProvider > FinanceProvider > PlanningProvider > App
```

There is no `AppContext` in the current architecture. State is split across eight domain contexts and exposed through `src/context/index.js`.

**localStorage keys and schema versions:**
| Key | Owner | Schema | Notes |
|---|---|---|
| `aiml_user` | UserContext | `{ version: 1, data }` | Migrates `profile` from legacy `aiml_state` when present. |
| `aiml_settings` | SettingsContext | `{ version: 1, data }` | Migrates `settings` from legacy `aiml_state`; backfills `modules` defaults. |
| `aiml_day` | DayContext | `{ version: 1, data: {...} }` |
| `aiml_fitness` | FitnessContext | `{ version: 2, data }` | v1→v2 adds `program`, `programConfig`, and `sets[]` on log entries. |
| `aiml_inbox` | InboxContext | `{ version: 2, data }` | v1→v2 backfills task priority, calendar confirmed flag, and note pinned flag. |
| `aiml_projects` | ProjectsContext | `{ version: 1, data }` | Migrates projects from `aiml_state`; also migrates legacy `sheStitches` into the generic projects array. |
| `aiml_finance` | FinanceContext | `{ version: 1, data }` | Migrates `transactions` from legacy `aiml_state`. |
| `aiml_planning` | PlanningContext | `{ version: 1, data }` | Migrates reflection, weekly priorities, and grocery list from legacy `aiml_state`. |
| `aiml_state` | Legacy only | Raw JSON, no version wrapper | Read once by domain contexts for migration. Do not write new state here. |
| `sheStitches` | Legacy only | Raw JSON | Migrated once into `aiml_projects`, then removed if migration succeeds. |
| `lastReflectionDate` | App.jsx overlay guard | ISO date string | Prevents repeated EOD overlay on the same date. |
| `lastWeeklyPlanDate` | App.jsx overlay guard | ISO date string | Prevents repeated weekly planning overlay in the same Mon–Sun week. |

Each domain context migrates from `aiml_state` on first launch when its own key is missing. Migration is non-destructive for `aiml_state`.

**Overlay z-index hierarchy:** EodReflection and WeeklyPlanning render at z-index 200. WorkoutPlayer renders at z-index 150 — below both overlays.

---

## 4. Context State Shapes

State is split across eight domain contexts. Each persistent context owns its localStorage key, reducer, migration path, and schema version. Derived values are computed in selectors/utilities, not stored.

---

### 4.1 UserContext (`aiml_user`, schema v1)

```js
{
  name:      'Lex',
  wakeTime:  '06:00',
  sleepTime: '23:00',
}
```

Action: `UPDATE_PROFILE { key, value }`.

### 4.2 SettingsContext (`aiml_settings`, schema v1)

```js
{
  theme:             'dark',
  gymAccess:         'bodyweight', // 'bodyweight' | 'dumbbells' | 'gym'
  plaidConnected:    false,
  calendarConnected: false,
  modules: {
    fitness:    true,
    nutrition:  false,
    goals:      false,
    reflection: false,
    finance:    true,
    focus:      true,
    habits:     false,
    sleep:      false,
  },
}
```

Actions:
- `UPDATE_SETTING { key, value }`
- `UPDATE_MODULE { module, enabled }`

**Current module gating behavior:** `settings.modules` is persisted and migration-safe. `App.jsx` uses the fixed bottom-nav order Calendar, Tasks, Home, Fitness, More so Home remains centered. Inbox and Settings remain globally accessible from the Home top-right utility cluster rather than the bottom nav. Finance and Projects are reachable from More when their modules or existing screens are available. Home keeps Daily Flow and task visibility as core planner behavior.

### 4.3 DayContext (`aiml_day`, schema v1)

```js
{
  dayLockedAt:      null | ISO8601,
  energyLevel:      null | 1 | 2 | 3 | 4,
  workoutConfirmed: false,
  confirmedTasks:   string[],
  confirmedMeals:   string[],
  tasks: [
    {
      id: string,
      text: string,
      done: boolean,
      dueTime: 'HH:MM',
      scheduledTime: null | 'HH:MM',
      priority: number,
      scheduledFor?: 'tomorrow',
    },
  ],
  meals: {
    breakfast: { label, startTime, endTime, lateAfter, eaten },
    lunch:     { label, startTime, endTime, lateAfter, eaten },
    snack:     { label, startTime, endTime, lateAfter, eaten },
    dinner:    { label, startTime, endTime, lateAfter, eaten },
  },
  workout: {
    type: string,
    duration: string,
    pace: string,
    time: 'HH:MM',
    confirmed: boolean,
  },
}
```

Day reset: when `dayLockedAt` is from a prior calendar day, `loadDayState()` resets to initial day values, preserves meal time windows while clearing `eaten`, and carries forward only tasks with `scheduledFor: 'tomorrow'`.

Actions: `SET_ENERGY`, `CONFIRM_TASK`, `CONFIRM_MEAL`, `CONFIRM_WORKOUT`, `LOCK_DAY`, `TOGGLE_TASK`, `ADD_TASK`, `REORDER_TASKS`, `UPDATE_TASK_TIME`, `MARK_MEAL_EATEN`, `UPDATE_MEAL_WINDOW`, `SET_TOMORROW_TASKS`.

Helpers exposed via `useDay()`: `updateTaskTime(taskId, time)`, `updateMealWindow(slot, startTime, endTime)`.

### 4.4 FitnessContext (`aiml_fitness`, schema v2)

```js
{
  programStartDate: null,  // ISO date string (YYYY-MM-DD) | null
  programEndDate:   null,  // ISO date string — goal date | null
  workoutLog: [
    {
      date: ISO8601, type: string, title: string, duration: number,
      feel: number, notes: string, exercises: [],
      sets: [{ exercise: string, reps: number, weight: number, rpe: number, note: string }],
    }
  ],
  todayComplete:  false,   // true only if workoutLog[last].date === today; resets automatically on new day
  focusSessions:  0,       // lifetime counter — never resets
  program: {
    type:       null,      // 'strength' | 'endurance' | 'general' | 'fat_loss'
    configured: false,     // true after setup wizard completes
  },
  programConfig: {
    trainingDays: [],      // ['mon','tue','thu','sat']
    dayTypes:     {},      // { mon: 'upper', tue: 'run_easy', thu: 'lower' }
    goal:         null,    // matches program.type
    audioEnabled: false,
    weeklyDays:   0,       // count of training days
  },
}
```

Migration v1→v2: adds `program`, `programConfig`, and `sets: []` on existing `workoutLog` entries. Non-destructive.

`todayComplete` is self-contained: on load, FitnessContext checks `workoutLog[last].date === getTodayISO()` — no cross-context dependency.

Phase is **derived** — call `getPhase(programStartDate)`. Never stored. 13-week repeating cycle: 4 base + 4 build + 4 peak + 1 deload.
Week number is **derived** — call `getWeekNumber(programStartDate)`. Never stored.

Actions: `LOG_WORKOUT`, `LOG_WORKOUT_SETS`, `CONFIGURE_PROGRAM`, `UPDATE_PROGRAM_CONFIG`, `UPDATE_FITNESS`, `INCREMENT_FOCUS_SESSIONS`.

### 4.5 InboxContext (`aiml_inbox`, schema v2)

```js
{
  inboxItems: [
    { id: string, text: string, createdAt: ISO8601 },  // prepended on capture
  ],
  taskPool: [
    { id: string, text: string, createdAt: ISO8601, assignedDate: null },  // TRIAGE_TO_TASK destination
  ],
  calendarItems: [
    { id: string, text: string, date: null, time: null, createdAt: ISO8601 },  // TRIAGE_TO_CALENDAR destination (V1 stub)
  ],
  notes: [
    { id: string, text: string, createdAt: ISO8601, pinned: boolean },
  ],
}
```

`taskPool`, `calendarItems`, `notes` are triage destinations. Current UI primarily supports inbox capture and row actions; destination-management UI is limited.

Actions: `ADD_INBOX_ITEM`, `REMOVE_INBOX_ITEM`, `TRIAGE_TO_TASK`, `TRIAGE_TO_CALENDAR`, `TRIAGE_TO_NOTE`, `UPDATE_POOL_TASK`, `UPDATE_CALENDAR_ITEM`, `PIN_NOTE`, `DELETE_POOL_TASK`, `DELETE_CALENDAR_ITEM`, `DELETE_NOTE`.

### 4.6 ProjectsContext (`aiml_projects`, schema v1)

```js
{
  projects: [
    {
      id: string,
      name: string,
      emoji: string,
      startDate: 'YYYY-MM-DD',
      endDate: 'YYYY-MM-DD',
      bufferDays: number,
      weeklyGoal: null | number,
      tasks: [
        {
          id: string,
          text: string,
          done: boolean,
          listings: number,
          week: number,
          month: number,
          tag: string,
        },
      ],
      lastActivityDate: null | 'YYYY-MM-DD',
      status: 'focus' | 'active' | 'archived',
    },
  ],
}
```

Selectors: `getFocusProject(projects)` and `getProjectStats(project)`.

The product architecture is generic Projects. Legacy migration can still create a default She Stitches focus project from the old `sheStitches` key or from initial seed data, but She Stitches is migration/seed behavior, not a core state invariant. Code should select the focus project by `status === 'focus'`, not by assuming `projects[0]`.

Actions: `TOGGLE_PROJECT_TASK`, `ADD_PROJECT`, `UPDATE_PROJECT`.

### 4.7 FinanceContext (`aiml_finance`, schema v1)

```js
{
  transactions: [
    {
      id: string,
      merchant: string,
      amount: number, // negative = spend, positive = income
      category: string,
      date: 'YYYY-MM-DD',
    },
  ],
}
```

Selectors: `getTodaySpend`, `getWeeklySpend`, `getWeekTotal`, `getFourWeekAvg`, `getOddTransaction`, `getTodayTransactions`.

Actions: `ADD_TRANSACTION`, `DELETE_TRANSACTION`.

### 4.8 PlanningContext (`aiml_planning`, schema v1)

```js
{
  reflectionLog: [
    { date: 'YYYY-MM-DD', feel: 1 | 2 | 3 | 4 | 5, tomorrowTasks: string[] },
  ],
  weeklyPriorities: string[],
  groceryList: [
    { id: string, text: string, done: boolean },
  ],
}
```

Actions: `ADD_REFLECTION`, `SET_WEEKLY_PRIORITIES`, `ADD_GROCERY_ITEM`, `TOGGLE_GROCERY_ITEM`, `DELETE_GROCERY_ITEM`.

---

### `src/utils/projectUtils.js` — `getProjectPace(project)`

Returns `{ status, projectedFinish, daysOver }`.

| Field | Description |
|---|---|
| `tasksRemaining` | Undone task count |
| `avgDailyRate` | `tasksDone / daysElapsed` (min 1 when no tasks done) |
| `projectedFinish` | `today + tasksRemaining / avgDailyRate` days |
| `status` | `'on_track'` / `'buffer'` / `'behind'` |

**Pace status logic:**
- `projectedFinish ≤ endDate` → `'on_track'`
- `projectedFinish ≤ endDate + bufferDays` → `'buffer'`
- `projectedFinish > endDate + bufferDays` → `'behind'`

**Goal card border + badge colors:**
| Status | Border | Badge bg | Badge text |
|---|---|---|---|
| `on_track` | `var(--color-success)` | `var(--color-success-bg)` | `var(--color-success)` |
| `buffer` | `#8A6A00` | `#8A6A00` | `#F0C040` |
| `behind` | `var(--color-danger)` | `rgba(224,85,85,0.12)` | `var(--color-danger)` |

Project stats are exposed by `getProjectStats(project)`, not by `useApp()`.

---

## 5. Screens

### Screen Names (state values in App.jsx)

`'ignition'` · `'home'` · `'plan'` · `'calendar'` · `'tasks'` · `'fitness'` · `'more'` · `'focus'` · `'inbox'` · `'finance'` · `'projects'` · `'settings'`

**Overlay screens** (rendered as `position: fixed, z-index: 200` above all screens):

- `EodReflection` — shown after 7pm if `lastReflectionDate` (localStorage) ≠ today
- `WeeklyPlanning` — shown Sunday ≥5pm if `lastWeeklyPlanDate` is not within the current Mon–Sun week
- Priority: ignition screen hides both; EodReflection takes priority over WeeklyPlanning (weekly plan shows only after reflection is complete)

---

### 5.1 Morning Ignition (`'ignition'`)

**File:** `src/screens/MorningIgnition.jsx`
**Trigger:** Auto-launches on first open each day. If `dayLockedAt` matches today, skip to `'home'`.
**Nav:** Hidden (full-screen overlay).

#### Step 1 — Energy

- Full dark screen, centered layout
- Subtitle: "Good morning" (small caps, muted)
- Heading: "How are you showing up today?" — DM Serif Display 32px
- 2×2 emoji grid: 😴 Drained / 😐 Flat / 🙂 Good / ⚡ Charged
- Selected state: accent border + accent-bg card
- CTA "See my brief →": terracotta, full-width, disabled (opacity 0.35) until selection made
- On tap → advances to Step 2 (Brief)

#### Step 2 — Brief

- Scrollable dark screen
- Header: day name (small caps, muted) + date (DM Serif Display 28px)
- 2px progress track (faint → success green fill), fills as 8 items confirmed
- Counter label: "X of 8 confirmed" (right-aligned, muted)
- **3 Things section:** 3 `SwipeRow` components, one per task
- **Training section:** 1 `SwipeRow` for the Runna workout card
- **Meals section:** 2×2 grid of `MealSlot` tap buttons
- CTA "Lock in my day": disabled until all 8/8 confirmed
- On lock: dispatches `SET_ENERGY`, `CONFIRM_TASK` ×3, `CONFIRM_MEAL` ×4, `CONFIRM_WORKOUT`, `LOCK_DAY` → advances to Step 3

#### Step 3 — Locked

- Full dark screen, centered
- `✦` glyph in accent color (36px)
- Title: "Day locked in." — DM Serif Display 36px
- Subtitle: "Weekday, Month Day" — muted
- Wrapped row of green pill chips — one per confirmed item (3 tasks + workout + 4 meals = 8)
- CTA "Go to home →" → calls `onComplete()` prop → navigates to `'home'`

#### `SwipeRow` component

- `touch-action: pan-y` so vertical scroll is not blocked
- Tracks `touchStart` X; computes delta on `touchMove`
- Visual: card bg tints success-green proportionally to drag progress, `→` checkmark fades in
- On release: if delta ≥ 80px → `onConfirm()`, else snaps back
- Confirmed state: success-bg, success border, strikethrough label, `✓` glyph

#### `MealSlot` component

- Tap to confirm (no swipe required)
- Confirmed state: success-bg, success border, green label with `✓` prefix

---

### 5.2 Home (`'home'`)

**File:** `src/screens/Home.jsx`
**Props:** `onOpenFocus`, `onNavigate`, `onStartWorkout`

Layout zones top to bottom:

1. **Daily Execution header** — compact planner header, not a dashboard hero. The visual hierarchy is greeting, date, planner status, then Daily Flow. The date should be roughly 20-25% smaller than the previous hero-like date treatment and should feel like a planner page heading, not a dashboard headline. Inbox and Settings sit together in the top-right utility cluster and remain globally accessible from Home.
2. **Greeting and date** — greeting line ("GOOD MORNING/AFTERNOON/EVENING, {name}") from `UserContext`, with date below in planner-style title case, e.g. `Friday May 29`.
3. **Planner status tabs** — compact monochrome horizontal row under the date: `○ Journal`, `○ Nutrition`, `○ Plan`. These visually match the existing Inbox and Settings icon style: low-density, no labels above them, no emojis, no colorful badges, no cards, and 15-20% tighter spacing than the first implementation. Plan is a planner workspace and AI guidance surface. It is not a duplicate Tasks view. Tasks stores work. Plan helps the user decide what to do with that work.
4. **Daily summary grid** — compact two-row aligned grid beneath the tabs. Tasks and Morning share the first row. Events and Evening share the second row. Use a true grid so the left side grows naturally and the right column has a fixed width and right alignment. Example:
   - `Tasks   |||..      Morning ✓`
   - `Events  ||||       Evening ○`
   Progress marks should stay planner-style, slightly stronger than muted helper text, and monochrome. Do not convert marks into progress bars or colored indicators. The summary should render as a compact inline planner block, not full-width. Use `fit-content` or a constrained max-width, center the compact block within the header, and use a small column gap of about 28-40px. Avoid excessive side padding. Morning remains aligned with Tasks and Evening remains aligned with Events.
5. **Home header spacing** — the header should feel like one compact planner block rather than separated widgets. Target spacing: greeting to date 4-8px, date to planner tabs about 12px, planner tabs to summary 8-12px, and summary to Daily Flow 16-20px.
6. **Daily Flow** — primary Home content after the header. It renders the full derived chronological timeline: Morning ignition, scheduled tasks, meal windows, planned or confirmed workout, events when available, and the current "you are here" marker. Preserve the current timeline look unless a small spacing adjustment is required to fit the new header.
7. **Tasks in Daily Flow** — task rows from `DayContext` remain interactive inside the planner flow. Tapping the check circle toggles done. Tapping row text expands/collapses the inline time picker. Done rows are strikethrough + green + reduced opacity.
8. **Nutrition behavior** — nutrition in the header is a compact status affordance only. Meal windows remain timeline guidance blocks and may route to Nutrition logging later. Do not introduce a large new Nutrition system until supported elsewhere in the spec.
9. **Removed/avoided Home patterns** — do not render Current Focus if it duplicates Daily Flow. Do not render a large Next Action hero card. Do not add another dashboard card, redundant CTA, or duplicated Fitness quick tool on Home because Fitness has bottom navigation.

Planner tab status rules:
- Journal: `○` not started, `◐` partially completed, `☑` completed.
- Nutrition: `○` no nutrition logging, `◐` partial nutrition logging, `☑` completed nutrition logging for the day.
- Plan: `○` no daily plan started, `◐` partial planning inputs exist, `☑` daily plan set.

V1 data mapping:
- Journal can use today's reflection/EOD completion state when available; otherwise default to not started.
- Nutrition uses `DayContext.meals[*].eaten`.
- Plan may default to `○` until a dedicated daily plan state exists.
- Events use today's confirmed `InboxContext.calendarItems` count when available. Meal windows are excluded.

---

### 5.2b Plan (`'plan'`)

**File:** light route owned by `App.jsx` or future `src/screens/Plan.jsx`
**Nav:** Not a bottom-nav tab. Opened from the Home planner status bar.

Plan is a daily commitment review surface. It presents the user's tasks, events, projects, and fitness commitments for the current day and allows lightweight review and adjustment before returning to execution.

Plan should be accessible anytime in the day and support quick clarity without requiring a system-wide reorganization.

Plan is not:
- a duplicate Tasks view
- a project manager
- a calendar
- a task manager
- an AI-assisted planning flow

Plan may eventually synthesize Calendar, Tasks, Fitness, Nutrition, Energy, and Morning Check-In into a daily plan, but that synthesis should remain subordinate to the daily execution experience.

V1 fields:
- Today holds — compact typography-based summary of today's tasks, events, project, and fitness commitments using existing data only. Use planner marks, not KPI cards, widgets, charts, or dashboards.
- Tasks — today's task commitments with lightweight completion and schedule adjustment
- Events — today's calendar items with lightweight time adjustment
- Project — focus project and next project action
- Fitness — today's workout commitment and timing
- Review note — single lightweight textarea with placeholder "anything to adjust before execution?"
- Reviewed — saves Plan review state and returns to Home without forcing completion
- Close — returns to Home without saving changes

State shape in `PlanningContext`:

```js
dailyPlans: {
  [YYYY-MM-DD]: {
    notes: string,
    reviewedAt: ISO8601 | null,
    updatedAt: ISO8601,
  }
}
```

Home Plan tab status rules:
- `○` no review state or note exists for today
- `◐` review note exists without a saved review
- `☑` review saved for today

Plan V1 must remain:
- calm
- compact
- planner-like
- recoverable
- low-pressure

Plan V1 visual hierarchy:
1. Today holds summary
2. Tasks
3. Events
4. Project
5. Fitness
6. Review note

The Plan page title should be a deterministic daily affirmation based on the current date. It must stay stable for the whole day, use lowercase sentence-style text, and feel planner-like rather than motivational-app-like. It should be visually quieter than a hero title.

Time adjustment controls in Plan should preserve scheduling functionality while reading as low-weight planner text, for example `planned · 6:30 pm`, `unscheduled`, or `45 min · 6:30 pm`. Avoid prominent editable input boxes in the review surface.

Avoid:
- worksheets
- dashboards
- analytics
- AI output
- productivity coaching
- heavy forms
- task-manager language
- required fields
- completion pressure

Plan is a commitment review workspace, not Tasks, Calendar, Projects, or Fitness. V1 should feel like a lightweight planner page and not a worksheet.

---

### 5.2c Calendar (`'calendar'`)

Calendar V1 is a week-first capacity planning surface.

Calendar V1 is not an event management surface, a dense scheduler, an hourly timeline, or a Google Calendar replacement.

Primary view:
- Week-first.

Secondary view:
- Month navigator.

Calendar landing priority:
1. Find free time.
2. Move commitments.
3. Review routines.
4. Plan the week.

#### Week Section

The Week section is the primary Calendar surface.

Purpose:
- Where do I have room?

Information architecture:
- Monday-Sunday
- capacity indicators
- major commitments
- recurring routines
- workouts
- notable events

Avoid:
- dense event lists
- hourly schedules
- task duplication

#### Month Section

The Month section provides navigation and context.

Purpose:
- What is coming up?

Information architecture:
- lightweight planner month grid
- subtle commitment indicators
- routines
- workouts
- notable events

Month is not the primary planning surface.

#### Capacity Visibility

Calendar should emphasize capacity states such as:
- busy
- available
- light
- full

Calendar should de-emphasize clock-first labels such as:
- 9:00
- 10:00
- 11:00

The user should be able to quickly identify where something can move.

#### Calendar V1 Existing Source Mapping

Calendar V1 should derive its context from existing state only.

Approved sources:
- Events -> `InboxContext.calendarItems`
- Tasks -> `DayContext.tasks` with `dueTime` or `scheduledTime` only
- Fitness -> `DayContext.workout` plus the planned workout from `FitnessContext`
- Projects -> `ProjectsContext` focus or active project, lightweight only
- Routines -> deferred unless already represented in existing state

This mapping is a source boundary, not a new data model requirement.

#### Calendar V1 Boundaries

This section defines Calendar V1 philosophy and information architecture only.

Do not create Calendar UI requirements.
Do not create Calendar data model requirements.
Do not define drag-and-drop behavior.
Do not implement Calendar behavior from this section until a future SPEC pass approves implementation details.

---

### 5.3 Focus Timer (`'focus'`)

**File:** `src/screens/FocusTimer.jsx`
**Props:** `onClose`
**Nav:** Hidden (full-screen overlay).

- Back arrow top-left → `onClose()`
- Session counter top-right: "Session X of 4" — X driven by local `completedSessions` state (resets when overlay closes). `fitnessState.focusSessions` is the cumulative lifetime count; `INCREMENT_FOCUS_SESSIONS` dispatched on each completion.
- Preset pills: 15m / 25m / 45m / 60m — default 25m. Disabled (opacity 0.4, pointer-events none) while status is not `'ready'`.
- SVG ring: 200px container, 88px radius, `stroke-linecap: round`
  - Track circle: `#252520`, strokeWidth 8
  - Progress arc: rotated −90° (starts at 12 o'clock), `strokeDasharray = 2π×88`, `strokeDashoffset = circumference × (1 − progress)`
  - Stroke color: `#C17B56` (>40% remaining) → `#E8A87C` (20–40%) → `#E05555` (<20%)
  - `transition: stroke-dashoffset 1s linear, stroke 0.4s ease`
- Ring center: MM:SS countdown (DM Serif Display 38px), status label below (ready / focusing / paused / done ✓)
- Task label: centered `<input type="text">`, placeholder "What are you focusing on?", borderBottom only
- Controls row: ↺ reset · ▶/⏸ play/pause (64px terracotta circle) · ⇥ skip. Skip disabled when `ready` or `done`.
- Session dots: 4 dots, filled terracotta for each `completedSessions` index
- On completion: ring turns `#1D9E75`, status shows `done ✓`, dot fills, 2s pause then auto-resets for next session
- Timer intervals managed with `useRef` — cleared in tick effect cleanup and on unmount

**Deviation from old build instructions:** instructions referenced `focusSessionsCompleted`, which does not exist. Correct field is `fitnessState.focusSessions` (§4). Per-overlay session counting uses local state.

---

### 5.4 Inbox (`'inbox'`)

**File:** `src/screens/Inbox.jsx`

- Header: "Inbox" (DM Serif Display 32px) + item count badge (bg `#2A1508`, text `#C17B56`) + subtitle "Capture anything. Sort later."
- Capture bar: text input in card + `↑` send button (terracotta circle 36px). Enter key submits. `ADD_INBOX_ITEM` dispatched; input clears; count increments.
- Item rows: terracotta dot · text · relative timestamp (right). Below text: 3 action pill buttons (bg `#252520`, border `#2A2A22`) → Task / Calendar / Delete
  - Exit animation: `opacity 0 + translateX(-40px)` over 200ms, then `REMOVE_INBOX_ITEM` dispatched
  - Double-tap guard: `exitingId` blocks new actions while one is animating
  - Delete: danger color text, same slide-out
  - Calendar: V1 stub — removes item, no calendar integration (deferred §9)
- Timestamp format: "just now" / "Xm ago" / "Xh ago" / "Mon DD"
- Empty state: centered `◎` icon (faint) + "Clear mind. Add something above."

**Task triage:** "Task" button dispatches `ADD_TASK { text }` (appends to tasks list), shows a 600ms green flash card ("Added to tasks ✓"), then slides item out. Calendar: V1 stub — removes item, no calendar integration (deferred §9).

---

### 5.5 Projects (`'projects'`)

**File:** `src/screens/Projects.jsx` ✅ Done
**Trigger:** Tap the goal card on Home.
**Nav:** Shown by the current route map when `screen === 'projects'`; the screen also includes a back arrow.
**Props:** `onBack()` → navigates to `'home'`.

**Layout:** Header (← Home, title, subtitle) → Progress card (stats row + gradient bar) → 3 collapsible month cards → Weekly Rhythm 2×2 grid → The One Rule card.

**State source:** `useProjects()` + `getFocusProject()` + `getProjectStats()`. Persisted to `aiml_projects` through `ProjectsContext` — independent of daily reset.

---

### 5.6 Finance (`'finance'`)

**File:** `src/screens/Finance.jsx` ✅ Done

- **Header:** "Finance" (DM Serif Display 32px) + dynamic Plaid badge + `+ Add` button (terracotta pill)
  - `plaidConnected: false` → red badge `#2A1010/#E05555/#5A2020` "● Not connected"
  - `plaidConnected: true` → green badge `#0C2A1E/#1D9E75/#1A4028` "● Plaid connected" + "synced automatically" subtitle
- **Hero card:** "Spent today" · DM Serif Display 38px · 7-bar weekly chart. Comparison line shows diff vs 4-week same-day average (hides when no prior data).
- **Stat grid:** "This week" (accent) + "Anything odd?" (green = clear, accent = any tx > $200)
- **Today's transactions:** list computed from `state.transactions` filtered to today, newest-first. Empty state shown when none. Swipe left on row → red delete zone 72px wide → tap → 200ms slide-out → `DELETE_TRANSACTION`.
- **`+ Add` → `TransactionSheet` bottom sheet:** merchant text · amount number + Spend/Income toggle · category pills (Food/Transport/Shopping/Health/Bills/Other) · date input. Save dispatches `ADD_TRANSACTION`.
- All data driven from `state.transactions`. `// TODO V2: Twilio SMS pipeline` at top of file.

---

### 5.7 Settings (`'settings'`)

**File:** `src/screens/Settings.jsx`
**Props:** `onBack()` → navigates to `'home'`
**Nav:** Hidden (back arrow header only).

- **Profile card** — text input for `profile.name`; onBlur dispatches `UPDATE_PROFILE { name }`.
- **Training card** — 3-pill equipment toggle (Bodyweight / Dumbbells / Full gym); dispatches `UPDATE_SETTING { key: 'gymAccess', value }`. Controls which exercise list `generateWorkout` selects.
- **Program card** — start date input → `UPDATE_FITNESS { key: 'programStartDate', value }` · race date input → `UPDATE_FITNESS { key: 'programEndDate', value }`. Both ISO date strings or null.
- **Connections card** — Plaid (bank & spending) and Google Calendar rows. Stub `StubSheet` bottom-sheet explains V2 timeline.
- **About card** — shows app version, current training phase label (`PHASE_LABELS[getPhase(programStartDate, programEndDate)]`), and week number (`getWeekNumber(programStartDate)`).

---

### 5.8 Fitness (`'fitness'`)

**File:** `src/screens/Fitness.jsx`
**Props:** `onStartWorkout(workout)` — App.jsx manages global WorkoutPlayer overlay.
**Nav:** Shown (Fitness tab in bottom nav).

- **Header** — phase label (terracotta, small caps) + "Training" title + "Week N" badge. When `programEndDate` is set: accent "X weeks to race" line below (or "Race week!" when 0).
- **Today card** — generated via `generateWorkout(getTodayType(), gymAccess, weekNum)` where `weekNum = getWeekNumber(programStartDate)`. Card header is tappable: toggles full workout preview with 300ms max-height animation. Preview shows WARM UP / MAIN / COOL DOWN sections; each row: name left + `3×10` or `2:00` right in accent. Footer: `~Xmin` + "Start Workout" button. Collapsed state shows original Start/Completed button.
- **Weekly strip** — 7-column grid (Mon–Sun). Each cell shows day initial + workout type abbr. Today's cell: accent bg + accent border.
- **Recent log** — last 5 entries from `fitness.workoutLog` (reverse order). Each row: title, date + duration, feel label.

---

### 5.8b More (`'more'`)

**File:** light route owned by `App.jsx` or `src/screens/More.jsx`
**Nav:** Shown (More tab in bottom nav).

V1 may be a lightweight placeholder list. It should use existing routes when available and avoid building full new systems.

List entries:
- Nutrition — placeholder until a Nutrition screen exists.
- Projects — routes to `projects` when available.
- Finance — routes to `finance` when available.
- Insights — placeholder until analytics/insights exist.

Settings does not need to appear in More while it remains available in the Home top-right utility cluster beside Inbox.

---

### 5.9 EodReflection (overlay)

**File:** `src/screens/EodReflection.jsx`
**Trigger:** App opened after 7pm AND `localStorage.getItem('lastReflectionDate') !== today`. Rendered above all screens except ignition.
**Nav:** Hidden (full-screen fixed overlay, `z-index: 200`).

3 steps (same dark flow as MorningIgnition):

**Step 1 — Review:** Heading "How did today go?". Today's tasks shown read-only with done/undone dot. Undone tasks show "carry?" with Yes / No pills — Yes adds task ID to local `carrySet`.

**Step 2 — Feel:** Heading "How did today feel?". 5-option emoji picker (😴😐🙂😄⚡). Required before continuing.

**Step 3 — Tomorrow's focus:** Heading "Tomorrow's focus." Pre-selected tasks: carried (from Step 1) → overdue (undone + dueTime < now) → scheduled. Max 3 shown, each swipe-right to remove. "+ Add" input inline. CTA "Set tomorrow →" dispatches `SET_TOMORROW_TASKS` + `ADD_REFLECTION`, sets `lastReflectionDate` in localStorage, calls `onComplete`.

---

### 5.10 WeeklyPlanning (overlay)

**File:** `src/screens/WeeklyPlanning.jsx`
**Trigger:** App opened on Sunday ≥5pm AND `lastWeeklyPlanDate` (localStorage) is not within the current Mon–Sun week.
**Nav:** Hidden (full-screen fixed overlay, `z-index: 200`). Shows after EodReflection completes (not simultaneously).

5 steps:

**Step 1 — Week review:** "This week" heading. Stat rows: workouts completed (from `fitnessState.workoutLog` filtered to this week), day tasks done, and a legacy-labeled "She Stitches tasks" count derived from `projectsState.projects[0]`. This is a known legacy label/selector issue, not the generic Projects architecture.

**Step 2 — Next week priorities:** "3 big things next week." 3 dark inline text inputs (optional). Saves via `SET_WEEKLY_PRIORITIES`.

**Step 3 — Grocery list:** "Anything to grab this week?" Text input + add button. Items stored in `groceryList` (persists; unchecked items carry forward automatically). Existing items shown with tap-to-check and swipe-left-to-delete.

**Step 4 — Training preview:** "Next week's training." 7-column Mon–Sun strip (read-only) showing next week's workout abbreviations (R / US / LS / ST / —). Muted summary line below: "X run days · Y strength days". CTA "Looks good →".

**Step 5 — Project check-ins:** One screen per active project (`endDate > today`). Shows name, pace badge, tasks done, `getProjectPace` result. If behind: catch-up suggestion (`tasksRemaining / daysRemaining * 7`). Skipped if no active projects.

**Final — Done:** "Week planned. ✦" / "See you Sunday." CTA sets `lastWeeklyPlanDate` and navigates home.

---

### 5.11 WorkoutPlayer (`WorkoutPlayer` component)

**File:** `src/components/WorkoutPlayer.jsx`
**Rendered by:** `App.jsx` as global overlay when `activeWorkout !== null`.
**Props:** `{ workout, onComplete(log), onClose() }`

Full-screen `position: fixed` overlay (`z-index: 150`). Flows through `workout.segments[]` sequentially.

**Segment kinds:**

| Kind | Renderer | Behavior |
|---|---|---|
| `timed` | `TimedSegment` | Count-up timer vs target duration; shows remaining until target hit, then elapsed |
| `text` | `TextSegment` | Static card with name + instruction detail |
| `exercise` | `ExerciseSegment` | Set rows (tap to mark done); 60s rest countdown (skippable) between sets |

**Post-workout log:** (`PostWorkoutLog`) — elapsed timer, 5-emoji feel selector, notes textarea, "Save workout" → calls `onComplete({ date, type, title, duration, feel, notes, exercises[] })`. App.jsx dispatches `LOG_WORKOUT` and clears `activeWorkout`.

---

### `getProjectPace(project)` — `src/utils/projectUtils.js`

See §4 for full documentation. Returns `{ status, projectedFinish, daysOver }`.

---

### `generateWorkout(type, gymAccess, week)` — `src/utils/fitness.js` *(deprecated)*

> **@deprecated** — use `generateWorkout(config)` from `src/utils/workoutGenerator.js` instead. Remove after all call sites updated in step 14b-vi.

Returns `{ type, title, subtitle, durationEst, segments[] }`.

**Segment shape:** `{ kind, section, name, duration?, sets?, reps?, restSec?, detail? }`
- `section`: `'warmup'` | `'main'` | `'cooldown'` — used by preview renderer
- `kind`: `'timed'` | `'exercise'` | `'text'`

**Phase logic:** `getPhase(programStartDate)` → 13-week repeating cycle: weeks 1–4 `'base'` / 5–8 `'build'` / 9–12 `'peak'` / 13 `'deload'`, then repeats. Phase is never stored in state. `programEndDate` is accepted for backward compatibility but not used for phase calculation.

`getWeekNumber(programStartDate)` → weeks since start date (min 1); returns 1 when null.

**Phase config:** `getPhaseConfig(phase, weekInPhase)` → `{ sets, reps, intensity, rpeTarget }`. `weekInPhase` (1–4) applies progressive overload: reps decrease by 1 per week; rpeTarget increases by 0.5 per week. Sets stay constant within a phase.

**Day schedule** (JS `getDay()` indexed): Sun=rest, Mon=easy\_run, Tue=strength\_a, Wed=stretch, Thu=tempo\_run, Fri=strength\_b, Sat=long\_run.

---

### `generateWorkout(config)` — `src/utils/workoutGenerator.js`

**Config shape:**
```js
{
  dayType:          string,  // from programConfig.dayTypes
  equipment:        string,  // 'bodyweight' | 'dumbbells' | 'gym' (default: 'bodyweight')
  phase:            string,  // from getPhase() (default: 'base')
  weekInPhase:      number,  // 1–4 (default: 1)
  history:          object,  // raw fitnessState.workoutLog[] (default: [])
  mobilityDuration: number,  // 20 | 30 | 40 (default: 30)
}
```

**Returns:**
```js
{
  id:               string,  // `${date}_${dayType}`
  date:             string,  // getTodayISO()
  dayType:          string,
  title:            string,  // getDayTypeLabel(dayType)
  phase:            string,
  weekInPhase:      number,
  estimatedMinutes: number,  // rounded up to nearest 5
  segments:         WorkoutSegment[],
}
```

**Segment shapes:**

Timed segment (warmup, cooldown, run, mobility):
```js
{ section, type: 'timed', name, duration, instruction, effort?, audioId? }
```

Sets/reps segment (strength main):
```js
{ section: 'main', type: 'sets_reps', exerciseId, name, sets, reps, rpeTarget, intensity, cues[], loadSuggestion, restSeconds, muscleGroup }
```

**Routing by dayType:**
- `run_easy | run_tempo | run_long` → `buildRunWorkout`
- `upper | lower | full_body | push | pull` → `buildStrengthWorkout`
- `mobility` → `buildMobilityWorkout`
- `rest` or unknown → `{ segments: [], estimatedMinutes: 0 }`

**Run durations** (seconds) per phase and week within phase (wk1–wk4):

| Type | base | build | peak | deload |
|---|---|---|---|---|
| `run_easy` | 1200/1200/1500/1500 | 1500/1800/1800/2100 | 2100/2100/2400/2400 | 900 |
| `run_tempo` | 600/600/900/900 | 900/1200/1200/1500 | 1500/1800/1800/2100 | 600 |
| `run_long` | 1800/2100/2400/2700 | 2700/3000/3300/3600 | 3600/3900/4200/4500 | 1800 |

`run_tempo` produces 5 segments: warmup_jog · tempo · recovery (120s fixed) · tempo · cooldown_walk.

**`selectExercises(pool, count, workoutLog)`** — deterministic daily shuffle. Never repeats exercises done in the last 7 days; prefers not-done-in-14-days. Seed: `hashString(getTodayISO())` via LCG PRNG. Same workout generated all day; changes tomorrow.

**`getLoadSuggestion(exercise, lastPerformance, phaseConfig)`** — returns `{ suggestion, basis }`. Null last performance → first-session hint. All reps hit last time → +2.5% rounded to nearest 2.5 lb. Any set short → stay at current weight. Bodyweight exercises (weight=0) always get first-session hint.

**`restSeconds` by phase:** base → 90s · build → 120s · peak → 180s · deload → 90s.

---

## 6. Interaction Patterns

### Swipe to confirm (SwipeRow)
Used in Morning Ignition Brief step for tasks and workout.
- `touch-action: pan-y` — allows normal vertical scroll, only captures horizontal intent
- Threshold: **80px** rightward delta
- Drag: card bg tints green proportionally, arrow `→` fades in at right edge
- Release above threshold: `onConfirm()` fired, confirmed state locked in
- Release below threshold: snaps back with `transition: transform 0.25s ease-out`
- Confirmed state is terminal — no un-confirm

### Tap to confirm (MealSlot, Fuel Gauge)
Used for meal slots in Ignition Brief and Home fuel gauge.
- Single tap toggles from empty → confirmed/eaten
- Visual: background switches to `success-bg`, border to `success`, label turns green

### Tap to toggle (Task rows on Home)
- Tap dispatches `TOGGLE_TASK` — cycles `done: false ↔ true`
- Done: strikethrough text, reduced opacity, green color

### Tap to triage (Inbox items)
- Three inline buttons per item: Task / Calendar / Delete
- Any tap dispatches `REMOVE_INBOX_ITEM` and animates the row out

### Focus Timer controls
- Play/pause: toggles interval; status label updates
- Reset: stops timer, restores full duration
- Skip: ends current session immediately, fires completion logic

### Task time scheduling
Used in Home screen task rows.
- Tapping a task row expands an inline time picker beneath it
- Selecting a time saves via `UPDATE_TASK_TIME` dispatch: `{ taskId, time: 'HH:MM' }` — updates `tasks[id].dueTime`
- Tasks with a scheduled time appear as dynamic items in "Today at a glance", inserted chronologically among the fixed timeline items
- Tapping the row header again (not the picker itself) collapses the picker
- DayContext action: `UPDATE_TASK_TIME` — see §4.

### Meal time editing
Used in Home screen fuel gauge slots.
- Tapping ◷ icon on a fuel slot opens `FuelEditSheet` — a slide-up bottom sheet with two native `<input type="time">` fields (iOS-safe)
- Saves via `UPDATE_MEAL_WINDOW` dispatch: `{ slot, startTime: 'HH:MM', endTime: 'HH:MM' }`
- Late state: triggered when `currentTime > meals[slot].lateAfter` AND `meals[slot].eaten === false` — slot renders in terracotta
- DayContext action: `UPDATE_MEAL_WINDOW` — see §4.

---

## 7. Navigation & Routing

**Pattern:** `useState`-based screen switcher in `App.jsx` — no router library.

**Screen values:** `'ignition'` · `'home'` · `'plan'` · `'calendar'` · `'tasks'` · `'fitness'` · `'more'` · `'focus'` · `'inbox'` · `'finance'` · `'projects'` · `'settings'`

**Bottom nav** (`src/App.jsx`):
- 60px height, `#1A1A14` bg, `0.5px` top border
- Tabs come from `getEnabledNavTabs(settings.modules)`: Calendar, Tasks, Home, Fitness, More. Home remains centered.
- Inbox is removed from bottom navigation and remains globally accessible from the Home top-right utility cluster beside Settings.
- Finance is removed from bottom navigation and routes through More.
- Active: label + icon color → `#C17B56`, small 4px pip dot below icon
- Fixed to bottom of the 393px column, `z-index: 100`
- Hidden by `navigation/router.js` for `fitness-setup`, `settings`, `ignition`, `focus`, `eod`, and `weekly`. The current route map shows nav on `calendar`, `tasks`, `home`, `fitness`, `more`, `projects`, and `finance`.

**Global overlays** (rendered above nav in `App.jsx`):
- `WorkoutPlayer` (z-index 150): shown when `activeWorkout !== null`; cleared on save or close

**Screen transitions triggered by props:**

| From | To | Trigger |
|---|---|---|
| `ignition` | `home` | `onComplete()` inside MorningIgnition Step 3 |
| `home` | `inbox` | Inbox icon in the Home top-right utility cluster |
| `home` | `settings` | Settings icon in the Home top-right utility cluster |
| `home` | `plan` | Plan tab in the Home planner status bar |
| `home` | `focus` | `onOpenFocus()` prop |
| `home` | `projects` | `onNavigate('projects')` via focus-project goal card tap |
| `settings` | `home` | `onBack()` prop |
| `focus` | `home` | `onClose()` prop |
| `projects` | `home` | `onBack()` prop |
| `more` | `projects` / `finance` | More list row tap when the screen exists |
| `home` or `fitness` | WorkoutPlayer overlay | "Start →" button → `onStartWorkout(workout)` in App.jsx |
| Any nav tab | target screen | Bottom nav tab tap |

---

## 8. PWA Configuration

### index.html

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="App in My Life" />
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#141410" />
```

### public/manifest.json *(to be created in Step 8)*

```json
{
  "name": "App in My Life",
  "short_name": "App in My Life",
  "theme_color": "#141410",
  "background_color": "#141410",
  "display": "standalone",
  "start_url": "/verbose-octo-robot/",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### GitHub Pages Deploy *(to be created in Step 8)*

File: `.github/workflows/pages.yml`
- Trigger: push to `main`
- Vite `base` config set to `/verbose-octo-robot/`

---

## 9. V1 Scope vs Deferred

### In V1

- Morning Ignition full 3-step flow (Energy → Brief → Locked)
- Home screen: compact Daily Execution header, top-right Inbox + Settings utilities, daily task/event tally, Morning/Evening check-in status, Daily Flow timeline, inline task scheduling, and meal guidance blocks
- Focus Timer full implementation (ring, presets, session tracking)
- Inbox capture + triage; "Task" button dispatches ADD_TASK with green flash confirmation
- Finance screen with local transaction data, manual add/delete, Plaid connection stub, and read-only summary selectors
- Settings screen: profile name, equipment toggle, Plaid/Calendar connection stubs
- Fitness tab: Today's Training card, weekly strip, recent workout log
- WorkoutPlayer: full segment flow + post-workout log (feel, notes, saves to fitness.workoutLog)
- 26-week training block: generateWorkout utility with phase-aware exercise selection
- Fuel slot time editing via FuelEditSheet bottom sheet (iOS-safe native time inputs)
- LocalStorage persistence with eight domain keys and daily reset scoped to DayContext
- PWA manifest + GitHub Pages deploy

**Module defaults in V1:** `settings.modules.fitness`, `settings.modules.finance`, and `settings.modules.focus` default to enabled. `nutrition`, `goals`, `reflection`, `habits`, and `sleep` default to disabled. App nav uses the fixed order Calendar, Tasks, Home, Fitness, More. Inbox and Settings are Home top-right utilities. Finance and Projects are reachable from More when their routes are available. Home keeps Daily Flow, task tally, and planner status available regardless of module flags.

### Deferred (V2+)

- **Real Plaid API** integration (read-only transaction sync)
- **V2 Twilio SMS pipeline** — finance spend alerts via SMS (stub comment in Finance.jsx)
- **Runna API** integration (live workout data instead of mock)
- **Google Calendar** integration (inbox "→ Calendar" action)
- **Task editing** — add/edit/delete tasks from the app
- **Meal customization** — edit meal labels and time windows
- **Notifications / reminders** — push or local alerts for commitments
- **Onboarding flow** — first-time setup for tasks, meals, workout defaults, and module preferences
- **Multiple energy history** — chart of energy levels over time
- **Swipe left to delete** on task rows
- **iCloud / remote sync** — multi-device state
- **V2 intensity blocks** — RPE-based effort scaling within phases
- **V3 program builder** — custom week-by-week plan editor
- **Workout time editing in Ignition** — allow adjusting workout time during Brief step (parallel to meal window editing via FuelEditSheet)

---

## 10. Build Order & Progress

| Step | Description | Status | Files |
|---|---|---|---|
| 1 | Design tokens + initial state architecture | ✅ Done | `src/styles/tokens.css`, current state now lives in `src/context/*Context.jsx` |
| 2 | App shell + bottom nav routing | ✅ Done | `src/main.jsx`, `src/App.jsx`, `src/index.css`, `index.html`, `src/screens/*.jsx` (stubs) |
| 3 | Morning Ignition (all 3 steps) | ✅ Done | `src/screens/MorningIgnition.jsx` |
| 4 | Home screen (all zones) | ✅ Done | `src/screens/Home.jsx` |
| 5 | Focus Timer overlay | ✅ Done | `src/screens/FocusTimer.jsx` |
| 6 | Inbox | ✅ Done | `src/screens/Inbox.jsx` |
| 6b | Legacy She Stitches seed project — goal card + roadmap screen | ✅ Superseded | Current code uses `ProjectsContext.jsx`, `Projects.jsx`, and generic focus-project selection. |
| 6.5 | Plan placeholder + More navigation | ✅ Done | `src/App.jsx`, `src/screens/Home.jsx`, `src/screens/More.jsx` |
| 7 | Finance (local transaction data) | ✅ Done | `src/screens/Finance.jsx`, `src/context/FinanceContext.jsx` |
| 8 | PWA manifest + GitHub Pages deploy | ✅ Done | `public/manifest.json`, `public/icons/icon-192.png`, `public/icons/icon-512.png`, `vite.config.js`, `.github/workflows/pages.yml` |
| 9 | Fitness tab, workout generator, settings, polish | ✅ Done | `src/utils/fitness.js`, `src/screens/Fitness.jsx`, `src/screens/Settings.jsx`, `src/components/WorkoutPlayer.jsx`, `src/components/FuelEditSheet.jsx`, `src/screens/Home.jsx`, `src/screens/Inbox.jsx`, domain contexts in `src/context/`, `src/App.jsx` (5-tab nav, global WorkoutPlayer overlay) |
| 11 | Finance transactions, fitness program dates, workout preview | ✅ Done | `src/context/FinanceContext.jsx`, `src/context/FitnessContext.jsx`, `src/screens/Finance.jsx`, `src/utils/fitness.js`, `src/screens/Fitness.jsx`, `src/screens/Settings.jsx` |
| 12 | Projects system, EOD reflection, Sunday weekly planning | ✅ Done | `src/utils/projectUtils.js`, `src/context/ProjectsContext.jsx`, `src/context/PlanningContext.jsx`, `src/context/DayContext.jsx`, `src/screens/Projects.jsx`, `src/screens/Home.jsx`, `src/screens/EodReflection.jsx`, `src/screens/WeeklyPlanning.jsx`, `src/App.jsx` |
| 14b-i | Remove HYROX, fitness program schema v2, selectors, phase config | ✅ Done | `src/constants/fitness.js` (PHASES: base/build/peak/deload; PHASE_LABELS updated), `src/utils/fitness.js` (getPhase 13-week cycle, getPhaseConfig, getDayTypeLabel; hyroxStation removed; hyrox segment field removed), `src/utils/fitnessSelectors.js` (getExerciseHistory, getLastPerformance, getTodayWorkoutType, getWeekStrip), `src/context/FitnessContext.jsx` (schema v2 + v1→v2 migration; program/programConfig state; CONFIGURE_PROGRAM, UPDATE_PROGRAM_CONFIG, LOG_WORKOUT_SETS actions), `src/components/WorkoutPlayer.jsx` (HYROX station badge removed) |
| 14b-ii | Exercise library data files | ✅ Done | `src/data/exercises.js` (EXERCISES: upper/lower/full_body/push/pull/mobility, 3 equipment tiers, 90+ exercises), `src/data/runSegments.js` (RUN_SEGMENTS: warmup/cooldown/main segments, pure data) |
| 14b-iii | Workout generator — pure functions, progressive overload, run segments | ✅ Done | `src/utils/workoutGenerator.js` (getExercisePool, selectExercises, getLoadSuggestion, buildStrengthWorkout, buildRunWorkout, buildMobilityWorkout, generateWorkout — new config-based API), `src/utils/fitness.js` (@deprecated on old generateWorkout) |

**Live URL:** https://lexthe-creator.github.io/verbose-octo-robot/
