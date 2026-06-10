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
      <PlannerActionRow style={s.primaryActions}>
        <PlannerActionButton onClick={completeWorkout}>complete workout</PlannerActionButton>
        <span style={s.actionDivider} />
        <PlannerActionButton secondary onClick={() => setStatus('planned')}>cancel</PlannerActionButton>
      </PlannerActionRow>
    )
  }

  if (status === 'completed') {
    return (
      <PlannerActionRow style={s.secondaryActions}>
        <PlannerActionButton secondary onClick={onLogWorkout}>edit log</PlannerActionButton>
      </PlannerActionRow>
    )
  }

  if (status === 'skipped') {
    return (
      <PlannerActionRow style={s.primaryActions}>
        <PlannerActionButton disabled>skipped</PlannerActionButton>
        <span style={s.actionDivider} />
        <PlannerActionButton secondary onClick={() => setStatus('planned')}>undo skip</PlannerActionButton>
      </PlannerActionRow>
    )
  }

  return (
    <PlannerActionRow style={s.primaryActions}>
      <PlannerActionButton onClick={startWorkout}>start workout</PlannerActionButton>
      <span style={s.actionDivider} />
      <PlannerActionButton secondary onClick={completeWorkout}>mark complete</PlannerActionButton>
      <PlannerActionButton secondary onClick={() => setStatus('skipped')}>skip</PlannerActionButton>
    </PlannerActionRow>
  )
}

function formatWeekRange(weekDates) {
  const start = weekDates[0]
  const end = weekDates[weekDates.length - 1]
  const startLabel = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toLowerCase()
  const endLabel = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toLowerCase()
  return `${startLabel} - ${endLabel}`
}

function statusMeta(status) {
  if (status === 'completed') return { symbol: '●', label: 'done' }
  if (status === 'in_progress') return { symbol: '◐', label: 'active' }
  if (status === 'skipped') return { symbol: '○', label: 'skipped' }
  if (status === 'open') return { symbol: '–', label: 'open' }
  return { symbol: '○', label: 'planned' }
}

function WeeklyTrainingStrip({
  weekDates,
  selectedIso,
  onSelect,
  getDayPlan,
}) {
  const today = getTodayISO()

  return (
    <section style={s.weekStrip} aria-label="this week">
      <div style={s.weekStripHeader}>
        <p style={s.weekStripLabel}>this week</p>
        <p style={s.weekStripRange}>{formatWeekRange(weekDates)}</p>
      </div>
      <div style={s.weekPlannerRow}>
        {weekDates.map(date => {
          const iso = toLocalISO(date)
          const dayPlan = getDayPlan?.(date)
          const isToday = iso === today
          const selected = iso === selectedIso
          const dayType = dayPlan?.scheduled ? workoutTypeLabel(dayPlan.workout) : 'Open'
          const status = statusMeta(dayPlan?.scheduled ? dayPlan.status : 'open')

          return (
            <button
              key={iso}
              style={{
                ...s.weekPlannerCell,
                ...(selected ? s.weekPlannerCellSelected : {}),
                ...(isToday ? s.weekPlannerCellToday : {}),
              }}
              onClick={() => onSelect(iso)}
              type="button"
              aria-pressed={selected}
            >
              <span style={s.weekCellDate}>
                <span style={s.weekCellDay}>
                  {date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3)}
                </span>
                <span style={s.weekCellNumber}>{date.getDate()}</span>
              </span>
              <span style={s.weekCellType}>
                {dayType}
              </span>
              <span style={s.weekCellStatus}>
                <span style={s.weekCellStatusMark} aria-hidden="true">{status.symbol}</span>
                <span style={s.weekCellStatusLabel}>{status.label}</span>
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}

function OpenTrainingCommitment({ date, onCreatePlan, onLogWorkout, showPlanAction = false, children }) {
  return (
    <div style={s.block}>
      <div style={s.openTrainingItem}>
        <p style={s.workoutMeta}>{formatSelectedDay(date)}</p>
        <h3 style={s.openTrainingTitle}>open day</h3>
        <PlannerRow label="status" value="unscheduled" detail={showPlanAction ? 'plan not created' : undefined} />
      </div>
      {children}
      <PlannerActionRow style={s.actions}>
        {showPlanAction && <PlannerActionButton onClick={onCreatePlan}>create plan</PlannerActionButton>}
        <PlannerActionButton secondary onClick={onLogWorkout}>log workout</PlannerActionButton>
      </PlannerActionRow>
    </div>
  )
}

function TodayTraining({ configured, onCreatePlan, onLogWorkout, onStartWorkout, onOpenWeekly }) {
  const { fitnessState } = useFitness()
  const { settingsState } = useSettings()
  const today = getTodayISO()
  const todayDate = new Date(`${today}T00:00:00`)
  const todayPlan = getTrainingDayPlan(fitnessState, settingsState, todayDate)

  return (
    <section style={s.healthSection} aria-labelledby="health-training-title">
      <header style={s.sectionHeader}>
        <p style={s.sectionLabel}>training</p>
        <h2 id="health-training-title" style={s.sectionTitle}>today</h2>
      </header>

      {configured && todayPlan.scheduled ? (
        <section style={s.block}>
          <TrainingCommitment workout={todayPlan.workout} date={todayDate} status={todayPlan.status}>
            <DailyWorkoutActions
              status={todayPlan.status}
              workout={todayPlan.workout}
              onStartWorkout={onStartWorkout}
              onLogWorkout={onLogWorkout}
              date={todayPlan.iso}
            />
            <PlannerActionRow style={s.secondaryActions}>
              <PlannerActionButton secondary onClick={onOpenWeekly}>view week</PlannerActionButton>
            </PlannerActionRow>
          </TrainingCommitment>
        </section>
      ) : (
        <OpenTrainingCommitment
          date={todayDate}
          onCreatePlan={onCreatePlan}
          onLogWorkout={onLogWorkout}
          showPlanAction={!configured}
        >
          {!configured && <p style={s.emptyCopy}>No training plan yet.</p>}
          <PlannerActionRow style={s.secondaryActions}>
            <PlannerActionButton secondary onClick={onOpenWeekly}>view week</PlannerActionButton>
          </PlannerActionRow>
        </OpenTrainingCommitment>
      )}
    </section>
  )
}

function EmptyWeeklyTraining({ onCreatePlan, onLogWorkout }) {
  const [showTypes, setShowTypes] = useState(false)
  const weekDates = useMemo(() => getWeekDates(), [])
  const today = getTodayISO()
  const [selectedIso, setSelectedIso] = useState(today)
  const selectedDate = weekDates.find(date => toLocalISO(date) === selectedIso) ?? weekDates[0]

  return (
    <section style={s.healthSection} aria-labelledby="health-weekly-title">
      <header style={s.sectionHeader}>
        <p style={s.sectionLabel}>weekly commitments</p>
        <h2 id="health-weekly-title" style={s.sectionTitle}>training week</h2>
      </header>
      <WeeklyTrainingStrip
        weekDates={weekDates}
        selectedIso={selectedIso}
        onSelect={setSelectedIso}
      />
      <OpenTrainingCommitment
        date={selectedDate}
        onCreatePlan={onCreatePlan}
        onLogWorkout={onLogWorkout}
        showPlanAction
      >
        <p style={s.emptyCopy}>No training plan yet.</p>
      </OpenTrainingCommitment>
      <PlannerActionRow style={s.actions}>
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
        <div style={s.workoutSummaryRows}>
          <div style={s.workoutSummaryRow}>
            <span style={s.workoutSummaryLabel}>status</span>
            <span style={s.workoutSummaryValue}>{summary.statusMarker} · {summary.duration}</span>
          </div>
          <div style={s.workoutSummaryRow}>
            <span style={s.workoutSummaryLabel}>focus</span>
            <span style={s.workoutSummaryValue}>{summary.focusLabel}</span>
          </div>
        </div>
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
      <WeeklyTrainingStrip
        weekDates={weekDates}
        selectedIso={selectedIso}
        onSelect={setSelectedIso}
        getDayPlan={date => getTrainingDayPlan(fitnessState, settingsState, date)}
      />

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
            <div style={s.openTrainingItem}>
              <p style={s.workoutMeta}>{formatSelectedDay(selectedDate)}</p>
              <h2 style={s.openTrainingTitle}>open day</h2>
              <PlannerRow label="status" value="unscheduled" />
            </div>
            <PlannerActionRow style={s.secondaryActions}>
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
              <span style={s.journalTitle}>{entry.title || workoutFocus(entry.type, entry.title)}</span>
              <span style={s.journalMeta}>
                {[
                  entry.status === 'completed' ? '●' : '○',
                  workoutFocus(entry.type, entry.title),
                  entry.duration ? `${entry.duration} min` : null,
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

function ConfiguredWeeklyTraining({ onStartWorkout, onLogWorkout }) {
  return (
    <section style={s.healthSection} aria-labelledby="health-weekly-title">
      <header style={s.sectionHeader}>
        <p style={s.sectionLabel}>weekly commitments</p>
        <h2 id="health-weekly-title" style={s.sectionTitle}>training week</h2>
      </header>
      <WeeklyTrainingPlan onStartWorkout={onStartWorkout} onLogWorkout={onLogWorkout} />
      <WorkoutJournal />
    </section>
  )
}

export default function HealthTraining({
  configured,
  onCreatePlan,
  onLogWorkout,
  onStartWorkout,
  onOpenWeekly,
  variant = 'weekly',
}) {
  if (variant === 'today') {
    return (
      <TodayTraining
        configured={configured}
        onCreatePlan={onCreatePlan}
        onLogWorkout={onLogWorkout}
        onStartWorkout={onStartWorkout}
        onOpenWeekly={onOpenWeekly}
      />
    )
  }

  if (configured) {
    return <ConfiguredWeeklyTraining onStartWorkout={onStartWorkout} onLogWorkout={onLogWorkout} />
  }

  return (
    <EmptyWeeklyTraining
      onCreatePlan={onCreatePlan}
      onLogWorkout={onLogWorkout}
    />
  )
}
