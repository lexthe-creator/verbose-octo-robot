import { useState } from 'react'
import {
  getNutritionEntriesForDate,
  getNutritionTotals,
  useDay,
  useFitness,
  useNutrition,
} from '../../context/index.js'
import { useSettings } from '../../context/SettingsContext.jsx'
import {
  FEEL_OPTIONS,
  STATUS_LABELS,
  getReadiness,
  getTodayISO,
  getTodayTrainingPlan,
  loadDailyHealth,
  saveDailyHealth,
} from './healthUtils.js'
import { healthStyles as s } from './healthStyles.js'
import {
  PlannerActionButton,
  PlannerActionRow,
  PlannerRow,
} from '../../components/planner/PlannerPrimitives.jsx'

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

export default function HealthToday({
  onSectionChange,
  onStartWorkout,
  onLogWorkout,
}) {
  const today = getTodayISO()
  const { dayState, dayDispatch } = useDay()
  const { fitnessState, fitnessDispatch } = useFitness()
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

  function startMirroredWorkout(workoutToStart) {
    fitnessDispatch({ type: 'SET_WORKOUT_DAY_STATUS', payload: { date: today, status: 'in_progress' } })
    onStartWorkout?.(workoutToStart)
  }

  return (
    <main style={s.today}>
      <section style={s.plannerCard}>
        <p style={s.plannerTitle}>TODAY'S HEALTH PLAN</p>

        <PlannerGroup label="Morning">
          <PlannerRow label="sleep" value="add later" />
          <PlannerRow label="energy" value={energy ? `${energy}/5` : 'check in'} />
          <PlannerRow label="readiness" value={readiness === 'check in' ? 'pending' : readiness} detail={recoveryStatus === 'not checked' ? '' : recoveryStatus} />
          <PlannerRow label="motivation" value={daily.motivation ? `${daily.motivation}/5` : 'check in'} />
          <PlannerRow label="soreness" value={daily.soreness ? `${daily.soreness}/5` : 'check in'} />
          <CheckInButtons label="energy" value={energy} onChange={updateEnergy} />
          <CheckInButtons label="soreness" value={daily.soreness} onChange={value => updateDaily({ soreness: value })} />
          <CheckInButtons label="motivation" value={daily.motivation} onChange={value => updateDaily({ motivation: value })} />
        </PlannerGroup>

        <PlannerGroup label="Training">
          {fitnessState.program.configured ? (
            trainingPlan.scheduled ? (
              <>
                <PlannerRow label="workout" value={workout.title.toLowerCase()} />
                <PlannerRow label="status" value={STATUS_LABELS[trainingPlan.status].toLowerCase()} detail={`~${workout.durationEst} min`} />
                <PlannerActionRow>
                  {trainingPlan.status !== 'completed' && (
                    <PlannerActionButton onClick={() => startMirroredWorkout(workout)}>start workout</PlannerActionButton>
                  )}
                  <PlannerActionButton secondary onClick={() => onSectionChange('training')}>view training</PlannerActionButton>
                </PlannerActionRow>
              </>
            ) : (
              <>
                <PlannerRow label="today" value="open day" />
                <PlannerRow label="status" value="unscheduled" />
                <PlannerActionRow>
                  <PlannerActionButton secondary onClick={onLogWorkout}>log workout</PlannerActionButton>
                  <PlannerActionButton secondary onClick={() => onSectionChange('training')}>view plan</PlannerActionButton>
                </PlannerActionRow>
              </>
            )
          ) : (
            <>
              <PlannerRow label="today" value="open day" />
              <PlannerRow label="plan" value="add from Training" />
              <PlannerActionRow>
                <PlannerActionButton secondary onClick={() => onSectionChange('training')}>
                  view plan
                </PlannerActionButton>
              </PlannerActionRow>
            </>
          )}
        </PlannerGroup>

        <PlannerGroup label="Fuel">
          <PlannerRow label="protein" value={`${Math.round(totals.protein)}g`} />
          <PlannerRow label="calories" value={`${Math.round(totals.calories)}`} />
          <PlannerRow label="water" value={`${daily.water}/${hydrationTarget}`} />
          <PlannerActionRow>
            <PlannerActionButton secondary onClick={() => onSectionChange('nutrition')}>log meal</PlannerActionButton>
            <PlannerActionButton secondary onClick={() => updateDaily({ water: Math.min(hydrationTarget, daily.water + 1) })}>
              water
            </PlannerActionButton>
          </PlannerActionRow>
        </PlannerGroup>
      </section>
    </main>
  )
}
