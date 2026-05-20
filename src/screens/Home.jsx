import { useState, useEffect, useMemo } from 'react'
import { useUser } from '../context/UserContext.jsx'
import { useSettings } from '../context/SettingsContext.jsx'
import { useDay, useFitness, useProjects, getProjectStats } from '../context/index.js'
import FuelEditSheet from '../components/FuelEditSheet.jsx'
import { getTodayType, generateWorkout, getWeekNumber } from '../utils/fitness.js'
import { getProjectPace } from '../utils/projectUtils.js'
import { formatMealTime, parseHHMM, formatMins } from '../utils/time.js'
import { SCREENS } from '../constants/navigation.js'
import { WORKOUT_LABEL } from '../constants/fitness.js'
import { PACE_STATUS, PROJECT_STATUS } from '../constants/projects.js'

// ─── Time utilities ────────────────────────────────────────────────────────────

function toMins(date) {
  return date.getHours() * 60 + date.getMinutes()
}

function formatFullDate(date) {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

// 30-min slots 06:00 – 22:00
const TIME_OPTIONS = Array.from({ length: 33 }, (_, i) => {
  const total = 360 + i * 30
  const h = Math.floor(total / 60)
  const m = total % 60
  const hhmm = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return { value: hhmm, label: `${h12}:${String(m).padStart(2, '0')} ${ampm}` }
})

const SECTION_KEYS = {
  TRAINING: 'training',
  TIMELINE: 'timeline',
  TASKS:    'tasks',
  MEALS:    'meals',
  FOCUS:    'focus',
}

function getEnabledModules(modules = {}) {
  return {
    fitness:   modules.fitness !== false,
    nutrition: modules.nutrition === true,
    goals:     modules.goals === true,
    focus:     modules.focus !== false,
    finance:   modules.finance !== false,
  }
}

// ─── Hero header ───────────────────────────────────────────────────────────────

function greeting(now, name) {
  const h = now.getHours()
  const part = h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening'
  return `Good ${part}, ${name}`
}

function QuickActionsHero({
  now,
  name,
  showFocus,
  showMeals,
  showWorkout,
  onFocus,
  onJournal,
  onMeals,
  onWorkout,
  onOpenSettings,
}) {
  return (
    <div style={hero.wrap}>
      <div style={hero.topRow}>
        <span style={hero.greeting}>{greeting(now, name)}</span>
        <button style={hero.gearBtn} onClick={onOpenSettings} aria-label="Settings">
          ⚙
        </button>
      </div>
      <div style={hero.dateRow}>
        <p style={hero.date}>{formatFullDate(now)}</p>
      </div>
      <div style={hero.actionCard}>
        <h1 style={hero.actionTitle}>What do you need right now?</h1>
        <p style={hero.actionDetail}>Pick the support that fits this moment.</p>
        <div style={hero.quickGrid}>
          {showFocus && (
            <button style={hero.quickBtn} onClick={onFocus}>
              <span style={hero.quickIcon}>⊙</span>
              <span>Focus</span>
            </button>
          )}
          <button style={hero.quickBtn} onClick={onJournal}>
            <span style={hero.quickIcon}>◇</span>
            <span>Journal</span>
          </button>
          {showMeals && (
            <button style={hero.quickBtn} onClick={onMeals}>
              <span style={hero.quickIcon}>◷</span>
              <span>Meals</span>
            </button>
          )}
          {showWorkout && (
            <button style={hero.quickBtn} onClick={onWorkout}>
              <span style={hero.quickIcon}>◉</span>
              <span>Workout</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const hero = {
  wrap:    { padding: '20px 20px 0' },
  topRow:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' },
  greeting:{ fontSize: '13px', color: 'var(--color-muted)', fontWeight: 500 },
  gearBtn: {
    width:           '32px',
    height:          '32px',
    borderRadius:    '50%',
    background:      'var(--color-card)',
    border:          'var(--border)',
    color:           'var(--color-muted)',
    fontSize:        '16px',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    cursor:          'pointer',
    flexShrink:      0,
  },
  dateRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  date:    { fontSize: '14px', color: 'var(--color-muted)', margin: 0 },
  actionCard: {
    marginTop:      '16px',
    background:     'var(--color-card)',
    border:         'var(--border)',
    borderRadius:   'var(--radius-card)',
    padding:        '16px',
    display:        'flex',
    flexDirection:  'column',
    gap:            '12px',
  },
  actionTitle: {
    margin:         0,
    fontFamily:    'var(--font-display)',
    fontSize:      '28px',
    lineHeight:    1.08,
    fontWeight:    400,
    color:         'var(--color-text)',
  },
  actionDetail: {
    margin:     0,
    fontSize:   '13px',
    lineHeight: 1.45,
    color:      'var(--color-muted)',
  },
  quickGrid: {
    display:             'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap:                 '8px',
  },
  quickBtn: {
    minHeight:     '44px',
    borderRadius:  'var(--radius-sm)',
    border:        'var(--border)',
    background:    'var(--color-chart-bar)',
    color:         'var(--color-text)',
    display:       'flex',
    alignItems:    'center',
    justifyContent:'center',
    gap:           '7px',
    fontSize:      '13px',
    fontWeight:    700,
    cursor:        'pointer',
  },
  quickIcon: {
    color:      'var(--color-accent)',
    fontSize:   '14px',
    lineHeight: 1,
  },
}

// ─── Burn bar ──────────────────────────────────────────────────────────────────

function BurnBar({ now, nextLabel }) {
  const DAY_START = 6 * 60   // 6am in mins
  const DAY_END   = 23 * 60  // 11pm in mins
  const current   = toMins(now)
  const pct = Math.min(100, Math.max(0,
    Math.round(((current - DAY_START) / (DAY_END - DAY_START)) * 100)
  ))

  return (
    <div style={burn.wrap}>
      <div style={burn.labels}>
        <span style={burn.left}>{pct}% of day gone</span>
        {nextLabel && <span style={burn.right}>{nextLabel}</span>}
      </div>
      <div style={burn.track}>
        <div style={{ ...burn.fill, width: `${pct}%` }} />
      </div>
    </div>
  )
}

const burn = {
  wrap:   { padding: '16px 20px 0' },
  labels: { display: 'flex', justifyContent: 'space-between', marginBottom: '6px' },
  left:   { fontSize: '11px', color: 'var(--color-muted)' },
  right:  { fontSize: '11px', color: 'var(--color-accent)', fontWeight: 500 },
  track:  { height: '2px', background: 'var(--color-faint)', borderRadius: 'var(--radius-pill)', overflow: 'hidden' },
  fill:   { height: '100%', background: 'var(--color-accent)', borderRadius: 'var(--radius-pill)', transition: 'width 1s linear' },
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

function buildTimeline(state, nowMinutes, options = {}) {
  const items = []
  const { includePlannedWorkout = true } = options

  // Morning ignition — always at 6am
  items.push({
    key:      'ignition',
    timeMins: 6 * 60,
    label:    'Morning ignition',
    type:     'ignition',
    done:     !!state.dayLockedAt,
  })

  // Workout
  if (state.workout?.time && (state.workoutConfirmed || state.workout.confirmed || includePlannedWorkout)) {
    const wm = parseHHMM(state.workout.time)
    items.push({
      key:      'workout',
      timeMins: wm,
      label:    `${state.workout.type} · ${state.workout.duration}`,
      type:     'workout',
      done:     state.workout.confirmed || (state.workoutConfirmed && nowMinutes > wm),
      planned:  !state.workoutConfirmed && !state.workout.confirmed,
    })
  }

  // Tasks with scheduledTime
  state.tasks.forEach(t => {
    if (t.scheduledTime) {
      items.push({
        key:      t.id,
        timeMins: parseHHMM(t.scheduledTime),
        label:    t.text,
        type:     'task',
        done:     t.done,
      })
    }
  })

  // Meal windows
  Object.entries(state.meals).forEach(([slot, meal]) => {
    items.push({
      key:      `meal-${slot}`,
      timeMins: parseHHMM(meal.startTime),
      label:    `${meal.label} window`,
      type:     'meal',
      done:     meal.eaten,
      late:     !meal.eaten && nowMinutes > parseHHMM(meal.lateAfter),
    })
  })

  items.sort((a, b) => a.timeMins - b.timeMins)

  // Insert "now" marker at chronological position
  const nowItem = { key: 'now', timeMins: nowMinutes, label: 'you are here', type: 'now' }
  const insertAt = items.findIndex(item => item.timeMins > nowMinutes)
  if (insertAt === -1) items.push(nowItem)
  else items.splice(insertAt, 0, nowItem)

  return items
}

function getTimelinePreview(items, nowMinutes) {
  const visible = items.filter(item => item.type !== 'now')
  const remaining = visible.filter(item => !item.done && item.timeMins >= nowMinutes)
  const next = remaining[0] ?? visible.filter(item => !item.done)[0] ?? null
  return {
    next,
    remainingCount: remaining.length,
    nowIndex: items.findIndex(item => item.type === 'now'),
  }
}

function getBurnBarLabel(timelinePreview) {
  if (!timelinePreview.next) return 'Clear for now'
  return `Next ${formatMins(timelinePreview.next.timeMins)} · ${timelinePreview.next.label}`
}

function TimelinePreview({ preview }) {
  const nextLabel = preview.next
    ? `${formatMins(preview.next.timeMins)} · ${preview.next.label}`
    : 'All visible items are complete'

  return (
    <div style={tl.preview}>
      <span style={tl.previewNow}>●</span>
      <div style={tl.previewText}>
        <span style={tl.previewMain}>{nextLabel}</span>
        <span style={tl.previewSub}>{preview.remainingCount} remaining scheduled item{preview.remainingCount === 1 ? '' : 's'} today</span>
      </div>
    </div>
  )
}

function Timeline({ items }) {
  function dotColor(item) {
    if (item.type === 'now')     return 'var(--color-accent)'
    if (item.done)               return 'var(--color-success)'
    if (item.late)               return 'var(--color-danger)'
    if (item.type === 'workout') return 'var(--color-accent)'
    return 'var(--color-faint)'
  }

  return (
    <div style={tl.card}>
      <p style={tl.heading}>Today at a glance</p>
      <div style={tl.list}>
        {items.map((item, idx) => (
          <div key={item.key} style={tl.row}>
            {/* Left: time */}
            <span style={tl.time}>
              {item.type === 'now' ? '' : formatMins(item.timeMins)}
            </span>

            {/* Dot + line */}
            <div style={tl.dotCol}>
              <div style={{ ...tl.dot, background: dotColor(item), boxShadow: item.type === 'now' ? `0 0 0 3px var(--color-accent-bg)` : 'none' }} />
              {idx < items.length - 1 && <div style={tl.line} />}
            </div>

            {/* Label */}
            <span style={{
              ...tl.label,
              color:          item.type === 'now' ? 'var(--color-accent)' : item.done ? 'var(--color-success)' : item.late ? 'var(--color-danger)' : 'var(--color-text)',
              fontWeight:     item.type === 'now' ? 600 : 400,
              textDecoration: item.done && item.type !== 'now' ? 'line-through' : 'none',
              opacity:        item.done ? 0.6 : item.planned ? 0.82 : 1,
            }}>
              {item.label}
              {item.planned && <span style={tl.plannedPip}>planned</span>}
              {item.type === 'now' && <span style={tl.nowPip}>●</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

const tl = {
  card:    { background: 'transparent', border: 'none', borderRadius: 0, padding: 0 },
  heading: { fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: '12px' },
  list:    { display: 'flex', flexDirection: 'column' },
  row:     { display: 'flex', alignItems: 'flex-start', gap: '10px', minHeight: '28px' },
  time:    { fontSize: '11px', color: 'var(--color-muted)', width: '52px', flexShrink: 0, paddingTop: '2px', textAlign: 'right' },
  dotCol:  { display: 'flex', flexDirection: 'column', alignItems: 'center', width: '10px', flexShrink: 0 },
  dot:     { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, marginTop: '3px' },
  line:    { width: '1px', flex: 1, minHeight: '20px', background: 'var(--color-faint)', margin: '2px 0' },
  label:   { fontSize: '13px', paddingTop: '1px', flex: 1, lineHeight: 1.4 },
  nowPip:  { color: 'var(--color-accent)', fontSize: '8px', marginLeft: '4px', verticalAlign: 'middle' },
  plannedPip: {
    marginLeft:    '6px',
    padding:       '1px 6px',
    borderRadius:  'var(--radius-pill)',
    background:    'var(--color-chart-bar)',
    color:         'var(--color-muted)',
    fontSize:      '10px',
    fontWeight:    600,
    verticalAlign: 'middle',
  },
  preview: {
    borderTop:    'var(--border)',
    padding:      '0 14px 12px',
    display:      'flex',
    alignItems:   'flex-start',
    gap:          '9px',
  },
  previewNow: {
    color:      'var(--color-accent)',
    fontSize:   '9px',
    lineHeight: 1,
    marginTop:  '5px',
  },
  previewText: {
    minWidth:      0,
    display:       'flex',
    flexDirection: 'column',
    gap:           '2px',
  },
  previewMain: {
    fontSize:     '13px',
    color:        'var(--color-text)',
    whiteSpace:   'nowrap',
    overflow:     'hidden',
    textOverflow: 'ellipsis',
    maxWidth:     '292px',
  },
  previewSub: {
    fontSize: '11px',
    color:    'var(--color-muted)',
  },
}

// ─── Task row ─────────────────────────────────────────────────────────────────

function TaskRow({ task, expanded, onToggleExpand, onToggleDone, onTimeSelect }) {
  const isOverdue = task.dueTime && !task.done && toMins(new Date()) > parseHHMM(task.dueTime)

  return (
    <div style={tr.wrap}>
      {/* Row header */}
      <div style={tr.row}>
        {/* Done circle */}
        <button
          style={{
            ...tr.circle,
            background:  task.done ? 'var(--color-success)' : 'none',
            borderColor: task.done ? 'var(--color-success)' : 'var(--color-border)',
          }}
          onClick={e => { e.stopPropagation(); onToggleDone() }}
          aria-label={task.done ? 'Mark undone' : 'Mark done'}
        >
          {task.done && <span style={tr.check}>✓</span>}
        </button>

        {/* Text + meta */}
        <button style={tr.textBtn} onClick={onToggleExpand}>
          <span style={{
            ...tr.taskText,
            color:          task.done ? 'var(--color-success)' : 'var(--color-text)',
            textDecoration: task.done ? 'line-through' : 'none',
            opacity:        task.done ? 0.6 : 1,
          }}>
            {task.text}
          </span>
          <div style={tr.meta}>
            {task.scheduledTime && (
              <span style={tr.timeBadge}>{formatMins(parseHHMM(task.scheduledTime))}</span>
            )}
            {isOverdue && !task.done && (
              <span style={tr.overdueBadge}>overdue</span>
            )}
            <span style={{ ...tr.chevron, transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>›</span>
          </div>
        </button>
      </div>

      {/* Inline time picker */}
      {expanded && (
        <div style={tr.pickerWrap}>
          <p style={tr.pickerLabel}>Schedule for</p>
          <div style={tr.pills}>
            {TIME_OPTIONS.map(opt => (
              <button
                key={opt.value}
                style={{
                  ...tr.pill,
                  background:  task.scheduledTime === opt.value ? 'var(--color-accent)' : 'var(--color-card)',
                  color:       task.scheduledTime === opt.value ? '#fff' : 'var(--color-muted)',
                  border:      task.scheduledTime === opt.value ? '0.5px solid var(--color-accent)' : 'var(--border)',
                  fontWeight:  task.scheduledTime === opt.value ? 600 : 400,
                }}
                onClick={() => onTimeSelect(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const tr = {
  wrap:       { background: 'var(--color-card)', border: 'var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' },
  row:        { display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 14px 14px 12px' },
  circle:     { width: '22px', height: '22px', borderRadius: '50%', border: '1.5px solid', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.15s, border-color 0.15s' },
  check:      { fontSize: '12px', color: '#fff', lineHeight: 1 },
  textBtn:    { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 },
  taskText:   { fontSize: '15px', fontWeight: 500, flex: 1, lineHeight: 1.3, transition: 'color 0.15s, opacity 0.15s' },
  meta:       { display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 },
  timeBadge:  { fontSize: '11px', color: 'var(--color-accent)', background: 'var(--color-accent-bg)', padding: '2px 7px', borderRadius: 'var(--radius-pill)', border: '0.5px solid var(--color-accent)' },
  overdueBadge: { fontSize: '10px', color: 'var(--color-danger)', background: 'rgba(224,85,85,0.12)', padding: '2px 7px', borderRadius: 'var(--radius-pill)' },
  chevron:    { fontSize: '18px', color: 'var(--color-faint)', transition: 'transform 0.2s var(--ease-out)', lineHeight: 1 },
  pickerWrap: { borderTop: 'var(--border)', padding: '10px 0 12px' },
  pickerLabel:{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-muted)', padding: '0 14px', marginBottom: '8px' },
  pills:      { display: 'flex', gap: '6px', overflowX: 'auto', padding: '2px 14px', scrollbarWidth: 'none', msOverflowStyle: 'none' },
  pill:       { flexShrink: 0, padding: '5px 10px', borderRadius: 'var(--radius-pill)', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background 0.15s, color 0.15s' },
}

// ─── Fuel slot ────────────────────────────────────────────────────────────────

function FuelSlot({ slotKey, meal, nowMins: currentMins, onMarkEaten, onOpenEditor }) {
  const late = !meal.eaten && currentMins > parseHHMM(meal.lateAfter)
  const eaten = meal.eaten

  const stateColor = eaten ? 'var(--color-success)'
                   : late  ? 'var(--color-accent)'
                   :         'var(--color-faint)'
  const stateBg    = eaten ? 'var(--color-success-bg)'
                   : late  ? 'var(--color-accent-bg)'
                   :         'var(--color-card)'
  const borderCol  = eaten ? 'var(--color-success)'
                   : late  ? 'var(--color-accent)'
                   :         'var(--color-border)'

  return (
    <div style={{ ...fs.wrap, background: stateBg, border: `0.5px solid ${borderCol}` }}>
      <div style={fs.row}>
        {/* Tap body to mark eaten */}
        <button style={fs.mainBtn} onClick={() => onMarkEaten(slotKey)}>
          <span style={{ ...fs.label, color: stateColor }}>
            {eaten ? '✓ ' : late ? '! ' : ''}{meal.label}
          </span>
          <span style={fs.window}>{formatMealTime(meal.startTime)} – {formatMealTime(meal.endTime)}</span>
        </button>

        {/* Clock icon — open bottom-sheet time editor */}
        {!eaten && (
          <button
            style={fs.editBtn}
            onClick={() => onOpenEditor(slotKey)}
            aria-label="Edit time window"
          >
            ◷
          </button>
        )}
      </div>
    </div>
  )
}

const fs = {
  wrap:      { borderRadius: 'var(--radius-sm)', overflow: 'hidden', transition: 'background 0.2s, border-color 0.2s' },
  row:       { display: 'flex', alignItems: 'center' },
  mainBtn:   { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '12px 12px 12px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' },
  label:     { fontSize: '14px', fontWeight: 600, transition: 'color 0.2s' },
  window:    { fontSize: '11px', color: 'var(--color-muted)', marginTop: '2px' },
  editBtn:   { padding: '12px 14px 12px 4px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', flexShrink: 0, color: 'var(--color-faint)', transition: 'color 0.15s' },
}

// ─── She Stitches goal card ───────────────────────────────────────────────────

const PACE_STYLES = {
  [PACE_STATUS.ON_TRACK]: {
    border:     'var(--color-success)',
    badgeBg:    'var(--color-success-bg)',
    badgeColor: 'var(--color-success)',
    label:      'On track',
  },
  [PACE_STATUS.BUFFER]: {
    border:     'var(--color-buffer-bg)',
    badgeBg:    'var(--color-buffer-bg)',
    badgeColor: 'var(--color-buffer)',
    label:      '7 days buffer',
  },
  [PACE_STATUS.BEHIND]: {
    border:     'var(--color-danger)',
    badgeBg:    'rgba(224,85,85,0.12)',
    badgeColor: 'var(--color-danger)',
    label:      'Behind',
  },
}

function FocusProjectCard({ projectName, projectEmoji, doneCount, totalCount, listingsCount, nextTask, dayOf90, paceStatus, onTap }) {
  const pct   = totalCount ? Math.round((doneCount / totalCount) * 100) : 0
  const pace  = PACE_STYLES[paceStatus] ?? PACE_STYLES[PACE_STATUS.ON_TRACK]

  return (
    <div
      style={{ ...ss.wrap, border: `0.5px solid ${pace.border}` }}
      onClick={onTap} role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onTap()}
    >
      <div style={ss.topEdge} />
      <div style={ss.inner}>
        {/* Top row */}
        <div style={ss.topRow}>
          <div style={ss.iconWrap}>
            <span style={ss.icon}>{projectEmoji}</span>
          </div>
          <div style={ss.nameMeta}>
            <span style={ss.name}>{projectName}</span>
            <span style={ss.day}>Day {dayOf90} of 90</span>
          </div>
          <span style={{ ...ss.paceBadge, background: pace.badgeBg, color: pace.badgeColor }}>
            {pace.label}
          </span>
          <span style={ss.arrow}>→</span>
        </div>

        {/* Progress label */}
        <div style={ss.progressRow}>
          <span style={ss.progressLeft}>{doneCount} of {totalCount} tasks done</span>
          <span style={ss.progressPct}>{pct}%</span>
        </div>
        <div style={ss.track}>
          <div style={{ ...ss.fill, width: `${pct}%` }} />
        </div>

        {/* Stats */}
        <div style={ss.statsRow}>
          <span style={ss.stat}>{listingsCount} listings live</span>
          <div style={ss.statDivider} />
          <span style={ss.stat}>{doneCount} tasks done</span>
        </div>

        {/* Next task */}
        {nextTask && (
          <div style={ss.nextRow}>
            <span style={ss.nextDot} />
            <span style={ss.nextText}>{nextTask}</span>
          </div>
        )}
      </div>
    </div>
  )
}

const ss = {
  wrap: {
    borderRadius: 'var(--radius-card)',
    overflow:     'hidden',
    cursor:       'pointer',
    transition:   'border-color 0.3s ease',
  },
  paceBadge: {
    flexShrink:   0,
    fontSize:     '10px',
    fontWeight:   700,
    padding:      '2px 8px',
    borderRadius: 'var(--radius-pill)',
    letterSpacing:'0.04em',
  },
  topEdge: {
    height:     '2px',
    background: 'linear-gradient(90deg, var(--color-accent), var(--color-accent-light))',
  },
  inner: {
    background: 'var(--color-card)',
    padding:    '12px 14px',
  },
  topRow: {
    display:    'flex',
    alignItems: 'center',
    gap:        '10px',
    marginBottom: '10px',
  },
  iconWrap: {
    width:          '28px',
    height:         '28px',
    borderRadius:   '50%',
    background:     'var(--color-accent-bg)',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
    fontSize:       '14px',
  },
  icon: { lineHeight: 1 },
  nameMeta: {
    flex:          1,
    display:       'flex',
    flexDirection: 'column',
    gap:           '1px',
  },
  name:  { fontSize: '13px', fontWeight: 600, color: 'var(--color-text)' },
  day:   { fontSize: '11px', color: 'var(--color-muted)' },
  arrow: { fontSize: '16px', color: 'var(--color-faint)' },

  progressRow: {
    display:        'flex',
    justifyContent: 'space-between',
    marginBottom:   '5px',
  },
  progressLeft: { fontSize: '11px', color: 'var(--color-muted)' },
  progressPct:  { fontSize: '11px', fontWeight: 600, color: 'var(--color-accent)' },
  track: {
    height:       '3px',
    background:   'var(--color-faint)',
    borderRadius: 'var(--radius-pill)',
    overflow:     'hidden',
    marginBottom: '10px',
  },
  fill: {
    height:       '100%',
    background:   'linear-gradient(90deg, var(--color-accent), var(--color-accent-light))',
    borderRadius: 'var(--radius-pill)',
    transition:   'width 0.4s ease',
  },

  statsRow: {
    display:    'flex',
    alignItems: 'center',
    gap:        '10px',
    marginBottom: '10px',
  },
  stat:        { fontSize: '12px', color: 'var(--color-muted)' },
  statDivider: { width: '0.5px', height: '12px', background: 'var(--color-border)', flexShrink: 0 },

  nextRow: {
    display:     'flex',
    alignItems:  'flex-start',
    gap:         '8px',
    borderTop:   'var(--border)',
    paddingTop:  '10px',
  },
  nextDot: {
    width:        '5px',
    height:       '5px',
    borderRadius: '50%',
    background:   'var(--color-accent)',
    flexShrink:   0,
    marginTop:    '4px',
  },
  nextText: { fontSize: '12px', color: 'var(--color-muted)', lineHeight: 1.4, flex: 1 },
}

// ─── Today's Training card ─────────────────────────────────────────────────────

function TodayTrainingCard({ todayComplete, gymAccess, weekNumber, onStart, compact = false }) {
  const todayType = getTodayType()
  const workout   = generateWorkout(todayType, gymAccess, weekNumber)
  const canStart  = workout.type !== 'rest' && !todayComplete

  return (
    <div style={tt.wrap}>
      <div style={tt.top}>
        <span style={tt.typeTag}>{WORKOUT_LABEL[workout.type] ?? 'Workout'}</span>
        <div style={tt.info}>
          <p style={tt.name}>{compact ? 'Workout details' : workout.title}</p>
          <p style={tt.sub}>{compact ? 'Warmup · Main · Cooldown' : workout.subtitle}</p>
        </div>
        {todayComplete && <span style={tt.doneBadge}>✓ Done</span>}
      </div>
      {workout.type !== 'rest' && (
        <button
          style={{
            ...tt.startBtn,
            ...(compact ? tt.startBtnSecondary : {}),
            background: todayComplete
              ? 'var(--color-success-bg)'
              : compact
                ? 'var(--color-chart-bar)'
                : 'var(--color-accent)',
            color:      todayComplete ? 'var(--color-success)' : compact ? 'var(--color-muted)' : '#fff',
            border:     todayComplete ? '0.5px solid var(--color-success)' : compact ? 'var(--border)' : 'none',
            cursor:     canStart ? 'pointer' : 'default',
          }}
          onClick={canStart ? onStart : undefined}
          disabled={!canStart}
        >
          {todayComplete ? '✓ Completed' : 'Start →'}
        </button>
      )}
    </div>
  )
}

function CollapsibleCard({ id, title, subtitle, preview, expanded, onToggle, children }) {
  return (
    <section style={cc.wrap}>
      <button
        style={cc.header}
        onClick={() => onToggle(id)}
        aria-expanded={expanded}
      >
        <div style={cc.headerText}>
          <span style={cc.title}>{title}</span>
          {subtitle && <span style={cc.subtitle}>{subtitle}</span>}
        </div>
        <span style={{ ...cc.chevron, transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>›</span>
      </button>
      {!expanded && preview}
      {expanded && <div style={cc.body}>{children}</div>}
    </section>
  )
}

const cc = {
  wrap: {
    margin:       '12px 20px 0',
    background:   'var(--color-card)',
    border:       'var(--border)',
    borderRadius: 'var(--radius-card)',
    overflow:     'hidden',
  },
  header: {
    width:          '100%',
    minHeight:      '58px',
    padding:        '12px 14px',
    background:     'none',
    border:         'none',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    gap:            '12px',
    cursor:         'pointer',
    textAlign:      'left',
  },
  headerText: { display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 },
  title: {
    fontSize:      '11px',
    fontWeight:    700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color:         'var(--color-text)',
  },
  subtitle: {
    fontSize:     '12px',
    color:        'var(--color-muted)',
    overflow:     'hidden',
    textOverflow: 'ellipsis',
    whiteSpace:   'nowrap',
    maxWidth:     '260px',
  },
  chevron: {
    fontSize:   '22px',
    lineHeight: 1,
    color:      'var(--color-faint)',
    transition: 'transform 0.2s var(--ease-out)',
    flexShrink: 0,
  },
  body: {
    borderTop:     'var(--border)',
    padding:       '12px',
    display:       'flex',
    flexDirection: 'column',
    gap:           '12px',
  },
}

const tt = {
  wrap: {
    background:    'transparent',
    border:        'none',
    borderRadius:  0,
    padding:       0,
    display:       'flex',
    flexDirection: 'column',
    gap:           '12px',
  },
  top: { display: 'flex', alignItems: 'center', gap: '12px' },
  typeTag: {
    fontSize:      '10px',
    fontWeight:    700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color:         'var(--color-accent)',
    background:    'var(--color-accent-bg)',
    padding:       '3px 8px',
    borderRadius:  'var(--radius-pill)',
    flexShrink:    0,
  },
  info: {
    flex:          1,
    display:       'flex',
    flexDirection: 'column',
    gap:           '2px',
  },
  name: { fontSize: '16px', fontWeight: 600, color: 'var(--color-text)' },
  sub:  { fontSize: '12px', color: 'var(--color-muted)' },
  doneBadge: {
    padding:      '4px 10px',
    borderRadius: 'var(--radius-pill)',
    background:   'var(--color-success-bg)',
    color:        'var(--color-success)',
    border:       '0.5px solid var(--color-success)',
    fontSize:     '11px',
    fontWeight:   600,
    flexShrink:   0,
  },
  startBtn: {
    width:        '100%',
    padding:      '12px',
    borderRadius: 'var(--radius-sm)',
    fontSize:     '14px',
    fontWeight:   600,
  },
  startBtnSecondary: {
    padding:  '10px',
    fontSize: '13px',
  },
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function Home({ onOpenFocus, onNavigate, onStartWorkout }) {
  const { projectsState }                              = useProjects()
  const { userState }                                  = useUser()
  const { settingsState }                              = useSettings()
  const { dayState, dayDispatch, updateTaskTime, updateMealWindow } = useDay()
  const { fitnessState }                               = useFitness()

  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const currentMins = toMins(now)

  const [expandedTask, setExpandedTask] = useState(null)
  const [editingSlot, setEditingSlot] = useState(null)
  const [expandedSection, setExpandedSection] = useState(SECTION_KEYS.TIMELINE)

  const focusProject = useMemo(
    () => projectsState.projects?.find(p => p.status === PROJECT_STATUS.FOCUS) ?? null,
    [projectsState.projects]
  )
  const { doneCount, totalCount, listingsCount, nextTask, dayOf90 } = useMemo(
    () => getProjectStats(focusProject),
    [focusProject]
  )
  const paceStatus = useMemo(() => {
    if (!focusProject) return 'on_track'
    return getProjectPace(focusProject).status
  }, [focusProject])

  const enabledModules = useMemo(
    () => getEnabledModules(settingsState.modules),
    [settingsState.modules]
  )

  const weekNumber = getWeekNumber(fitnessState.programStartDate)
  const todayWorkout = useMemo(
    () => generateWorkout(getTodayType(), settingsState.gymAccess, weekNumber),
    [settingsState.gymAccess, weekNumber]
  )

  const timelineItems = useMemo(
    () => buildTimeline(dayState, currentMins, { includePlannedWorkout: true }),
    [dayState, currentMins]
  )
  const timelinePreview = useMemo(
    () => getTimelinePreview(timelineItems, currentMins),
    [timelineItems, currentMins]
  )
  const burnBarLabel = useMemo(
    () => getBurnBarLabel(timelinePreview),
    [timelinePreview]
  )

  const showFocusProjects = enabledModules.focus || enabledModules.goals || !!focusProject

  const projectSectionLabel = focusProject?.name
    ? focusProject.name.toUpperCase()
    : 'PROJECTS'
  const focusNextTask    = nextTask ?? 'Set a focus project in Projects'
  const incompleteTasks  = dayState.tasks.filter(task => !task.done).length
  const eatenMeals       = Object.values(dayState.meals).filter(meal => meal.eaten).length
  const totalMeals       = Object.values(dayState.meals).length

  function handleToggleExpand(taskId) {
    setExpandedTask(prev => prev === taskId ? null : taskId)
  }

  function handleToggleDone(taskId) {
    dayDispatch({ type: 'TOGGLE_TASK', payload: taskId })
  }

  function handleTimeSelect(taskId, time) {
    updateTaskTime(taskId, time)
    setExpandedTask(null)
  }

  function handleMarkEaten(slot) {
    dayDispatch({ type: 'MARK_MEAL_EATEN', payload: slot })
  }

  function handleStartTodayWorkout() {
    if (todayWorkout.type === 'rest' || fitnessState.todayComplete) return
    onStartWorkout && onStartWorkout(todayWorkout)
  }

  function handleToggleSection(id) {
    setExpandedSection(prev => prev === id ? null : id)
  }

  function handleOpenMeals() {
    setExpandedSection(SECTION_KEYS.MEALS)
  }

  const canStartWorkout = enabledModules.fitness && todayWorkout.type !== 'rest' && !fitnessState.todayComplete

  return (
    <div style={s.screen}>
      <QuickActionsHero
        now={now}
        name={userState.name}
        showFocus={enabledModules.focus}
        showMeals={enabledModules.nutrition}
        showWorkout={canStartWorkout}
        onFocus={onOpenFocus}
        onJournal={() => onNavigate(SCREENS.EOD)}
        onMeals={handleOpenMeals}
        onWorkout={handleStartTodayWorkout}
        onOpenSettings={() => onNavigate(SCREENS.SETTINGS)}
      />

      <BurnBar now={now} nextLabel={burnBarLabel} />

      <div style={s.cards}>
        <CollapsibleCard
          id={SECTION_KEYS.TIMELINE}
          title="Today Timeline"
          subtitle={timelinePreview.next ? `Next: ${formatMins(timelinePreview.next.timeMins)}` : 'Clear for now'}
          preview={<TimelinePreview preview={timelinePreview} />}
          expanded={expandedSection === SECTION_KEYS.TIMELINE}
          onToggle={handleToggleSection}
        >
          <Timeline items={timelineItems} />
        </CollapsibleCard>

        {enabledModules.fitness && (
          <CollapsibleCard
            id={SECTION_KEYS.TRAINING}
            title="Training"
            subtitle={fitnessState.todayComplete ? 'Completed today' : 'Warmup · Main · Cooldown'}
            expanded={expandedSection === SECTION_KEYS.TRAINING}
            onToggle={handleToggleSection}
          >
            <TodayTrainingCard
              todayComplete={fitnessState.todayComplete}
              gymAccess={settingsState.gymAccess}
              weekNumber={weekNumber}
              onStart={handleStartTodayWorkout}
              compact={canStartWorkout}
            />
          </CollapsibleCard>
        )}

        <CollapsibleCard
          id={SECTION_KEYS.TASKS}
          title="Tasks"
          subtitle={`${incompleteTasks} open`}
          expanded={expandedSection === SECTION_KEYS.TASKS}
          onToggle={handleToggleSection}
        >
          <div style={s.stack}>
            {dayState.tasks.map(task => (
              <TaskRow
                key={task.id}
                task={task}
                expanded={expandedTask === task.id}
                onToggleExpand={() => handleToggleExpand(task.id)}
                onToggleDone={() => handleToggleDone(task.id)}
                onTimeSelect={time => handleTimeSelect(task.id, time)}
              />
            ))}
          </div>
        </CollapsibleCard>

        {enabledModules.nutrition && (
          <CollapsibleCard
            id={SECTION_KEYS.MEALS}
            title="Meals"
            subtitle={`${eatenMeals} of ${totalMeals} eaten`}
            expanded={expandedSection === SECTION_KEYS.MEALS}
            onToggle={handleToggleSection}
          >
            <div style={s.mealGrid}>
              {Object.entries(dayState.meals).map(([slot, meal]) => (
                <FuelSlot
                  key={slot}
                  slotKey={slot}
                  meal={meal}
                  nowMins={currentMins}
                  onMarkEaten={handleMarkEaten}
                  onOpenEditor={setEditingSlot}
                />
              ))}
            </div>
          </CollapsibleCard>
        )}

        {showFocusProjects && (
          <CollapsibleCard
            id={SECTION_KEYS.FOCUS}
            title="Focus / Projects"
            subtitle={focusProject?.name ?? 'Focus session'}
            expanded={expandedSection === SECTION_KEYS.FOCUS}
            onToggle={handleToggleSection}
          >
            {enabledModules.focus && !focusProject && (
              <p style={s.focusContext}>
                Focus timer is ready from the hero or secondary action.
              </p>
            )}
            {(enabledModules.goals || focusProject) && (
              <>
                <p style={s.sectionLabel}>{projectSectionLabel}</p>
                <FocusProjectCard
                  projectName={focusProject?.name ?? 'Projects'}
                  projectEmoji={focusProject?.emoji ?? '📋'}
                  doneCount={doneCount}
                  totalCount={totalCount}
                  listingsCount={listingsCount}
                  nextTask={focusNextTask}
                  dayOf90={dayOf90}
                  paceStatus={paceStatus}
                  onTap={() => onNavigate(SCREENS.PROJECTS)}
                />
              </>
            )}
          </CollapsibleCard>
        )}
      </div>

      {editingSlot && (
        <FuelEditSheet
          meal={dayState.meals[editingSlot]}
          onClose={() => setEditingSlot(null)}
          onSave={(start, end) => {
            updateMealWindow(editingSlot, start, end)
            setEditingSlot(null)
          }}
        />
      )}
    </div>
  )
}

// ─── Screen styles ─────────────────────────────────────────────────────────────

const s = {
  screen: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '0',
    paddingTop:    'max(env(safe-area-inset-top), 52px)',
    paddingBottom: 'calc(var(--safe-bottom) + var(--nav-height) + 24px)',
    minHeight:     '100dvh',
    position:      'relative',
    background:    'var(--color-bg)',
  },
  section: {
    display:       'flex',
    flexDirection: 'column',
    gap:           'var(--space-3)',
    padding:       '16px 20px 0',
  },
  sectionLabel: {
    fontSize:      '11px',
    fontWeight:    600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color:         'var(--color-muted)',
  },
  stack: {
    display:       'flex',
    flexDirection: 'column',
    gap:           'var(--space-2)',
  },
  cards: {
    paddingTop: '4px',
  },
  mealGrid: {
    display:             'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap:                 'var(--space-2)',
  },
  focusContext: {
    margin:       0,
    padding:      '10px 12px',
    borderRadius: 'var(--radius-sm)',
    border:       'var(--border)',
    background:   'var(--color-chart-bar)',
    color:        'var(--color-muted)',
    fontSize:     '13px',
    lineHeight:   1.4,
  },
}
