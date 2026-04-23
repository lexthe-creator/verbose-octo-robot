import { useApp } from '../context/AppContext.jsx'
import {
  getPhase, PHASE_LABELS,
  getTodayType, getWeekDates, getTypeForDay,
  generateWorkout, WORKOUT_TITLES, WORKOUT_ICONS,
} from '../utils/fitness.js'

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const FEEL_EMOJI = ['', '😴', '😐', '🙂', '😄', '⚡']

// ─── Today card ──────────────────────────────────────────────────────────────

function TodayCard({ workout, todayComplete, onStart }) {
  const canStart = workout.type !== 'rest' && !todayComplete

  return (
    <div style={tc.wrap}>
      <div style={tc.top}>
        <span style={tc.icon}>{WORKOUT_ICONS[workout.type] || '🏋'}</span>
        <div style={tc.info}>
          <p style={tc.name}>{workout.title}</p>
          <p style={tc.sub}>{workout.subtitle}</p>
        </div>
        {todayComplete && (
          <span style={tc.doneBadge}>✓ Done</span>
        )}
      </div>

      {workout.type !== 'rest' && (
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
          {todayComplete ? '✓ Completed' : 'Start →'}
        </button>
      )}
    </div>
  )
}

const tc = {
  wrap: {
    background:   'var(--color-card)',
    border:       'var(--border)',
    borderRadius: 'var(--radius-card)',
    padding:      '16px',
    display:      'flex',
    flexDirection:'column',
    gap:          '14px',
  },
  top: {
    display:    'flex',
    alignItems: 'center',
    gap:        '12px',
  },
  icon: { fontSize: '28px', lineHeight: 1 },
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

function WeekStrip({ weekDates }) {
  const todayStr = new Date().toDateString()

  return (
    <div style={ws.wrap}>
      {weekDates.map((date, i) => {
        const isToday = date.toDateString() === todayStr
        const type    = getTypeForDay(date.getDay())

        return (
          <div
            key={i}
            style={{
              ...ws.day,
              background: isToday ? 'var(--color-accent-bg)' : 'var(--color-card)',
              border:     isToday ? '0.5px solid var(--color-accent)' : 'var(--border)',
            }}
          >
            <span style={{ ...ws.label, color: isToday ? 'var(--color-accent)' : 'var(--color-muted)' }}>
              {DAY_LABELS[i]}
            </span>
            <span style={ws.icon}>{WORKOUT_ICONS[type]}</span>
          </div>
        )
      })}
    </div>
  )
}

const ws = {
  wrap: {
    display:             'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap:                 '4px',
  },
  day: {
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    gap:            '4px',
    padding:        '8px 4px',
    borderRadius:   'var(--radius-sm)',
    transition:     'background 0.15s, border-color 0.15s',
  },
  label: { fontSize: '10px', fontWeight: 600 },
  icon:  { fontSize: '14px', lineHeight: 1 },
}

// ─── Log row ──────────────────────────────────────────────────────────────────

function LogRow({ entry }) {
  const dateStr = new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <div style={lr.wrap}>
      <div style={lr.left}>
        <p style={lr.title}>{entry.title}</p>
        <p style={lr.meta}>{dateStr} · {entry.duration} min</p>
      </div>
      <span style={lr.feel}>{FEEL_EMOJI[entry.feel] || ''}</span>
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
  feel:  { fontSize: '20px', lineHeight: 1 },
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function Fitness({ onStartWorkout }) {
  const { state } = useApp()
  const { weekNumber, workoutLog, todayComplete } = state.fitness
  const gymAccess  = state.settings.gymAccess

  const todayType    = getTodayType()
  const todayWorkout = generateWorkout(todayType, gymAccess, weekNumber)
  const weekDates    = getWeekDates()
  const phaseKey     = getPhase(weekNumber)
  const recentLog    = [...workoutLog].reverse().slice(0, 5)

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

      {/* Today */}
      <section style={s.section}>
        <p style={s.sectionLabel}>Today</p>
        <TodayCard
          workout={todayWorkout}
          todayComplete={todayComplete}
          onStart={() => onStartWorkout && onStartWorkout(todayWorkout)}
        />
      </section>

      {/* Weekly strip */}
      <section style={s.section}>
        <p style={s.sectionLabel}>This week</p>
        <WeekStrip weekDates={weekDates} />
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
  sectionLabel: {
    fontSize:      '11px',
    fontWeight:    600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color:         'var(--color-muted)',
  },
  logList: {
    display:       'flex',
    flexDirection: 'column',
    gap:           'var(--space-2)',
  },
}
