import { useState, useEffect, useRef, useCallback } from 'react'
import { getTodayISO } from '../utils/time.js'

// ─── Constants ─────────────────────────────────────────────────────────────────

const RING_RADIUS        = 80
const RING_CIRCUMFERENCE = 502  // ≈ 2π × 80

const SECTION_LABELS = {
  warmup:   'WARM UP',
  main:     'MAIN',
  cooldown: 'COOL DOWN',
}

const FEEL_OPTIONS = [
  { value: 1, label: 'Tough' },
  { value: 2, label: 'Hard'  },
  { value: 3, label: 'Good'  },
  { value: 4, label: 'Great' },
  { value: 5, label: 'Best'  },
]

// ─── Audio helper ──────────────────────────────────────────────────────────────

function speakText(text) {
  try {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text))
  } catch {}
}

// ─── Format helper ─────────────────────────────────────────────────────────────

function fmtMMSS(totalSec) {
  const m   = Math.floor(Math.max(0, totalSec) / 60)
  const sec = Math.max(0, totalSec) % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

// ─── WorkoutPlayer ─────────────────────────────────────────────────────────────

export default function WorkoutPlayer({ workout, onComplete, onClose, audioEnabled = false }) {
  const [segIndex,         setSegIndex]        = useState(0)
  const [completedReps,    setCompletedReps]    = useState({})
  const [showPost,         setShowPost]         = useState(false)
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)
  const [isPaused,         setIsPaused]         = useState(false)
  const startedAtRef = useRef(Date.now())

  // Rest day or empty workout — skip straight to post-workout log
  useEffect(() => {
    if (!workout.segments || workout.segments.length === 0) {
      setShowPost(true)
    }
  }, [workout.segments])

  const segments  = workout.segments ?? []
  const segment   = segments[segIndex]
  const isLast    = segIndex >= segments.length - 1

  // Stable reference so interval closures in child segments don't go stale
  const handleNext = useCallback(() => {
    if (isLast) {
      setShowPost(true)
    } else {
      setIsPaused(false)
      setSegIndex(i => i + 1)
    }
  }, [isLast])

  function handleSetComplete(segIdx, setIndex, reps) {
    setCompletedReps(prev => {
      const existing = prev[segIdx] ?? []
      const updated  = [...existing]
      updated[setIndex] = reps
      return { ...prev, [segIdx]: updated }
    })
  }

  function handleSave(feel, notes) {
    const elapsedMs   = Date.now() - startedAtRef.current
    const durationMin = Math.max(1, Math.round(elapsedMs / 60000))

    const exercises = segments
      .filter(s => s.type === 'sets_reps')
      .map(s => {
        const idx = segments.indexOf(s)
        return { exercise: s.name, sets: completedReps[idx] ?? [] }
      })

    onComplete({
      date:      getTodayISO(),
      type:      workout.dayType,
      title:     workout.title,
      duration:  durationMin,
      feel,
      notes,
      exercises,
    })
  }

  // Post-workout screen
  if (showPost) {
    const elapsedMs   = Date.now() - startedAtRef.current
    const durationMin = Math.max(1, Math.round(elapsedMs / 60000))
    return (
      <div style={s.screen}>
        <PostWorkoutLog
          durationMin={durationMin}
          onSave={handleSave}
          onSkip={() => onComplete(null)}
        />
      </div>
    )
  }

  if (!segment) return null

  const setsRepsOnly   = segments.filter(seg => seg.type === 'sets_reps')
  const exerciseNum    = segment.type === 'sets_reps'
    ? setsRepsOnly.indexOf(segment) + 1
    : null
  const prevExercise   = exerciseNum > 1
    ? setsRepsOnly[exerciseNum - 2]?.name ?? null
    : null
  const nextSegName    = segments[segIndex + 1]?.name ?? null

  return (
    <div style={s.screen}>

      {/* Close confirmation overlay */}
      {showCloseConfirm && (
        <div style={s.confirmOverlay}>
          <div style={s.confirmBox}>
            <p style={s.confirmTitle}>End workout?</p>
            <p style={s.confirmSub}>Your progress won't be saved.</p>
            <button style={s.confirmEndBtn} onClick={onClose}>End workout</button>
            <button style={s.confirmKeepBtn} onClick={() => setShowCloseConfirm(false)}>
              Keep going
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={s.header}>
        <button
          style={s.closeBtn}
          onClick={() => setShowCloseConfirm(true)}
          aria-label="Close workout"
        >
          ✕
        </button>
        <span style={s.headerCounter}>
          {segIndex + 1} / {segments.length}
        </span>
      </div>

      {/* Segment body */}
      <div style={s.body}>
        {segment.type === 'timed' && (
          <TimedSegment
            key={segIndex}
            segment={segment}
            nextSegName={!isLast ? nextSegName : null}
            isPaused={isPaused}
            audioEnabled={audioEnabled}
            onAutoAdvance={handleNext}
          />
        )}
        {segment.type === 'sets_reps' && (
          <SetsRepsSegment
            key={segIndex}
            segment={segment}
            segIndex={segIndex}
            exerciseNum={exerciseNum}
            totalExercises={setsRepsOnly.length}
            prevExerciseName={prevExercise}
            audioEnabled={audioEnabled}
            onSetComplete={handleSetComplete}
            onAdvance={handleNext}
          />
        )}
      </div>

      {/* Controls — timed segments only */}
      {segment.type === 'timed' && (
        <div style={s.controls}>
          <button style={s.nextBtn} onClick={handleNext}>
            {isLast ? 'Finish →' : 'Next segment →'}
          </button>
          <button style={s.pauseBtn} onClick={() => setIsPaused(p => !p)}>
            {isPaused ? 'Resume' : 'Pause'}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Timed segment ─────────────────────────────────────────────────────────────

function TimedSegment({ segment, nextSegName, isPaused, audioEnabled, onAutoAdvance }) {
  const duration  = segment.duration ?? 0
  const [remaining, setRemaining] = useState(duration)
  const intervalRef   = useRef(null)
  const spoke60Ref    = useRef(false)
  const spoke0Ref     = useRef(false)
  const advancedRef   = useRef(false)

  // Speak segment name on mount
  useEffect(() => {
    if (audioEnabled) speakText(segment.name)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Countdown tick
  useEffect(() => {
    clearInterval(intervalRef.current)
    if (isPaused || remaining <= 0) return

    intervalRef.current = setInterval(() => {
      setRemaining(r => Math.max(0, r - 1))
    }, 1000)

    return () => clearInterval(intervalRef.current)
  }, [isPaused, remaining <= 0])  // restart interval only when pause state or "done" state changes

  // Audio cues and auto-advance
  useEffect(() => {
    if (!spoke60Ref.current && remaining <= 60 && remaining > 0) {
      if (audioEnabled) speakText('One minute left')
      spoke60Ref.current = true
    }
    if (!spoke0Ref.current && remaining === 0) {
      if (audioEnabled) speakText('Segment complete')
      spoke0Ref.current = true
    }
    if (!advancedRef.current && remaining === 0) {
      advancedRef.current = true
      const timer = setTimeout(onAutoAdvance, 2000)
      return () => clearTimeout(timer)
    }
  // onAutoAdvance is stable (useCallback in parent); remaining is the only variable dep
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining])

  const progress   = duration > 0 ? remaining / duration : 0
  const dashOffset = RING_CIRCUMFERENCE * (1 - progress)

  return (
    <div style={t.wrap}>
      <p style={t.sectionLabel}>
        {SECTION_LABELS[segment.section] ?? (segment.section ?? '').toUpperCase()}
      </p>

      <p style={t.segName}>{segment.name}</p>

      {segment.effort && (
        <p style={t.effort}>{segment.effort}</p>
      )}

      {segment.instruction && (
        <p style={t.instruction}>{segment.instruction}</p>
      )}

      {/* SVG countdown ring */}
      <div style={t.ringWrap}>
        <svg width={180} height={180} viewBox="0 0 180 180" style={{ display: 'block' }}>
          {/* Track */}
          <circle
            cx={90} cy={90} r={RING_RADIUS}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth={8}
          />
          {/* Progress arc */}
          <circle
            cx={90} cy={90} r={RING_RADIUS}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 90 90)"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <div style={t.ringCenter}>
          <span style={t.ringTime}>{fmtMMSS(remaining)}</span>
          {remaining === 0 && <span style={t.ringDone}>Done</span>}
        </div>
      </div>

      {nextSegName && (
        <p style={t.nextPreview}>Up next: {nextSegName}</p>
      )}
    </div>
  )
}

// ─── Sets / reps segment ───────────────────────────────────────────────────────

function SetsRepsSegment({
  segment, segIndex, exerciseNum, totalExercises,
  prevExerciseName, audioEnabled, onSetComplete, onAdvance,
}) {
  const count = segment.sets ?? 0

  const [setReps,    setSetReps]    = useState(() => Array(count).fill(segment.reps ?? 0))
  const [setDone,    setSetDone]    = useState(() => Array(count).fill(false))
  const [editingSet, setEditingSet] = useState(null)
  const [showCues,   setShowCues]   = useState(false)
  const [isResting,  setIsResting]  = useState(false)
  const [restLeft,   setRestLeft]   = useState(0)
  const restRef         = useRef(null)
  const restStartedRef  = useRef(false)

  useEffect(() => () => clearInterval(restRef.current), [])

  const allDone = count > 0 && setDone.every(Boolean)

  // Start rest timer once all sets are done
  useEffect(() => {
    if (!allDone || restStartedRef.current) return
    restStartedRef.current = true

    const seconds = segment.restSeconds ?? 90
    setIsResting(true)
    setRestLeft(seconds)
    if (audioEnabled) speakText('Rest')

    let timeLeft = seconds
    clearInterval(restRef.current)
    restRef.current = setInterval(() => {
      timeLeft -= 1
      setRestLeft(timeLeft)
      if (timeLeft <= 0) {
        clearInterval(restRef.current)
        setIsResting(false)
        if (audioEnabled) speakText('Next exercise')
        onAdvance()
      }
    }, 1000)
  // audioEnabled and onAdvance are stable for this segment's lifetime
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDone])

  function markSetDone(index) {
    if (setDone[index]) return
    setSetDone(prev => {
      const next = [...prev]
      next[index] = true
      return next
    })
    onSetComplete(segIndex, index, setReps[index])
  }

  function updateReps(index, value) {
    const parsed = parseInt(value, 10)
    const reps   = isNaN(parsed) ? 0 : Math.max(0, parsed)
    setSetReps(prev => {
      const next = [...prev]
      next[index] = reps
      return next
    })
  }

  function skipRest() {
    clearInterval(restRef.current)
    setIsResting(false)
    setRestLeft(0)
    onAdvance()
  }

  const { loadSuggestion, cues, rpeTarget } = segment

  return (
    <div style={r.wrap}>
      {prevExerciseName && (
        <p style={r.prevExercise}>Previous: {prevExerciseName}</p>
      )}

      <p style={r.sectionLabel}>
        {SECTION_LABELS[segment.section] ?? 'MAIN'}
      </p>

      <p style={r.exerciseName}>{segment.name}</p>

      <p style={r.setsReps}>
        {segment.sets} × {segment.reps}
      </p>

      {rpeTarget != null && (
        <span style={r.rpeBadge}>RPE {rpeTarget}</span>
      )}

      {/* Load suggestion */}
      {loadSuggestion && (
        <div style={r.loadCard}>
          <p style={r.loadSuggestion}>{loadSuggestion.suggestion}</p>
          {loadSuggestion.basis && (
            <p style={r.loadBasis}>{loadSuggestion.basis}</p>
          )}
        </div>
      )}

      {/* Form cues — collapsible */}
      {cues && cues.length > 0 && (
        <div style={r.cuesWrap}>
          <button
            style={r.cuesToggle}
            onClick={() => setShowCues(v => !v)}
          >
            Form cues {showCues ? '▲' : '▼'}
          </button>
          {showCues && (
            <ul style={r.cuesList}>
              {cues.map((cue, i) => (
                <li key={i} style={r.cueItem}>{cue}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Set rows */}
      <div style={r.setList}>
        {setDone.map((done, i) => (
          <div
            key={i}
            style={{
              ...r.setRow,
              background:  done ? 'var(--color-success-bg)' : 'var(--color-card)',
              borderColor: done ? 'var(--color-success)'    : 'var(--color-border)',
            }}
          >
            <span style={{ ...r.setLabel, color: done ? 'var(--color-success)' : 'var(--color-muted)' }}>
              Set {i + 1}
            </span>

            {/* Inline reps editor */}
            {editingSet === i && !done ? (
              <input
                type="number"
                min={0}
                value={setReps[i]}
                style={r.repsInput}
                autoFocus
                onChange={e => updateReps(i, e.target.value)}
                onBlur={() => setEditingSet(null)}
              />
            ) : (
              <button
                style={{ ...r.repsBtn, color: done ? 'var(--color-success)' : 'var(--color-text)' }}
                onClick={() => !done && setEditingSet(i)}
                disabled={done}
              >
                {setReps[i]}
              </button>
            )}

            {/* Checkbox */}
            <button
              style={{
                ...r.checkBtn,
                background:   done ? 'var(--color-success)'    : 'transparent',
                borderColor:  done ? 'var(--color-success)'    : 'var(--color-border)',
                color:        done ? '#fff'                    : 'var(--color-muted)',
              }}
              onClick={() => markSetDone(i)}
              disabled={done}
              aria-label={`Mark set ${i + 1} complete`}
            >
              {done ? '✓' : '○'}
            </button>
          </div>
        ))}
      </div>

      {/* Exercise counter */}
      {exerciseNum != null && totalExercises > 1 && (
        <p style={r.exerciseCounter}>
          Exercise {exerciseNum} of {totalExercises}
        </p>
      )}

      {/* Rest timer */}
      {isResting && restLeft > 0 && (
        <div style={r.restCard}>
          <div style={r.restLeft}>
            <span style={r.restLabel}>Rest</span>
            <span style={r.restTime}>{fmtMMSS(restLeft)}</span>
          </div>
          <button style={r.skipRestBtn} onClick={skipRest}>
            Skip rest →
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Post-workout log ──────────────────────────────────────────────────────────

function PostWorkoutLog({ durationMin, onSave, onSkip }) {
  const [feel,  setFeel]  = useState(3)
  const [notes, setNotes] = useState('')

  return (
    <div style={pw.wrap}>
      <h2 style={pw.title}>Workout complete.</h2>
      <p style={pw.duration}>{durationMin} minute{durationMin === 1 ? '' : 's'}</p>

      <div style={pw.field}>
        <p style={pw.fieldLabel}>How did that feel?</p>
        <div style={pw.feelRow}>
          {FEEL_OPTIONS.map(opt => (
            <button
              key={opt.value}
              style={{
                ...pw.feelBtn,
                background:  feel === opt.value ? 'var(--color-accent)'    : 'var(--color-card)',
                borderColor: feel === opt.value ? 'var(--color-accent)'    : 'var(--color-border)',
                color:       feel === opt.value ? '#fff'                   : 'var(--color-muted)',
              }}
              onClick={() => setFeel(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div style={pw.field}>
        <textarea
          style={pw.notes}
          value={notes}
          rows={3}
          placeholder="Any notes? (optional)"
          onChange={e => setNotes(e.target.value)}
        />
      </div>

      <button style={pw.saveBtn} onClick={() => onSave(feel, notes.trim())}>
        Save workout
      </button>
      <button style={pw.skipBtn} onClick={onSkip}>
        Skip saving
      </button>
    </div>
  )
}

// ─── Styles ────────────────────────────────────────────────────────────────────

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
    overflowY:     'auto',
  },
  header: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   '16px',
    flexShrink:     0,
  },
  closeBtn: {
    background: 'none',
    border:     'none',
    color:      'var(--color-muted)',
    fontSize:   '18px',
    cursor:     'pointer',
    padding:    '4px',
    lineHeight: 1,
  },
  headerCounter: {
    fontSize:      '11px',
    color:         'var(--color-muted)',
    fontWeight:    600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },
  body: {
    flex:           1,
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    justifyContent: 'flex-start',
    paddingTop:     '8px',
  },
  controls: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '10px',
    marginTop:     '20px',
    flexShrink:    0,
  },
  nextBtn: {
    padding:      '16px',
    borderRadius: 'var(--radius-card)',
    background:   'var(--color-accent)',
    color:        '#fff',
    fontSize:     '16px',
    fontWeight:   600,
    border:       'none',
    cursor:       'pointer',
  },
  pauseBtn: {
    padding:    '10px',
    background: 'none',
    border:     'none',
    color:      'var(--color-muted)',
    fontSize:   '13px',
    fontWeight: 500,
    cursor:     'pointer',
    textAlign:  'center',
  },

  // Close confirmation
  confirmOverlay: {
    position:        'absolute',
    inset:           0,
    background:      'rgba(0,0,0,0.7)',
    zIndex:          10,
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    padding:         '24px',
  },
  confirmBox: {
    background:    'var(--color-card)',
    border:        'var(--border)',
    borderRadius:  'var(--radius-card)',
    padding:       '28px 24px',
    width:         '100%',
    maxWidth:      340,
    display:       'flex',
    flexDirection: 'column',
    gap:           '12px',
    textAlign:     'center',
  },
  confirmTitle: {
    fontFamily: 'var(--font-display)',
    fontSize:   '20px',
    color:      'var(--color-text)',
  },
  confirmSub: {
    fontSize:  '13px',
    color:     'var(--color-muted)',
    marginTop: '-6px',
  },
  confirmEndBtn: {
    padding:      '14px',
    borderRadius: 'var(--radius-sm)',
    background:   'var(--color-danger)',
    color:        '#fff',
    fontSize:     '14px',
    fontWeight:   600,
    border:       'none',
    cursor:       'pointer',
    marginTop:    '4px',
  },
  confirmKeepBtn: {
    padding:    '10px',
    background: 'none',
    border:     'none',
    color:      'var(--color-muted)',
    fontSize:   '13px',
    fontWeight: 500,
    cursor:     'pointer',
  },
}

// Timed segment styles
const t = {
  wrap: {
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    gap:            '10px',
    width:          '100%',
    textAlign:      'center',
  },
  sectionLabel: {
    fontSize:      '9px',
    fontWeight:    700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color:         'var(--color-muted)',
    marginBottom:  '2px',
  },
  segName: {
    fontFamily: 'var(--font-display)',
    fontSize:   '28px',
    color:      'var(--color-text)',
    lineHeight: 1.15,
  },
  effort: {
    fontSize: '13px',
    color:    'var(--color-muted)',
    marginTop: '-4px',
  },
  instruction: {
    fontSize:   '13px',
    color:      'var(--color-muted)',
    maxWidth:   '280px',
    lineHeight: 1.4,
    display:    '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow:   'hidden',
  },
  ringWrap: {
    position: 'relative',
    width:    '180px',
    height:   '180px',
    margin:   '8px auto 0',
    flexShrink: 0,
  },
  ringCenter: {
    position:       'absolute',
    inset:          0,
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            '2px',
  },
  ringTime: {
    fontFamily: 'var(--font-display)',
    fontSize:   '32px',
    color:      'var(--color-text)',
    lineHeight: 1,
    letterSpacing: '-0.5px',
  },
  ringDone: {
    fontSize:  '11px',
    color:     'var(--color-success)',
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },
  nextPreview: {
    fontSize:   '11px',
    color:      'var(--color-muted)',
    marginTop:  '4px',
  },
}

// Sets/reps segment styles
const r = {
  wrap: {
    display:       'flex',
    flexDirection: 'column',
    alignItems:    'stretch',
    gap:           '10px',
    width:         '100%',
    maxWidth:      '360px',
  },
  prevExercise: {
    fontSize:  '11px',
    color:     'var(--color-muted)',
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize:      '9px',
    fontWeight:    700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color:         'var(--color-muted)',
    textAlign:     'center',
  },
  exerciseName: {
    fontFamily: 'var(--font-display)',
    fontSize:   '28px',
    color:      'var(--color-text)',
    textAlign:  'center',
    lineHeight: 1.15,
  },
  setsReps: {
    fontSize:   '20px',
    color:      'var(--color-accent)',
    fontWeight: 700,
    textAlign:  'center',
    marginTop:  '-4px',
  },
  rpeBadge: {
    alignSelf:    'center',
    padding:      '3px 10px',
    borderRadius: 'var(--radius-pill)',
    background:   'var(--color-accent-bg)',
    border:       '0.5px solid var(--color-accent)',
    color:        'var(--color-accent)',
    fontSize:     '11px',
    fontWeight:   600,
  },
  loadCard: {
    background:   'var(--color-card)',
    border:       'var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding:      '10px 12px',
    display:      'flex',
    flexDirection:'column',
    gap:          '2px',
  },
  loadSuggestion: {
    fontSize:   '13px',
    color:      'var(--color-text)',
    lineHeight: 1.4,
  },
  loadBasis: {
    fontSize: '11px',
    color:    'var(--color-muted)',
  },
  cuesWrap: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '6px',
  },
  cuesToggle: {
    background: 'none',
    border:     'none',
    color:      'var(--color-muted)',
    fontSize:   '12px',
    fontWeight: 600,
    cursor:     'pointer',
    padding:    '4px 0',
    textAlign:  'left',
  },
  cuesList: {
    margin:     0,
    paddingLeft:'16px',
    display:    'flex',
    flexDirection: 'column',
    gap:        '4px',
  },
  cueItem: {
    fontSize:   '12px',
    color:      'var(--color-muted)',
    lineHeight: 1.4,
  },
  setList: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '8px',
  },
  setRow: {
    display:       'flex',
    alignItems:    'center',
    gap:           '12px',
    padding:       '12px 14px',
    borderRadius:  'var(--radius-sm)',
    border:        '0.5px solid',
    transition:    'background 0.15s, border-color 0.15s',
  },
  setLabel: {
    fontSize:  '14px',
    fontWeight: 500,
    flex:      1,
  },
  repsBtn: {
    fontFamily: 'var(--font-display)',
    fontSize:   '18px',
    fontWeight: 600,
    background: 'none',
    border:     'none',
    cursor:     'pointer',
    minWidth:   '36px',
    textAlign:  'center',
    padding:    '2px 4px',
  },
  repsInput: {
    fontFamily:   'var(--font-display)',
    fontSize:     '18px',
    fontWeight:   600,
    width:        '52px',
    textAlign:    'center',
    background:   'var(--color-bg)',
    border:       '1px solid var(--color-accent)',
    borderRadius: 'var(--radius-sm)',
    color:        'var(--color-text)',
    padding:      '2px 4px',
    outline:      'none',
  },
  checkBtn: {
    width:        '32px',
    height:       '32px',
    borderRadius: '50%',
    border:       '1.5px solid',
    background:   'transparent',
    fontSize:     '14px',
    fontWeight:   700,
    cursor:       'pointer',
    flexShrink:   0,
    display:      'flex',
    alignItems:   'center',
    justifyContent: 'center',
    transition:   'background 0.15s, border-color 0.15s',
  },
  exerciseCounter: {
    fontSize:  '11px',
    color:     'var(--color-muted)',
    textAlign: 'center',
    marginTop: '4px',
  },
  restCard: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    padding:        '12px 14px',
    background:     'var(--color-accent-bg)',
    border:         '0.5px solid var(--color-accent)',
    borderRadius:   'var(--radius-sm)',
    marginTop:      '6px',
  },
  restLeft: {
    display:    'flex',
    alignItems: 'baseline',
    gap:        '8px',
  },
  restLabel: {
    fontSize:   '11px',
    fontWeight: 700,
    color:      'var(--color-accent)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  restTime: {
    fontFamily: 'var(--font-display)',
    fontSize:   '20px',
    color:      'var(--color-accent)',
  },
  skipRestBtn: {
    background: 'none',
    border:     'none',
    color:      'var(--color-accent)',
    fontSize:   '12px',
    fontWeight: 600,
    cursor:     'pointer',
    padding:    '4px 0',
  },
}

// Post-workout log styles
const pw = {
  wrap: {
    flex:          1,
    display:       'flex',
    flexDirection: 'column',
    gap:           '20px',
    paddingTop:    '16px',
    paddingBottom: '8px',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize:   '24px',
    color:      'var(--color-text)',
    textAlign:  'center',
  },
  duration: {
    fontSize:  '13px',
    color:     'var(--color-muted)',
    textAlign: 'center',
    marginTop: '-14px',
  },
  field: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '8px',
  },
  fieldLabel: {
    fontSize:      '11px',
    fontWeight:    600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color:         'var(--color-muted)',
  },
  feelRow: {
    display: 'flex',
    gap:     '6px',
  },
  feelBtn: {
    flex:         1,
    padding:      '10px 4px',
    borderRadius: 'var(--radius-sm)',
    border:       '0.5px solid',
    fontSize:     '13px',
    fontWeight:   600,
    cursor:       'pointer',
    transition:   'background 0.15s, border-color 0.15s, color 0.15s',
  },
  notes: {
    background:   'var(--color-card)',
    border:       'var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding:      '12px',
    color:        'var(--color-text)',
    fontFamily:   'var(--font-body)',
    fontSize:     '14px',
    resize:       'vertical',
    outline:      'none',
    width:        '100%',
    boxSizing:    'border-box',
  },
  saveBtn: {
    width:        '100%',
    padding:      '16px',
    borderRadius: 'var(--radius-card)',
    background:   'var(--color-accent)',
    color:        '#fff',
    fontSize:     '15px',
    fontWeight:   600,
    border:       'none',
    cursor:       'pointer',
    marginTop:    '4px',
  },
  skipBtn: {
    width:      '100%',
    padding:    '12px',
    background: 'transparent',
    border:     'none',
    color:      'var(--color-muted)',
    fontSize:   '13px',
    fontWeight: 500,
    cursor:     'pointer',
  },
}
