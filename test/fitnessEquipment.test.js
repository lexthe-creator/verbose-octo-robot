import assert from 'node:assert/strict'
import test from 'node:test'
import {
  EQUIPMENT_OPTIONS,
  GYM_ACCESS,
  LEGACY_ACCESS_TO_EQUIPMENT,
  equipmentToGymAccess,
  getEquipmentProfileFromSettings,
} from '../src/constants/fitness.js'
import { generateWorkout } from '../src/utils/workoutGenerator.js'

test('legacy gym access maps to actual equipment profiles', () => {
  assert.deepEqual(LEGACY_ACCESS_TO_EQUIPMENT[GYM_ACCESS.BODYWEIGHT], [])
  assert.deepEqual(LEGACY_ACCESS_TO_EQUIPMENT[GYM_ACCESS.DUMBBELLS], ['dumbbells', 'resistance_bands'])
  assert.deepEqual(
    LEGACY_ACCESS_TO_EQUIPMENT[GYM_ACCESS.HOME_GYM],
    ['dumbbells', 'barbell', 'bench', 'squat_rack', 'cable_machine', 'resistance_bands', 'kettlebells']
  )
  assert.deepEqual(LEGACY_ACCESS_TO_EQUIPMENT[GYM_ACCESS.FULL_GYM], EQUIPMENT_OPTIONS.map(option => option.value))
  assert.deepEqual(LEGACY_ACCESS_TO_EQUIPMENT[GYM_ACCESS.GYM], EQUIPMENT_OPTIONS.map(option => option.value))
})

test('settings equipment profile prefers actual equipment and falls back to legacy gym access', () => {
  assert.deepEqual(getEquipmentProfileFromSettings({ equipmentProfile: ['dumbbells', 'rower'], gymAccess: 'bodyweight' }), ['dumbbells', 'rower'])
  assert.deepEqual(getEquipmentProfileFromSettings({ gymAccess: 'dumbbells' }), ['dumbbells', 'resistance_bands'])
  assert.deepEqual(getEquipmentProfileFromSettings({ gymAccess: 'bodyweight' }), [])
  assert.deepEqual(getEquipmentProfileFromSettings({ equipmentProfile: [] }), [])
})

test('actual equipment options do not expose legacy access tiers as primary choices', () => {
  const values = EQUIPMENT_OPTIONS.map(option => option.value)
  const labels = EQUIPMENT_OPTIONS.map(option => option.label).join(' ')

  assert.deepEqual(values, [
    'dumbbells',
    'barbell',
    'bench',
    'squat_rack',
    'cable_machine',
    'treadmill',
    'rower',
    'ski_erg',
    'sled',
    'resistance_bands',
    'kettlebells',
    'medicine_balls',
  ])
  assert.equal(values.includes('bodyweight'), false)
  assert.equal(values.includes('home_gym'), false)
  assert.equal(values.includes('full_gym'), false)
  assert.doesNotMatch(labels, /Full gym|Home gym|Bodyweight only|Dumbbells \+ bands/)
})

test('actual equipment derives safe gym access for generator compatibility', () => {
  assert.equal(equipmentToGymAccess([]), GYM_ACCESS.BODYWEIGHT)
  assert.equal(equipmentToGymAccess(['dumbbells', 'resistance_bands']), GYM_ACCESS.DUMBBELLS)
  assert.equal(equipmentToGymAccess(['barbell', 'bench']), GYM_ACCESS.HOME_GYM)
  assert.equal(equipmentToGymAccess(['treadmill', 'rower']), GYM_ACCESS.FULL_GYM)

  const compatibilityAccess = equipmentToGymAccess(['barbell', 'bench', 'squat_rack'])
  const workout = generateWorkout({
    dayType: 'upper',
    equipment: compatibilityAccess,
    phase: 'base',
    weekInPhase: 1,
    history: [],
  })

  assert.ok(workout.segments.length > 0)
  assert.equal(workout.segments.some(segment => segment.type === 'sets_reps'), true)
})
