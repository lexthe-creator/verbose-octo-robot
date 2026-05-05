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
  GYM:        'gym',
}

export const PHASES = {
  BASE:  'base',
  HYROX: 'hyrox',
  RACE:  'race',
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
  [PHASES.BASE]:  'Base Building',
  [PHASES.HYROX]: 'HYROX Prep',
  [PHASES.RACE]:  'Race Block',
}
