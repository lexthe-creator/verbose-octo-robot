// Pure selector functions for FitnessContext state.
// All functions take plain data arguments — no context dependency.

// Returns up to 10 entries containing sets for exerciseName, newest first.
export function getExerciseHistory(workoutLog, exerciseName) {
  return workoutLog
    .filter(entry => entry.sets?.some(s => s.exercise === exerciseName))
    .map(entry => ({
      date: entry.date,
      sets: entry.sets.filter(s => s.exercise === exerciseName),
    }))
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 10)
}

// Returns the most recent { date, sets[] } for exerciseName, or null.
export function getLastPerformance(workoutLog, exerciseName) {
  const history = getExerciseHistory(workoutLog, exerciseName)
  return history.length > 0 ? history[0] : null
}

// Returns the day type for today based on programConfig, or 'rest'.
export function getTodayWorkoutType(programConfig) {
  const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
  const today    = DAY_KEYS[new Date().getDay()]
  if (!programConfig.trainingDays?.includes(today)) return 'rest'
  return programConfig.dayTypes?.[today] ?? 'rest'
}

// Returns 7 display objects for the target week (weekOffset 0 = current).
// Each: { day, label, type, isToday, isTraining }
export function getWeekStrip(programConfig, weekOffset = 0) {
  const DAY_KEYS   = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
  const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const dow       = today.getDay()
  const monOffset = dow === 0 ? -6 : 1 - dow
  const monday    = new Date(today)
  monday.setDate(today.getDate() + monOffset + weekOffset * 7)

  return DAY_KEYS.map((day, i) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    return {
      day,
      label:      DAY_LABELS[i],
      type:       (programConfig.trainingDays?.includes(day) && programConfig.dayTypes?.[day]) || 'rest',
      isToday:    date.getTime() === today.getTime(),
      isTraining: programConfig.trainingDays?.includes(day) ?? false,
    }
  })
}
