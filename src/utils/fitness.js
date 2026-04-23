// ─── Phase logic ────────────────────────────────────────────────────────────

// weeks 1–16 → 'base'; 17–24 → 'hyrox'; 25–26 → 'race'
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

// ─── Weekly training split ──────────────────────────────────────────────────
// Day 1 Mon: Easy Run · Day 2 Tue: Strength A · Day 3 Wed: Stretch / Rest
// Day 4 Thu: Tempo Run · Day 5 Fri: Strength B · Day 6 Sat: Long Run · Day 7 Sun: Rest
// Indexed by JS getDay(): 0=Sun … 6=Sat
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

// ─── Workout progression helpers ────────────────────────────────────────────

function block(week) {
  // 1 → weeks 1-4, 2 → 5-8, 3 → 9-12, 4 → 13-16, capped at 4 for HYROX phase
  return Math.min(4, Math.ceil(week / 4))
}

function easyRunMinutes(week)  { return [20, 25, 30, 35][block(week) - 1] }
function tempoMinutes(week)    { return [10, 15, 20, 25][block(week) - 1] }
function longRunMinutes(week)  { return [30, 40, 50, 60][block(week) - 1] }

// ─── Exercise libraries ─────────────────────────────────────────────────────

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
  if (week >= 23 && week <= 24) return { name: 'Farmers carry simulation', sets: 3, reps: '40m',     hyrox: true }
  if (week >= 21 && week <= 22) return { name: 'Wall balls (DB thruster)', sets: 3, reps: '15',      hyrox: true }
  if (week >= 19 && week <= 20) return { name: 'Sandbag/DB lunges',        sets: 3, reps: '10 each', hyrox: true }
  if (week >= 17 && week <= 18) return { name: 'Burpee broad jumps',       sets: 3, reps: '8',       hyrox: true }
  return null
}

// ─── generateWorkout ────────────────────────────────────────────────────────

// Signature: generateWorkout(type, gymAccess, week)
// Returns: { type, title, subtitle, durationEst, segments: [...] }
//
// Segment kinds:
//   { kind: 'timed',    name, duration (sec), detail }
//   { kind: 'exercise', name, sets, reps, restSec, hyrox? }
//   { kind: 'text',     name, detail }
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
      const main = easyRunMinutes(week)
      const total = 5 + main + 5
      return {
        type, title: 'Easy Run',
        subtitle:    `Run · ${total} min`,
        durationEst: total,
        segments: [
          { kind: 'timed', name: 'Warm up',    duration: 5 * 60,    detail: 'Easy walk/jog' },
          { kind: 'timed', name: 'Main block', duration: main * 60, detail: 'Easy pace — conversational' },
          { kind: 'timed', name: 'Cool down',  duration: 5 * 60,    detail: 'Easy walk' },
        ],
      }
    }

    case 'tempo_run': {
      const tempo = tempoMinutes(week)
      const total = 5 + 5 + tempo + 5 + 5
      return {
        type, title: 'Tempo Run',
        subtitle:    `Run · ${total} min`,
        durationEst: total,
        segments: [
          { kind: 'timed', name: 'Warm up',   duration: 5 * 60,     detail: 'Easy walk/jog' },
          { kind: 'timed', name: 'Easy',      duration: 5 * 60,     detail: 'Conversational pace' },
          { kind: 'timed', name: 'Tempo',     duration: tempo * 60, detail: 'Comfortably hard — threshold' },
          { kind: 'timed', name: 'Easy',      duration: 5 * 60,     detail: 'Recover' },
          { kind: 'timed', name: 'Cool down', duration: 5 * 60,     detail: 'Easy walk' },
        ],
      }
    }

    case 'long_run': {
      const main = longRunMinutes(week)
      const total = 5 + main + 5
      return {
        type, title: 'Long Run',
        subtitle:    `Run · ${total} min`,
        durationEst: total,
        segments: [
          { kind: 'timed', name: 'Warm up',    duration: 5 * 60,    detail: 'Easy walk/jog' },
          { kind: 'timed', name: 'Main block', duration: main * 60, detail: 'Steady easy pace — time on feet' },
          { kind: 'timed', name: 'Cool down',  duration: 5 * 60,    detail: 'Easy walk' },
        ],
      }
    }

    case 'strength_a':
    case 'strength_b': {
      const source = type === 'strength_a' ? STRENGTH_A : STRENGTH_B
      const list = (source[gymAccess] || source.bodyweight).slice()

      const hy = hyroxStation(week)
      if (hy) list[list.length - 1] = hy   // replace final exercise in HYROX phase

      const focus = type === 'strength_a' ? 'Push + Core' : 'Pull + Legs'
      const total = 35

      return {
        type,
        title:       type === 'strength_a' ? 'Strength A' : 'Strength B',
        subtitle:    `${focus} · ~${total} min`,
        durationEst: total,
        segments: [
          { kind: 'text', name: 'Warm up', detail: '5 min: jumping jacks, arm circles, hip circles' },
          ...list.map(ex => ({
            kind:    'exercise',
            name:    ex.name,
            sets:    ex.sets,
            reps:    ex.reps,
            restSec: 60,
            hyrox:   !!ex.hyrox,
          })),
          { kind: 'text', name: 'Cool down', detail: '5 min stretch' },
        ],
      }
    }

    case 'stretch':
      return {
        type, title: 'Stretch / Rest',
        subtitle:    'Mobility · ~12 min',
        durationEst: 12,
        segments: [
          { kind: 'text',  name: '5 min breathwork',       detail: 'Slow nasal breathing, relaxed body' },
          { kind: 'timed', name: 'Hip flexor stretch',     duration: 60,  detail: '60s each side' },
          { kind: 'timed', name: 'Hamstring stretch',      duration: 60,  detail: '60s each side' },
          { kind: 'timed', name: 'Pigeon pose',            duration: 90,  detail: '90s each side' },
          { kind: 'text',  name: 'Thoracic rotation',      detail: '10 reps each side' },
          { kind: 'timed', name: "Child's pose",           duration: 120, detail: 'Breathe and release' },
        ],
      }

    default:
      return { type, title: 'Unknown', subtitle: '', durationEst: 0, segments: [] }
  }
}
