export function getSegmentType(segment) {
  if (segment?.type === 'sets_reps') return 'exercise'
  if (segment?.type) return segment.type
  return segment?.kind
}

export function formatDuration(seconds = 0) {
  const total = Math.max(0, Number(seconds) || 0)
  const mins = Math.floor(total / 60)
  const sec = total % 60
  if (total === 0) return ''
  if (sec === 0) return `${mins} min`
  return `${mins}:${String(sec).padStart(2, '0')}`
}

export function formatSegmentPrescription(segment) {
  if (!segment) return ''
  if (getSegmentType(segment) === 'exercise') {
    const side = getSideInstruction(segment)
    const unit = segment.repUnit ? ` ${segment.repUnit}` : ''
    const reps = segment.repRange ?? segment.reps
    return [segment.sets && reps ? `${segment.sets}x${reps}${unit}` : '', side].filter(Boolean).join(' ')
  }
  if (segment.duration) return formatDuration(segment.duration)
  return ''
}

function addEquipment(items, value) {
  if (!value) return
  if (!items.includes(value)) items.push(value)
}

export function getEquipmentNeededForSegment(segment) {
  if (!segment) return []
  if (Array.isArray(segment.equipmentNeeded) && segment.equipmentNeeded.length > 0) {
    return [...new Set(segment.equipmentNeeded)]
  }

  const items = []
  const name = String(segment.name ?? '').toLowerCase()
  const equipment = String(segment.equipment ?? '').toLowerCase()
  const type = getSegmentType(segment)

  if (type === 'timed' && (name.includes('run') || name.includes('jog') || name.includes('walk'))) {
    addEquipment(items, 'running shoes')
  }

  if (equipment === 'bodyweight') addEquipment(items, 'bodyweight')
  if (equipment === 'dumbbells' || name.includes('db ') || name.includes('dumbbell')) addEquipment(items, 'dumbbells')
  if (equipment === 'gym') {
    if (name.includes('cable') || name.includes('pulldown')) addEquipment(items, 'cable machine')
    if (name.includes('machine') || name.includes('leg press') || name.includes('leg curl') || name.includes('leg extension')) addEquipment(items, 'machine')
    if (name.includes('barbell') || name.includes('deadlift') || name.includes('thruster') || name.includes('power clean') || name.includes('complex') || name.includes('overhead press') || name.includes('squat')) addEquipment(items, 'barbell')
  }
  if (name.includes('bench') || name.includes('hip thrust') || name.includes('step-up') || name.includes('bulgarian')) addEquipment(items, 'bench')
  if (name.includes('squat') || name.includes('overhead press')) addEquipment(items, 'rack')
  if (name.includes('pull-up') || name.includes('chin-up') || name.includes('inverted row') || name.includes('australian pull-up')) addEquipment(items, 'pull-up bar')

  if (items.length === 0 && type === 'exercise') addEquipment(items, equipment || 'bodyweight')
  if (items.length === 0 && type === 'timed') addEquipment(items, 'bodyweight')

  return items
}

export function getEquipmentNeededForWorkout(workout) {
  return [...new Set((workout?.segments ?? []).flatMap(getEquipmentNeededForSegment))]
}

export function isSideBasedSegment(segment) {
  const name = String(segment?.name ?? '').toLowerCase()
  const cueText = (segment?.cues ?? []).join(' ').toLowerCase()
  const text = `${name} ${cueText} ${segment?.instruction ?? ''}`.toLowerCase()
  return Boolean(
    segment?.perSide ||
    /\beach\b/.test(text) ||
    /single leg|split squat|lunge|step-up|turkish|get-up|snatch|woodchop|row|curl|kickback|lateral raise|fly|rotation|90-90|side/.test(text)
  )
}

export function getSideInstruction(segment) {
  if (!isSideBasedSegment(segment)) return ''
  if (segment?.sideMode === 'timed') return 'each side'
  return 'each side'
}

export function getNextUp(workout, currentIndex) {
  const next = workout?.segments?.[currentIndex + 1]
  if (!next) {
    return { label: 'finish', name: 'post-workout log', detail: '', equipment: [] }
  }
  return {
    label:     'next up',
    name:      next.name,
    detail:    formatSegmentPrescription(next),
    equipment: getEquipmentNeededForSegment(next),
  }
}

const PREVIEW_SECTION_LABELS = {
  warmup:   'warm up',
  main:     'main',
  cooldown: 'cool down',
}

export function getWorkoutPreviewSections(workout) {
  return ['warmup', 'main', 'cooldown']
    .map(section => ({
      section,
      title: PREVIEW_SECTION_LABELS[section],
      rows: (workout?.segments ?? [])
        .filter(segment => (segment.section ?? 'main') === section)
        .map(segment => ({
          name:         segment.name,
          prescription: formatSegmentPrescription(segment),
          equipment:    getEquipmentNeededForSegment(segment),
        })),
    }))
    .filter(group => group.rows.length > 0)
}

export function hasExplicitCore(workout) {
  return (workout?.segments ?? []).some(segment => {
    const group = String(segment.muscleGroup ?? '').toLowerCase()
    const muscles = (segment.muscles ?? []).map(item => String(item).toLowerCase())
    return group === 'core' || muscles.includes('core')
  })
}

export function workoutNeedsCore(workout) {
  const text = `${workout?.title ?? ''} ${workout?.subtitle ?? ''}`.toLowerCase()
  return text.includes('core')
}

export function getWorkoutFocus(entry = {}) {
  const type = String(entry.dayType ?? entry.type ?? '').toLowerCase()
  const title = String(entry.title ?? '').toLowerCase()
  if (type.includes('push') || title.includes('push')) return 'Push'
  if (type.includes('lower') || title.includes('lower')) return 'Lower'
  if (type.includes('run') || title.includes('run')) return 'Run'
  if (type.includes('upper') || title.includes('upper')) return 'Upper'
  if (type.includes('full') || title.includes('full')) return 'Full'
  if (type.includes('mobility') || title.includes('mobility')) return 'Mobility'
  if (type.includes('pull') || title.includes('pull')) return 'Pull'
  return entry.title ?? 'Workout'
}

export function getEntryRpe(entry = {}) {
  const explicit = entry.rpe ?? entry.rpeScore ?? entry.rpeTarget
  if (Number.isFinite(Number(explicit))) return Number(explicit)
  if (entry.effort === 'Easy') return 4
  if (entry.effort === 'Moderate') return 6
  if (entry.effort === 'Hard') return 8
  return null
}

export function formatJournalDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function getJournalRow(entry = {}) {
  const rpe = getEntryRpe(entry)
  return {
    date:       formatJournalDate(entry.date),
    focus:      getWorkoutFocus(entry),
    duration:   entry.duration ? `${entry.duration} min` : '',
    marker:     entry.status === 'skipped' ? '○' : '●',
    rpe:        rpe ? `RPE ${rpe}/10` : '',
    rpeValue:   rpe,
    completion: entry.status === 'skipped' ? 'skipped' : 'completed',
  }
}
