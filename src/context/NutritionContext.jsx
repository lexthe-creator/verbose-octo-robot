/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useReducer } from 'react'
import { getTodayISO } from '../utils/time.js'
import {
  MEAL_SLOTS,
  getMealSlotEntries,
  getLoggedMealSlotCount,
  getNutritionProgress,
  getNutritionStatusSymbol,
  getNutritionTotals,
  toNutritionNumber as toNumber,
} from '../utils/nutrition.js'

const NUTRITION_STORAGE_KEY = 'aiml_nutrition'
const SCHEMA_VERSION        = 1

export {
  MEAL_SLOTS,
  getMealSlotEntries,
  getLoggedMealSlotCount,
  getNutritionProgress,
  getNutritionStatusSymbol,
  getNutritionTotals,
}

export const DEFAULT_NUTRITION_TARGETS = {
  calories: 1955,
  protein:  145,
  carbs:    150,
  fat:      75,
}

const initialNutritionState = {
  targets:    DEFAULT_NUTRITION_TARGETS,
  dailyLogs:  {},
  savedFoods: [],
  savedMeals: [],
}

function createId(prefix) {
  return `${prefix}${Date.now()}${Math.random().toString(36).slice(2, 7)}`
}

function normalizeTargets(targets = {}) {
  return {
    calories: toNumber(targets.calories ?? DEFAULT_NUTRITION_TARGETS.calories),
    protein:  toNumber(targets.protein  ?? DEFAULT_NUTRITION_TARGETS.protein),
    carbs:    toNumber(targets.carbs    ?? DEFAULT_NUTRITION_TARGETS.carbs),
    fat:      toNumber(targets.fat      ?? DEFAULT_NUTRITION_TARGETS.fat),
  }
}

function normalizeEntry(entry = {}) {
  return {
    id:        entry.id ?? createId('food'),
    mealSlot:  MEAL_SLOTS.includes(entry.mealSlot) ? entry.mealSlot : 'breakfast',
    name:      String(entry.name ?? '').trim(),
    calories:  toNumber(entry.calories),
    protein:   toNumber(entry.protein),
    carbs:     toNumber(entry.carbs),
    fat:       toNumber(entry.fat),
    createdAt: entry.createdAt ?? new Date().toISOString(),
    updatedAt: entry.updatedAt ?? entry.createdAt ?? new Date().toISOString(),
  }
}

function normalizeFood(food = {}) {
  return {
    id:              food.id ?? createId('savedFood'),
    name:            String(food.name ?? '').trim(),
    calories:        toNumber(food.calories),
    protein:         toNumber(food.protein),
    carbs:           toNumber(food.carbs),
    fat:             toNumber(food.fat),
    defaultMealSlot: MEAL_SLOTS.includes(food.defaultMealSlot) ? food.defaultMealSlot : undefined,
  }
}

function normalizeMeal(meal = {}) {
  return {
    id:              meal.id ?? createId('savedMeal'),
    name:            String(meal.name ?? '').trim(),
    entries:         (meal.entries ?? []).map(normalizeFood).filter(food => food.name),
    defaultMealSlot: MEAL_SLOTS.includes(meal.defaultMealSlot) ? meal.defaultMealSlot : undefined,
  }
}

function normalizeDailyLogs(dailyLogs = {}) {
  return Object.fromEntries(
    Object.entries(dailyLogs).map(([date, log]) => [
      date,
      { entries: (log?.entries ?? []).map(normalizeEntry).filter(entry => entry.name) },
    ])
  )
}

function normalizeState(data = {}) {
  return {
    ...initialNutritionState,
    ...data,
    targets:    normalizeTargets(data.targets),
    dailyLogs:  normalizeDailyLogs(data.dailyLogs),
    savedFoods: (data.savedFoods ?? []).map(normalizeFood).filter(food => food.name),
    savedMeals: (data.savedMeals ?? []).map(normalizeMeal).filter(meal => meal.name && meal.entries.length),
  }
}

function getLogForDate(state, date) {
  return state.dailyLogs[date] ?? { entries: [] }
}

function upsertEntry(state, date, entry) {
  const log = getLogForDate(state, date)
  return {
    ...state,
    dailyLogs: {
      ...state.dailyLogs,
      [date]: {
        ...log,
        entries: [...log.entries, entry],
      },
    },
  }
}

export function nutritionReducer(state, action) {
  switch (action.type) {
    case 'ADD_FOOD_ENTRY': {
      const date = action.payload.date ?? getTodayISO()
      const now = new Date().toISOString()
      const entry = normalizeEntry({
        ...action.payload.entry,
        id:        createId('food'),
        createdAt: now,
        updatedAt: now,
      })
      if (!entry.name) return state
      return upsertEntry(state, date, entry)
    }

    case 'ADD_SAVED_FOOD_TO_LOG': {
      const date = action.payload.date ?? getTodayISO()
      const food = state.savedFoods.find(item => item.id === action.payload.foodId)
      if (!food) return state
      const now = new Date().toISOString()
      const entry = normalizeEntry({
        ...food,
        id:        createId('food'),
        mealSlot:  action.payload.mealSlot ?? food.defaultMealSlot ?? 'breakfast',
        createdAt: now,
        updatedAt: now,
      })
      return upsertEntry(state, date, entry)
    }

    case 'ADD_SAVED_MEAL_TO_LOG': {
      const date = action.payload.date ?? getTodayISO()
      const meal = state.savedMeals.find(item => item.id === action.payload.mealId)
      if (!meal) return state
      const now = new Date().toISOString()
      const entries = meal.entries.map(entry => normalizeEntry({
        ...entry,
        id:        createId('food'),
        mealSlot:  action.payload.mealSlot ?? meal.defaultMealSlot ?? 'breakfast',
        createdAt: now,
        updatedAt: now,
      }))
      const log = getLogForDate(state, date)
      return {
        ...state,
        dailyLogs: {
          ...state.dailyLogs,
          [date]: { ...log, entries: [...log.entries, ...entries] },
        },
      }
    }

    case 'UPDATE_FOOD_ENTRY': {
      const date = action.payload.date ?? getTodayISO()
      const log = getLogForDate(state, date)
      return {
        ...state,
        dailyLogs: {
          ...state.dailyLogs,
          [date]: {
            ...log,
            entries: log.entries.map(entry =>
              entry.id === action.payload.id
                ? normalizeEntry({ ...entry, ...action.payload.entry, id: entry.id, updatedAt: new Date().toISOString() })
                : entry
            ),
          },
        },
      }
    }

    case 'DELETE_FOOD_ENTRY': {
      const date = action.payload.date ?? getTodayISO()
      const log = getLogForDate(state, date)
      return {
        ...state,
        dailyLogs: {
          ...state.dailyLogs,
          [date]: { ...log, entries: log.entries.filter(entry => entry.id !== action.payload.id) },
        },
      }
    }

    case 'SAVE_FOOD': {
      const food = normalizeFood({ ...action.payload.food, id: createId('savedFood') })
      if (!food.name) return state
      return { ...state, savedFoods: [food, ...state.savedFoods] }
    }

    case 'DELETE_SAVED_FOOD':
      return { ...state, savedFoods: state.savedFoods.filter(food => food.id !== action.payload.id) }

    case 'SAVE_MEAL': {
      const meal = normalizeMeal({ ...action.payload.meal, id: createId('savedMeal') })
      if (!meal.name || meal.entries.length === 0) return state
      return { ...state, savedMeals: [meal, ...state.savedMeals] }
    }

    case 'DELETE_SAVED_MEAL':
      return { ...state, savedMeals: state.savedMeals.filter(meal => meal.id !== action.payload.id) }

    case 'UPDATE_TARGETS':
      return { ...state, targets: normalizeTargets({ ...state.targets, ...action.payload.targets }) }

    default:
      return state
  }
}

function loadNutritionState() {
  try {
    const raw = localStorage.getItem(NUTRITION_STORAGE_KEY)
    if (!raw) return initialNutritionState
    const stored = JSON.parse(raw)
    if (stored.version === SCHEMA_VERSION) return normalizeState(stored.data)
    return initialNutritionState
  } catch {
    return initialNutritionState
  }
}

function saveNutritionState(state) {
  try {
    localStorage.setItem(
      NUTRITION_STORAGE_KEY,
      JSON.stringify({ version: SCHEMA_VERSION, data: state })
    )
  } catch { /* quota exceeded */ }
}

export function getNutritionEntriesForDate(state, date = getTodayISO()) {
  return getLogForDate(state, date).entries
}

const NutritionContext = createContext(null)

export function NutritionProvider({ children }) {
  const [nutritionState, nutritionDispatch] = useReducer(nutritionReducer, undefined, loadNutritionState)

  useEffect(() => { saveNutritionState(nutritionState) }, [nutritionState])

  return (
    <NutritionContext.Provider value={{ nutritionState, nutritionDispatch }}>
      {children}
    </NutritionContext.Provider>
  )
}

export function useNutrition() {
  const ctx = useContext(NutritionContext)
  if (!ctx) throw new Error('useNutrition must be used inside <NutritionProvider>')
  return ctx
}
