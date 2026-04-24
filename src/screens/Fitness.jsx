import { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import {
  getPhase, PHASE_LABELS,
  getTodayType, getWeekDates, getTypeForDay,
  generateWorkout,
} from '../utils/fitness.js'

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const DAY_NAMES  = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const TYPE_ABBR = {
  easy_run:   'R',
  tempo_run:  'R',
  long_run:   'R',
  strength_a: 'US',
  strength_b: 'LS',
  stretch:    'ST',
  rest:       '—',
}

const FEEL_LABELS = ['', 'drained', 'flat', 'good', 'great', 'charged']

function todayWeekIndex() {
  return (new Date().getDay() + 6) % 7
}

// ─── Today card ──────────────────────────────────────────────────────────────

function TodayCard({ workout, todayComplete, isToday, onStart }) {
  const canStart = isToday && workout.type !== 'rest' && !todayComplete
  const abbr     = TYPE_ABBR[workout.type] || '?'

  return (
    <div style={tc.wrap}>
      <div style={tc.top}>
        <span style={tc.abbr}>{abbr}</span>
        <div style={tc.info}>
          <p style={tc.name}>{workout.title}</p>
          <p style={tc.sub}>{workout.subtitle}</p>
        </div>
        {isToday && todayComplete && (
          <span style={tc.doneBadge}>Done</span>
        )}
      </div>

      {isToday && workout.type !== 'rest' && (
        <button
          style={{
            ...tc.startBtn,
            background:  todayComplete ? 'var(--color-success-bg)' : 'var(--color-accent)',
            color:       todayComplete ? 'var(--color-success)'    : '#fff',
            border:      todayComplete ? '0.5px solid var(--color-success)' : 'none',
            cursor:      canStart ? 'pointer' : 'default',
          }}
          onClick={canStart ? onStart : undefined}
          disabled={!canStart}
        >
          {todayComplete ? 'Completed' : 'Start'}
        </button>
      )}
    </div>
  )
}

const tc = {
  wrap: {
    background:    'var(--color-card)',
    border:        'var(--border)',
    borderRadius:  'var(--radius-card)',
    padding:       '16px',
    display:       'flex',
    flexDirection: 'column',
    gap:           '14px',
  },
  top: {
    display:    'flex',
    alignItems: 'center',
    gap:        '12px',
  },
  abbr: {
    width:          '40px',
    height:         '40px',
    borderRadius:   'var(--radius-sm)',
    background:     'var(--color-accent-bg)',
    border:         '0.5px solid var(--color-accent)',
    color:          'var(--color-accent)',
    fontSize:       '13px',
    fontWeight:     700,
    letterSpacing:  '0.04em',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  info: {
    flex:          1,
    display:       'flex',
    flexDirection: 'column',
    gap:           '2px',
  },
  name: { fontSize: '17px', fontWeight: 600, color: 'var(--color-text)' },
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
    padding:      '14px',
    borderRadius: 'var(--radius-sm)',
    fontSize:     '15px',
    fontWeight:   600,
    transition:   'background 0.15s',
  },
}

// ─── Weekly strip ─────────────────────────────────────────────────────────────

function WeekStrip({ weekDates, selectedIndex, onSelect }) {
  const todayIndex = todayWeekIndex()

  return (
    <div style={ws.scroll}>
      {weekDates.map((date, i) => {
        const isToday    = i === todayIndex
        const isSelected = i === selectedIndex
        const type       = getTypeForDay(date.getDay())
        const abbr       = TYPE_ABBR[type] || '—'

        let bg, borderColor, labelColor, abbrColor
        if (isToday) {
          bg = 'var(--color-accent)'; borderColor = 'var(--color-accent)'
          labelColor = '#fff'; abbrColor = '#fff'
        } else if (isSelected) {
          bg = 'var(--color-accent-bg)'; borderColor = 'var(--color-accent)'
          labelColor = 'var(--color-accent)'; abbrColor = 'var(--color-accent)'
        } else {
          bg = 'var(--color-chart-bar)'; borderColor = 'transparent'
          labelColor = 'var(--color-muted)'; abbrColor = 'var(--color-faint)'
        }

        return (
          <button
            key={i}
            style={{ ...ws.pill, background: bg, border: `0.5px solid ${borderColor}` }}
            onClick={() => onSelect(i === todayIndex ? null : i)}
          >
            <span style={{ ...ws.dayLabel, color: labelColor }}>{DAY_LABELS[i]}</span>
            <span style={{ ...ws.abbr, color: abbrColor }}>{abbr}</span>
          </button>
        )
      })}
    </div>
  )
}

const ws = {
  scroll: {
    display:           'flex',
    gap:               '4px',
    overflowX:         'auto',
    scrollbarWidth:    'none',
    msOverflowStyle:   'none',
    WebkitOverflowScrolling: 'touch',
  },
  pill: {
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    gap:            '4px',
    padding:        '8px 0',
    minWidth:       '44px',
    flex:           '1 0 44px',
    borderRadius:   'var(--radius-sm)',
    cursor:         'pointer',
    transition:     'background 0.15s, border-color 0.15s',
  },
  dayLabel: { fontSize: '10px', fontWeight: 700, lineHeight: 1 },
  abbr:     { fontSize: '10px', fontWeight: 600, lineHeight: 1 },
}

// ─── Log row ──────────────────────────────────────────────────────────────────

function LogRow({ entry }) {
  const dateStr  = new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const feelText = FEEL_LABELS[entry.feel] || ''

  return (
    <div style={lr.wrap}>
      <div style={lr.left}>
        <p style={lr.title}>{entry.title}</p>
        <p style={lr.meta}>{dateStr} · {entry.duration} min</p>
      </div>
      {feelText && <span style={lr.feel}>{feelText}</span>}
    </div>
  )
}

const lr = {
  wrap: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    padding:        '12px 14px',
    background:     'var(--color-card)',
    border:         'var(--border)',
    borderRadius:   'var(--radius-sm)',
  },
  left: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '2px',
  },
  title: { fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' },
  meta:  { fontSize: '11px', color: 'var(--color-muted)' },
  feel:  { fontSize: '11px', color: 'var(--color-muted)', fontStyle: 'italic' },
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function Fitness({ onStartWorkout }) {
  const { state } = useApp()
  const { weekNumber, workoutLog, todayComplete } = state.fitness
  const gymAccess = state.settings.gymAccess

  const weekDates  = getWeekDates()
  const phaseKey   = getPhase(weekNumber)
  const todayIdx   = todayWeekIndex()

  // null = viewing today, 0-6 = browsing a specific day
  const [selectedIndex, setSelectedIndex] = useState(null)

  const viewingIndex = selectedIndex ?? todayIdx
  const viewingDate  = weekDates[viewingIndex]
  const viewingType  = getTypeForDay(viewingDate.getDay())
  const viewedWorkout = generateWorkout(viewingType, gymAccess, weekNumber)
  const isViewingToday = selectedIndex === null || selectedIndex === todayIdx

  const recentLog = [...workoutLog].reverse().slice(0, 5)

  const sectionLabel = isViewingToday ? 'Today' : DAY_NAMES[viewingIndex]

  return (
    <div style={s.screen}>
      {/* Header */}
      <div style={s.header}>
        <p style={s.phase}>{PHASE_LABELS[phaseKey]}</p>
        <div style={s.titleRow}>
          <h1 style={s.title}>Training</h1>
          <span style={s.weekBadge}>Week {weekNumber}</span>
        </div>
      </div>

      {/* Weekly strip */}
      <section style={s.section}>
        <p style={s.sectionLabel}>This week</p>
        <WeekStrip
          weekDates={weekDates}
          selectedIndex={selectedIndex}
          onSelect={setSelectedIndex}
        />
      </section>

      {/* Day workout card */}
      <section style={s.section}>
        <div style={s.cardLabelRow}>
          <p style={s.sectionLabel}>{sectionLabel}</p>
          {!isViewingToday && (
            <button style={s.todayBtn} onClick={() => setSelectedIndex(null)}>
              ← Today
            </button>
          )}
        </div>
        <TodayCard
          workout={viewedWorkout}
          todayComplete={todayComplete}
          isToday={isViewingToday}
          onStart={() => onStartWorkout && onStartWorkout(viewedWorkout)}
        />
      </section>

      {/* Recent log */}
      {recentLog.length > 0 && (
        <section style={s.section}>
          <p style={s.sectionLabel}>Recent</p>
          <div style={s.logList}>
            {recentLog.map((entry, i) => (
              <LogRow key={i} entry={entry} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = {
  screen: {
    display:       'flex',
    flexDirection: 'column',
    minHeight:     '100dvh',
    background:    'var(--color-bg)',
    paddingTop:    'calc(var(--safe-top) + var(--space-5))',
    paddingBottom: 'calc(var(--safe-bottom) + var(--nav-height) + 24px)',
    gap:           '0',
  },
  header: {
    padding:       '0 20px var(--space-3)',
    display:       'flex',
    flexDirection: 'column',
    gap:           'var(--space-1)',
  },
  phase: {
    fontSize:      '11px',
    fontWeight:    600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color:         'var(--color-accent)',
  },
  titleRow: {
    display:    'flex',
    alignItems: 'baseline',
    gap:        '10px',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize:   '28px',
    color:      'var(--color-text)',
    lineHeight: 1,
  },
  weekBadge: {
    fontSize:   '13px',
    color:      'var(--color-muted)',
    fontWeight: 500,
  },
  section: {
    display:       'flex',
    flexDirection: 'column',
    gap:           'var(--space-3)',
    padding:       '16px 20px 0',
  },
  cardLabelRow: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    fontSize:      '11px',
    fontWeight:    600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color:         'var(--color-muted)',
  },
  todayBtn: {
    background:  'none',
    border:      'none',
    color:       'var(--color-accent)',
    fontSize:    '12px',
    fontWeight:  600,
    cursor:      'pointer',
    padding:     0,
  },
  logList: {
    display:       'flex',
    flexDirection: 'column',
    gap:           'var(--space-2)',
  },
}
