import { useState, useEffect, useMemo } from 'react'
import { useUser } from '../context/UserContext.jsx'
import { useSettings } from '../context/SettingsContext.jsx'
import { getMealSlotEntries, getNutritionEntriesForDate, getNutritionStatusSymbol, useDay, useFitness, useInbox, useNutrition, usePlanning } from '../context/index.js'
import { formatMealTime, parseHHMM, formatMins, getTodayISO } from '../utils/time.js'
import { getDayTypeLabel, getPhase, getWeekNumber } from '../utils/fitness.js'
import { generateWorkout } from '../utils/workoutGenerator.js'
import { SCREENS } from '../constants/navigation.js'

// ─── Time utilities ────────────────────────────────────────────────────────────

function toMins(date) {
  return date.getHours() * 60 + date.getMinutes()
}

function formatHeaderDate(date) {
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' })
  const monthDay = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  return `${weekday} ${monthDay}`
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
const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

// ─── Header helpers ───────────────────────────────────────────────────────────

function greeting(now, name) {
  const h = now.getHours()
  const part = h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening'
  return `Good ${part}, ${name}`
}

function buildTaskMarks(done, total) {
  if (!total) return ''
  return Array.from({ length: total }, (_, index) => index < done ? '|' : '·').join('')
}

function buildEventMarks(count) {
  if (!count) return ''
  return '|'.repeat(count)
}

function mealDetailFromEntries(entries = [], fallback) {
  if (entries.length === 0) return fallback
  const names = entries.map(entry => entry.name).filter(Boolean)
  if (names.length === 0) return fallback
  if (names.length === 1) return names[0]
  return `${names[0]} +${names.length - 1}`
}

function getTodayWorkoutItem(dayState, fitnessState, settingsState) {
  const today = getTodayISO()
  const dayKey = DAY_KEYS[new Date().getDay()]
  const configuredDays = fitnessState.programConfig?.trainingDays ?? []
  const configuredDayType = fitnessState.programConfig?.dayTypes?.[dayKey]
  const hasAssignedWorkout = !!fitnessState.program?.configured &&
    configuredDays.includes(dayKey) &&
    configuredDayType &&
    configuredDayType !== 'rest'

  if (hasAssignedWorkout) {
    const weekNumber = getWeekNumber(fitnessState.programStartDate)
    const phase = getPhase(fitnessState.programStartDate)
    const workout = generateWorkout({
      dayType:     configuredDayType,
      equipment:   settingsState.gymAccess,
      phase,
      weekInPhase: ((weekNumber - 1) % 4) + 1,
      history:     fitnessState.workoutLog,
    })
    const status = fitnessState.workoutDayStatus?.[today]?.status
    const done = status === 'completed' || fitnessState.todayComplete

    return {
      time:    dayState.workout?.time ?? '18:30',
      label:   workout.title,
      detail:  `~${workout.estimatedMinutes} min`,
      done,
      planned: !done,
    }
  }

  if (dayState.workout?.time && (dayState.workoutConfirmed || dayState.workout.confirmed)) {
    const label = dayState.workout.type || getDayTypeLabel(dayState.workout.dayType) || 'Workout'
    const detail = [dayState.workout.duration, dayState.workout.pace]
      .filter(Boolean)
      .join(' · ')
      .toLowerCase()

    return {
      time:    dayState.workout.time,
      label,
      detail:  detail || 'warmup · main work · cooldown',
      done:    dayState.workout.confirmed || dayState.workoutConfirmed,
      planned: false,
    }
  }

  return null
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

function buildTimeline(state, nowMinutes, options = {}) {
  const items = []
  const { nutritionEntries = [], workoutItem = null } = options

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
  if (workoutItem?.time) {
    const wm = parseHHMM(workoutItem.time)
    items.push({
      key:      'workout',
      timeMins: wm,
      label:    workoutItem.label,
      detail:   workoutItem.detail,
      type:     'workout',
      done:     workoutItem.done,
      planned:  workoutItem.planned,
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
    const slotEntries = getMealSlotEntries(nutritionEntries, slot)
    const logged = slotEntries.length > 0
    items.push({
      key:      `meal-${slot}`,
      timeMins: parseHHMM(meal.startTime),
      label:    `${meal.label.toLowerCase()} window`,
      detail:   mealDetailFromEntries(slotEntries, `${formatMealTime(meal.startTime)} - ${formatMealTime(meal.endTime)}`),
      type:     'meal',
      done:     logged || meal.eaten,
      late:     !logged && !meal.eaten && nowMinutes > parseHHMM(meal.lateAfter),
      mealSlot: slot,
      guidance: !logged,
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
  const nowItem = { key: 'now', timeMins: nowMinutes, label: '', detail: '', type: 'now', section: getTimelineSection(nowMinutes) }
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

function getPhaseTone(sectionKey) {
  if (sectionKey === 'morning') return 'color-mix(in srgb, #D9A279 54%, var(--color-faint))'
  if (sectionKey === 'work') return 'color-mix(in srgb, var(--color-muted) 34%, var(--color-faint))'
  return 'color-mix(in srgb, #77735F 54%, var(--color-faint))'
}

function Timeline({
  items,
  density,
  expandedTask,
  onToggleTask,
  onToggleTaskDone,
  onTaskTimeSelect,
  onMealSelect,
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
        const phaseTone = getPhaseTone(section.key)

        return (
          <div key={section.key} style={tl.section}>
            <div style={tl.list}>
              {getSectionHourMarks(section, sectionItems).map(hour => {
                  const hourItems = sectionItems.filter(item => item.timeMins >= hour && item.timeMins < hour + 60)

                  return (
                    <div key={hour} style={tl.hourGroup}>
                      <div style={tl.hourRow} data-hour-mins={hour}>
                        <span style={tl.time}>{formatPlannerTime(hour)}</span>
                        <div style={tl.dotCol}>
                          <div style={{ ...tl.hourLine, background: phaseTone }} />
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
                                {idx < sectionItems.length - 1 && <div style={{ ...tl.line, background: phaseTone }} />}
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

                        if (item.type === 'now') {
                          return (
                            <div
                              key={item.key}
                              style={tl.nowRow}
                              data-time-mins={item.timeMins}
                              data-timeline-type={item.type}
                              aria-label="current time"
                            >
                              <span style={tl.time} />
                              <div style={tl.dotCol}>
                                <div style={{ ...tl.dot, ...tl.nowDot }} />
                                {idx < sectionItems.length - 1 && <div style={{ ...tl.line, background: phaseTone }} />}
                              </div>
                              <div style={tl.nowMarker} />
                            </div>
                          )
                        }

                        const content = (
                          <>
                            <span style={tl.time}>{getItemTimeLabel(item)}</span>
                            <div style={tl.dotCol}>
                              <div style={{ ...tl.dot, background: dotColor(item), boxShadow: item.type === 'now' ? `0 0 0 4px var(--color-accent-bg)` : 'none' }} />
                              {idx < sectionItems.length - 1 && <div style={{ ...tl.line, background: phaseTone }} />}
                            </div>

                            <div style={tl.labelWrap}>
                              <span style={{
                                ...tl.label,
                                color:          item.type === 'now' ? 'var(--color-accent)' : item.done ? 'var(--color-success)' : 'var(--color-text)',
                                fontWeight:     item.type === 'now' ? 700 : 500,
                                textDecoration: item.done && item.type !== 'now' && item.type !== 'meal' ? 'line-through' : 'none',
                                opacity:        item.done ? 0.62 : item.planned ? 0.84 : 1,
                              }}>
                                {getPlannerLabel(item)}
                              </span>
                              {density !== 'minimal' && item.detail && <span style={tl.detail}>{getPlannerDetail(item)}</span>}
                              <span style={tl.pips}>
                                {item.overlaps && <span style={tl.softPip}>overlaps</span>}
                                {item.planned && <span style={tl.softPip}>planned</span>}
                                {item.guidance && <span style={tl.softPip}>guidance</span>}
                              </span>
                            </div>
                          </>
                        )

                        if (item.type === 'meal') {
                          return (
                            <button
                              key={item.key}
                              style={{ ...tl.row, ...tl.mealRow, ...(item.overlaps ? tl.overlapRow : {}) }}
                              data-time-mins={item.timeMins}
                              data-timeline-type={item.type}
                              onClick={() => onMealSelect(item.mealSlot)}
                              aria-label={`${item.done ? 'unlog' : 'log'} ${getPlannerLabel(item)}`}
                            >
                              {content}
                            </button>
                          )
                        }

                        return (
                          <div
                            key={item.key}
                            style={{ ...tl.row, ...(item.overlaps ? tl.overlapRow : {}) }}
                            data-time-mins={item.timeMins}
                            data-timeline-type={item.type}
                          >
                            {content}
                          </div>
                        )
                      })}
                    </div>
                  )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

const tl = {
  card:    { background: 'transparent', border: 'none', borderRadius: 0, padding: 0 },
  section: { padding: '0 0 2px', position: 'relative' },
  list:    { display: 'flex', flexDirection: 'column' },
  hourGroup: { display: 'flex', flexDirection: 'column' },
  hourRow: { display: 'flex', alignItems: 'stretch', gap: '10px', minHeight: '28px', position: 'relative' },
  hourFill: { flex: 1, borderTop: '0.5px solid color-mix(in srgb, var(--color-border) 28%, transparent)', marginTop: '8px', minWidth: 0 },
  hourLine: { width: '2px', flex: 1, minHeight: '28px', borderRadius: '2px', background: 'color-mix(in srgb, var(--color-faint) 42%, transparent)' },
  row:     { display: 'flex', alignItems: 'flex-start', gap: '10px', minHeight: '26px', position: 'relative' },
  nowRow:  { display: 'flex', alignItems: 'center', gap: '10px', minHeight: '14px', position: 'relative' },
  nowDot:  { width: '8px', height: '8px', marginTop: 0, background: 'var(--color-accent)', boxShadow: '0 0 0 4px var(--color-accent-bg)' },
  nowMarker: { flex: 1, height: '1px', background: 'color-mix(in srgb, var(--color-accent) 62%, transparent)' },
  mealRow: { width: '100%', textAlign: 'left', background: 'transparent', border: 'none', padding: 0, color: 'inherit', cursor: 'pointer' },
  overlapRow: { paddingLeft: '6px', borderLeft: '1px solid var(--color-accent-bg)' },
  time:    { fontSize: '10px', color: 'var(--color-muted)', width: '48px', flexShrink: 0, paddingTop: '1px', textAlign: 'right' },
  dotCol:  { display: 'flex', flexDirection: 'column', alignItems: 'center', width: '10px', flexShrink: 0 },
  dot:     { width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0, marginTop: '3px' },
  line:    { width: '2px', flex: 1, minHeight: '18px', borderRadius: '2px', background: 'color-mix(in srgb, var(--color-faint) 52%, transparent)', margin: '3px 0' },
  labelWrap: { flex: 1, display: 'flex', flexDirection: 'column', gap: '1px', paddingBottom: '5px' },
  interactiveItem: { flex: 1, display: 'flex', flexDirection: 'column', gap: '5px', paddingBottom: '5px' },
  label:   { fontSize: '13px', paddingTop: '0', flex: 1, lineHeight: 1.3 },
  detail:  { fontSize: '10px', color: 'var(--color-muted)', lineHeight: 1.3 },
  pips:    { display: 'flex', gap: '5px', flexWrap: 'wrap' },
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

// ─── Header ───────────────────────────────────────────────────────────────────

function TodayHeader({
  now,
  name,
  onOpenSettings,
  onOpenInbox,
  onOpenJournal,
  onOpenNutrition,
  onOpenPlan,
  plannerStatus,
}) {
  const dateParts = formatHeaderDate(now)
  const plannerTabs = [
    { key: 'journal', label: 'Journal', symbol: plannerStatus.journalSymbol, onClick: onOpenJournal },
    { key: 'nutrition', label: 'Nutrition', symbol: plannerStatus.nutritionSymbol, onClick: onOpenNutrition },
    { key: 'plan', label: 'Plan', symbol: plannerStatus.planSymbol, onClick: onOpenPlan },
  ]

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
      <div style={th.tabRow}>
        {plannerTabs.map(tab => (
          <button key={tab.key} style={th.plannerTab} onClick={tab.onClick}>
            <span style={th.tabSymbol}>{tab.symbol}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
      <div style={th.summaryGrid}>
        <div style={th.summaryLeft}>
          <span style={th.tallyLabel}>Tasks</span>
          <span style={th.marks}>{plannerStatus.taskMarks || '·'}</span>
        </div>
        <button style={th.checkStatus} onClick={plannerStatus.onMorningClick}>
          Morning {plannerStatus.morningComplete ? '✓' : '○'}
        </button>
        <div style={th.summaryLeft}>
          <span style={th.tallyLabel}>Events</span>
          <span style={th.marks}>{plannerStatus.eventMarks || '·'}</span>
        </div>
        <button style={th.checkStatus} onClick={plannerStatus.onEveningClick}>
          Evening {plannerStatus.eveningComplete ? '✓' : '○'}
        </button>
      </div>
    </header>
  )
}

const th = {
  wrap: {
    padding:       '0 0 0',
    display:       'flex',
    flexDirection: 'column',
    gap:           '10px',
  },
  tabRow: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'flex-start',
    gap:            '10px',
    minHeight:      '20px',
  },
  plannerTab: {
    display:        'inline-flex',
    alignItems:     'center',
    gap:            '5px',
    border:         'none',
    background:     'transparent',
    color:          'var(--color-muted)',
    fontSize:       '12px',
    fontWeight:     600,
    padding:        '2px 0',
    lineHeight:     1,
  },
  tabSymbol: {
    color:      'var(--color-text)',
    fontSize:   '13px',
    lineHeight: 1,
  },
  topRow: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    gap:            '14px',
    marginBottom:   '2px',
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
    margin:      '5px 0 0',
    fontFamily: 'var(--font-body)',
    fontSize:   '17px',
    fontWeight: 600,
    lineHeight: 1.1,
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
  summaryGrid: {
    display:             'grid',
    gridTemplateColumns: 'max-content max-content',
    width:               'fit-content',
    maxWidth:            '100%',
    columnGap:           '34px',
    rowGap:              '2px',
    alignItems:          'center',
    margin:              '0 auto',
  },
  summaryLeft: {
    display:             'grid',
    gridTemplateColumns: '52px minmax(0, 1fr)',
    alignItems:          'center',
    gap:                 '8px',
    minHeight:           '15px',
    minWidth:            0,
  },
  tallyLabel: {
    color:      'var(--color-text)',
    fontSize:   '12px',
    fontWeight: 600,
  },
  marks: {
    color:         'color-mix(in srgb, var(--color-text) 76%, var(--color-muted))',
    fontSize:      '13px',
    fontWeight:    800,
    letterSpacing: '0.08em',
  },
  checkStatus: {
    border:     'none',
    background: 'transparent',
    color:      'var(--color-muted)',
    padding:    0,
    fontSize:   '12px',
    fontWeight: 600,
    lineHeight: 1.25,
    textAlign:  'right',
    whiteSpace: 'nowrap',
  },
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function Home({ onNavigate }) {
  const { userState }                                  = useUser()
  const { settingsState }                              = useSettings()
  const { dayState, dayDispatch, updateTaskTime }       = useDay()
  const { fitnessState }                                = useFitness()
  const { inboxState }                                 = useInbox()
  const { planningState }                              = usePlanning()
  const { nutritionState }                             = useNutrition()

  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const currentMins = toMins(now)

  const [expandedTask, setExpandedTask] = useState(null)

  const todayNutritionEntries = useMemo(
    () => getNutritionEntriesForDate(nutritionState, getTodayISO()),
    [nutritionState]
  )

  const todayWorkoutItem = useMemo(
    () => getTodayWorkoutItem(dayState, fitnessState, settingsState),
    [dayState, fitnessState, settingsState]
  )

  const timelineItems = useMemo(
    () => buildTimeline(dayState, currentMins, {
      nutritionEntries: todayNutritionEntries,
      workoutItem:      todayWorkoutItem,
    }),
    [dayState, currentMins, todayNutritionEntries, todayWorkoutItem]
  )

  const homeDensity = DENSITY_OPTIONS.includes(settingsState.homeDensity)
    ? settingsState.homeDensity
    : 'balanced'
  const plannerStatus = useMemo(() => {
    const today = getTodayISO()
    const tasks = dayState.tasks ?? []
    const completedTasks = tasks.filter(task => task.done).length
    const eventsToday = (inboxState.calendarItems ?? []).filter(item => item.date === today).length
    const reflectedToday = (planningState.reflectionLog ?? []).some(entry => entry.date === today) ||
      localStorage.getItem('lastReflectionDate') === today

    const todayPlan = planningState.dailyPlans?.[today]
    const hasPlanNotes = !!(todayPlan?.notes || todayPlan?.response)?.trim()
    const hasReviewed = !!todayPlan?.reviewedAt || !!todayPlan?.updatedAt
    const hasAnyPlan = hasReviewed || hasPlanNotes
    const isPlanComplete = hasReviewed

    return {
      journalSymbol: reflectedToday ? '☑' : '○',
      nutritionSymbol: getNutritionStatusSymbol(todayNutritionEntries),
      planSymbol: !hasAnyPlan ? '○' : isPlanComplete ? '☑' : '◐',
      taskMarks: buildTaskMarks(completedTasks, tasks.length),
      eventMarks: buildEventMarks(eventsToday),
      morningComplete: !!dayState.dayLockedAt,
      eveningComplete: reflectedToday,
      onMorningClick: () => onNavigate(SCREENS.IGNITION),
      onEveningClick: () => onNavigate(SCREENS.EOD),
    }
  }, [dayState, inboxState.calendarItems, onNavigate, planningState.reflectionLog, planningState.dailyPlans, todayNutritionEntries])

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

  function handleMealSelect(slot) {
    dayDispatch({ type: 'MARK_MEAL_EATEN', payload: slot })
  }


  return (
    <div style={s.screen}>
      <main style={s.primaryLayer}>
        <TodayHeader
          now={now}
          name={userState.name}
          onOpenSettings={() => onNavigate(SCREENS.SETTINGS)}
          onOpenInbox={() => onNavigate(SCREENS.INBOX)}
          onOpenJournal={() => onNavigate(SCREENS.EOD)}
          onOpenNutrition={() => onNavigate(SCREENS.HEALTH)}
          onOpenPlan={() => onNavigate(SCREENS.PLAN)}
          plannerStatus={plannerStatus}
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
            expandedTask={expandedTask}
            onToggleTask={handleToggleExpand}
            onToggleTaskDone={handleToggleDone}
            onTaskTimeSelect={handleTimeSelect}
            onMealSelect={handleMealSelect}
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
