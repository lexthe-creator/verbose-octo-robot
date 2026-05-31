import { useMemo } from 'react'
import { useDay } from '../context/index.js'
import { formatMealTime } from '../utils/time.js'

export default function Tasks() {
  const { dayState, dayDispatch } = useDay()
  const sections = useMemo(() => groupTasks(dayState.tasks ?? []), [dayState.tasks])

  function toggleTask(taskId) {
    dayDispatch({ type: 'TOGGLE_TASK', payload: taskId })
  }

  return (
    <main style={styles.screen}>
      <header style={styles.header}>
        <p style={styles.eyebrow}>tasks</p>
        <h1 style={styles.title}>committed actions</h1>
      </header>

      <div style={styles.sections}>
        {sections.map(section => (
          <section key={section.key} style={styles.section} aria-labelledby={`tasks-${section.key}`}>
            <div style={styles.sectionHeader}>
              <h2 id={`tasks-${section.key}`} style={styles.sectionTitle}>{section.label}</h2>
              <span style={styles.sectionCount}>{section.tasks.length}</span>
            </div>

            {section.tasks.length > 0 && (
              <div style={styles.taskList}>
                {section.tasks.map(task => (
                  <TaskRow key={task.id} task={task} onToggle={toggleTask} />
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </main>
  )
}

function TaskRow({ task, onToggle }) {
  const meta = getTaskMeta(task)

  return (
    <div style={styles.taskRow}>
      <button
        type="button"
        style={{
          ...styles.checkButton,
          ...(task.done ? styles.checkButtonDone : {}),
        }}
        onClick={() => onToggle(task.id)}
        aria-label={task.done ? `mark ${task.text} not done` : `mark ${task.text} done`}
      >
        {task.done ? '✓' : ''}
      </button>

      <div style={styles.taskTextWrap}>
        <p style={{ ...styles.taskTitle, ...(task.done ? styles.taskTitleDone : {}) }}>
          {task.text}
        </p>
        <p style={styles.taskMeta}>{meta}</p>
      </div>
    </div>
  )
}

function groupTasks(tasks) {
  const active = tasks.filter(task => !task.done)
  const done = tasks.filter(task => task.done)

  const today = active.filter(isTodayTask).sort(sortByTime)
  const upcoming = active.filter(isUpcomingTask).sort(sortByFutureState)
  const unscheduled = active.filter(task => !isTodayTask(task) && !isUpcomingTask(task)).sort(sortByPriority)

  return [
    { key: 'today', label: 'today', tasks: today },
    { key: 'upcoming', label: 'upcoming', tasks: upcoming },
    { key: 'unscheduled', label: 'unscheduled', tasks: unscheduled },
    { key: 'done', label: 'done', tasks: done.sort(sortByPriority) },
  ]
}

function isTodayTask(task) {
  return task.scheduledFor !== 'tomorrow' && !!(task.scheduledTime || task.dueTime)
}

function isUpcomingTask(task) {
  return task.scheduledFor === 'tomorrow'
}

function sortByTime(a, b) {
  return (a.scheduledTime || a.dueTime || '').localeCompare(b.scheduledTime || b.dueTime || '')
}

function sortByFutureState(a, b) {
  return (a.scheduledFor || '').localeCompare(b.scheduledFor || '') || sortByPriority(a, b)
}

function sortByPriority(a, b) {
  return (a.priority ?? 999) - (b.priority ?? 999)
}

function getTaskMeta(task) {
  if (task.done) return 'completed action'
  if (task.scheduledFor === 'tomorrow') return 'scheduled later'
  if (task.scheduledTime) return `scheduled · ${formatTaskTime(task.scheduledTime)}`
  if (task.dueTime) return `today · ${formatTaskTime(task.dueTime)}`
  return 'unscheduled'
}

function formatTaskTime(time) {
  return formatMealTime(time).toLowerCase()
}

const styles = {
  screen: {
    minHeight:  '100dvh',
    padding:    'max(env(safe-area-inset-top), 22px) 20px calc(var(--safe-bottom) + var(--nav-height) + 24px)',
    background: 'var(--color-bg)',
    color:      'var(--color-text)',
  },
  header: {
    marginBottom: '16px',
  },
  eyebrow: {
    margin:        0,
    color:         'var(--color-muted)',
    fontSize:      '10px',
    fontWeight:    700,
    letterSpacing: '0.08em',
  },
  title: {
    margin:      '5px 0 0',
    fontFamily: 'var(--font-body)',
    fontSize:   '17px',
    fontWeight: 600,
    lineHeight: 1.1,
    color:      'var(--color-text)',
  },
  sections: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '11px',
  },
  section: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '4px',
  },
  sectionHeader: {
    display:        'flex',
    alignItems:     'baseline',
    justifyContent: 'space-between',
    borderBottom:   'var(--border)',
    paddingBottom:  '5px',
  },
  sectionTitle: {
    margin:      0,
    fontFamily: 'var(--font-body)',
    fontSize:   '13px',
    fontWeight: 600,
    lineHeight: 1.25,
  },
  sectionCount: {
    color:      'var(--color-muted)',
    fontSize:   '12px',
    fontWeight: 500,
  },
  taskList: {
    display:       'flex',
    flexDirection: 'column',
  },
  taskRow: {
    display:             'grid',
    gridTemplateColumns: '24px minmax(0, 1fr)',
    gap:                 '10px',
    alignItems:          'start',
    padding:             '10px 0',
    borderBottom:        '0.5px solid color-mix(in srgb, var(--color-border) 62%, transparent)',
  },
  checkButton: {
    width:          '18px',
    height:         '18px',
    marginTop:      '1px',
    borderRadius:   '50%',
    border:         '1px solid var(--color-faint)',
    background:     'transparent',
    color:          'var(--color-success)',
    fontSize:       '11px',
    lineHeight:     1,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    cursor:         'pointer',
  },
  checkButtonDone: {
    borderColor: 'var(--color-success)',
    background:  'var(--color-success-bg)',
  },
  taskTextWrap: {
    minWidth:       0,
    display:        'flex',
    flexDirection:  'column',
    gap:            '4px',
  },
  taskTitle: {
    margin:     0,
    color:      'var(--color-text)',
    fontSize:   '13px',
    fontWeight: 500,
    lineHeight: 1.35,
  },
  taskTitleDone: {
    color:          'var(--color-muted)',
    textDecoration: 'line-through',
  },
  taskMeta: {
    margin:    0,
    color:     'var(--color-muted)',
    fontSize:  '11px',
    lineHeight: 1.3,
  },
}
