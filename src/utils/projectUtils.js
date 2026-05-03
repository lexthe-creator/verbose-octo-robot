const MS_PER_DAY = 86_400_000

export function getProjectPace(project) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const endDate = new Date(project.endDate)
  endDate.setHours(0, 0, 0, 0)

  const startDate = new Date(project.startDate)
  startDate.setHours(0, 0, 0, 0)

  const tasksRemaining = project.tasks.filter(t => !t.done).length
  const daysElapsed    = Math.max(1, Math.ceil((today - startDate) / MS_PER_DAY))
  const tasksDone      = project.tasks.filter(t => t.done).length
  const avgDailyRate   = tasksDone > 0 ? tasksDone / daysElapsed : 1

  const daysToFinish   = Math.ceil(tasksRemaining / avgDailyRate)
  const projectedFinish = new Date(today)
  projectedFinish.setDate(today.getDate() + daysToFinish)

  const bufferEnd = new Date(endDate)
  bufferEnd.setDate(endDate.getDate() + (project.bufferDays ?? 7))

  let status
  if (projectedFinish <= endDate)        status = 'on_track'
  else if (projectedFinish <= bufferEnd) status = 'buffer'
  else                                   status = 'behind'

  const daysOver = status === 'behind'
    ? Math.ceil((projectedFinish - bufferEnd) / MS_PER_DAY)
    : 0

  return { status, projectedFinish, daysOver }
}
