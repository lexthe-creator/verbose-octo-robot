// Phase schedule for the 26-week training block:
//   weeks 1–16  → 'base'   (base building)
//   weeks 17–24 → 'hyrox'  (HYROX prep)
//   weeks 25–26 → 'race'   (race block)
export function getPhase(weekNumber) {
  if (weekNumber >= 25) return 'race'
  if (weekNumber >= 17) return 'hyrox'
  return 'base'
}

export const PHASE_LABELS = {
  base:  'Base Building',
  hyrox: 'HYROX Prep',
  race:  'Race Block',
}
