import { useState, useEffect, useMemo } from 'react'
import { useUser } from '../context/UserContext.jsx'
import { useSettings } from '../context/SettingsContext.jsx'
import { useDay, useFitness } from '../context/index.js'
import { getTodayType, generateWorkout, getWeekNumber } from '../utils/fitness.js'
import { formatMealTime, parseHHMM, formatMins } from '../utils/time.js'
import { SCREENS } from '../constants/navigation.js'

// ─── Time utilities ────────────────────────────────────────────────────────────

function toMins(date) {
  return date.getHours() * 60 + date.getMinutes()
}

function formatHeaderDate(date) {
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' })
  const monthDay = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  return `${weekday} ${monthDay}`.toUpperCase()
}

function InboxIcon() {
  return (
    <svg style={icon.svg} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 6.5h16v11H4z" />
      <path d="m4 8 8 5 8-5" />
      <path d="M4 17.5h16" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg style={icon.svg} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3.25" />
      <path d="M12 3.5v2.25M12 18.25v2.25M4.65 7.75l1.95 1.12M17.4 15.13l1.95 1.12M4.65 16.25l1.95-1.12M17.4 8.87l1.95-1.12" />
    </svg>
  )
}

const icon = {
  svg: {
    width:       '15px',
    height:      '15px',
    display:     'block',
    fill:        'none',
    stroke:      'currentColor',
    strokeWidth: 1.8,
    strokeLinecap:'round',
    strokeLinejoin:'round',
  },
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

const TIMELINE_SECTIONS = [
  { key: 'morning', label: 'MORNING', range: '6 AM - 12 PM', start: 6 * 60, end: 12 * 60 },
  { key: 'work', label: 'DAY FLOW', range: '12 PM - 5 PM', start: 12 * 60, end: 17 * 60 },
  { key: 'evening', label: 'EVENING', range: '5 PM - 10 PM', start: 17 * 60, end: 22 * 60 },
]

const DENSITY_OPTIONS = ['minimal', 'balanced', 'detailed']

const SUPPORT_BUTTONS = [
  { key: 'journal', label: 'journal', icon: '◇' },
  { key: 'fitness', label: 'fitness', icon: '⬡' },
  { key: 'reset', label: 'reset', icon: '□' },
  { key: 'nutrition', label: 'Nutrition', icon: '◷' },
  { key: 'focus', label: 'Focus', icon: '⊙' },
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
    label:    'morning check-in',
    detail:   state.dayLockedAt ? 'day rhythm set' : 'mood · energy · mode',
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
      detail:   (state.workout.pace || 'warmup · main work · cooldown').toLowerCase(),
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
        detail:   'planned block',
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
      label:    `${meal.label.toLowerCase()} window`,
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
  const nowItem = { key: 'now', timeMins: nowMinutes, label: 'right now', detail: 'you are here', type: 'now', section: getTimelineSection(nowMinutes) }
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

function formatPlannerTime(totalMins) {
  return formatMins(totalMins).toLowerCase()
}

function getSectionHourMarks(section, sectionItems = []) {
  const marks = new Set()
  for (let time = section.start; time < section.end; time += 60) {
    marks.add(time)
  }
  if (section.key === 'evening') marks.add(section.end)
  sectionItems.forEach(item => marks.add(Math.floor(item.timeMins / 60) * 60))
  return [...marks].sort((a, b) => a - b)
}

function getPlannerLabel(item) {
  return item.task ? item.label : item.label.toLowerCase()
}

function getPlannerDetail(item) {
  return item.task ? item.detail : item.detail?.toLowerCase()
}

function getItemTimeLabel(item) {
  if (item.type === 'now') return ''
  return item.timeMins % 60 === 0 ? '' : formatPlannerTime(item.timeMins)
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
              style={tl.zoneRow}
              onClick={() => onToggleSection(section.key)}
              aria-expanded={!collapsed}
            >
              <span style={tl.time}>{formatPlannerTime(section.start)}</span>
              <div style={tl.dotCol}>
                <div style={tl.hourLine} />
              </div>
              <span style={tl.zoneLabel}>
                {section.label} · {section.range}
                {active && <span style={tl.zoneActive}> · right now</span>}
              </span>
            </button>

            {!collapsed && (
              <div style={tl.list}>
                {getSectionHourMarks(section, sectionItems).map(hour => {
                  if (hour === section.start) {
                    const startItems = sectionItems.filter(item => item.timeMins >= hour && item.timeMins < hour + 60)

                    return (
                      <div key={hour} style={tl.hourGroup}>
                        {startItems.map(item => {
                          const idx = sectionItems.findIndex(sectionItem => sectionItem.key === item.key)

                          if (item.type === 'task' && item.task) {
                            return (
                              <div
                                key={item.key}
                                style={{ ...tl.row, ...(item.overlaps ? tl.overlapRow : {}) }}
                                data-time-mins={item.timeMins}
                                data-timeline-type={item.type}
                              >
                                <span style={tl.time}>{getItemTimeLabel(item)}</span>
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
                            <div
                              key={item.key}
                              style={{ ...tl.row, ...(item.overlaps ? tl.overlapRow : {}) }}
                              data-time-mins={item.timeMins}
                              data-timeline-type={item.type}
                            >
                              <span style={tl.time}>{getItemTimeLabel(item)}</span>
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
                                  {getPlannerLabel(item)}
                                </span>
                                {density !== 'minimal' && item.detail && <span style={tl.detail}>{getPlannerDetail(item)}</span>}
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
                    )
                  }

                  const hourItems = sectionItems.filter(item => item.timeMins >= hour && item.timeMins < hour + 60)

                  return (
                    <div key={hour} style={tl.hourGroup}>
                      <div style={tl.hourRow} data-hour-mins={hour}>
                        <span style={tl.time}>{formatPlannerTime(hour)}</span>
                        <div style={tl.dotCol}>
                          <div style={tl.hourLine} />
                        </div>
                        <div style={tl.hourFill} />
                      </div>

                      {hourItems.map(item => {
                        const idx = sectionItems.findIndex(sectionItem => sectionItem.key === item.key)

                        if (item.type === 'task' && item.task) {
                          return (
                            <div
                              key={item.key}
                              style={{ ...tl.row, ...(item.overlaps ? tl.overlapRow : {}) }}
                              data-time-mins={item.timeMins}
                              data-timeline-type={item.type}
                            >
                              <span style={tl.time}>{getItemTimeLabel(item)}</span>
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
                          <div
                            key={item.key}
                            style={{ ...tl.row, ...(item.overlaps ? tl.overlapRow : {}) }}
                            data-time-mins={item.timeMins}
                            data-timeline-type={item.type}
                          >
                            <span style={tl.time}>{getItemTimeLabel(item)}</span>

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
                                {getPlannerLabel(item)}
                              </span>
                              {density !== 'minimal' && item.detail && <span style={tl.detail}>{getPlannerDetail(item)}</span>}
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
  section: { padding: '0 0 2px', position: 'relative' },
  zoneRow: {
    width:          '100%',
    minHeight:      '28px',
    display:        'flex',
    alignItems:     'center',
    gap:            '10px',
    padding:        0,
    color:          'var(--color-text)',
    textAlign:      'left',
  },
  zoneLabel: { flex: 1, paddingTop: '1px', fontSize: '10px', fontWeight: 700, color: 'var(--color-muted)', letterSpacing: '0.08em' },
  zoneActive: { color: 'var(--color-accent-light)' },
  list:    { display: 'flex', flexDirection: 'column' },
  hourGroup: { display: 'flex', flexDirection: 'column' },
  hourRow: { display: 'flex', alignItems: 'stretch', gap: '10px', minHeight: '28px', position: 'relative' },
  hourFill: { flex: 1, borderTop: '0.5px solid color-mix(in srgb, var(--color-border) 28%, transparent)', marginTop: '8px' },
  hourLine: { width: '1px', flex: 1, minHeight: '28px', background: 'color-mix(in srgb, var(--color-faint) 42%, transparent)' },
  row:     { display: 'flex', alignItems: 'flex-start', gap: '10px', minHeight: '26px', position: 'relative' },
  overlapRow: { paddingLeft: '6px', borderLeft: '1px solid var(--color-accent-bg)' },
  time:    { fontSize: '10px', color: 'var(--color-muted)', width: '48px', flexShrink: 0, paddingTop: '1px', textAlign: 'right' },
  dotCol:  { display: 'flex', flexDirection: 'column', alignItems: 'center', width: '10px', flexShrink: 0 },
  dot:     { width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0, marginTop: '3px' },
  line:    { width: '1px', flex: 1, minHeight: '18px', background: 'color-mix(in srgb, var(--color-faint) 52%, transparent)', margin: '3px 0' },
  labelWrap: { flex: 1, display: 'flex', flexDirection: 'column', gap: '1px', paddingBottom: '5px' },
  interactiveItem: { flex: 1, display: 'flex', flexDirection: 'column', gap: '5px', paddingBottom: '5px' },
  label:   { fontSize: '13px', paddingTop: '0', flex: 1, lineHeight: 1.3 },
  detail:  { fontSize: '10px', color: 'var(--color-muted)', lineHeight: 1.3 },
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
              <span style={tr.timeBadge}>{formatPlannerTime(parseHHMM(task.scheduledTime))}</span>
            )}
            {isAvailable && !task.done && (
              <span style={tr.availableBadge}>open</span>
            )}
            <span style={{ ...tr.chevron, transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>›</span>
          </div>
        </button>
      </div>

      {/* Inline time picker */}
      {expanded && (
        <div style={tr.pickerWrap}>
          <p style={tr.pickerLabel}>Place in flow</p>
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
  wrap:       { background: 'color-mix(in srgb, var(--color-card) 58%, transparent)', border: '0.5px solid color-mix(in srgb, var(--color-border) 58%, transparent)', borderRadius: '8px', overflow: 'hidden' },
  row:        { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 11px 10px 10px' },
  circle:     { width: '18px', height: '18px', borderRadius: '50%', border: '1.5px solid', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.15s, border-color 0.15s' },
  check:      { fontSize: '12px', color: '#fff', lineHeight: 1 },
  textBtn:    { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 },
  taskText:   { fontSize: '14px', fontWeight: 500, flex: 1, lineHeight: 1.3, transition: 'color 0.15s, opacity 0.15s' },
  meta:       { display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 },
  timeBadge:  { fontSize: '11px', color: 'var(--color-accent)', background: 'color-mix(in srgb, var(--color-accent-bg) 72%, transparent)', padding: '4px 8px', borderRadius: 'var(--radius-sm)', border: '0.5px solid var(--color-accent)' },
  availableBadge: { fontSize: '10px', color: 'var(--color-muted)', background: 'transparent', padding: '4px 8px', borderRadius: 'var(--radius-sm)', border: 'var(--border)' },
  chevron:    { fontSize: '18px', color: 'var(--color-faint)', transition: 'transform 0.2s var(--ease-out)', lineHeight: 1 },
  pickerWrap: { borderTop: '0.5px solid color-mix(in srgb, var(--color-border) 58%, transparent)', padding: '8px 0 10px' },
  pickerLabel:{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-muted)', padding: '0 14px', marginBottom: '8px' },
  pills:      { display: 'flex', gap: '8px', overflowX: 'auto', padding: '4px 14px', scrollbarWidth: 'none', msOverflowStyle: 'none' },
  pill:       { flexShrink: 0, padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background 0.15s, color 0.15s, border-color 0.15s', border: 'var(--border)', background: 'var(--color-card)' },
}

// ─── Fuel slot ────────────────────────────────────────────────────────────────

function TodayHeader({ now, name, onOpenSettings, onOpenInbox, supportButtons, onJournal, onFitness, onReset }) {
  const dateParts = formatHeaderDate(now)

  return (
    <header style={th.wrap}>
      <div style={th.topRow}>
        <div>
          <p style={th.greeting}>{greeting(now, name)}</p>
          <h1 style={th.title}>{dateParts}</h1>
        </div>
        <div style={th.headerActions}>
          <button style={th.iconBtn} onClick={onOpenInbox} aria-label="Inbox"><InboxIcon /></button>
          <button style={th.iconBtn} onClick={onOpenSettings} aria-label="Settings"><SettingsIcon /></button>
        </div>
      </div>
      <div style={th.toolsHeader}>
        <span style={th.toolsLabel}>QUICK TOOLS</span>
      </div>
      <SupportButtonRow
        buttons={supportButtons}
        onJournal={onJournal}
        onFitness={onFitness}
        onReset={onReset}
      />
    </header>
  )
}

function MorningCheckInCard({ complete, energy, onStart }) {
  if (complete) return null

  return (
    <section style={mc.wrap}>
      <div style={mc.copy}>
        <span style={mc.kicker}>First gentle step</span>
        <h2 style={mc.title}>MORNING CHECK-IN</h2>
        <p style={mc.detail}>mood, energy, mode, and one intention before the day starts moving.</p>
      </div>
      <button style={mc.button} onClick={onStart}>
        {energy ? 'continue' : 'check in'}
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
      eyebrow: 'CURRENT FOCUS',
      title: 'check in and set the tone',
      detail: 'a quick reset helps AIML shape the rest of your day.',
      action: 'check in',
      actionType: 'checkin',
    }
  }

  if (currentBlock?.type === 'routine') {
    return {
      eyebrow: 'CURRENT FOCUS',
      title: currentBlock.label,
      detail: getPlannerDetail(currentBlock) || 'move through the next small rhythm.',
      action: 'continue',
      actionType: 'timeline',
    }
  }

  if (currentBlock?.type === 'workout' || (canStartWorkout && workoutItem && Math.abs(workoutItem.timeMins - currentMins) <= 90)) {
    return {
      eyebrow: 'CURRENT FOCUS',
      title: workoutItem?.label ?? currentBlock.label,
      detail: 'warmup, main work, cooldown, then log what happened.',
      action: 'start workout',
      actionType: 'workout',
    }
  }

  // TODO: Include active focus sessions here once FocusTimer exposes running
  // session state outside of its screen-local component state.

  if (currentBlock) {
    return {
      eyebrow: 'CURRENT FOCUS',
      title: currentBlock.label,
      detail: getPlannerDetail(currentBlock) || 'stay with this block for now.',
      action: 'pick back up',
      actionType: 'timeline',
    }
  }

  if (nextBlock) {
    return {
      eyebrow: 'CURRENT FOCUS',
      title: nextBlock.label,
      detail: `${formatPlannerTime(nextBlock.timeMins)} · ${getPlannerDetail(nextBlock) || 'coming up in your day flow'}`,
      action: 'view flow',
      actionType: 'timeline',
    }
  }

  return {
    eyebrow: 'CURRENT FOCUS',
    title: 'today can still reflow',
    detail: 'nothing urgent is asking for attention. capture, reset, or continue gently.',
    action: 'reflow day',
    actionType: 'reset',
  }
}

function CurrentFocus({ focus, onAction }) {
  function handleKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onAction(focus.actionType)
    }
  }

  return (
    <section
      style={cf.wrap}
      role="button"
      tabIndex={0}
      onClick={() => onAction(focus.actionType)}
      onKeyDown={handleKeyDown}
    >
      <span style={cf.marker} />
      <div style={cf.copy}>
        <span style={cf.eyebrow}>{focus.eyebrow}</span>
        <span style={cf.title}>{focus.title}</span>
        <p style={cf.detail}>{focus.detail}</p>
      </div>
      <span style={cf.action}>{focus.action} →</span>
    </section>
  )
}

function getSupportButtons() {
  const buttons = ['journal', 'fitness', 'reset']
  return buttons.map(key => SUPPORT_BUTTONS.find(button => button.key === key)).filter(Boolean)
}

function SupportButtonRow({ buttons, onJournal, onFitness, onReset }) {
  const handlers = {
    journal: onJournal,
    fitness: onFitness,
    reset:   onReset,
  }

  return (
    <div style={sb.row}>
      {buttons.map(button => {
        return (
          <button
            key={button.key}
            style={sb.button}
            onClick={handlers[button.key]}
            aria-label={button.label}
          >
            <span style={sb.icon}>{button.icon}</span>
            <span style={sb.label}>{button.label}</span>
          </button>
        )
      })}
    </div>
  )
}

const th = {
  wrap: {
    padding:       '0 0 0',
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
    fontSize:   '22px',
    fontWeight: 600,
    lineHeight: 1.02,
    color:      'var(--color-text)',
    whiteSpace: 'nowrap',
  },
  headerActions: {
    display: 'flex',
    gap:     '8px',
  },
  iconBtn: {
    width:          '30px',
    height:         '30px',
    borderRadius:   '50%',
    border:         '0.5px solid color-mix(in srgb, var(--color-border) 62%, transparent)',
    background:     'transparent',
    color:          'var(--color-muted)',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  toolsHeader: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginTop:      '2px',
  },
  toolsLabel: {
    color:         'var(--color-muted)',
    fontSize:      '10px',
    fontWeight:    700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
}

const mc = {
  wrap: {
    position:     'sticky',
    top:          'calc(var(--safe-area-inset-top) + 10px)',
    zIndex:       1,
    margin:       '0 0 4px',
    padding:      '12px 14px',
    borderRadius: '12px',
    border:       '0.5px solid color-mix(in srgb, var(--color-accent) 24%, var(--color-border))',
    background:   'color-mix(in srgb, var(--color-card) 86%, var(--color-bg))',
    display:      'flex',
    alignItems:   'center',
    gap:          '12px',
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
    fontSize:   '16px',
    fontWeight: 500,
    lineHeight: 1.1,
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
    background:   'var(--color-accent-bg)',
    color:        'var(--color-accent)',
    border:       '0.5px solid var(--color-accent)',
    fontSize:     '12px',
    fontWeight:   700,
    flexShrink:   0,
  },
}

const cf = {
  wrap: {
    margin:        '0',
    padding:       '3px 0',
    borderRadius:  0,
    background:    'transparent',
    borderTop:     '0.5px solid color-mix(in srgb, var(--color-border) 42%, transparent)',
    borderBottom:  '0.5px solid color-mix(in srgb, var(--color-border) 36%, transparent)',
    display:       'flex',
    alignItems:    'center',
    gap:           '6px',
  },
  marker: {
    width:        '5px',
    height:       '5px',
    borderRadius: '50%',
    background:   'var(--color-accent)',
    flexShrink:   0,
  },
  copy: { flex: 1, minWidth: 0, display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: '5px', rowGap: 0, alignItems: 'baseline' },
  eyebrow: {
    fontSize:      '7px',
    fontWeight:    700,
    letterSpacing: 0,
    color:         'var(--color-accent-light)',
  },
  title: {
    minWidth:     0,
    fontSize:     '11px',
    fontWeight:   700,
    lineHeight:   1.25,
    color:        'var(--color-text)',
    overflow:     'hidden',
    textOverflow: 'ellipsis',
    whiteSpace:   'nowrap',
  },
  detail: {
    gridColumn: '1 / -1',
    margin:     0,
    fontSize:   '9px',
    lineHeight: 1.15,
    color:      'var(--color-muted)',
    overflow:   'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  action: {
    color:      'var(--color-accent)',
    fontSize:   '9px',
    fontWeight: 700,
    flexShrink: 0,
    whiteSpace: 'nowrap',
  },
}

const sb = {
  row: {
    display:    'flex',
    alignItems: 'center',
    gap:        '14px',
    margin:     '2px 0 0',
    overflowX:  'auto',
  },
  button: {
    minWidth:      '42px',
    minHeight:     '38px',
    borderRadius:  0,
    background:    'transparent',
    border:        'none',
    color:         'var(--color-text)',
    display:       'flex',
    flexDirection: 'column',
    alignItems:    'center',
    justifyContent:'center',
    gap:           '3px',
    padding:       '2px 0',
    flexShrink:    0,
  },
  icon: { color: 'var(--color-accent)', fontSize: '14px', lineHeight: 1 },
  label: { fontSize: '10px', fontWeight: 700, color: 'var(--color-muted)' },
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function Home({ onNavigate, onStartWorkout }) {
  const { userState }                                  = useUser()
  const { settingsState }                              = useSettings()
  const { dayState, dayDispatch, updateTaskTime }       = useDay()
  const { fitnessState }                                = useFitness()

  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const currentMins = toMins(now)

  const [expandedTask, setExpandedTask] = useState(null)
  const [collapsedTimelineSections, setCollapsedTimelineSections] = useState([])


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

  const homeDensity = DENSITY_OPTIONS.includes(settingsState.homeDensity)
    ? settingsState.homeDensity
    : 'balanced'
  const supportButtons = useMemo(
    () => getSupportButtons(),
    []
  )

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

  function handleStartTodayWorkout() {
    if (todayWorkout.type === 'rest' || fitnessState.todayComplete) return
    onStartWorkout && onStartWorkout(todayWorkout)
  }

  function handleToggleTimelineSection(id) {
    setCollapsedTimelineSections(prev =>
      prev.includes(id) ? prev.filter(section => section !== id) : [...prev, id]
    )
  }

  function handleResetFlow() {
    setCollapsedTimelineSections([])
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
      handleResetFlow()
      return
    }
    handleResetFlow()
  }


  return (
    <div style={s.screen}>
      <main style={s.primaryLayer}>
        <MorningCheckInCard
          complete={!!dayState.dayLockedAt}
          energy={dayState.energyLevel}
          onStart={() => onNavigate(SCREENS.IGNITION)}
        />

        <TodayHeader
          now={now}
          name={userState.name}
          onOpenSettings={() => onNavigate(SCREENS.SETTINGS)}
          onOpenInbox={() => onNavigate(SCREENS.INBOX)}
          supportButtons={supportButtons}
          onJournal={() => onNavigate(SCREENS.EOD)}
          onFitness={() => onNavigate(SCREENS.FITNESS)}
          onReset={handleResetFlow}
        />

        <CurrentFocus
          focus={currentFocus}
          onAction={handleCurrentFocusAction}
        />

        <section style={s.timelineShell}>
          <div style={s.layerHeading}>
            <div>
              <h2 style={s.layerTitle}>DAILY FLOW</h2>
            </div>
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
      </main>

    </div>
  )
}

// ─── Screen styles ─────────────────────────────────────────────────────────────

const s = {
  screen: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '0',
    paddingTop:    'max(env(safe-area-inset-top), 14px)',
    paddingBottom: 'calc(var(--safe-bottom) + var(--nav-height) + 18px)',
    minHeight:     '100dvh',
    position:      'relative',
    background:    'var(--color-bg)',
  },
  primaryLayer: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '8px',
    padding:       '0 20px 0',
  },
  timelineShell: {
    margin:        '6px 0 0',
    padding:       '0',
    borderRadius:  0,
    background:    'transparent',
    border:        'none',
  },
  layerHeading: {
    display:        'flex',
    alignItems:     'flex-start',
    marginBottom:   '8px',
  },
  layerTitle: {
    margin:      0,
    fontFamily: 'var(--font-display)',
    fontSize:   '19px',
    fontWeight: 500,
    lineHeight: 1.1,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
}
