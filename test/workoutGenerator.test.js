import assert from 'node:assert/strict'
import test from 'node:test'
import { generateWorkout } from '../src/utils/workoutGenerator.js'

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
