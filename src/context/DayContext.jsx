import { createContext, useContext, useReducer, useEffect } from 'react'

const DAY_STORAGE_KEY = 'aiml_day'
const SCHEMA_VERSION  = 1

/* ─── Initial state ───────────────────────────────────────────────────────── */
// workout shape mirrors AppContext exactly: { type, duration, pace, time, confirmed }
// task shape mirrors AppContext exactly: includes dueTime (not in spec — flagged)
const initialDayState = {
  dayLockedAt:      null,
  energyLevel:      null,
  workoutConfirmed: false,
  confirmedTasks:   [],
  confirmedMeals:   [],

  tasks: [
    { id: 't1', text: 'Review project proposal', done: false, dueTime: '10:00', scheduledTime: null, priority: 0 },
    { id: 't2', text: 'Reply to team messages',  done: false, dueTime: '12:00', scheduledTime: null, priority: 1 },
    { id: 't3', text: 'Evening walk 30 min',      done: false, dueTime: '18:30', scheduledTime: null, priority: 2 },
  ],

  meals: {
    breakfast: { label: 'Breakfast', startTime: '07:00', endTime: '09:00', lateAfter: '09:00', eaten: false },
    lunch:     { label: 'Lunch',     startTime: '12:00', endTime: '14:00', lateAfter: '14:00', eaten: false },
    snack:     { label: 'Snack',     startTime: '15:00', endTime: '17:00', lateAfter: '17:00', eaten: false },
    dinner:    { label: 'Dinner',    startTime: '19:00', endTime: '21:00', lateAfter: '21:00', eaten: false },
  },

  workout: {
    type:      'Tempo Run',
    duration:  '45 min',
    pace:      '5:20 / km',
    time:      '18:30',
    confirmed: false,
  },
}

/* ─── Day reset ───────────────────────────────────────────────────────────── */
// Mirrors AppContext loadState() exactly: only scheduledFor:'tomorrow' tasks survive;
// falls back to initialDayState.tasks if none carried.
// NOTE: spec describes a different reset (reset done for all tasks) — flagged as
// a future behavior change, not implemented here.
function applyDayReset(saved) {
  const carried = (saved.tasks || [])
    .filter(t => t.scheduledFor === 'tomorrow')
    .map(({ scheduledFor: _sf, done: _done, ...rest }) => ({ ...rest, done: false }))

  return {
    ...initialDayState,
    // Preserve meal time windows across day reset; reset eaten only
    meals: Object.fromEntries(
      Object.entries(saved.meals || initialDayState.meals).map(([slot, meal]) => [
        slot,
        { ...meal, eaten: false },
      ])
    ),
    tasks: carried.length > 0 ? carried : initialDayState.tasks,
  }
}

/* ─── Migration helper ────────────────────────────────────────────────────── */
function migrateDayFromLegacy(legacy) {
  const dayFields = {
    dayLockedAt:      legacy.dayLockedAt      ?? null,
    energyLevel:      legacy.energyLevel      ?? null,
    workoutConfirmed: legacy.workoutConfirmed ?? false,
    confirmedTasks:   legacy.confirmedTasks   ?? [],
    confirmedMeals:   legacy.confirmedMeals   ?? [],
    tasks:            legacy.tasks            ?? initialDayState.tasks,
    meals:            { ...initialDayState.meals, ...(legacy.meals ?? {}) },
    workout:          { ...initialDayState.workout, ...(legacy.workout ?? {}) },
  }

  if (dayFields.dayLockedAt) {
    const lockedDate = new Date(dayFields.dayLockedAt).toDateString()
    if (lockedDate !== new Date().toDateString()) return applyDayReset(dayFields)
  }

  return { ...initialDayState, ...dayFields }
}

/* ─── Persistence ─────────────────────────────────────────────────────────── */
function loadDayState() {
  try {
    const raw = localStorage.getItem(DAY_STORAGE_KEY)
    if (raw) {
      const stored = JSON.parse(raw)
      if (stored.version === SCHEMA_VERSION) {
        const data = stored.data
        if (data.dayLockedAt) {
          const lockedDate = new Date(data.dayLockedAt).toDateString()
          if (lockedDate !== new Date().toDateString()) return applyDayReset(data)
        }
        return { ...initialDayState, ...data }
      }
      return initialDayState
    }

    // One-time migration from legacy aiml_state
    const legacyRaw = localStorage.getItem('aiml_state')
    if (legacyRaw) {
      return migrateDayFromLegacy(JSON.parse(legacyRaw))
    }

    return initialDayState
  } catch {
    return initialDayState
  }
}

function saveDayState(state) {
  try {
    localStorage.setItem(DAY_STORAGE_KEY, JSON.stringify({ version: SCHEMA_VERSION, data: state }))
  } catch { /* quota exceeded */ }
}

/* ─── Reducer ─────────────────────────────────────────────────────────────── */
export function dayReducer(state, action) {
  switch (action.type) {

    case 'SET_ENERGY':
      return { ...state, energyLevel: action.payload }

    case 'CONFIRM_TASK': {
      const id = action.payload
      if (state.confirmedTasks.includes(id)) return state
      return { ...state, confirmedTasks: [...state.confirmedTasks, id] }
    }

    case 'CONFIRM_MEAL': {
      const { slot, startTime, endTime } = action.payload
      if (state.confirmedMeals.includes(slot)) return state
      return {
        ...state,
        confirmedMeals: [...state.confirmedMeals, slot],
        meals: {
          ...state.meals,
          [slot]: { ...state.meals[slot], startTime, endTime, lateAfter: endTime },
        },
      }
    }

    case 'CONFIRM_WORKOUT':
      return {
        ...state,
        workoutConfirmed: true,
        ...(action.payload ? { workout: { ...state.workout, ...action.payload } } : {}),
      }

    case 'LOCK_DAY':
      return { ...state, dayLockedAt: new Date().toISOString() }

    case 'TOGGLE_TASK': {
      const tasks = state.tasks.map(t =>
        t.id === action.payload ? { ...t, done: !t.done } : t
      )
      return { ...state, tasks }
    }

    case 'ADD_TASK': {
      const { text } = action.payload
      const newTask = { id: Date.now(), text, done: false, scheduledTime: null, priority: state.tasks.length }
      return { ...state, tasks: [...state.tasks, newTask] }
    }

    case 'REORDER_TASKS': {
      const { orderedIds } = action.payload
      const idIndex = Object.fromEntries(orderedIds.map((id, i) => [String(id), i]))
      const tasks = state.tasks.map(t => ({
        ...t,
        priority: idIndex[String(t.id)] ?? t.priority,
      }))
      return { ...state, tasks }
    }

    case 'UPDATE_TASK_TIME': {
      const { taskId, time } = action.payload
      const tasks = state.tasks.map(t =>
        t.id === taskId ? { ...t, scheduledTime: time } : t
      )
      return { ...state, tasks }
    }

    case 'MARK_MEAL_EATEN': {
      const slot = action.payload
      return {
        ...state,
        meals: { ...state.meals, [slot]: { ...state.meals[slot], eaten: !state.meals[slot].eaten } },
      }
    }

    case 'UPDATE_MEAL_WINDOW': {
      const { slot, startTime, endTime } = action.payload
      return {
        ...state,
        meals: {
          ...state.meals,
          [slot]: { ...state.meals[slot], startTime, endTime, lateAfter: endTime },
        },
      }
    }

    case 'SET_TOMORROW_TASKS': {
      const incoming = action.payload.tasks || []
      const existingIds = new Set(state.tasks.map(t => String(t.id)))

      const updated = state.tasks.map(t => {
        const match = incoming.find(it => String(it.id) === String(t.id))
        return match ? { ...t, scheduledFor: 'tomorrow' } : t
      })

      const newTasks = incoming
        .filter(it => !existingIds.has(String(it.id)))
        .map(it => ({
          id:            it.id ?? `t${Date.now()}_${Math.random().toString(36).slice(2)}`,
          text:          it.text,
          done:          false,
          scheduledTime: null,
          scheduledFor:  'tomorrow',
        }))

      return { ...state, tasks: [...updated, ...newTasks] }
    }

    default:
      return state
  }
}

/* ─── Context ─────────────────────────────────────────────────────────────── */
const DayContext = createContext(null)

export function DayProvider({ children }) {
  const [dayState, dayDispatch] = useReducer(dayReducer, undefined, loadDayState)

  useEffect(() => { saveDayState(dayState) }, [dayState])

  function updateTaskTime(taskId, time) {
    dayDispatch({ type: 'UPDATE_TASK_TIME', payload: { taskId, time } })
  }

  function updateMealWindow(slot, startTime, endTime) {
    dayDispatch({ type: 'UPDATE_MEAL_WINDOW', payload: { slot, startTime, endTime } })
  }

  return (
    <DayContext.Provider value={{ dayState, dayDispatch, updateTaskTime, updateMealWindow }}>
      {children}
    </DayContext.Provider>
  )
}

export function useDay() {
  const ctx = useContext(DayContext)
  if (!ctx) throw new Error('useDay must be used inside <DayProvider>')
  return ctx
}
