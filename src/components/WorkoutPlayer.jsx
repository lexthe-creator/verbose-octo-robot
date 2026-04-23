import { useState, useEffect, useRef } from 'react'

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

// ─── Main player ─────────────────────────────────────────────────────────────

export default function WorkoutPlayer({ workout, onComplete, onClose }) {
  const [segIndex, setSegIndex]     = useState(0)
  const [showPost, setShowPost]     = useState(false)
  const startRef                     = useRef(Date.now())

  // Rest day short-circuits — nothing to play. Parent should guard, but
  // if opened anyway, show the post-workout log straight away.
  useEffect(() => {
    if (workout.type === 'rest' || workout.segments.length === 0) {
      setShowPost(true)
    }
  }, [workout.type, workout.segments.length])

  const segment = workout.segments[segIndex]
  const isLast  = segIndex >= workout.segments.length - 1

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

  function handleSave({ feel, notes }) {
    const durationMin = Math.max(1, Math.round((Date.now() - startRef.current) / 60000))
    onComplete({
      date:      new Date().toISOString(),
      type:      workout.type,
      title:     workout.title,
      duration:  durationMin,
      feel,
      notes,
      exercises: workout.segments
        .filter(s => s.kind === 'exercise')
        .map(s => ({ name: s.name, sets: s.sets, reps: s.reps })),
    })
  }

  if (showPost) {
    return (
      <div style={s.screen}>
        <PostWorkoutLog
          workout={workout}
          startedAt={startRef.current}
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
          {segment.kind === 'exercise'
            ? `Exercise ${exerciseIndex(workout, segIndex)} of ${exerciseCount(workout)}`
            : `Segment ${segIndex + 1} of ${workout.segments.length}`}
        </div>
      </div>

      {/* Segment body */}
      <div style={s.body}>
        {segment.kind === 'timed'    && <TimedSegment     segment={segment} />}
        {segment.kind === 'text'     && <TextSegment      segment={segment} />}
        {segment.kind === 'exercise' && <ExerciseSegment  segment={segment} key={segIndex} onAllSetsDone={() => {}} />}
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
            : segment.kind === 'exercise' ? 'Next exercise →' : 'Next segment →'}
        </button>
        <button style={s.endBtn} onClick={handleEndEarly}>End early</button>
      </div>
    </div>
  )
}

function exerciseCount(workout) {
  return workout.segments.filter(s => s.kind === 'exercise').length
}
function exerciseIndex(workout, segIndex) {
  return workout.segments.slice(0, segIndex + 1).filter(s => s.kind === 'exercise').length
}

// ─── Timed segment (counts up) ───────────────────────────────────────────────

function TimedSegment({ segment }) {
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef(null)

  useEffect(() => {
    setElapsed(0)
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
      <p style={s.segDetail}>{segment.detail}</p>
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
      <p style={s.textDetail}>{segment.detail}</p>
    </div>
  )
}

// ─── Exercise segment (sets × reps with rest timer) ──────────────────────────

function ExerciseSegment({ segment }) {
  const [setsDone, setSetsDone] = useState(Array(segment.sets).fill(false))
  const [restLeft, setRestLeft] = useState(0)   // seconds remaining; 0 = no active rest
  const restRef = useRef(null)

  useEffect(() => () => clearInterval(restRef.current), [])

  function startRest() {
    clearInterval(restRef.current)
    setRestLeft(segment.restSec || 60)
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

  function markSet(i) {
    if (setsDone[i]) return
    const next = [...setsDone]
    next[i] = true
    setSetsDone(next)
    // Start rest if there are more sets to go
    const remaining = next.filter(x => !x).length
    if (remaining > 0) startRest()
    else clearInterval(restRef.current)
  }

  const allDone = setsDone.every(Boolean)

  return (
    <div style={s.exWrap}>
      <p style={s.exName}>{segment.name}</p>
      <p style={s.exReps}>{segment.sets} × {segment.reps}</p>
      {segment.hyrox && <span style={s.hyroxBadge}>HYROX station</span>}

      <div style={s.setList}>
        {setsDone.map((done, i) => (
          <button
            key={i}
            style={{
              ...s.setRow,
              background:  done ? 'var(--color-success-bg)' : 'var(--color-card)',
              borderColor: done ? 'var(--color-success)'    : 'var(--color-border)',
              color:       done ? 'var(--color-success)'    : 'var(--color-text)',
            }}
            onClick={() => markSet(i)}
          >
            <span>Set {i + 1}</span>
            <span>{done ? '✓' : segment.reps}</span>
          </button>
        ))}
      </div>

      {restLeft > 0 && !allDone && (
        <div style={s.restBox}>
          <span style={s.restLabel}>Rest · {fmtMMSS(restLeft)}</span>
          <button style={s.skipBtn} onClick={skipRest}>Skip</button>
        </div>
      )}

      {allDone && (
        <p style={s.allDoneMsg}>All sets done — tap "Next exercise →"</p>
      )}
    </div>
  )
}

// ─── Post-workout log ────────────────────────────────────────────────────────

function PostWorkoutLog({ startedAt, onSave, onCancel }) {
  const [feel,  setFeel]  = useState(3)
  const [notes, setNotes] = useState('')
  const [elapsedSec, setElapsedSec] = useState(Math.round((Date.now() - startedAt) / 1000))

  useEffect(() => {
    const id = setInterval(() => {
      setElapsedSec(Math.round((Date.now() - startedAt) / 1000))
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
        <label style={post.label}>Notes</label>
        <textarea
          style={post.notes}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="How was it? Anything to remember?"
          rows={3}
        />
      </div>

      <button style={post.saveBtn} onClick={() => onSave({ feel, notes: notes.trim() })}>
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

  body: {
    flex:           1,
    display:        'flex',
    flexDirection:  'column',
    justifyContent: 'center',
    alignItems:     'center',
    textAlign:      'center',
    gap:            '20px',
  },

  // Timed
  timedWrap: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: '8px', width: '100%',
  },
  segName:  { fontSize: '14px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--color-muted)' },
  timer:    { fontFamily: 'var(--font-display)', fontSize: '72px', color: 'var(--color-text)', lineHeight: 1, letterSpacing: '-1px' },
  segDetail: { fontSize: '14px', color: 'var(--color-text)', maxWidth: 280, lineHeight: 1.4 },
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
  hyroxBadge: {
    alignSelf: 'center', padding: '3px 10px', borderRadius: 'var(--radius-pill)',
    background: '#2A1F14', color: '#C17B56', border: '0.5px solid #C17B56',
    fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em',
  },
  setList: { display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' },
  setRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 16px', borderRadius: 'var(--radius-sm)', border: '0.5px solid',
    cursor: 'pointer', fontSize: '14px', fontWeight: 500, transition: 'all 0.15s',
  },
  restBox: {
    marginTop: '10px', padding: '10px 14px', borderRadius: 'var(--radius-sm)',
    background: 'var(--color-accent-bg)', border: '0.5px solid var(--color-accent)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  restLabel: { fontSize: '13px', fontWeight: 600, color: 'var(--color-accent)' },
  skipBtn: {
    background: 'none', border: 'none', color: 'var(--color-accent)',
    fontSize: '12px', fontWeight: 600, cursor: 'pointer',
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
    padding: '16px', borderRadius: 'var(--radius-card)',
    background: 'var(--color-accent)', color: '#fff',
    fontSize: '16px', fontWeight: 600, border: 'none', cursor: 'pointer',
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
