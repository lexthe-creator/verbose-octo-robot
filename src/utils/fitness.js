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

// When programEndDate is set, derive phase from weeks remaining to race:
//   ≤2 weeks → 'race'  |  ≤10 weeks → 'hyrox'  |  else fall through to week-based
// Without programEndDate, uses week number from programStartDate.
export function getPhase(programStartDate, programEndDate) {
  if (programEndDate) {
    const end = new Date(programEndDate)
    end.setHours(0, 0, 0, 0)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const msLeft = end - today
    if (msLeft <= 0) return 'race'
    const weeksToEnd = Math.ceil(msLeft / (7 * 24 * 60 * 60 * 1000))
    if (weeksToEnd <= 2)  return 'race'
    if (weeksToEnd <= 10) return 'hyrox'
  }
  const week = getWeekNumber(programStartDate)
  if (week >= 25) return 'race'
  if (week >= 17) return 'hyrox'
  return 'base'
}

export const PHASE_LABELS = {
  base:  'Base Building',
  hyrox: 'HYROX Prep',
  race:  'Race Block',
}

// ─── Weekly training split ──────────────────────────────────────────────────
// Mon: Easy Run · Tue: Strength A · Wed: Stretch · Thu: Tempo Run
// Fri: Strength B · Sat: Long Run · Sun: Rest
const DAY_SCHEDULE = [
  'rest',       // Sun
  'easy_run',   // Mon
  'strength_a', // Tue
  'stretch',    // Wed
  'tempo_run',  // Thu
  'strength_b', // Fri
  'long_run',   // Sat
]

export function getTypeForDay(dayOfWeek) {
  return DAY_SCHEDULE[dayOfWeek]
}

export function getTodayType(date = new Date()) {
  return DAY_SCHEDULE[date.getDay()]
}

export const WORKOUT_TITLES = {
  easy_run:   'Easy Run',
  tempo_run:  'Tempo Run',
  long_run:   'Long Run',
  strength_a: 'Strength A',
  strength_b: 'Strength B',
  stretch:    'Stretch / Rest',
  rest:       'Rest day',
}

export const WORKOUT_ICONS = {
  easy_run:   '🏃',
  tempo_run:  '⚡',
  long_run:   '🛣',
  strength_a: '💪',
  strength_b: '💪',
  stretch:    '🧘',
  rest:       '☁',
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
  bodyweight: [
    { name: 'Push-ups',      sets: 3, reps: '12'  },
    { name: 'Pike push-ups', sets: 3, reps: '10'  },
    { name: 'Dips',          sets: 3, reps: '10'  },
    { name: 'Plank',         sets: 3, reps: '45s' },
  ],
  dumbbells: [
    { name: 'DB Shoulder press',  sets: 3, reps: '10' },
    { name: 'DB Chest press',     sets: 3, reps: '10' },
    { name: 'Lateral raises',     sets: 3, reps: '12' },
    { name: 'DB Tricep overhead', sets: 3, reps: '12' },
  ],
  gym: [
    { name: 'Barbell bench press',   sets: 3, reps: '8'  },
    { name: 'Cable lateral raise',   sets: 3, reps: '12' },
    { name: 'Overhead press',        sets: 3, reps: '8'  },
    { name: 'Cable tricep pushdown', sets: 3, reps: '12' },
  ],
}

const STRENGTH_B = {
  bodyweight: [
    { name: 'Squats',        sets: 3, reps: '15'      },
    { name: 'Lunges',        sets: 3, reps: '12 each' },
    { name: 'Glute bridges', sets: 3, reps: '15'      },
    { name: 'Inverted rows', sets: 3, reps: '10'      },
  ],
  dumbbells: [
    { name: 'DB Romanian deadlift', sets: 3, reps: '10'      },
    { name: 'DB Goblet squat',      sets: 3, reps: '12'      },
    { name: 'DB Row',               sets: 3, reps: '10 each' },
    { name: 'DB Curl',              sets: 3, reps: '12'      },
  ],
  gym: [
    { name: 'Barbell squat',     sets: 3, reps: '8'  },
    { name: 'Cable row',         sets: 3, reps: '10' },
    { name: 'Lat pulldown',      sets: 3, reps: '10' },
    { name: 'Romanian deadlift', sets: 3, reps: '8'  },
  ],
}

// HYROX phase replaces the final strength exercise with a station drill
function hyroxStation(week) {
  if (week >= 23) return { name: 'Farmers carry simulation', sets: 3, reps: '40m',     hyrox: true }
  if (week >= 21) return { name: 'Wall balls (DB thruster)', sets: 3, reps: '15',      hyrox: true }
  if (week >= 19) return { name: 'Sandbag/DB lunges',        sets: 3, reps: '10 each', hyrox: true }
  if (week >= 17) return { name: 'Burpee broad jumps',       sets: 3, reps: '8',       hyrox: true }
  return null
}

// ─── generateWorkout ─────────────────────────────────────────────────────────

// Signature: generateWorkout(type, gymAccess, week)
// Returns: { type, title, subtitle, durationEst, segments[] }
//
// Segment shape: { kind, section, name, duration?, sets?, reps?, restSec?, detail?, hyrox? }
//   section: 'warmup' | 'main' | 'cooldown'
//   kind:    'timed' | 'exercise' | 'text'
export function generateWorkout(type, gymAccess, week) {
  switch (type) {

    case 'rest':
      return {
        type, title: 'Rest day',
        subtitle:    'Recovery — no session today',
        durationEst: 0,
        segments:    [],
      }

    case 'easy_run': {
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

    case 'tempo_run': {
      const tempo = tempoMinutes(week)
      const total = tempo + 18  // warmup ~3.5 + easy5 + easy5 + cooldown ~4
      return {
        type, title: 'Tempo Run',
        subtitle:    `Run · ~${total} min`,
        durationEst: total,
        segments: [
          ...WARMUP,
          { kind: 'timed', section: 'main', name: 'Easy',      duration: 5 * 60,     detail: 'Conversational pace' },
          { kind: 'timed', section: 'main', name: 'Tempo',     duration: tempo * 60, detail: 'Comfortably hard — threshold effort' },
          { kind: 'timed', section: 'main', name: 'Easy',      duration: 5 * 60,     detail: 'Recover' },
          ...COOLDOWN,
        ],
      }
    }

    case 'long_run': {
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

    case 'strength_a':
    case 'strength_b': {
      const source = type === 'strength_a' ? STRENGTH_A : STRENGTH_B
      const list   = (source[gymAccess] || source.bodyweight).slice()

      const hy = hyroxStation(week)
      if (hy) list[list.length - 1] = hy

      const focus = type === 'strength_a' ? 'Push + Core' : 'Pull + Legs'

      return {
        type,
        title:       type === 'strength_a' ? 'Strength A' : 'Strength B',
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
            hyrox:   !!ex.hyrox,
          })),
          ...COOLDOWN,
        ],
      }
    }

    case 'stretch':
      return {
        type, title: 'Stretch / Rest',
        subtitle:    'Mobility · ~12 min',
        durationEst: 12,
        segments: [
          { kind: 'timed',    section: 'main', name: 'Breathwork',         duration: 5 * 60, detail: 'Slow nasal breathing, relaxed body' },
          { kind: 'timed',    section: 'main', name: 'Hip flexor stretch', duration: 60,     detail: '60s each side' },
          { kind: 'timed',    section: 'main', name: 'Pigeon pose',        duration: 90,     detail: '90s each side' },
          { kind: 'exercise', section: 'main', name: 'Thoracic rotation',  sets: 1, reps: '10 each', restSec: 0, hyrox: false },
          { kind: 'timed',    section: 'main', name: "Child's pose",       duration: 120,    detail: 'Breathe and release' },
        ],
      }

    default:
      return { type, title: 'Unknown', subtitle: '', durationEst: 0, segments: [] }
  }
}
