import { createContext, useContext, useReducer, useEffect } from 'react'
import { getTodayISO } from '../utils/time.js'

const FITNESS_STORAGE_KEY = 'aiml_fitness'
const SCHEMA_VERSION      = 2

/* ─── Initial state ───────────────────────────────────────────────────────── */
const initialFitnessState = {
  programStartDate: null,
  programEndDate:   null,
  workoutLog:       [],
  todayComplete:    false,
  focusSessions:    0,
  program: {
    type:       null,  // 'strength' | 'endurance' | 'general' | 'fat_loss'
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
  if (!saved.todayComplete) return false
  const log = saved.workoutLog ?? []
  if (log.length === 0) return false
  return log[log.length - 1].date === getTodayISO()
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
      focusSessions,
    }
    return { ...candidate, todayComplete: resolveTodayComplete(candidate) }
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
      // v1 → v2: add program, programConfig, sets[] on log entries
      if (stored.version === 1) {
        const migrated = migrateV1ToV2(stored.data)
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
      const { date, type, title, duration, feel, notes, exercises } = action.payload
      const entry = { date, type, title, duration, feel, notes, exercises: exercises ?? [], sets: [] }
      return {
        ...state,
        workoutLog:    [...state.workoutLog, entry],
        todayComplete: true,
      }
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
      return {
        ...state,
        program: { type, configured: true },
        programConfig: {
          trainingDays,
          dayTypes,
          goal,
          audioEnabled,
          weeklyDays: trainingDays.length,
        },
      }
    }

    case 'UPDATE_PROGRAM_CONFIG': {
      const { key, value } = action.payload
      return {
        ...state,
        programConfig: { ...state.programConfig, [key]: value },
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
