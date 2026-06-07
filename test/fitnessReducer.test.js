import assert from 'node:assert/strict'
import test from 'node:test'
import { logWorkout, setWorkoutDayStatus } from '../src/context/fitnessReducer.js'
import { migrateFitnessStateToV3 } from '../src/utils/fitnessMigration.js'
import { getTodayISO } from '../src/utils/time.js'

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

test('LOG_WORKOUT stores completed status and day status without losing history fields', () => {
  const today = getTodayISO()
  const next = logWorkout(baseState, {
    date:     `${today}T15:00:00.000Z`,
    type:     'upper',
    title:    'Upper Body',
    duration: 48,
    feel:     4,
    rpe:      8,
    notes:    'added load',
    sets: [
      {
        exercise:    'Bench Press',
        exerciseId:  'bench_press',
        setNumber:   2,
        plannedReps: 8,
        reps:        7,
        weight:      135,
        rpe:         8,
        note:        'last rep slow',
      },
    ],
  })

  assert.equal(next.workoutLog.length, 1)
  assert.equal(next.workoutLog[0].status, 'completed')
  assert.equal(next.workoutLog[0].source, 'planned')
  assert.equal(next.workoutDayStatus[today].status, 'completed')
  assert.equal(next.todayComplete, true)
  assert.deepEqual(next.workoutLog[0].sets[0], {
    exercise:    'Bench Press',
    exerciseId:  'bench_press',
    setNumber:   2,
    plannedReps: 8,
    reps:        7,
    weight:      135,
    rpe:         8,
    note:        'last rep slow',
  })
})

test('SET_WORKOUT_DAY_STATUS preserves skipped and in-progress status without wiping logs', () => {
  const today = getTodayISO()
  const logged = logWorkout(baseState, {
    date:     `${today}T15:00:00.000Z`,
    type:     'lower',
    title:    'Lower Body',
    duration: 44,
    feel:     3,
    rpe:      7,
    notes:    'steady',
    sets:     [{ exercise: 'Squat', setNumber: 1, plannedReps: 6, reps: 6, weight: 155, rpe: 7, note: '' }],
  })

  const skipped = setWorkoutDayStatus(logged, { date: today, status: 'skipped' })
  assert.equal(skipped.workoutDayStatus[today].status, 'skipped')
  assert.equal(skipped.todayComplete, false)
  assert.deepEqual(skipped.workoutLog, logged.workoutLog)

  const inProgress = setWorkoutDayStatus(skipped, { date: today, status: 'in_progress' })
  assert.equal(inProgress.workoutDayStatus[today].status, 'in_progress')
  assert.equal(inProgress.todayComplete, false)
  assert.deepEqual(inProgress.workoutLog, logged.workoutLog)
})

test('fitness schema migration maps legacy hyrox program values to hybrid without data loss', () => {
  const today = getTodayISO()
  const legacyState = {
    ...baseState,
    programStartDate: '2026-06-01',
    programEndDate:   '2026-09-01',
    workoutLog: [
      {
        date:     `${today}T15:00:00.000Z`,
        type:     'hyrox',
        title:    'Legacy training session',
        duration: 45,
        feel:     3,
        sets: [
          {
            exercise:    'Farmer Carry',
            exerciseId:  'farmer_carry',
            setNumber:   1,
            plannedReps: 40,
            reps:        40,
            weight:      50,
            rpe:         7,
            note:        'steady',
          },
        ],
      },
    ],
    workoutDayStatus: {
      [today]: { status: 'completed', updatedAt: `${today}T15:45:00.000Z` },
    },
    program: { type: 'hyrox', configured: true },
    programConfig: {
      trainingDays: ['mon', 'wed', 'fri'],
      dayTypes:     { mon: 'run', wed: 'full_body', fri: 'mobility' },
      goal:         'hyrox',
      audioEnabled: true,
      weeklyDays:   3,
    },
  }

  const migrated = migrateFitnessStateToV3(legacyState)

  assert.equal(migrated.program.type, 'hybrid')
  assert.equal(migrated.programConfig.goal, 'hybrid')
  assert.deepEqual(migrated.programConfig.trainingDays, legacyState.programConfig.trainingDays)
  assert.deepEqual(migrated.programConfig.dayTypes, legacyState.programConfig.dayTypes)
  assert.deepEqual(migrated.workoutLog, legacyState.workoutLog)
  assert.deepEqual(migrated.workoutDayStatus, legacyState.workoutDayStatus)
})

test('fitness workout history survives JSON persistence round trip', () => {
  const next = logWorkout(baseState, {
    date:     '2026-06-03T10:00:00.000Z',
    type:     'pull',
    title:    'Pull',
    duration: 50,
    feel:     4,
    rpe:      7,
    notes:    'keep grip wider',
    sets: [
      {
        exercise:    'Lat Pulldown',
        exerciseId:  'lat_pulldown',
        setNumber:   1,
        plannedReps: 10,
        reps:        9,
        weight:      80,
        rpe:         7,
        note:        'clean',
      },
    ],
  })

  const restored = JSON.parse(JSON.stringify({ version: 2, data: next })).data
  assert.equal(restored.workoutLog[0].type, next.workoutLog[0].type)
  assert.equal(restored.workoutLog[0].title, next.workoutLog[0].title)
  assert.equal(restored.workoutLog[0].duration, next.workoutLog[0].duration)
  assert.equal(restored.workoutLog[0].rpe, next.workoutLog[0].rpe)
  assert.equal(restored.workoutLog[0].notes, next.workoutLog[0].notes)
  assert.deepEqual(restored.workoutLog[0].sets, next.workoutLog[0].sets)
  assert.deepEqual(restored.workoutDayStatus, next.workoutDayStatus)
})
