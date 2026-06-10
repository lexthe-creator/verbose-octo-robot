import { useState } from 'react'
import { useFitness } from '../../context/index.js'
import { useSettings } from '../../context/SettingsContext.jsx'
import {
  DAYS_OPTIONS,
  EFFORT_OPTIONS,
  EQUIPMENT_OPTIONS,
  GOAL_OPTIONS,
  TRAINING_DAYS_BY_COUNT,
  WORKOUT_LOG_TYPES,
  buildDayTypes,
  effortToFeel,
  getEquipmentProfileFromSettings,
  getTodayISO,
} from './healthUtils.js'
import { healthStyles as s } from './healthStyles.js'
import {
  PlannerActionButton,
  PlannerBottomSheet,
  PlannerOptionGrid,
  PlannerSectionHeader,
} from '../../components/planner/PlannerPrimitives.jsx'

export function PlanSetupSheet({ onClose }) {
  const { fitnessDispatch } = useFitness()
  const { settingsState, settingsDispatch } = useSettings()
  const [step, setStep] = useState(1)
  const [goal, setGoal] = useState('general')
  const [daysPerWeek, setDaysPerWeek] = useState(4)
  const [selectedEquipment, setSelectedEquipment] = useState(() => getEquipmentProfileFromSettings(settingsState))

  function finish() {
    const trainingDays = TRAINING_DAYS_BY_COUNT[daysPerWeek] ?? TRAINING_DAYS_BY_COUNT[4]
    settingsDispatch({ type: 'UPDATE_SETTING', payload: { key: 'equipmentProfile', value: selectedEquipment } })
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

  function toggleEquipment(equipmentValue) {
    setSelectedEquipment(current =>
      current.includes(equipmentValue)
        ? current.filter(e => e !== equipmentValue)
        : [...current, equipmentValue]
    )
  }

  return (
    <PlannerBottomSheet title="Create plan" onClose={onClose}>
      <div style={s.stepMeta}>Step {step} of 3</div>
      {step === 1 && (
        <div style={s.sheetBody}>
          <PlannerSectionHeader eyebrow="goal" title="What should training support?" />
          <PlannerOptionGrid options={GOAL_OPTIONS} value={goal} onChange={setGoal} />
        </div>
      )}
      {step === 2 && (
        <div style={s.sheetBody}>
          <PlannerSectionHeader eyebrow="days per week" title="Pick a realistic rhythm." />
          <PlannerOptionGrid options={DAYS_OPTIONS} value={daysPerWeek} onChange={setDaysPerWeek} />
        </div>
      )}
      {step === 3 && (
        <div style={s.sheetBody}>
          <PlannerSectionHeader eyebrow="equipment" title="What can workouts assume?" />
          <p style={s.equipmentHint}>Select all equipment available to you.</p>
          <div style={s.equipmentGrid}>
            {EQUIPMENT_OPTIONS.map(option => {
              const isSelected = selectedEquipment.includes(option.value)
              return (
                <button
                  key={option.value}
                  style={{ ...s.equipmentItem, ...(isSelected ? s.equipmentItemSelected : {}) }}
                  onClick={() => toggleEquipment(option.value)}
                  type="button"
                >
                  <span style={s.equipmentCheckbox}>{isSelected ? '✓' : ''}</span>
                  <span style={s.equipmentLabel}>{option.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
      <div style={s.sheetActions}>
        <PlannerActionButton secondary onClick={step === 1 ? onClose : () => setStep(value => value - 1)}>
          {step === 1 ? 'cancel' : 'back'}
        </PlannerActionButton>
        <PlannerActionButton onClick={step === 3 ? finish : () => setStep(value => value + 1)}>
          {step === 3 ? 'save plan' : 'next'}
        </PlannerActionButton>
      </div>
    </PlannerBottomSheet>
  )
}

function NumberField({ label, value, onChange, inputMode = 'numeric', min = '1', max }) {
  return (
    <label style={s.fieldStack}>
      <span style={s.fieldLabel}>{label}</span>
      <input
        style={s.lineInput}
        type="number"
        inputMode={inputMode}
        min={min}
        max={max}
        value={value}
        onChange={event => onChange(event.target.value)}
      />
    </label>
  )
}

function NotesField({ value, onChange }) {
  return (
    <label style={s.fieldStack}>
      <span style={s.fieldLabel}>Notes</span>
      <textarea
        style={s.textarea}
        value={value}
        onChange={event => onChange(event.target.value)}
        rows={3}
      />
    </label>
  )
}

export function LogWorkoutSheet({ onClose }) {
  const { fitnessDispatch } = useFitness()
  const [workoutType, setWorkoutType] = useState(WORKOUT_LOG_TYPES[0].type)
  const [duration, setDuration] = useState('30')
  const [distance, setDistance] = useState('')
  const [rpe, setRpe] = useState('6')
  const [effort, setEffort] = useState('Moderate')
  const [notes, setNotes] = useState('')
  const [exerciseRows, setExerciseRows] = useState([
    { id: 'ex1', exercise: '', sets: '', reps: '', weight: '' },
  ])

  function updateExerciseRow(id, patch) {
    setExerciseRows(rows => rows.map(row => row.id === id ? { ...row, ...patch } : row))
  }

  function addExerciseRow() {
    setExerciseRows(rows => [
      ...rows,
      { id: `ex${Date.now()}`, exercise: '', sets: '', reps: '', weight: '' },
    ])
  }

  function saveLog() {
    const option = WORKOUT_LOG_TYPES.find(item => item.type === workoutType) ?? WORKOUT_LOG_TYPES[0]
    const durationMin = Math.max(1, Number(duration) || 1)
    const rpeScore = Math.max(1, Math.min(10, Number(rpe) || 1))
    const strengthRows = exerciseRows
      .map(row => ({
        exercise: row.exercise.trim(),
        sets:     Math.max(0, Number(row.sets) || 0),
        reps:     Math.max(0, Number(row.reps) || 0),
        weight:   Math.max(0, Number(row.weight) || 0),
      }))
      .filter(row => row.exercise)
    const sets = strengthRows.flatMap(row =>
      Array.from({ length: row.sets || 1 }, (_, index) => ({
        exercise:    row.exercise,
        setNumber:   index + 1,
        plannedReps: row.reps,
        reps:        row.reps,
        weight:      row.weight,
        rpe:         rpeScore,
        note:        '',
      }))
    )
    const payload = {
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
    }

    if (workoutType === 'run') {
      payload.distance = Math.max(0, Number(distance) || 0)
      payload.rpe = rpeScore
      payload.feel = Math.max(1, Math.min(5, Math.round(rpeScore / 2)))
      payload.effort = rpeScore >= 8 ? 'Hard' : rpeScore <= 4 ? 'Easy' : 'Moderate'
    }

    if (workoutType === 'strength') {
      payload.rpe = rpeScore
      payload.sets = sets
      payload.exercises = strengthRows.map(row => ({
        name: row.exercise,
        sets: row.sets,
        reps: row.reps,
        weight: row.weight,
      }))
    }

    fitnessDispatch({
      type: 'LOG_WORKOUT',
      payload,
    })
    onClose()
  }

  return (
    <PlannerBottomSheet title="Log workout" onClose={onClose}>
      <div style={s.sheetBody}>
        <PlannerSectionHeader eyebrow="quick log" title="Capture the session." />
        <div>
          <p style={s.fieldLabel}>Workout type</p>
          <PlannerOptionGrid options={WORKOUT_LOG_TYPES.map(item => ({ value: item.type, label: item.title }))} value={workoutType} onChange={setWorkoutType} />
        </div>
        {workoutType === 'run' && (
          <>
            <NumberField label="distance" value={distance} onChange={setDistance} inputMode="decimal" />
            <NumberField label="duration" value={duration} onChange={setDuration} />
            <NumberField label="RPE" value={rpe} onChange={setRpe} min="1" max="10" />
          </>
        )}
        {workoutType === 'strength' && (
          <div style={s.exerciseList}>
            <p style={s.fieldLabel}>Exercise list</p>
            {exerciseRows.map(row => (
              <div key={row.id} style={s.exerciseRow}>
                <input
                  style={{ ...s.lineInput, ...s.exerciseNameInput }}
                  value={row.exercise}
                  onChange={event => updateExerciseRow(row.id, { exercise: event.target.value })}
                  placeholder="exercise"
                />
                <div style={s.exerciseGrid}>
                  <input
                    style={s.lineInput}
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value={row.sets}
                    onChange={event => updateExerciseRow(row.id, { sets: event.target.value })}
                    placeholder="sets"
                  />
                  <input
                    style={s.lineInput}
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value={row.reps}
                    onChange={event => updateExerciseRow(row.id, { reps: event.target.value })}
                    placeholder="reps"
                  />
                  <input
                    style={s.lineInput}
                    type="number"
                    inputMode="decimal"
                    min="0"
                    value={row.weight}
                    onChange={event => updateExerciseRow(row.id, { weight: event.target.value })}
                    placeholder="weight"
                  />
                </div>
              </div>
            ))}
            <PlannerActionButton secondary onClick={addExerciseRow}>add exercise</PlannerActionButton>
          </div>
        )}
        {workoutType === 'mobility' && (
          <>
            <NumberField label="duration" value={duration} onChange={setDuration} />
            <NotesField value={notes} onChange={setNotes} />
          </>
        )}
        {workoutType === 'other' && (
          <>
            <NumberField label="duration" value={duration} onChange={setDuration} />
            <div>
              <p style={s.fieldLabel}>Effort</p>
              <PlannerOptionGrid options={EFFORT_OPTIONS.map(item => ({ value: item, label: item }))} value={effort} onChange={setEffort} />
            </div>
            <NotesField value={notes} onChange={setNotes} />
          </>
        )}
      </div>
      <div style={s.sheetActions}>
        <PlannerActionButton secondary onClick={onClose}>cancel</PlannerActionButton>
        <PlannerActionButton onClick={saveLog}>save log</PlannerActionButton>
      </div>
    </PlannerBottomSheet>
  )
}
