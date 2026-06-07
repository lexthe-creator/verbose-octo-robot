import assert from 'node:assert/strict'
import test from 'node:test'
import { generateTrainingProgram, generateWorkout, getProgramStructure } from '../src/utils/workoutGenerator.js'
import { getPhaseProgress, normalizeWorkoutForPlayback } from '../src/utils/workoutPlayback.js'
import {
  getEquipmentNeededForWorkout,
  getJournalRow,
  getNextUp,
  getSideInstruction,
  getWorkoutPreviewSections,
  hasExplicitCore,
  workoutNeedsCore,
} from '../src/utils/workoutDisplay.js'

function segmentNames(workout, section) {
  return workout.segments
    .filter(segment => segment.section === section)
    .map(segment => segment.name.toLowerCase())
}

function workoutFor(dayType) {
  return generateWorkout({
    dayType,
    equipment:   'bodyweight',
    phase:       'base',
    weekInPhase: 1,
    history:     [],
  })
}

function mainSegments(workout) {
  return workout.segments.filter(segment => segment.section === 'main' && segment.type === 'sets_reps')
}

function allExerciseSegments(workout) {
  return workout.segments.filter(segment => segment.type === 'sets_reps')
}

function mainText(workout) {
  return mainSegments(workout)
    .map(segment => `${segment.templateSlot} ${segment.name} ${segment.muscleGroup} ${(segment.muscles ?? []).join(' ')} ${segment.category}`)
    .join(' ')
    .toLowerCase()
}

test('upper uses upper-body warmup and cooldown', () => {
  const workout = workoutFor('upper')
  const warmup = segmentNames(workout, 'warmup').join(' ')
  const cooldown = segmentNames(workout, 'cooldown').join(' ')

  assert.match(warmup, /arm|shoulder|scapular|band/)
  assert.match(cooldown, /chest|lat|shoulder|tricep/)
  assert.doesNotMatch(warmup, /leg swings|glute bridges|ankle circles/)
  assert.doesNotMatch(cooldown, /hamstring|hip flexor|quad|calf/)
})

test('lower uses lower-body warmup and cooldown', () => {
  const workout = workoutFor('lower')
  const warmup = segmentNames(workout, 'warmup').join(' ')
  const cooldown = segmentNames(workout, 'cooldown').join(' ')

  assert.match(warmup, /leg swings|hip circles|glute bridges/)
  assert.match(cooldown, /hamstring|hip flexor|quad|calf/)
})

test('full body uses full-body activation and recovery', () => {
  const workout = workoutFor('full_body')
  const warmup = segmentNames(workout, 'warmup').join(' ')
  const cooldown = segmentNames(workout, 'cooldown').join(' ')

  assert.match(warmup, /jumping jacks|inchworms|hip circles|arm circles/)
  assert.match(cooldown, /full body flow/)
})

test('run workouts use running prep and walking or jogging cooldown', () => {
  for (const dayType of ['run_easy', 'run_tempo', 'run_long', 'run_intervals', 'run_recovery']) {
    const workout = workoutFor(dayType)
    const warmup = segmentNames(workout, 'warmup').join(' ')
    const cooldown = segmentNames(workout, 'cooldown').join(' ')

    assert.match(warmup, /walk|jog/)
    assert.match(cooldown, /walk|jog/)
  }
})

test('training generator supports strength 3/4/5-day split structures', () => {
  assert.deepEqual(getProgramStructure('strength', 3).map(day => day.title), ['Full Body A', 'Full Body B', 'Full Body C'])
  assert.deepEqual(getProgramStructure('strength', 4).map(day => day.title), ['Upper A', 'Lower A', 'Upper B', 'Lower B'])
  assert.deepEqual(getProgramStructure('strength', 5).map(day => day.title), ['Upper A', 'Lower A', 'Full Body', 'Upper B', 'Lower B'])
})

test('training generator supports Hybrid Training 3/4/5-day split structures', () => {
  for (const days of [3, 4, 5]) {
    const plan = generateTrainingProgram({
      programType: 'hybrid',
      daysPerWeek: days,
      equipment: 'dumbbells',
      durationMinutes: 45,
    })
    assert.equal(plan.length, days)
    assert.ok(plan.every(day => ['upper', 'lower', 'full_body', 'run_easy', 'mobility'].includes(day.workout.dayType)))
    assert.ok(plan.some(day => day.workout.dayType === 'run_easy'))
  }
})

test('training generator supports General Fitness and Custom program structures', () => {
  assert.deepEqual(getProgramStructure('general', 3).map(day => day.dayType), ['full_body', 'run', 'mobility'])
  assert.deepEqual(getProgramStructure('custom', 4).map(day => day.dayType), ['custom', 'custom', 'custom', 'custom'])
  assert.deepEqual(getProgramStructure('hyrox', 3).map(day => day.dayType), ['full_body', 'run', 'full_body'])
})

test('training generator supports running 3/4/5-day split structures', () => {
  assert.deepEqual(getProgramStructure('running', 3).map(day => day.dayType), ['run', 'run', 'run'])
  assert.deepEqual(getProgramStructure('running', 4).map(day => day.dayType), ['run', 'run', 'run', 'run'])
  assert.deepEqual(getProgramStructure('running', 5).map(day => day.dayType), ['run', 'run', 'run', 'run', 'run'])
})

test('training generator supports mobility/recovery session generation', () => {
  const plan = generateTrainingProgram({
    programType: 'mobility_recovery',
    daysPerWeek: 4,
    durationMinutes: 30,
  })

  assert.equal(plan.length, 4)
  assert.ok(plan.every(day => day.workout.dayType === 'mobility'))
  assert.ok(plan.every(day => day.workout.segments.every(segment => segment.type !== 'sets_reps')))
  assert.ok(plan.flatMap(day => day.workout.segments).some(segment => /breath|child|mobility/i.test(segment.name)))
})

test('+ Core workout titles include explicit core segments', () => {
  for (const dayType of ['lower', 'run', 'run_easy', 'run_tempo', 'run_long']) {
    const workout = workoutFor(dayType)

    assert.equal(workoutNeedsCore(workout), true)
    assert.equal(hasExplicitCore(workout), true)
  }
})

test('upper workouts follow movement templates with varied prescriptions', () => {
  const workout = generateWorkout({
    dayType:     'upper',
    equipment:   'dumbbells',
    phase:       'base',
    weekInPhase: 1,
    history:     [],
  })
  const slots = mainSegments(workout).map(segment => segment.templateSlot)
  const prescriptions = new Set(mainSegments(workout).map(segment => `${segment.sets}x${segment.repRange ?? segment.reps}`))

  assert.ok(slots.includes('primary_chest'))
  assert.ok(slots.includes('vertical_push'))
  assert.ok(slots.includes('shoulder_isolation'))
  assert.ok(slots.includes('tricep_isolation'))
  assert.ok(slots.filter(slot => slot.startsWith('core')).length >= 2)
  assert.ok(mainSegments(workout).length >= 6)
  assert.ok(prescriptions.size > 2)
})

test('lower workouts follow squat hinge unilateral glute accessory core template', () => {
  const workout = generateWorkout({
    dayType:     'lower',
    equipment:   'dumbbells',
    phase:       'base',
    weekInPhase: 1,
    history:     [],
  })
  const slots = mainSegments(workout).map(segment => segment.templateSlot)

  assert.ok(slots.includes('primary_squat'))
  assert.ok(slots.includes('primary_hinge'))
  assert.ok(slots.includes('unilateral'))
  assert.ok(slots.includes('glute'))
  assert.ok(slots.filter(slot => slot.startsWith('core')).length >= 2)
  assert.ok(mainSegments(workout).length >= 6)
})

test('legacy pull workouts still follow vertical horizontal rear delt bicep core template', () => {
  const workout = generateWorkout({
    dayType:     'pull',
    equipment:   'dumbbells',
    phase:       'base',
    weekInPhase: 1,
    history:     [],
  })
  const text = mainText(workout)
  const slots = mainSegments(workout).map(segment => segment.templateSlot)

  assert.ok(slots.includes('vertical_pull'))
  assert.ok(slots.includes('horizontal_pull'))
  assert.ok(slots.includes('rear_delt'))
  assert.ok(slots.includes('bicep'))
  assert.ok(text.includes('core'))
  assert.ok(mainSegments(workout).length >= 6)
})

test('full body workouts follow squat hinge push pull carry core template', () => {
  const workout = generateWorkout({
    dayType:     'full_body',
    equipment:   'dumbbells',
    phase:       'base',
    weekInPhase: 1,
    history:     [],
  })
  const slots = mainSegments(workout).map(segment => segment.templateSlot)

  assert.ok(slots.includes('squat'))
  assert.ok(slots.includes('hinge'))
  assert.ok(slots.includes('push'))
  assert.ok(slots.includes('pull'))
  assert.ok(slots.includes('carry'))
  assert.ok(slots.includes('core'))
  assert.ok(mainSegments(workout).length >= 5)
})

test('home gym profile prioritizes barbell and cable programming', () => {
  const workout = generateWorkout({
    dayType: 'upper',
    equipment: 'home_gym',
    phase: 'base',
    weekInPhase: 1,
    history: [],
    durationMinutes: 60,
  })
  const names = allExerciseSegments(workout).map(segment => segment.name.toLowerCase()).join(' ')
  const equipment = getEquipmentNeededForWorkout(workout)

  assert.match(names, /barbell|cable|overhead press|bench press/)
  assert.ok(equipment.includes('barbell') || equipment.includes('cable machine'))
})

test('duration adjusts strength volume without dropping core', () => {
  const short = generateWorkout({
    dayType: 'full_body',
    equipment: 'dumbbells',
    phase: 'base',
    weekInPhase: 1,
    history: [],
    durationMinutes: 30,
  })
  const full = generateWorkout({
    dayType: 'full_body',
    equipment: 'dumbbells',
    phase: 'base',
    weekInPhase: 1,
    history: [],
    durationMinutes: 60,
  })

  assert.ok(allExerciseSegments(short).length <= 5)
  assert.ok(allExerciseSegments(full).length >= 6)
  assert.equal(hasExplicitCore(short), true)
  assert.equal(hasExplicitCore(full), true)
})

test('generated workouts avoid duplicate exercises', () => {
  for (const dayType of ['upper', 'lower', 'full_body', 'run', 'mobility', 'custom']) {
    const workout = generateWorkout({
      dayType,
      equipment: 'full_gym',
      phase: 'base',
      weekInPhase: 1,
      history: [],
      durationMinutes: 60,
    })
    const ids = allExerciseSegments(workout).map(segment => segment.exerciseId)
    assert.equal(ids.length, new Set(ids).size)
  }
})

test('equipment preview derives expected equipment from generated workouts', () => {
  const workout = generateWorkout({
    dayType:     'upper',
    equipment:   'gym',
    phase:       'base',
    weekInPhase: 1,
    history:     [],
  })

  const equipment = getEquipmentNeededForWorkout(workout)
  assert.ok(equipment.includes('barbell') || equipment.includes('cable machine'))
  assert.ok(equipment.includes('bench') || equipment.includes('rack') || equipment.includes('cable machine'))
})

test('next up exposes name, prescription, and equipment', () => {
  const workout = workoutFor('upper')
  const next = getNextUp(workout, 0)

  assert.equal(next.label, 'next up')
  assert.ok(next.name)
  assert.ok(next.detail || next.equipment.length > 0)
})

test('playback phase labels use user-facing phase-local progress', () => {
  const workout = {
    segments: [
      { section: 'warmup', type: 'timed', name: 'Leg Swings', duration: 60, instruction: '30 seconds each leg' },
      { section: 'main', type: 'sets_reps', name: 'Squat', sets: 3, reps: 8, restSeconds: 90 },
      { section: 'main', type: 'sets_reps', name: 'Row', sets: 3, reps: 10 },
      { section: 'cooldown', type: 'timed', name: 'Lat Stretch', duration: 60, instruction: '30 seconds each side' },
    ],
  }
  const steps = normalizeWorkoutForPlayback(workout)

  assert.deepEqual(getPhaseProgress(steps, 1), { label: 'Warm-Up', current: 2, total: 2 })
  assert.deepEqual(getPhaseProgress(steps, 2), { label: 'Main', current: 1, total: 3 })
  assert.deepEqual(getPhaseProgress(steps, 5), { label: 'Cool Down', current: 1, total: 2 })
})

test('rest steps expose actual next exercise instruction', () => {
  const steps = normalizeWorkoutForPlayback({
    segments: [
      { section: 'main', type: 'sets_reps', name: 'Squat', sets: 3, reps: 8, restSeconds: 90 },
      { section: 'main', type: 'sets_reps', name: 'Row', sets: 3, reps: 10 },
    ],
  })
  const rest = steps.find(step => step.type === 'rest')

  assert.ok(rest)
  assert.equal(rest.instruction, 'Next: Row')
})

test('generated exercise segments expose cues and equipment-compatible substitutions', () => {
  const workout = generateWorkout({
    dayType: 'upper',
    equipment: 'dumbbells',
    phase: 'base',
    weekInPhase: 1,
    history: [],
  })
  const segment = allExerciseSegments(workout).find(item => item.substitutions?.length > 0)

  assert.ok(segment)
  assert.ok(segment.cues.length > 0)
  assert.ok(segment.substitutions.every(option => ['dumbbells', 'bodyweight'].includes(option.equipment)))
  assert.ok(segment.substitutions.every(option => option.media?.kind === 'placeholder'))
})

test('workout preview sections expose grouped prescriptions and equipment', () => {
  const workout = workoutFor('upper')
  const sections = getWorkoutPreviewSections(workout)
  const main = sections.find(section => section.section === 'main')

  assert.deepEqual(sections.map(section => section.section), ['warmup', 'main', 'cooldown'])
  assert.ok(main)
  assert.ok(main.rows.some(row => row.prescription.includes('x')))
  assert.ok(main.rows.some(row => row.equipment.length > 0))
})

test('side-based movements expose each-side instruction', () => {
  const workout = generateWorkout({
    dayType:     'lower',
    equipment:   'bodyweight',
    phase:       'base',
    weekInPhase: 1,
    history:     [],
  })
  const sideSegment = workout.segments.find(segment => getSideInstruction(segment))

  assert.ok(sideSegment)
  assert.equal(getSideInstruction(sideSegment), 'each side')
})

test('journal row formats date focus duration marker and RPE', () => {
  const row = getJournalRow({
    date:     '2026-06-02T12:00:00.000Z',
    type:     'strength',
    title:    'Strength',
    duration: 40,
    status:   'completed',
    rpe:      6,
  })

  assert.deepEqual(row, {
    date:       'Jun 2',
    focus:      'Strength',
    duration:   '40 min',
    marker:     '●',
    rpe:        'RPE 6/10',
    rpeValue:   6,
    completion: 'completed',
  })
})
