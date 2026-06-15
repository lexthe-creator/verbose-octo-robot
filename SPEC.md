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
- Complete training/workout execution architecture
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
- Nutrition V1C is the first foundation for the long-term Nutrition system.
- The long-term Nutrition destination may include calorie tracking, macro tracking, food database behavior, saved foods, saved meals, barcode/photo/AI support, and trend reporting.
- Nutrition V1C should move toward that long-term direction through manual, local-first food logging without external database, API, barcode, photo, or AI complexity.
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

## Planner Surface Responsibilities

Each primary planner surface has a distinct job.

- Inbox = capture anything.
- Tasks = committed actions.
- Plan = review today's commitments.
- Calendar = find capacity.
- Home = execute today.

These responsibilities should prevent duplicated planner surfaces:
- Inbox is for unstructured capture and triage.
- Tasks is for promoted actions with status.
- Plan is for reviewing what today already holds.
- Calendar is for identifying room and capacity.
- Home is for moving through the current day.

Random thoughts, notes, and unprocessed ideas should not enter Tasks directly unless the user is intentionally creating a committed action. Inbox is the default holding area for loose capture.

## Tasks Planner Philosophy

Tasks is an action-management surface, not a capture surface.

Tasks should help the user understand:
- what actions are committed
- what is scheduled
- what is unscheduled
- what is upcoming
- what is already complete

Tasks can originate from Inbox, but once promoted they should become actionable records with status, not just notes.

Tasks should preserve the lifecycle:
- inbox item
- triaged into task
- scheduled or unscheduled
- completed

Tasks should avoid:
- becoming a random-thought capture area
- duplicating Inbox
- duplicating Plan
- duplicating Home Daily Flow
- dense project-management workflows
- productivity KPI framing

Tasks stores work. Plan reviews today's commitments. Home executes today. Calendar finds capacity.

## Nutrition Planner Philosophy

Nutrition V1C = Food Log Lite.

Nutrition answers:
- What have I eaten today?
- How does it compare to my calorie and macro targets?

Nutrition V1C should be manual, local-first, and low-friction. It may track calories and macros, but it should remain calm, planner-oriented, and non-judgmental.

Nutrition V1C should support:
- meal slots: breakfast, lunch, snack, dinner
- manual food logging
- calories
- protein
- carbs
- fat
- daily totals
- saved foods or repeat foods
- saved meals or repeat meals if simple to define
- edit/delete logged entries
- Home Nutrition planner tab status based on logged meals

Nutrition V1C defaults:
- calorie and macro targets should start with editable defaults, not `null`
- default calories: 1955
- default protein: 145g
- default carbs: 150g
- default fat: 75g
- V1 should not require a setup step before food logging
- saved foods are explicit user actions; manually logged foods should not be auto-saved
- Home completion should be driven by meal-slot logging, not target completion
- Home Daily Flow meal windows should derive completion from NutritionContext entries for the current date. If breakfast, lunch, snack, or dinner has at least one logged food entry, the matching Daily Flow meal window counts as complete and shows the logged meal/food name beneath that slot.

Nutrition V1C should not include:
- barcode scanning
- photo recognition
- external food database
- AI food estimates
- complex goal coaching
- trend reports
- meal plan generator
- grocery generation
- nutrition recommendations
- recipe library

Long-term Nutrition may evolve toward a MyFitnessPal-style replacement, including calorie tracking, macro tracking, food database behavior, saved foods, saved meals, barcode/photo/AI support, and trend reporting. V1C is only the manual local foundation for that future direction.

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
- moving commitments when future behavior is approved
- reviewing routines
- seeing upcoming commitments
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

This relationship is architectural only. Calendar V1 may show where commitments could fit, but it must not define or implement drag-and-drop behavior, move workflows, or event-management workflows.

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

### Temporary QA Stabilization

QA passes may temporarily suppress automatic planning and check-in prompts so the tester can freely move through the app without modal interruption.

During this QA stabilization pass:
- automatic Morning Check-In, EOD reflection, Weekly Planning, Fitness setup, Nutrition setup, or other planning/check-in prompts should not open on initial app load or normal navigation
- manual access to existing check-in, weekly planning, training setup, and nutrition setup flows should remain available where the app already exposes a CTA or route
- suppression should be controlled by a simple internal app-level flag, currently `QA_DISABLE_AUTO_PROMPTS`
- the flag must be easy to remove when QA is complete
- persisted user data, workout history, set logs, workout status, RPE, weights, reps, and notes must not be cleared or destructively migrated as part of QA suppression
- cleanup before QA changes should remove only unused, duplicate, abandoned, or clearly obsolete code, without changing behavior unless the behavior is obsolete

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

### Planner Design System

The Planner Design System is the governing design layer for all future AIML screens.

It sits above individual screen requirements and below product philosophy:
- Product philosophy defines what each surface is for.
- Planner Design System defines how surfaces should feel and behave visually.
- Screen sections define only surface-specific exceptions or additions.

When a future screen is designed or implemented, it should default to the Planner Design System unless a later SPEC section explicitly approves an exception.

#### Core feel

AIML should feel like a paper planner that happens to be digital.

It should not feel like:
- dashboard software
- project management software
- productivity SaaS
- admin forms

AIML screens should feel like calm planner pages, not software dashboards.

Default screen qualities:
- quiet
- structured
- spacious but not sparse
- readable at a glance
- low-pressure
- planner-first
- mobile-first

Avoid:
- dashboard-heavy composition
- KPI widgets as primary structure
- dense enterprise-app layouts
- oversized marketing-style heroes
- heavy boxed cards as the default page structure
- productivity-app visual noise
- motivational copy that competes with planner content
- stacked forms
- large buttons as the dominant page structure
- configuration screens as a default workflow
- settings-style layouts for ordinary planner tasks
- card-heavy dashboards
- empty-state paragraphs

#### Page hierarchy

Default page structure:
1. small planner label
2. optional compact page title only when it adds meaning
3. primary planner content
4. secondary context or actions

Rules:
- The small planner label is usually the route name, such as `home`, `calendar`, `tasks`, `fitness`, `nutrition`, or `more`.
- The planner label should be visually quiet: muted color, small size, strong enough for orientation, never hero-like.
- Do not add a subtitle by default. Add one only when it clarifies the surface and does not push primary content down.
- The first meaningful section should appear high on the screen.
- Primary planner content should not be delayed by decorative headers, large cards, or explanatory copy.

#### Typography hierarchy

Typography should carry hierarchy more than boxes, badges, or color blocks.

Default typography:
- planner labels: small, muted, letter-spaced, restrained
- section labels: lowercase or established structural uppercase, never random Title Case
- item titles: readable, sentence-style, preserving user-created casing
- metadata: smaller, muted, secondary
- counts/status: subtle planner metadata, not badges unless the screen specifically needs an affordance

Rules:
- Preserve user-created content casing.
- Use lowercase sentence-style text for planner content by default.
- Use uppercase only for established structural labels.
- Avoid oversized app-screen headings.
- Avoid all-caps section headers unless the current surface pattern already establishes them.
- Do not use typography to create pressure, urgency, or gamified productivity framing.

#### Design Baseline: Tasks Screen

Tasks screen is the visual baseline for all planner-style screens across AIML.

Reference pattern:
- Divider-based rows with subtle `borderBottom` instead of cards
- Quiet uppercase section labels (10–11px, 700 weight, 0.1em letter-spacing, muted color)
- Right-aligned section counts
- Simple circular completion controls (18px diameter, thin border, no fill until done)
- Large readable primary text (task titles)
- Muted secondary metadata below titles
- No card backgrounds, shadows, rounded container borders, or visual elevation
- Minimal pills or badges; status shown through typography and subtle indicators

All planner screens (Tasks, Fitness, Health Training, Calendar, Plan, Nutrition) should follow this pattern unless explicitly justified and documented in a later SPEC section.

Exceptions:
- WorkoutPlayer may be full-screen immersive, but must use planner-style typography, dividers, quiet metadata, and minimal cards. Avoid dashboard tiles, pills, badges, and heavy shadows unless functionally necessary (e.g., step progress rail).
- Guided execution screens (routines, workouts, check-ins) may use centered layouts or modal presentation, but should preserve planner typography and quiet visual hierarchy.
- Setup/configuration flows may use form-style layouts but should maintain planner aesthetic and avoid dense controls.

This ensures visual cohesion across execution, review, and planning surfaces.

#### Layout rhythm

Planner pages should use consistent mobile rhythm.

Defaults:
- screen padding should align with the established Home/Calendar/Tasks rhythm
- related content should sit close enough to scan as one planner page
- section gaps should be modest
- rows should use subtle dividers rather than heavy containers
- empty sections should collapse to their label/count or be omitted, depending on the surface
- prefer planner spreads, lists, rows, whitespace, and subtle indicators over app-like containers

Rules:
- Prefer rows, dividers, and whitespace over nested cards.
- Avoid page sections styled as floating dashboard cards.
- Do not put cards inside cards.
- Keep the first viewport useful; avoid letting low-value context dominate the top of the screen.
- Dense detail belongs behind a later interaction or future phase, not in the default planner view.

#### Information density

When choosing between form controls and planner readability, preserve planner readability.

Prefer:
- typography
- whitespace
- lists
- rows
- planner spreads
- subtle indicators
- progressive disclosure
- inline editing

Avoid:
- exposing every field at once
- making configuration the primary experience
- dense control panels
- setup-first flows when logging or review can begin immediately

#### Color, borders, and surfaces

Color should support orientation and state without dominating the planner.

Defaults:
- use `var(--color-bg)` as the page canvas
- use `var(--color-text)` for primary content
- use `var(--color-muted)` for labels and metadata
- use `var(--border)` or softer mixed borders for quiet separation
- use accent and success colors sparingly for active, selected, or completed states

Rules:
- Avoid strong badge treatment for ordinary metadata.
- Avoid heat maps, utilization colors, and KPI color systems unless explicitly approved.
- Avoid heavy outlines and boxed cells when a divider or spacing can do the work.
- Do not create one-off palettes that make a screen feel detached from Home, Plan, Calendar, Tasks, Fitness, Nutrition, or More.

#### Components and affordances

Planner controls should feel lightweight and familiar.

Defaults:
- rows for repeated planner items
- small icon buttons for utility actions
- text buttons for clear commands
- segmented controls for modes
- check circles for completion
- subtle inline metadata for time/date/status
- bottom sheets or focused flows for editing when needed

Data entry should prefer:
- inline entry
- bottom sheets
- contextual actions
- lightweight overlays

Rules:
- Do not introduce editing controls into read-only surfaces.
- Do not duplicate capture UI outside Inbox unless the surface is explicitly approved as a capture flow.
- Do not make every data point tappable if the screen's purpose is review or context.
- Use interaction weight that matches the surface responsibility.
- Avoid dedicated form pages unless explicitly approved.
- Avoid large create/edit screens unless the workflow cannot remain readable without them.
- Avoid multi-field setup experiences when editable defaults or progressive setup can work.

#### Planner primitive authority

PlannerPrimitives is the authority module for normal planner-screen primitives.
The intended authority set is:
- PageHeader
- SectionHeader
- PlannerRow
- ActionGroup
- BottomSheet
- SwipeRow
- EmptyState

Phase 1A alignment is a platform-authority phase, not a feature phase or screen
redesign phase. Before consolidating BottomSheet or SwipeRow implementations,
produce a Component Inventory that documents each implementation's file
location, consumers, behavioral differences, accessibility behavior, and
migration risk.

If two implementations are not functionally equivalent, document the delta and
obtain approval before consolidation. Shared-component migration must not hide
workflow, animation, close behavior, gesture threshold, accessibility, or
screen-hierarchy changes.

One BottomSheet system and one SwipeRow system are the target end state, but a
migration is complete only when the consumer is migrated, tests pass, the old
implementation is removed, and no remaining imports or local definitions
reference obsolete code.

Before closing a primitive consolidation phase, run a dead-code audit for unused
imports, obsolete exports, orphaned styles, legacy sheet implementations, and
legacy swipe implementations. No duplicate implementation should remain solely
for historical reasons.

Phase 1C may expand `PlannerBottomSheet` only with generic sheet capabilities
needed by deferred local sheets: animation, backdrop-close behavior, controlled
close timing, z-index/style variants, and callback-safe close helpers. Consumer
migration still requires proven parity. SwipeRow consolidation, Finance
redesign, and Health structural changes remain out of scope.

Finance is not being redesigned in Phase 1A. Only component-level migrations are
allowed: shared headers, shared rows, shared sheets, and shared swipe actions.
Removal of KPI cards, charts, summaries, dashboards, or financial hierarchy
changes is deferred to a future Finance-specific phase.

Health structural changes are out of scope for Phase 1A. Health findings should
be recorded in the audit report and converted into a future Health boundary
phase.

#### Empty states and helper copy

Planner pages should rely on structure before explanation.

Rules:
- Avoid explanatory empty-state copy when the section label already communicates the meaning.
- Prefer `—`, whitespace, or a collapsed section for empty planner groups.
- Use helper copy only when the user cannot reasonably infer what to do next.
- Avoid coaching, judgment, productivity pressure, or motivational filler.

#### Relationship to existing screens

Current screens should be treated as reference surfaces:
- Home defines the daily planner rhythm.
- Plan defines calm review.
- Calendar defines capacity and pattern visibility.
- Tasks defines committed-action rows.
- Nutrition defines low-friction logging.
- Fitness defines guided execution without turning Home into a workout dashboard.
- More defines lightweight navigation to secondary surfaces.

Future screens should visually belong to this family before adding screen-specific identity.

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
  NutritionContext.jsx   — targets, food logs, saved foods, saved meals
  screens/
    MorningIgnition.jsx   — 3-step ignition flow
    Home.jsx              — main daily screen (clock, training card, timeline, tasks, fuel)
    Calendar.jsx          — read-only week-first capacity planner + month navigator
    Tasks.jsx             — committed actions grouped by Today, Upcoming, Unscheduled, Done
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
SettingsProvider > UserProvider > FitnessProvider > DayProvider > InboxProvider > ProjectsProvider > FinanceProvider > PlanningProvider > NutritionProvider > App
```

There is no `AppContext` in the current architecture. State is split across eight domain contexts and exposed through `src/context/index.js`.

**localStorage keys and schema versions:**
| Key | Owner | Schema | Notes |
|---|---|---|
| `aiml_user` | UserContext | `{ version: 1, data }` | Migrates `profile` from legacy `aiml_state` when present. |
| `aiml_settings` | SettingsContext | `{ version: 1, data }` | Migrates `settings` from legacy `aiml_state`; backfills `modules` defaults. |
| `aiml_day` | DayContext | `{ version: 1, data: {...} }` |
| `aiml_fitness` | FitnessContext | `{ version: 3, data }` | v1→v2 adds `program`, `programConfig`, and `sets[]` on log entries; v2→v3 normalizes legacy program values such as `hyrox` to `hybrid`. |
| `aiml_inbox` | InboxContext | `{ version: 2, data }` | v1→v2 backfills task priority, calendar confirmed flag, and note pinned flag. |
| `aiml_projects` | ProjectsContext | `{ version: 1, data }` | Migrates projects from `aiml_state`; also migrates legacy `sheStitches` into the generic projects array. |
| `aiml_finance` | FinanceContext | `{ version: 1, data }` | Migrates `transactions` from legacy `aiml_state`. |
| `aiml_planning` | PlanningContext | `{ version: 1, data }` | Migrates reflection, weekly priorities, and grocery list from legacy `aiml_state`. |
| `aiml_nutrition` | NutritionContext | `{ version: 1, data }` | Local-first Nutrition V1C food logs, targets, saved foods, and saved meals. |
| `aiml_state` | Legacy only | Raw JSON, no version wrapper | Read once by domain contexts for migration. Do not write new state here. |
| `sheStitches` | Legacy only | Raw JSON | Migrated once into `aiml_projects`, then removed if migration succeeds. |
| `lastReflectionDate` | App.jsx overlay guard | ISO date string | Prevents repeated EOD overlay on the same date. |
| `lastWeeklyPlanDate` | App.jsx overlay guard | ISO date string | Prevents repeated weekly planning overlay in the same Mon–Sun week. |

Each domain context migrates from `aiml_state` on first launch when its own key is missing. Migration is non-destructive for `aiml_state`.

**Overlay z-index hierarchy:** EodReflection and WeeklyPlanning render at z-index 200. WorkoutPlayer renders at z-index 150 — below both overlays.

---

## 4. Context State Shapes

State is split across nine domain contexts. Each persistent context owns its localStorage key, reducer, migration path, and schema version. Derived values are computed in selectors/utilities, not stored.

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
  equipmentProfile:  [],           // actual equipment values selected by the user
  gymAccess:         'bodyweight', // derived compatibility only: 'bodyweight' | 'dumbbells' | 'home_gym' | 'full_gym' | legacy 'gym'
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

**Current module gating behavior:** `settings.modules` is persisted and migration-safe. `App.jsx` uses the fixed bottom-nav order Calendar, Tasks, Home, Health, Finance so Home remains centered. Inbox and Settings remain globally accessible as persistent module-header utilities on standard planner/module screens rather than the bottom nav. Finance and Projects are reachable from standard navigation surfaces when their modules or existing screens are available. Home keeps Daily Flow and task visibility as core planner behavior.

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

### 4.4 FitnessContext (`aiml_fitness`, schema v3)

```js
{
  programStartDate: null,  // ISO date string (YYYY-MM-DD) | null
  programEndDate:   null,  // ISO date string — goal date | null
  workoutLog: [
    {
      date: ISO8601, type: string, title: string, duration: number,
      feel: number, rpe?: number, notes: string, exercises: [],
      sets: [
        {
          exercise: string,
          exerciseId?: string,
          setNumber: number,
          plannedReps: number,
          reps: number,
          weight: number,
          rpe: number,
          note: string,
        },
      ],
    }
  ],
  todayComplete:  false,   // true only if workoutLog[last].date === today; resets automatically on new day
  focusSessions:  0,       // lifetime counter — never resets
  program: {
    type:       null,      // 'strength' | 'running' | 'hybrid' | 'mobility_recovery' | 'general' | 'custom'
    configured: false,     // true after setup wizard completes
  },
  programConfig: {
    trainingDays: [],      // ['mon','tue','thu','sat']
    dayTypes:     {},      // { mon: 'upper', tue: 'run', thu: 'lower' }
    goal:         null,    // matches program.type
    audioEnabled: false,
    weeklyDays:   0,       // count of training days
  },
}
```

Migration v1→v2: adds `program`, `programConfig`, and `sets: []` on existing `workoutLog` entries. Migration v2→v3 normalizes legacy program values without changing workout history, set logs, training days, or day status. Non-destructive.

`todayComplete` is self-contained: on load, FitnessContext checks `workoutLog[last].date === getTodayISO()` — no cross-context dependency.

Phase is **derived** — call `getPhase(programStartDate)`. Never stored. 13-week repeating cycle: 4 base + 4 build + 4 peak + 1 deload.
Week number is **derived** — call `getWeekNumber(programStartDate)`. Never stored.

Actions: `LOG_WORKOUT`, `LOG_WORKOUT_SETS`, `CONFIGURE_PROGRAM`, `UPDATE_PROGRAM_CONFIG`, `UPDATE_FITNESS`, `INCREMENT_FOCUS_SESSIONS`.

Training day types should stay user-facing and simple:
- `upper`
- `lower`
- `full_body`
- `run`
- `mobility`
- `custom`

Push and pull are movement patterns inside generated upper/full-body strength workouts. They should not be exposed as separate workout day types because they overlap with Upper.

Open Day logging should use four simple manual categories:
- Run — distance, duration, RPE
- Strength — exercise list, sets, reps, weight
- Mobility — duration, notes
- Other — duration, effort, notes

Custom is reserved for ad-hoc or user-authored workouts. V1 may store it as a day type without generating a full structured session.

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

### 4.9 NutritionContext (`aiml_nutrition`, schema v1) — V1C

Nutrition V1C introduces a separate nutrition domain.

```js
{
  targets: {
    calories: 1955,
    protein:  145,
    carbs:    150,
    fat:      75,
  },
  dailyLogs: {
    [YYYY-MM-DD]: {
      entries: [
        {
          id: string,
          mealSlot: 'breakfast' | 'lunch' | 'snack' | 'dinner',
          name: string,
          calories: number,
          protein: number,
          carbs: number,
          fat: number,
          createdAt: ISO8601,
          updatedAt: ISO8601,
        },
      ],
    },
  },
  savedFoods: [
    {
      id: string,
      name: string,
      calories: number,
      protein: number,
      carbs: number,
      fat: number,
      defaultMealSlot?: 'breakfast' | 'lunch' | 'snack' | 'dinner',
    },
  ],
  savedMeals: [
    {
      id: string,
      name: string,
      entries: [
        {
          name: string,
          calories: number,
          protein: number,
          carbs: number,
          fat: number,
        },
      ],
      defaultMealSlot?: 'breakfast' | 'lunch' | 'snack' | 'dinner',
    },
  ],
}
```

NutritionContext is separate from `DayContext.meals`.

Responsibilities:
- `DayContext.meals` controls meal windows and eaten/window state.
- `NutritionContext` controls food entries, calories, macros, saved foods, and saved meals.
- Home meal windows may eventually route to Nutrition logging for that meal slot.
- Home Nutrition planner tab status should eventually use `NutritionContext.dailyLogs`, not only `DayContext.meals`.
- Nutrition targets should be editable later, but V1C should ship with defaults and allow logging without setup.
- Manually logged foods should not automatically become saved foods. Saving a food for reuse should be an explicit optional action after logging.

Derived values:
- daily calories total
- daily protein total
- daily carbs total
- daily fat total
- meal-slot logged state based on whether at least one entry exists for the slot
- target comparison against editable default targets

Actions should be defined in the implementation pass, but V1C should support:
- add manual food entry
- add from saved food
- add saved meal
- update logged entry
- delete logged entry
- save food for reuse
- save meal for reuse

Actions:
- `ADD_FOOD_ENTRY`
- `UPDATE_FOOD_ENTRY`
- `DELETE_FOOD_ENTRY`
- `SAVE_FOOD`
- `DELETE_SAVED_FOOD`
- `SAVE_MEAL`
- `DELETE_SAVED_MEAL`
- `ADD_SAVED_FOOD_TO_LOG`
- `ADD_SAVED_MEAL_TO_LOG`
- `UPDATE_TARGETS`

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

`'ignition'` · `'home'` · `'plan'` · `'calendar'` · `'tasks'` · `'fitness'` · `'more'` · `'nutrition'` · `'focus'` · `'inbox'` · `'finance'` · `'projects'` · `'settings'`

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

1. **Daily Execution header** — compact planner header, not a dashboard hero. The visual hierarchy is greeting, date, planner status, then Daily Flow. The date should be roughly 20-25% smaller than the previous hero-like date treatment and should feel like a planner page heading, not a dashboard headline. Inbox and Settings sit together in the shared top-right module utility cluster and remain globally accessible from standard modules.
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
   - Daily Flow meal completion is derived from Nutrition V1C meal-slot entries for the current date. A logged breakfast, lunch, snack, or dinner marks that meal window complete and shows the logged meal or food name as the row detail.
   - Nutrition progress is based on completed meal-slot count out of the four supported slots: breakfast 25%, lunch 50%, dinner 75%, snack 100% when all four slots are logged. It must not use calorie or macro target progress for Home completion.
   - Home workout rows must come only from today's configured assigned workout, today's confirmed scheduled workout/run, or no workout row when the day is open. Legacy/default `DayContext.workout` values must not appear as planned workouts unless they are confirmed for today.
9. **Removed/avoided Home patterns** — do not render Current Focus if it duplicates Daily Flow. Do not render a large Next Action hero card. Do not add another dashboard card, redundant CTA, or duplicated Fitness quick tool on Home because Fitness has bottom navigation.

Planner tab status rules:
- Journal: `○` not started, `◐` partially completed, `☑` completed.
- Nutrition: `○` no nutrition logging, `◐` partial nutrition logging, `☑` completed nutrition logging for the day.
- Plan: `○` no daily plan started, `◐` partial planning inputs exist, `☑` daily plan set.

V1 data mapping:
- Journal can use today's reflection/EOD completion state when available; otherwise default to not started.
- Nutrition currently may use `DayContext.meals[*].eaten`; after Nutrition V1C, Nutrition tab status should use `NutritionContext.dailyLogs`.
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

### 5.2c Tasks (`'tasks'`)

Tasks V1 is a committed-actions surface.

Tasks V1 is not:
- a capture inbox
- a notes list
- a daily execution timeline
- a project manager
- a planning worksheet

Tasks should show promoted actions, not unprocessed thoughts. Inbox remains the place to capture anything. A task may be created directly only when the user is intentionally creating an action.

Primary lifecycle:
- inbox item -> triaged into task -> scheduled or unscheduled -> completed

V1 sections:
- Today — scheduled for today
- Upcoming — scheduled later
- Unscheduled — actions without a date/time
- Done — completed actions

Section meanings:
- Today contains committed actions with today's date or time.
- Upcoming contains committed actions scheduled beyond today.
- Unscheduled contains committed actions without a date or time.
- Done contains completed actions.

Tasks V1 should prioritize:
- action clarity
- status clarity
- light scheduling visibility
- recoverable organization

Tasks V1 implementation may:
- use existing `DayContext.tasks`
- toggle done/not done with existing `TOGGLE_TASK`
- show scheduled time when `scheduledTime` or `dueTime` exists
- show unscheduled state when no time/date exists
- preserve existing task casing
- keep row interaction lightweight
- use restrained planner typography with subtle section labels and counts
- collapse empty sections to their header/count without explanatory helper copy
- use the page label `tasks` without an additional subtitle such as "committed actions"
- make `today` the first visible content section after the page label
- align Tasks spacing and dividers with Calendar's quiet planner rhythm
- keep section labels lowercase: `today`, `upcoming`, `unscheduled`, `done`
- render section counts as subtle planner metadata, not badges or KPI values

Tasks V1 should not prioritize:
- capture workflows
- note storage
- dense task administration
- project planning
- analytics
- productivity scoring

Relationship to other surfaces:
- Inbox captures and triages.
- Tasks stores committed actions.
- Plan reviews today's commitments.
- Calendar finds capacity for commitments.
- Home executes the current day.

Do not introduce new Tasks data models, drag/drop, subtasks, priorities UI, recurring tasks, full task editing, project task migration, calendar scheduling workflows, or AI task planning until a future SPEC pass explicitly approves them.

---

### 5.2d Calendar (`'calendar'`)

Calendar V1 is a week-first capacity planning surface.

Calendar V1 is not an event management surface, a dense scheduler, an hourly timeline, or a Google Calendar replacement.

Calendar V1 is read-only.

Primary view:
- Week-first.

Secondary view:
- Month navigator.

Calendar landing priority:
1. Find free time.
2. Review routines.
3. See upcoming commitments.
4. Plan the week.

Calendar V1 must not prioritize:
- event editing
- task editing
- drag and drop
- scheduling workflows
- dense event management

Calendar V1 should contain less information than Home. Calendar gains value through aggregation, pattern visibility, and capacity visibility, not detail density or event management.

Design direction:
- match Home and Plan
- use white space, typography, subtle indicators, and planner-style hierarchy
- avoid Google Calendar aesthetics, dashboard cards, heavy outlines, and dense scheduling interfaces
- keep the page introduction simple and planner-like; avoid dashboard titles, marketing copy, or motivational copy

Approved month indicators:
- `•` events
- `▲` workouts
- `■` projects
- `◦` routines

Indicators should stay subtle. Event titles should not appear inside month day cells.

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

Month rules:
- planner aesthetic
- lightweight
- minimal indicators
- no event titles inside day cells
- no dense calendar content
- no KPI widgets
- no dashboard cards
- compact enough that the Week section appears higher on the screen
- communicates patterns through indicators, not details

#### Capacity Visibility

Calendar should emphasize capacity states such as:
- open
- light
- steady
- full

Calendar should de-emphasize clock-first labels such as:
- 9:00
- 10:00
- 11:00

The user should be able to quickly identify where something can move.

#### Calendar V1 Implementation Scope

The first Calendar implementation may include:
- a month navigator labeled by month and year
- a planner-style month grid with subtle indicators only
- a Monday-Sunday weekly capacity view
- capacity labels: open, light, steady, full
- meaningful commitments only, with less detail than Home
- concise availability notes that explain capacity using approved existing sources
- understated capacity labels that read as planner metadata, not dominant badges

The first Calendar implementation must not include:
- drag/drop
- move workflows
- rescheduling
- event editing
- task editing
- calendar integrations
- recurring routine editors
- percentages
- utilization scores
- KPI metrics
- heat maps

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
Do not implement Calendar behavior beyond the approved read-only V1 scope until a future SPEC pass approves additional details.

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
- **Training card** — shows the current Equipment Profile as actual selected equipment, not access tiers. It should display selected equipment labels or `Bodyweight / no equipment selected` and route to training setup for edits. `equipmentProfile` is the source-of-truth setting. `gymAccess` is derived compatibility only for generator call sites that still require legacy access tiers.
- **Program card** — start date input → `UPDATE_FITNESS { key: 'programStartDate', value }` · goal date input → `UPDATE_FITNESS { key: 'programEndDate', value }`. Both ISO date strings or null.
- **Connections card** — Plaid (bank & spending) and Google Calendar rows. Stub `StubSheet` bottom-sheet explains V2 timeline.
- **About card** — shows app version, current training phase label (`PHASE_LABELS[getPhase(programStartDate, programEndDate)]`), and week number (`getWeekNumber(programStartDate)`).

---

### 5.8 Fitness (`'fitness'`)

**File:** `src/screens/Fitness.jsx`
**Props:** `onStartWorkout(workout)` — App.jsx manages global WorkoutPlayer overlay.
**Nav:** Shown (Fitness tab in bottom nav).

- **Header** — quiet planner label + "Training" title + Week N metadata. When `programEndDate` is set: quiet "X weeks to goal" line below (or "Goal week" when 0).
- **Selected day planner item** — Training is a planner commitment that can launch a workout, not a workout database or exercise library by default. The default selected-day view must show summary only: selected day, workout title, status, estimated duration, focus, and primary actions. Default visible exercise rows must be 0.
- **Workout details** — Warm Up / Main / Finisher / Cool Down are secondary detail groups only. They are hidden until `View Details` is tapped. Once visible, each group shows only a section summary and remains collapsed by default. Expanding a section reveals exercise rows. Preview mode may show at most 1-2 summary lines, but full sections must remain collapsed until the user expands them.
- **Primary actions** — `Start Workout` launches the global guided WorkoutPlayer. Completed current-day workouts may show Completed instead. Training must not duplicate WorkoutPlayer playback, timers, set logging, or execution controls.
- **Weekly strip** — quiet secondary week selector with day/date, workout type, status, and active-day state. Selecting a day updates the planner item below using the configured program and the new `workoutGenerator` path. Any selected scheduled non-rest workout should expose Start Workout so the WorkoutPlayer remains reachable from the planner item.
- **Journal** — last 5 entries from `fitness.workoutLog` (reverse order). Rows render date, workout focus, duration, completion marker, and RPE when present, e.g. `Jun 2 | Strength | 40 min | ● | RPE 6/10`. Use `Journal`, not History or Recent, for logged workout rows.
- Fitness owns the primary full workout experience. Health Today may mirror compact training status only and must not duplicate the full workout preview, weekly planner, or exercise details.
- Health → Training is allowed to show the selected day's generated workout before start. It should use the same generated workout data and the same planner-summary/detail helpers as Fitness. Health Training must open with the planner item only; workout structure appears only after `View Details`; Warm Up / Main / Finisher / Cool Down groups remain collapsed by default. This preview must not create a separate Health workout generator, separate workout state, or separate exercise-library surface.
- Health Training should read like planner commitments, not a standalone fitness app. The weekly strip should make day/date, workout type, status, and active day clear. The selected workout should prioritize title, status plus duration, focus, one primary action, and quieter secondary actions. Journal rows should stay compact planner rows, not a workout-history dashboard.
- Health architecture should use shared planner primitives for row, action, section-header, option-grid, and bottom-sheet patterns instead of Health-only duplicates. Health's route shell should stay thin: it renders one continuous planner page, owns sheet selection, and passes route actions into compact section summaries. Health should answer "what should I do today?" before "what Health features exist?" Its daily hierarchy is Training, Nutrition, Recovery, then Weekly Commitments as supporting navigation. Today, Training, Nutrition, Insights, setup, and logging flows should live in focused components/modules.

---

### 5.8b More (`'more'`)

**File:** light route owned by `App.jsx` or `src/screens/More.jsx`
**Nav:** Shown (More tab in bottom nav).

V1 may be a lightweight placeholder list. It should use existing routes when available and avoid building full new systems.

List entries:
- Nutrition — routes to `nutrition` when available.
- Projects — routes to `projects` when available.
- Finance — routes to `finance` when available.
- Insights — placeholder until analytics/insights exist.

Settings does not need to appear in More while it remains available in the Home top-right utility cluster beside Inbox.

---

### 5.8c Nutrition (`'nutrition'`) — V1C Definition

Nutrition V1C is Food Log Lite.

Purpose:
- What have I eaten today, and how does it compare to my calorie and macro targets?

Nutrition V1C should include:
- daily totals
- simple targets display
- meal slot sections: breakfast, lunch, snack, dinner
- add food manually
- saved foods / recent foods
- saved meals / repeat meals if simple
- edit/delete food entries

Nutrition V1C should remain:
- planner-style
- calm
- low-friction
- local-first
- manual
- non-judgmental

Nutrition V1C should avoid:
- dashboard-heavy design
- dense MyFitnessPal clone UI
- excessive charts
- coaching language
- judgment language
- barcode scanning
- photo recognition
- external food databases
- AI food estimates
- recipe library
- grocery generation

V1C information hierarchy:
1. Today totals
2. Meal slots
3. Saved/recent foods
4. Add food manually through contextual meal actions
5. Logged entries
6. Simple targets

Planner design alignment:
- Nutrition should render as a planner food log, not an admin form, settings page, SaaS screen, or MyFitnessPal clone.
- The main page should use the structure `nutrition` / `today` / daily totals / breakfast / lunch / snack / dinner / saved or recent.
- Daily totals should be compact rows such as `calories 0 / 1955`, not cards, charts, KPI blocks, or progress bars.
- Meal slots are the primary interaction surface and should use lowercase labels, subtle dividers, inline logged foods, and small contextual `add` actions.
- The manual food form should not be persistently visible on the main page. Tapping a meal's `add` action should open a focused bottom sheet, compact overlay, or inline expansion with that meal preselected.
- Saved foods and saved meals are secondary and should appear as compact or collapsed planner lists with lightweight add-again behavior.
- Empty states should be short planner text such as `nothing logged`, `no saved foods`, and `no saved meals`.
- Targets remain editable but should not turn the main Nutrition page into a configuration surface.

Home integration:
- Home Nutrition planner tab status should eventually derive from `NutritionContext.dailyLogs`.
- `○` = no logged nutrition today.
- `◐` = at least one meal slot logged.
- `☑` = all expected meal slots logged.
- Target completion should not drive Home Nutrition completion in V1C.
- Meal windows in Daily Flow should remain guidance blocks.
- Future: tapping a meal window can open Nutrition logging for that slot.

Navigation:
- Nutrition remains accessible from More in V1 unless product direction changes later.
- Home Nutrition planner tab routes to the Nutrition screen.
- Nutrition is not a bottom-nav tab in current V1.

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

WorkoutPlayer V1 is a guided workout playback system. It may reuse the visual language of the previous player, but the logic should be organized around safe step-by-step execution, not around patching the old segment UI.

WorkoutPlayer should follow the current Planner Design System as its primary visual reference, with the Tasks screen as its closest visual baseline. It should feel like App in My Life's newer planner-style surfaces, not an isolated early prototype or a heavy workout dashboard.

Visual direction:
- Keep the new playback system; do not revert normalized steps, first-class rest, phase-local progress, autoplay, resume, or safe Previous/Next/Exit behavior.
- Reduce heavy card stacking. The player should not feel like multiple boxed modules piled on top of each other.
- Make the video/GIF placeholder the primary visual anchor, integrated into the active playback surface rather than inserted as a utility block.
- Current exercise/rest/action is the clear primary focus.
- Phase progress and Next Up remain visible but quiet. They should orient the user without competing with the active movement.
- Equipment, substitutions, coach cues, and weight guidance belong in secondary expandable or visually quiet sections.
- Bottom playback controls remain persistent and simple: Previous, Pause/Resume, Next, and Autoplay On/Off must stay reachable.
- Use planner-style spacing, typography, dividers, and hierarchy. Avoid old quad/card-heavy styling.
- Use planner rows, divider lines, quiet uppercase structural labels, muted metadata, and simple persistent controls.
- Avoid dashboard cards, pills, tiles, chips, boxed metric modules, and heavy card stacks unless explicitly required for an alert or modal.
- The current exercise should be the primary text focus; equipment, swaps, coach cues, and weight guidance should appear as secondary inline rows or collapsible details, not separate cards.
- Uppercase labels are allowed in WorkoutPlayer only where they intentionally mirror Tasks-style structural labels.

Full-screen `position: fixed` overlay (`z-index: 150`). It normalizes `workout.segments[]` into executable phase steps and flows through those steps sequentially.

V1 priorities:
1. Safe playback controls.
2. Phase-structured workout execution.
3. Separate action steps.
4. First-class rest steps.
5. Media-ready exercise metadata.
6. Equipment-aware generation.
7. Programming quality.
8. Logging improvements.

Playback controls:
- Previous — always available after the first executable step; returns to the previous step without losing entered set data.
- Next — always available; moves forward or opens the post-workout log on the last step.
- Pause / Resume — pauses timed and rest countdowns without leaving the workout.
- Exit — closes the overlay through `onClose()`; users must never be trapped after tapping forward.
- Autoplay On / Off — controls whether completed timed/rest steps advance automatically. Autoplay defaults to on for rest and timed steps.
- Resume Workout — if the same workout is reopened during the same app session, the player should restore the current step, elapsed/rest time, autoplay setting, paused state, and entered set rows where available.

Execution structure:
- Workouts are organized by phases: `warmup`, `main`, `finisher`, and `cooldown`.
- `core` may appear as its own generated section, but playback should treat it as part of the main training block unless a future spec creates a separate phase.
- The top progress label shows progress within the current phase, e.g. `MAIN 3 of 7`, not total workout segments.
- The visible progress label should read naturally in Title Case, e.g. `Warm-Up 2 of 6`, `Main 1 of 3`, or `Cool Down 1 of 4`.
- Progress dots may remain global as secondary orientation, but phase progress is primary.
- Every action is its own executable step. Instruction text such as `30 seconds each leg` or `45 seconds each side` must be expanded into separate left/right or side-specific timed steps when possible.
- Rest is a first-class step with its own label, countdown, media placeholder state, Previous/Next behavior, and autoplay behavior. Rest must not be hidden only in notes or inside set rows.

Step shape:
```js
{
  id: string,
  phase: 'warmup' | 'main' | 'finisher' | 'cooldown',
  type: 'timed' | 'sets_reps' | 'rest' | 'text',
  name: string,
  duration?: number,
  instruction?: string,
  exerciseId?: string,
  sets?: number,
  reps?: number,
  repRange?: string,
  repUnit?: string,
  media?: {
    kind: 'video' | 'gif' | 'image' | 'placeholder',
    src: string | null,
    poster?: string | null,
    alt: string,
  },
  equipmentNeeded?: string[],
  sourceSegmentIndex?: number,
}
```

**Segment kinds:**

| Kind | Renderer | Behavior |
|---|---|---|
| `timed` | `TimedSegment` | Countdown against target duration; pause/resume aware; can autoplay to next step when complete |
| `text` | `TextSegment` | Static planner step with name + instruction detail |
| `sets_reps` / `exercise` | `ExerciseSegment` | Set rows (tap to mark done); set data persists while navigating previous/next |
| `rest` | `RestSegment` | First-class countdown step with skip/next and autoplay behavior |

**Next Up:** during execution, show the upcoming segment/exercise beneath the header or current timer. It should include the next name, sets/reps or duration, and equipment needed. If there is no upcoming segment, show a quiet finish-state label.

**Equipment preview:** workout segments may expose `equipmentNeeded[]`, derived from exercise metadata and helper mappings. Examples include `bench`, `dumbbells`, `cable machine`, `rack`, `barbell`, `pull-up bar`, `bodyweight`, and `running shoes`. The preview should remain compact planner metadata, not a large checklist.

**Workout journal:** exercise segments render one row per planned set. Each row shows planned reps, allows actual reps and weight entry, and toggles complete/incomplete when tapped. Toggling a completed set off preserves entered reps, weight, and notes. Actual reps may differ from planned reps and should default to the planned reps when first completed.

**Rest timer:** rest is a full playback step, not a small pill. When rest is active, render a large countdown with a secondary skip/next control. Rest participates in Previous, Next, Pause, Resume, and Autoplay exactly like other playback steps.
Rest should render its own `Next: [actual next exercise]` detail when the next exercise is known.

**Side-based movements:** unilateral movements should clearly communicate side behavior. For reps, show explicit `each side` instructions when applicable. Timed side-based work must use separate left/right timers or clearly labeled per-side timing instead of burying `each side` in instruction text.

**Media support:** every generated exercise/timed step should support a `media` placeholder. V1 may render a static placeholder, but the data shape must allow video, GIF, poster images, and alt text without another workout schema rewrite.

**Ladder-style execution layer:** after the basic playback controls are stable, WorkoutPlayer may add lightweight execution affordances without changing the saved workout schema:
- Autoplay toggle should be visible and readable as `Autoplay On` / `Autoplay Off`.
- The video/GIF placeholder area should stay visible as a future media slot.
- Coach cues from exercise metadata should surface during exercise playback as short scannable cues, but should remain collapsed or visually quiet behind secondary detail.
- Equipment-compatible substitutions may be shown as compact swap options in secondary detail. Choosing a substitution should preserve the current prescription and set-row structure while logging the substituted exercise name/id.

**Follow-up task:** Align Workout Player with planner-style design system.

Acceptance criteria:
- Uses the newer planner-style layout as the design reference.
- Removes old quad/card-heavy styling from player.
- Current exercise is the clear primary focus.
- Video placeholder is visually integrated.
- Secondary details are collapsed or visually quiet.
- Bottom playback controls remain persistent.
- Autoplay remains available.
- Phase progress remains visible but not dominant.

**Post-workout log:** (`PostWorkoutLog`) — elapsed timer, 5-emoji feel selector, workout-level RPE 1-10 selector, notes textarea, "Save workout" → calls `onComplete({ date, type, title, duration, feel, rpe, notes, exercises[], sets[] })`. App.jsx dispatches `LOG_WORKOUT` and clears `activeWorkout`.

Saved `sets[]` entries include `{ exercise, exerciseId, setNumber, plannedReps, reps, weight, rpe, note }`. `reps` is the actual completed rep count. Blank weight saves as `0`. Existing older set entries without `exerciseId`, `setNumber`, or `plannedReps` remain valid history.

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

### AIML Training Generator V1

AIML's V1 training generator is a planner-first coaching system, not a generic exercise picker.

It should generate workouts from:
- program type
- days per week
- equipment profile
- movement patterns
- session purpose
- duration
- recovery needs
- exercise mapping
- executable workout playback steps

Training program language:
- Programs are broad training styles, not race brands.
- Program options are Strength, Running, Hybrid Training, Mobility / Recovery, General Fitness, and Custom.
- AIML uses "Hybrid Training" as the general conditioning/strength-endurance program language.
- AIML must not use race-brand-specific language in default setup, navigation, workout cards, player labels, generator names, or equipment setup.
- Race/event-specific language may only appear if a future event-goal feature is explicitly enabled by the user.
- Do not use HYROX, HYROX equipment, HYROX simulation, HYROX stations, a HYROX-specific generator, or race prep as default product language.

Supported V1 training lanes:
- `strength` — strength, muscle, body composition, joint health; roughly 80% strength and 20% conditioning/recovery.
- `hybrid` — Hybrid Training: strength, conditioning, athleticism, and work capacity; roughly 60% strength and 40% conditioning.
- `running` — aerobic capacity, running performance, and injury-risk reduction; roughly 70% running and 30% strength/mobility.
- `mobility_recovery` — movement quality, low-intensity movement, core stability, and downshift work.
- `general` — balanced general fitness using simple strength, conditioning, running, and recovery defaults.
- `custom` — user-authored or manually configured training rhythm.

Equipment profiles:
Equipment setup is a general profile setting for all generated workouts. It must not be race-specific. FitnessSetup, Health setup, and Settings use the same `equipmentProfile` contract: an array of actual equipment values selected by the user. User-facing equipment choices are `dumbbells`, `barbell`, `bench`, `squat_rack`, `cable_machine`, `treadmill`, `rower`, `ski_erg`, `sled`, `resistance_bands`, `kettlebells`, and `medicine_balls`.

Programs and equipment are separate concepts. Program options remain Strength, Running, Hybrid Training, Mobility / Recovery, General Fitness, and Custom. Equipment should not be presented as program choice or as primary access-tier cards.

Legacy access values may remain only as migration inputs or internal compatibility values:
- `bodyweight` — maps to an empty equipment profile.
- `dumbbells` — maps to dumbbells and resistance bands.
- `home_gym` — maps to reasonable home equipment defaults: dumbbells, barbell, bench, squat rack, cable machine, resistance bands, and kettlebells.
- `full_gym` / legacy `gym` — maps to the full actual equipment list.

`gymAccess` is derived from `equipmentProfile` only for generator compatibility. If it remains persisted for now, every write to `equipmentProfile` must also update `gymAccess` through the shared `equipmentToGymAccess()` helper so the two values cannot drift. Sled, rower, ski erg, wall ball, farmer handles, and treadmill are equipment or exercise options only, not program categories.

Movement-pattern selection must happen before exercise selection. Primary patterns include horizontal push, vertical push, horizontal pull, vertical pull, squat, and hinge. Secondary patterns include unilateral, glute dominant, carry, conditioning, and core. Strength, hybrid, and mobility/recovery sessions must include actual core work, prioritizing anti-extension, anti-rotation, and lateral-stability core before flexion.

Program structures:
- Strength 3 days: Full Body A, Full Body B, Full Body C.
- Strength 4 days: Upper A, Lower A, Upper B, Lower B.
- Strength 5 days: Upper A, Lower A, Full Body, Upper B, Lower B. This is the preferred strength split for 5 days per week.
- Hybrid 3 days: Full Body, Run, Full Body.
- Hybrid 4 days: Upper, Lower, Run, Full Body.
- Hybrid 5 days: Upper, Lower, Run, Full Body, Mobility.
- Running 3 days: Run, Run, Run.
- Running 4 days: Run, Run, Run, Run.
- Running 5 days: Run, Run, Run, Run, Run.
- General Fitness uses the Hybrid Training structure as a balanced default unless the user customizes days.
- Custom uses user-selected day types without implying a generated race program.

Duration rules:
- 30 minutes: 4-5 movements, 2-3 sets, one core movement, minimal accessories.
- 45 minutes: 5-7 movements, 3-4 working sets on main lifts, 1-2 core/accessory movements.
- 60 minutes: 6-8 movements, full structure, 1-2 core movements, optional finisher.

Mobility/recovery sessions may be standalone, used inside other lanes, or recommended when recovery is poor. Mobility sessions should stay easy (`RPE 2-4/10`) and should not feel like workouts.

Generated workout output should expose:
- `id`, `title`, `type`/`dayType`, `focus`, `durationEstimate`/`estimatedMinutes`, `status`, and `segments[]`.
- Segment sections: `warmup`, `main`, `core`, `finisher`, and `cooldown` where relevant.
- Exercise metadata: `exerciseId`, `name`, `tier`, `movementPattern`, `muscleGroup`, `equipment`, `sets`, `reps` or `duration`, side instruction when unilateral, `cues`, and notes/load guidance.
- Media placeholder metadata for each generated executable step.
- First-class rest steps before playback when rest is needed between actions.

Quality rules:
- Strength workouts include a primary movement, secondary movement, accessory, and core.
- Upper days include push and pull unless specifically labeled push-only.
- Lower days include squat, hinge, unilateral, glute, and core.
- Full-body days include squat, hinge, push, pull, and core.
- Hybrid days include strength and conditioning.
- Running days include warm-up, main run segment, and cool-down.
- Mobility days remain low intensity.
- Core should appear intentionally across the week: anti-rotation, carries, planks, dead bugs, hollow holds, and trunk-stability work should be represented by templates rather than random filler.
- Avoid duplicate exercises and avoid stacking too many similar movements in short sessions.
- Default strength days should not be only four main movements unless duration is 30 minutes or less.
- Home Gym should use barbell/cable options where appropriate.

Acceptance criteria:
- A 45-60 minute strength workout feels like a real training session.
- Most strength workouts generate 5-8 total movements.
- Warm-up and cool-down are secondary.
- The main workout has hierarchy.
- Core appears intentionally, not randomly.
- Home Gym users get barbell/cable/dumbbell programming.
- Running workouts use structured run segments.
- Hybrid workouts combine strength and conditioning.
- Recovery workouts are easy, restorative, and not mislabeled workouts.
- Training preview answers: "What am I doing today?"
- WorkoutPlayer answers: "What am I doing right now?"
- No user-facing HYROX language remains.
- Program setup shows Hybrid Training, not HYROX.
- Equipment setup is general and not race-specific.
- Generator names and comments avoid race-brand assumptions where practical.
- Existing stored `hyrox` values migrate safely to `hybrid`.
- Tests use Hybrid Training naming rather than race-brand naming.

Do not make AIML a generic fitness app. Build it as a planner-first training system with enough coaching structure to feel intentional, safe, and useful.

### `generateWorkout(config)` — `src/utils/workoutGenerator.js`

**Config shape:**
```js
{
  dayType:          string,  // from programConfig.dayTypes
  equipment:        string,  // 'bodyweight' | 'dumbbells' | 'home_gym' | 'full_gym' | legacy 'gym'
  phase:            string,  // from getPhase() (default: 'base')
  weekInPhase:      number,  // 1–4 (default: 1)
  history:          object,  // raw fitnessState.workoutLog[] (default: [])
  mobilityDuration: number,  // 20 | 30 | 40 (default: 30)
  durationMinutes:  number,  // 30 | 45 | 60 (default: lane/session fallback)
}
```

`generateTrainingProgram(config)` may be used when a weekly structure is needed:
```js
{
  programType: 'strength' | 'hybrid' | 'running' | 'mobility_recovery' | 'general' | 'custom',
  daysPerWeek: 3 | 4 | 5,
  equipment: string,
  durationMinutes: 30 | 45 | 60,
  phase: string,
  weekInPhase: number,
  history: object[],
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

WorkoutPlayer accepts these new `type` values as the primary shape. It may defensively tolerate the deprecated `kind: 'timed' | 'exercise' | 'text'` segments until all older call sites are removed.

Before playback, segments should be normalized into guided executable steps:
- grouped under phases `warmup`, `main`, `finisher`, `cooldown`
- side-based timed work expanded into separate steps
- rest inserted as `type: 'rest'` steps after set-based work when another action follows in the same phase
- media placeholders attached to every step
- equipment metadata carried forward from segment/exercise metadata

Workout quality rules:
- If a workout title or focus includes `Core`, the generated workout must include at least one explicit core segment.
- Upper + Core, Lower + Core, and Run + Core variants should add a core accessory/finisher instead of relying only on compound lifts that happen to involve core stabilization.
- Strength workouts must be generated from templates, not broad random exercise shuffles. Templates define movement-pattern slots and varied prescriptions; exercise variety comes from choosing library exercises that satisfy each slot.
- Upper template: primary push, primary pull, shoulder/rear-delt balance, arm/accessory work, and 1–2 core movements; target 6–8 main movements.
- Lower template: primary squat, primary hinge, unilateral movement, glute movement, accessory, and 1–2 core movements; target 6–8 main movements.
- Full Body template: squat, hinge, push, pull, carry or conditioning, and core; target 5–7 main movements.
- Prescriptions should vary by role instead of stamping every exercise as the same sets and reps: primary compounds use heavier lower-rep work, secondary/accessory movements use moderate or higher reps, and timed core can use duration targets.
- Health → Training is a planner commitment and workout preview, not an execution surface. It should show the selected workout as a planner item first (`Tue, Jun 2`, `Upper Body`, `○ Planned`, `45 min`, `Upper focus`). Warm Up / Main / Finisher / Cool Down are detail groups only, hidden until `View Details`, and collapsed by default once visible. Do not show full exercise lists by default, repetitive metadata tables, or repeated equipment on every row when all movements use the same equipment category.

Warm-up and cool-down selection must match workout type:
- `upper` uses upper-body activation/recovery.
- `lower` uses lower-body activation/recovery.
- `full_body` uses full-body activation/recovery.
- `run`, `run_easy`, `run_tempo`, and `run_long` use running prep and walking/jogging cool-down.

**Routing by dayType:**
- `run | run_easy | run_tempo | run_long` → `buildRunWorkout`
- `upper | lower | full_body` → `buildStrengthWorkout`
- `mobility` → `buildMobilityWorkout`
- `custom`, `rest`, or unknown → `{ segments: [], estimatedMinutes: 0 }`

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

### Nutrition V1C food logging
Used in the future Nutrition screen or logging flow.
- Add manual food entry: choose meal slot, enter food name, calories, protein, carbs, and fat.
- Add from saved food: choose a saved/recent food, optionally choose meal slot, then add it to today's log.
- Add saved meal: choose a saved/repeat meal, optionally choose meal slot, then add its entries to today's log.
- Edit logged entry: update name, meal slot, calories, protein, carbs, or fat.
- Delete logged entry: remove the entry from today's log.
- Save food for reuse: after logging a food, offer an optional explicit save action.
- Meal slot logging: a meal slot counts as logged when at least one nutrition entry exists for that slot on the current date.
- Manual food logging should not auto-save foods to the saved list.
- Nutrition logging should not alter `DayContext.meals` meal windows directly.
- Home meal windows may later route into this flow with the slot preselected.

---

## 7. Navigation & Routing

**Pattern:** `useState`-based screen switcher in `App.jsx` — no router library.

**Screen values:** `'ignition'` · `'home'` · `'plan'` · `'calendar'` · `'tasks'` · `'fitness'` · `'more'` · `'nutrition'` · `'focus'` · `'inbox'` · `'finance'` · `'projects'` · `'settings'`

**Bottom nav** (`src/App.jsx`):
- 60px height, `#1A1A14` bg, `0.5px` top border
- Tabs come from `getEnabledNavTabs(settings.modules)`: Calendar, Tasks, Home, Health, Finance. Home remains centered.
- Inbox is removed from bottom navigation and remains globally accessible from the shared top-right module utility cluster beside Settings.
- Finance remains a standard module route and may also be reachable from secondary navigation surfaces.
- Active: label + icon color → `#C17B56`, small 4px pip dot below icon
- Fixed to bottom of the 393px column, `z-index: 100`
- Hidden by `navigation/router.js` for `fitness-setup`, `settings`, `ignition`, `focus`, `eod`, and `weekly`. The current route map shows nav on `calendar`, `tasks`, `home`, `health`, `fitness`, `more`, `nutrition`, `projects`, and `finance`.

**Persistent module utilities** (`src/App.jsx`):
- Inbox and Settings appear as shared top-right utility actions on standard app modules: Home, Calendar, Tasks, Health, direct Fitness, Nutrition, Plan, More, Projects, and Finance.
- Health renders one continuous planner page rather than a nested tabbed sub-app; daily Training, Nutrition, and Recovery sections come before Weekly Commitments and lightweight Insights. The shared utility actions remain visible on the Health route.
- The actions use the same quiet circular icon-button treatment established by the Home header.
- Do not duplicate these actions manually inside every sub-screen when the shared app shell can render them.
- Do not show these actions on full-screen or focused execution surfaces: Morning Ignition, Focus Timer, Fitness Setup, EOD Reflection, Weekly Planning, Settings, Inbox, or any active WorkoutPlayer overlay.
- WorkoutPlayer is a full-screen guided execution mode and should keep only workout execution controls.

**Global overlays** (rendered above nav in `App.jsx`):
- `WorkoutPlayer` (z-index 150): shown when `activeWorkout !== null`; cleared on save or close

**Screen transitions triggered by props:**

| From | To | Trigger |
|---|---|---|
| `ignition` | `home` | `onComplete()` inside MorningIgnition Step 3 |
| any standard module | `inbox` | Inbox icon in the shared top-right module utility cluster |
| any standard module | `settings` | Settings icon in the shared top-right module utility cluster |
| `home` | `plan` | Plan tab in the Home planner status bar |
| `home` | `focus` | `onOpenFocus()` prop |
| `home` | `projects` | `onNavigate('projects')` via focus-project goal card tap |
| `settings` | `home` | `onBack()` prop |
| `focus` | `home` | `onClose()` prop |
| `projects` | `home` | `onBack()` prop |
| `more` | `projects` / `finance` | More list row tap when the screen exists |
| `home` | `nutrition` | Nutrition tab in the Home planner status bar |
| `more` | `nutrition` / `projects` / `finance` | More list row tap when the screen exists |
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
- Calendar screen: read-only week-first capacity planner with lightweight month navigator
- Tasks screen: committed actions grouped by Today, Upcoming, Unscheduled, and Done using existing task state
- Focus Timer full implementation (ring, presets, session tracking)
- Inbox capture + triage; "Task" button dispatches ADD_TASK with green flash confirmation
- Finance screen with local transaction data, manual add/delete, Plaid connection stub, and read-only summary selectors
- Settings screen: profile name, equipment toggle, Plaid/Calendar connection stubs
- Fitness tab: Today's Training card, weekly strip, recent workout log
- Nutrition V1C: local-first manual food log with targets, meal-slot entries, saved foods, and simple saved meals
- WorkoutPlayer: full segment flow + post-workout log (feel, notes, saves to fitness.workoutLog)
- 26-week training block: generateWorkout utility with phase-aware exercise selection
- Fuel slot time editing via FuelEditSheet bottom sheet (iOS-safe native time inputs)
- LocalStorage persistence with eight domain keys and daily reset scoped to DayContext
- PWA manifest + GitHub Pages deploy

**Module defaults in V1:** `settings.modules.fitness`, `settings.modules.finance`, and `settings.modules.focus` default to enabled. `nutrition`, `goals`, `reflection`, `habits`, and `sleep` default to disabled. App nav uses the fixed order Calendar, Tasks, Home, Health, Finance. Inbox and Settings are persistent shared module-header utilities on standard app modules. Finance and Projects are reachable from standard navigation surfaces when their routes are available. Home keeps Daily Flow, task tally, and planner status available regardless of module flags.

### Deferred (V2+)

- **Real Plaid API** integration (read-only transaction sync)
- **V2 Twilio SMS pipeline** — finance spend alerts via SMS (stub comment in Finance.jsx)
- **Runna API** integration (live workout data instead of mock)
- **Google Calendar** integration (inbox "→ Calendar" action)
- **Nutrition barcode scanning**
- **Nutrition photo logging / photo recognition**
- **Nutrition AI food recognition or estimates**
- **External nutrition food database**
- **Macro trend reports**
- **Nutrition meal plan generator**
- **Nutrition recommendations / coaching**
- **Nutrition recipe library**
- **Nutrition grocery generation**
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
| 14b-iv | Hybrid Training product language cleanup | ✅ Done | `SPEC.md` (broad training-style language rule), `src/utils/fitnessMigration.js` + `src/context/FitnessContext.jsx` (schema v3 and legacy value normalization), `src/screens/FitnessSetup.jsx`, `src/screens/Health.jsx`, `src/screens/Fitness.jsx`, `src/screens/Settings.jsx`, `src/screens/Plan.jsx`, `src/utils/workoutGenerator.js`, tests |
| 15 | Calendar V1 read-only capacity planner | ✅ Done | `src/screens/Calendar.jsx`, `src/App.jsx`, `SPEC.md` |
| 16 | Tasks V1 committed-actions surface | ✅ Done | `src/screens/Tasks.jsx`, `src/App.jsx`, `SPEC.md` |

**Live URL:** https://lexthe-creator.github.io/verbose-octo-robot/
