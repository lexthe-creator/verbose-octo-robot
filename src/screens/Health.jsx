import { useMemo, useState } from 'react'
import {
  getNutritionEntriesForDate,
  getNutritionTotals,
  useDay,
  useFitness,
  useNutrition,
} from '../context/index.js'
import { useSettings } from '../context/SettingsContext.jsx'
import { GYM_ACCESS, PHASE_LABELS, WORKOUT_TYPES } from '../constants/fitness.js'
import { getPhase, getTypeForDay, getWeekDates, getWeekNumber, generateWorkout } from '../utils/fitness.js'
import { getTodayISO } from '../utils/time.js'
import Fitness from './Fitness.jsx'
import Nutrition from './Nutrition.jsx'

const SECTIONS = ['today', 'training', 'nutrition', 'insights']
const SECTION_LABELS = {
  today:     'Today',
  training:  'Training',
  nutrition: 'Nutrition',
  insights:  'Insights',
}

const FEEL_OPTIONS = [
  { value: 1, label: 'low' },
  { value: 3, label: 'steady' },
  { value: 5, label: 'high' },
]

const GOAL_OPTIONS = [
  { value: 'general', label: 'General fitness' },
  { value: 'fat_loss', label: 'Fat loss' },
  { value: 'strength', label: 'Strength' },
  { value: 'endurance', label: 'Running' },
  { value: 'hyrox', label: 'HYROX' },
  { value: 'custom', label: 'Custom' },
]

const DAYS_OPTIONS = [3, 4, 5, 6]

const EQUIPMENT_OPTIONS = [
  { value: 'bodyweight', access: GYM_ACCESS.BODYWEIGHT, label: 'Bodyweight' },
  { value: 'dumbbells', access: GYM_ACCESS.DUMBBELLS, label: 'Dumbbells' },
  { value: 'home_gym', access: GYM_ACCESS.DUMBBELLS, label: 'Home gym' },
  { value: 'full_gym', access: GYM_ACCESS.GYM, label: 'Full gym' },
]

const TRAINING_DAYS_BY_COUNT = {
  3: ['mon', 'wed', 'fri'],
  4: ['mon', 'tue', 'thu', 'sat'],
  5: ['mon', 'tue', 'wed', 'fri', 'sat'],
  6: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
}

const DAY_TYPE_DEFAULTS = {
  general:   ['run_easy', 'upper', 'lower', 'full_body', 'mobility', 'run_easy'],
  fat_loss:  ['run_easy', 'full_body', 'upper', 'lower', 'mobility', 'run_easy'],
  strength:  ['upper', 'lower', 'upper', 'lower', 'full_body', 'mobility'],
  endurance: ['run_easy', 'strength', 'run_tempo', 'run_long', 'mobility', 'run_easy'],
  hyrox:     ['run_easy', 'full_body', 'run_tempo', 'strength', 'run_long', 'mobility'],
  custom:    ['full_body', 'run_easy', 'mobility', 'upper', 'lower', 'run_long'],
}

const WORKOUT_LOG_TYPES = [
  { type: WORKOUT_TYPES.STRENGTH_A, title: 'Strength' },
  { type: WORKOUT_TYPES.EASY_RUN, title: 'Run' },
  { type: 'walk', title: 'Walk' },
  { type: WORKOUT_TYPES.STRETCH, title: 'Mobility' },
  { type: 'hyrox', title: 'HYROX' },
  { type: 'other', title: 'Other' },
]

const EFFORT_OPTIONS = ['Easy', 'Moderate', 'Hard']
const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

const DAY_TYPE_TO_WORKOUT_TYPE = {
  upper:     WORKOUT_TYPES.STRENGTH_A,
  lower:     WORKOUT_TYPES.STRENGTH_B,
  full_body: WORKOUT_TYPES.STRENGTH_A,
  push:      WORKOUT_TYPES.STRENGTH_A,
  pull:      WORKOUT_TYPES.STRENGTH_B,
  strength:  WORKOUT_TYPES.STRENGTH_A,
  mobility:  WORKOUT_TYPES.STRETCH,
  run_easy:  WORKOUT_TYPES.EASY_RUN,
  run_tempo: WORKOUT_TYPES.TEMPO_RUN,
  run_long:  WORKOUT_TYPES.LONG_RUN,
}

const STATUS_LABELS = {
  planned:     'Planned',
  in_progress: 'In progress',
  completed:   'Completed',
  skipped:     'Skipped',
}

function makeDailyHealthKey(date) {
  return `aiml_health_today_${date}`
}

function loadDailyHealth(date) {
  try {
    const raw = localStorage.getItem(makeDailyHealthKey(date))
    if (!raw) return { water: 0, soreness: null, motivation: null }
    return { water: 0, soreness: null, motivation: null, ...JSON.parse(raw) }
  } catch {
    return { water: 0, soreness: null, motivation: null }
  }
}

function saveDailyHealth(date, value) {
  try {
    localStorage.setItem(makeDailyHealthKey(date), JSON.stringify(value))
  } catch { /* local storage unavailable */ }
}

function PlannerRow({ label, value, detail, percent }) {
  const detailIsLong = typeof detail === 'string' && detail.length > 18

  return (
    <div style={s.row}>
      <span style={s.rowLabel}>{label}</span>
      <span style={s.rowValue}>{value}</span>
      {detail && (
        <span style={{ ...s.rowDetail, ...(detailIsLong ? s.rowDetailLong : {}) }}>
          {detail}
        </span>
      )}
      {typeof percent === 'number' && (
        <span style={s.meter}>
          <span style={{ ...s.meterFill, width: `${percent}%` }} />
        </span>
      )}
    </div>
  )
}

function SectionHeader({ eyebrow, title }) {
  return (
    <div style={s.sectionHeader}>
      <p style={s.eyebrow}>{eyebrow}</p>
      <h2 style={s.sectionTitle}>{title}</h2>
    </div>
  )
}

function ActionButton({ children, onClick, disabled, secondary = false }) {
  return (
    <button
      style={{ ...s.action, ...(secondary ? s.secondaryAction : {}), opacity: disabled ? 0.44 : 1 }}
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      {children}
    </button>
  )
}

function InlineActions({ children }) {
  return <div style={s.inlineActions}>{children}</div>
}

function CheckInButtons({ label, value, onChange }) {
  return (
    <div style={s.checkRow}>
      <span style={s.checkLabel}>{label}</span>
      <div style={s.segment}>
        {FEEL_OPTIONS.map(option => (
          <button
            key={option.value}
            style={{ ...s.segmentButton, ...(value === option.value ? s.segmentActive : {}) }}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function PlannerGroup({ label, children }) {
  return (
    <div style={s.plannerGroup}>
      <p style={s.groupLabel}>{label}</p>
      <div style={s.groupRows}>
        {children}
      </div>
    </div>
  )
}

function getTodayTrainingPlan(fitnessState, settingsState) {
  if (!fitnessState.program.configured) {
    return { scheduled: false, workout: null, status: 'none' }
  }

  const today = getTodayISO()
  const todayKey = DAY_KEYS[new Date().getDay()]
  const configuredDays = fitnessState.programConfig.trainingDays ?? []
  const hasConfiguredSchedule = configuredDays.length > 0
  const scheduled = hasConfiguredSchedule
    ? configuredDays.includes(todayKey)
    : getTypeForDay(new Date().getDay()) !== WORKOUT_TYPES.REST

  if (!scheduled) {
    return { scheduled: false, workout: null, status: 'none' }
  }

  const configuredDayType = fitnessState.programConfig.dayTypes?.[todayKey]
  const workoutType = DAY_TYPE_TO_WORKOUT_TYPE[configuredDayType] ?? getTypeForDay(new Date().getDay())
  const workout = generateWorkout(workoutType, settingsState.gymAccess, getWeekNumber(fitnessState.programStartDate))
  const storedStatus = fitnessState.workoutDayStatus?.[today]?.status
  const status = storedStatus || (fitnessState.todayComplete ? 'completed' : 'planned')
  return { scheduled: true, workout, status }
}

function formatWorkoutDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function effortToFeel(effort) {
  if (effort === 'Hard') return 5
  if (effort === 'Easy') return 2
  return 3
}

function statusDetail(status) {
  if (status === 'in_progress') return 'open'
  if (status === 'completed') return 'done'
  if (status === 'skipped') return 'moved'
  return 'open day'
}

function getReadiness(energy, soreness) {
  if (!energy) return 'check in'
  if (energy >= 4 && (!soreness || soreness <= 3)) return 'ready'
  if (energy <= 2 || soreness >= 5) return 'recover'
  return 'steady'
}

function buildDayTypes(goal, days) {
  const defaults = DAY_TYPE_DEFAULTS[goal] ?? DAY_TYPE_DEFAULTS.general
  return Object.fromEntries(days.map((day, index) => [day, defaults[index] ?? defaults[0]]))
}

function DailyWorkoutActions({ status, workout, onStartWorkout, onLogWorkout }) {
  const { fitnessDispatch } = useFitness()
  const today = getTodayISO()

  function startWorkout() {
    fitnessDispatch({ type: 'SET_WORKOUT_DAY_STATUS', payload: { date: today, status: 'in_progress' } })
    onStartWorkout?.(workout)
  }

  function completeWorkout() {
    fitnessDispatch({
      type: 'LOG_WORKOUT',
      payload: {
        date: today,
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
    fitnessDispatch({ type: 'SET_WORKOUT_DAY_STATUS', payload: { date: today, status: nextStatus } })
  }

  if (status === 'in_progress') {
    return (
      <div style={s.actions}>
        <ActionButton onClick={completeWorkout}>complete workout</ActionButton>
        <ActionButton secondary onClick={() => setStatus('planned')}>cancel</ActionButton>
      </div>
    )
  }

  if (status === 'completed') {
    return (
      <div style={s.actions}>
        <ActionButton secondary onClick={onLogWorkout}>edit log</ActionButton>
      </div>
    )
  }

  if (status === 'skipped') {
    return (
      <div style={s.actions}>
        <ActionButton disabled>skipped</ActionButton>
        <ActionButton secondary onClick={() => setStatus('planned')}>undo skip</ActionButton>
      </div>
    )
  }

  return (
    <div style={s.actions}>
      <ActionButton onClick={startWorkout}>start workout</ActionButton>
      <ActionButton secondary onClick={completeWorkout}>mark complete</ActionButton>
      <ActionButton secondary onClick={() => setStatus('skipped')}>skip</ActionButton>
    </div>
  )
}

function HealthToday({
  onSectionChange,
  onStartWorkout,
  onLogWorkout,
}) {
  const today = getTodayISO()
  const { dayState, dayDispatch } = useDay()
  const { fitnessState } = useFitness()
  const { settingsState } = useSettings()
  const { nutritionState } = useNutrition()
  const [daily, setDaily] = useState(() => loadDailyHealth(today))

  const nutritionEntries = getNutritionEntriesForDate(nutritionState, today)
  const totals = getNutritionTotals(nutritionEntries)
  const hydrationTarget = 8

  const trainingPlan = getTodayTrainingPlan(fitnessState, settingsState)
  const workout = trainingPlan.workout
  const energy = dayState.energyLevel ?? daily.energy ?? null
  const readiness = getReadiness(energy, daily.soreness)
  const recoveryStatus = daily.soreness >= 5 ? 'needs care' : daily.soreness ? 'clear enough' : 'not checked'

  function updateDaily(patch) {
    const next = { ...daily, ...patch }
    setDaily(next)
    saveDailyHealth(today, next)
  }

  function updateEnergy(value) {
    dayDispatch({ type: 'SET_ENERGY', payload: value })
    updateDaily({ energy: value })
  }

  return (
    <main style={s.today}>
      <header style={s.header}>
        <p style={s.eyebrow}>health</p>
        <h1 style={s.title}>Today</h1>
      </header>

      <section style={s.plannerCard}>
        <p style={s.plannerTitle}>TODAY'S HEALTH PLAN</p>

        <PlannerGroup label="Morning">
          <PlannerRow label="sleep" value="add later" />
          <PlannerRow label="energy" value={energy ? `${energy}/5` : 'check in'} />
          <PlannerRow label="readiness" value={readiness === 'check in' ? 'pending' : readiness} detail={recoveryStatus === 'not checked' ? '' : recoveryStatus} />
        </PlannerGroup>

        <PlannerGroup label="Training">
          {fitnessState.program.configured ? (
            trainingPlan.scheduled ? (
              <>
                <PlannerRow label="workout" value={workout.title.toLowerCase()} />
                <PlannerRow label="focus" value={workout.subtitle.split('·')[0].trim().toLowerCase()} detail={`~${workout.durationEst} min`} />
                <PlannerRow label="status" value={STATUS_LABELS[trainingPlan.status].toLowerCase()} />
                <DailyWorkoutActions
                  status={trainingPlan.status}
                  workout={workout}
                  onStartWorkout={onStartWorkout}
                  onLogWorkout={onLogWorkout}
                />
              </>
            ) : (
              <>
                <PlannerRow label="today" value="open day" />
                <PlannerRow label="status" value="unscheduled" />
                <InlineActions>
                  <ActionButton secondary onClick={onLogWorkout}>log workout</ActionButton>
                  <ActionButton secondary onClick={() => onSectionChange('training')}>view plan</ActionButton>
                </InlineActions>
              </>
            )
          ) : (
            <>
              <PlannerRow label="today" value="open day" />
              <PlannerRow label="plan" value="add from Training" />
              <InlineActions>
                <ActionButton secondary onClick={() => onSectionChange('training')}>
                  view plan
                </ActionButton>
              </InlineActions>
            </>
          )}
        </PlannerGroup>

        <PlannerGroup label="Fuel">
          <PlannerRow label="protein" value={`${Math.round(totals.protein)}g`} />
          <PlannerRow label="calories" value={`${Math.round(totals.calories)}`} />
          <PlannerRow label="water" value={`${daily.water}/${hydrationTarget}`} />
          <InlineActions>
            <ActionButton secondary onClick={() => onSectionChange('nutrition')}>log meal</ActionButton>
            <ActionButton secondary onClick={() => updateDaily({ water: Math.min(hydrationTarget, daily.water + 1) })}>
              water
            </ActionButton>
          </InlineActions>
        </PlannerGroup>

        <PlannerGroup label="Check-in">
          <CheckInButtons label="energy" value={energy} onChange={updateEnergy} />
          <CheckInButtons label="soreness" value={daily.soreness} onChange={value => updateDaily({ soreness: value })} />
          <CheckInButtons label="motivation" value={daily.motivation} onChange={value => updateDaily({ motivation: value })} />
        </PlannerGroup>
      </section>
    </main>
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
        <PlannerRow label="history" value="available" detail="log any session" />
        <p style={s.emptyCopy}>No training plan yet.</p>
        <div style={s.actions}>
          <ActionButton onClick={onCreatePlan}>create plan</ActionButton>
          <ActionButton secondary onClick={onLogWorkout}>log workout</ActionButton>
          <ActionButton secondary onClick={() => setShowTypes(value => !value)}>browse types</ActionButton>
        </div>
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

function DailyTrainingCard({ onStartWorkout, onLogWorkout }) {
  const { fitnessState } = useFitness()
  const { settingsState } = useSettings()
  const trainingPlan = getTodayTrainingPlan(fitnessState, settingsState)
  const workout = trainingPlan.workout

  return (
    <section style={{ ...s.block, ...s.trainingBlock }}>
      <SectionHeader eyebrow="today" title={workout?.title ?? 'Open day'} />
      {trainingPlan.scheduled ? (
        <>
          <PlannerRow label="type" value={workout.subtitle.split('·')[0].trim()} detail={`~${workout.durationEst} min`} />
          <PlannerRow label="status" value={STATUS_LABELS[trainingPlan.status]} detail={statusDetail(trainingPlan.status)} />
          <DailyWorkoutActions
            status={trainingPlan.status}
            workout={workout}
            onStartWorkout={onStartWorkout}
            onLogWorkout={onLogWorkout}
          />
        </>
      ) : (
        <>
          <PlannerRow label="status" value="open day" detail="no scheduled session" />
          <div style={s.actions}>
            <ActionButton onClick={onLogWorkout}>log workout</ActionButton>
          </div>
        </>
      )}
    </section>
  )
}

function WorkoutHistory() {
  const { fitnessState } = useFitness()
  const today = getTodayISO()
  const todayStatus = fitnessState.workoutDayStatus?.[today]?.status
  const logs = [...(fitnessState.workoutLog ?? [])].reverse().slice(0, 6)
  const hasTodaySkipped = todayStatus === 'skipped' && !logs.some(entry => String(entry.date).slice(0, 10) === today)
  const history = hasTodaySkipped
    ? [{ date: today, title: 'Planned workout', duration: 0, status: 'skipped', effort: '' }, ...logs].slice(0, 6)
    : logs

  return (
    <section style={{ ...s.block, ...s.trainingBlock }}>
      <SectionHeader eyebrow="history" title="Recent workouts" />
      {history.length === 0 ? (
        <p style={s.emptyCopy}>No workouts logged yet.</p>
      ) : (
        <div style={s.historyList}>
          {history.map((entry, index) => (
            <div key={`${entry.date}-${index}`} style={s.historyRow}>
              <span style={s.historyDate}>{formatWorkoutDate(entry.date)}</span>
              <span style={s.historyMain}>{entry.title || entry.type || 'Workout'}</span>
              <span style={s.historyMeta}>
                {entry.duration ? `${entry.duration} min` : '—'} · {STATUS_LABELS[entry.status] ?? 'Completed'}{entry.effort ? ` · ${entry.effort}` : ''}
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
      <DailyTrainingCard onStartWorkout={onStartWorkout} onLogWorkout={onLogWorkout} />
      <Fitness onStartWorkout={onStartWorkout} />
      <WorkoutHistory />
    </div>
  )
}

function Sheet({ title, children, onClose }) {
  return (
    <div style={s.sheetBackdrop}>
      <div style={s.sheet}>
        <div style={s.sheetHeader}>
          <h2 style={s.sheetTitle}>{title}</h2>
          <button style={s.closeButton} onClick={onClose} type="button">close</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function OptionGrid({ options, value, onChange }) {
  return (
    <div style={s.optionGrid}>
      {options.map(option => {
        const optionValue = typeof option === 'object' ? option.value : option
        const label = typeof option === 'object' ? option.label : `${option} days`
        const active = value === optionValue || value === option
        return (
          <button
            key={`${optionValue}-${label}`}
            style={{ ...s.optionButton, ...(active ? s.optionActive : {}) }}
            onClick={() => onChange(optionValue)}
            type="button"
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

function getEquipmentChoice(gymAccess) {
  if (gymAccess === GYM_ACCESS.GYM) return 'full_gym'
  if (gymAccess === GYM_ACCESS.DUMBBELLS) return 'dumbbells'
  return 'bodyweight'
}

function PlanSetupSheet({ onClose }) {
  const { fitnessDispatch } = useFitness()
  const { settingsState, settingsDispatch } = useSettings()
  const [step, setStep] = useState(1)
  const [goal, setGoal] = useState('general')
  const [daysPerWeek, setDaysPerWeek] = useState(4)
  const [equipment, setEquipment] = useState(() => getEquipmentChoice(settingsState.gymAccess))

  function finish() {
    const trainingDays = TRAINING_DAYS_BY_COUNT[daysPerWeek] ?? TRAINING_DAYS_BY_COUNT[4]
    const equipmentAccess = EQUIPMENT_OPTIONS.find(option => option.value === equipment)?.access ?? GYM_ACCESS.BODYWEIGHT
    settingsDispatch({ type: 'UPDATE_SETTING', payload: { key: 'gymAccess', value: equipmentAccess } })
    fitnessDispatch({
      type: 'CONFIGURE_PROGRAM',
      payload: {
        type: goal,
        trainingDays,
        dayTypes: buildDayTypes(goal, trainingDays),
        goal,
        audioEnabled: false,
      },
    })
    fitnessDispatch({ type: 'UPDATE_FITNESS', payload: { key: 'programStartDate', value: getTodayISO() } })
    onClose()
  }

  return (
    <Sheet title="Create plan" onClose={onClose}>
      <div style={s.stepMeta}>Step {step} of 3</div>
      {step === 1 && (
        <div style={s.sheetBody}>
          <SectionHeader eyebrow="goal" title="What should training support?" />
          <OptionGrid options={GOAL_OPTIONS} value={goal} onChange={setGoal} />
        </div>
      )}
      {step === 2 && (
        <div style={s.sheetBody}>
          <SectionHeader eyebrow="days per week" title="Pick a realistic rhythm." />
          <OptionGrid options={DAYS_OPTIONS} value={daysPerWeek} onChange={setDaysPerWeek} />
        </div>
      )}
      {step === 3 && (
        <div style={s.sheetBody}>
          <SectionHeader eyebrow="equipment" title="What can workouts assume?" />
          <OptionGrid options={EQUIPMENT_OPTIONS} value={equipment} onChange={setEquipment} />
        </div>
      )}
      <div style={s.sheetActions}>
        <ActionButton secondary onClick={step === 1 ? onClose : () => setStep(value => value - 1)}>
          {step === 1 ? 'cancel' : 'back'}
        </ActionButton>
        <ActionButton onClick={step === 3 ? finish : () => setStep(value => value + 1)}>
          {step === 3 ? 'save plan' : 'next'}
        </ActionButton>
      </div>
    </Sheet>
  )
}

function LogWorkoutSheet({ onClose }) {
  const { fitnessDispatch } = useFitness()
  const [workoutType, setWorkoutType] = useState(WORKOUT_LOG_TYPES[0].type)
  const [duration, setDuration] = useState('30')
  const [effort, setEffort] = useState('Moderate')
  const [notes, setNotes] = useState('')

  function saveLog() {
    const option = WORKOUT_LOG_TYPES.find(item => item.type === workoutType) ?? WORKOUT_LOG_TYPES[0]
    const durationMin = Math.max(1, Number(duration) || 1)
    fitnessDispatch({
      type: 'LOG_WORKOUT',
      payload: {
        date: getTodayISO(),
        type: option.type,
        title: option.title,
        duration: durationMin,
        effort,
        feel: effortToFeel(effort),
        notes: notes.trim(),
        exercises: [],
        status: 'completed',
        source: 'manual',
      },
    })
    onClose()
  }

  return (
    <Sheet title="Log workout" onClose={onClose}>
      <div style={s.sheetBody}>
        <SectionHeader eyebrow="quick log" title="Capture the session." />
        <div>
          <p style={s.fieldLabel}>Workout type</p>
          <OptionGrid options={WORKOUT_LOG_TYPES.map(item => ({ value: item.type, label: item.title }))} value={workoutType} onChange={setWorkoutType} />
        </div>
        <label style={s.fieldStack}>
          <span style={s.fieldLabel}>Duration</span>
          <input
            style={s.lineInput}
            type="number"
            inputMode="numeric"
            min="1"
            value={duration}
            onChange={event => setDuration(event.target.value)}
          />
        </label>
        <div>
          <p style={s.fieldLabel}>Effort</p>
          <OptionGrid options={EFFORT_OPTIONS.map(item => ({ value: item, label: item }))} value={effort} onChange={setEffort} />
        </div>
        <label style={s.fieldStack}>
          <span style={s.fieldLabel}>Notes</span>
          <textarea
            style={s.textarea}
            value={notes}
            onChange={event => setNotes(event.target.value)}
            rows={3}
          />
        </label>
      </div>
      <div style={s.sheetActions}>
        <ActionButton secondary onClick={onClose}>cancel</ActionButton>
        <ActionButton onClick={saveLog}>save log</ActionButton>
      </div>
    </Sheet>
  )
}

function Insights() {
  const { fitnessState } = useFitness()
  const { nutritionState } = useNutrition()
  const todayEntries = getNutritionEntriesForDate(nutritionState, getTodayISO())
  const totals = getNutritionTotals(todayEntries)
  const weekDates = useMemo(() => getWeekDates(), [])
  const completedThisWeek = fitnessState.workoutLog.filter(entry =>
    weekDates.some(date => entry.date === date.toISOString().slice(0, 10))
  ).length

  return (
    <main style={s.simpleScreen}>
      <header style={s.header}>
        <p style={s.eyebrow}>insights</p>
        <h1 style={s.title}>Light trends</h1>
      </header>
      <section style={s.block}>
        <PlannerRow label="sleep" value="pending" detail="source later" />
        <PlannerRow label="workouts" value={`${completedThisWeek}`} detail="this week" />
        <PlannerRow label="protein" value={`${Math.round(totals.protein)}g`} detail="today" />
        <PlannerRow label="hydration" value="today only" detail="trend later" />
        <PlannerRow label="weight" value="pending" detail="metric later" />
        <PlannerRow label="recovery" value="check-ins" detail="expands later" />
      </section>
    </main>
  )
}

export default function Health({ onStartWorkout }) {
  const [section, setSection] = useState('today')
  const [sheet, setSheet] = useState(null)
  const { fitnessState } = useFitness()
  const phaseKey = getPhase(fitnessState.programStartDate, fitnessState.programEndDate)

  return (
    <div style={s.screen}>
      <div style={s.top}>
        <div style={s.tabs} aria-label="health sections">
          {SECTIONS.map(item => (
            <button
              key={item}
              style={{ ...s.tab, ...(section === item ? s.tabActive : {}) }}
              onClick={() => setSection(item)}
              type="button"
            >
              {SECTION_LABELS[item]}
            </button>
          ))}
        </div>
        {fitnessState.program.configured && (
          <p style={s.phaseLine}>{PHASE_LABELS[phaseKey]} · week {getWeekNumber(fitnessState.programStartDate)}</p>
        )}
      </div>

      {section === 'today' && (
        <HealthToday
          onSectionChange={setSection}
          onStartWorkout={onStartWorkout}
          onLogWorkout={() => setSheet('log')}
        />
      )}
      {section === 'training' && (
        fitnessState.program.configured
          ? <ConfiguredTraining onStartWorkout={onStartWorkout} onLogWorkout={() => setSheet('log')} />
          : (
            <EmptyTraining
              onCreatePlan={() => setSheet('plan')}
              onLogWorkout={() => setSheet('log')}
            />
          )
      )}
      {section === 'nutrition' && <Nutrition />}
      {section === 'insights' && <Insights />}
      {sheet === 'plan' && <PlanSetupSheet onClose={() => setSheet(null)} />}
      {sheet === 'log' && <LogWorkoutSheet onClose={() => setSheet(null)} />}
    </div>
  )
}

const s = {
  screen: {
    minHeight:    '100dvh',
    background:   'var(--color-bg)',
    color:        'var(--color-text)',
    paddingBottom: 'calc(var(--safe-bottom) + var(--nav-height) + 18px)',
  },
  top: {
    position:   'sticky',
    top:        0,
    zIndex:     20,
    padding:    'max(env(safe-area-inset-top), 9px) 20px 4px',
    background: 'color-mix(in srgb, var(--color-bg) 98%, transparent)',
  },
  tabs: {
    display:    'flex',
    alignItems: 'center',
    gap:        '4px',
    padding:    0,
    background: 'transparent',
  },
  tab: {
    minHeight:    '21px',
    border:       'var(--border)',
    borderRadius: '999px',
    background:   'transparent',
    color:        'var(--color-muted)',
    fontSize:     '10px',
    fontWeight:   650,
    padding:      '3px 7px',
  },
  tabActive: {
    borderColor: 'color-mix(in srgb, var(--color-accent) 34%, var(--color-border))',
    background:  'color-mix(in srgb, var(--color-accent-bg) 62%, transparent)',
    color:       'var(--color-text)',
  },
  phaseLine: {
    margin:        '5px 2px 0',
    color:         'var(--color-muted)',
    fontSize:      '9px',
    fontWeight:    650,
    letterSpacing: '0',
    textTransform: 'uppercase',
  },
  today: {
    padding:       '5px 20px 0',
    display:       'flex',
    flexDirection: 'column',
    gap:           '6px',
  },
  simpleScreen: {
    minHeight:     '100dvh',
    padding:       '6px 20px 0',
  },
  trainingScreen: {
    minHeight:     '100dvh',
    padding:       '6px 0 0',
  },
  header: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '1px',
    margin:        '0 0 1px',
  },
  eyebrow: {
    margin:        0,
    color:         'var(--color-muted)',
    fontSize:      '10px',
    fontWeight:    650,
    letterSpacing: '0',
    textTransform: 'lowercase',
  },
  title: {
    margin:      0,
    fontFamily: 'var(--font-display)',
    fontSize:   '16px',
    fontWeight: 500,
    lineHeight: 1.08,
  },
  subtitle: {
    margin:    '2px 0 0',
    color:     'var(--color-muted)',
    fontSize:  '11px',
    lineHeight: 1.3,
  },
  block: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '3px',
    padding:       '9px 10px',
    border:        'var(--border)',
    borderRadius:  '10px',
    background:    'var(--color-card)',
  },
  plannerCard: {
    display:       'flex',
    flexDirection: 'column',
    padding:       '10px 11px',
    border:        'var(--border)',
    borderRadius:  '10px',
    background:    'var(--color-card)',
  },
  plannerTitle: {
    margin:        '0 0 4px',
    color:         'var(--color-muted)',
    fontSize:      '10px',
    fontWeight:    680,
    letterSpacing: '0.02em',
  },
  plannerGroup: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '1px',
    padding:       '7px 0 6px',
    borderTop:     '0.5px solid color-mix(in srgb, var(--color-border) 44%, transparent)',
  },
  groupLabel: {
    margin:     '0 0 2px',
    color:      'var(--color-muted)',
    fontSize:   '11px',
    fontWeight: 640,
  },
  groupRows: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '1px',
  },
  trainingBlock: {
    margin:  '0 20px 7px',
  },
  emptyCopy: {
    margin:    '2px 0 0',
    color:     'var(--color-muted)',
    fontSize:  '11px',
    lineHeight: 1.32,
  },
  typeList: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '2px',
    marginTop:     '8px',
    paddingTop:    '10px',
    borderTop:     'var(--border)',
  },
  sectionHeader: {
    display:       'flex',
    flexDirection: 'column',
    gap:           0,
    marginBottom:  0,
  },
  sectionTitle: {
    margin:      0,
    fontFamily: 'var(--font-body)',
    fontSize:   '12px',
    fontWeight: 650,
    lineHeight: 1.1,
    textTransform: 'none',
  },
  row: {
    display:             'grid',
    gridTemplateColumns: '76px minmax(0, 1fr) auto',
    alignItems:          'center',
    gap:                 '7px',
    minHeight:           '19px',
    padding:             '1px 0',
    borderTop:           'none',
  },
  rowLabel: {
    color:      'var(--color-muted)',
    fontSize:   '11px',
    fontWeight: 560,
  },
  rowValue: {
    minWidth:   0,
    color:      'var(--color-text)',
    fontSize:   '12px',
    fontWeight: 560,
    overflow:   'hidden',
    textOverflow:'ellipsis',
    whiteSpace: 'nowrap',
  },
  rowDetail: {
    color:      'var(--color-muted)',
    fontSize:   '10px',
    fontWeight: 520,
    whiteSpace: 'nowrap',
  },
  rowDetailLong: {
    gridColumn: '2 / 4',
    whiteSpace: 'normal',
    lineHeight: 1.3,
    marginTop:  '-2px',
  },
  meter: {
    gridColumn:   '2 / 4',
    height:       '3px',
    borderRadius: '999px',
    background:   'var(--color-chart-bar)',
    overflow:     'hidden',
  },
  meterFill: {
    display:      'block',
    height:       '100%',
    borderRadius: '999px',
    background:   'var(--color-accent)',
  },
  actions: {
    display:   'flex',
    flexWrap:  'wrap',
    gap:       '5px',
    marginTop: '1px',
  },
  inlineActions: {
    display:   'flex',
    flexWrap:  'wrap',
    gap:       '5px',
    marginTop: '2px',
  },
  action: {
    minHeight:    '22px',
    border:       'none',
    borderRadius: '999px',
    background:   'var(--color-accent)',
    color:        '#fff',
    fontSize:     '10px',
    fontWeight:   650,
    padding:      '3px 8px',
  },
  secondaryAction: {
    border:     'var(--border)',
    background: 'color-mix(in srgb, var(--color-card) 66%, transparent)',
    color:      'var(--color-text)',
  },
  checkRow: {
    display:             'grid',
    gridTemplateColumns: '76px minmax(0, 1fr)',
    alignItems:          'center',
    gap:                 '7px',
    padding:             '1px 0',
    borderTop:           'none',
  },
  checkLabel: {
    color:      'var(--color-muted)',
    fontSize:   '11px',
    fontWeight: 560,
  },
  segment: {
    display:             'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap:                 '4px',
  },
  segmentButton: {
    minHeight:    '23px',
    border:       'var(--border)',
    borderRadius: '999px',
    background:   'transparent',
    color:        'var(--color-muted)',
    fontSize:     '10px',
    fontWeight:   620,
    padding:      '3px 4px',
  },
  segmentActive: {
    borderColor: 'var(--color-accent)',
    background:  'var(--color-accent-bg)',
    color:       'var(--color-accent)',
  },
  sheetBackdrop: {
    position:       'fixed',
    inset:          0,
    zIndex:         180,
    display:        'flex',
    alignItems:     'flex-end',
    justifyContent: 'center',
    background:     'rgba(24, 24, 18, 0.22)',
  },
  sheet: {
    width:        '100%',
    maxWidth:     'var(--max-width)',
    maxHeight:    '82dvh',
    overflowY:    'auto',
    background:   'var(--color-bg)',
    borderTop:    'var(--border)',
    padding:      '16px 20px calc(var(--safe-bottom) + 18px)',
    boxShadow:    '0 -14px 38px rgba(24, 24, 18, 0.14)',
  },
  sheetHeader: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    gap:            '12px',
    marginBottom:   '10px',
  },
  sheetTitle: {
    margin:      0,
    fontFamily: 'var(--font-display)',
    fontSize:   '18px',
    fontWeight: 500,
  },
  closeButton: {
    border:     'none',
    background: 'transparent',
    color:      'var(--color-muted)',
    fontSize:   '12px',
    fontWeight: 750,
    padding:    '4px 0',
  },
  stepMeta: {
    color:         'var(--color-muted)',
    fontSize:      '10px',
    fontWeight:    750,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginBottom:  '10px',
  },
  sheetBody: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '12px',
  },
  fieldStack: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '6px',
  },
  fieldLabel: {
    display:      'block',
    margin:       '0 0 6px',
    color:        'var(--color-muted)',
    fontSize:     '10px',
    fontWeight:   750,
  },
  lineInput: {
    width:        '100%',
    minHeight:    '38px',
    border:       'var(--border)',
    borderRadius: '8px',
    background:   'transparent',
    color:        'var(--color-text)',
    font:         'inherit',
    fontSize:     '14px',
    padding:      '8px 10px',
  },
  textarea: {
    width:        '100%',
    border:       'var(--border)',
    borderRadius: '8px',
    background:   'transparent',
    color:        'var(--color-text)',
    font:         'inherit',
    fontSize:     '14px',
    padding:      '9px 10px',
    resize:       'vertical',
  },
  optionGrid: {
    display:             'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap:                 '6px',
  },
  optionButton: {
    minHeight:    '35px',
    border:       'var(--border)',
    borderRadius: '8px',
    background:   'transparent',
    color:        'var(--color-text)',
    fontSize:     '11px',
    fontWeight:   700,
    padding:      '7px 9px',
    textAlign:    'left',
  },
  optionActive: {
    borderColor: 'var(--color-accent)',
    background:  'var(--color-accent-bg)',
    color:       'var(--color-accent)',
  },
  sheetActions: {
    display:        'flex',
    justifyContent: 'space-between',
    gap:            '8px',
    marginTop:      '16px',
  },
  historyList: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '2px',
  },
  historyRow: {
    display:             'grid',
    gridTemplateColumns: '58px minmax(0, 1fr)',
    gap:                 '4px 10px',
    alignItems:          'baseline',
    minHeight:           '34px',
    padding:             '5px 0',
    borderTop:           '0.5px solid color-mix(in srgb, var(--color-border) 50%, transparent)',
  },
  historyDate: {
    gridRow:    '1 / 3',
    color:      'var(--color-muted)',
    fontSize:   '11px',
    fontWeight: 700,
  },
  historyMain: {
    minWidth:    0,
    color:       'var(--color-text)',
    fontSize:    '13px',
    fontWeight:  700,
    overflow:    'hidden',
    textOverflow:'ellipsis',
    whiteSpace:  'nowrap',
  },
  historyMeta: {
    color:     'var(--color-muted)',
    fontSize:  '11px',
  },
}
