import { useState, useEffect, useRef } from 'react'
import { useFitness } from '../context/index.js'

const PRESETS        = [15, 25, 45, 60]
const TOTAL_SESSIONS = 4
const CIRCUMFERENCE  = 2 * Math.PI * 88  // 552.92px

function formatTime(secs) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function ringStroke(progress, isDone) {
  if (isDone)          return 'var(--color-success)'
  if (progress > 0.4)  return 'var(--color-accent)'
  if (progress > 0.2)  return 'var(--color-accent-light)'
  return 'var(--color-danger)'
}

export default function FocusTimer({ onClose }) {
  const { fitnessDispatch } = useFitness()

  const [selectedMins,       setSelectedMins]       = useState(25)
  const [timeLeft,           setTimeLeft]           = useState(25 * 60)
  const [status,             setStatus]             = useState('ready') // ready | running | paused | done
  const [completedSessions,  setCompletedSessions]  = useState(0)
  const [taskLabel,          setTaskLabel]          = useState('')

  const intervalRef = useRef(null)

  // Tick — runs only while status === 'running'
  useEffect(() => {
    if (status !== 'running') return
    intervalRef.current = setInterval(() => {
      setTimeLeft(t => Math.max(0, t - 1))
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [status])

  // Completion — fires when timeLeft hits 0 during a running session
  useEffect(() => {
    if (status !== 'running' || timeLeft !== 0) return
    clearInterval(intervalRef.current)
    const nextCompleted = Math.min(completedSessions + 1, TOTAL_SESSIONS)
    setStatus('done')
    setCompletedSessions(nextCompleted)
    fitnessDispatch({ type: 'INCREMENT_FOCUS_SESSIONS' })
    const timeout = setTimeout(() => {
      setTimeLeft(selectedMins * 60)
      setStatus('ready')
    }, 2000)
    return () => clearTimeout(timeout)
    // completedSessions intentionally omitted — nextCompleted captures it at call time
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, status])

  // Clear interval on unmount
  useEffect(() => () => clearInterval(intervalRef.current), [])

  const isDone     = status === 'done'
  const progress   = timeLeft / (selectedMins * 60)  // 1.0 = full, 0.0 = empty
  const dashOffset = CIRCUMFERENCE * (1 - progress)
  const strokeColor = ringStroke(progress, isDone)

  const STATUS_LABEL = { ready: 'ready', running: 'focusing', paused: 'paused', done: 'done ✓' }
  // "Session X of 4" — X is the session currently being worked, capped at TOTAL_SESSIONS
  const sessionDisplay = Math.min(
    isDone ? completedSessions : completedSessions + 1,
    TOTAL_SESSIONS
  )

  function handlePreset(mins) {
    if (status !== 'ready') return
    setSelectedMins(mins)
    setTimeLeft(mins * 60)
  }

  function handlePlayPause() {
    if (isDone) return
    if (status === 'ready' || status === 'paused') setStatus('running')
    else setStatus('paused')
  }

  function handleReset() {
    clearInterval(intervalRef.current)
    setTimeLeft(selectedMins * 60)
    setStatus('ready')
  }

  function handleSkip() {
    if (status === 'ready' || isDone) return
    clearInterval(intervalRef.current)
    const nextCompleted = Math.min(completedSessions + 1, TOTAL_SESSIONS)
    setStatus('done')
    setCompletedSessions(nextCompleted)
    fitnessDispatch({ type: 'INCREMENT_FOCUS_SESSIONS' })
    setTimeout(() => {
      setTimeLeft(selectedMins * 60)
      setStatus('ready')
    }, 2000)
  }

  return (
    <div style={s.screen}>
      {/* Placeholder style for the task input */}
      <style>{`.focus-task-input::placeholder { color: var(--color-faint); }`}</style>

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div style={s.topBar}>
        <button style={s.backBtn} onClick={onClose} aria-label="Close focus timer">
          ←
        </button>
        <span style={s.sessionCounter}>
          Session {sessionDisplay} of {TOTAL_SESSIONS}
        </span>
      </div>

      {/* ── Preset pills ────────────────────────────────────────────────── */}
      <div style={s.presets}>
        {PRESETS.map(mins => {
          const active = selectedMins === mins
          const locked = status !== 'ready'
          return (
            <button
              key={mins}
              style={{
                ...s.presetPill,
                background:    active ? 'var(--color-accent)'    : 'var(--color-card)',
                color:         active ? '#fff'                   : 'var(--color-muted)',
                border:        active ? '0.5px solid var(--color-accent)' : 'var(--border)',
                opacity:       locked ? 0.4 : 1,
                pointerEvents: locked ? 'none' : 'auto',
              }}
              onClick={() => handlePreset(mins)}
            >
              {mins}m
            </button>
          )
        })}
      </div>

      {/* ── SVG ring ────────────────────────────────────────────────────── */}
      <div style={s.ringWrap}>
        <svg width="200" height="200" viewBox="0 0 200 200" style={{ display: 'block' }}>
          {/* Track circle */}
          <circle
            cx="100" cy="100" r="88"
            fill="none"
            strokeWidth="8"
            style={{ stroke: 'var(--color-chart-bar)' }}
          />
          {/* Progress arc — rotated so 0% starts at 12 o'clock */}
          <circle
            cx="100" cy="100" r="88"
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 100 100)"
            style={{ stroke: strokeColor, transition: 'stroke-dashoffset 1s linear, stroke 0.4s ease' }}
          />
        </svg>

        {/* Center overlay */}
        <div style={s.ringCenter}>
          <span style={s.timeDisplay}>{formatTime(timeLeft)}</span>
          <span style={{
            ...s.statusLabel,
            color: isDone ? 'var(--color-success)' : 'var(--color-muted)',
          }}>
            {STATUS_LABEL[status]}
          </span>
        </div>
      </div>

      {/* ── Task label input ─────────────────────────────────────────────── */}
      <input
        className="focus-task-input"
        type="text"
        value={taskLabel}
        onChange={e => setTaskLabel(e.target.value)}
        placeholder="What are you focusing on?"
        style={s.taskInput}
      />

      {/* ── Controls ────────────────────────────────────────────────────── */}
      <div style={s.controls}>
        <button
          style={s.controlBtn}
          onClick={handleReset}
          aria-label="Reset timer"
        >
          ↺
        </button>

        <button
          style={{
            ...s.playBtn,
            background: isDone ? 'var(--color-success)' : 'var(--color-accent)',
          }}
          onClick={handlePlayPause}
          disabled={isDone}
          aria-label={status === 'running' ? 'Pause' : 'Play'}
        >
          {status === 'running' ? '⏸' : '▶'}
        </button>

        <button
          style={{
            ...s.controlBtn,
            opacity: (status === 'ready' || isDone) ? 0.35 : 1,
            pointerEvents: (status === 'ready' || isDone) ? 'none' : 'auto',
          }}
          onClick={handleSkip}
          aria-label="Skip session"
        >
          ⇥
        </button>
      </div>

      {/* ── Session dots ─────────────────────────────────────────────────── */}
      <div style={s.dots}>
        {Array.from({ length: TOTAL_SESSIONS }).map((_, i) => (
          <div
            key={i}
            style={{
              ...s.dot,
              background: i < completedSessions
                ? 'var(--color-accent)'
                : 'var(--color-faint)',
            }}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = {
  screen: {
    minHeight:      '100dvh',
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    justifyContent: 'space-evenly',
    background:     'var(--color-bg)',
    paddingTop:     'var(--safe-top)',
    paddingBottom:  'calc(var(--safe-bottom) + var(--space-8))',
    paddingLeft:    'var(--space-6)',
    paddingRight:   'var(--space-6)',
  },

  topBar: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    width:          '100%',
  },
  backBtn: {
    fontSize:   '22px',
    color:      'var(--color-muted)',
    background: 'none',
    border:     'none',
    cursor:     'pointer',
    padding:    '4px 12px 4px 0',
    lineHeight: 1,
  },
  sessionCounter: {
    fontSize:   '13px',
    color:      'var(--color-muted)',
    fontWeight: 500,
  },

  presets: {
    display: 'flex',
    gap:     'var(--space-2)',
  },
  presetPill: {
    padding:       '8px 18px',
    borderRadius:  'var(--radius-pill)',
    fontSize:      '14px',
    fontWeight:    500,
    cursor:        'pointer',
    transition:    'background 0.15s, color 0.15s, opacity 0.15s',
  },

  ringWrap: {
    position: 'relative',
    width:    '200px',
    height:   '200px',
  },
  ringCenter: {
    position:       'absolute',
    top:            '50%',
    left:           '50%',
    transform:      'translate(-50%, -50%)',
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    gap:            '6px',
    pointerEvents:  'none',
  },
  timeDisplay: {
    fontFamily:    'var(--font-display)',
    fontSize:      '38px',
    color:         'var(--color-text)',
    lineHeight:    1,
    letterSpacing: '-1px',
  },
  statusLabel: {
    fontSize:   '13px',
    fontWeight: 500,
    transition: 'color 0.3s',
  },

  taskInput: {
    width:        '100%',
    maxWidth:     '300px',
    textAlign:    'center',
    fontSize:     '15px',
    color:        'var(--color-text)',
    background:   'none',
    border:       'none',
    borderBottom: '0.5px solid var(--color-faint)',
    outline:      'none',
    padding:      '8px 0',
    fontFamily:   'var(--font-body)',
  },

  controls: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            'var(--space-8)',
    width:          '100%',
  },
  controlBtn: {
    fontSize:   '24px',
    color:      'var(--color-muted)',
    background: 'none',
    border:     'none',
    cursor:     'pointer',
    width:      '44px',
    height:     '44px',
    display:    'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius:   '50%',
    transition: 'color 0.15s, opacity 0.15s',
  },
  playBtn: {
    width:          '64px',
    height:         '64px',
    borderRadius:   '50%',
    border:         'none',
    cursor:         'pointer',
    fontSize:       '22px',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    color:          '#fff',
    transition:     'background 0.3s',
    flexShrink:     0,
  },

  dots: {
    display: 'flex',
    gap:     'var(--space-3)',
  },
  dot: {
    width:        '8px',
    height:       '8px',
    borderRadius: '50%',
    transition:   'background 0.3s',
  },
}
