# App in My Life — Living Spec

> Updated at the end of every build step. Pull from code, not memory.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Design System](#2-design-system)
3. [App Structure](#3-app-structure)
4. [Context State Shapes](#4-context-state-shapes)
5. [Screens](#5-screens)
6. [Interaction Patterns](#6-interaction-patterns)
7. [Navigation & Routing](#7-navigation--routing)
8. [PWA Configuration](#8-pwa-configuration)
9. [V1 Scope vs Deferred](#9-v1-scope-vs-deferred)
10. [Build Order & Progress](#10-build-order--progress)

---

## 1. Project Overview

**Name:** App in My Life
**Purpose:** Dark-themed personal PWA for ADHD daily execution — morning planning, task tracking, focus timer, capture inbox, and read-only finance snapshot.
**Stack:** Vite + React 19, deployed to GitHub Pages. No external UI libraries — custom components only.
**Target device:** Mobile-first, 393px wide, iPhone 16 Pro safe areas.

---

## 2. Design System

All tokens live in `src/styles/tokens.css` as CSS custom properties. Imported globally via `src/index.css`.

### Colors

| Token | Value | Usage |
|---|---|---|
| `--color-bg` | `#141410` | App background |
| `--color-card` | `#1E1E18` | Card surfaces |
| `--color-nav-bg` | `#1A1A14` | Bottom nav background |
| `--color-chart-bar` | `#252520` | Inactive chart bars |
| `--color-border` | `#2A2A22` | All borders |
| `--color-text` | `#F6F3EF` | Primary text |
| `--color-muted` | `#8C8C7A` | Secondary / label text |
| `--color-faint` | `#3A3A30` | Placeholder, track backgrounds |
| `--color-accent` | `#C17B56` | Terracotta — active states, CTAs, nav pip |
| `--color-accent-light` | `#E8A87C` | Timer ring at 40% remaining |
| `--color-accent-bg` | `#2A1F14` | Accent surface / selected card bg |
| `--color-success` | `#1D9E75` | Completed states |
| `--color-success-bg` | `#0F2318` | Completed card surface |
| `--color-danger` | `#E05555` | Overdue, timer ring at 20% remaining |

### Typography

| Token | Value |
|---|---|
| `--font-body` | `'DM Sans', system-ui, sans-serif` |
| `--font-display` | `'DM Serif Display', Georgia, serif` |

- Body: DM Sans 400/500/600
- Headings / large numbers: DM Serif Display
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
| `--nav-height` | `72px` |
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

**Current module gating behavior:** `settings.modules` is persisted and migration-safe. `App.jsx` filters bottom-nav tabs through `getEnabledNavTabs(settings.modules)`: Home and Inbox are always shown; Fitness, Projects, and Finance are gated by `fitness`, `goals`, and `finance`. `Home.jsx` uses the same module flags for support sections: Training follows `fitness`, Meals follows `nutrition`, Focus / Projects follows `focus`, `goals`, or an available focus project. Tasks and Today Timeline remain core Home cards and are always available.

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

`'ignition'` · `'home'` · `'fitness'` · `'focus'` · `'inbox'` · `'finance'` · `'projects'` · `'settings'`

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

1. **Hero header + next action** — greeting line ("Good morning/afternoon/evening, {name}") from `UserContext`, gear icon top-right → `onNavigate('settings')`, date row, then a single "Next action" hero card. The hero renders one primary action, one primary CTA, and at most one secondary button. Secondary action is Focus when focus is enabled and the primary is not Focus; otherwise Inbox.
2. **Derived next action helper** — `getHomeNextAction()` computes the hero action from existing state in this order: overdue scheduled task, active/in-progress workout if a future persisted state supports it, next scheduled task, next uneaten meal window, today's workout if not complete, focus session, inbox capture prompt. Current persisted state has no active/in-progress workout resume field, so that priority branch is intentionally skipped.
3. **Burn bar** — 2px track, fills based on % of waking day elapsed (6am-11pm). Left: "X% of day gone". Right: the current next-action detail string.
4. **Collapsible support cards** — Home support content is grouped into collapsible cards and only one card is expanded by default, preferring the card related to the current next action. Cards can be toggled open/closed by their headers.
5. **Today Timeline card** — core Home card, not a separate nav/module. Collapsed state shows the next upcoming item, remaining scheduled-item count, and a small current-position dot. Expanded state renders the full derived chronological timeline: Morning ignition, scheduled tasks, meal windows, planned or confirmed workout, and the current "you are here" marker.
6. **Training card** — gated by `settings.modules.fitness !== false`. Shows today's generated workout. `Start ->` calls `onStartWorkout(workout)`; green "✓ Completed" state when `fitnessState.todayComplete`. Rest days render without a start button.
7. **Tasks card** — always available. Contains task rows from `DayContext`. Tapping the check circle toggles done. Tapping row text expands/collapses the inline time picker. Done rows are strikethrough + green + reduced opacity. Overdue badge appears when `dueTime` is earlier than now and the task is not done.
8. **Meals card** — gated by `settings.modules.nutrition === true`. Shows 4 meal slots (Breakfast / Lunch / Snack / Dinner). Tap slot body → `MARK_MEAL_EATEN` (toggle). Tap ◷ icon → `FuelEditSheet` bottom sheet for time editing.
9. **Focus / Projects card** — shown when focus is enabled, goals are enabled, or an existing focus project is available. Focus launch calls `onOpenFocus`. Goal card selects the project with `status === 'focus'`, shows progress/listings/next task from `getProjectStats(focusProject)`, and taps through to `onNavigate('projects')`.

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

**Screen values:** `'ignition'` · `'home'` · `'fitness'` · `'focus'` · `'inbox'` · `'finance'` · `'projects'` · `'settings'`

**Bottom nav** (`src/App.jsx`):
- 72px height, `#1A1A14` bg, `0.5px` top border
- Tabs come from `getEnabledNavTabs(settings.modules)`: Home `⌂` and Inbox `◎` are always available; Fitness `◉` is gated by `modules.fitness`; Projects `▣` is gated by `modules.goals`; Finance `◈` is gated by `modules.finance`.
- Active: label + icon color → `#C17B56`, small 4px pip dot below icon
- Fixed to bottom of the 393px column, `z-index: 100`
- Hidden by `navigation/router.js` for `fitness-setup`, `settings`, `ignition`, `focus`, `eod`, and `weekly`. The current route map shows nav on `home`, `fitness`, `inbox`, `projects`, and `finance`.

**Global overlays** (rendered above nav in `App.jsx`):
- `WorkoutPlayer` (z-index 150): shown when `activeWorkout !== null`; cleared on save or close

**Screen transitions triggered by props:**

| From | To | Trigger |
|---|---|---|
| `ignition` | `home` | `onComplete()` inside MorningIgnition Step 3 |
| `home` | `focus` | `onOpenFocus()` prop |
| `home` | `settings` | Gear icon in HomeHero → `onNavigate('settings')` |
| `home` | `projects` | `onNavigate('projects')` via focus-project goal card tap |
| `settings` | `home` | `onBack()` prop |
| `focus` | `home` | `onClose()` prop |
| `projects` | `home` | `onBack()` prop |
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
- Home screen: greeting + gear icon, Focus pill, Today's Training card, burn bar, timeline, tasks, generic focus-project goal card, fuel gauge
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

**Module defaults in V1:** `settings.modules.fitness`, `settings.modules.finance`, and `settings.modules.focus` default to enabled. `nutrition`, `goals`, `reflection`, `habits`, and `sleep` default to disabled. App nav now gates Fitness, Projects, and Finance from these flags while keeping Home and Inbox always available. Home gates Training, Meals, and Focus / Projects support cards from these flags, while keeping Tasks available.

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
| 7 | Finance (local transaction data) | ✅ Done | `src/screens/Finance.jsx`, `src/context/FinanceContext.jsx` |
| 8 | PWA manifest + GitHub Pages deploy | ✅ Done | `public/manifest.json`, `public/icons/icon-192.png`, `public/icons/icon-512.png`, `vite.config.js`, `.github/workflows/pages.yml` |
| 9 | Fitness tab, workout generator, settings, polish | ✅ Done | `src/utils/fitness.js`, `src/screens/Fitness.jsx`, `src/screens/Settings.jsx`, `src/components/WorkoutPlayer.jsx`, `src/components/FuelEditSheet.jsx`, `src/screens/Home.jsx`, `src/screens/Inbox.jsx`, domain contexts in `src/context/`, `src/App.jsx` (5-tab nav, global WorkoutPlayer overlay) |
| 11 | Finance transactions, fitness program dates, workout preview | ✅ Done | `src/context/FinanceContext.jsx`, `src/context/FitnessContext.jsx`, `src/screens/Finance.jsx`, `src/utils/fitness.js`, `src/screens/Fitness.jsx`, `src/screens/Settings.jsx` |
| 12 | Projects system, EOD reflection, Sunday weekly planning | ✅ Done | `src/utils/projectUtils.js`, `src/context/ProjectsContext.jsx`, `src/context/PlanningContext.jsx`, `src/context/DayContext.jsx`, `src/screens/Projects.jsx`, `src/screens/Home.jsx`, `src/screens/EodReflection.jsx`, `src/screens/WeeklyPlanning.jsx`, `src/App.jsx` |
| 14b-i | Remove HYROX, fitness program schema v2, selectors, phase config | ✅ Done | `src/constants/fitness.js` (PHASES: base/build/peak/deload; PHASE_LABELS updated), `src/utils/fitness.js` (getPhase 13-week cycle, getPhaseConfig, getDayTypeLabel; hyroxStation removed; hyrox segment field removed), `src/utils/fitnessSelectors.js` (getExerciseHistory, getLastPerformance, getTodayWorkoutType, getWeekStrip), `src/context/FitnessContext.jsx` (schema v2 + v1→v2 migration; program/programConfig state; CONFIGURE_PROGRAM, UPDATE_PROGRAM_CONFIG, LOG_WORKOUT_SETS actions), `src/components/WorkoutPlayer.jsx` (HYROX station badge removed) |
| 14b-ii | Exercise library data files | ✅ Done | `src/data/exercises.js` (EXERCISES: upper/lower/full_body/push/pull/mobility, 3 equipment tiers, 90+ exercises), `src/data/runSegments.js` (RUN_SEGMENTS: warmup/cooldown/main segments, pure data) |
| 14b-iii | Workout generator — pure functions, progressive overload, run segments | ✅ Done | `src/utils/workoutGenerator.js` (getExercisePool, selectExercises, getLoadSuggestion, buildStrengthWorkout, buildRunWorkout, buildMobilityWorkout, generateWorkout — new config-based API), `src/utils/fitness.js` (@deprecated on old generateWorkout) |

**Live URL:** https://lexthe-creator.github.io/verbose-octo-robot/
