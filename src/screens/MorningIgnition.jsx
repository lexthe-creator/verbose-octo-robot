import { useState, useRef } from 'react'
import { useApp } from '../context/AppContext.jsx'

const ENERGY_OPTIONS = [
  { value: 1, emoji: '😴', label: 'Drained' },
  { value: 2, emoji: '😐', label: 'Flat' },
  { value: 3, emoji: '🙂', label: 'Good' },
  { value: 4, emoji: '⚡', label: 'Charged' },
]

// Evaluated once — true on mouse/trackpad devices, false on touch-only
const canHover = typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches

// ─── Swipeable row ────────────────────────────────────────────────────────────
function SwipeRow({ label, sublabel, confirmed, onConfirm }) {
  const [offset, setOffset] = useState(0)
  const [swiping, setSwiping] = useState(false)
  const startX    = useRef(null)
  const isDragging = useRef(false)
  const THRESHOLD = 80

  // ── Touch handlers ──────────────────────────────────────────────────────────
  function onTouchStart(e) {
    if (confirmed) return
    startX.current = e.touches[0].clientX
    setSwiping(true)
  }
  function onTouchMove(e) {
    if (confirmed || startX.current === null) return
    const delta = Math.max(0, e.touches[0].clientX - startX.current)
    setOffset(delta)
  }
  function onTouchEnd() {
    if (confirmed) return
    if (offset >= THRESHOLD) onConfirm()
    setOffset(0)
    setSwiping(false)
    startX.current = null
  }

  // ── Mouse handlers ──────────────────────────────────────────────────────────
  function onMouseDown(e) {
    if (confirmed) return
    startX.current   = e.clientX
    isDragging.current = true
    setSwiping(true)
  }
  function onMouseMove(e) {
    if (confirmed || !isDragging.current || startX.current === null) return
    const delta = Math.max(0, e.clientX - startX.current)
    setOffset(delta)
  }
  function onMouseUp() {
    if (!isDragging.current) return
    isDragging.current = false
    if (!confirmed && offset >= THRESHOLD) onConfirm()
    setOffset(0)
    setSwiping(false)
    startX.current = null
  }
  function onMouseLeave() {
    if (!isDragging.current) return
    isDragging.current = false
    setOffset(0)
    setSwiping(false)
    startX.current = null
  }

  const progress = Math.min(offset / THRESHOLD, 1)
  const bg = confirmed
    ? 'var(--color-success-bg)'
    : `rgba(29, 158, 117, ${progress * 0.25})`
  const borderColor = confirmed ? 'var(--color-success)' : `rgba(29,158,117,${progress * 0.8})`

  return (
    <div
      style={{ ...swipeStyles.wrap, background: bg, border: `0.5px solid ${borderColor}` }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
    >
      <div
        style={{
          ...swipeStyles.inner,
          transform:  `translateX(${confirmed ? 0 : offset}px)`,
          transition: swiping ? 'none' : 'transform 0.25s var(--ease-out)',
        }}
      >
        <div style={swipeStyles.text}>
          <span style={{ ...swipeStyles.label, color: confirmed ? 'var(--color-success)' : 'var(--color-text)', textDecoration: confirmed ? 'line-through' : 'none', opacity: confirmed ? 0.7 : 1 }}>
            {label}
          </span>
          {sublabel && (
            <span style={swipeStyles.sublabel}>{sublabel}</span>
          )}
        </div>

        {/* Right-side action: confirm button (hover devices) or swipe arrow (touch) */}
        {canHover ? (
          confirmed ? (
            <span style={{ ...swipeStyles.checkmark, opacity: 1 }}>✓</span>
          ) : (
            <button
              style={swipeStyles.confirmBtn}
              onClick={e => { e.stopPropagation(); onConfirm() }}
              aria-label="Confirm"
            >
              ✓
            </button>
          )
        ) : (
          <span style={{ ...swipeStyles.checkmark, opacity: confirmed ? 1 : progress }}>
            {confirmed ? '✓' : '→'}
          </span>
        )}
      </div>

      {!confirmed && !canHover && (
        <div style={{ ...swipeStyles.hint, opacity: offset === 0 ? 0.35 : 0 }}>
          swipe →
        </div>
      )}
    </div>
  )
}

const swipeStyles = {
  wrap: {
    borderRadius:   'var(--radius-sm)',
    overflow:       'hidden',
    position:       'relative',
    userSelect:     'none',
    touchAction:    'pan-y',
  },
  inner: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    padding:        '14px 16px',
    gap:            '8px',
  },
  text: {
    display:        'flex',
    flexDirection:  'column',
    gap:            '2px',
    flex:           1,
  },
  label: {
    fontSize:    '15px',
    fontWeight:  500,
  },
  sublabel: {
    fontSize:    '12px',
    color:       'var(--color-muted)',
  },
  checkmark: {
    fontSize:   '18px',
    color:      'var(--color-success)',
    fontWeight: 600,
    flexShrink: 0,
    transition: 'opacity 0.15s',
  },
  confirmBtn: {
    width:           '28px',
    height:          '28px',
    borderRadius:    '50%',
    background:      'var(--color-accent)',
    border:          'none',
    color:           '#fff',
    fontSize:        '14px',
    fontWeight:      600,
    cursor:          'pointer',
    flexShrink:      0,
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    transition:      'opacity 0.15s',
  },
  hint: {
    position:      'absolute',
    right:         '16px',
    top:           '50%',
    transform:     'translateY(-50%)',
    fontSize:      '11px',
    color:         'var(--color-muted)',
    transition:    'opacity 0.3s',
    pointerEvents: 'none',
  },
}

// ─── Meal tap slot ────────────────────────────────────────────────────────────
function MealSlot({ label, startTime, endTime, confirmed, onConfirm }) {
  const windowLabel = `${startTime} – ${endTime}`
  return (
    <button
      style={{
        ...mealStyles.slot,
        background:   confirmed ? 'var(--color-success-bg)' : 'var(--color-card)',
        border:       confirmed ? '0.5px solid var(--color-success)' : 'var(--border)',
      }}
      onClick={onConfirm}
    >
      <span style={{ ...mealStyles.label, color: confirmed ? 'var(--color-success)' : 'var(--color-text)' }}>
        {confirmed ? '✓ ' : ''}{label}
      </span>
      <span style={mealStyles.window}>{windowLabel}</span>
    </button>
  )
}

const mealStyles = {
  slot: {
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'flex-start',
    padding:        '12px 14px',
    borderRadius:   'var(--radius-sm)',
    cursor:         'pointer',
    transition:     'background 0.2s, border-color 0.2s',
    textAlign:      'left',
  },
  label: {
    fontSize:   '14px',
    fontWeight: 600,
  },
  window: {
    fontSize: '11px',
    color:    'var(--color-muted)',
    marginTop: '2px',
  },
}

// Default meal windows applied at lock time
const MEAL_DEFAULTS = {
  breakfast: { startTime: '07:00', endTime: '09:00' },
  lunch:     { startTime: '12:00', endTime: '14:00' },
  snack:     { startTime: '15:00', endTime: '17:00' },
  dinner:    { startTime: '19:00', endTime: '21:00' },
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function MorningIgnition({ onComplete }) {
  const { state, dispatch } = useApp()
  const [step, setStep] = useState('energy') // 'energy' | 'brief' | 'locked'

  // Local brief state (mirrors what gets committed on lock)
  const [localEnergy,  setLocalEnergy]  = useState(state.energyLevel)
  const [localTasks,   setLocalTasks]   = useState([])  // confirmed task ids
  const [localMeals,   setLocalMeals]   = useState([])  // confirmed meal slots
  const [localWorkout, setLocalWorkout] = useState(false)

  const TOTAL_ITEMS = 8 // 3 tasks + 1 workout + 4 meals
  const confirmedCount = localTasks.length + localMeals.length + (localWorkout ? 1 : 0)
  const progress = confirmedCount / TOTAL_ITEMS
  const allConfirmed = confirmedCount === TOTAL_ITEMS

  const today = new Date()
  const dayLabel = today.toLocaleDateString('en-US', { weekday: 'long' })
  const dateLabel = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })

  function confirmTask(id) {
    if (!localTasks.includes(id)) setLocalTasks(prev => [...prev, id])
  }
  function confirmMeal(slot) {
    if (!localMeals.includes(slot)) setLocalMeals(prev => [...prev, slot])
  }

  function handleLockDay() {
    dispatch({ type: 'SET_ENERGY', payload: localEnergy })
    localTasks.forEach(id => dispatch({ type: 'CONFIRM_TASK', payload: id }))
    localMeals.forEach(slot => dispatch({
      type: 'CONFIRM_MEAL',
      payload: { slot, ...MEAL_DEFAULTS[slot] },
    }))
    if (localWorkout) dispatch({ type: 'CONFIRM_WORKOUT' })
    dispatch({ type: 'LOCK_DAY' })
    setStep('locked')
  }

  // ── Step 1: Energy ──────────────────────────────────────────────────────────
  if (step === 'energy') {
    return (
      <div style={s.energyScreen}>
        <div style={s.energyInner}>
          <p style={s.energySubtitle}>Good morning</p>
          <h1 style={s.energyHeading}>How are you<br />showing up today?</h1>

          <div style={s.emojiGrid}>
            {ENERGY_OPTIONS.map(opt => (
              <button
                key={opt.value}
                style={{
                  ...s.emojiBtn,
                  background:   localEnergy === opt.value ? 'var(--color-accent-bg)' : 'var(--color-card)',
                  border:       localEnergy === opt.value ? '0.5px solid var(--color-accent)' : 'var(--border)',
                }}
                onClick={() => setLocalEnergy(opt.value)}
              >
                <span style={s.emoji}>{opt.emoji}</span>
                <span style={{ ...s.emojiLabel, color: localEnergy === opt.value ? 'var(--color-accent)' : 'var(--color-muted)' }}>
                  {opt.label}
                </span>
              </button>
            ))}
          </div>

          <button
            style={{
              ...s.cta,
              opacity:       localEnergy ? 1 : 0.35,
              pointerEvents: localEnergy ? 'auto' : 'none',
            }}
            onClick={() => setStep('brief')}
          >
            See my brief →
          </button>
        </div>
      </div>
    )
  }

  // ── Step 2: Brief ───────────────────────────────────────────────────────────
  if (step === 'brief') {
    return (
      <div style={s.briefScreen}>
        {/* Header */}
        <div style={s.briefHeader}>
          <p style={s.briefDay}>{dayLabel}</p>
          <h1 style={s.briefDate}>{dateLabel}</h1>
        </div>

        {/* Progress bar */}
        <div style={s.progressTrack}>
          <div style={{ ...s.progressFill, width: `${progress * 100}%` }} />
        </div>
        <p style={s.progressLabel}>{confirmedCount} of {TOTAL_ITEMS} confirmed</p>

        {/* 3 Things */}
        <section style={s.section}>
          <p style={s.sectionLabel}>3 Things</p>
          <div style={s.stack}>
            {state.tasks.map(task => (
              <SwipeRow
                key={task.id}
                label={task.text}
                sublabel={task.dueTime}
                confirmed={localTasks.includes(task.id)}
                onConfirm={() => confirmTask(task.id)}
              />
            ))}
          </div>
        </section>

        {/* Training */}
        <section style={s.section}>
          <p style={s.sectionLabel}>Training</p>
          <SwipeRow
            label={state.workout.type}
            sublabel={`${state.workout.duration} · ${state.workout.pace} · ${state.workout.time}`}
            confirmed={localWorkout}
            onConfirm={() => setLocalWorkout(true)}
          />
        </section>

        {/* Meals */}
        <section style={s.section}>
          <p style={s.sectionLabel}>Meals</p>
          <div style={s.mealGrid}>
            {Object.entries(state.meals).map(([slot, meal]) => (
              <MealSlot
                key={slot}
                label={meal.label}
                startTime={meal.startTime}
                endTime={meal.endTime}
                confirmed={localMeals.includes(slot)}
                onConfirm={() => confirmMeal(slot)}
              />
            ))}
          </div>
        </section>

        {/* Lock button */}
        <div style={s.lockWrap}>
          <button
            style={{
              ...s.cta,
              opacity:       allConfirmed ? 1 : 0.35,
              pointerEvents: allConfirmed ? 'auto' : 'none',
            }}
            onClick={handleLockDay}
          >
            Lock in my day
          </button>
        </div>
      </div>
    )
  }

  // ── Step 3: Locked ──────────────────────────────────────────────────────────
  const lockedItems = [
    ...state.tasks.map(t => t.text),
    `${state.workout.type} — ${state.workout.duration}`,
    ...Object.values(state.meals).map(m => m.label),
  ]

  return (
    <div style={s.lockedScreen}>
      <div style={s.lockedInner}>
        <span style={s.lockedGlyph}>✦</span>
        <h1 style={s.lockedTitle}>Day locked in.</h1>
        <p style={s.lockedSub}>{dayLabel}, {dateLabel}</p>

        <div style={s.chipWrap}>
          {lockedItems.map((item, i) => (
            <span key={i} style={s.chip}>{item}</span>
          ))}
        </div>

        <button style={s.cta} onClick={onComplete}>
          Go to home →
        </button>
      </div>
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = {
  // Energy screen
  energyScreen: {
    minHeight:      '100dvh',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    padding:        'var(--space-6)',
    paddingTop:     'calc(var(--safe-top) + var(--space-12))',
    paddingBottom:  'calc(var(--safe-bottom) + var(--space-8))',
    background:     'var(--color-bg)',
  },
  energyInner: {
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    gap:            'var(--space-8)',
    width:          '100%',
    maxWidth:       '340px',
  },
  energySubtitle: {
    fontSize:      '13px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color:         'var(--color-muted)',
  },
  energyHeading: {
    fontFamily:  'var(--font-display)',
    fontSize:    '32px',
    lineHeight:  1.2,
    textAlign:   'center',
    color:       'var(--color-text)',
  },
  emojiGrid: {
    display:             'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap:                 'var(--space-3)',
    width:               '100%',
  },
  emojiBtn: {
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    gap:            'var(--space-2)',
    padding:        'var(--space-5) var(--space-4)',
    borderRadius:   'var(--radius-card)',
    cursor:         'pointer',
    transition:     'background 0.15s, border-color 0.15s',
  },
  emoji: {
    fontSize: '32px',
    lineHeight: 1,
  },
  emojiLabel: {
    fontSize:   '13px',
    fontWeight: 500,
    transition: 'color 0.15s',
  },

  // Brief screen
  briefScreen: {
    minHeight:     '100dvh',
    padding:       'var(--space-6)',
    paddingTop:    'calc(var(--safe-top) + var(--space-8))',
    paddingBottom: 'calc(var(--safe-bottom) + var(--space-12))',
    display:       'flex',
    flexDirection: 'column',
    gap:           'var(--space-6)',
    background:    'var(--color-bg)',
  },
  briefHeader: {
    display:       'flex',
    flexDirection: 'column',
    gap:           'var(--space-1)',
  },
  briefDay: {
    fontSize:      '12px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color:         'var(--color-muted)',
  },
  briefDate: {
    fontFamily: 'var(--font-display)',
    fontSize:   '28px',
    color:      'var(--color-text)',
  },
  progressTrack: {
    height:       '2px',
    background:   'var(--color-faint)',
    borderRadius: 'var(--radius-pill)',
    overflow:     'hidden',
  },
  progressFill: {
    height:       '100%',
    background:   'var(--color-success)',
    borderRadius: 'var(--radius-pill)',
    transition:   'width 0.4s var(--ease-out)',
  },
  progressLabel: {
    fontSize:   '11px',
    color:      'var(--color-muted)',
    marginTop:  '-12px',
    textAlign:  'right',
  },
  section: {
    display:       'flex',
    flexDirection: 'column',
    gap:           'var(--space-3)',
  },
  sectionLabel: {
    fontSize:      '11px',
    fontWeight:    600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color:         'var(--color-muted)',
  },
  stack: {
    display:       'flex',
    flexDirection: 'column',
    gap:           'var(--space-2)',
  },
  mealGrid: {
    display:             'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap:                 'var(--space-2)',
  },
  lockWrap: {
    paddingTop: 'var(--space-4)',
  },

  // Locked screen
  lockedScreen: {
    minHeight:      '100dvh',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    padding:        'var(--space-6)',
    paddingTop:     'calc(var(--safe-top) + var(--space-8))',
    paddingBottom:  'calc(var(--safe-bottom) + var(--space-8))',
    background:     'var(--color-bg)',
  },
  lockedInner: {
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    gap:            'var(--space-6)',
    width:          '100%',
    maxWidth:       '340px',
  },
  lockedGlyph: {
    fontSize:   '36px',
    color:      'var(--color-accent)',
    lineHeight: 1,
  },
  lockedTitle: {
    fontFamily:  'var(--font-display)',
    fontSize:    '36px',
    color:       'var(--color-text)',
    textAlign:   'center',
    marginTop:   '-16px',
  },
  lockedSub: {
    fontSize:    '13px',
    color:       'var(--color-muted)',
    marginTop:   '-16px',
  },
  chipWrap: {
    display:        'flex',
    flexWrap:       'wrap',
    gap:            'var(--space-2)',
    justifyContent: 'center',
  },
  chip: {
    display:       'inline-block',
    padding:       '6px 12px',
    borderRadius:  'var(--radius-pill)',
    background:    'var(--color-success-bg)',
    border:        '0.5px solid var(--color-success)',
    color:         'var(--color-success)',
    fontSize:      '13px',
    fontWeight:    500,
  },

  // Shared CTA button
  cta: {
    width:         '100%',
    padding:       '16px',
    borderRadius:  'var(--radius-card)',
    background:    'var(--color-accent)',
    color:         '#fff',
    fontSize:      '16px',
    fontWeight:    600,
    textAlign:     'center',
    cursor:        'pointer',
    border:        'none',
    transition:    'opacity 0.2s',
    letterSpacing: '0.01em',
  },
}
