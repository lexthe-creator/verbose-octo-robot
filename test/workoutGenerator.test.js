import assert from 'node:assert/strict'
import test from 'node:test'
import { generateWorkout } from '../src/utils/workoutGenerator.js'
import {
  getEquipmentNeededForWorkout,
  getJournalRow,
  getNextUp,
  getSideInstruction,
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
