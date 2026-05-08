import { EXERCISES }    from '../data/exercises.js'
import { RUN_SEGMENTS } from '../data/runSegments.js'
import { getPhaseConfig, getDayTypeLabel } from './fitness.js'
import { getLastPerformance } from './fitnessSelectors.js'
import { getTodayISO } from './time.js'

// ─── Internal PRNG ────────────────────────────────────────────────────────────
// Deterministic shuffle: same date string → same seed → same workout all day.
// Seed changes daily so exercise selection rotates without Math.random().

function hashString(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

function seededRand(seed) {
  let s = seed >>> 0
  return function next() {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0
    return s / 0x100000000
  }
}

function shuffleWithSeed(arr, seed) {
  const out  = arr.slice()
  const rand = seededRand(seed)
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

// ─── 1. getExercisePool ───────────────────────────────────────────────────────

export function getExercisePool(dayType, equipment) {
  const category = EXERCISES[dayType]
  if (!category) return []
  return category[equipment] ?? category.bodyweight ?? []
}

// ─── 2. selectExercises ───────────────────────────────────────────────────────
// workoutLog: raw fitnessState.workoutLog[]. May be empty or null.
// Note: spec describes history as "output of getExerciseHistory()" but that
// function operates on one exercise at a time. The raw workoutLog is needed
// to check recency across the entire pool — see FLAG 1 in the step audit.

export function selectExercises(pool, count, workoutLog) {
  if (!pool || pool.length === 0) return []

  const today    = getTodayISO()
  const seedBase = hashString(today)

  if (pool.length <= count) {
    return shuffleWithSeed(pool, seedBase)
  }

  const log = workoutLog ?? []

  const recent7  = new Set()
  const recent14 = new Set()
  for (const entry of log) {
    if (!entry.date) continue
    const diffDays = (new Date(today) - new Date(entry.date)) / (1000 * 60 * 60 * 24)
    for (const set of (entry.sets ?? [])) {
      if (!set.exercise) continue
      if (diffDays <= 7)  recent7.add(set.exercise)
      if (diffDays <= 14) recent14.add(set.exercise)
    }
  }

  // Priority 1: exclude exercises done in the last 7 days
  const eligible  = pool.filter(ex => !recent7.has(ex.id))
  // Priority 2: among eligible, prefer not done in last 14 days
  const preferred = shuffleWithSeed(eligible.filter(ex => !recent14.has(ex.id)), seedBase)
  const moderate  = shuffleWithSeed(eligible.filter(ex =>  recent14.has(ex.id)), seedBase + 1)
  // Fallback: if eligible count is short, pull from the 7-day pool
  const fallback  = shuffleWithSeed(pool.filter(ex => recent7.has(ex.id)),       seedBase + 2)

  return [...preferred, ...moderate, ...fallback].slice(0, count)
}

// ─── 3. getLoadSuggestion ─────────────────────────────────────────────────────

function roundTo2_5(n) {
  return Math.round(n / 2.5) * 2.5
}

function formatWeight(n) {
  return n % 1 === 0 ? `${n}lb` : `${n.toFixed(1)}lb`
}

export function getLoadSuggestion(exercise, lastPerformance, phaseConfig) {
  const firstSession = {
    suggestion: `Start with a weight you could do ${(phaseConfig?.reps ?? 0) + 4} times`,
    basis: 'first session',
  }

  if (!lastPerformance) return firstSession

  const weightedSets = (lastPerformance.sets ?? []).filter(s => s.weight > 0)
  if (weightedSets.length === 0) return firstSession

  const avgWeight  = weightedSets.reduce((sum, s) => sum + s.weight, 0) / weightedSets.length
  const targetReps = phaseConfig?.reps ?? 0
  const allRepsHit = (lastPerformance.sets ?? []).every(s => (s.reps ?? 0) >= targetReps)

  if (allRepsHit) {
    const increased = roundTo2_5(avgWeight * 1.025)
    return {
      suggestion: `Try ${formatWeight(increased)} — increase from last time`,
      basis: 'progressive overload +2.5%',
    }
  }
  return {
    suggestion: `Stay at ${formatWeight(roundTo2_5(avgWeight))} — hit all reps first`,
    basis: 'consolidate before progressing',
  }
}

// ─── Warmup / cooldown data for strength workouts ─────────────────────────────

const UPPER_WARMUP = [
  { section: 'warmup', type: 'timed', name: 'Arm Circles',       duration: 60, instruction: 'Large slow circles — 30 seconds each direction' },
  { section: 'warmup', type: 'timed', name: 'Band Pull-aparts',  duration: 60, instruction: 'Squeeze shoulder blades together at full extension' },
  { section: 'warmup', type: 'timed', name: 'Shoulder Rolls',    duration: 30, instruction: 'Roll forward and backward, slow and controlled' },
  { section: 'warmup', type: 'timed', name: 'Scapular Push-ups', duration: 60, instruction: 'Arms straight, move only shoulder blades — 10 reps' },
]

const UPPER_COOLDOWN = [
  { section: 'cooldown', type: 'timed', name: 'Chest Stretch',  duration: 45, instruction: 'Arms back, open chest — hold steady' },
  { section: 'cooldown', type: 'timed', name: 'Lat Stretch',    duration: 45, instruction: 'Arm overhead, lean away — 45 seconds each side' },
  { section: 'cooldown', type: 'timed', name: 'Shoulder Cross', duration: 60, instruction: 'Pull arm across chest — 30 seconds each side' },
  { section: 'cooldown', type: 'timed', name: 'Tricep Stretch', duration: 60, instruction: 'Arm overhead, elbow bent — 30 seconds each side' },
]

const STRENGTH_WARMUPS = {
  upper:     UPPER_WARMUP,
  push:      UPPER_WARMUP,
  lower: [
    { section: 'warmup', type: 'timed', name: 'Leg Swings',    duration: 60, instruction: 'Front-to-back then side-to-side — 30 seconds each leg' },
    { section: 'warmup', type: 'timed', name: 'Hip Circles',   duration: 60, instruction: 'Large hip circles — 30 seconds each direction' },
    { section: 'warmup', type: 'timed', name: 'Glute Bridges', duration: 60, instruction: 'Drive hips up, hold 2 seconds at the top — 10 reps' },
    { section: 'warmup', type: 'timed', name: 'Ankle Circles', duration: 30, instruction: 'Slow circles each direction — 15 seconds each ankle' },
  ],
  full_body: [
    { section: 'warmup', type: 'timed', name: 'Jumping Jacks', duration: 60, instruction: 'Steady pace to elevate heart rate' },
    { section: 'warmup', type: 'timed', name: 'Inchworms',     duration: 60, instruction: 'Walk hands out to plank, walk feet back to hands — 5 reps' },
    { section: 'warmup', type: 'timed', name: 'Hip Circles',   duration: 60, instruction: 'Large circles — 30 seconds each direction' },
    { section: 'warmup', type: 'timed', name: 'Arm Circles',   duration: 30, instruction: 'Large slow circles — 15 seconds each direction' },
  ],
  pull: [
    { section: 'warmup', type: 'timed', name: 'Band Pull-aparts',  duration: 60, instruction: 'Squeeze shoulder blades at full extension — 15 reps' },
    { section: 'warmup', type: 'timed', name: 'Dead Hangs',        duration: 20, instruction: 'Hang from a bar with a relaxed grip — breathe slowly' },
    { section: 'warmup', type: 'timed', name: 'Scapular Pull-ups', duration: 40, instruction: 'Arms straight, depress shoulder blades — 10 reps' },
    { section: 'warmup', type: 'timed', name: 'Shoulder Circles',  duration: 30, instruction: 'Large slow circles — 15 seconds each direction' },
  ],
}

const STRENGTH_COOLDOWNS = {
  upper:     UPPER_COOLDOWN,
  push:      UPPER_COOLDOWN,
  lower: [
    { section: 'cooldown', type: 'timed', name: 'Hamstring Stretch',  duration: 120, instruction: 'Seated or standing — 60 seconds each leg' },
    { section: 'cooldown', type: 'timed', name: 'Hip Flexor Stretch', duration: 120, instruction: 'Low lunge position — 60 seconds each side' },
    { section: 'cooldown', type: 'timed', name: 'Quad Stretch',       duration: 90,  instruction: 'Standing or lying — 45 seconds each leg' },
    { section: 'cooldown', type: 'timed', name: 'Calf Stretch',       duration: 60,  instruction: 'Heel down, lean forward — 30 seconds each calf' },
  ],
  full_body: [
    { section: 'cooldown', type: 'timed', name: 'Full Body Flow', duration: 180, instruction: 'Move slowly through a full range of motion — breathe deeply' },
  ],
  pull: [
    { section: 'cooldown', type: 'timed', name: 'Lat Stretch',       duration: 120, instruction: 'Arm overhead, lean away — 60 seconds each side' },
    { section: 'cooldown', type: 'timed', name: 'Bicep Stretch',     duration: 60,  instruction: 'Palm out, arm extended — 30 seconds each arm' },
    { section: 'cooldown', type: 'timed', name: 'Rear Delt Stretch', duration: 60,  instruction: 'Pull arm across chest — 30 seconds each side' },
  ],
}

// ─── 4. buildStrengthWorkout ──────────────────────────────────────────────────

const REST_SECONDS = { peak: 180, build: 120 }
const DEFAULT_REST = 90

export function buildStrengthWorkout(dayType, equipment, phase, weekInPhase, history) {
  const phaseConfig = getPhaseConfig(phase, weekInPhase)
  const pool        = getExercisePool(dayType, equipment)
  const exercises   = selectExercises(pool, 4, history ?? [])
  const warmup      = STRENGTH_WARMUPS[dayType]   ?? UPPER_WARMUP
  const cooldown    = STRENGTH_COOLDOWNS[dayType] ?? UPPER_COOLDOWN
  const restSeconds = REST_SECONDS[phase] ?? DEFAULT_REST

  const mainSegments = exercises.map(exercise => ({
    section:        'main',
    type:           'sets_reps',
    exerciseId:     exercise.id,
    name:           exercise.name,
    sets:           phaseConfig.sets,
    reps:           phaseConfig.reps,
    rpeTarget:      phaseConfig.rpeTarget,
    intensity:      phaseConfig.intensity,
    cues:           exercise.cues,
    loadSuggestion: getLoadSuggestion(
      exercise,
      getLastPerformance(history ?? [], exercise.id),
      phaseConfig,
    ),
    restSeconds,
    muscleGroup:    exercise.muscleGroup,
  }))

  return [...warmup, ...mainSegments, ...cooldown]
}

// ─── Run duration tables (seconds) ───────────────────────────────────────────
// Index 0–3 = week 1–4 within the phase. Deload value is constant across weeks.

const RUN_DURATIONS = {
  run_easy: {
    base:   [1200, 1200, 1500, 1500],
    build:  [1500, 1800, 1800, 2100],
    peak:   [2100, 2100, 2400, 2400],
    deload: [900,  900,  900,  900 ],
  },
  run_tempo: {
    base:   [600,  600,  900,  900 ],
    build:  [900,  1200, 1200, 1500],
    peak:   [1500, 1800, 1800, 2100],
    deload: [600,  600,  600,  600 ],
  },
  run_long: {
    base:   [1800, 2100, 2400, 2700],
    build:  [2700, 3000, 3300, 3600],
    peak:   [3600, 3900, 4200, 4500],
    deload: [1800, 1800, 1800, 1800],
  },
}

function runDuration(runType, phase, weekInPhase) {
  const wk       = Math.max(0, Math.min(3, (weekInPhase ?? 1) - 1))
  const phaseRow = RUN_DURATIONS[runType]?.[phase] ?? RUN_DURATIONS[runType]?.base ?? []
  return phaseRow[wk] ?? phaseRow[0] ?? 1200
}

// Spreads RUN_SEGMENTS data into the new segment shape.
// Explicit section/type/audioId always win over anything in segmentData.
function makeRunSegment(segmentData, section, audioId) {
  return { ...segmentData, section, type: 'timed', audioId }
}

// ─── 5. buildRunWorkout ───────────────────────────────────────────────────────

export function buildRunWorkout(runType, phase, weekInPhase) {
  const mainDur = runDuration(runType, phase, weekInPhase)

  switch (runType) {
    case 'run_easy':
      return [
        makeRunSegment(RUN_SEGMENTS.warmup.walk,    'warmup',   'warmup_walk'),
        { ...makeRunSegment(RUN_SEGMENTS.main.easy,  'main',    'main_easy'),  duration: mainDur },
        makeRunSegment(RUN_SEGMENTS.cooldown.walk,  'cooldown', 'cooldown_walk'),
      ]

    case 'run_tempo':
      return [
        makeRunSegment(RUN_SEGMENTS.warmup.easy_jog,    'warmup',   'warmup_jog'),
        { ...makeRunSegment(RUN_SEGMENTS.main.tempo,     'main',    'main_tempo'),    duration: mainDur },
        { ...makeRunSegment(RUN_SEGMENTS.main.recovery,  'main',    'main_recovery'), duration: 120 },
        { ...makeRunSegment(RUN_SEGMENTS.main.tempo,     'main',    'main_tempo'),    duration: mainDur },
        makeRunSegment(RUN_SEGMENTS.cooldown.walk,       'cooldown', 'cooldown_walk'),
      ]

    case 'run_long':
      return [
        makeRunSegment(RUN_SEGMENTS.warmup.walk,    'warmup',   'warmup_walk'),
        { ...makeRunSegment(RUN_SEGMENTS.main.long,  'main',    'main_long'),  duration: mainDur },
        makeRunSegment(RUN_SEGMENTS.cooldown.walk,  'cooldown', 'cooldown_walk'),
      ]

    default:
      return []
  }
}

// ─── Mobility fixed structure ─────────────────────────────────────────────────

const MOBILITY_FIXED = [
  { section: 'main', type: 'timed', name: 'Breathwork',          duration: 180, instruction: 'Slow nasal breathing — 4 counts in, 4 out. Relax completely.' },
  { section: 'main', type: 'timed', name: 'Joint Mobility Flow', duration: 300, instruction: 'Move every major joint through full range — neck, shoulders, hips, knees, ankles.' },
  { section: 'main', type: 'timed', name: 'Pigeon Pose',         duration: 180, instruction: '90 seconds each side. Square hips to the floor and breathe deeply.' },
  { section: 'main', type: 'timed', name: '90-90 Hip Stretch',   duration: 180, instruction: '90 seconds each side. Keep both hips in contact with the floor.' },
  { section: 'main', type: 'timed', name: 'Thoracic Rotation',   duration: 60,  instruction: 'Side-lying. Stack hips, rotate upper body only — 10 each side.' },
  { section: 'main', type: 'timed', name: 'Cat Cow',             duration: 60,  instruction: 'Slow breath-linked movement. Inhale to cow, exhale to cat.' },
  { section: 'main', type: 'timed', name: 'Hamstring Stretch',   duration: 60,  instruction: 'Seated. Hinge from hips, not waist — 30 seconds each leg.' },
  { section: 'main', type: 'timed', name: 'Hip Flexor Stretch',  duration: 60,  instruction: 'Low lunge. Tuck pelvis slightly to feel the stretch — hold each side.' },
  { section: 'main', type: 'timed', name: 'Quad Stretch',        duration: 60,  instruction: 'Standing or side-lying — 30 seconds each leg.' },
  { section: 'main', type: 'timed', name: 'Chest Opener',        duration: 60,  instruction: 'Arms behind, open chest. Hold or move slowly.' },
  { section: 'main', type: 'timed', name: 'Lat Stretch',         duration: 60,  instruction: 'Arm overhead, lean away — 30 seconds each side.' },
]

const MOBILITY_CLOSING = {
  section: 'main', type: 'timed', name: "Child's Pose",
  duration: 120, instruction: "Sink hips back and breathe deeply. Let everything go.",
}

// ─── 6. buildMobilityWorkout ──────────────────────────────────────────────────

export function buildMobilityWorkout(durationMinutes) {
  const targetSeconds = (durationMinutes ?? 30) * 60
  const fixedSeconds  = MOBILITY_FIXED.reduce((sum, s) => sum + s.duration, 0) + MOBILITY_CLOSING.duration

  const filler = []
  if (targetSeconds > fixedSeconds) {
    const remaining  = targetSeconds - fixedSeconds
    const usedNames  = new Set(MOBILITY_FIXED.map(s => s.name.toLowerCase()))
    const candidates = (EXERCISES.mobility?.all ?? []).filter(
      ex => !usedNames.has(ex.name.toLowerCase())
    )
    let filled = 0
    for (const ex of candidates) {
      if (filled >= remaining) break
      const dur = ex.baseReps ?? 30
      filler.push({
        section:     'main',
        type:        'timed',
        name:        ex.name,
        duration:    dur,
        instruction: ex.cues?.[0] ?? '',
      })
      filled += dur
    }
  }

  return [...MOBILITY_FIXED, ...filler, MOBILITY_CLOSING]
}

// ─── Internal duration estimator ─────────────────────────────────────────────

function computeEstimatedMinutes(segments) {
  let totalSeconds = 0
  for (const seg of segments) {
    if (seg.type === 'timed') {
      totalSeconds += seg.duration ?? 0
    } else if (seg.type === 'sets_reps') {
      totalSeconds += (seg.sets ?? 0) * (seg.reps ?? 0) * 4 + (seg.restSeconds ?? 0)
    }
  }
  const minutes = Math.ceil(totalSeconds / 60)
  return Math.ceil(minutes / 5) * 5
}

// ─── 7. generateWorkout ───────────────────────────────────────────────────────

export function generateWorkout(config) {
  const {
    dayType,
    equipment        = 'bodyweight',
    phase            = 'base',
    weekInPhase      = 1,
    history          = [],
    mobilityDuration = 30,
  } = config ?? {}

  const date  = getTodayISO()
  const id    = `${date}_${dayType ?? 'rest'}`
  const title = getDayTypeLabel(dayType ?? 'rest')
  const base  = { id, date, dayType, title, phase, weekInPhase }

  if (!dayType || dayType === 'rest') {
    return { ...base, title: 'Rest Day', estimatedMinutes: 0, segments: [] }
  }

  let segments

  if (dayType === 'run_easy' || dayType === 'run_tempo' || dayType === 'run_long') {
    segments = buildRunWorkout(dayType, phase, weekInPhase)
  } else if (['upper', 'lower', 'full_body', 'push', 'pull'].includes(dayType)) {
    segments = buildStrengthWorkout(dayType, equipment, phase, weekInPhase, history)
  } else if (dayType === 'mobility') {
    segments = buildMobilityWorkout(mobilityDuration)
  } else {
    return { ...base, title: 'Rest Day', estimatedMinutes: 0, segments: [] }
  }

  return { ...base, estimatedMinutes: computeEstimatedMinutes(segments), segments }
}
