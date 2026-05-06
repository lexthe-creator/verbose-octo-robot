import { createContext, useContext, useReducer, useEffect } from 'react'
import { getTodayISO } from '../utils/time.js'

const FITNESS_STORAGE_KEY = 'aiml_fitness'
const SCHEMA_VERSION      = 1

/* ─── Initial state ───────────────────────────────────────────────────────── */
// fitness.weekNumber is intentionally omitted — it was a legacy stored field
// that was never updated by any action. All UI calls getWeekNumber(programStartDate).
// focusSessions is a lifetime counter — never resets.
const initialFitnessState = {
  programStartDate: null,
  programEndDate:   null,
  workoutLog:       [],
  todayComplete:    false,
  focusSessions:    0,
}

/* ─── Day reset ───────────────────────────────────────────────────────────── */
// todayComplete is true only if a workout was logged on today's date.
// Self-contained: no cross-context read needed.
function resolveTodayComplete(saved) {
  if (!saved.todayComplete) return false
  const log = saved.workoutLog ?? []
  if (log.length === 0) return false
  return log[log.length - 1].date === getTodayISO()
}

/* ─── Migration ───────────────────────────────────────────────────────────── */
function migrateFitnessFromLegacy(legacyRaw) {
  try {
    const parsed      = JSON.parse(legacyRaw)
    const fitness     = parsed.fitness ?? {}
    const focusSessions = parsed.focusSessions ?? 0
    const workoutLog  = fitness.workoutLog ?? []
    const candidate   = {
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
      const entry = { date, type, title, duration, feel, notes, exercises: exercises ?? [] }
      return {
        ...state,
        workoutLog:    [...state.workoutLog, entry],
        todayComplete: true,
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
