import { useState } from 'react'
import {
  getFocusProject,
  getProjectStats,
  useDay,
  useFitness,
  useInbox,
  usePlanning,
  useProjects,
} from '../context/index.js'
import { formatMealTime, getTodayISO } from '../utils/time.js'
import { SCREENS } from '../constants/navigation.js'

const DAILY_AFFIRMATIONS = [
  'today holds what it holds',
  'one thing at a time',
  'begin where you are',
  'small steps still count',
  'keep moving gently',
  'the day is still yours',
]

export default function Plan({ onNavigate }) {
  const { planningState, planningDispatch } = usePlanning()
  const { dayState, dayDispatch, updateTaskTime } = useDay()
  const { inboxState, inboxDispatch } = useInbox()
  const { projectsState, projectsDispatch } = useProjects()
  const { fitnessState } = useFitness()

  const today = getTodayISO()
  const existing = planningState.dailyPlans?.[today] ?? { notes: '', reviewedAt: null, updatedAt: null }
  const focusProject = getFocusProject(projectsState.projects)
  const projectStats = getProjectStats(focusProject)

  const [notes, setNotes] = useState(existing.notes || existing.response || '')

  const tasks = [...(dayState.tasks ?? [])].sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0))
  const events = (inboxState.calendarItems ?? [])
    .filter(item => item.date === today)
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''))
  const projectNextTask = focusProject?.tasks?.find(task => !task.done) ?? null
  const workoutPlanned = dayState.workout?.time || dayState.workoutConfirmed || dayState.workout?.confirmed
  const trainingDayName = new Date().toLocaleDateString(undefined, { weekday: 'short' }).toLowerCase()
  const programType = fitnessState.programConfig?.dayTypes?.[trainingDayName] ?? fitnessState.program?.type
  const fitnessCount = workoutPlanned || programType ? 1 : 0
  const summaryRows = [
    { label: 'tasks', count: tasks.length },
    { label: 'events', count: events.length },
    { label: 'project', count: projectNextTask ? 1 : 0 },
    { label: 'fitness', count: fitnessCount },
  ]
  const affirmation = getDailyAffirmation(today)

  function savePlan() {
    const timestamp = new Date().toISOString()
    planningDispatch({
      type: 'SET_DAILY_PLAN',
      payload: {
        date: today,
        plan: {
          notes: notes.trim(),
          reviewedAt: timestamp,
          updatedAt: timestamp,
        },
      },
    })
    onNavigate(SCREENS.HOME)
  }

  return (
    <main style={styles.screen}>
      <div style={styles.headerRow}>
        <button style={styles.backButton} onClick={() => onNavigate(SCREENS.HOME)}>
          ←
        </button>
        <div>
          <p style={styles.eyebrow}>PLAN</p>
          <h1 style={styles.title}>{affirmation}</h1>
        </div>
      </div>

      <section style={styles.summarySection}>
        <p style={styles.summaryTitle}>today holds</p>
        <div style={styles.summaryGrid}>
          {summaryRows.map(row => (
            <SummaryRow key={row.label} label={row.label} count={row.count} />
          ))}
        </div>
      </section>

      <section style={styles.fieldset}>
        <SectionHeader title="tasks" meta={`${tasks.filter(task => !task.done).length} open`} />
        {tasks.length === 0 ? (
          <EmptyLine text="no tasks committed for today" />
        ) : tasks.map(task => (
          <CommitmentRow
            key={task.id}
            label={task.text}
            done={task.done}
            onToggle={() => dayDispatch({ type: 'TOGGLE_TASK', payload: task.id })}
            trailing={(
              <TimeEditor
                label={`time for ${task.text}`}
                value={task.scheduledTime || ''}
                onChange={value => updateTaskTime(task.id, value)}
                emptyLabel="unscheduled"
                prefix="planned"
              />
            )}
          />
        ))}
      </section>

      <section style={styles.fieldset}>
        <SectionHeader title="events" meta={`${events.length} today`} />
        {events.length === 0 ? (
          <EmptyLine text="no calendar items today" />
        ) : events.map(event => (
          <CommitmentRow
            key={event.id}
            label={event.text}
            trailing={(
              <TimeEditor
                label={`time for ${event.text}`}
                value={event.time || ''}
                onChange={value => inboxDispatch({
                  type: 'UPDATE_CALENDAR_ITEM',
                  payload: { id: event.id, date: today, time: value },
                })}
                emptyLabel="time TBD"
              />
            )}
          />
        ))}
      </section>

      <section style={styles.fieldset}>
        <SectionHeader title="project" meta={focusProject?.name ?? 'none'} />
        {!focusProject ? (
          <EmptyLine text="no focus project selected" />
        ) : (
          <CommitmentRow
            label={projectNextTask?.text ?? 'project is clear'}
            done={!projectNextTask}
            detail={`${projectStats.doneCount}/${projectStats.totalCount} complete`}
            onToggle={projectNextTask ? () => projectsDispatch({
              type: 'TOGGLE_PROJECT_TASK',
              payload: { projectId: focusProject.id, taskId: projectNextTask.id },
            }) : undefined}
          />
        )}
      </section>

      <section style={styles.fieldset}>
        <SectionHeader title="fitness" meta={fitnessState.todayComplete ? 'done' : 'planned'} />
        {workoutPlanned ? (
          <CommitmentRow
            label={dayState.workout?.type ?? programType ?? 'workout'}
            done={fitnessState.todayComplete}
            trailing={(
              <TimeEditor
                label="workout time"
                value={dayState.workout?.time || ''}
                onChange={value => dayDispatch({
                  type: 'CONFIRM_WORKOUT',
                  payload: { time: value },
                })}
                emptyLabel={dayState.workout?.duration || 'today'}
                prefix={dayState.workout?.duration}
              />
            )}
          />
        ) : (
          <EmptyLine text={programType ? `${programType} available today` : 'no workout committed today'} />
        )}
      </section>

      <section style={styles.fieldset}>
        <p style={styles.prompt}>review note</p>
        <textarea
          style={styles.textarea}
          value={notes}
          onChange={event => setNotes(event.target.value)}
          placeholder="anything to adjust before execution?"
          rows={4}
        />
      </section>

      <div style={styles.actions}>
        <button style={styles.saveButton} onClick={savePlan}>
          reviewed
        </button>
        <button style={styles.closeButton} onClick={() => onNavigate(SCREENS.HOME)}>
          close
        </button>
      </div>
    </main>
  )
}

function getDailyAffirmation(date) {
  const index = [...date].reduce((sum, char) => sum + char.charCodeAt(0), 0) % DAILY_AFFIRMATIONS.length
  return DAILY_AFFIRMATIONS[index]
}

function formatPlanTime(time) {
  return formatMealTime(time).toLowerCase()
}

function getPlannerMarks(count) {
  return count > 0 ? '|'.repeat(Math.min(count, 5)) : ''
}

function SummaryRow({ label, count }) {
  return (
    <div style={styles.summaryRow}>
      <span>{label}</span>
      <span style={styles.summaryMarks}>{getPlannerMarks(count)}</span>
    </div>
  )
}

function SectionHeader({ title, meta }) {
  return (
    <div style={styles.sectionHeader}>
      <p style={styles.question}>{title}</p>
      <span style={styles.sectionMeta}>{meta}</span>
    </div>
  )
}

function EmptyLine({ text }) {
  return <p style={styles.emptyLine}>{text}</p>
}

function TimeEditor({ label, value, onChange, emptyLabel, prefix }) {
  const visibleLabel = value
    ? [prefix, formatPlanTime(value)].filter(Boolean).join(' · ')
    : emptyLabel

  return (
    <label style={styles.timeEditor}>
      <span>{visibleLabel}</span>
      <input
        aria-label={label}
        style={styles.timeInput}
        type="time"
        value={value}
        onChange={event => onChange(event.target.value || null)}
      />
    </label>
  )
}

function CommitmentRow({ label, detail, done = false, onToggle, trailing }) {
  return (
    <div style={styles.commitmentRow}>
      <button
        type="button"
        style={styles.checkButton}
        onClick={onToggle}
        disabled={!onToggle}
        aria-label={done ? `unmark ${label}` : `mark ${label}`}
      >
        {done ? '●' : '○'}
      </button>
      <div style={styles.commitmentText}>
        <span style={{ ...styles.commitmentLabel, ...(done ? styles.commitmentDone : {}) }}>
          {label}
        </span>
        {detail && <span style={styles.commitmentDetail}>{detail}</span>}
      </div>
      {trailing}
    </div>
  )
}

const styles = {
  screen: {
    padding: '22px 22px 28px',
    minHeight: '100%',
    background: 'var(--color-bg)',
    color: 'var(--color-text)',
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '18px',
  },
  backButton: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    border: '0.5px solid color-mix(in srgb, var(--color-border) 62%, transparent)',
    background: 'transparent',
    color: 'var(--color-muted)',
    fontSize: '16px',
    cursor: 'pointer',
    display: 'grid',
    placeItems: 'center',
  },
  eyebrow: {
    margin: 0,
    color: 'var(--color-muted)',
    fontSize: '11px',
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
  },
  title: {
    margin: '6px 0 0',
    fontSize: '15px',
    lineHeight: 1.3,
    fontWeight: 500,
  },
  summarySection: {
    display: 'grid',
    gap: '8px',
    margin: '0 0 24px 42px',
    maxWidth: '210px',
  },
  summaryTitle: {
    margin: 0,
    color: 'var(--color-text)',
    fontSize: '13px',
    fontWeight: 600,
    letterSpacing: '0.02em',
  },
  summaryGrid: {
    display: 'grid',
    gap: '3px',
  },
  summaryRow: {
    display: 'grid',
    gridTemplateColumns: '72px 1fr',
    alignItems: 'center',
    color: 'var(--color-muted)',
    fontSize: '13px',
    lineHeight: 1.45,
  },
  summaryMarks: {
    color: 'var(--color-text)',
    letterSpacing: '0.16em',
  },
  fieldset: {
    display: 'grid',
    gap: '10px',
    marginBottom: '22px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: '12px',
  },
  question: {
    margin: 0,
    color: 'var(--color-text)',
    fontSize: '14px',
    fontWeight: 600,
    letterSpacing: '0.02em',
  },
  sectionMeta: {
    color: 'var(--color-muted)',
    fontSize: '12px',
    whiteSpace: 'nowrap',
  },
  emptyLine: {
    margin: 0,
    color: 'var(--color-muted)',
    fontSize: '14px',
    lineHeight: 1.5,
  },
  commitmentRow: {
    display: 'grid',
    gridTemplateColumns: '24px minmax(0, 1fr) auto',
    alignItems: 'center',
    gap: '10px',
    minHeight: '38px',
    borderBottom: '1px solid color-mix(in srgb, var(--color-border) 55%, transparent)',
    padding: '2px 0 8px',
  },
  checkButton: {
    border: 'none',
    background: 'transparent',
    color: 'var(--color-accent)',
    padding: 0,
    width: '24px',
    height: '24px',
    display: 'grid',
    placeItems: 'center',
    fontSize: '13px',
    cursor: 'pointer',
  },
  commitmentText: {
    display: 'grid',
    gap: '2px',
    minWidth: 0,
  },
  commitmentLabel: {
    color: 'var(--color-text)',
    fontSize: '14px',
    lineHeight: 1.3,
    overflowWrap: 'anywhere',
  },
  commitmentDone: {
    color: 'var(--color-muted)',
    textDecoration: 'line-through',
  },
  commitmentDetail: {
    color: 'var(--color-muted)',
    fontSize: '12px',
    lineHeight: 1.25,
  },
  timeInput: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    border: 'none',
    opacity: 0,
    cursor: 'pointer',
  },
  timeEditor: {
    position: 'relative',
    display: 'inline-flex',
    justifyContent: 'flex-end',
    color: 'var(--color-muted)',
    minWidth: '92px',
    maxWidth: '124px',
    fontSize: '12px',
    lineHeight: 1.25,
    textAlign: 'right',
    cursor: 'pointer',
  },
  prompt: {
    margin: 0,
    color: 'var(--color-text)',
    fontSize: '15px',
    fontWeight: 700,
  },
  textarea: {
    width: '100%',
    border: 'none',
    borderBottom: '1px solid var(--color-border)',
    background: 'transparent',
    color: 'var(--color-text)',
    fontSize: '15px',
    lineHeight: 1.8,
    padding: '8px 0',
    resize: 'vertical',
    minHeight: '120px',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    marginTop: '10px',
  },
  saveButton: {
    border: '1px solid var(--color-accent)',
    borderRadius: '999px',
    background: 'transparent',
    color: 'var(--color-accent)',
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  closeButton: {
    border: 'none',
    background: 'transparent',
    color: 'var(--color-muted)',
    fontSize: '14px',
    cursor: 'pointer',
  },
}
