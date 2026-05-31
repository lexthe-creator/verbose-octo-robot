import { useMemo, useState } from 'react'
import {
  getFocusProject,
  useDay,
  useFitness,
  useInbox,
  useProjects,
} from '../context/index.js'

const WEEKDAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
const WEEKDAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const CAPACITY_LABELS = ['open', 'light', 'steady', 'full']

export default function Calendar() {
  const { dayState } = useDay()
  const { inboxState } = useInbox()
  const { fitnessState } = useFitness()
  const { projectsState } = useProjects()

  const [today] = useState(() => startOfDay(new Date()))
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(today))

  const focusProject = getFocusProject(projectsState.projects ?? [])
  const activeProjects = useMemo(
    () => (projectsState.projects ?? []).filter(project => ['focus', 'active'].includes(project.status)),
    [projectsState.projects]
  )

  const weekDays = useMemo(() => getWeekDays(today), [today])
  const monthDays = useMemo(() => getMonthGrid(visibleMonth), [visibleMonth])
  const eventsByDate = useMemo(
    () => groupByDate(inboxState.calendarItems ?? []),
    [inboxState.calendarItems]
  )

  const weekPlan = weekDays.map(date => buildDayPlan({
    date,
    today,
    dayState,
    eventsByDate,
    fitnessState,
    focusProject,
    activeProjects,
  }))

  const monthLabel = visibleMonth.toLocaleDateString(undefined, {
    month: 'long',
    year:  'numeric',
  }).toLowerCase()

  function moveMonth(offset) {
    setVisibleMonth(current => new Date(current.getFullYear(), current.getMonth() + offset, 1))
  }

  return (
    <main style={styles.screen}>
      <header style={styles.header}>
        <p style={styles.eyebrow}>CALENDAR</p>
      </header>

      <section style={styles.monthSection} aria-labelledby="calendar-month-heading">
        <div style={styles.monthHeader}>
          <button style={styles.monthButton} onClick={() => moveMonth(-1)} aria-label="previous month">
            &lt;
          </button>
          <h2 id="calendar-month-heading" style={styles.monthTitle}>{monthLabel}</h2>
          <button style={styles.monthButton} onClick={() => moveMonth(1)} aria-label="next month">
            &gt;
          </button>
        </div>

        <div style={styles.monthWeekdays} aria-hidden="true">
          {WEEKDAY_LABELS.map(label => <span key={label}>{label.slice(0, 1)}</span>)}
        </div>
        <div style={styles.monthGrid}>
          {monthDays.map(date => (
            <MonthDay
              key={toISODate(date)}
              date={date}
              activeMonth={visibleMonth.getMonth()}
              markers={getMonthMarkers(date, today, eventsByDate, fitnessState, activeProjects)}
            />
          ))}
        </div>
        <div style={styles.legend} aria-label="month indicator legend">
          <span>• events</span>
          <span>▲ workouts</span>
          <span>■ projects</span>
          <span>◦ routines</span>
        </div>
      </section>

      <section style={styles.weekSection} aria-labelledby="calendar-week-heading">
        <div style={styles.weekHeader}>
          <p style={styles.sectionLabel}>THIS WEEK</p>
        </div>

        <div style={styles.weekList}>
          {weekPlan.map(day => (
            <WeekDay key={day.iso} day={day} />
          ))}
        </div>
      </section>
    </main>
  )
}

function MonthDay({ date, activeMonth, markers }) {
  const inMonth = date.getMonth() === activeMonth

  return (
    <div style={{ ...styles.monthDay, opacity: inMonth ? 1 : 0.32 }}>
      <span style={styles.monthDate}>{date.getDate()}</span>
      <span style={styles.monthMarkers} aria-label={markers.label}>
        {markers.symbols.map(marker => (
          <span key={marker} style={styles.marker}>{marker}</span>
        ))}
      </span>
    </div>
  )
}

function WeekDay({ day }) {
  return (
    <article style={styles.weekDay}>
      <div style={styles.dayLead}>
        <span style={styles.dayName}>{day.label}</span>
        <span style={styles.dayDate}>{day.dateLabel}</span>
      </div>

      <div style={styles.dayBody}>
        <span style={{ ...styles.capacity, ...capacityTone(day.capacity) }}>{day.capacity}</span>
        {day.commitments.length === 0 ? (
          <p style={styles.openNote}>{day.openNote}</p>
        ) : (
          <div style={styles.commitmentList}>
            {day.commitments.map(item => (
              <p key={item.key} style={styles.commitment}>
                <span style={styles.commitmentKind}>{item.kind}</span>
                <span>{item.label}</span>
              </p>
            ))}
          </div>
        )}
        {day.openNote && day.commitments.length > 0 && (
          <p style={styles.openNote}>{day.openNote}</p>
        )}
      </div>
    </article>
  )
}

function buildDayPlan({ date, today, dayState, eventsByDate, fitnessState, focusProject, activeProjects }) {
  const iso = toISODate(date)
  const isToday = iso === toISODate(today)
  const commitments = []

  const events = eventsByDate[iso] ?? []
  events.slice(0, 2).forEach(event => {
    commitments.push({
      key:   `event-${event.id}`,
      kind:  'event',
      label: event.text,
      time:  event.time,
    })
  })

  if (isToday) {
    const scheduledTasks = (dayState.tasks ?? [])
      .filter(task => task.scheduledTime || task.dueTime)
      .slice(0, 2)
    scheduledTasks.forEach(task => {
      commitments.push({
        key:   `task-${task.id}`,
        kind:  'task',
        label: task.text,
        time:  task.scheduledTime || task.dueTime,
      })
    })
  }

  const workout = getWorkoutForDate(date, today, dayState, fitnessState)
  if (workout) commitments.push(workout)

  const project = getProjectForDate(date, today, focusProject, activeProjects)
  if (project) commitments.push(project)

  const sortedCommitments = commitments
    .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'))
    .slice(0, 4)
  const capacity = getCapacity(sortedCommitments.length)

  return {
    iso,
    label:     WEEKDAY_LABELS[toMondayIndex(date)],
    dateLabel: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }).toLowerCase(),
    capacity,
    commitments: sortedCommitments,
    openNote: getOpenNote(sortedCommitments),
  }
}

function getWorkoutForDate(date, today, dayState, fitnessState) {
  const isToday = toISODate(date) === toISODate(today)
  if (isToday && dayState.workout?.time) {
    return {
      key:   'workout-today',
      kind:  'workout',
      label: dayState.workout.type || 'workout',
      time:  dayState.workout.time,
    }
  }

  const dayKey = WEEKDAY_KEYS[date.getDay()]
  const plannedType = fitnessState.programConfig?.dayTypes?.[dayKey]
  if (!plannedType || plannedType === 'rest') return null

  return {
    key:   `workout-${toISODate(date)}`,
    kind:  'workout',
    label: formatWorkoutType(plannedType),
    time:  null,
  }
}

function getProjectForDate(date, today, focusProject, activeProjects) {
  const iso = toISODate(date)
  const endingProject = activeProjects.find(project => project.endDate === iso)
  if (endingProject) {
    return {
      key:   `project-end-${endingProject.id}`,
      kind:  'project',
      label: `${endingProject.name} checkpoint`,
      time:  null,
    }
  }

  if (focusProject && iso === toISODate(today)) {
    return {
      key:   `project-focus-${focusProject.id}`,
      kind:  'project',
      label: focusProject.name,
      time:  null,
    }
  }

  return null
}

function getMonthMarkers(date, today, eventsByDate, fitnessState, activeProjects) {
  const iso = toISODate(date)
  const symbols = []
  const labels = []

  if ((eventsByDate[iso] ?? []).length > 0) {
    symbols.push('•')
    labels.push('events')
  }

  if (getWorkoutForDate(date, today, { workout: {} }, fitnessState)) {
    symbols.push('▲')
    labels.push('workouts')
  }

  if (activeProjects.some(project => project.endDate === iso)) {
    symbols.push('■')
    labels.push('projects')
  }

  return { symbols, label: labels.length ? labels.join(', ') : 'no commitments' }
}

function getCapacity(count) {
  if (count === 0) return CAPACITY_LABELS[0]
  if (count === 1) return CAPACITY_LABELS[1]
  if (count <= 3) return CAPACITY_LABELS[2]
  return CAPACITY_LABELS[3]
}

function getOpenNote(commitments) {
  if (commitments.length === 0) return 'day available'
  const hasEvening = commitments.some(item => item.time && item.time >= '17:00')
  if (!hasEvening) return 'evening available'
  if (commitments.length <= 2) return 'room around commitments'
  if (commitments.length <= 3) return 'limited evening availability'
  return 'mostly committed'
}

function capacityTone(label) {
  if (label === 'open') return styles.capacityOpen
  if (label === 'light') return styles.capacityLight
  if (label === 'steady') return styles.capacitySteady
  return styles.capacityFull
}

function formatWorkoutType(type) {
  return type.replaceAll('_', ' ')
}

function groupByDate(items) {
  return items.reduce((groups, item) => {
    if (!item.date) return groups
    groups[item.date] = [...(groups[item.date] ?? []), item]
    return groups
  }, {})
}

function getWeekDays(date) {
  const monday = startOfDay(date)
  const diff = monday.getDay() === 0 ? -6 : 1 - monday.getDay()
  monday.setDate(monday.getDate() + diff)
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday)
    day.setDate(monday.getDate() + index)
    return day
  })
}

function getMonthGrid(monthDate) {
  const first = startOfMonth(monthDate)
  const gridStart = startOfDay(first)
  const diff = gridStart.getDay() === 0 ? -6 : 1 - gridStart.getDay()
  gridStart.setDate(gridStart.getDate() + diff)

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + index)
    return date
  })
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function startOfDay(date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function toISODate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function toMondayIndex(date) {
  return (date.getDay() + 6) % 7
}

const styles = {
  screen: {
    minHeight:    '100dvh',
    padding:      'max(env(safe-area-inset-top), 20px) 20px calc(var(--safe-bottom) + var(--nav-height) + 22px)',
    background:   'var(--color-bg)',
    color:        'var(--color-text)',
  },
  header: {
    marginBottom: '7px',
  },
  eyebrow: {
    margin:        0,
    color:         'var(--color-muted)',
    fontSize:      '10px',
    fontWeight:    700,
    letterSpacing: '0.1em',
  },
  monthSection: {
    marginBottom:   '16px',
    paddingBottom:  '12px',
    borderBottom:   'var(--border)',
  },
  monthHeader: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   '6px',
  },
  monthButton: {
    width:        '24px',
    height:       '24px',
    border:       'none',
    borderRadius: 'var(--radius-pill)',
    background:   'transparent',
    color:        'var(--color-muted)',
    fontSize:     '13px',
    cursor:       'pointer',
  },
  monthTitle: {
    margin:      0,
    fontFamily: 'var(--font-display)',
    fontSize:   '17px',
    fontWeight: 500,
    lineHeight: 1.1,
  },
  monthWeekdays: {
    display:             'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    marginBottom:        '2px',
    color:               'var(--color-muted)',
    fontSize:            '8px',
    fontWeight:          700,
    letterSpacing:       '0.08em',
    textAlign:           'center',
  },
  monthGrid: {
    display:             'grid',
    gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
    rowGap:              0,
    columnGap:           0,
    borderTop:           '0.5px solid color-mix(in srgb, var(--color-border) 58%, transparent)',
  },
  monthDay: {
    minHeight:      '27px',
    padding:        '3px 2px 2px',
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    justifyContent: 'space-between',
    borderBottom:   '0.5px solid color-mix(in srgb, var(--color-border) 42%, transparent)',
  },
  monthDate: {
    color:      'var(--color-text)',
    fontSize:   '9px',
    fontWeight: 400,
  },
  monthMarkers: {
    minHeight:      '8px',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            '2px',
    color:          'color-mix(in srgb, var(--color-muted) 76%, transparent)',
    fontSize:       '7px',
    lineHeight:     1,
  },
  marker: {
    display: 'inline-block',
  },
  legend: {
    display:        'flex',
    flexWrap:       'wrap',
    gap:            '6px 10px',
    marginTop:      '7px',
    color:          'var(--color-muted)',
    fontSize:       '8px',
    justifyContent: 'center',
  },
  weekSection: {
    paddingBottom: '8px',
  },
  weekHeader: {
    marginBottom: '4px',
  },
  sectionLabel: {
    margin:        0,
    color:         'var(--color-muted)',
    fontSize:      '10px',
    fontWeight:    700,
    letterSpacing: '0.1em',
  },
  weekTitle: {
    margin:      '4px 0 0',
    fontFamily: 'var(--font-display)',
    fontSize:   '18px',
    fontWeight: 500,
    lineHeight: 1.2,
  },
  weekList: {
    display:       'flex',
    flexDirection: 'column',
  },
  weekDay: {
    display:             'grid',
    gridTemplateColumns: '52px minmax(0, 1fr)',
    gap:                 '12px',
    padding:             '10px 0',
    borderBottom:        'var(--border)',
  },
  dayLead: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '3px',
    paddingTop:    '2px',
  },
  dayName: {
    fontSize:      '11px',
    fontWeight:    700,
    letterSpacing: '0.08em',
  },
  dayDate: {
    color:    'var(--color-muted)',
    fontSize: '11px',
  },
  dayBody: {
    minWidth:       0,
    display:        'flex',
    flexDirection:  'column',
    gap:            '6px',
    alignItems:     'flex-start',
    justifyContent: 'center',
  },
  capacity: {
    display:       'inline-flex',
    alignItems:    'center',
    minHeight:     'auto',
    padding:       0,
    borderRadius:  0,
    fontSize:      '10px',
    fontWeight:    600,
    letterSpacing: 0,
  },
  capacityOpen: {
    background: 'transparent',
    color:      'color-mix(in srgb, var(--color-success) 78%, var(--color-text))',
  },
  capacityLight: {
    background: 'transparent',
    color:      'color-mix(in srgb, var(--color-accent) 82%, var(--color-text))',
  },
  capacitySteady: {
    background: 'transparent',
    color:      'var(--color-text)',
  },
  capacityFull: {
    background: 'transparent',
    color:      'var(--color-text)',
  },
  commitmentList: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '4px',
    width:         '100%',
  },
  commitment: {
    display:             'grid',
    gridTemplateColumns: '44px minmax(0, 1fr)',
    gap:                 '8px',
    margin:              0,
    color:               'var(--color-text)',
    fontSize:            '12px',
    lineHeight:          1.34,
  },
  commitmentKind: {
    color:         'var(--color-muted)',
    fontSize:      '9px',
    fontWeight:    700,
    letterSpacing: '0.04em',
  },
  openNote: {
    margin:    0,
    color:     'var(--color-muted)',
    fontSize:  '11px',
    lineHeight: 1.35,
  },
}
