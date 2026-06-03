import assert from 'node:assert/strict'
import test from 'node:test'
import { generateWorkout } from '../src/utils/workoutGenerator.js'
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

function mainText(workout) {
  return mainSegments(workout)
    .map(segment => `${segment.templateSlot} ${segment.name} ${segment.muscleGroup} ${(segment.muscles ?? []).join(' ')} ${segment.category}`)
    .join(' ')
    .toLowerCase()
}

test('push uses upper-body warmup and cooldown', () => {
  const workout = workoutFor('push')
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
  for (const dayType of ['run_easy', 'run_tempo', 'run_long']) {
    const workout = workoutFor(dayType)
    const warmup = segmentNames(workout, 'warmup').join(' ')
    const cooldown = segmentNames(workout, 'cooldown').join(' ')

    assert.match(warmup, /walk|jog/)
    assert.match(cooldown, /walk|jog/)
  }
})

test('+ Core workout titles include explicit core segments', () => {
  for (const dayType of ['push', 'lower', 'run_easy', 'run_tempo', 'run_long']) {
    const workout = workoutFor(dayType)

    assert.equal(workoutNeedsCore(workout), true)
    assert.equal(hasExplicitCore(workout), true)
  }
})

test('upper and push workouts follow movement templates with varied prescriptions', () => {
  for (const dayType of ['upper', 'push']) {
    const workout = generateWorkout({
      dayType,
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
  }
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

test('pull workouts follow vertical horizontal rear delt bicep core template', () => {
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

test('equipment preview derives expected equipment from generated workouts', () => {
  const workout = generateWorkout({
    dayType:     'push',
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
  const workout = workoutFor('push')
  const next = getNextUp(workout, 0)

  assert.equal(next.label, 'next up')
  assert.ok(next.name)
  assert.ok(next.detail || next.equipment.length > 0)
})

test('workout preview sections expose grouped prescriptions and equipment', () => {
  const workout = workoutFor('push')
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
    type:     'push',
    title:    'Push + Core',
    duration: 40,
    status:   'completed',
    rpe:      6,
  })

  assert.deepEqual(row, {
    date:       'Jun 2',
    focus:      'Push',
    duration:   '40 min',
    marker:     '●',
    rpe:        'RPE 6/10',
    rpeValue:   6,
    completion: 'completed',
  })
})
