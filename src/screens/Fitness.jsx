import { useState } from 'react'
import { useFitness }  from '../context/index.js'
import { useSettings } from '../context/SettingsContext.jsx'
import { SCREENS } from '../constants/navigation.js'
import { getPhase, getWeekNumber } from '../utils/fitness.js'
import { generateWorkout } from '../utils/workoutGenerator.js'
import { getWeekStrip } from '../utils/fitnessSelectors.js'
import {
  getJournalRow,
  getWorkoutDetailSections,
  getWorkoutSummary,
} from '../utils/workoutDisplay.js'
import { PHASE_LABELS } from '../constants/fitness.js'

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const DAY_NAMES  = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const DAY_KEYS   = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

const TYPE_ABBR = {
  run_easy:  'R',
  run_tempo: 'R',
  run_long:  'R',
  run_intervals: 'IN',
  run_recovery: 'RR',
  upper:     'UP',
  lower:     'LO',
  full_body: 'FB',
  push:      'PS',
  pull:      'PL',
  strength:  'FB',
  hybrid_conditioning: 'HC',
  mobility:  'MO',
  rest:      '—',
}

function todayWeekIndex() {
  return (new Date().getDay() + 6) % 7
}

function formatFitnessSelectedDay(index, isToday) {
  return isToday ? 'today' : DAY_NAMES[index].toLowerCase()
}

// ─── Selected training commitment ─────────────────────────────────────────────

function TrainingCommitment({ workout, todayComplete, isToday, selectedDay, onStart }) {
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [expandedSections, setExpandedSections] = useState({})

  const workoutType = workout.dayType ?? workout.type
  const isCompletedToday = isToday && todayComplete
  const canStart    = workoutType !== 'rest' && !isCompletedToday
  const status = isCompletedToday ? 'completed' : 'planned'
  const summary = getWorkoutSummary(workout, workoutType === 'rest' ? 'open' : status)
  const sections = getWorkoutDetailSections(workout)
  const hasDetails = workoutType !== 'rest' && sections.length > 0

  return (
    <div style={tc.wrap}>
      <div style={tc.summary}>
        <p style={tc.selectedDay}>{selectedDay}</p>
        <h2 style={tc.title}>{summary.title}</h2>
        <div style={tc.metaGrid}>
          <span style={tc.metaLabel}>status</span>
          <span style={{ ...tc.metaValue, ...(isCompletedToday ? tc.doneText : {}) }}>{summary.statusMarker}</span>
          <span style={tc.metaLabel}>duration</span>
          <span style={tc.metaValue}>{summary.duration}</span>
          <span style={tc.metaLabel}>focus</span>
          <span style={tc.metaValue}>{summary.focusLabel}</span>
        </div>
      </div>

      <div style={tc.actions}>
        {workoutType !== 'rest' && (
          <button
            style={{
              ...tc.primaryAction,
              ...(isCompletedToday ? tc.completedAction : {}),
              cursor: canStart ? 'pointer' : 'default',
            }}
            onClick={canStart ? onStart : undefined}
            disabled={!canStart}
            type="button"
          >
            {isCompletedToday ? 'Completed' : 'Start Workout'}
          </button>
        )}
        {hasDetails && (
          <button
            style={tc.secondaryAction}
            onClick={() => setDetailsOpen(value => !value)}
            type="button"
          >
            {detailsOpen ? 'Hide Details' : 'View Details'}
          </button>
        )}
      </div>

      {detailsOpen && (
        <TrainingDetails
          sections={sections}
          expandedSections={expandedSections}
          onToggle={section => setExpandedSections(current => ({
            ...current,
            [section]: !current[section],
          }))}
        />
      )}
    </div>
  )
}

function TrainingDetails({ sections, expandedSections, onToggle }) {
  return (
    <div style={tc.details}>
      {sections.map(section => {
        const expanded = !!expandedSections[section.section]
        return (
          <div key={section.section} style={tc.detailGroup}>
            <button style={tc.detailToggle} onClick={() => onToggle(section.section)} type="button">
              <span style={tc.detailTitle}>{section.title}</span>
              <span style={tc.detailCount}>{section.countLabel}</span>
            </button>
            {expanded && (
              <DetailRows section={section} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function DetailRows({ section }) {
  const showRowEquipment = !section.equipmentSummary

  return (
    <div style={tc.detailRows}>
      {section.equipmentSummary && (
        <p style={tc.equipmentLine}>equipment · {section.equipmentSummary}</p>
      )}
      {section.rows.map((row, index) => (
        <div key={`${row.name}-${index}`} style={tc.detailRow}>
          <span style={tc.detailName}>{row.name}</span>
          <span style={tc.detailPrescription}>{row.prescription}</span>
          {showRowEquipment && row.equipment.length > 0 && (
            <span style={tc.rowEquipment}>{row.equipment.join(' · ')}</span>
          )}
        </div>
      ))}
    </div>
  )
}

const tc = {
  wrap: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '10px',
    padding:       '8px 0',
    borderTop:     '0.5px solid color-mix(in srgb, var(--color-border) 50%, transparent)',
  },
  summary: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '7px',
    padding:       '4px 0 2px',
  },
  selectedDay: {
    margin:     0,
    color:      'var(--color-muted)',
    fontSize:   '12px',
    fontWeight: 600,
  },
  title: {
    margin:      0,
    color:       'var(--color-text)',
    fontFamily: 'var(--font-display)',
    fontSize:    '24px',
    fontWeight:  520,
    lineHeight:  1.08,
  },
  metaGrid: {
    display:             'grid',
    gridTemplateColumns: '76px minmax(0, 1fr)',
    alignItems:          'baseline',
    gap:                 '3px 8px',
  },
  metaLabel: {
    color:      'var(--color-muted)',
    fontSize:   '11px',
    fontWeight: 560,
  },
  metaValue: {
    minWidth:   0,
    color:      'var(--color-text)',
    fontSize:   '12px',
    fontWeight: 560,
    overflow:   'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  doneText: {
    color: 'var(--color-success)',
  },
  actions: {
    display:  'flex',
    flexWrap: 'wrap',
    gap:      '6px',
  },
  primaryAction: {
    minHeight:    '32px',
    borderRadius: 'var(--radius-sm)',
    border:       'none',
    background:   'var(--color-accent)',
    color:        '#fff',
    fontSize:     '13px',
    fontWeight:   650,
    padding:      '7px 13px',
  },
  secondaryAction: {
    minHeight:    '32px',
    borderRadius: 'var(--radius-sm)',
    border:       'var(--border)',
    background:   'transparent',
    color:        'var(--color-text)',
    fontSize:     '13px',
    fontWeight:   650,
    padding:      '7px 13px',
  },
  completedAction: {
    background: 'var(--color-success-bg)',
    color:      'var(--color-success)',
    border:     '0.5px solid var(--color-success)',
  },
  details: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '4px',
    padding:       '6px 0 1px',
    borderTop:     '0.5px solid color-mix(in srgb, var(--color-border) 42%, transparent)',
  },
  detailGroup: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '3px',
  },
  detailToggle: {
    display:             'grid',
    gridTemplateColumns: 'minmax(0, 1fr) auto',
    alignItems:          'baseline',
    gap:                 '10px',
    width:               '100%',
    padding:             '5px 0',
    background:          'transparent',
    border:       'none',
    color:        'inherit',
    textAlign:    'left',
  },
  detailTitle: {
    color:         'var(--color-muted)',
    fontSize:      '10px',
    fontWeight:    720,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  detailCount: {
    color:      'var(--color-muted)',
    fontSize:   '10px',
    fontWeight: 540,
    whiteSpace: 'nowrap',
  },
  detailRows: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '1px',
    paddingBottom: '4px',
  },
  equipmentLine: {
    margin:     '0 0 2px',
    color:      'var(--color-muted)',
    fontSize:   '10px',
    fontWeight: 520,
  },
  detailRow: {
    display:             'grid',
    gridTemplateColumns: 'minmax(0, 1fr) auto',
    gap:                 '6px',
    alignItems:          'baseline',
    minHeight:           '21px',
    padding:             '1px 0',
  },
  detailName: {
    minWidth:   0,
    color:      'var(--color-text)',
    fontSize:   '12px',
    fontWeight: 560,
    overflow:   'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  detailPrescription: {
    color:      'var(--color-accent)',
    fontSize:   '11px',
    fontWeight: 650,
    whiteSpace: 'nowrap',
  },
  rowEquipment: {
    gridColumn: '1 / 3',
    color:      'var(--color-muted)',
    fontSize:   '10px',
    fontWeight: 520,
    lineHeight: 1.25,
  },
}

// ─── Weekly strip ─────────────────────────────────────────────────────────────

function WeekStrip({ weekItems, selectedIndex, onSelect }) {
  const todayIndex = todayWeekIndex()

  return (
    <div style={ws.scroll}>
      {weekItems.map((item, i) => {
        const isToday    = i === todayIndex
        const isSelected = i === selectedIndex
        const type       = normalizeDayType(item.type)
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
    padding:        '12px 10px',
    minWidth:       '56px',
    flex:           '1 0 56px',
    borderRadius:   'var(--radius-card)',
    background:     'var(--color-card)',
    border:         'var(--border)',
    cursor:         'pointer',
    transition:     'background 0.15s, border-color 0.15s, transform 0.15s',
  },
  dayLabel: { fontSize: '10px', fontWeight: 700, lineHeight: 1 },
  abbr:     { fontSize: '10px', fontWeight: 600, lineHeight: 1 },
}

// ─── Log row ──────────────────────────────────────────────────────────────────

function LogRow({ entry }) {
  const row = getJournalRow(entry)

  return (
    <div style={lr.wrap}>
      <span style={lr.date}>{row.date}</span>
      <span style={lr.focus}>{row.focus}</span>
      <span style={lr.duration}>{row.duration}</span>
      <span style={lr.marker}>{row.marker}</span>
      <span style={lr.rpe}>{row.rpe}</span>
    </div>
  )
}

const lr = {
  wrap: {
    display:             'grid',
    gridTemplateColumns: '48px minmax(0, 1fr) 54px 14px 70px',
    alignItems:          'baseline',
    gap:                 '8px',
    padding:             '9px 0',
    borderTop:           '0.5px solid color-mix(in srgb, var(--color-border) 54%, transparent)',
  },
  date:     { fontSize: '11px', color: 'var(--color-muted)', fontWeight: 650 },
  focus:    { fontSize: '12px', color: 'var(--color-text)', fontWeight: 650, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  duration: { fontSize: '11px', color: 'var(--color-muted)', whiteSpace: 'nowrap' },
  marker:   { fontSize: '12px', color: 'var(--color-success)', textAlign: 'center' },
  rpe:      { fontSize: '11px', color: 'var(--color-muted)', whiteSpace: 'nowrap', textAlign: 'right' },
}

// ─── Main screen ──────────────────────────────────────────────────────────────

function getWeeksToGoal(programEndDate) {
  if (!programEndDate) return null
  const end   = new Date(programEndDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const msLeft = end - today
  if (msLeft <= 0) return 0
  return Math.ceil(msLeft / (7 * 24 * 60 * 60 * 1000))
}

function normalizeDayType(type) {
  if (!type || type === 'rest') return 'rest'
  if (type === 'strength') return 'full_body'
  return type
}

function getWeekInPhase(weekNum) {
  const position = ((weekNum - 1) % 13) + 1
  if (position === 13) return 1
  return ((position - 1) % 4) + 1
}

function buildWorkout(dayType, fitnessState, settingsState, weekNum, phaseKey) {
  const normalizedDayType = normalizeDayType(dayType)
  const workout = generateWorkout({
    dayType:     normalizedDayType,
    equipment:   settingsState.gymAccess,
    phase:       phaseKey,
    weekInPhase: getWeekInPhase(weekNum),
    history:     fitnessState.workoutLog,
  })

  return {
    ...workout,
    type:        workout.dayType,
    subtitle:    normalizedDayType === 'rest' ? 'Recovery — no session today' : `${workout.title} · ~${workout.estimatedMinutes} min`,
    durationEst: workout.estimatedMinutes,
  }
}

function UnconfiguredFitness({ onNavigate }) {
  return (
    <div style={s.screen}>
      <div style={s.header}>
        <p style={s.phase}>training</p>
        <div style={s.titleRow}>
          <h1 style={s.title}>Training</h1>
        </div>
        <p style={s.goalCountdown}>No training plan yet.</p>
      </div>
      <section style={s.section}>
        <div style={s.todayCard}>
          <p style={s.name}>Open day</p>
          <p style={s.sub}>Create a plan from Health when you are ready.</p>
          <button
            style={s.startBtn}
            onClick={() => onNavigate?.(SCREENS.HEALTH)}
            type="button"
          >
            Open Health
          </button>
        </div>
      </section>
    </div>
  )
}

export default function Fitness({ onStartWorkout, onNavigate }) {
  const { fitnessState }  = useFitness()
  const { settingsState } = useSettings()

  // Hooks must be called unconditionally before any early return.
  // null = viewing today, 0–6 = browsing a specific day.
  const [selectedIndex, setSelectedIndex] = useState(null)

  if (!fitnessState.program.configured) {
    return <UnconfiguredFitness onNavigate={onNavigate} />
  }

  const { programStartDate, programEndDate, workoutLog, todayComplete, programConfig } = fitnessState

  const weekNum     = getWeekNumber(programStartDate)
  const phaseKey    = getPhase(programStartDate, programEndDate)
  const weekItems   = getWeekStrip(programConfig)
  const weeksToGoal = getWeeksToGoal(programEndDate)
  const todayIdx    = todayWeekIndex()

  const viewingIndex   = selectedIndex ?? todayIdx
  const viewingDayKey  = DAY_KEYS[viewingIndex]
  const viewingType    = programConfig.trainingDays?.includes(viewingDayKey)
    ? programConfig.dayTypes?.[viewingDayKey] ?? 'rest'
    : 'rest'
  const viewedWorkout  = buildWorkout(viewingType, fitnessState, settingsState, weekNum, phaseKey)
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
          <span style={s.weekBadge}>Week {weekNum}</span>
        </div>
        {weeksToGoal !== null && (
          <p style={s.goalCountdown}>
            {weeksToGoal === 0 ? 'Goal week' : `${weeksToGoal} week${weeksToGoal === 1 ? '' : 's'} to goal`}
          </p>
        )}
      </div>

      {/* Weekly strip */}
      <section style={s.section}>
        <p style={s.sectionLabel}>This week</p>
        <WeekStrip
          weekItems={weekItems}
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
        <TrainingCommitment
          workout={viewedWorkout}
          todayComplete={todayComplete}
          isToday={isViewingToday}
          selectedDay={formatFitnessSelectedDay(viewingIndex, isViewingToday)}
          onStart={() => onStartWorkout && onStartWorkout(viewedWorkout)}
        />
      </section>

      {/* Journal */}
      {recentLog.length > 0 && (
        <section style={s.section}>
          <p style={s.sectionLabel}>Journal</p>
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
  goalCountdown: {
    fontSize:   '12px',
    color:      'var(--color-accent)',
    fontWeight: 600,
    marginTop:  '2px',
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
  todayCard: {
    display:       'flex',
    flexDirection: 'column',
    gap:           'var(--space-3)',
    background:    'var(--color-card)',
    border:        'var(--border)',
    borderRadius:  'var(--radius-card)',
    padding:       '16px',
  },
  name: {
    color:      'var(--color-text)',
    fontSize:   '17px',
    fontWeight: 600,
  },
  sub: {
    color:    'var(--color-muted)',
    fontSize: '12px',
  },
  startBtn: {
    width:        '100%',
    padding:      '14px',
    borderRadius: 'var(--radius-sm)',
    border:       'none',
    background:   'var(--color-accent)',
    color:        '#fff',
    fontSize:     '15px',
    fontWeight:   600,
    cursor:       'pointer',
  },
}
