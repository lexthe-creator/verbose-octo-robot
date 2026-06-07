/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useReducer, useEffect } from 'react'
import { getTodayISO } from '../utils/time.js'
import { migrateFitnessStateToV3, normalizeFitnessProgramType } from '../utils/fitnessMigration.js'
import { logWorkout, setWorkoutDayStatus } from './fitnessReducer.js'

const FITNESS_STORAGE_KEY = 'aiml_fitness'
const SCHEMA_VERSION      = 3

/* ─── Initial state ───────────────────────────────────────────────────────── */
const initialFitnessState = {
  programStartDate: null,
  programEndDate:   null,
  workoutLog:       [],
  workoutDayStatus: {},
  todayComplete:    false,
  focusSessions:    0,
  program: {
    type:       null,
    configured: false,
  },
  programConfig: {
    trainingDays: [],     // ['mon','tue','thu','sat']
    dayTypes:     {},     // { mon: 'upper', tue: 'run_easy' }
    goal:         null,
    audioEnabled: false,
    weeklyDays:   0,
  },
}

/* ─── Day reset ───────────────────────────────────────────────────────────── */
function resolveTodayComplete(saved) {
  const todayStatus = saved.workoutDayStatus?.[getTodayISO()]?.status
  if (todayStatus === 'completed') return true
  if (todayStatus === 'skipped') return false
  if (!saved.todayComplete) return false
  const log = saved.workoutLog ?? []
  if (log.length === 0) return false
  return String(log[log.length - 1].date).slice(0, 10) === getTodayISO()
}

/* ─── Migration ───────────────────────────────────────────────────────────── */
function migrateV1ToV2(data) {
  return {
    ...data,
    program: { type: null, configured: false },
    programConfig: {
      trainingDays: [],
      dayTypes:     {},
      goal:         null,
      audioEnabled: false,
      weeklyDays:   0,
    },
    workoutLog: (data.workoutLog ?? []).map(entry => ({
      ...entry,
      sets: entry.sets ?? [],
    })),
    workoutDayStatus: {},
  }
}

function migrateFitnessFromLegacy(legacyRaw) {
  try {
    const parsed       = JSON.parse(legacyRaw)
    const fitness      = parsed.fitness ?? {}
    const focusSessions = parsed.focusSessions ?? 0
    const workoutLog   = (fitness.workoutLog ?? []).map(entry => ({
      ...entry,
      sets: entry.sets ?? [],
    }))
    const candidate = {
      ...initialFitnessState,
      programStartDate: fitness.programStartDate ?? null,
      programEndDate:   fitness.programEndDate   ?? null,
      workoutLog,
      workoutDayStatus: {},
      focusSessions,
    }
    const migrated = migrateFitnessStateToV3(candidate, initialFitnessState)
    return { ...migrated, todayComplete: resolveTodayComplete(migrated) }
  } catch {
    return initialFitnessState
  }
}

/* ─── Persistence ─────────────────────────────────────────────────────────── */
function loadFitnessState() {
  try {
    const raw = localStorage.getItem(FITNESS_STORAGE_KEY)
    if (raw) {
      const stored = JSON.parse(raw)
      if (stored.version === SCHEMA_VERSION) {
        const data = stored.data
        return {
          ...initialFitnessState,
          ...data,
          todayComplete: resolveTodayComplete(data),
        }
      }
      if (stored.version === 2) {
        const migrated = migrateFitnessStateToV3(stored.data, initialFitnessState)
        return {
          ...initialFitnessState,
          ...migrated,
          todayComplete: resolveTodayComplete(migrated),
        }
      }
      // v1 → v2: add program, programConfig, sets[] on log entries
      if (stored.version === 1) {
        const migrated = migrateFitnessStateToV3(migrateV1ToV2(stored.data), initialFitnessState)
        return {
          ...initialFitnessState,
          ...migrated,
          todayComplete: resolveTodayComplete(migrated),
        }
      }
      return initialFitnessState
    }

    // One-time migration from legacy aiml_state — do not delete aiml_state
    const legacyRaw = localStorage.getItem('aiml_state')
    if (legacyRaw) return migrateFitnessFromLegacy(legacyRaw)

    return initialFitnessState
  } catch {
    return initialFitnessState
  }
}

function saveFitnessState(state) {
  try {
    localStorage.setItem(
      FITNESS_STORAGE_KEY,
      JSON.stringify({ version: SCHEMA_VERSION, data: state })
    )
  } catch { /* quota exceeded */ }
}

/* ─── Reducer ─────────────────────────────────────────────────────────────── */
export function fitnessReducer(state, action) {
  switch (action.type) {

    case 'LOG_WORKOUT': {
      return logWorkout(state, action.payload)
    }

    case 'SET_WORKOUT_DAY_STATUS': {
      return setWorkoutDayStatus(state, action.payload)
    }

    case 'LOG_WORKOUT_SETS': {
      const { workoutId, sets } = action.payload
      return {
        ...state,
        workoutLog: state.workoutLog.map(entry =>
          entry.date === workoutId
            ? { ...entry, sets: [...(entry.sets ?? []), ...sets] }
            : entry
        ),
      }
    }

    case 'CONFIGURE_PROGRAM': {
      const { type, trainingDays, dayTypes, goal, audioEnabled } = action.payload
      const normalizedType = normalizeFitnessProgramType(type)
      return {
        ...state,
        program: { type: normalizedType, configured: true },
        programConfig: {
          trainingDays,
          dayTypes,
          goal: normalizeFitnessProgramType(goal ?? normalizedType),
          audioEnabled,
          weeklyDays: trainingDays.length,
        },
      }
    }

    case 'UPDATE_PROGRAM_CONFIG': {
      const { key, value } = action.payload
      const nextValue = key === 'goal' ? normalizeFitnessProgramType(value) : value
      return {
        ...state,
        programConfig: { ...state.programConfig, [key]: nextValue },
      }
    }

    case 'UPDATE_FITNESS': {
      const { key, value } = action.payload
      return { ...state, [key]: value }
    }

    case 'INCREMENT_FOCUS_SESSIONS':
      return { ...state, focusSessions: state.focusSessions + 1 }

    default:
      return state
  }
}

/* ─── Context ─────────────────────────────────────────────────────────────── */
const FitnessContext = createContext(null)

export function FitnessProvider({ children }) {
  const [fitnessState, fitnessDispatch] = useReducer(fitnessReducer, undefined, loadFitnessState)

  useEffect(() => { saveFitnessState(fitnessState) }, [fitnessState])

  return (
    <FitnessContext.Provider value={{ fitnessState, fitnessDispatch }}>
      {children}
    </FitnessContext.Provider>
  )
}

export function useFitness() {
  const ctx = useContext(FitnessContext)
  if (!ctx) throw new Error('useFitness must be used inside <FitnessProvider>')
  return ctx
}
