export function normalizeFitnessProgramType(type) {
  if (type === 'hyrox') return 'hybrid'
  if (type === 'endurance') return 'running'
  if (type === 'fat_loss') return 'general'
  if (type === 'mobility' || type === 'recovery') return 'mobility_recovery'
  return type ?? null
}

export function migrateFitnessStateToV3(data, defaults = {}) {
  const programType = normalizeFitnessProgramType(data.program?.type)
  const goal = normalizeFitnessProgramType(data.programConfig?.goal)
  return {
    ...data,
    program: {
      ...(defaults.program ?? {}),
      ...(data.program ?? {}),
      type: programType,
    },
    programConfig: {
      ...(defaults.programConfig ?? {}),
      ...(data.programConfig ?? {}),
      goal,
    },
  }
}
