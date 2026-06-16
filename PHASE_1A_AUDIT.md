# AIML Phase 1A - Planner Authority Audit

## Status

Phase 1A is currently stopped at the implementation gate.

The component inventory below proves that the existing BottomSheet and SwipeRow
implementations are not all functionally equivalent. Per the Phase 1A stop
gate, consolidation requires approval before any consumer migration changes
behavior, animation, thresholds, close behavior, accessibility behavior, or
screen hierarchy.

## Three-Role Review

### Senior Product Designer Review

Critical:
- Bottom sheets use different surface language across PlannerPrimitives,
  Nutrition, Finance, Settings, and Fuel editing.
- Swipe patterns use different visual treatments, directions, thresholds, and
  confirmation affordances across planner flows.

High:
- Tasks and Calendar already establish the planner baseline, but Finance still
  reads as a dashboard surface. Finance redesign is out of scope for Phase 1A.
- Planner-like screens still carry local section headers, action rows, and row
  treatments that should eventually be unified under PlannerPrimitives.

Medium:
- Health is closer to the intended primitive model than most screens, but the
  route still needs product-boundary documentation because it can read like a
  standalone Health app.

Low:
- Several icon-only or gesture-backed controls need stronger accessible names
  and clearer keyboard equivalents in a future migration.

### Senior Product Manager Review

Critical:
- Shared component work must not change ownership of actions. Sheets and swipe
  rows can be migrated only when the same user workflow remains intact.

High:
- Finance must not be planner-redesigned in this phase. KPI cards, charts,
  summaries, dashboard hierarchy, and financial information architecture are
  deferred to a Finance-specific phase.
- Health structural changes are out of scope. Health findings in Phase 1A are
  documentation-only and should become future Health boundary work.

Medium:
- Plan remains review plus lightweight adjustment, not a full management
  workspace. Any broader authority change would conflict with Tasks, Calendar,
  Projects, and Training.

Low:
- Responsibility documentation should name where actions should not exist so
  future screens do not duplicate capture, planning, or execution.

### Senior Frontend Engineer Review

Critical:
- Current sheet shells duplicate backdrop, z-index, animation, close, and
  spacing logic.
- Current swipe rows duplicate gesture logic with different thresholds,
  directions, auto-delete behavior, mouse support, and completion semantics.

High:
- `src/components/planner/PlannerPrimitives.jsx` is the right authority module,
  but it does not yet expose the full planned API: PageHeader, SectionHeader,
  PlannerRow, ActionGroup, BottomSheet, SwipeRow, and EmptyState.
- Existing `PlannerBottomSheet` is not functionally equivalent to animated
  local sheets because it lacks slide-in/out state and backdrop-close behavior.

Medium:
- Some local primitives are coupled to screen-specific state or markup and
  should be migrated only after extracting behavior-preserving props.

Low:
- Dead-code risk is high unless migrations remove local definitions, obsolete
  styles, imports, and exports in the same pass.

### Cross-Review Challenge

Designer challenges PM:
- Planner consistency is important, but Finance visual hierarchy cannot be
  simplified under Phase 1A without becoming a redesign.

PM challenges Designer:
- Health should not be restructured even if the route shape feels imperfect.
  Phase 1A may document the concern but must not move sections or change user
  paths.

Engineer challenges Designer and PM:
- A shared primitive is not safe until equivalent behavior is proven. Current
  sheets and swipes are similar in concept, but several differ in meaningful
  interaction details.

Final agreed scope:
- Documentation and authority rules are safe now.
- Primitive API definition is safe now.
- Consumer migration is not safe until each non-equivalent delta is approved.
- Finance and Health redesigns are rejected for Phase 1A.

## Stop Gate - Component Inventory

### BottomSheet Implementations

| Implementation | File location | Consumers | Behavioral differences | Accessibility behavior | Migration risk |
|---|---|---|---|---|---|
| `PlannerBottomSheet` | `src/components/planner/PlannerPrimitives.jsx` | `PlanSetupSheet`, `LogWorkoutSheet` in `src/screens/health/HealthSheets.jsx` | Fixed bottom sheet, no enter/exit animation, no backdrop click close, z-index 180, planner background and border. | Visible title and close button. No `role="dialog"`, `aria-modal`, Escape close, focus trap, or labelled-by wiring. | Low for Health because it already consumes this primitive. Medium as a target because accessibility and animation must be added without breaking Health. |
| `FuelEditSheet` | `src/components/FuelEditSheet.jsx` | `MorningIgnition.jsx` meal window editor | Own opacity and slide animation, backdrop click close, delayed save/close callback, z-index 200, card background, rounded top corners, two native time inputs. | Labels for inputs are visible. No dialog role, aria-modal, Escape close, focus trap, or explicit heading association before migration. | Migrated in Phase 1E after save timing, close timing, backdrop behavior, animation, z-index, and native time input parity were proven. Local animation/backdrop/sheet shell removed. |
| `Nutrition` local `BottomSheet` | `src/screens/Nutrition.jsx` | Add food, edit food, save meal, add saved food, add saved meal, targets | Similar static sheet shell to PlannerBottomSheet, z-index 180, no animation, no backdrop close, multiple forms reuse one local shell. | Visible title and close button. No dialog role, aria-modal, Escape close, focus trap, or labelled-by wiring before migration. | Migrated in Phase 1B after shared style hooks preserved shell parity. Local implementation and orphaned styles removed. |
| `Finance` `TransactionSheet` | `src/screens/Finance.jsx` | Add transaction flow | Own opacity and slide animation, backdrop click close, delayed close after save, z-index 200, rounded card surface, finance-specific form controls. | Visible labels. No dialog role, aria-modal, Escape close, focus trap, or heading association before migration. | Migrated in Phase 1F after animation, save/cancel/delete timing, backdrop behavior, Escape behavior, z-index, form state, validation, and layout parity were proven. Local animation/backdrop/sheet shell removed. |
| `Settings` `StubSheet` | `src/screens/Settings.jsx` | Plaid and Google Calendar connection stubs | Own opacity and slide animation, backdrop click close, delayed close, z-index 200, rounded card surface. | Visible title/body/close. No dialog role, aria-modal, Escape close, focus trap, or heading association before migration. | Migrated in Phase 1D after shared animation, backdrop-close, delay, z-index, and layout override parity were proven. Local implementation and orphaned shell styles removed. |

BottomSheet stop-gate conclusion:
- The implementations are not fully equivalent.
- `PlannerBottomSheet` can become canonical only after approved deltas for
  animation, backdrop-close, close timing, accessibility, and z-index behavior.
- No BottomSheet consumer migration should begin without approval of those
  deltas.

Phase 1B decision:
- `PlannerBottomSheet`: adapt shared primitive first. Added dialog semantics and
  style override hooks without adding animation, backdrop close, Escape close,
  or any new workflow.
- `Nutrition` local `BottomSheet`: migrate now. This was the only equivalent
  static sheet shell: no animation, no backdrop close, z-index 180, and the same
  Nutrition workflows. The local implementation and orphaned styles were
  removed.
- `FuelEditSheet`: defer. It has unique animation, backdrop-close, delayed
  save/close callback, native time inputs, and z-index behavior.
- `Finance` `TransactionSheet`: defer. It has unique animation, backdrop-close,
  delayed close after save, and Finance-specific form behavior. Finance
  redesign remains rejected.
- `Settings` `StubSheet`: defer. It has unique animation, backdrop-close, and
  delayed close behavior.

Phase 1C missing capability review:

| Implementation | Missing shared capabilities before Phase 1C | Phase 1C decision |
|---|---|---|
| `FuelEditSheet` | Enter/exit slide animation, backdrop opacity animation, backdrop click close, 250ms delayed close/save callbacks, z-index 200 variant, rounded card-surface variant, callback-safe close helper for saving after the exit transition. | Adapt shared primitive first. Generic capabilities were added, but consumer migration is deferred until parity is proven for native time inputs and delayed `onSave(start, end)`. |
| `Finance` `TransactionSheet` | Enter/exit slide animation, backdrop click close, delayed close after save, z-index 200 variant, rounded card-surface variant, callback-safe close helper, and support for keeping Finance-specific form controls entirely inside the consumer. | Adapt shared primitive first. Generic capabilities were added, but migration is deferred because Finance behavior must be proven without redesigning KPI cards, charts, hierarchy, transaction form behavior, or save validation. |
| `Settings` `StubSheet` | Enter/exit slide animation, backdrop click close, 250ms delayed close, z-index 200 variant, rounded card-surface variant, and support for a simple title/body/action layout without changing visible copy or close flow. | Adapt shared primitive first. Generic capabilities were added, but migration is deferred until the wrapper can preserve the current stub layout exactly. |

Phase 1C shared `PlannerBottomSheet` capability expansion:
- Added optional `animated` entry/exit support using shared planner sheet
  keyframes.
- Added configurable `closeDelayMs` so local 250ms close/save timing can be
  preserved.
- Added optional `closeOnBackdrop` and `closeOnEscape` without changing current
  default behavior.
- Added optional `zIndex` and continued style override hooks for card-surface
  variants.
- Added a render-function child API that receives `close`, allowing future
  consumers to run save callbacks after the shared exit transition.

Phase 1C migration decision:
- No additional consumer migrated. The shared primitive now supports the
  missing generic capabilities, but Fuel, Finance, and Settings still require a
  parity proof in their consumer wrappers before the local implementations can
  be removed.
- SwipeRow was not touched.
- Finance redesign remains rejected.
- Health structural changes remain rejected.

Phase 1D Settings parity review:
- Existing behavior: Plaid and Google Calendar connection rows open a
  bottom-aligned sheet with a 250ms opacity/slide animation, backdrop click
  close, full-width `Close` action, z-index 200, card background, 20px rounded
  top corners, unchanged title/body copy, and delayed close callback.
- Shared capability match: `PlannerBottomSheet` supports `animated`,
  `closeDelayMs={250}`, `closeOnBackdrop`, `zIndex={200}`, style overrides for
  the card surface, and render-function children that can call the shared
  delayed `close` helper.
- Parity result: approved for migration. The migration preserves Settings
  layout, content, controls, and workflows. The only accessibility delta is an
  improvement from shared dialog semantics and heading association.

Phase 1D migration decision:
- `Settings` `StubSheet`: migrate now. Local animation/backdrop/sheet shell
  removed; Settings now consumes `PlannerBottomSheet` with Settings-specific
  style overrides and unchanged Plaid/Calendar copy.
- `FuelEditSheet`: still deferred.
- `Finance` `TransactionSheet`: still deferred; Finance redesign remains
  rejected.
- SwipeRow: untouched.
- Health structure: untouched.

Phase 1E FuelEditSheet parity review:
- Existing behavior: Morning Ignition meal-window editing opens a bottom-aligned
  sheet with 250ms opacity/slide animation, backdrop click close, z-index 200,
  rounded card surface, two native `type="time"` inputs, full-width `Save
  window`, full-width transparent `Cancel`, delayed close callback, and delayed
  `onSave(start, end)` without separately calling `onClose`.
- Shared capability match: `PlannerBottomSheet` supports `animated`,
  `closeDelayMs={250}`, `closeOnBackdrop`, `zIndex={200}`, card-surface style
  overrides, and render-function children that can call `close(() =>
  onSave(start, end))` after the exit transition.
- Escape behavior: existing `FuelEditSheet` did not close on Escape. Migration
  keeps `closeOnEscape` disabled, so Escape behavior does not change.
- Content/layout parity: native time inputs, labels, button labels, button
  order, callback ownership, z-index, backdrop color, sheet width, padding,
  safe-area padding, rounded top corners, and action spacing are preserved.
  The only accessibility delta is an improvement from shared dialog semantics
  and heading association.

Phase 1E migration decision:
- `FuelEditSheet`: migrate now. The component remains the same consumer-facing
  API, but its local animation/backdrop/sheet shell now comes from
  `PlannerBottomSheet`.
- Local FuelEditSheet `useEffect`, `requestAnimationFrame`, `visible` state,
  local timeout close shell, and obsolete backdrop/sheet transition styles were
  removed.
- `Finance` `TransactionSheet`: still deferred; Finance redesign remains
  rejected.
- SwipeRow: untouched.
- Health structure: untouched.
- Workout behavior: untouched.

Phase 1F Finance TransactionSheet parity review:
- Existing behavior: `+ Add` opens a bottom-aligned transaction sheet with
  250ms opacity/slide animation, backdrop click close, z-index 200, card
  background, 20px rounded top corners, full-width merchant/category/date/save
  layout, and delayed close after save.
- Save timing: valid save dispatches `ADD_TRANSACTION` immediately, then closes
  after the same 250ms shell exit delay. Invalid save still does nothing and
  leaves the sheet open.
- Cancel timing: there is no visible cancel or close control in the Finance
  transaction sheet; backdrop close remains the only cancel path and keeps the
  250ms delayed close.
- Delete timing: transaction deletion is owned by `TxRow`, not
  `TransactionSheet`; Phase 1F does not touch swipe/delete behavior.
- Backdrop behavior: backdrop click closes; clicks inside the sheet do not
  propagate.
- Escape behavior: existing Finance sheet did not close on Escape. Migration
  keeps `closeOnEscape` disabled, so Escape behavior does not change.
- Form state behavior: merchant, amount, Spend/Income, category, and date state
  remain local to `TransactionSheet` and reset on a new mount exactly as before.
- Validation behavior: save still requires `merchant.trim()` and `amount`; the
  button opacity still reflects validity; no validation copy or disabled
  semantics were added.
- Layout requirements: Finance KPI cards, weekly chart, summary cards,
  transaction hierarchy, `TxRow`, and reducer behavior are unchanged. Only the
  sheet shell migrates.
- Shared capability match: `PlannerBottomSheet` supports `animated`,
  `closeDelayMs={250}`, `closeOnBackdrop`, `zIndex={200}`, card-surface style
  overrides, hidden close control styling, and render-function children that can
  call the shared delayed `close` helper after `ADD_TRANSACTION`.
- Parity result: approved for migration. The only accessibility delta is an
  improvement from shared dialog semantics and heading association.

Phase 1F migration decision:
- `Finance` `TransactionSheet`: migrate now. Finance-specific form controls,
  validation, save payload shape, local state, dashboard layout, KPI cards,
  chart, summaries, and transaction hierarchy are preserved.
- Local Finance `TransactionSheet` `useEffect`, `requestAnimationFrame`,
  `visible` state, local timeout close shell, fixed backdrop styles, and local
  sheet transition styles were removed.
- SwipeRow: untouched.
- Health structure: untouched.
- Projects: untouched.
- Finance redesign: rejected.

### SwipeRow Implementations

| Implementation | File location | Consumers | Behavioral differences | Accessibility behavior | Migration risk |
|---|---|---|---|---|---|
| `SwipeRow` | `src/screens/MorningIgnition.jsx` | Morning brief tasks and workout rows | Swipe right to confirm at 80px, confirmed terminal state, success tint, hover-device confirm button, optional skip button, mouse and touch support. | Confirm/skip buttons have aria-labels on hover devices. Gesture-only path lacks keyboard equivalent. | Medium. This is the canonical confirm-like behavior in the spec, but it is local. Approval required before extracting. |
| `SwipeDeleteRow` | `src/screens/Inbox.jsx` | Task pool, calendar items, notes rows | Swipe left reveals 72px delete zone; swipe beyond 180px auto-deletes; tap revealed zone confirms; mouse and touch support; exit animation. | Delete zone is a clickable `div`, no button semantics, no keyboard equivalent, no screen-reader action label. | High. Auto-delete and reveal semantics differ from other rows. Approval required before consolidation. |
| `RemoveSwipeRow` | `src/screens/EodReflection.jsx` | Tomorrow focus removal list | Swipe right to remove at 80px, danger tint, immediate remove on release, mouse and touch support. | Gesture-only removal with no keyboard equivalent or semantic button. | Medium. Similar direction/threshold to Morning confirm but destructive meaning differs. Approval required before consolidation. |
| `TxRow` swipe behavior | `src/screens/Finance.jsx` | Today's transaction rows | Swipe left reveals 72px delete zone at 60% threshold; tap delete zone deletes; no auto-delete; touch support only; exit translates entire row. | Delete zone is clickable `div`, no keyboard equivalent. | High. Finance migration must be component-level only and preserve transaction hierarchy. Approval required before consolidation. |
| `GroceryRow` | `src/screens/WeeklyPlanning.jsx` | Weekly planning grocery items | Swipe left deletes immediately at 72px; includes check toggle in row; mouse and touch support; delete zone opacity follows progress. | Check is a button; delete is gesture-only without keyboard equivalent. | Medium. Delete semantics differ from Inbox and Finance. Approval required before consolidation. |

SwipeRow stop-gate conclusion:
- The swipe implementations are not functionally equivalent.
- A canonical `SwipeRow` must support at least confirm, reveal-delete,
  immediate-delete, optional auto-delete, mouse/touch parity, keyboard action,
  and screen-reader labels before migration is safe.
- No SwipeRow consumer migration should begin without approval of the required
  behavior matrix.

Phase 1B decision:
- `MorningIgnition` `SwipeRow`: defer until the shared primitive supports
  right-swipe confirmation, terminal confirmed state, hover-device confirm
  button, optional skip, and keyboard/screen-reader equivalents.
- `Inbox` `SwipeDeleteRow`: defer until the shared primitive supports
  reveal-delete plus optional auto-delete without changing the Inbox workflow.
- `EodReflection` `RemoveSwipeRow`: defer until the shared primitive supports
  right-swipe destructive removal and keyboard/screen-reader equivalents.
- `Finance` `TxRow` swipe behavior: defer. Finance swipe extraction is allowed
  only as component-level migration after shared behavior matches the current
  transaction workflow.
- `WeeklyPlanning` `GroceryRow`: defer until the shared primitive supports
  immediate swipe-left delete while preserving the check-toggle row behavior.

Phase 1G SwipeRow API planning review:
- Migration status: do not migrate yet. This phase is documentation-only and
  does not touch Finance redesign, Health, Projects, row visual redesign, or any
  local swipe implementation.
- Current behavior inventory:
  - `MorningIgnition` `SwipeRow`: right-swipe confirm, 80px threshold,
    success-tint progress, terminal confirmed state, mouse and touch support,
    hover-device confirm button, optional skip button, no gesture keyboard
    equivalent on touch-only path.
  - `EodReflection` `RemoveSwipeRow`: right-swipe remove, 80px threshold,
    danger-tint progress, immediate `onRemove()` on release, mouse and touch
    support, no keyboard or screen-reader action equivalent.
  - `WeeklyPlanning` `GroceryRow`: left-swipe immediate delete, 72px threshold,
    delete-zone opacity follows swipe progress, mouse and touch support, check
    toggle remains inside the row, delete remains gesture-only.
  - `Finance` `TxRow`: left reveal-delete, 72px delete zone, reveal at 60% of
    delete width, touch support only, tap revealed delete zone to delete, no
    auto-delete, 200ms exit translation, no keyboard or screen-reader action
    equivalent.
  - `Inbox` `SwipeDeleteRow`: left reveal-delete, 72px reveal threshold, 180px
    optional auto-delete threshold, mouse and touch support, tap revealed delete
    zone to confirm, 200ms opacity/translation exit, no semantic delete button
    or keyboard equivalent.
- Required shared capabilities:
  - right-swipe confirm
  - right-swipe remove
  - left reveal-delete
  - left immediate-delete
  - optional auto-delete
  - mouse and touch parity
  - keyboard actions
  - screen-reader labels
- Proposed `PlannerSwipeRow` API:

```jsx
<PlannerSwipeRow
  mode="confirm | remove | reveal-delete | immediate-delete"
  direction="right | left"
  threshold={80}
  revealWidth={72}
  revealThresholdRatio={0.6}
  autoActionThreshold={180}
  enableAutoAction={false}
  inputMode="touch-and-mouse"
  completed={false}
  disabled={false}
  actionLabel="Confirm"
  revealActionLabel="Delete"
  hintLabel="swipe ->"
  onAction={handleAction}
  onRevealAction={handleDelete}
  onSkip={handleSkip}
  renderAction={({ progress, revealed, completed }) => null}
>
  {rowContent}
</PlannerSwipeRow>
```

- API notes:
  - `mode` owns semantics. `confirm` and `remove` complete on threshold release;
    `reveal-delete` snaps open and waits for `onRevealAction`; `immediate-delete`
    fires on threshold release.
  - `enableAutoAction` is opt-in and should be used only for Inbox parity.
  - `actionLabel` and `revealActionLabel` are required for keyboard and
    screen-reader equivalents.
  - The consumer owns row content and any screen-specific controls, such as
    Morning skip buttons or Weekly grocery check toggles.
  - The shared primitive owns pointer normalization, mouse/touch parity,
    keyboard action handling, threshold math, reveal state, exit timing hooks,
    and accessible action surfaces.
  - The shared primitive must not impose new row visuals. Per-consumer styles
    should preserve the current row treatment during migration.
- Safest migration order after API approval:
  1. `MorningIgnition` confirm row.
  2. `EodReflection` remove row.
  3. `WeeklyPlanning` grocery row.
  4. `Finance` transaction row.
  5. `Inbox` delete row last because auto-delete is highest risk.
- Stop-gate conclusion: parity is not yet implemented because
  `PlannerSwipeRow` does not exist. Do not migrate consumers until the shared
  primitive is built and each consumer has a targeted parity review.

## Responsibility Matrix

| Screen | Owns | Does not own | Major actions |
|---|---|---|---|
| Home | Daily execution and timeline flow | Capture triage, full task management, full nutrition tracking, full workout execution | Check in, follow Daily Flow, open Journal/Nutrition/Plan, toggle visible day tasks |
| Inbox | Capture anything and triage loose items | Completed task management, calendar capacity planning, daily execution | Add inbox item, triage to Task/Calendar/Note, delete captured items |
| Tasks | Committed actions and status | Loose capture, Plan review, Calendar capacity | Toggle task status, view today/upcoming/unscheduled/done |
| Plan | Today's commitment review plus lightweight adjustment | Task manager, calendar manager, project manager, workout player | Review today holds, adjust visible times, save review note |
| Calendar | Capacity planning | Event management, task editing, drag/drop scheduling | Review week capacity and month indicators |
| Health | Today's health commitments and compact supporting context | Standalone health app structure, full Nutrition app, full WorkoutPlayer execution | View training/nutrition/recovery summaries, open existing setup/log sheets |
| Training/Fitness | Planner workout preview and workout launch | Timers, set logging, active execution UI | Select day, view details, start WorkoutPlayer, review journal |
| WorkoutPlayer | Active guided workout execution | Planning, preview, setup, shared module utilities | Previous, next, pause/resume, autoplay, set logging, complete/exit |
| Nutrition | Manual local-first food logging | Home meal-window ownership, barcode/photo/AI/database features | Add/edit/delete food, save foods/meals, update targets |
| Finance | Financial commitments and local tracking | Planner redesign, analytics expansion, external sync | View finance summaries, add/delete local transactions, show connection stubs |
| Projects | Project tracking | Daily execution, task capture, Plan authority | Review focus project, toggle project tasks |
| Settings | Configuration | Planner execution, capture, Health structure | Edit profile/settings, view connection stubs |
| More | Lightweight route list | New systems or duplicated dashboards | Navigate to secondary surfaces |
| Focus | Focus timer execution | Task planning or timeline management | Start/pause/reset/skip focus session |
| Morning Ignition | Morning check-in and day lock | General Tasks, Calendar, or Nutrition management | Select energy, confirm brief, lock day |
| EOD Reflection | End-of-day reflection and tomorrow carryover | Full task planning or weekly planning | Review day, carry tasks, set tomorrow focus |
| Weekly Planning | Weekly reset overlay | Daily Plan replacement or project manager | Set priorities, update grocery list, preview next week |

## Component Authority Matrix

| Pattern | Canonical component | Duplicate implementations | Migration status |
|---|---|---|---|
| PageHeader | Planned in `PlannerPrimitives.jsx` | Local headers in Plan, Tasks, Calendar, Finance, Health, Nutrition, Settings, Projects | Deferred until primitive API is added and screen-by-screen parity is approved. |
| SectionHeader | Planned `PlannerSectionHeader`/`SectionHeader` in `PlannerPrimitives.jsx` | Local section headers in Plan, Tasks, Calendar, Nutrition, Health styles | Partially canonical for Health; broader migration deferred. |
| PlannerRow | `PlannerRow` in `PlannerPrimitives.jsx` | Local task/commitment/transaction/project rows | Partially canonical for Health; broader migration deferred. |
| ActionGroup | Planned in `PlannerPrimitives.jsx` | Local action clusters in Nutrition, Health, Plan, Finance, Settings | Deferred. |
| BottomSheet | `PlannerBottomSheet` in `PlannerPrimitives.jsx` | None known after Phase 1F | Nutrition migrated in Phase 1B; Settings migrated in Phase 1D; FuelEditSheet migrated in Phase 1E; Finance TransactionSheet shell migrated in Phase 1F. |
| SwipeRow | Planned in `PlannerPrimitives.jsx` | Morning SwipeRow, Inbox SwipeDeleteRow, EOD RemoveSwipeRow, Finance TxRow swipe, Weekly GroceryRow | Blocked by non-equivalent behavior; approval required. |
| EmptyState | Planned in `PlannerPrimitives.jsx` | Local empty states in Nutrition, Inbox, Finance, Tasks, Plan, Calendar | Deferred. |

## Health Boundary Assessment

Health should answer "what should I do today?" before "what Health features
exist?"

Current findings:
- Health already presents Training, Nutrition, Recovery, Weekly Commitments, and
  Insights in a continuous page.
- Health still renders daily and weekly training through repeated
  `HealthTraining` placements, which should be reviewed in a future Health
  boundary phase.
- Health sheets already use `PlannerBottomSheet`, so the main Phase 1A risk is
  not structural migration but avoiding further Health redesign.

Recommendation:
- Health structural changes are out of scope for Phase 1A.
- Record Health boundary findings here only.
- Future Health boundary phase should decide whether repeated training sections
  remain the correct IA.

## Plan Boundary Assessment

Recommendation: Plan is **Review + adjust**, not review-only and not a full
management workspace.

Plan may keep:
- Today holds summary.
- Lightweight task/event/fitness timing adjustment.
- Project context.
- Review note and reviewed state.

Plan should not gain:
- Full task editing.
- Project management.
- Calendar event management.
- Training generation or WorkoutPlayer controls.

## Accessibility Audit

Critical:
- Shared BottomSheet must add dialog semantics before it can be the sole
  authority: `role="dialog"`, `aria-modal`, labelled heading, Escape close, and
  focus return/focus containment strategy.

High:
- Swipe rows need keyboard equivalents and semantic action buttons for delete,
  remove, and confirm.
- Gesture-only destructive actions must expose screen-reader labels.

Medium:
- Touch target sizes should be checked at 393px during browser verification.
- Hidden controls such as delete zones should not be the only accessible path.

Low:
- Existing visible labels are generally present in form sheets but need
  heading association once consolidated.

## Removal Requirements

A migration is not complete until:
1. Consumer migrated.
2. Tests pass.
3. Old implementation removed.
4. No remaining imports or local definitions reference obsolete code.

Dead Code Audit before closing the phase:
- Identify all components, utilities, styles, and helpers that became unused due
  to migration.
- Remove unused code unless there is a documented reason to retain it.
- Run repository-wide searches for unused imports, obsolete exports, orphaned
  styles, legacy sheet implementations, and legacy swipe implementations.
- Report files deleted, components deleted, utilities deleted, styles deleted,
  and intentionally retained legacy code with justification.
- Success criterion: no duplicate implementation remains solely for historical
  reasons.

## Success Metrics

- One BottomSheet implementation remains.
- One SwipeRow implementation remains.
- `PlannerPrimitives.jsx` becomes the authority module.
- Zero duplicated sheet gesture systems remain.
- Zero duplicated swipe gesture systems remain.
- No orphaned BottomSheet, SwipeRow, or planner primitive implementations remain
  in the repository.
- Responsibility Matrix completed.
- Component Authority Matrix completed.
- No user-facing workflow changes.

Current status against metrics:
- Responsibility Matrix: completed in this audit.
- Component Authority Matrix: completed in this audit.
- One BottomSheet implementation remains: complete for known audited
  BottomSheet shells after Phase 1F.
- One SwipeRow implementation remains: not complete.
- No orphaned duplicate implementations: not complete.
- No user-facing workflow changes: maintained for the Phase 1B equivalent
  Nutrition sheet migration, Phase 1C shared primitive expansion, and Phase 1D
  Settings sheet migration, Phase 1E FuelEditSheet migration, and Phase 1F
  Finance TransactionSheet shell migration.

## Final Review

Completed:
- SPEC reviewed before implementation.
- Stop Gate Component Inventory completed.
- Responsibility Matrix completed.
- Component Authority Matrix completed.
- Shared `PlannerBottomSheet` adapted with dialog semantics and style override
  hooks.
- Nutrition local `BottomSheet` migrated to `PlannerBottomSheet`.
- Nutrition local bottom-sheet styles removed.
- Phase 1C reviewed FuelEditSheet, Finance TransactionSheet, and Settings
  StubSheet and documented missing shared capabilities for each.
- Shared `PlannerBottomSheet` expanded with generic animation, delayed close,
  optional backdrop/Escape close, z-index, style variants, and callback-safe
  close support.
- Phase 1D proved Settings StubSheet parity and migrated it to
  `PlannerBottomSheet`.
- Settings local `StubSheet` animation/backdrop/sheet shell and orphaned shell
  styles removed.
- Phase 1E proved FuelEditSheet parity and migrated its shell to
  `PlannerBottomSheet`.
- FuelEditSheet local animation/backdrop/sheet shell and orphaned shell styles
  removed.
- Phase 1F proved Finance TransactionSheet shell parity and migrated it to
  `PlannerBottomSheet` without changing Finance layout or financial behavior.
- Finance TransactionSheet local animation/backdrop/sheet shell and orphaned
  shell styles removed.
- Finance redesign rejected for Phase 1A.
- Health structural changes rejected for Phase 1A.

Deferred:
- SwipeRow consolidation pending support for all current gesture variants and
  accessibility equivalents.
- PageHeader, SectionHeader, ActionGroup, and EmptyState migration pending
  primitive API approval.
- Finance planner redesign deferred to a Finance-specific phase.
- Health IA/boundary changes deferred to a Health-specific phase.

Rejected:
- Removing Finance KPI cards, charts, summaries, dashboards, or hierarchy in
  Phase 1A.
- Health structural changes in Phase 1A.
- Any workflow, data model, routing, WorkoutPlayer, or training-generation
  behavior change hidden inside primitive migration.

## Approval Needed Before Consolidation

Approve the following deltas before implementation continues:

1. Shared BottomSheet should add focus management in a future accessibility
   pass while preserving each consumer's current close/save timing.
2. Shared SwipeRow should support confirm, remove, reveal-delete,
   immediate-delete, optional auto-delete, keyboard action, mouse/touch parity,
   and screen-reader labels.
3. Finance migration remains limited to component-level sheet/swipe extraction,
   with no removal of cards, charts, summaries, or hierarchy.
4. Health migration remains documentation-only unless a later Health boundary
   phase is approved.
