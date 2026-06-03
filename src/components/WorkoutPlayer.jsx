import { useState, useEffect, useRef, useCallback } from 'react'
import {
  formatSegmentPrescription,
  getEquipmentNeededForSegment,
  getNextUp,
  getSegmentType,
  getSideInstruction,
} from '../utils/workoutDisplay.js'

const FEEL_OPTIONS = [
  { value: 1, emoji: '😴' },
  { value: 2, emoji: '😐' },
  { value: 3, emoji: '🙂' },
  { value: 4, emoji: '😄' },
  { value: 5, emoji: '⚡' },
]

function fmtMMSS(totalSec) {
  const m = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

function getWorkoutType(workout) {
  return workout.dayType ?? workout.type
}

function getSegmentInstruction(segment) {
  return segment.instruction ?? segment.detail ?? ''
}

function readNumber(value, fallback = 0) {
  if (value === '' || value === null || value === undefined) return fallback
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function buildExerciseSummary(workout, journal) {
  return workout.segments
    .map((segment, index) => ({ segment, index }))
    .filter(({ segment }) => getSegmentType(segment) === 'exercise')
    .map(({ segment, index }) => {
      const rows = journal[index] ?? []
      return {
        name:        segment.name,
        exerciseId:  segment.exerciseId,
        sets:        segment.sets,
        reps:        segment.reps,
        completed:   rows.filter(row => row.done).length,
        plannedReps: segment.reps,
      }
    })
}

function buildSetLog(journal) {
  return Object.values(journal)
    .flat()
    .filter(row => row.done)
    .map(row => ({
      exercise:    row.exercise,
      exerciseId:  row.exerciseId,
      setNumber:   row.setNumber,
      plannedReps: readNumber(row.plannedReps),
      reps:        readNumber(row.reps, readNumber(row.plannedReps)),
      weight:      readNumber(row.weight, 0),
      rpe:         readNumber(row.rpe, 0),
      note:        row.note?.trim() ?? '',
    }))
}

// ─── Main player ─────────────────────────────────────────────────────────────

export default function WorkoutPlayer({ workout, onComplete, onClose }) {
  const [segIndex, setSegIndex]     = useState(0)
  const [showPost, setShowPost]     = useState(() => getWorkoutType(workout) === 'rest' || workout.segments.length === 0)
  const [journal, setJournal]       = useState({})

  const segment = workout.segments[segIndex]
  const isLast  = segIndex >= workout.segments.length - 1
  const segmentType = segment ? getSegmentType(segment) : null

  function handleNext() {
    if (isLast) {
      setShowPost(true)
    } else {
      setSegIndex(i => i + 1)
    }
  }

  function handleEndEarly() {
    setShowPost(true)
  }

  function handleSave({ feel, rpe, notes }) {
    const startedAt = workout.startedAt ?? Date.now()
    const durationMin = Math.max(1, Math.round((Date.now() - startedAt) / 60000))
    onComplete({
      date:      new Date().toISOString(),
      type:      getWorkoutType(workout),
      title:     workout.title,
      duration:  durationMin,
      feel,
      rpe,
      notes,
      exercises: buildExerciseSummary(workout, journal),
      sets:      buildSetLog(journal),
    })
  }

  const handleJournalChange = useCallback((rows) => {
    setJournal(current => ({ ...current, [segIndex]: rows }))
  }, [segIndex])

  const nextUp = getNextUp(workout, segIndex)

  if (showPost) {
    return (
      <div style={s.screen}>
        <PostWorkoutLog
          workout={workout}
          startedAt={workout.startedAt}
          onSave={handleSave}
          onCancel={onClose}
        />
      </div>
    )
  }

  return (
    <div style={s.screen}>
      {/* Header */}
      <div style={s.header}>
        <button style={s.backBtn} onClick={onClose} aria-label="Close">← Back</button>
        <div style={s.counter}>
          {segmentType === 'exercise'
            ? `Exercise ${exerciseIndex(workout, segIndex)} of ${exerciseCount(workout)}`
            : `Segment ${segIndex + 1} of ${workout.segments.length}`}
        </div>
      </div>

      <NextUp nextUp={nextUp} />

      {/* Segment body */}
      <div style={{ ...s.body, justifyContent: segmentType === 'exercise' ? 'flex-start' : 'center' }}>
        {segmentType === 'timed'    && <TimedSegment     segment={segment} key={segIndex} />}
        {segmentType === 'text'     && <TextSegment      segment={segment} />}
        {segmentType === 'exercise' && (
          <ExerciseSegment
            segment={segment}
            savedRows={journal[segIndex]}
            key={segIndex}
            onJournalChange={handleJournalChange}
          />
        )}
      </div>

      {/* Progress dots */}
      <div style={s.dots}>
        {workout.segments.map((_, i) => (
          <span
            key={i}
            style={{
              ...s.dot,
              background: i < segIndex
                ? 'var(--color-success)'
                : i === segIndex
                  ? 'var(--color-accent)'
                  : 'var(--color-faint)',
            }}
          />
        ))}
      </div>

      {/* Controls */}
      <div style={s.controls}>
        <button style={s.nextBtn} onClick={handleNext}>
          {isLast
            ? 'Finish workout →'
            : segmentType === 'exercise' ? 'Next exercise →' : 'Next segment →'}
        </button>
        <button style={s.endBtn} onClick={handleEndEarly}>End early</button>
      </div>
    </div>
  )
}

function exerciseCount(workout) {
  return workout.segments.filter(s => getSegmentType(s) === 'exercise').length
}
function exerciseIndex(workout, segIndex) {
  return workout.segments.slice(0, segIndex + 1).filter(s => getSegmentType(s) === 'exercise').length
}

// ─── Timed segment (counts up) ───────────────────────────────────────────────

function TimedSegment({ segment }) {
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(intervalRef.current)
  }, [segment])

  const target    = segment.duration
  const remaining = Math.max(0, target - elapsed)
  const done      = elapsed >= target

  return (
    <div style={s.timedWrap}>
      <p style={s.segName}>{segment.name}</p>
      <p style={s.timer}>{fmtMMSS(done ? elapsed : remaining)}</p>
      <p style={s.segDetail}>{getSegmentInstruction(segment)}</p>
      {segment.effort && <p style={s.effortLine}>{segment.effort}</p>}
      <p style={s.targetLine}>
        {done
          ? `Target hit — ${fmtMMSS(target)} · extra ${fmtMMSS(elapsed - target)}`
          : `Target ${fmtMMSS(target)}`}
      </p>
    </div>
  )
}

// ─── Text segment (instructions only) ────────────────────────────────────────

function TextSegment({ segment }) {
  return (
    <div style={s.textWrap}>
      <p style={s.segName}>{segment.name}</p>
      <p style={s.textDetail}>{getSegmentInstruction(segment)}</p>
    </div>
  )
}

function EquipmentLine({ items }) {
  if (!items?.length) return null
  return (
    <div style={s.equipmentLine}>
      <span style={s.equipmentLabel}>equipment</span>
      <span style={s.equipmentItems}>{items.join(' · ')}</span>
    </div>
  )
}

function NextUp({ nextUp }) {
  return (
    <div style={s.nextUp}>
      <span style={s.nextLabel}>{nextUp.label}</span>
      <span style={s.nextName}>{nextUp.name}</span>
      {nextUp.detail && <span style={s.nextDetail}>{nextUp.detail}</span>}
      <EquipmentLine items={nextUp.equipment} />
    </div>
  )
}

function RestTimer({ restLeft, onSkip }) {
  return (
    <div style={s.restTimer}>
      <p style={s.restKicker}>rest</p>
      <p style={s.restTime}>{fmtMMSS(restLeft)}</p>
      <button style={s.restSkip} onClick={onSkip}>skip rest</button>
    </div>
  )
}

// ─── Exercise segment (sets × reps with rest timer) ──────────────────────────

function makeSetRows(segment, savedRows) {
  if (savedRows) return savedRows
  return Array.from({ length: segment.sets }, (_, index) => ({
    exercise:    segment.name,
    exerciseId:  segment.exerciseId,
    setNumber:   index + 1,
    plannedReps: segment.reps,
    reps:        String(segment.reps ?? ''),
    weight:      '',
    rpe:         segment.rpeTarget ?? '',
    note:        '',
    done:        false,
  }))
}

function ExerciseSegment({ segment, savedRows, onJournalChange }) {
  const [setRows, setSetRows] = useState(() => makeSetRows(segment, savedRows))
  const [restLeft, setRestLeft] = useState(0)   // seconds remaining; 0 = no active rest
  const restRef = useRef(null)

  useEffect(() => () => clearInterval(restRef.current), [])

  useEffect(() => {
    onJournalChange?.(setRows)
  }, [setRows, onJournalChange])

  function startRest() {
    clearInterval(restRef.current)
    setRestLeft(segment.restSeconds ?? segment.restSec ?? 60)
    restRef.current = setInterval(() => {
      setRestLeft(t => {
        if (t <= 1) { clearInterval(restRef.current); return 0 }
        return t - 1
      })
    }, 1000)
  }

  function skipRest() {
    clearInterval(restRef.current)
    setRestLeft(0)
  }

  function updateSet(index, patch) {
    setSetRows(rows => rows.map((row, i) => i === index ? { ...row, ...patch } : row))
  }

  function toggleSet(index) {
    setSetRows(rows => {
      const next = rows.map((row, i) => i === index ? { ...row, done: !row.done } : row)
      const toggledOn = !rows[index].done
      const remaining = next.filter(row => !row.done).length
      if (toggledOn && remaining > 0) startRest()
      else if (remaining === 0) clearInterval(restRef.current)
      return next
    })
  }

  const allDone = setRows.every(row => row.done)
  const sideInstruction = getSideInstruction(segment)
  const equipment = getEquipmentNeededForSegment(segment)

  return (
    <div style={s.exWrap}>
      {restLeft > 0 && !allDone && (
        <RestTimer restLeft={restLeft} onSkip={skipRest} />
      )}
      <p style={s.exName}>{segment.name}</p>
      <p style={s.exReps}>
        {formatSegmentPrescription(segment)}
      </p>
      {sideInstruction && <p style={s.sideHint}>{sideInstruction}</p>}
      <EquipmentLine items={equipment} />
      {segment.loadSuggestion?.suggestion && (
        <p style={s.loadHint}>{segment.loadSuggestion.suggestion}</p>
      )}
      <div style={s.setList}>
        {setRows.map((row, i) => (
          <div
            key={i}
            style={{
              ...s.setRow,
              background:  row.done ? 'var(--color-success-bg)' : 'var(--color-card)',
              borderColor: row.done ? 'var(--color-success)'    : 'var(--color-border)',
              color:       row.done ? 'var(--color-success)'    : 'var(--color-text)',
            }}
            onClick={() => toggleSet(i)}
          >
            <div style={s.setTop}>
              <span style={s.setName}>Set {i + 1}</span>
              <span style={s.setPlanned}>planned {row.plannedReps}{sideInstruction ? ` ${sideInstruction}` : ''}</span>
              <span style={s.setDone}>{row.done ? 'done' : 'open'}</span>
            </div>
            <div style={s.setInputs}>
              <label style={s.setField} onClick={e => e.stopPropagation()}>
                <span style={s.setLabel}>actual</span>
                <input
                  style={s.setInput}
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={row.reps}
                  onChange={e => updateSet(i, { reps: e.target.value })}
                />
              </label>
              <label style={s.setField} onClick={e => e.stopPropagation()}>
                <span style={s.setLabel}>weight</span>
                <input
                  style={s.setInput}
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.5"
                  value={row.weight}
                  placeholder="0"
                  onChange={e => updateSet(i, { weight: e.target.value })}
                />
              </label>
            </div>
            <input
              style={s.noteInput}
              value={row.note}
              placeholder="note"
              onClick={e => e.stopPropagation()}
              onChange={e => updateSet(i, { note: e.target.value })}
            />
          </div>
        ))}
      </div>

      {allDone && (
        <p style={s.allDoneMsg}>All sets done — tap "Next exercise →"</p>
      )}
    </div>
  )
}

// ─── Post-workout log ────────────────────────────────────────────────────────

function PostWorkoutLog({ startedAt, onSave, onCancel }) {
  const [feel,  setFeel]  = useState(3)
  const [rpe, setRpe] = useState(6)
  const [notes, setNotes] = useState('')
  const [elapsedSec, setElapsedSec] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setElapsedSec(Math.round((Date.now() - (startedAt ?? Date.now())) / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [startedAt])

  const durationMin = Math.max(1, Math.round(elapsedSec / 60))

  return (
    <div style={post.wrap}>
      <h2 style={post.title}>Workout done 💪</h2>
      <p style={post.dur}>{durationMin} min · {fmtMMSS(elapsedSec)}</p>

      <div style={post.field}>
        <label style={post.label}>How did it feel?</label>
        <div style={post.feelRow}>
          {FEEL_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setFeel(opt.value)}
              style={{
                ...post.feelBtn,
                background:  feel === opt.value ? 'var(--color-accent-bg)' : 'var(--color-card)',
                borderColor: feel === opt.value ? 'var(--color-accent)'    : 'var(--color-border)',
              }}
            >
              {opt.emoji}
            </button>
          ))}
        </div>
      </div>

      <div style={post.field}>
        <label style={post.label}>Workout RPE</label>
        <div style={post.rpeRow}>
          {Array.from({ length: 10 }, (_, index) => index + 1).map(value => (
            <button
              key={value}
              onClick={() => setRpe(value)}
              style={{
                ...post.rpeBtn,
                background:  rpe === value ? 'var(--color-accent-bg)' : 'transparent',
                borderColor: rpe === value ? 'var(--color-accent)' : 'var(--color-border)',
                color:       rpe === value ? 'var(--color-accent)' : 'var(--color-muted)',
              }}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div style={post.field}>
        <label style={post.label}>Notes</label>
        <textarea
          style={post.notes}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="How was it? Anything to remember?"
          rows={3}
        />
      </div>

      <button style={post.saveBtn} onClick={() => onSave({ feel, rpe, notes: notes.trim() })}>
        Save workout
      </button>
      <button style={post.cancelBtn} onClick={onCancel}>Discard</button>
    </div>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = {
  screen: {
    position:      'fixed',
    inset:         0,
    background:    'var(--color-bg)',
    zIndex:        150,
    display:       'flex',
    flexDirection: 'column',
    paddingTop:    'calc(var(--safe-top) + 12px)',
    paddingBottom: 'calc(var(--safe-bottom) + 16px)',
    paddingLeft:   '20px',
    paddingRight:  '20px',
    maxWidth:      'var(--max-width)',
    margin:        '0 auto',
  },

  header: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   '20px',
  },
  backBtn: {
    background: 'none', border: 'none', color: 'var(--color-muted)',
    fontSize:   '14px', fontWeight: 500, cursor: 'pointer', padding: 0,
  },
  counter: {
    fontSize: '11px', color: 'var(--color-muted)', letterSpacing: '0.06em',
    textTransform: 'uppercase', fontWeight: 600,
  },

  nextUp: {
    display:             'grid',
    gridTemplateColumns: 'auto minmax(0, 1fr) auto',
    alignItems:          'baseline',
    gap:                 '6px 10px',
    padding:             '10px 0 12px',
    borderTop:           '0.5px solid color-mix(in srgb, var(--color-border) 48%, transparent)',
    borderBottom:        '0.5px solid color-mix(in srgb, var(--color-border) 48%, transparent)',
    marginBottom:        '12px',
  },
  nextLabel: {
    color:         'var(--color-muted)',
    fontSize:      '10px',
    fontWeight:    700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  nextName: {
    minWidth:     0,
    color:        'var(--color-text)',
    fontSize:     '13px',
    fontWeight:   650,
    overflow:     'hidden',
    textOverflow: 'ellipsis',
    whiteSpace:   'nowrap',
  },
  nextDetail: {
    color:      'var(--color-accent)',
    fontSize:   '12px',
    fontWeight: 650,
  },
  equipmentLine: {
    gridColumn:          '1 / 4',
    display:             'grid',
    gridTemplateColumns: 'auto minmax(0, 1fr)',
    gap:                 '7px',
    alignItems:          'baseline',
  },
  equipmentLabel: {
    color:      'var(--color-muted)',
    fontSize:   '10px',
    fontWeight: 650,
  },
  equipmentItems: {
    minWidth:     0,
    color:        'var(--color-muted)',
    fontSize:     '11px',
    overflow:     'hidden',
    textOverflow: 'ellipsis',
    whiteSpace:   'nowrap',
  },

  body: {
    flex:           1,
    display:        'flex',
    flexDirection:  'column',
    justifyContent: 'center',
    alignItems:     'center',
    textAlign:      'center',
    gap:            '20px',
    overflowY:      'auto',
    paddingTop:     '4px',
  },

  // Timed
  timedWrap: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: '8px', width: '100%',
  },
  segName:  { fontSize: '14px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-muted)' },
  timer:    { fontFamily: 'var(--font-display)', fontSize: '72px', color: 'var(--color-text)', lineHeight: 1, letterSpacing: '-1px' },
  segDetail: { fontSize: '14px', color: 'var(--color-text)', maxWidth: 280, lineHeight: 1.4 },
  effortLine:{ fontSize: '12px', color: 'var(--color-accent)', fontWeight: 600 },
  targetLine:{ fontSize: '11px', color: 'var(--color-muted)', marginTop: 4 },

  // Text
  textWrap: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
    background: 'var(--color-card)', border: 'var(--border)',
    borderRadius: 'var(--radius-card)', padding: '28px 24px', width: '100%', maxWidth: 340,
  },
  textDetail: {
    fontSize: '15px', color: 'var(--color-text)', lineHeight: 1.5, textAlign: 'center',
  },

  // Exercise
  exWrap: {
    display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '10px',
    width: '100%', maxWidth: 340,
  },
  exName: { fontFamily: 'var(--font-display)', fontSize: '22px', color: 'var(--color-text)', textAlign: 'center' },
  exReps: { fontSize: '18px', color: 'var(--color-accent)', fontWeight: 600, textAlign: 'center', marginTop: '-4px' },
  sideHint: { fontSize: '12px', color: 'var(--color-muted)', fontWeight: 650, textAlign: 'center', marginTop: '-6px' },
  loadHint: { fontSize: '12px', color: 'var(--color-muted)', textAlign: 'center', lineHeight: 1.35, marginTop: '-2px' },
  setList: { display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' },
  setRow: {
    display: 'flex', flexDirection: 'column', gap: '8px',
    padding: '12px', borderRadius: 'var(--radius-sm)', border: '0.5px solid',
    cursor: 'pointer', fontSize: '14px', fontWeight: 500, transition: 'all 0.15s',
  },
  setTop: {
    display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '8px', alignItems: 'center',
  },
  setName: { fontSize: '13px', fontWeight: 600 },
  setPlanned: { fontSize: '11px', color: 'var(--color-muted)', fontWeight: 500 },
  setDone: { fontSize: '11px', color: 'inherit', fontWeight: 600 },
  setInputs: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' },
  setField: {
    display: 'grid', gridTemplateColumns: 'auto 1fr', alignItems: 'center', gap: '6px',
    borderBottom: '0.5px solid var(--color-border)', paddingBottom: '4px',
  },
  setLabel: {
    fontSize: '10px', color: 'var(--color-muted)', fontWeight: 600, textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  setInput: {
    width: '100%', background: 'transparent', border: 'none', outline: 'none',
    color: 'var(--color-text)', fontFamily: 'var(--font-body)', fontSize: '14px',
    textAlign: 'right',
  },
  noteInput: {
    width: '100%', background: 'transparent', border: 'none', borderBottom: '0.5px solid var(--color-border)',
    outline: 'none', color: 'var(--color-text)', fontFamily: 'var(--font-body)', fontSize: '12px',
    padding: '4px 0',
  },
  restTimer: {
    display:       'flex',
    flexDirection: 'column',
    alignItems:    'center',
    gap:           '4px',
    padding:       '14px 0 16px',
  },
  restKicker: {
    margin:        0,
    color:         'var(--color-muted)',
    fontSize:      '11px',
    fontWeight:    700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  restTime: {
    margin:      0,
    fontFamily: 'var(--font-display)',
    fontSize:   '64px',
    lineHeight: 1,
    color:      'var(--color-accent)',
  },
  restSkip: {
    background: 'none',
    border:     'none',
    color:      'var(--color-muted)',
    fontSize:   '12px',
    fontWeight: 650,
    cursor:     'pointer',
  },
  allDoneMsg: { fontSize: '12px', color: 'var(--color-success)', textAlign: 'center', marginTop: '6px' },

  // Dots
  dots: {
    display: 'flex', justifyContent: 'center', gap: '6px', margin: '16px 0',
  },
  dot: { width: '8px', height: '8px', borderRadius: '50%' },

  // Controls
  controls: {
    display: 'flex', flexDirection: 'column', gap: '8px',
  },
  nextBtn: {
    padding: '12px',
    borderRadius: 'var(--radius-sm)',
    background: 'transparent',
    color: 'var(--color-text)',
    fontSize: '14px',
    fontWeight: 650,
    border: 'var(--border)',
    cursor: 'pointer',
  },
  endBtn: {
    padding: '12px', borderRadius: 'var(--radius-card)',
    background: 'transparent', color: 'var(--color-muted)',
    fontSize: '13px', fontWeight: 500, border: 'none', cursor: 'pointer',
  },
}

const post = {
  wrap: {
    flex: 1, display: 'flex', flexDirection: 'column', gap: '18px',
    padding: '20px 0', justifyContent: 'center',
  },
  title: {
    fontFamily: 'var(--font-display)', fontSize: '28px',
    color: 'var(--color-text)', textAlign: 'center',
  },
  dur: {
    fontSize: '13px', color: 'var(--color-muted)', textAlign: 'center', marginTop: '-12px',
  },
  field: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: {
    fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em',
    textTransform: 'uppercase', color: 'var(--color-muted)',
  },
  feelRow: { display: 'flex', gap: '8px', justifyContent: 'space-between' },
  feelBtn: {
    flex: 1, height: '52px', borderRadius: 'var(--radius-sm)',
    fontSize: '24px', cursor: 'pointer',
    border: '0.5px solid', transition: 'background 0.15s, border-color 0.15s',
  },
  rpeRow: {
    display:             'grid',
    gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
    gap:                 '6px',
  },
  rpeBtn: {
    minHeight:    '34px',
    borderRadius: 'var(--radius-sm)',
    border:       '0.5px solid',
    background:   'transparent',
    fontSize:     '12px',
    fontWeight:   700,
    cursor:       'pointer',
  },
  notes: {
    background: 'var(--color-card)', border: 'var(--border)',
    borderRadius: 'var(--radius-sm)', padding: '12px',
    color: 'var(--color-text)', fontFamily: 'var(--font-body)',
    fontSize: '14px', resize: 'vertical', outline: 'none',
  },
  saveBtn: {
    width: '100%', padding: '16px', borderRadius: 'var(--radius-card)',
    background: 'var(--color-accent)', color: '#fff',
    fontSize: '15px', fontWeight: 600, border: 'none', cursor: 'pointer',
    marginTop: '8px',
  },
  cancelBtn: {
    width: '100%', padding: '12px', background: 'transparent',
    color: 'var(--color-muted)', fontSize: '13px', fontWeight: 500,
    border: 'none', cursor: 'pointer',
  },
}
