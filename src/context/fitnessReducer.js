import { getTodayISO } from '../utils/time.js'

export function logWorkout(state, payload) {
  const { date, type, title, duration, feel, rpe, effort, notes, exercises, sets, status = 'completed', source = 'planned' } = payload
  const entryDate = String(date ?? getTodayISO()).slice(0, 10)
  const entry = {
    date: date ?? entryDate,
    type,
    title,
    duration,
    feel,
    rpe,
    effort,
    notes,
    status,
    source,
    exercises: exercises ?? [],
    sets: sets ?? [],
  }
  return {
    ...state,
    workoutLog:    [...state.workoutLog, entry],
    workoutDayStatus: {
      ...state.workoutDayStatus,
      [entryDate]: { status, updatedAt: new Date().toISOString() },
    },
    todayComplete: entryDate === getTodayISO() ? status === 'completed' : state.todayComplete,
  }
}
