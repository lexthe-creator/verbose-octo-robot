import {
  EQUIPMENT_OPTIONS,
  WORKOUT_TYPES,
  getEquipmentProfileFromSettings,
} from '../../constants/fitness.js'
import { getPhase, getTypeForDay, getWeekDates, getWeekNumber } from '../../utils/fitness.js'
import { generateWorkout } from '../../utils/workoutGenerator.js'
import { getWorkoutSummary } from '../../utils/workoutDisplay.js'
import { getTodayISO } from '../../utils/time.js'

export { EQUIPMENT_OPTIONS, getEquipmentProfileFromSettings, getWeekDates, getTodayISO }

export const SECTIONS = ['today', 'training', 'nutrition', 'insights']

export const SECTION_LABELS = {
  today:     'Today',
  training:  'Training',
  nutrition: 'Nutrition',
  insights:  'Insights',
}

export const FEEL_OPTIONS = [
  { value: 1, label: 'low' },
  { value: 3, label: 'steady' },
  { value: 5, label: 'high' },
]

export const GOAL_OPTIONS = [
  { value: 'strength', label: 'Strength' },
  { value: 'running', label: 'Running' },
  { value: 'hybrid', label: 'Hybrid Training' },
  { value: 'mobility_recovery', label: 'Mobility / Recovery' },
  { value: 'general', label: 'General Fitness' },
  { value: 'custom', label: 'Custom' },
]

export const DAYS_OPTIONS = [3, 4, 5, 6]

export const TRAINING_DAYS_BY_COUNT = {
  3: ['mon', 'wed', 'fri'],
  4: ['mon', 'tue', 'thu', 'sat'],
  5: ['mon', 'tue', 'wed', 'fri', 'sat'],
  6: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
}

export const DAY_TYPE_DEFAULTS = {
  general:   ['run', 'upper', 'lower', 'full_body', 'mobility', 'run'],
  strength:  ['upper', 'lower', 'upper', 'lower', 'full_body', 'mobility'],
  running:   ['run', 'upper', 'run', 'lower', 'mobility', 'run'],
  hybrid:    ['run', 'full_body', 'run', 'upper', 'lower', 'mobility'],
  mobility_recovery: ['mobility', 'mobility', 'mobility', 'mobility', 'run', 'mobility'],
  custom:    ['full_body', 'run', 'mobility', 'upper', 'lower', 'custom'],
}

export const WORKOUT_LOG_TYPES = [
  { type: 'run', title: 'Run' },
  { type: 'strength', title: 'Strength' },
  { type: 'mobility', title: 'Mobility' },
  { type: 'other', title: 'Other' },
]

export const EFFORT_OPTIONS = ['Easy', 'Moderate', 'Hard']
export const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

export const STATUS_LABELS = {
  planned:     'Planned',
  in_progress: 'In progress',
  completed:   'Completed',
  skipped:     'Skipped',
}

const DAY_TYPE_TO_WORKOUT_TYPE = {
  upper:     WORKOUT_TYPES.STRENGTH_A,
  lower:     WORKOUT_TYPES.STRENGTH_B,
  full_body: WORKOUT_TYPES.STRENGTH_A,
  push:      WORKOUT_TYPES.STRENGTH_A,
  pull:      WORKOUT_TYPES.STRENGTH_B,
  strength:  WORKOUT_TYPES.STRENGTH_A,
  custom:    'custom',
  mobility:  WORKOUT_TYPES.STRETCH,
  run:       WORKOUT_TYPES.EASY_RUN,
  run_easy:  WORKOUT_TYPES.EASY_RUN,
  run_tempo: WORKOUT_TYPES.TEMPO_RUN,
  run_long:  WORKOUT_TYPES.LONG_RUN,
}

export function makeDailyHealthKey(date) {
  return `aiml_health_today_${date}`
}

export function loadDailyHealth(date) {
  try {
    const raw = localStorage.getItem(makeDailyHealthKey(date))
    if (!raw) return { water: 0, soreness: null, motivation: null }
    return { water: 0, soreness: null, motivation: null, ...JSON.parse(raw) }
  } catch {
    return { water: 0, soreness: null, motivation: null }
  }
}

export function saveDailyHealth(date, value) {
  try {
    localStorage.setItem(makeDailyHealthKey(date), JSON.stringify(value))
  } catch { /* local storage unavailable */ }
}

export function getTodayTrainingPlan(fitnessState, settingsState) {
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
  const workoutType = normalizeWorkoutDayType(configuredDayType) ?? normalizeWorkoutDayType(DAY_TYPE_TO_WORKOUT_TYPE[configuredDayType]) ?? normalizeWorkoutDayType(getTypeForDay(new Date().getDay()))
  const workout = buildHealthWorkout(workoutType, fitnessState, settingsState)
  const storedStatus = fitnessState.workoutDayStatus?.[today]?.status
  const status = storedStatus || (fitnessState.todayComplete ? 'completed' : 'planned')
  return { scheduled: true, workout, status }
}

export function formatWorkoutDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function formatSelectedDay(value) {
  return value.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toLowerCase()
}

export function formatTrainingHeaderDate(value) {
  return value.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function toLocalISO(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function normalizeWorkoutDayType(type) {
  if (!type || type === WORKOUT_TYPES.REST) return null
  if (type === 'custom') return 'custom'
  if (type === 'run') return 'run'
  if (type === WORKOUT_TYPES.EASY_RUN) return 'run_easy'
  if (type === WORKOUT_TYPES.TEMPO_RUN) return 'run_tempo'
  if (type === WORKOUT_TYPES.LONG_RUN) return 'run_long'
  if (type === WORKOUT_TYPES.STRENGTH_A) return 'upper'
  if (type === WORKOUT_TYPES.STRENGTH_B) return 'lower'
  if (type === WORKOUT_TYPES.STRETCH) return 'mobility'
  if (type === 'strength') return 'full_body'
  return type
}

export function weekInPhase(programStartDate) {
  const week = getWeekNumber(programStartDate)
  const position = ((week - 1) % 13) + 1
  if (position === 13) return 1
  return ((position - 1) % 4) + 1
}

export function buildHealthWorkout(dayType, fitnessState, settingsState) {
  if (dayType === 'custom') {
    return {
      id:          `${getTodayISO()}_custom`,
      date:        getTodayISO(),
      dayType,
      type:        dayType,
      title:       'Custom',
      subtitle:    'Custom workout',
      durationEst: 0,
      estimatedMinutes: 0,
      segments:    [],
    }
  }

  const workout = generateWorkout({
    dayType,
    equipment:   settingsState.gymAccess,
    phase:       getPhase(fitnessState.programStartDate),
    weekInPhase: weekInPhase(fitnessState.programStartDate),
    history:     fitnessState.workoutLog,
  })
  return {
    ...workout,
    type:        workout.dayType,
    subtitle:    `${workout.title} · ~${workout.estimatedMinutes} min`,
    durationEst: workout.estimatedMinutes,
  }
}

export function effortToFeel(effort) {
  if (effort === 'Hard') return 5
  if (effort === 'Easy') return 2
  return 3
}

export function workoutFocus(type, title = '') {
  if (type === 'strength' || type === 'upper' || type === 'full_body') return 'strength'
  if (type === 'run') return 'run'
  if (type === 'mobility') return 'mobility'
  if (type === WORKOUT_TYPES.STRENGTH_A) return 'push'
  if (type === WORKOUT_TYPES.STRENGTH_B) return 'lower'
  if (type === WORKOUT_TYPES.EASY_RUN || type === WORKOUT_TYPES.TEMPO_RUN || type === WORKOUT_TYPES.LONG_RUN) return 'run'
  if (type === WORKOUT_TYPES.STRETCH) return 'mobility'
  if (String(type).toLowerCase() === 'hyrox' || title.toLowerCase().includes('hyrox')) return 'hybrid training'
  if (title.toLowerCase().includes('full')) return 'full'
  if (title.toLowerCase().includes('mobility')) return 'mobility'
  if (title.toLowerCase().includes('run')) return 'run'
  return title.toLowerCase().split(' ')[0] || 'workout'
}

export function entryRpe(entry) {
  const explicit = entry.rpe ?? entry.rpeScore ?? entry.rpeTarget
  if (Number.isFinite(Number(explicit))) return Number(explicit)
  if (entry.effort === 'Easy') return 4
  if (entry.effort === 'Moderate') return 6
  if (entry.effort === 'Hard') return 8
  return null
}

export function workoutTypeLabel(workout) {
  const focus = getWorkoutSummary(workout).focus.toLowerCase()
  if (focus === 'run') return 'Run'
  if (focus === 'mobility') return 'Recovery'
  if (focus === 'strength') return 'Strength'
  if (focus === 'full') return 'Full'
  if (focus === 'push') return 'Upper'
  if (focus === 'lower') return 'Lower'
  return workout?.title?.replace(' + Core', '') ?? 'Workout'
}

export function getReadiness(energy, soreness) {
  if (!energy) return 'check in'
  if (energy >= 4 && (!soreness || soreness <= 3)) return 'ready'
  if (energy <= 2 || soreness >= 5) return 'recover'
  return 'steady'
}

export function buildDayTypes(goal, days) {
  const defaults = DAY_TYPE_DEFAULTS[goal] ?? DAY_TYPE_DEFAULTS.general
  return Object.fromEntries(days.map((day, index) => [day, defaults[index] ?? defaults[0]]))
}

export function getTrainingDayPlan(fitnessState, settingsState, date) {
  const iso = toLocalISO(date)
  const dayKey = DAY_KEYS[date.getDay()]
  const configuredDays = fitnessState.programConfig.trainingDays ?? []
  const hasConfiguredSchedule = configuredDays.length > 0
  const scheduled = hasConfiguredSchedule
    ? configuredDays.includes(dayKey)
    : getTypeForDay(date.getDay()) !== WORKOUT_TYPES.REST

  if (!scheduled) {
    return { iso, scheduled: false, workout: null, status: 'open' }
  }

  const configuredDayType = fitnessState.programConfig.dayTypes?.[dayKey]
  const workoutType = normalizeWorkoutDayType(configuredDayType) ?? normalizeWorkoutDayType(DAY_TYPE_TO_WORKOUT_TYPE[configuredDayType]) ?? normalizeWorkoutDayType(getTypeForDay(date.getDay()))
  const workout = buildHealthWorkout(workoutType, fitnessState, settingsState)
  const storedStatus = fitnessState.workoutDayStatus?.[iso]?.status
  const isToday = iso === getTodayISO()
  const status = storedStatus || (isToday && fitnessState.todayComplete ? 'completed' : 'planned')

  return { iso, scheduled: true, workout, status }
}
