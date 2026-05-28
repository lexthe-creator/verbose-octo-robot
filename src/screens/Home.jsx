import { useState, useEffect, useMemo, useRef } from 'react'
import { useUser } from '../context/UserContext.jsx'
import { useSettings } from '../context/SettingsContext.jsx'
import { useDay, useFitness, useInbox, useProjects, getProjectStats } from '../context/index.js'
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

const TIMELINE_SECTIONS = [
  { key: 'morning', label: 'Morning', range: '6 AM - 12 PM' },
  { key: 'work', label: 'Day Flow', range: '12 PM - 5 PM' },
  { key: 'evening', label: 'Evening', range: '5 PM - 11 PM' },
]

const DENSITY_OPTIONS = ['minimal', 'balanced', 'detailed']

const SUPPORT_BUTTONS = [
  { key: 'journal', label: 'Journal', icon: '◇' },
  { key: 'nutrition', label: 'Nutrition', icon: '◷' },
  { key: 'focus', label: 'Focus', icon: '⊙' },
  { key: 'quickAdd', label: 'Quick Add', icon: '+' },
]

function getEnabledModules(modules = {}) {
  return {
    fitness:   modules.fitness !== false,
    nutrition: modules.nutrition === true,
    goals:     modules.goals === true,
    focus:     modules.focus !== false,
    finance:   modules.finance !== false,
  }
}

// ─── Header helpers ───────────────────────────────────────────────────────────

function greeting(now, name) {
  const h = now.getHours()
  const part = h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening'
  return `Good ${part}, ${name}`
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

function buildTimeline(state, nowMinutes, options = {}) {
  const items = []
  const { includePlannedWorkout = true } = options

  // Morning ignition — always at 6am
  items.push({
    key:      'ignition',
    timeMins: 6 * 60,
    label:    'Morning Check-In',
    detail:   state.dayLockedAt ? 'Day rhythm set' : 'Mood · energy · mode',
    type:     'routine',
    done:     !!state.dayLockedAt,
  })

  // Workout
  if (state.workout?.time && (state.workoutConfirmed || state.workout.confirmed || includePlannedWorkout)) {
    const wm = parseHHMM(state.workout.time)
    items.push({
      key:      'workout',
      timeMins: wm,
      label:    `${state.workout.type} · ${state.workout.duration}`,
      detail:   state.workout.pace || 'Warmup · main work · cooldown',
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
        detail:   'Scheduled task',
        type:     'task',
        done:     t.done,
        task:     t,
      })
    }
  })

  // Meal windows
  Object.entries(state.meals).forEach(([slot, meal]) => {
    items.push({
      key:      `meal-${slot}`,
      timeMins: parseHHMM(meal.startTime),
      label:    `${meal.label} window`,
      detail:   `${formatMealTime(meal.startTime)} - ${formatMealTime(meal.endTime)}`,
      type:     'meal',
      done:     meal.eaten,
      late:     !meal.eaten && nowMinutes > parseHHMM(meal.lateAfter),
    })
  })

  items.sort((a, b) => a.timeMins - b.timeMins)

  const timeCounts = items.reduce((acc, item) => {
    acc[item.timeMins] = (acc[item.timeMins] || 0) + 1
    return acc
  }, {})

  items.forEach(item => {
    item.section = getTimelineSection(item.timeMins)
    item.overlaps = timeCounts[item.timeMins] > 1
  })

  // Insert "now" marker at chronological position
  const nowItem = { key: 'now', timeMins: nowMinutes, label: 'Right now', detail: 'You are here', type: 'now', section: getTimelineSection(nowMinutes) }
  const insertAt = items.findIndex(item => item.timeMins > nowMinutes)
  if (insertAt === -1) items.push(nowItem)
  else items.splice(insertAt, 0, nowItem)

  return items
}

function getTimelineSection(timeMins) {
  if (timeMins < 12 * 60) return 'morning'
  if (timeMins < 17 * 60) return 'work'
  return 'evening'
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
  return `${formatMins(timelinePreview.next.timeMins)} · ${timelinePreview.next.label}`
}

function Timeline({
  items,
  density,
  collapsedSections,
  expandedTask,
  onToggleSection,
  onToggleTask,
  onToggleTaskDone,
  onTaskTimeSelect,
}) {
  function dotColor(item) {
    if (item.type === 'now')     return 'var(--color-accent)'
    if (item.done)               return 'var(--color-success)'
    if (item.late)               return 'var(--color-accent)'
    if (item.type === 'workout') return 'var(--color-accent)'
    if (item.type === 'routine') return 'var(--color-accent-light)'
    return 'var(--color-faint)'
  }

  return (
    <div style={tl.card}>
      {TIMELINE_SECTIONS.map(section => {
        const sectionItems = items.filter(item => item.section === section.key)
        const collapsed = collapsedSections.includes(section.key)
        const active = sectionItems.some(item => item.type === 'now')

        return (
          <div key={section.key} style={tl.section}>
            <button
              style={tl.sectionHeader}
              onClick={() => onToggleSection(section.key)}
              aria-expanded={!collapsed}
            >
              <span style={tl.sectionTitleWrap}>
                <span style={tl.sectionTitle}>{section.label}</span>
                <span style={tl.sectionRange}>{active ? 'Right now' : section.range}</span>
              </span>
              <span style={tl.sectionMeta}>{sectionItems.length} item{sectionItems.length === 1 ? '' : 's'}</span>
            </button>

            {!collapsed && (
              <div style={tl.list}>
                {sectionItems.map((item, idx) => {
                  if (item.type === 'task' && item.task) {
                    return (
                      <div key={item.key} style={{ ...tl.row, ...(item.overlaps ? tl.overlapRow : {}) }}>
                        <span style={tl.time}>{formatMins(item.timeMins)}</span>
                        <div style={tl.dotCol}>
                          <div style={{ ...tl.dot, background: dotColor(item) }} />
                          {idx < sectionItems.length - 1 && <div style={tl.line} />}
                        </div>
                        <div style={tl.interactiveItem}>
                          <TaskRow
                            task={item.task}
                            expanded={expandedTask === item.task.id}
                            onToggleExpand={() => onToggleTask(item.task.id)}
                            onToggleDone={() => onToggleTaskDone(item.task.id)}
                            onTimeSelect={time => onTaskTimeSelect(item.task.id, time)}
                          />
                          {item.overlaps && <span style={tl.inlinePip}>overlaps</span>}
                        </div>
                      </div>
                    )
                  }

                  return (
                    <div key={item.key} style={{ ...tl.row, ...(item.overlaps ? tl.overlapRow : {}) }}>
                      <span style={tl.time}>
                        {item.type === 'now' ? '' : formatMins(item.timeMins)}
                      </span>

                      <div style={tl.dotCol}>
                        <div style={{ ...tl.dot, background: dotColor(item), boxShadow: item.type === 'now' ? `0 0 0 4px var(--color-accent-bg)` : 'none' }} />
                        {idx < sectionItems.length - 1 && <div style={tl.line} />}
                      </div>

                      <div style={tl.labelWrap}>
                        <span style={{
                          ...tl.label,
                          color:          item.type === 'now' ? 'var(--color-accent)' : item.done ? 'var(--color-success)' : 'var(--color-text)',
                          fontWeight:     item.type === 'now' ? 700 : 500,
                          textDecoration: item.done && item.type !== 'now' ? 'line-through' : 'none',
                          opacity:        item.done ? 0.62 : item.planned ? 0.84 : 1,
                        }}>
                          {item.label}
                        </span>
                        {density !== 'minimal' && item.detail && <span style={tl.detail}>{item.detail}</span>}
                        <span style={tl.pips}>
                          {item.overlaps && <span style={tl.softPip}>overlaps</span>}
                          {item.planned && <span style={tl.softPip}>planned</span>}
                          {item.type === 'now' && <span style={tl.nowPip}>current</span>}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

const tl = {
  card:    { background: 'transparent', border: 'none', borderRadius: 0, padding: 0 },
  section: { padding: '2px 0 12px' },
  sectionHeader: {
    width:          '100%',
    minHeight:      '34px',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    gap:            '12px',
    padding:        '0 2px 8px',
    color:          'var(--color-text)',
    textAlign:      'left',
  },
  sectionTitleWrap: { display: 'flex', flexDirection: 'column', gap: '1px' },
  sectionTitle: { fontSize: '13px', fontWeight: 700, color: 'var(--color-text)', textTransform: 'uppercase' },
  sectionRange: { fontSize: '11px', color: 'var(--color-muted)' },
  sectionMeta: { fontSize: '11px', color: 'var(--color-muted)', flexShrink: 0 },
  list:    { display: 'flex', flexDirection: 'column' },
  row:     { display: 'flex', alignItems: 'flex-start', gap: '10px', minHeight: '38px' },
  overlapRow: { paddingLeft: '6px', borderLeft: '1px solid var(--color-accent-bg)' },
  time:    { fontSize: '11px', color: 'var(--color-muted)', width: '52px', flexShrink: 0, paddingTop: '2px', textAlign: 'right' },
  dotCol:  { display: 'flex', flexDirection: 'column', alignItems: 'center', width: '10px', flexShrink: 0 },
  dot:     { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, marginTop: '3px' },
  line:    { width: '1px', flex: 1, minHeight: '26px', background: 'color-mix(in srgb, var(--color-faint) 72%, transparent)', margin: '3px 0' },
  labelWrap: { flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', paddingBottom: '12px' },
  interactiveItem: { flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', paddingBottom: '12px' },
  label:   { fontSize: '14px', paddingTop: '0', flex: 1, lineHeight: 1.35 },
  detail:  { fontSize: '11px', color: 'var(--color-muted)', lineHeight: 1.35 },
  pips:    { display: 'flex', gap: '5px', flexWrap: 'wrap' },
  nowPip:  {
    padding:       '1px 6px',
    borderRadius:  'var(--radius-pill)',
    background:    'var(--color-accent-bg)',
    color:         'var(--color-accent-light)',
    fontSize:      '10px',
    fontWeight:    600,
  },
  softPip: {
    padding:       '1px 6px',
    borderRadius:  'var(--radius-pill)',
    background:    'var(--color-chart-bar)',
    color:         'var(--color-muted)',
    fontSize:      '10px',
    fontWeight:    600,
  },
  inlinePip: { alignSelf: 'flex-start', fontSize: '10px', color: 'var(--color-muted)', background: 'var(--color-chart-bar)', borderRadius: 'var(--radius-pill)', padding: '1px 6px' },
}

// ─── Task row ─────────────────────────────────────────────────────────────────

function TaskRow({ task, expanded, onToggleExpand, onToggleDone, onTimeSelect }) {
  const isAvailable = task.dueTime && !task.done && toMins(new Date()) > parseHHMM(task.dueTime)

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
            {isAvailable && !task.done && (
              <span style={tr.availableBadge}>still available</span>
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
  timeBadge:  { fontSize: '11px', color: 'var(--color-accent)', background: 'color-mix(in srgb, var(--color-accent-bg) 92%, transparent)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '0.5px solid var(--color-accent)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04)' },
  availableBadge: { fontSize: '10px', color: 'var(--color-muted)', background: 'var(--color-card)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: 'var(--border)' },
  chevron:    { fontSize: '18px', color: 'var(--color-faint)', transition: 'transform 0.2s var(--ease-out)', lineHeight: 1 },
  pickerWrap: { borderTop: 'var(--border)', padding: '10px 0 12px' },
  pickerLabel:{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-muted)', padding: '0 14px', marginBottom: '8px' },
  pills:      { display: 'flex', gap: '8px', overflowX: 'auto', padding: '4px 14px', scrollbarWidth: 'none', msOverflowStyle: 'none' },
  pill:       { flexShrink: 0, padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background 0.15s, color 0.15s, border-color 0.15s', border: 'var(--border)', background: 'var(--color-card)' },
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
    transition:   'border-color 0.3s ease, transform 0.2s ease',
    border:       '0.5px solid var(--border)',
    boxShadow:    '0 18px 50px rgba(0,0,0,0.08)',
    background:   'var(--color-card)',
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
        {todayComplete && <span style={tt.doneBadge}>Logged</span>}
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
          {todayComplete ? 'Logged' : 'Start →'}
        </button>
      )}
    </div>
  )
}

function TodayHeader({ now, name, mode, energy, density, onDensityChange, onOpenSettings }) {
  return (
    <header style={th.wrap}>
      <div style={th.topRow}>
        <div>
          <p style={th.greeting}>{greeting(now, name)}</p>
          <h1 style={th.title}>{formatFullDate(now)}</h1>
        </div>
        <button style={th.settingsBtn} onClick={onOpenSettings} aria-label="Settings">⚙</button>
      </div>
      <div style={th.metaRow}>
        <span style={th.metaPill}>{mode}</span>
        <span style={th.metaPill}>{energy ? `Energy ${energy}/4` : 'Energy open'}</span>
      </div>
      <div style={th.densityRow} aria-label="Timeline density">
        {DENSITY_OPTIONS.map(option => (
          <button
            key={option}
            style={{
              ...th.densityBtn,
              ...(density === option ? th.densityBtnActive : {}),
            }}
            onClick={() => onDensityChange(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </header>
  )
}

function MorningCheckInCard({ complete, energy, onStart }) {
  if (complete) return null

  return (
    <section style={mc.wrap}>
      <div style={mc.copy}>
        <span style={mc.kicker}>First gentle step</span>
        <h2 style={mc.title}>Morning Check-In</h2>
        <p style={mc.detail}>Mood, energy, mode, and one intention before the day starts moving.</p>
      </div>
      <button style={mc.button} onClick={onStart}>
        {energy ? 'Continue' : 'Check in'}
      </button>
    </section>
  )
}

function getCurrentFocus({ dayState, timelineItems, currentMins, canStartWorkout }) {
  const workoutItem = timelineItems.find(item => item.type === 'workout' && !item.done)
  const currentBlock = timelineItems.find(item =>
    item.type !== 'now' &&
    !item.done &&
    item.timeMins <= currentMins &&
    currentMins - item.timeMins <= 75
  )
  const nextBlock = timelineItems.find(item =>
    item.type !== 'now' &&
    !item.done &&
    item.timeMins > currentMins
  )

  if (!dayState.dayLockedAt) {
    return {
      eyebrow: 'Right now',
      title: 'Check in and set the tone',
      detail: 'A quick reset helps AIML shape the rest of your day.',
      action: 'Check in',
      actionType: 'checkin',
    }
  }

  if (currentBlock?.type === 'routine') {
    return {
      eyebrow: 'Current Focus',
      title: currentBlock.label,
      detail: currentBlock.detail || 'Move through the next small rhythm.',
      action: 'Continue',
      actionType: 'timeline',
    }
  }

  if (currentBlock?.type === 'workout' || (canStartWorkout && workoutItem && Math.abs(workoutItem.timeMins - currentMins) <= 90)) {
    return {
      eyebrow: 'Current Focus',
      title: workoutItem?.label ?? currentBlock.label,
      detail: 'Warmup, main work, cooldown, then log what happened.',
      action: 'Start workout',
      actionType: 'workout',
    }
  }

  // TODO: Include active focus sessions here once FocusTimer exposes running
  // session state outside of its screen-local component state.

  if (currentBlock) {
    return {
      eyebrow: 'Current Focus',
      title: currentBlock.label,
      detail: currentBlock.detail || 'Stay with this block for now.',
      action: 'Pick back up',
      actionType: 'timeline',
    }
  }

  if (nextBlock) {
    return {
      eyebrow: 'Continue Your Flow',
      title: nextBlock.label,
      detail: `${formatMins(nextBlock.timeMins)} · ${nextBlock.detail || 'Coming up in your day flow'}`,
      action: 'View flow',
      actionType: 'timeline',
    }
  }

  return {
    eyebrow: 'Pick Back Up',
    title: 'Today can still reflow',
    detail: 'Nothing urgent is asking for attention. Capture, reset, or continue gently.',
    action: 'Reflow day',
    actionType: 'reset',
  }
}

function CurrentFocus({ focus, onAction }) {
  return (
    <section style={cf.wrap}>
      <div style={cf.copy}>
        <span style={cf.eyebrow}>{focus.eyebrow}</span>
        <h2 style={cf.title}>{focus.title}</h2>
        <p style={cf.detail}>{focus.detail}</p>
      </div>
      <button style={cf.button} onClick={() => onAction(focus.actionType)}>
        {focus.action}
      </button>
    </section>
  )
}

function getSupportButtons(enabledModules) {
  const defaults = enabledModules.nutrition
    ? ['journal', 'nutrition', 'focus']
    : ['journal', 'quickAdd', 'focus']

  return defaults.map(key => SUPPORT_BUTTONS.find(button => button.key === key))
}

function SupportButtonRow({ buttons, onJournal, onNutrition, onFocus, onQuickAdd }) {
  const handlers = {
    journal: onJournal,
    nutrition: onNutrition,
    focus: onFocus,
    quickAdd: onQuickAdd,
  }

  return (
    <div style={sb.row}>
      {buttons.map(button => (
        <button key={button.key} style={sb.button} onClick={handlers[button.key]}>
          <span style={sb.icon}>{button.icon}</span>
          <span style={sb.label}>{button.label}</span>
        </button>
      ))}
    </div>
  )
}

function UtilityLayer({ inputRef, value, inboxCount, onChange, onSubmit, onOpenInbox, onReflow }) {
  return (
    <section style={ut.wrap}>
      <form style={ut.form} onSubmit={onSubmit}>
        <input
          ref={inputRef}
          style={ut.input}
          value={value}
          onChange={event => onChange(event.target.value)}
          placeholder="Capture anything else"
          aria-label="Quick add"
        />
        <button style={ut.addBtn} type="submit">Add</button>
      </form>
      <div style={ut.actions}>
        <button style={ut.linkBtn} onClick={onOpenInbox}>Inbox · {inboxCount}</button>
        <button style={ut.linkBtn} onClick={onReflow}>Reflow day</button>
        <button style={ut.linkBtn} onClick={onReflow}>Continue later</button>
      </div>
    </section>
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
    margin:       '12px 0 0',
    background:   'var(--color-card)',
    border:       'var(--border)',
    borderRadius: '16px',
    overflow:     'hidden',
    boxShadow:    '0 18px 50px rgba(0,0,0,0.05)',
  },
  header: {
    width:          '100%',
    minHeight:      '54px',
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
    borderTop:     '0.5px solid color-mix(in srgb, var(--color-border) 72%, transparent)',
    padding:       '12px',
    display:       'flex',
    flexDirection: 'column',
    gap:           '12px',
  },
}

const tt = {
  wrap: {
    background:    'var(--color-card)',
    border:        'var(--border)',
    borderRadius:  'var(--radius-card)',
    padding:       '16px',
    display:       'flex',
    flexDirection: 'column',
    gap:           '12px',
    boxShadow:     '0 14px 40px rgba(0,0,0,0.06)',
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
    border:       'none',
    cursor:       'pointer',
    transition:   'background 0.2s ease, color 0.2s ease',
  },
  startBtnSecondary: {
    padding:  '10px',
    fontSize: '13px',
  },
}

const th = {
  wrap: {
    padding:       '20px 20px 0',
    display:       'flex',
    flexDirection: 'column',
    gap:           '10px',
  },
  topRow: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    gap:            '14px',
  },
  greeting: {
    margin:    0,
    fontSize:  '12px',
    color:     'var(--color-muted)',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  title: {
    margin:      '2px 0 0',
    fontFamily: 'var(--font-body)',
    fontSize:   '26px',
    fontWeight: 600,
    lineHeight: 1.04,
    color:      'var(--color-text)',
  },
  settingsBtn: {
    width:          '34px',
    height:         '34px',
    borderRadius:   '50%',
    border:         'var(--border)',
    background:     'color-mix(in srgb, var(--color-card) 78%, transparent)',
    color:          'var(--color-muted)',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  metaRow: {
    display:   'flex',
    gap:       '8px',
    flexWrap:  'wrap',
  },
  metaPill: {
    padding:      '5px 10px',
    borderRadius: 'var(--radius-sm)',
    background:   'color-mix(in srgb, var(--color-card) 88%, transparent)',
    border:       'var(--border)',
    color:        'var(--color-muted)',
    fontSize:     '11px',
    fontWeight:   600,
  },
  densityRow: {
    display:       'flex',
    gap:           '6px',
    paddingTop:    '2px',
  },
  densityBtn: {
    padding:       '5px 9px',
    borderRadius:  'var(--radius-pill)',
    border:        'var(--border)',
    background:    'transparent',
    color:         'var(--color-muted)',
    fontSize:      '11px',
    textTransform: 'capitalize',
  },
  densityBtnActive: {
    background: 'var(--color-accent-bg)',
    color:      'var(--color-accent-light)',
    border:     '0.5px solid var(--color-accent)',
  },
}

const mc = {
  wrap: {
    margin:        '18px 20px 0',
    padding:       '16px',
    borderRadius:  '18px',
    border:        '0.5px solid color-mix(in srgb, var(--color-accent) 38%, var(--color-border))',
    background:    'linear-gradient(145deg, color-mix(in srgb, var(--color-accent-bg) 62%, transparent), var(--color-card))',
    display:       'flex',
    alignItems:    'center',
    gap:           '14px',
  },
  copy: { flex: 1, minWidth: 0 },
  kicker: {
    fontSize:      '10px',
    fontWeight:    700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color:         'var(--color-accent-light)',
  },
  title: {
    margin:      '3px 0 4px',
    fontFamily: 'var(--font-display)',
    fontSize:   '23px',
    fontWeight: 400,
    lineHeight: 1.1,
  },
  detail: {
    margin:     0,
    fontSize:   '12px',
    lineHeight: 1.45,
    color:      'var(--color-muted)',
  },
  button: {
    padding:      '9px 12px',
    borderRadius: 'var(--radius-pill)',
    background:   'var(--color-accent)',
    color:        '#fff',
    fontSize:     '12px',
    fontWeight:   700,
    flexShrink:   0,
  },
}

const cf = {
  wrap: {
    margin:        '16px 20px 0',
    padding:       '12px',
    borderRadius:  '16px',
    background:    'var(--color-card)',
    border:        '0.5px solid color-mix(in srgb, var(--color-border) 70%, transparent)',
    boxShadow:     '0 8px 24px rgba(0,0,0,0.08)',
    display:       'flex',
    alignItems:    'center',
    gap:           '10px',
  },
  copy: { flex: 1, minWidth: 0 },
  eyebrow: {
    fontSize:      '10px',
    fontWeight:    700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color:         'var(--color-accent-light)',
  },
  title: {
    margin:      '4px 0',
    fontFamily: 'var(--font-display)',
    fontSize:   '20px',
    fontWeight: 400,
    lineHeight: 1.08,
    color:      'var(--color-text)',
  },
  detail: {
    margin:     0,
    fontSize:   '12px',
    lineHeight: 1.45,
    color:      'var(--color-muted)',
  },
  button: {
    padding:      '8px 10px',
    borderRadius: 'var(--radius-pill)',
    background:   'var(--color-chart-bar)',
    color:        'var(--color-text)',
    border:       'var(--border)',
    fontSize:     '11px',
    fontWeight:   700,
    textTransform: 'uppercase',
    flexShrink:   0,
  },
}

const sb = {
  row: {
    display:             'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap:                 '8px',
  },
  button: {
    minHeight:     '48px',
    borderRadius:  '14px',
    background:    'var(--color-chart-bar)',
    border:        '0.5px solid color-mix(in srgb, var(--color-border) 72%, transparent)',
    color:         'var(--color-text)',
    display:       'flex',
    flexDirection: 'column',
    alignItems:    'center',
    justifyContent:'center',
    gap:           '3px',
  },
  icon: { color: 'var(--color-accent-light)', fontSize: '14px', lineHeight: 1 },
  label: { fontSize: '11px', fontWeight: 700 },
}

const ut = {
  wrap: {
    margin:        '18px 20px 0',
    padding:       '12px',
    borderRadius:  '18px',
    background:    'color-mix(in srgb, var(--color-card) 74%, transparent)',
    border:        '0.5px solid color-mix(in srgb, var(--color-border) 70%, transparent)',
    display:       'flex',
    flexDirection: 'column',
    gap:           '10px',
  },
  form: {
    display: 'flex',
    gap:     '8px',
  },
  input: {
    flex:         1,
    minWidth:    0,
    minHeight:   '40px',
    borderRadius:'var(--radius-pill)',
    background:  'var(--color-bg)',
    border:      'var(--border)',
    padding:     '0 13px',
    fontSize:    '13px',
  },
  addBtn: {
    padding:      '0 14px',
    borderRadius: 'var(--radius-pill)',
    background:   'var(--color-accent)',
    color:        '#fff',
    fontSize:     '12px',
    fontWeight:   700,
  },
  actions: {
    display:   'flex',
    gap:       '8px',
    flexWrap:  'wrap',
  },
  linkBtn: {
    color:     'var(--color-muted)',
    fontSize:  '12px',
    padding:   '3px 0',
  },
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function Home({ onOpenFocus, onNavigate, onStartWorkout }) {
  const { projectsState }                              = useProjects()
  const { userState }                                  = useUser()
  const { settingsState, settingsDispatch }            = useSettings()
  const { dayState, dayDispatch, updateTaskTime, updateMealWindow } = useDay()
  const { fitnessState }                               = useFitness()
  const { inboxState, inboxDispatch }                  = useInbox()

  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const currentMins = toMins(now)

  const [expandedTask, setExpandedTask] = useState(null)
  const [editingSlot, setEditingSlot] = useState(null)
  const [expandedSection, setExpandedSection] = useState(null)
  const [collapsedTimelineSections, setCollapsedTimelineSections] = useState([])
  const [showUnscheduledTasks, setShowUnscheduledTasks] = useState(true)
  const [quickAddText, setQuickAddText] = useState('')
  const quickAddRef = useRef(null)

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

  const homeDensity = DENSITY_OPTIONS.includes(settingsState.homeDensity)
    ? settingsState.homeDensity
    : 'balanced'
  const homeMode = settingsState.homeMode
    ? `${settingsState.homeMode.charAt(0).toUpperCase()}${settingsState.homeMode.slice(1)}`
    : 'Build'

  const showFocusProjects = enabledModules.focus || enabledModules.goals || !!focusProject
  const supportButtons = useMemo(
    () => getSupportButtons(enabledModules),
    [enabledModules]
  )

  const projectSectionLabel = focusProject?.name
    ? focusProject.name.toUpperCase()
    : 'PROJECTS'
  const focusNextTask    = nextTask ?? 'Set a focus project in Projects'
  const unscheduledTasks = dayState.tasks.filter(task => !task.scheduledTime)
  const eatenMeals       = Object.values(dayState.meals).filter(meal => meal.eaten).length
  const totalMeals       = Object.values(dayState.meals).length
  const canStartWorkout = enabledModules.fitness && todayWorkout.type !== 'rest' && !fitnessState.todayComplete
  const currentFocus = useMemo(
    () => getCurrentFocus({ dayState, timelineItems, currentMins, canStartWorkout }),
    [dayState, timelineItems, currentMins, canStartWorkout]
  )

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

  function handleToggleTimelineSection(id) {
    setCollapsedTimelineSections(prev =>
      prev.includes(id) ? prev.filter(section => section !== id) : [...prev, id]
    )
  }

  function handleOpenMeals() {
    setExpandedSection(SECTION_KEYS.MEALS)
  }

  function handleOpenQuickAdd() {
    quickAddRef.current?.focus()
  }

  function handleDensityChange(value) {
    settingsDispatch({ type: 'UPDATE_SETTING', payload: { key: 'homeDensity', value } })
  }

  function handleCurrentFocusAction(actionType) {
    if (actionType === 'checkin') {
      onNavigate(SCREENS.IGNITION)
      return
    }
    if (actionType === 'workout') {
      handleStartTodayWorkout()
      return
    }
    if (actionType === 'reset') {
      setShowUnscheduledTasks(true)
      setCollapsedTimelineSections([])
      return
    }
    setCollapsedTimelineSections([])
  }

  function handleQuickAdd(event) {
    event.preventDefault()
    const text = quickAddText.trim()
    if (!text) return
    inboxDispatch({ type: 'ADD_INBOX_ITEM', payload: { text } })
    setQuickAddText('')
  }

  return (
    <div style={s.screen}>
      <TodayHeader
        now={now}
        name={userState.name}
        mode={homeMode}
        energy={dayState.energyLevel}
        density={homeDensity}
        onDensityChange={handleDensityChange}
        onOpenSettings={() => onNavigate(SCREENS.SETTINGS)}
      />

      <main style={s.primaryLayer}>
        <MorningCheckInCard
          complete={!!dayState.dayLockedAt}
          energy={dayState.energyLevel}
          onStart={() => onNavigate(SCREENS.IGNITION)}
        />

        <CurrentFocus
          focus={currentFocus}
          onAction={handleCurrentFocusAction}
        />

        <section style={s.timelineShell}>
          <div style={s.layerHeading}>
            <div>
              <p style={s.layerKicker}>Daily Flow</p>
              <h2 style={s.layerTitle}>Today Timeline</h2>
            </div>
            <span style={s.layerMeta}>{getBurnBarLabel(timelinePreview)}</span>
          </div>
          <Timeline
            items={timelineItems}
            density={homeDensity}
            collapsedSections={collapsedTimelineSections}
            expandedTask={expandedTask}
            onToggleSection={handleToggleTimelineSection}
            onToggleTask={handleToggleExpand}
            onToggleTaskDone={handleToggleDone}
            onTaskTimeSelect={handleTimeSelect}
          />
        </section>

        <section style={s.unscheduledShell}>
          <button
            style={s.unscheduledHeader}
            onClick={() => setShowUnscheduledTasks(prev => !prev)}
            aria-expanded={showUnscheduledTasks}
          >
            <span>
              <span style={s.unscheduledTitle}>Unscheduled tasks</span>
              <span style={s.unscheduledSub}>{unscheduledTasks.length} still available</span>
            </span>
            <span style={s.unscheduledAction}>{showUnscheduledTasks ? 'Hide' : 'Show'}</span>
          </button>
          {showUnscheduledTasks && (
            <div style={s.unscheduledList}>
              {unscheduledTasks.length > 0 ? unscheduledTasks.map(task => (
                <TaskRow
                  key={task.id}
                  task={task}
                  expanded={expandedTask === task.id}
                  onToggleExpand={() => handleToggleExpand(task.id)}
                  onToggleDone={() => handleToggleDone(task.id)}
                  onTimeSelect={time => handleTimeSelect(task.id, time)}
                />
              )) : (
                <p style={s.emptyText}>Nothing loose right now.</p>
              )}
            </div>
          )}
        </section>
      </main>

      <section style={s.supportLayer}>
        <div style={s.layerHeading}>
          <div>
            <p style={s.layerKicker}>Support</p>
            <h2 style={s.layerTitle}>Quick tools</h2>
          </div>
        </div>
        <SupportButtonRow
          buttons={supportButtons}
          onJournal={() => onNavigate(SCREENS.EOD)}
          onNutrition={handleOpenMeals}
          onFocus={onOpenFocus}
          onQuickAdd={handleOpenQuickAdd}
        />

        {enabledModules.fitness && (
          <CollapsibleCard
            id={SECTION_KEYS.TRAINING}
            title="Workout"
            subtitle={fitnessState.todayComplete ? 'Logged today' : 'Warmup · main · cooldown'}
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

        {enabledModules.nutrition && (
          <CollapsibleCard
            id={SECTION_KEYS.MEALS}
            title="Nutrition"
            subtitle={`${eatenMeals} of ${totalMeals} checked in`}
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
            title="Focus support"
            subtitle={focusProject?.name ?? 'Timer ready'}
            expanded={expandedSection === SECTION_KEYS.FOCUS}
            onToggle={handleToggleSection}
          >
            {enabledModules.focus && !focusProject && (
              <p style={s.focusContext}>
                Focus timer is ready when you want a quieter container.
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
      </section>

      <UtilityLayer
        inputRef={quickAddRef}
        value={quickAddText}
        inboxCount={inboxState.inboxItems.length}
        onChange={setQuickAddText}
        onSubmit={handleQuickAdd}
        onOpenInbox={() => onNavigate(SCREENS.INBOX)}
        onReflow={() => {
          setShowUnscheduledTasks(true)
          setCollapsedTimelineSections([])
        }}
      />

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
    paddingTop:    'max(env(safe-area-inset-top), 32px)',
    paddingBottom: 'calc(var(--safe-bottom) + var(--nav-height) + 24px)',
    minHeight:     '100dvh',
    position:      'relative',
    background:    'var(--color-bg)',
  },
  primaryLayer: {
    display:       'flex',
    flexDirection: 'column',
  },
  supportLayer: {
    margin:        '24px 20px 0',
    display:       'flex',
    flexDirection: 'column',
    gap:           '4px',
  },
  timelineShell: {
    margin:        '20px 20px 0',
    padding:       '18px 16px 8px',
    borderRadius:  '20px',
    background:    'color-mix(in srgb, var(--color-card) 88%, transparent)',
    border:        '0.5px solid color-mix(in srgb, var(--color-border) 68%, transparent)',
  },
  layerHeading: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    gap:            '12px',
    marginBottom:   '14px',
  },
  layerKicker: {
    margin:        0,
    color:         'var(--color-muted)',
    fontSize:      '10px',
    fontWeight:    700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  layerTitle: {
    margin:      '2px 0 0',
    fontFamily: 'var(--font-display)',
    fontSize:   '24px',
    fontWeight: 400,
    lineHeight: 1.1,
  },
  layerMeta: {
    maxWidth:     '138px',
    color:        'var(--color-muted)',
    fontSize:     '11px',
    lineHeight:   1.35,
    textAlign:    'right',
  },
  unscheduledShell: {
    margin:        '14px 20px 0',
    borderRadius:  '18px',
    background:    'transparent',
    border:        '0.5px solid color-mix(in srgb, var(--color-border) 60%, transparent)',
    overflow:      'hidden',
  },
  unscheduledHeader: {
    width:          '100%',
    minHeight:      '54px',
    padding:        '12px 14px',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    gap:            '12px',
    textAlign:      'left',
  },
  unscheduledTitle: {
    display:    'block',
    color:      'var(--color-text)',
    fontSize:   '13px',
    fontWeight: 700,
  },
  unscheduledSub: {
    display:   'block',
    color:     'var(--color-muted)',
    fontSize:  '11px',
    marginTop: '1px',
  },
  unscheduledAction: {
    color:      'var(--color-accent-light)',
    fontSize:   '12px',
    fontWeight: 700,
  },
  unscheduledList: {
    borderTop:     '0.5px solid color-mix(in srgb, var(--color-border) 60%, transparent)',
    padding:       '12px',
    display:       'flex',
    flexDirection: 'column',
    gap:           '8px',
  },
  emptyText: {
    margin:     0,
    color:      'var(--color-muted)',
    fontSize:   '13px',
    lineHeight: 1.4,
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
