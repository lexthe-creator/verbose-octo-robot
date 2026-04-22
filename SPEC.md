# App in My Life — Living Spec

> Updated at the end of every build step. Pull from code, not memory.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Design System](#2-design-system)
3. [App Structure](#3-app-structure)
4. [AppContext State Shape](#4-appcontext-state-shape)
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
**Stack:** Vite + React 18, deployed to GitHub Pages. No external UI libraries — custom components only.
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
  main.jsx                — entry, wraps app in <AppProvider>
  App.jsx                 — screen switcher + fixed bottom nav
  index.css               — single @import of tokens.css
  styles/
    tokens.css            — all design tokens + reset
  context/
    AppContext.jsx         — global state (useReducer + localStorage)
  screens/
    MorningIgnition.jsx   — 3-step ignition flow
    Home.jsx              — main daily screen
    FocusTimer.jsx        — full-screen overlay timer
    Inbox.jsx             — capture + triage
    Finance.jsx           — read-only finance panel
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

---

## 4. AppContext State Shape

Source of truth: `src/context/AppContext.jsx`. Main state persisted to `localStorage` under key `aiml_state`. Resets to `initialState` on new calendar day (checked against `dayLockedAt`). Inbox items persist across day resets.

**She Stitches state** is persisted separately under key `'sheStitches'` and is never wiped by day reset.

```js
{
  // Morning Ignition
  energyLevel:      null,       // number 1–4 | null (😴=1 😐=2 🙂=3 ⚡=4)
  confirmedTasks:   [],         // string[] — task ids confirmed during Brief
  confirmedMeals:   [],         // ('breakfast'|'lunch'|'snack'|'dinner')[]
  workoutConfirmed: false,      // boolean
  dayLockedAt:      null,       // ISO 8601 string | null

  // Tasks — the "3 things"
  tasks: [
    { id: 't1', text: string, done: boolean, dueTime: 'HH:MM', scheduledTime: 'HH:MM' | null },
    { id: 't2', text: string, done: boolean, dueTime: 'HH:MM', scheduledTime: 'HH:MM' | null },
    { id: 't3', text: string, done: boolean, dueTime: 'HH:MM', scheduledTime: 'HH:MM' | null },
  ],

  // Meals — all times in 'HH:MM' 24h format
  // lateAfter mirrors endTime; set on CONFIRM_MEAL or UPDATE_MEAL_WINDOW
  meals: {
    breakfast: { label: 'Breakfast', startTime: '07:00', endTime: '09:00', lateAfter: '09:00', eaten: boolean },
    lunch:     { label: 'Lunch',     startTime: '12:00', endTime: '14:00', lateAfter: '14:00', eaten: boolean },
    snack:     { label: 'Snack',     startTime: '15:00', endTime: '17:00', lateAfter: '17:00', eaten: boolean },
    dinner:    { label: 'Dinner',    startTime: '19:00', endTime: '21:00', lateAfter: '21:00', eaten: boolean },
  },

  // Workout
  workout: {
    type:      string,   // e.g. 'Tempo Run'
    duration:  string,   // e.g. '45 min'
    pace:      string,   // e.g. '5:20 / km'
    time:      string,   // e.g. '6:30 PM'
    confirmed: boolean,
  },

  // Inbox
  inboxItems: [
    { id: string, text: string, createdAt: ISO8601 },
  ],

  // Focus Timer
  focusSessions: number,   // cumulative completed sessions
}
```

### She Stitches State (separate localStorage key `'sheStitches'`)

```js
{
  startDate: '2025-04-01',   // ISO date string, day 1 of 90
  tasks: [
    {
      id:       string,    // 'ss1'–'ss37'
      text:     string,
      done:     boolean,
      listings: number,    // live listings this task adds when completed
      week:     number,    // 1–12
      month:    number,    // 1–3
      tag:      'Design' | 'Etsy' | 'Marketing' | 'Strategy',
    },
    // 37 seed tasks total
  ],
}
```

**Computed helpers** exposed via `useApp()`:

| Helper | Type | Description |
|---|---|---|
| `ssDoneCount` | `number` | Completed task count |
| `ssTotalCount` | `number` | Total task count (37) |
| `ssListingsCount` | `number` | Sum of `listings` for done tasks |
| `ssNextTask` | `string \| null` | Text of first undone task |
| `ssDayOf90` | `number` | `min(daysSinceStartDate, 90)` |

### Dispatch Actions

| Action type | Payload | Effect |
|---|---|---|
| `SET_ENERGY` | `1–4` | Sets `energyLevel` |
| `CONFIRM_TASK` | task `id` string | Appends to `confirmedTasks` (idempotent) |
| `CONFIRM_MEAL` | `{ slot, startTime, endTime }` | Appends to `confirmedMeals`; sets `meals[slot].startTime/endTime/lateAfter` (idempotent) |
| `CONFIRM_WORKOUT` | — | Sets `workoutConfirmed` + `workout.confirmed` to `true` |
| `LOCK_DAY` | — | Sets `dayLockedAt` to current ISO timestamp |
| `TOGGLE_TASK` | task `id` string | Toggles `tasks[id].done` |
| `UPDATE_TASK_TIME` | `{ taskId, time: 'HH:MM' }` | Sets `tasks[id].scheduledTime`; task appears in timeline |
| `MARK_MEAL_EATEN` | slot string | Sets `meals[slot].eaten` to `true`. Used by fuel slot tap (body). Does NOT touch time fields. |
| `UPDATE_MEAL_WINDOW` | `{ slot, startTime, endTime }` | Updates `meals[slot].startTime/endTime/lateAfter`. Used by fuel slot time editor (◷ icon). Does NOT touch `eaten`. |
| `ADD_INBOX_ITEM` | text string | Prepends new item to `inboxItems` |
| `REMOVE_INBOX_ITEM` | item `id` string | Filters item from `inboxItems` |
| `INCREMENT_FOCUS_SESSIONS` | — | Increments `focusSessions` by 1 |
| `RESET_DAY` | — | Resets to `initialState`, preserves `inboxItems` |
| `TOGGLE_SS_TASK` | task `id` string | Dispatched to `ssDispatch` — toggles `ssState.tasks[id].done` |

### Context helper functions

Exposed alongside `state` and `dispatch` via `useApp()`:

| Function | Signature | Dispatches |
|---|---|---|
| `updateTaskTime` | `(taskId: string, time: 'HH:MM') => void` | `UPDATE_TASK_TIME` |
| `updateMealWindow` | `(slot: string, startTime: 'HH:MM', endTime: 'HH:MM') => void` | `UPDATE_MEAL_WINDOW` |
| `ssDispatch` | `(action) => void` | Reducer dispatch for She Stitches state |

---

## 5. Screens

### Screen Names (state values in App.jsx)

`'ignition'` · `'home'` · `'focus'` · `'inbox'` · `'finance'` · `'shestitches'`

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
**Props:** `onOpenFocus`, `onOpenInbox`

Layout zones top to bottom:

1. **Hero time** — live clock, DM Serif Display 52px. Colon in accent color. Below: full date (Monday, April 21). Right-aligned "⊙ Focus" pill → calls `onOpenFocus()`
2. **Burn bar** — 2px track, fills based on % of waking day elapsed (6am–11pm). Left: "X% of day gone". Right: next scheduled commitment countdown ("Tempo run in 47 min")
3. **Today at a glance** — dark card, vertical timeline. Items: Morning ignition (done, green), Now marker (terracotta dot + "you are here"), upcoming workout (terracotta), lunch window, dinner window. Each item: time · dot · label · optional badge
4. **3 Things** — task rows. Tap to check off. Done: strikethrough + green + reduced opacity. Overdue badge on relevant items
5. **Fuel gauge** — 4 meal slots (Breakfast / Lunch / Snack / Dinner). States: empty (default), ok (green — ate), late (terracotta — overdue). Tap slot body → dispatches `MARK_MEAL_EATEN`. Tap clock icon (◷) → expands inline time range editor which calls `updateMealWindow`. These are two distinct interactions on the same slot.
6. **FAB** — terracotta `+` button, bottom-right above nav. Opens Inbox via `onOpenInbox()`

---

### 5.3 Focus Timer (`'focus'`)

**File:** `src/screens/FocusTimer.jsx`
**Props:** `onClose`
**Nav:** Hidden (full-screen overlay).

- Back arrow top-left → `onClose()`
- Session counter top-right: "Session X of 4" — X driven by local `completedSessions` state (resets when overlay closes). `state.focusSessions` in AppContext is the cumulative lifetime count; `INCREMENT_FOCUS_SESSIONS` dispatched on each completion.
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

**Deviation from build instructions:** instructions referenced `focusSessionsCompleted` which does not exist in AppContext. Correct field is `focusSessions` (§4). Per-overlay session counting uses local state.

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

**Deviation from build instructions:** `addTask(text)` does not exist in AppContext — task editing is deferred to V2+ (§9). The Task button removes the inbox item (animating it out) but does not add to the tasks array in V1.

---

### 5.5 She Stitches Studio (`'shestitches'`)

**File:** `src/screens/SheStitches.jsx` ✅ Done
**Trigger:** Tap the goal card on Home.
**Nav:** Hidden (full-screen, back arrow only).
**Props:** `onBack()` → navigates to `'home'`.

**Layout:** Header (← Home, italic title, subtitle) → Progress card (stats row + gradient bar) → 3 collapsible month cards → Weekly Rhythm 2×2 grid → The One Rule card.

**State source:** `ssState` + computed helpers from `AppContext` (`ssDispatch` for `TOGGLE_SS_TASK`). Persisted to `localStorage` under key `'sheStitches'` — independent of daily reset.

---

### 5.6 Finance (`'finance'`)

**File:** `src/screens/Finance.jsx` ✅ Done

- Header: "Finance" (DM Serif Display 32px) + "● Plaid connected" badge (bg `#0C2A1E`, text `#1D9E75`, border `#1A4028`) + "synced 4 min ago" muted subtitle
- Hero card (bg `#1E1E18`, border `#2A2A22`, radius 14px): "Spent today" 9px uppercase label · DM Serif Display 38px dollars + 22px `#4A4A40` cents · comparison line `#4A4A40` · 7-bar weekly chart
- Weekly bars: Mon–Sun, `BAR_WIDTH 18px`, gap 4px, max height 48px. Today bar `#C17B56`, others `#252520`. Day labels 8px; today label `#C17B56`
- 2-column stat grid (gap 8px): "This week" (value `#C17B56` if over last week, `#1D9E75` if under) + "Anything odd?" (value `#1D9E75` "All clear" or `#C17B56` flag)
- "Today's transactions" list: 28px emoji icon circle (bg `#252520`, radius 8px) · merchant 12px `#C8C4BC` · category 10px `#3A3A30` · amount `#E05555` (spend) or `#1D9E75` (income)
- V1: all data hardcoded mock. V2: real Plaid API
- No AppContext dependency

**Note:** Inline styles object named `tx_s` (not `tx`) to avoid shadowing the `tx` prop parameter inside `TxRow`.

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
- AppContext action: `UPDATE_TASK_TIME` — see §4 dispatch table

### Meal time editing
Used in Home screen fuel gauge slots.
- Tapping a meal slot expands an inline time range picker (start time + end time) beneath it
- Defaults come from `meals[slot].window` as set during Morning Ignition
- Custom times save via `UPDATE_MEAL_WINDOW` dispatch: `{ slot, startTime: 'HH:MM', endTime: 'HH:MM' }` — updates `meals[slot].startTime` and `meals[slot].endTime`
- Late state: triggered when `currentTime > meals[slot].lateAfter` AND `meals[slot].eaten === false` — slot renders in terracotta
- AppContext action: `UPDATE_MEAL_WINDOW` — see §4 dispatch table

---

## 7. Navigation & Routing

**Pattern:** `useState`-based screen switcher in `App.jsx` — no router library.

**Screen values:** `'ignition'` · `'home'` · `'focus'` · `'inbox'` · `'finance'` · `'shestitches'`

**Bottom nav** (`src/App.jsx`):
- 72px height, `#1A1A14` bg, `0.5px` top border
- 3 tabs: Home `⌂` / Inbox `◎` / Finance `◈`
- Active: label + icon color → `#C17B56`, small 4px pip dot below icon
- Fixed to bottom of the 393px column, `z-index: 100`
- Hidden when `screen === 'ignition'` or `screen === 'focus'` or `screen === 'shestitches'`

**Screen transitions triggered by props:**

| From | To | Trigger |
|---|---|---|
| `ignition` | `home` | `onComplete()` inside MorningIgnition Step 3 |
| `home` | `focus` | `onOpenFocus()` prop |
| `home` | `inbox` | `onOpenInbox()` prop / FAB tap |
| `home` | `shestitches` | `onNavigate('shestitches')` via She Stitches goal card tap |
| `focus` | `home` | `onClose()` prop |
| `shestitches` | `home` | `onBack()` prop |
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
- Home screen all zones (clock, burn bar, timeline, tasks, She Stitches goal card, fuel gauge, FAB)
- Focus Timer full implementation (ring, presets, session tracking)
- Inbox capture + triage (no persistence to calendar/task system)
- Finance screen with mock data
- LocalStorage persistence with daily reset
- PWA manifest + GitHub Pages deploy

### Deferred (V2+)

- **Real Plaid API** integration (read-only transaction sync)
- **Runna API** integration (live workout data instead of mock)
- **Google Calendar** integration (inbox "→ Calendar" action)
- **Task editing** — add/edit/delete tasks from the app
- **Meal customization** — edit meal labels and time windows
- **Notifications / reminders** — push or local alerts for commitments
- **Onboarding flow** — first-time setup for tasks, meals, workout defaults
- **Multiple energy history** — chart of energy levels over time
- **Swipe left to delete** on task rows
- **iCloud / remote sync** — multi-device state

---

## 10. Build Order & Progress

| Step | Description | Status | Files |
|---|---|---|---|
| 1 | Design tokens + AppContext | ✅ Done | `src/styles/tokens.css`, `src/context/AppContext.jsx` |
| 2 | App shell + bottom nav routing | ✅ Done | `src/main.jsx`, `src/App.jsx`, `src/index.css`, `index.html`, `src/screens/*.jsx` (stubs) |
| 3 | Morning Ignition (all 3 steps) | ✅ Done | `src/screens/MorningIgnition.jsx` |
| 4 | Home screen (all zones) | ✅ Done | `src/screens/Home.jsx` |
| 5 | Focus Timer overlay | ✅ Done | `src/screens/FocusTimer.jsx` |
| 6 | Inbox | ✅ Done | `src/screens/Inbox.jsx` |
| 6b | She Stitches Studio — goal card + roadmap screen | ✅ Done | `src/context/AppContext.jsx`, `src/screens/SheStitches.jsx`, `src/screens/Home.jsx`, `src/App.jsx` |
| 7 | Finance (mock data) | ✅ Done | `src/screens/Finance.jsx` |
| 8 | PWA manifest + GitHub Pages deploy | ✅ Done | `public/manifest.json`, `public/icons/icon-192.png`, `public/icons/icon-512.png`, `vite.config.js`, `.github/workflows/pages.yml` |

**Live URL:** https://lexthe-creator.github.io/verbose-octo-robot/
