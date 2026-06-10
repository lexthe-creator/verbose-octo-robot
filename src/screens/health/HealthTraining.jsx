import { useMemo, useState } from 'react'
import { useFitness } from '../../context/index.js'
import { useSettings } from '../../context/SettingsContext.jsx'
import { getWorkoutDetailSections, getWorkoutSummary } from '../../utils/workoutDisplay.js'
import {
  entryRpe,
  formatSelectedDay,
  formatTrainingHeaderDate,
  formatWorkoutDate,
  getTodayISO,
  getTrainingDayPlan,
  getWeekDates,
  toLocalISO,
  workoutFocus,
  workoutTypeLabel,
} from './healthUtils.js'
import { healthStyles as s } from './healthStyles.js'
import {
  PlannerActionButton,
  PlannerActionRow,
  PlannerRow,
} from '../../components/planner/PlannerPrimitives.jsx'

function DailyWorkoutActions({ status, workout, onStartWorkout, onLogWorkout, date }) {
  const { fitnessDispatch } = useFitness()
  const workoutDate = date ?? getTodayISO()

  function startWorkout() {
    fitnessDispatch({ type: 'SET_WORKOUT_DAY_STATUS', payload: { date: workoutDate, status: 'in_progress' } })
    onStartWorkout?.(workout)
  }

  function completeWorkout() {
    fitnessDispatch({
      type: 'LOG_WORKOUT',
      payload: {
        date: workoutDate,
        type: workout.type,
        title: workout.title,
        duration: workout.durationEst || 30,
        effort: 'Moderate',
        feel: 3,
        notes: '',
        exercises: [],
        status: 'completed',
        source: 'planned',
      },
    })
  }

  function setStatus(nextStatus) {
    fitnessDispatch({ type: 'SET_WORKOUT_DAY_STATUS', payload: { date: workoutDate, status: nextStatus } })
  }

  if (status === 'in_progress') {
    return (
      <PlannerActionRow style={s.actions}>
        <PlannerActionButton onClick={completeWorkout}>complete workout</PlannerActionButton>
        <PlannerActionButton secondary onClick={() => setStatus('planned')}>cancel</PlannerActionButton>
      </PlannerActionRow>
    )
  }

  if (status === 'completed') {
    return (
      <PlannerActionRow style={s.actions}>
        <PlannerActionButton secondary onClick={onLogWorkout}>edit log</PlannerActionButton>
      </PlannerActionRow>
    )
  }

  if (status === 'skipped') {
    return (
      <PlannerActionRow style={s.actions}>
        <PlannerActionButton disabled>skipped</PlannerActionButton>
        <PlannerActionButton secondary onClick={() => setStatus('planned')}>undo skip</PlannerActionButton>
      </PlannerActionRow>
    )
  }

  return (
    <PlannerActionRow style={s.actions}>
      <PlannerActionButton onClick={startWorkout}>start workout</PlannerActionButton>
      <PlannerActionButton secondary onClick={completeWorkout}>mark complete</PlannerActionButton>
      <PlannerActionButton secondary onClick={() => setStatus('skipped')}>skip</PlannerActionButton>
    </PlannerActionRow>
  )
}

function EmptyTraining({ onCreatePlan, onLogWorkout }) {
  const [showTypes, setShowTypes] = useState(false)

  return (
    <main style={s.simpleScreen}>
      <header style={s.header}>
        <p style={s.eyebrow}>training</p>
        <h1 style={s.title}>open day</h1>
      </header>
      <section style={s.block}>
        <PlannerRow label="plan" value="not created" detail="optional" />
        <PlannerRow label="schedule" value="open" detail="choose later" />
        <PlannerRow label="journal" value="available" detail="log any session" />
        <p style={s.emptyCopy}>No training plan yet.</p>
        <PlannerActionRow style={s.actions}>
          <PlannerActionButton onClick={onCreatePlan}>create plan</PlannerActionButton>
          <PlannerActionButton secondary onClick={onLogWorkout}>log workout</PlannerActionButton>
          <PlannerActionButton secondary onClick={() => setShowTypes(value => !value)}>browse types</PlannerActionButton>
        </PlannerActionRow>
        {showTypes && (
          <div style={s.typeList}>
            <PlannerRow label="strength" value="upper / lower" detail="simple split" />
            <PlannerRow label="running" value="easy / tempo / long" detail="weekly rhythm" />
            <PlannerRow label="mobility" value="stretch / recovery" detail="low friction" />
          </div>
        )}
      </section>
    </main>
  )
}

function TrainingCommitment({ workout, date, status, children }) {
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [expandedSections, setExpandedSections] = useState({})
  const summary = getWorkoutSummary(workout, status)
  const sections = getWorkoutDetailSections(workout)
  const hasDetails = sections.length > 0

  return (
    <>
      <div style={s.workoutHeader}>
        <p style={s.workoutMeta}>{formatTrainingHeaderDate(date).toLowerCase()}</p>
        <h2 style={s.workoutTitle}>{summary.title}</h2>
        <PlannerRow label="status" value={summary.statusMarker} />
        <PlannerRow label="duration" value={summary.duration} />
        <PlannerRow label="focus" value={summary.focusLabel} />
      </div>
      {children}
      {hasDetails && (
        <div style={s.detailActions}>
          <PlannerActionButton secondary onClick={() => setDetailsOpen(value => !value)}>
            {detailsOpen ? 'hide details' : 'view details'}
          </PlannerActionButton>
        </div>
      )}
      {detailsOpen && (
        <WorkoutDetails
          sections={sections}
          expandedSections={expandedSections}
          onToggle={section => setExpandedSections(current => ({
            ...current,
            [section]: !current[section],
          }))}
        />
      )}
    </>
  )
}

function WorkoutDetails({ sections, expandedSections, onToggle }) {
  return (
    <div style={s.workoutPreview}>
      {sections.map(section => {
        const expanded = !!expandedSections[section.section]
        return (
          <div key={section.section} style={s.previewGroup}>
            <button
              style={s.previewToggle}
              onClick={() => onToggle(section.section)}
              type="button"
            >
              <span style={s.previewTitle}>{section.title}</span>
              <span style={s.previewCount}>{section.countLabel}</span>
            </button>
            {expanded && (
              <PreviewRows section={section} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function PreviewRows({ section }) {
  const showRowEquipment = !section.equipmentSummary

  return (
    <div style={s.previewRows}>
      {section.equipmentSummary && <p style={s.previewCommonEquipment}>equipment · {section.equipmentSummary}</p>}
      {section.rows.map((row, index) => (
        <div key={`${row.name}-${index}`} style={s.previewRow}>
          <span style={s.previewName}>{row.name}</span>
          <span style={s.previewPrescription}>{row.prescription}</span>
          {showRowEquipment && row.equipment.length > 0 && (
            <span style={s.previewEquipment}>{row.equipment.join(' · ')}</span>
          )}
        </div>
      ))}
    </div>
  )
}

function WeeklyTrainingPlan({ onStartWorkout, onLogWorkout }) {
  const { fitnessState } = useFitness()
  const { settingsState } = useSettings()
  const weekDates = useMemo(() => getWeekDates(), [])
  const today = getTodayISO()
  const [selectedIso, setSelectedIso] = useState(today)
  const selectedDate = weekDates.find(date => toLocalISO(date) === selectedIso) ?? weekDates[0]
  const selectedPlan = getTrainingDayPlan(fitnessState, settingsState, selectedDate)

  return (
    <section style={{ ...s.trainingBlock, ...s.trainingPlanner }}>
      <div style={s.trainingWeekList}>
        {weekDates.map(date => {
          const dayPlan = getTrainingDayPlan(fitnessState, settingsState, date)
          const isToday = dayPlan.iso === today
          const selected = dayPlan.iso === selectedIso
          const completed = dayPlan.status === 'completed'

          return (
            <button
              key={dayPlan.iso}
              style={{
                ...s.trainingWeekDay,
                ...(selected ? s.trainingWeekDaySelected : {}),
                ...(isToday ? s.trainingWeekDayToday : {}),
              }}
              onClick={() => setSelectedIso(dayPlan.iso)}
              type="button"
            >
              <span style={s.trainingDayName}>{date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1).toUpperCase()}</span>
              <span style={s.trainingDayType}>
                {dayPlan.scheduled ? workoutTypeLabel(dayPlan.workout) : 'Open'}{completed ? ' ✓' : ''}
              </span>
            </button>
          )
        })}
      </div>

      <div style={s.selectedTraining}>
        {selectedPlan.scheduled ? (
          <TrainingCommitment workout={selectedPlan.workout} date={selectedDate} status={selectedPlan.status}>
            <DailyWorkoutActions
              status={selectedPlan.status}
              workout={selectedPlan.workout}
              onStartWorkout={onStartWorkout}
              onLogWorkout={onLogWorkout}
              date={selectedPlan.iso}
            />
          </TrainingCommitment>
        ) : (
          <>
            <PlannerRow label="day" value={formatSelectedDay(selectedDate)} />
            <PlannerRow label="workout" value="open day" />
            <PlannerRow label="status" value="unscheduled" />
            <PlannerActionRow>
              <PlannerActionButton secondary onClick={onLogWorkout}>log workout</PlannerActionButton>
            </PlannerActionRow>
          </>
        )}
      </div>
    </section>
  )
}

function WorkoutJournal() {
  const { fitnessState } = useFitness()
  const today = getTodayISO()
  const todayStatus = fitnessState.workoutDayStatus?.[today]?.status
  const logs = [...(fitnessState.workoutLog ?? [])].reverse().slice(0, 6)
  const hasTodaySkipped = todayStatus === 'skipped' && !logs.some(entry => String(entry.date).slice(0, 10) === today)
  const journal = hasTodaySkipped
    ? [{ date: today, title: 'Planned workout', duration: 0, status: 'skipped', effort: '' }, ...logs].slice(0, 6)
    : logs

  return (
    <section style={{ ...s.block, ...s.trainingBlock }}>
      <p style={s.sectionLabel}>journal</p>
      {journal.length === 0 ? (
        <p style={s.emptyCopy}>No workouts logged yet.</p>
      ) : (
        <div style={s.journalList}>
          {journal.map((entry, index) => (
            <div key={`${entry.date}-${index}`} style={s.journalRow}>
              <span style={s.journalDate}>{formatWorkoutDate(entry.date)}</span>
              <span style={s.journalMeta}>
                {[
                  workoutFocus(entry.type, entry.title),
                  entry.duration ? `${entry.duration} min` : null,
                  entry.status === 'completed' ? '●' : '○',
                  entryRpe(entry) ? `RPE ${entryRpe(entry)}/10` : null,
                ].filter(Boolean).join(' · ')}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function ConfiguredTraining({ onStartWorkout, onLogWorkout }) {
  return (
    <div style={s.trainingScreen}>
      <header style={{ ...s.header, ...s.trainingHeader }}>
        <p style={s.eyebrow}>training</p>
      </header>
      <WeeklyTrainingPlan onStartWorkout={onStartWorkout} onLogWorkout={onLogWorkout} />
      <WorkoutJournal />
    </div>
  )
}

export default function HealthTraining({ configured, onCreatePlan, onLogWorkout, onStartWorkout }) {
  if (configured) {
    return <ConfiguredTraining onStartWorkout={onStartWorkout} onLogWorkout={onLogWorkout} />
  }

  return (
    <EmptyTraining
      onCreatePlan={onCreatePlan}
      onLogWorkout={onLogWorkout}
    />
  )
}
