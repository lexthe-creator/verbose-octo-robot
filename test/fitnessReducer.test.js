import assert from 'node:assert/strict'
import test from 'node:test'
import { logWorkout } from '../src/context/fitnessReducer.js'

const baseState = {
  programStartDate: null,
  programEndDate:   null,
  workoutLog:       [],
  workoutDayStatus: {},
  todayComplete:    false,
  focusSessions:    0,
  program:          { type: null, configured: false },
  programConfig:    {
    trainingDays: [],
    dayTypes:     {},
    goal:         null,
    audioEnabled: false,
    weeklyDays:   0,
  },
}

test('LOG_WORKOUT preserves completed set journal rows', () => {
  const sets = [
    {
      exercise:    'Push-ups',
      exerciseId:  'push_up',
      setNumber:   1,
      plannedReps: 12,
      reps:        10,
      weight:      20,
      rpe:         7,
      note:        'stopped short',
    },
  ]

  const next = logWorkout(baseState, {
    date:      '2026-06-02T12:00:00.000Z',
    type:      'push',
    title:     'Push',
    duration:  42,
    feel:      3,
    rpe:       6,
    notes:     'solid',
    exercises: [{ name: 'Push-ups', sets: 3, reps: 12, completed: 1 }],
    sets,
  })

  assert.deepEqual(next.workoutLog[0].sets, sets)
  assert.equal(next.workoutLog[0].sets[0].reps, 10)
  assert.equal(next.workoutLog[0].sets[0].plannedReps, 12)
  assert.equal(next.workoutLog[0].rpe, 6)
})
