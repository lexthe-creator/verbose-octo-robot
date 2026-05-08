import { WORKOUT_TYPES, GYM_ACCESS, PHASES } from '../constants/fitness.js'

// ─── Week number from program start date ────────────────────────────────────

// Returns the current program week (1-indexed, minimum 1).
// Falls back to 1 when programStartDate is null.
export function getWeekNumber(programStartDate) {
  if (!programStartDate) return 1
  const start = new Date(programStartDate)
  start.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const weeks = Math.floor((today - start) / (7 * 24 * 60 * 60 * 1000))
  return Math.max(1, weeks + 1)
}

// ─── Phase logic ─────────────────────────────────────────────────────────────

// 13-week repeating cycle: 4 base + 4 build + 4 peak + 1 deload.
// programEndDate is accepted for backward compatibility but not used for phase
// — the week-based cycle is the source of truth.
export function getPhase(programStartDate) {
  const week     = getWeekNumber(programStartDate)
  const position = ((week - 1) % 13) + 1
  if (position <= 4)  return PHASES.BASE
  if (position <= 8)  return PHASES.BUILD
  if (position <= 12) return PHASES.PEAK
  return PHASES.DELOAD
}

// Returns training config for the given phase and week within that phase (1–4).
// reps decrease by 1 per week; rpeTarget increases by 0.5 per week.
export function getPhaseConfig(phase, weekInPhase) {
  const wk      = Math.max(1, Math.min(4, weekInPhase))
  const BASE_CONFIGS = {
    [PHASES.BASE]:   { sets: 3, reps: 12, intensity: 'light',    rpeTarget: 6 },
    [PHASES.BUILD]:  { sets: 4, reps: 8,  intensity: 'moderate', rpeTarget: 7 },
    [PHASES.PEAK]:   { sets: 5, reps: 5,  intensity: 'heavy',    rpeTarget: 8 },
    [PHASES.DELOAD]: { sets: 2, reps: 10, intensity: 'light',    rpeTarget: 5 },
  }
  const cfg = BASE_CONFIGS[phase] ?? BASE_CONFIGS[PHASES.BASE]
  return {
    ...cfg,
    reps:      cfg.reps - (wk - 1),
    rpeTarget: cfg.rpeTarget + (wk - 1) * 0.5,
  }
}

// ─── Day type labels ─────────────────────────────────────────────────────────

const DAY_TYPE_LABEL_MAP = {
  run_easy:  'Easy Run',
  run_tempo: 'Tempo Run',
  run_long:  'Long Run',
  upper:     'Upper Body',
  lower:     'Lower Body',
  full_body: 'Full Body',
  push:      'Push',
  pull:      'Pull',
  mobility:  'Mobility',
  rest:      'Rest',
}

export function getDayTypeLabel(type) {
  return DAY_TYPE_LABEL_MAP[type] ?? type
}

// ─── Weekly training split ──────────────────────────────────────────────────
// Mon: Easy Run · Tue: Strength A · Wed: Stretch · Thu: Tempo Run
// Fri: Strength B · Sat: Long Run · Sun: Rest
const DAY_SCHEDULE = [
  WORKOUT_TYPES.REST,       // Sun
  WORKOUT_TYPES.EASY_RUN,   // Mon
  WORKOUT_TYPES.STRENGTH_A, // Tue
  WORKOUT_TYPES.STRETCH,    // Wed
  WORKOUT_TYPES.TEMPO_RUN,  // Thu
  WORKOUT_TYPES.STRENGTH_B, // Fri
  WORKOUT_TYPES.LONG_RUN,   // Sat
]

export function getTypeForDay(dayOfWeek) {
  return DAY_SCHEDULE[dayOfWeek]
}

export function getTodayType(date = new Date()) {
  return DAY_SCHEDULE[date.getDay()]
}

// Monday–Sunday dates for the current calendar week
export function getWeekDates(today = new Date()) {
  const dow = today.getDay()
  const monOffset = dow === 0 ? -6 : 1 - dow
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setHours(0, 0, 0, 0)
    d.setDate(today.getDate() + monOffset + i)
    return d
  })
}

// ─── Run progression helpers ─────────────────────────────────────────────────

function block(week) {
  return Math.min(4, Math.ceil(week / 4))
}

function easyRunMinutes(week)  { return [20, 25, 30, 35][block(week) - 1] }
function tempoMinutes(week)    { return [10, 15, 20, 25][block(week) - 1] }
function longRunMinutes(week)  { return [30, 40, 50, 60][block(week) - 1] }

// ─── Shared warmup / cooldown segments ──────────────────────────────────────

const WARMUP = [
  { kind: 'timed', section: 'warmup', name: 'Jumping jacks', duration: 120, detail: '2 min' },
  { kind: 'timed', section: 'warmup', name: 'Hip circles',   duration: 60,  detail: '1 min each' },
  { kind: 'timed', section: 'warmup', name: 'Leg swings',    duration: 30,  detail: '30s each' },
]

const COOLDOWN = [
  { kind: 'timed', section: 'cooldown', name: 'Hamstring stretch', duration: 60,  detail: '60s each side' },
  { kind: 'timed', section: 'cooldown', name: 'Hip flexor',        duration: 60,  detail: '60s each side' },
  { kind: 'timed', section: 'cooldown', name: "Child's pose",      duration: 120, detail: '2 min' },
]

// ─── Exercise libraries ──────────────────────────────────────────────────────

const STRENGTH_A = {
  [GYM_ACCESS.BODYWEIGHT]: [
    { name: 'Push-ups',      sets: 3, reps: '12'  },
    { name: 'Pike push-ups', sets: 3, reps: '10'  },
    { name: 'Dips',          sets: 3, reps: '10'  },
    { name: 'Plank',         sets: 3, reps: '45s' },
  ],
  [GYM_ACCESS.DUMBBELLS]: [
    { name: 'DB Shoulder press',  sets: 3, reps: '10' },
    { name: 'DB Chest press',     sets: 3, reps: '10' },
    { name: 'Lateral raises',     sets: 3, reps: '12' },
    { name: 'DB Tricep overhead', sets: 3, reps: '12' },
  ],
  [GYM_ACCESS.GYM]: [
    { name: 'Barbell bench press',   sets: 3, reps: '8'  },
    { name: 'Cable lateral raise',   sets: 3, reps: '12' },
    { name: 'Overhead press',        sets: 3, reps: '8'  },
    { name: 'Cable tricep pushdown', sets: 3, reps: '12' },
  ],
}

const STRENGTH_B = {
  [GYM_ACCESS.BODYWEIGHT]: [
    { name: 'Squats',        sets: 3, reps: '15'      },
    { name: 'Lunges',        sets: 3, reps: '12 each' },
    { name: 'Glute bridges', sets: 3, reps: '15'      },
    { name: 'Inverted rows', sets: 3, reps: '10'      },
  ],
  [GYM_ACCESS.DUMBBELLS]: [
    { name: 'DB Romanian deadlift', sets: 3, reps: '10'      },
    { name: 'DB Goblet squat',      sets: 3, reps: '12'      },
    { name: 'DB Row',               sets: 3, reps: '10 each' },
    { name: 'DB Curl',              sets: 3, reps: '12'      },
  ],
  [GYM_ACCESS.GYM]: [
    { name: 'Barbell squat',     sets: 3, reps: '8'  },
    { name: 'Cable row',         sets: 3, reps: '10' },
    { name: 'Lat pulldown',      sets: 3, reps: '10' },
    { name: 'Romanian deadlift', sets: 3, reps: '8'  },
  ],
}

// ─── generateWorkout ─────────────────────────────────────────────────────────

// @deprecated — use generateWorkout from utils/workoutGenerator.js instead.
// Remove after all call sites updated in step 14b-vi.
//
// Signature: generateWorkout(type, gymAccess, week)
// Returns: { type, title, subtitle, durationEst, segments[] }
//
// Segment shape: { kind, section, name, duration?, sets?, reps?, restSec?, detail? }
//   section: 'warmup' | 'main' | 'cooldown'
//   kind:    'timed' | 'exercise' | 'text'
export function generateWorkout(type, gymAccess, week) {
  switch (type) {

    case WORKOUT_TYPES.REST:
      return {
        type, title: 'Rest day',
        subtitle:    'Recovery — no session today',
        durationEst: 0,
        segments:    [],
      }

    case WORKOUT_TYPES.EASY_RUN: {
      const main  = easyRunMinutes(week)
      const total = main + 8  // warmup ~3.5 + cooldown ~4
      return {
        type, title: 'Easy Run',
        subtitle:    `Run · ~${total} min`,
        durationEst: total,
        segments: [
          ...WARMUP,
          { kind: 'timed', section: 'main', name: 'Easy run', duration: main * 60, detail: 'Conversational pace — you should be able to speak full sentences' },
          ...COOLDOWN,
        ],
      }
    }

    case WORKOUT_TYPES.TEMPO_RUN: {
      const tempo = tempoMinutes(week)
      const total = tempo + 18  // warmup ~3.5 + easy5 + easy5 + cooldown ~4
      return {
        type, title: 'Tempo Run',
        subtitle:    `Run · ~${total} min`,
        durationEst: total,
        segments: [
          ...WARMUP,
          { kind: 'timed', section: 'main', name: 'Easy',  duration: 5 * 60,     detail: 'Conversational pace' },
          { kind: 'timed', section: 'main', name: 'Tempo', duration: tempo * 60, detail: 'Comfortably hard — threshold effort' },
          { kind: 'timed', section: 'main', name: 'Easy',  duration: 5 * 60,     detail: 'Recover' },
          ...COOLDOWN,
        ],
      }
    }

    case WORKOUT_TYPES.LONG_RUN: {
      const main  = longRunMinutes(week)
      const total = main + 8
      return {
        type, title: 'Long Run',
        subtitle:    `Run · ~${total} min`,
        durationEst: total,
        segments: [
          ...WARMUP,
          { kind: 'timed', section: 'main', name: 'Long run', duration: main * 60, detail: 'Steady easy pace — time on feet' },
          ...COOLDOWN,
        ],
      }
    }

    case WORKOUT_TYPES.STRENGTH_A:
    case WORKOUT_TYPES.STRENGTH_B: {
      const source = type === WORKOUT_TYPES.STRENGTH_A ? STRENGTH_A : STRENGTH_B
      const list   = (source[gymAccess] || source[GYM_ACCESS.BODYWEIGHT]).slice()
      const focus  = type === WORKOUT_TYPES.STRENGTH_A ? 'Push + Core' : 'Pull + Legs'

      return {
        type,
        title:       type === WORKOUT_TYPES.STRENGTH_A ? 'Strength A' : 'Strength B',
        subtitle:    `${focus} · ~40 min`,
        durationEst: 40,
        segments: [
          ...WARMUP,
          ...list.map(ex => ({
            kind:    'exercise',
            section: 'main',
            name:    ex.name,
            sets:    ex.sets,
            reps:    ex.reps,
            restSec: 60,
          })),
          ...COOLDOWN,
        ],
      }
    }

    case WORKOUT_TYPES.STRETCH:
      return {
        type, title: 'Stretch / Rest',
        subtitle:    'Mobility · ~12 min',
        durationEst: 12,
        segments: [
          { kind: 'timed',    section: 'main', name: 'Breathwork',         duration: 5 * 60, detail: 'Slow nasal breathing, relaxed body' },
          { kind: 'timed',    section: 'main', name: 'Hip flexor stretch', duration: 60,     detail: '60s each side' },
          { kind: 'timed',    section: 'main', name: 'Pigeon pose',        duration: 90,     detail: '90s each side' },
          { kind: 'exercise', section: 'main', name: 'Thoracic rotation',  sets: 1, reps: '10 each', restSec: 0 },
          { kind: 'timed',    section: 'main', name: "Child's pose",       duration: 120,    detail: 'Breathe and release' },
        ],
      }

    default:
      return { type, title: 'Unknown', subtitle: '', durationEst: 0, segments: [] }
  }
}
