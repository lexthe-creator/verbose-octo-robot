# Comprehensive UI Pattern Audit: Cards, Badges, Chips & Dashboards

## 1. CARD COMPONENTS (Background Cards with Borders & Shadows)

### Primary Card Infrastructure

#### Design Tokens (`src/styles/tokens.css`)
- **`--color-card`**: Card background color
  - Dark: `#1E1E18`
  - Light: `#FFFFFF`
- **`--radius-card`**: Card border radius = `12px`
- **`--radius-pill`**: Pill/badge border radius = `999px`
- **Shadow tokens**: Multiple boxShadow depths used across screens

---

### Card Implementations

#### 1. TodayCard - Fitness Screen
**File**: [src/screens/Fitness.jsx](src/screens/Fitness.jsx)

**Component**: `TodayCard` (lines 66-160)
- **Container styling** (`tc.wrap` - line 151-159):
  ```
  background:    'var(--color-card)'
  border:        'var(--border)'
  borderRadius:  'var(--radius-card)'
  padding:       '16px'
  boxShadow:     '0 18px 50px rgba(0,0,0,0.08)'
  ```
- **Features**:
  - Type abbreviation badge (40px × 40px)
  - Expandable workout preview
  - Start/Complete button with dynamic styling
  - Internal shadow on nested elements
- **Purpose**: Daily workout summary card with preset expandable content

#### 2. Stat Cards - Finance Dashboard
**File**: [src/screens/Finance.jsx](src/screens/Finance.jsx)

**Component**: `StatCard` (lines ~82-115)
- **Card styling** (`sc.card` - line ~95):
  ```
  background:   'var(--color-card)'
  border:       'var(--border)'
  borderRadius: '12px'
  padding:      '16px'
  flex:         1
  boxShadow:    '0 18px 45px rgba(0,0,0,0.07)'
  transition:   'transform 0.2s ease'
  ```
- **Contents**:
  - Label (9px, uppercase, muted)
  - Value (20px, display font, dynamic color)
  - Sub-text (10px, faint)
- **Usage**: Finance dashboard displays 2-3 stat cards in row

#### 3. Settings Card Sections
**File**: [src/screens/Settings.jsx](src/screens/Settings.jsx)

**Multiple `<section style={s.card}>` blocks** (lines 51-190):
```
Profile section (line 51)
  ├─ cardLabel: "Profile"
  └─ field with name input

Training section (line 66)
  ├─ cardLabel: "Training"
  ├─ Equipment pills (5 buttons)
  └─ Helper text

Program section (line 104)
  ├─ cardLabel: "Program"
  ├─ Start date input
  ├─ Race date input
  └─ Helper text

Connections section (line 136)
  ├─ cardLabel: "Connections"
  ├─ Plaid row
  ├─ Google Calendar row
  └─ Dividers

About section (line 154)
  ├─ cardLabel: "About"
  ├─ App info row
  ├─ Phase row
  └─ Week row

Appearance section
  ├─ Theme pills (2 options)
  └─ Density pills (3 options)

Debug section
  ├─ debugLabel: "DEBUG"
  └─ Reset buttons
```

#### 4. Home Screen Dashboard Card
**File**: [src/screens/Home.jsx](src/screens/Home.jsx)

**Line 292**: `<div style={tl.card}>`
- Timeline card for displaying time-based items
- Part of larger dashboard layout

#### 5. Catch-Up Card - Weekly Planning
**File**: [src/screens/WeeklyPlanning.jsx](src/screens/WeeklyPlanning.jsx)

**Line 387**: `<div style={s.catchUpCard}>`
- Conditional card shown when project is behind schedule
- Contains suggested catch-up tasks count
- Background: alert color

---

## 2. BADGE & CHIP COMPONENTS

### Badge Implementations

#### 1. Done Badge
**File**: [src/screens/Fitness.jsx](src/screens/Fitness.jsx)

**Usage** (line 93): `<span style={tc.doneBadge}>Done</span>`

**Styling** (`tc.doneBadge` - lines 190-195):
```
padding:      '4px 10px'
borderRadius: 'var(--radius-pill)'  [999px]
background:   'var(--color-success-bg)'
color:        'var(--color-success)'
border:       '0.5px solid var(--color-success)'
fontSize:     '11px'
fontWeight:   600
flexShrink:   0
```
- **Purpose**: Success indicator for completed workouts
- **Context**: Shows in TodayCard header when workout marked done today

#### 2. Time Badge
**File**: [src/screens/Home.jsx](src/screens/Home.jsx)

**Line 495**: `<span style={tr.timeBadge}>{formatPlannerTime(parseHHMM(task.scheduledTime))}</span>`
- **Purpose**: Displays scheduled time for timeline items
- **Styling**: Likely similar pill styling

#### 3. Available Badge
**File**: [src/screens/Home.jsx](src/screens/Home.jsx)

**Line 498**: `<span style={tr.availableBadge}>open</span>`
- **Purpose**: Status indicator for available/open items
- **Context**: Timeline event status display

#### 4. Section Badge (Count)
**File**: [src/screens/Inbox.jsx](src/screens/Inbox.jsx)

**Line 160**: `{count > 0 && <span style={s.sectionBadge}>{count}</span>}`
- **Purpose**: Shows count of items in collapsible section header
- **Context**: Inbox section headers

#### 5. Queue Badge
**File**: [src/screens/Inbox.jsx](src/screens/Inbox.jsx)

**Line 187**: `<span style={s.queueBadge}>Queue</span>`
- **Purpose**: Task queue indicator
- **Context**: Task pool rows

#### 6. Total Items Badge
**File**: [src/screens/Inbox.jsx](src/screens/Inbox.jsx)

**Line 420**: `<span style={s.badge}>{totalItems}</span>`
- **Purpose**: Generic count badge
- **Context**: Various inbox displays

#### 7. Pace Status Badge
**File**: [src/screens/WeeklyPlanning.jsx](src/screens/WeeklyPlanning.jsx)

**Line 370**: `<span style={{ ...s.paceBadge, background: pc.bg, color: pc.color }}>`
- **Values**:
  - "On track" (green bg/color)
  - "7 days buffer" (yellow bg/color)
  - "Behind" (red bg/color)
- **Purpose**: Project completion pace indicator
- **Colors** (lines ~360-366):
  ```
  on_track: { bg: 'var(--color-success-bg)', color: 'var(--color-success)' }
  buffer:   { bg: 'var(--color-buffer-bg)',   color: 'var(--color-buffer)' }
  behind:   { bg: 'rgba(224,85,85,0.12)',    color: 'var(--color-danger)' }
  ```

#### 8. Phase Progress Badge
**File**: [src/components/WorkoutPlayer.jsx](src/components/WorkoutPlayer.jsx)

**Line 225**: `{phaseProgress.label} {phaseProgress.current} of {phaseProgress.total}`
- **Purpose**: Shows current step progress in multi-step phase
- **Example**: "Exercise 3 of 5"
- **Context**: Workout playback interface

---

### Chip Components

#### 1. Chip Wrap & Chips
**File**: [src/screens/MorningIgnition.jsx](src/screens/MorningIgnition.jsx)

**Lines 883-885**:
```jsx
<div style={s.chipWrap}>
  {items.map((item, i) => (
    <span key={i} style={s.chip}>{item}</span>
  ))}
</div>
```
- **Purpose**: Display list of items as wrapping chips
- **Context**: Quick reference items display

#### 2. Pills Row Container
**File**: [src/screens/Home.jsx](src/screens/Home.jsx)

**Line 509**: `<div style={tr.pills}>`
- **Purpose**: Container for multiple pill-like badges
- **Context**: Timeline item metadata display

---

## 3. PILL/SELECTOR COMPONENTS

### Pill Implementations

#### 1. Weekly Day Strip (7-Day Selector)
**File**: [src/screens/Fitness.jsx](src/screens/Fitness.jsx)

**Component**: `WeekStrip` (lines 274-312)

**Container** (`ws.scroll` - line 286):
```
display:           'flex'
gap:               '4px'
overflowX:         'auto'
scrollbarWidth:    'none'
WebkitOverflowScrolling: 'touch'
```

**Individual pill** (`ws.pill` - lines 289-299):
```
display:        'flex'
flexDirection:  'column'
alignItems:     'center'
gap:            '4px'
padding:        '12px 10px'
minWidth:       '56px'
flex:           '1 0 56px'
borderRadius:   'var(--radius-card)'  [12px, not pill]
background:     'var(--color-card)'   [default]
border:         'var(--border)'
cursor:         'pointer'
transition:     'background 0.15s, border-color 0.15s, transform 0.15s'
```

**State variations**:
- **Today**: bg = 'var(--color-accent)', border = 'var(--color-accent)'
- **Selected**: bg = 'var(--color-accent-bg)', border = 'var(--color-accent)'
- **Default**: bg = 'var(--color-chart-bar)', border = 'transparent'

**Line 306**: Example usage with dynamic styling:
```
style={{ ...ws.pill, background: bg, border: `0.5px solid ${borderColor}` }}
```

#### 2. Equipment Selector Pills
**File**: [src/screens/Settings.jsx](src/screens/Settings.jsx)

**Lines 70-76**: Equipment options in row
- Bodyweight
- Dumbbells
- Home gym
- Full gym

**Styling**:
- Active: `background: 'var(--color-accent-bg)'`, `border: '0.5px solid var(--color-accent)'`, `fontWeight: 600`
- Inactive: `background: 'var(--color-chart-bar)'`, `border: 'var(--border)'`, `fontWeight: 500`

#### 3. Theme Selection Pills
**File**: [src/screens/Settings.jsx](src/screens/Settings.jsx)

**Lines 150-165**: 2-column grid
- "◑ Dark"
- "◐ Light"

**Same styling pattern as equipment pills**

#### 4. Timeline Density Pills
**File**: [src/screens/Settings.jsx](src/screens/Settings.jsx)

**Lines 165-180**: 3-column grid
- "minimal"
- "balanced"
- "detailed"

**Same styling pattern as equipment pills**

#### 5. Transaction Toggle Pills (Spend/Income)
**File**: [src/screens/Finance.jsx](src/screens/Finance.jsx)

**In `TransactionSheet`** (lines ~270-290):
- Spend / Income toggle
- Active state highlighting
- Used within transaction form

#### 6. Category Selector Pills
**File**: [src/screens/Finance.jsx](src/screens/Finance.jsx)

**In `TransactionSheet`** (lines ~300-320):
- Grid of category pills: Food, Transport, Shopping, Health, Bills, Other
- Active state styling

---

## 4. DASHBOARD-STYLE LAYOUTS

### Dashboard Screens

#### 1. Weekly Planning Dashboard (Multi-Step Modal)
**File**: [src/screens/WeeklyPlanning.jsx](src/screens/WeeklyPlanning.jsx)

**Step 1: Week Review** (lines 220-235)
- **Layout**:
  ```
  overlay > inner > 
    eyebrow: "Weekly planning"
    heading: "This week"
    statList
      ├─ statRow: workouts completed
      ├─ statRow: tasks done
      └─ statRow: She Stitches tasks
    cta: "Next →"
  ```
- **Stat display**:
  - `statNum`: Large number (20px display font)
  - `statLabel`: Label text

**Step 2: Priorities** (lines 237-265)
- 3 priority input fields with numbering

**Step 3: Training Preview** (lines 302-330)
- 7-day strip (same as Fitness screen)
- Run days + strength days summary

**Step 4: Project Check-ins** (lines 332-360)
- Project header with emoji + pace badge
- Stat list (tasks done, tasks remaining)
- Conditional catch-up card
- **Catch-up card** (line 347):
  ```
  <div style={s.catchUpCard}>
    <p>Suggested catch-up: <strong>{catchUp} tasks this week</strong> to get back on track</p>
  </div>
  ```

#### 2. Finance Dashboard
**File**: [src/screens/Finance.jsx](src/screens/Finance.jsx)

**Weekly Bar Chart** (lines ~70-80):
- `WeeklyBars` component
- Max height: 48px, bar width: 18px
- Container: `bc.wrap` (flex, aligned flex-end)
- Bars show daily spend
- Today's bar highlighted with accent color

**Stat Cards Grid** (lines ~130-150):
- Multiple `StatCard` components in row
- Each shows: label + value + sub-value
- Shadow: `'0 18px 45px rgba(0,0,0,0.07)'`

**Transaction List** (lines ~160-180):
- Individual `TxRow` components
- Swipe-left to delete
- Category emoji, merchant, category, amount display

#### 3. Plan Screen Dashboard
**File**: [src/screens/Plan.jsx](src/screens/Plan.jsx)

**Summary Section** (lines 82-90):
```jsx
<section style={styles.summarySection}>
  <p style={styles.summaryTitle}>today holds</p>
  <div style={styles.summaryGrid}>
    {summaryRows.map(row => (
      <SummaryRow key={row.label} label={row.label} count={row.count} />
    ))}
  </div>
</section>
```
- Shows: tasks, events, project, fitness counts
- Mark-based visualization (pipe marks for count)

**Fieldset Sections** (lines 91-170):
- Tasks section with task rows
- Events section with event rows
- Project section with project task
- Fitness section with workout info

#### 4. Home Screen Timeline Dashboard
**File**: [src/screens/Home.jsx](src/screens/Home.jsx)

**Header** (lines 120-200):
- Greeting message
- Current date

**Timeline Sections** (TIMELINE_SECTIONS constant - lines 18-21):
- MORNING (6 AM - 12 PM)
- DAY FLOW (12 PM - 5 PM)
- EVENING (5 PM - 10 PM)

**Timeline Items** (lines ~280-380):
- Time-based cards with dotted indicators
- Status markers (now dot, completed checks)
- Type indicators (task/event/meal/workout)

**Now Dot** (line 366):
```
boxShadow: item.type === 'now' ? `0 0 0 4px var(--color-accent-bg)` : 'none'
```

#### 5. Inbox Dashboard
**File**: [src/screens/Inbox.jsx](src/screens/Inbox.jsx)

**Collapsible Sections** (lines ~150-190):
```jsx
<CollapsibleSection title={title} count={count}>
  {children}
</CollapsibleSection>
```

**Section Header** (lines 155-165):
- Title + count badge
- Expand/collapse chevron
- `sectionTitle`, `sectionBadge`, `chevron` styling

**Section Types**:
- Task pool (queue items)
- Calendar items
- List items

---

## 5. SHADOW EFFECTS & DEPTH

### Box Shadow Patterns Used

| Component | Shadow | File |
|-----------|--------|------|
| Fitness TodayCard | `'0 18px 50px rgba(0,0,0,0.08)'` | Fitness.jsx:158 |
| Finance StatCard | `'0 18px 45px rgba(0,0,0,0.07)'` | Finance.jsx:103 |
| Health BottomSheet | `'0 -14px 38px rgba(24, 24, 18, 0.14)'` | Health.jsx:1595 |
| Nutrition BottomSheet | `'0 -12px 34px rgba(26, 26, 20, 0.12)'` | Nutrition.jsx:725 |
| Drag Elevation | `'0 8px 24px rgba(0,0,0,0.5)'` | MorningIgnition.jsx:410 |
| Accent Ring | `'0 0 0 4px var(--color-accent-bg)'` | Home.jsx:366, 437 |

---

## 6. ROUNDED BORDERS & BACKGROUND CONTAINERS

### Border Radius Tokens

| Token | Size | Usage |
|-------|------|-------|
| `--radius-card` | 12px | Cards, major containers, day pills |
| `--radius-sm` | 10px | Smaller buttons, input groups |
| `--radius-pill` | 999px | Badges, pills, status indicators |

### Background Color Containers

| Color Variable | Usage | File References |
|---|---|---|
| `--color-card` | Primary card background | Fitness, Finance, Settings, Home |
| `--color-accent-bg` | Highlighted/active states | Settings, WeeklyPlanning |
| `--color-success-bg` | Success/completion state | Fitness, MorningIgnition |
| `--color-danger-bg` | Delete/error states | Inbox, Finance |
| `--color-buffer-bg` | Buffer/warning states | WeeklyPlanning |
| `--color-chart-bar` | Secondary container | Fitness, Finance, Settings |

---

## 7. HYROX LANGUAGE AUDIT

### References Found

#### 1. Type Normalization
**File**: [src/context/FitnessContext.jsx](src/context/FitnessContext.jsx)

**Line 10**:
```javascript
if (type === 'hyrox') return 'hybrid'
```
- **Purpose**: Handles legacy `hyrox` type → normalized `hybrid` type
- **Status**: Internal migration logic only

#### 2. Product Specification
**File**: [SPEC.md](SPEC.md)

**Line 2256**:
> "Do not use HYROX, HYROX equipment, HYROX simulation, HYROX stations, a HYROX-specific generator, or race prep as default product language."

**Lines 2328-2329**:
> "No user-facing HYROX language remains."
> "Program setup shows Hybrid Training, not HYROX."

**Line 2332**:
> "Existing stored `hyrox` values migrate safely to `hybrid`."

**Line 2643** (Completion note):
> "HYROX station badge removed" from WorkoutPlayer.jsx

#### 3. Archived Implementation
**Files**: `.claude/worktrees/` (old branches)
- `suspicious-faraday-68a9aa/src/components/WorkoutPlayer.jsx`:214
- `heuristic-fermat-693e7d/src/components/WorkoutPlayer.jsx`:214
- Lines showing: `{segment.hyrox && <span style={s.hyroxBadge}>HYROX station</span>}`

### ✅ Current Status
- **User-facing HYROX language**: REMOVED ✓
- **Type migration**: Implemented ✓
- **Badge display**: Removed ✓
- **Internal references**: Only in migration logic ✓

---

## 8. PATTERN USAGE SUMMARY

### Card Containers: 40+ instances across screens
- Settings: 6 card sections
- Finance: 2+ stat cards
- Fitness: 1 main card + nested preview
- WeeklyPlanning: Multiple stat cards + catch-up card
- Home: Dashboard cards
- Plus: Field groups, wrapper containers

### Badges: 8+ distinct implementations
- Success badges (Done)
- Status badges (Open, Queue)
- Count badges (Inbox, sections)
- Pace badges (On track, Buffer, Behind)
- Progress badges (Phase steps)
- Time badges
- Category badges
- Generic count badges

### Pills/Selectors: 5+ implementations
- Weekly day selector (7 buttons)
- Equipment selector (4 options)
- Theme selector (2 options)
- Density selector (3 options)
- Category selector (6 options)
- Plus inline toggle pills

### Dashboard Layouts: 5 primary screens
- Weekly Planning (4-step modal)
- Finance (bar chart + cards + transactions)
- Plan (summary + sections)
- Home (timeline with sections)
- Inbox (collapsible sections)

### Shadow Depths: 6 distinct levels
- Subtle: 0.07-0.08 opacity
- Standard: 0.12-0.14 opacity
- Elevated: 0.5 opacity (drag states)
- Ring: Accent color halo

---

## 9. STYLING INFRASTRUCTURE

### Design Token File
**Location**: [src/styles/tokens.css](src/styles/tokens.css)

**Key Variables**:
- Color palette (dark/light themes)
- Border radius tokens
- Spacing scale
- Typography families
- Safe areas for mobile

### Inline Style Objects (instead of CSS classes)
- All major screens use inline `style={}` objects
- Named style objects defined at bottom of each component
- Examples: `tc`, `ws`, `sc`, `s`, `styles`
- Enables dynamic theming and runtime style changes

---

## 10. SUMMARY TABLE

| Pattern | Count | Primary Files | CSS Tokens |
|---------|-------|---|---|
| Card containers | 40+ | Fitness, Finance, Settings, Plan, Home, WeeklyPlanning | `--color-card`, `--radius-card` |
| Badges | 8+ | Fitness, Home, Inbox, WeeklyPlanning, Finance | `--radius-pill`, color variables |
| Pills/Selectors | 5+ | Fitness, Settings, Finance | `--radius-card`, `--radius-pill` |
| Dashboard layouts | 5 | WeeklyPlanning, Finance, Plan, Home, Inbox | Multiple color vars |
| Box shadows | 6 | All screens | Custom rgba values |
| Rounded borders | ~100+ | All components | `--radius-card`, `--radius-sm`, `--radius-pill` |
| Background containers | Hundreds | All components | All `--color-*` variables |

