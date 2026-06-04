import {
  getEquipmentNeededForSegment,
  getSegmentType,
  isSideBasedSegment,
} from './workoutDisplay.js'

const PLAYBACK_PHASES = ['warmup', 'main', 'finisher', 'cooldown']

function normalizePhase(section) {
  if (section === 'warmup') return 'warmup'
  if (section === 'finisher') return 'finisher'
  if (section === 'cooldown') return 'cooldown'
  return 'main'
}

function getInstruction(segment) {
  return segment.instruction ?? segment.detail ?? ''
}

function getMedia(segment, name) {
  return {
    kind: segment.media?.kind ?? 'placeholder',
    src: segment.media?.src ?? null,
    poster: segment.media?.poster ?? null,
    alt: segment.media?.alt ?? `${name} demonstration placeholder`,
  }
}

function getStepBase(segment, index, suffix = '') {
  const name = segment.name ?? 'Workout step'
  return {
    ...segment,
    id: segment.playbackId ?? segment.id ?? segment.exerciseId ?? `${index}_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}${suffix}`,
    phase: normalizePhase(segment.section),
    sourceSegmentIndex: index,
    instruction: getInstruction(segment),
    media: getMedia(segment, name),
    equipmentNeeded: getEquipmentNeededForSegment(segment),
  }
}

function parsePerSideSeconds(segment) {
  const text = `${segment.name ?? ''} ${getInstruction(segment)}`.toLowerCase()
  const match = text.match(/(\d+)\s*(seconds|second|secs|sec)\s+each/)
  if (match) return Number(match[1])
  const duration = Number(segment.duration) || 0
  if (duration > 0) return Math.max(1, Math.round(duration / 2))
  return 0
}

function getSideLabels(segment) {
  const text = `${segment.name ?? ''} ${getInstruction(segment)}`.toLowerCase()
  if (text.includes('direction')) return ['forward direction', 'reverse direction']
  if (text.includes('ankle')) return ['left ankle', 'right ankle']
  if (text.includes('calf')) return ['left calf', 'right calf']
  if (text.includes('arm')) return ['left arm', 'right arm']
  if (text.includes('leg')) return ['left leg', 'right leg']
  return ['left side', 'right side']
}

function shouldSplitTimedStep(segment) {
  if (getSegmentType(segment) !== 'timed') return false
  if (!isSideBasedSegment(segment)) return false
  const text = `${segment.name ?? ''} ${getInstruction(segment)}`.toLowerCase()
  return /\beach\b/.test(text)
}

function timedSteps(segment, index) {
  if (!shouldSplitTimedStep(segment)) {
    return [{ ...getStepBase(segment, index), type: 'timed' }]
  }

  const duration = parsePerSideSeconds(segment)
  const labels = getSideLabels(segment)
  return labels.map((label, sideIndex) => {
    const name = `${segment.name} - ${label}`
    return {
      ...getStepBase({ ...segment, name, duration }, index, `_side_${sideIndex + 1}`),
      type: 'timed',
      sideLabel: label,
      duration,
      instruction: getInstruction(segment).replace(/\s*[—-]?\s*\d+\s*(seconds|second|secs|sec)\s+each\s+\w+/i, '').trim() || getInstruction(segment),
      media: getMedia(segment, name),
    }
  })
}

function actionSteps(segment, index) {
  const type = getSegmentType(segment)
  if (type === 'timed') return timedSteps(segment, index)
  if (type === 'exercise') {
    return [{
      ...getStepBase(segment, index),
      type: 'sets_reps',
    }]
  }
  return [{
    ...getStepBase(segment, index),
    type: type ?? 'text',
  }]
}

function makeRestStep(previousStep, previousSegment, nextStep, restIndex) {
  const duration = previousSegment?.restSeconds ?? previousSegment?.restSec ?? 0
  if (!duration) return null
  return {
    id: `${previousStep.id}_rest_${restIndex}`,
    phase: previousStep.phase,
    type: 'rest',
    name: 'Rest',
    duration,
    instruction: nextStep?.name ? `Next: ${nextStep.name}` : '',
    sourceSegmentIndex: previousStep.sourceSegmentIndex,
    media: {
      kind: 'placeholder',
      src: null,
      poster: null,
      alt: 'Rest timer placeholder',
    },
    equipmentNeeded: [],
    afterStepId: previousStep.id,
  }
}

function nextActionInSamePhase(steps, startIndex, phase) {
  for (let i = startIndex + 1; i < steps.length; i++) {
    if (steps[i].phase !== phase) return false
    if (steps[i].type !== 'rest') return true
  }
  return false
}

function getNextActionInSamePhase(steps, startIndex, phase) {
  for (let i = startIndex + 1; i < steps.length; i++) {
    if (steps[i].phase !== phase) return null
    if (steps[i].type !== 'rest') return steps[i]
  }
  return null
}

export function normalizeWorkoutForPlayback(workout) {
  const rawSteps = (workout?.segments ?? []).flatMap((segment, index) => actionSteps(segment, index))
  const ordered = PLAYBACK_PHASES.flatMap(phase => rawSteps.filter(step => step.phase === phase))
  const steps = []

  ordered.forEach((step) => {
    steps.push(step)
    const source = workout.segments?.[step.sourceSegmentIndex]
    if (step.type === 'sets_reps' && nextActionInSamePhase(ordered, ordered.indexOf(step), step.phase)) {
      const nextStep = getNextActionInSamePhase(ordered, ordered.indexOf(step), step.phase)
      const rest = makeRestStep(step, source, nextStep, steps.length)
      if (rest) steps.push(rest)
    }
  })

  return steps
}

export function getPhaseSteps(steps, phase) {
  return steps.filter(step => step.phase === phase)
}

export function getPhaseProgress(steps, stepIndex) {
  const current = steps[stepIndex]
  if (!current) return { label: 'WORKOUT', current: 0, total: 0 }
  const phaseSteps = getPhaseSteps(steps, current.phase)
  const currentInPhase = phaseSteps.findIndex(step => step.id === current.id) + 1
  return {
    label: current.phase === 'warmup'
      ? 'WARM-UP'
      : current.phase === 'cooldown'
        ? 'COOL DOWN'
        : current.phase.toUpperCase(),
    current: currentInPhase,
    total: phaseSteps.length,
  }
}
