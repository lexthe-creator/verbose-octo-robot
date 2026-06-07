export const WORKOUT_TYPES = {
  REST:       'rest',
  EASY_RUN:   'easy_run',
  TEMPO_RUN:  'tempo_run',
  LONG_RUN:   'long_run',
  STRENGTH_A: 'strength_a',
  STRENGTH_B: 'strength_b',
  STRETCH:    'stretch',
}

export const GYM_ACCESS = {
  BODYWEIGHT: 'bodyweight',
  DUMBBELLS:  'dumbbells',
  HOME_GYM:   'home_gym',
  FULL_GYM:   'full_gym',
  GYM:        'gym',
}

export const EQUIPMENT_OPTIONS = [
  { value: 'dumbbells', label: 'Dumbbells' },
  { value: 'barbell', label: 'Barbell' },
  { value: 'bench', label: 'Bench' },
  { value: 'squat_rack', label: 'Squat rack' },
  { value: 'cable_machine', label: 'Cable machine' },
  { value: 'treadmill', label: 'Treadmill' },
  { value: 'rower', label: 'Rower' },
  { value: 'ski_erg', label: 'Ski erg' },
  { value: 'sled', label: 'Sled' },
  { value: 'resistance_bands', label: 'Resistance bands' },
  { value: 'kettlebells', label: 'Kettlebells' },
  { value: 'medicine_balls', label: 'Medicine balls' },
]

const EQUIPMENT_VALUES = new Set(EQUIPMENT_OPTIONS.map(option => option.value))

export const LEGACY_ACCESS_TO_EQUIPMENT = {
  [GYM_ACCESS.BODYWEIGHT]: [],
  [GYM_ACCESS.DUMBBELLS]: ['dumbbells', 'resistance_bands'],
  [GYM_ACCESS.HOME_GYM]: [
    'dumbbells',
    'barbell',
    'bench',
    'squat_rack',
    'cable_machine',
    'resistance_bands',
    'kettlebells',
  ],
  [GYM_ACCESS.FULL_GYM]: EQUIPMENT_OPTIONS.map(option => option.value),
  [GYM_ACCESS.GYM]: EQUIPMENT_OPTIONS.map(option => option.value),
}

export function normalizeEquipmentProfile(equipmentProfile = []) {
  if (!Array.isArray(equipmentProfile)) return []
  return [...new Set(equipmentProfile.filter(item => EQUIPMENT_VALUES.has(item)))]
}

export function equipmentToGymAccess(selectedEquipment = []) {
  const equipment = normalizeEquipmentProfile(selectedEquipment)
  if (equipment.length === 0) return GYM_ACCESS.BODYWEIGHT

  const fullGymSignals = ['treadmill', 'rower', 'ski_erg', 'sled']
  if (fullGymSignals.some(item => equipment.includes(item))) {
    return GYM_ACCESS.FULL_GYM
  }

  const homeGymSignals = ['barbell', 'bench', 'squat_rack', 'cable_machine', 'kettlebells', 'medicine_balls']
  if (homeGymSignals.some(item => equipment.includes(item))) {
    return GYM_ACCESS.HOME_GYM
  }

  if (equipment.includes('dumbbells') || equipment.includes('resistance_bands')) {
    return GYM_ACCESS.DUMBBELLS
  }

  return GYM_ACCESS.BODYWEIGHT
}

export function getEquipmentProfileFromSettings(settingsState = {}) {
  const savedProfile = normalizeEquipmentProfile(settingsState.equipmentProfile)
  if (savedProfile.length > 0 || Array.isArray(settingsState.equipmentProfile)) {
    return savedProfile
  }
  return LEGACY_ACCESS_TO_EQUIPMENT[settingsState.gymAccess] ?? LEGACY_ACCESS_TO_EQUIPMENT[GYM_ACCESS.BODYWEIGHT]
}

export function getEquipmentLabel(value) {
  return EQUIPMENT_OPTIONS.find(option => option.value === value)?.label ?? value
}

export function formatEquipmentProfileLabels(equipmentProfile = []) {
  const normalized = normalizeEquipmentProfile(equipmentProfile)
  if (normalized.length === 0) return 'Bodyweight / no equipment selected'
  return normalized.map(getEquipmentLabel).join(', ')
}

export const PHASES = {
  BASE:   'base',
  BUILD:  'build',
  PEAK:   'peak',
  DELOAD: 'deload',
}

export const WORKOUT_LABEL = {
  [WORKOUT_TYPES.EASY_RUN]:   'Run',
  [WORKOUT_TYPES.TEMPO_RUN]:  'Run',
  [WORKOUT_TYPES.LONG_RUN]:   'Run',
  [WORKOUT_TYPES.STRENGTH_A]: 'Strength',
  [WORKOUT_TYPES.STRENGTH_B]: 'Strength',
  [WORKOUT_TYPES.STRETCH]:    'Stretch',
  [WORKOUT_TYPES.REST]:       'Rest',
}

export const PHASE_LABELS = {
  [PHASES.BASE]:   'Base',
  [PHASES.BUILD]:  'Build',
  [PHASES.PEAK]:   'Peak',
  [PHASES.DELOAD]: 'Deload',
}
