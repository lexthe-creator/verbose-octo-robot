import { createContext, useContext, useReducer, useEffect } from 'react'

const PLANNING_STORAGE_KEY = 'aiml_planning'
const SCHEMA_VERSION       = 1

/* ─── Reducer ─────────────────────────────────────────────────────────────── */
export function planningReducer(state, action) {
  switch (action.type) {
    case 'ADD_REFLECTION':
      return { ...state, reflectionLog: [...state.reflectionLog, action.payload] }

    case 'SET_WEEKLY_PRIORITIES':
      return { ...state, weeklyPriorities: action.payload.priorities }

    case 'ADD_GROCERY_ITEM': {
      const item = { id: `g${Date.now()}`, text: action.payload.text, done: false }
      return { ...state, groceryList: [...state.groceryList, item] }
    }

    case 'TOGGLE_GROCERY_ITEM':
      return {
        ...state,
        groceryList: state.groceryList.map(g =>
          g.id === action.payload.id ? { ...g, done: !g.done } : g
        ),
      }

    case 'DELETE_GROCERY_ITEM':
      return { ...state, groceryList: state.groceryList.filter(g => g.id !== action.payload.id) }

    default:
      return state
  }
}

/* ─── Persistence ─────────────────────────────────────────────────────────── */
const initialPlanningState = {
  reflectionLog:    [],
  weeklyPriorities: [],
  groceryList:      [],
}

function loadPlanningState() {
  try {
    const raw = localStorage.getItem(PLANNING_STORAGE_KEY)
    if (raw) {
      const stored = JSON.parse(raw)
      if (stored.version === SCHEMA_VERSION) return { ...initialPlanningState, ...stored.data }
      return initialPlanningState
    }
    // One-time migration from legacy aiml_state
    const legacyRaw = localStorage.getItem('aiml_state')
    if (legacyRaw) {
      try {
        const parsed = JSON.parse(legacyRaw)
        return {
          ...initialPlanningState,
          reflectionLog:    parsed.reflectionLog    ?? [],
          weeklyPriorities: parsed.weeklyPriorities ?? [],
          groceryList:      parsed.groceryList      ?? [],
        }
      } catch {
        return initialPlanningState
      }
    }
    return initialPlanningState
  } catch {
    return initialPlanningState
  }
}

function savePlanningState(state) {
  try {
    localStorage.setItem(
      PLANNING_STORAGE_KEY,
      JSON.stringify({ version: SCHEMA_VERSION, data: state })
    )
  } catch { /* quota exceeded */ }
}

/* ─── Context ─────────────────────────────────────────────────────────────── */
const PlanningContext = createContext(null)

export function PlanningProvider({ children }) {
  const [planningState, planningDispatch] = useReducer(planningReducer, undefined, loadPlanningState)

  useEffect(() => { savePlanningState(planningState) }, [planningState])

  return (
    <PlanningContext.Provider value={{ planningState, planningDispatch }}>
      {children}
    </PlanningContext.Provider>
  )
}

export function usePlanning() {
  const ctx = useContext(PlanningContext)
  if (!ctx) throw new Error('usePlanning must be used inside <PlanningProvider>')
  return ctx
}
