import { useState, useEffect, useMemo } from 'react'
import { useApp } from '../context/AppContext.jsx'
import FuelEditSheet from '../components/FuelEditSheet.jsx'
import { getTodayType, generateWorkout, getWeekNumber } from '../utils/fitness.js'

const WORKOUT_LABEL = {
  easy_run:   'Run',
  tempo_run:  'Run',
  long_run:   'Run',
  strength_a: 'Strength',
  strength_b: 'Strength',
  stretch:    'Stretch',
  rest:       'Rest',
}
import { getProjectPace } from '../utils/projectUtils.js'

// ─── Time utilities ────────────────────────────────────────────────────────────

function parseHHMM(hhmm) {
  if (!hhmm) return -1
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

function toMins(date) {
  return date.getHours() * 60 + date.getMinutes()
}

function formatMins(totalMins) {
  const h = Math.floor(totalMins / 60)
  const m = totalMins % 60
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

function formatClockParts(date) {
  let h = date.getHours()
  const m = String(date.getMinutes()).padStart(2, '0')
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return { time: `${h}`, colon: ':', mins: m, ampm }
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

// ─── Hero clock ────────────────────────────────────────────────────────────────

function greeting(now, name) {
  const h = now.getHours()
  const part = h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening'
  return `Good ${part}, ${name}`
}

function HeroClock({ now, name, onOpenFocus, onOpenSettings }) {
  const { time, colon, mins, ampm } = formatClockParts(now)
  return (
    <div style={hero.wrap}>
      {/* Top row: greeting + gear */}
      <div style={hero.topRow}>
        <span style={hero.greeting}>{greeting(now, name)}</span>
        <button style={hero.gearBtn} onClick={onOpenSettings} aria-label="Settings">
          ⚙
        </button>
      </div>
      {/* Clock row */}
      <div style={hero.row}>
        <div style={hero.clockWrap}>
          <span style={hero.clock}>
            {time}
            <span style={hero.colon}>{colon}</span>
            {mins}
          </span>
          <span style={hero.ampm}>{ampm}</span>
        </div>
        <button style={hero.focusPill} onClick={onOpenFocus}>
          ⊙ Focus
        </button>
      </div>
      <p style={hero.date}>{formatFullDate(now)}</p>
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
  row:   { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' },
  clockWrap: { display: 'flex', alignItems: 'baseline', gap: '4px' },
  clock: {
    fontFamily: 'var(--font-display)',
    fontSize:   '52px',
    lineHeight: 1,
    color:      'var(--color-text)',
    letterSpacing: '-1px',
  },
  colon: { color: 'var(--color-accent)' },
  ampm:  { fontSize: '16px', color: 'var(--color-muted)', fontWeight: 500, marginBottom: '6px' },
  focusPill: {
    display:       'flex',
    alignItems:    'center',
    gap:           '4px',
    padding:       '7px 14px',
    borderRadius:  'var(--radius-pill)',
    background:    'var(--color-accent-bg)',
    border:        '0.5px solid var(--color-accent)',
    color:         'var(--color-accent)',
    fontSize:      '13px',
    fontWeight:    600,
    cursor:        'pointer',
    marginBottom:  '4px',
  },
  date: { fontSize: '14px', color: 'var(--color-muted)', marginTop: '4px' },
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

function buildTimeline(state, nowMinutes) {
  const items = []

  // Morning ignition — always at 6am
  items.push({
    key:      'ignition',
    timeMins: 6 * 60,
    label:    'Morning ignition',
    type:     'ignition',
    done:     !!state.dayLockedAt,
  })

  // Workout
  if (state.workoutConfirmed) {
    const wm = parseHHMM(state.workout.time)
    items.push({
      key:      'workout',
      timeMins: wm,
      label:    `${state.workout.type} · ${state.workout.duration}`,
      type:     'workout',
      done:     nowMinutes > wm,
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

function Timeline({ state, now }) {
  const nowMinsVal = toMins(now)
  const items = useMemo(
    () => buildTimeline(state, nowMinsVal),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, nowMinsVal]
  )

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
              opacity:        item.done ? 0.6 : 1,
            }}>
              {item.label}
              {item.type === 'now' && <span style={tl.nowPip}>●</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

const tl = {
  card:    { margin: '16px 20px 0', background: 'var(--color-card)', border: 'var(--border)', borderRadius: 'var(--radius-card)', padding: '16px' },
  heading: { fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-muted)', marginBottom: '12px' },
  list:    { display: 'flex', flexDirection: 'column' },
  row:     { display: 'flex', alignItems: 'flex-start', gap: '10px', minHeight: '28px' },
  time:    { fontSize: '11px', color: 'var(--color-muted)', width: '52px', flexShrink: 0, paddingTop: '2px', textAlign: 'right' },
  dotCol:  { display: 'flex', flexDirection: 'column', alignItems: 'center', width: '10px', flexShrink: 0 },
  dot:     { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, marginTop: '3px' },
  line:    { width: '1px', flex: 1, minHeight: '20px', background: 'var(--color-faint)', margin: '2px 0' },
  label:   { fontSize: '13px', paddingTop: '1px', flex: 1, lineHeight: 1.4 },
  nowPip:  { color: 'var(--color-accent)', fontSize: '8px', marginLeft: '4px', verticalAlign: 'middle' },
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
          <span style={fs.window}>{formatMins(parseHHMM(meal.startTime))} – {formatMins(parseHHMM(meal.endTime))}</span>
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
  on_track: {
    border:     'var(--color-success)',
    badgeBg:    'var(--color-success-bg)',
    badgeColor: 'var(--color-success)',
    label:      'On track',
  },
  buffer: {
    border:     'var(--color-buffer-bg)',
    badgeBg:    'var(--color-buffer-bg)',
    badgeColor: 'var(--color-buffer)',
    label:      '7 days buffer',
  },
  behind: {
    border:     'var(--color-danger)',
    badgeBg:    'rgba(224,85,85,0.12)',
    badgeColor: 'var(--color-danger)',
    label:      'Behind',
  },
}

function SsGoalCard({ projectName, projectEmoji, doneCount, totalCount, listingsCount, nextTask, dayOf90, paceStatus, onTap }) {
  const pct   = totalCount ? Math.round((doneCount / totalCount) * 100) : 0
  const pace  = PACE_STYLES[paceStatus] ?? PACE_STYLES.on_track

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

function TodayTrainingCard({ todayComplete, gymAccess, weekNumber, onStart }) {
  const todayType = getTodayType()
  const workout   = generateWorkout(todayType, gymAccess, weekNumber)
  const canStart  = workout.type !== 'rest' && !todayComplete

  return (
    <div style={tt.wrap}>
      <div style={tt.top}>
        <span style={tt.typeTag}>{WORKOUT_LABEL[workout.type] ?? 'Workout'}</span>
        <div style={tt.info}>
          <p style={tt.name}>{workout.title}</p>
          <p style={tt.sub}>{workout.subtitle}</p>
        </div>
        {todayComplete && <span style={tt.doneBadge}>✓ Done</span>}
      </div>
      {workout.type !== 'rest' && (
        <button
          style={{
            ...tt.startBtn,
            background: todayComplete ? 'var(--color-success-bg)' : 'var(--color-accent)',
            color:      todayComplete ? 'var(--color-success)'    : '#fff',
            border:     todayComplete ? '0.5px solid var(--color-success)' : 'none',
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

const tt = {
  wrap: {
    background:    'var(--color-card)',
    border:        'var(--border)',
    borderRadius:  'var(--radius-card)',
    padding:       '14px',
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
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function Home({ onOpenFocus, onNavigate, onStartWorkout }) {
  const { state, dispatch, updateTaskTime, updateMealWindow,
          ssDoneCount, ssTotalCount, ssListingsCount, ssNextTask, ssDayOf90 } = useApp()

  const [now, setNow] = useState(() => new Date())
  const [expandedTask, setExpandedTask] = useState(null)
  const [editingSlot, setEditingSlot] = useState(null)

  // Update clock every 10 seconds
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 10_000)
    return () => clearInterval(id)
  }, [])

  const currentMins = toMins(now)

  const paceStatus = useMemo(() => {
    const p = state.projects?.[0]
    if (!p) return 'on_track'
    return getProjectPace(p).status
  }, [state.projects])

  // Next commitment label for burn bar
  const nextLabel = useMemo(() => {
    const candidates = []

    state.tasks.forEach(t => {
      if (t.scheduledTime && !t.done) {
        const m = parseHHMM(t.scheduledTime)
        if (m > currentMins) candidates.push({ label: t.text.split(' ').slice(0, 2).join(' '), timeMins: m })
      }
    })

    Object.values(state.meals).forEach(meal => {
      if (!meal.eaten && parseHHMM(meal.endTime) > currentMins) {
        const m = parseHHMM(meal.startTime)
        if (m > currentMins) candidates.push({ label: meal.label, timeMins: m })
      }
    })

    if (state.workoutConfirmed) {
      const m = parseHHMM(state.workout.time)
      if (m > currentMins) candidates.push({ label: state.workout.type, timeMins: m })
    }

    if (candidates.length === 0) return null
    candidates.sort((a, b) => a.timeMins - b.timeMins)
    const next = candidates[0]
    const away = next.timeMins - currentMins
    return `${next.label} in ${away} min`
  }, [state, currentMins])

  const focusProjectName = state.projects?.[0]?.name ?? 'Projects'
  const focusNextTask    = ssNextTask ?? 'Set a focus project in Projects'

  function handleToggleExpand(taskId) {
    setExpandedTask(prev => prev === taskId ? null : taskId)
  }

  function handleToggleDone(taskId) {
    dispatch({ type: 'TOGGLE_TASK', payload: taskId })
  }

  function handleTimeSelect(taskId, time) {
    updateTaskTime(taskId, time)
    setExpandedTask(null)
  }

  function handleMarkEaten(slot) {
    dispatch({ type: 'MARK_MEAL_EATEN', payload: slot })
  }

  return (
    <div style={s.screen}>
      {/* 1 — Hero clock */}
      <HeroClock
        now={now}
        name={state.profile.name}
        onOpenFocus={onOpenFocus}
        onOpenSettings={() => onNavigate && onNavigate('settings')}
      />

      {/* 2 — Burn bar */}
      <BurnBar now={now} nextLabel={nextLabel} />

      {/* 3 — Today's Training */}
      <section style={s.section}>
        <p style={s.sectionLabel}>Today's Training</p>
        <TodayTrainingCard
          todayComplete={state.fitness.todayComplete}
          gymAccess={state.settings.gymAccess}
          weekNumber={getWeekNumber(state.fitness.programStartDate)}
          onStart={() => {
            const type    = getTodayType()
            const workout = generateWorkout(type, state.settings.gymAccess, getWeekNumber(state.fitness.programStartDate))
            onStartWorkout && onStartWorkout(workout)
          }}
        />
      </section>

      {/* 4 — Timeline */}
      <Timeline state={state} now={now} />

      {/* 5 — 3 Things */}
      <section style={s.section}>
        <p style={s.sectionLabel}>3 Things</p>
        <div style={s.stack}>
          {state.tasks.map(task => (
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
      </section>

      {/* 5 — Focus project goal card */}
      <section style={s.section}>
        <p style={s.sectionLabel}>{focusProjectName}</p>
        <SsGoalCard
          projectName={state.projects?.[0]?.name ?? 'Projects'}
          projectEmoji={state.projects?.[0]?.emoji ?? '📋'}
          doneCount={ssDoneCount}
          totalCount={ssTotalCount}
          listingsCount={ssListingsCount}
          nextTask={focusNextTask}
          dayOf90={ssDayOf90}
          paceStatus={paceStatus}
          onTap={() => onNavigate && onNavigate('projects')}
        />
      </section>

      {/* 6 — Fuel gauge */}
      <section style={s.section}>
        <p style={s.sectionLabel}>Fuel</p>
        <div style={s.mealGrid}>
          {Object.entries(state.meals).map(([slot, meal]) => (
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
      </section>

      {editingSlot && (
        <FuelEditSheet
          meal={state.meals[editingSlot]}
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
    paddingTop:    'var(--safe-top)',
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
  mealGrid: {
    display:             'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap:                 'var(--space-2)',
  },
}
